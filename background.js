// Background service worker: calls the model API.
// This version uses OpenAI-style /v1/chat/completions.

async function rewriteWithOpenAIStyle({ apiKey, text, instruction }) {
  // Text already includes thread context if replying/forwarding
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content:
            instruction ||
            'Rewrite the email to be clearer, concise, and professional. Preserve intent. Keep it human. Do not add new facts.'
        },
        { role: 'user', content: text }
      ]
    })
  });

  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error?.message || JSON.stringify(data);
    throw new Error(msg);
  }
  return data.choices?.[0]?.message?.content?.trim();
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type !== 'REWRITE') return;

  (async () => {
    const { modelApiKey } = await chrome.storage.local.get('modelApiKey');
    if (!modelApiKey) {
      sendResponse({ ok: false, error: 'No API key set. Click the extension icon and save it.' });
      return;
    }

    const text = (msg.text || '').trim();
    if (!text) {
      sendResponse({ ok: false, error: 'Compose box is empty.' });
      return;
    }

    try {
      const revised = await rewriteWithOpenAIStyle({
        apiKey: modelApiKey,
        text,
        instruction: msg.instruction
      });

      if (!revised) {
        sendResponse({ ok: false, error: 'Model returned empty response.' });
        return;
      }

      sendResponse({ ok: true, revised });
    } catch (e) {
      sendResponse({ ok: false, error: String(e?.message || e) });
    }
  })();

  return true; // async response
});

// Listen for keyboard command (Cmd+Shift+R)
chrome.commands.onCommand.addListener((command) => {
  if (command === 'trigger-rewrite') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'TRIGGER_REWRITE' });
      }
    });
  }
});
