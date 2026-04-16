function decodeHtmlEntities(str) {
  if (!str || typeof str !== 'string') return str;
  const txt = document.createElement('textarea');
  txt.textContent = str;
  return txt.value;
}

export function safeJsonParse(str) {
  if (typeof str !== 'string') return null;
  let s = str.trim();
  s = decodeHtmlEntities(s);
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1);
  }
  const attempts = [s, s.replace(/&quot;/g, '"'), s.replace(/&amp;/g, '&'), s.replace(/\\"/g, '"')];
  for (const attempt of attempts) {
    try { return JSON.parse(attempt); } catch {}
  }
  return null;
}

export function waitForElement(selector, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const existing = document.querySelector(selector);
    if (existing) return resolve(existing);
    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) { observer.disconnect(); resolve(el); }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => { observer.disconnect(); resolve(null); }, timeoutMs);
  });
}
