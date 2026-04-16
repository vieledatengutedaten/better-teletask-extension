import { safeJsonParse, waitForElement } from '../utils/playerConfig.js';

export default defineContentScript({
  matches: ['https://www.tele-task.de/lecture/video/*'],
  async main() {
    const { featureSettings } = await browser.storage.local.get('featureSettings');
    if (!featureSettings?.simpleplayer) return;

    const playerEl = await waitForElement('#player');
    if (!playerEl) {
      console.warn('[btt-simpleplayer] #player not found');
      return;
    }

    const config = safeJsonParse(playerEl.getAttribute('configuration'));
    const streams = config?.streams;
    if (!Array.isArray(streams) || streams.length === 0) {
      console.warn('[btt-simpleplayer] no streams in configuration', config);
      return;
    }

    const streamUrls = streams.map(s => s?.hd || s?.sd).filter(Boolean);
    if (streamUrls.length === 0) {
      console.warn('[btt-simpleplayer] no usable mp4 URLs in streams', streams);
      return;
    }

    let subtitleBlobUrl = null;
    if (featureSettings?.subtitles) {
      subtitleBlobUrl = await fetchSubtitleBlobUrl();
    }

    const container = buildPlayer(streamUrls, subtitleBlobUrl, featureSettings);

    const vp = document.querySelector('video-player') || playerEl;
    vp.replaceWith(container);

    console.info('[btt-simpleplayer] replaced video-player with', streamUrls.length, 'native stream(s)');
  },
});

async function fetchSubtitleBlobUrl() {
  const { apiKey } = await browser.storage.local.get('apiKey');
  if (!apiKey) return null;
  const segments = window.location.pathname.split('/').filter(Boolean);
  const last = encodeURIComponent(decodeURIComponent(segments[segments.length - 1] || 'index'));
  const url = `https://btt.makeruniverse.de/sub/${last}/`;
  const result = await browser.runtime.sendMessage({ type: 'FETCH_SUBTITLE', url, apiKey });
  if (!result?.ok) {
    console.warn('[btt-simpleplayer] subtitle fetch failed:', result?.error);
    return null;
  }
  return URL.createObjectURL(new Blob([result.text], { type: 'text/vtt' }));
}

function buildPlayer(streamUrls, subtitleBlobUrl, featureSettings) {
  const container = document.createElement('div');
  container.id = 'btt-simpleplayer';
  container.style.cssText = `
    display: flex; flex-wrap: wrap; width: 100%; background: #000;
    gap: 2px; position: relative; max-width: 100%;
  `;

  const videos = streamUrls.map((url, i) => {
    const v = document.createElement('video');
    v.src = url;
    v.preload = 'auto';
    v.style.cssText = 'flex: 1 1 calc(50% - 1px); min-width: 0; max-width: 100%; background: #000;';
    if (i === 0) {
      v.controls = true;
      if (subtitleBlobUrl) {
        const track = document.createElement('track');
        track.kind = 'subtitles';
        track.srclang = 'en';
        track.label = 'Subtitles';
        track.src = subtitleBlobUrl;
        track.default = true;
        v.appendChild(track);
      }
    } else {
      v.muted = true;
      v.tabIndex = -1;
    }
    container.appendChild(v);
    return v;
  });

  syncVideos(videos);

  if (featureSettings?.kplay) attachKeybinds(videos[0]);

  return container;
}

function syncVideos([master, ...slaves]) {
  if (slaves.length === 0) return;

  const resync = () => {
    for (const s of slaves) {
      if (Math.abs(s.currentTime - master.currentTime) > 0.3) s.currentTime = master.currentTime;
      if (s.playbackRate !== master.playbackRate) s.playbackRate = master.playbackRate;
      if (master.paused && !s.paused) s.pause();
      else if (!master.paused && s.paused) s.play().catch(() => {});
    }
  };

  master.addEventListener('play', resync);
  master.addEventListener('pause', resync);
  master.addEventListener('seeking', resync);
  master.addEventListener('seeked', resync);
  master.addEventListener('ratechange', resync);
  master.addEventListener('waiting', () => { for (const s of slaves) s.pause(); });
  master.addEventListener('playing', resync);
  setInterval(resync, 1000);
}

function attachKeybinds(master) {
  document.addEventListener('keydown', (e) => {
    if (e.target.matches?.('input, textarea, [contenteditable]')) return;
    if (e.key.toLowerCase() === 'k') {
      e.preventDefault();
      master.paused ? master.play().catch(() => {}) : master.pause();
    }
  });
  if ('mediaSession' in navigator) {
    try {
      navigator.mediaSession.setActionHandler('play', () => master.play().catch(() => {}));
      navigator.mediaSession.setActionHandler('pause', () => master.pause());
    } catch {}
  }
}
