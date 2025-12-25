const keyEl = document.getElementById('key');
const promptEl = document.getElementById('prompt');
const okEl = document.getElementById('ok');
const errEl = document.getElementById('err');

// Default prompt based on clear communication principles
const DEFAULT_PROMPT = `Rewrite this email to be clear, concise, and professional while preserving the sender's voice and intent.

Guidelines:
- Use active voice and direct language
- Remove unnecessary words and corporate jargon
- Keep sentences short and scannable
- Maintain the original tone (casual stays casual, formal stays formal)
- Preserve all key facts and action items
- Do not add new information or change meaning
- Return ONLY the rewritten email body, no meta-commentary`;

(async function init() {
  const { modelApiKey, systemPrompt } = await chrome.storage.local.get(['modelApiKey', 'systemPrompt']);
  if (modelApiKey) keyEl.value = modelApiKey;
  promptEl.value = systemPrompt || DEFAULT_PROMPT;
})();

function showOk() {
  errEl.style.display = 'none';
  okEl.style.display = 'block';
  setTimeout(() => window.close(), 450);
}

function showErr(msg) {
  okEl.style.display = 'none';
  errEl.textContent = msg;
  errEl.style.display = 'block';
}

document.getElementById('save').onclick = async () => {
  const key = keyEl.value.trim();
  if (!key) return showErr('Paste an API key first.');

  const prompt = promptEl.value.trim();
  if (!prompt) return showErr('System prompt cannot be empty.');

  await chrome.storage.local.set({
    modelApiKey: key,
    systemPrompt: prompt
  });
  showOk();
};
