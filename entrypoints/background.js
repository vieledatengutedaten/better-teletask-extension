export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== 'FETCH_SUBTITLE') return false;

    const { url, apiKey } = message;
    fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } })
      .then(async (response) => {
        const text = await response.text();
        if (!response.ok) {
          let error = `HTTP ${response.status}`;
          try {
            const json = JSON.parse(text);
            if (json.error) error = json.error;
          } catch {}
          sendResponse({ ok: false, error });
        } else {
          sendResponse({ ok: true, text });
        }
      })
      .catch((err) => sendResponse({ ok: false, error: err.message }));

    return true; // keep the message channel open for the async response
  });
});
