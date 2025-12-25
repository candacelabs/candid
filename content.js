// Content script: finds compose box, injects UI, sends text to background.

function isGmail() {
  return location.hostname === 'mail.google.com';
}

function isOutlook() {
  return location.hostname === 'outlook.office.com';
}

function findComposeBox() {
  // Gmail compose body is typically: div[role=textbox][contenteditable=true]
  // Outlook web compose body varies; aria-label can be "Message body".
  const candidates = [
    'div[role="textbox"][contenteditable="true"]',
    'div[contenteditable="true"][aria-label="Message body"]',
    'div[contenteditable="true"][role="textbox"]'
  ];

  for (const sel of candidates) {
    const el = document.querySelector(sel);
    if (el && el.isContentEditable) return el;
  }
  return null;
}

function ensureButton() {
  if (document.getElementById('email-rewriter-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'email-rewriter-btn';
  btn.textContent = 'Revise ✨';
  btn.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 2147483647;
    padding: 10px 14px;
    border-radius: 999px;
    border: 1px solid rgba(0,0,0,0.15);
    background: white;
    color: #111;
    box-shadow: 0 6px 18px rgba(0,0,0,0.12);
    font: 600 13px system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    cursor: pointer;
  `;

  const status = document.createElement('div');
  status.id = 'email-rewriter-status';
  status.style.cssText = `
    position: fixed;
    bottom: 62px;
    right: 20px;
    z-index: 2147483647;
    max-width: 340px;
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid rgba(0,0,0,0.15);
    background: white;
    color: #111;
    box-shadow: 0 6px 18px rgba(0,0,0,0.12);
    font: 12px system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    display: none;
    white-space: pre-wrap;
  `;

  function setStatus(text, show = true) {
    status.textContent = text;
    status.style.display = show ? 'block' : 'none';
  }

  function setLoading(isLoading) {
    btn.disabled = isLoading;
    btn.style.opacity = isLoading ? '0.7' : '1';
    btn.textContent = isLoading ? 'Revising…' : 'Revise ✨';
  }

  function showDiffModal(originalText, revisedText, onAccept, onReject) {
    // Remove existing modal if any
    const existing = document.getElementById('email-rewriter-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'email-rewriter-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 2147483647;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: white;
      border-radius: 12px;
      max-width: 900px;
      width: 100%;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      padding: 20px;
      border-bottom: 1px solid #e5e7eb;
      font: 600 16px system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      color: #111;
    `;
    header.textContent = 'Review Revision';

    const diffContainer = document.createElement('div');
    diffContainer.style.cssText = `
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1px;
      background: #e5e7eb;
      flex: 1;
      overflow: hidden;
    `;

    const originalPane = document.createElement('div');
    originalPane.style.cssText = `
      background: #fff;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    `;
    const originalLabel = document.createElement('div');
    originalLabel.style.cssText = `
      padding: 12px 16px;
      font: 600 12px system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: #f9fafb;
    `;
    originalLabel.textContent = 'Original Text';
    const originalTextEl = document.createElement('div');
    originalTextEl.style.cssText = `
      padding: 16px;
      font: 14px/1.6 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      color: #374151;
      overflow-y: auto;
      flex: 1;
      white-space: pre-wrap;
    `;
    originalTextEl.textContent = originalText;
    originalPane.appendChild(originalLabel);
    originalPane.appendChild(originalTextEl);

    const revisedPane = document.createElement('div');
    revisedPane.style.cssText = `
      background: #f0fdf4;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    `;
    const revisedLabel = document.createElement('div');
    revisedLabel.style.cssText = `
      padding: 12px 16px;
      font: 600 12px system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      color: #059669;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: #dcfce7;
    `;
    revisedLabel.textContent = 'Revised Text';
    const revisedTextEl = document.createElement('div');
    revisedTextEl.style.cssText = `
      padding: 16px;
      font: 14px/1.6 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      color: #065f46;
      overflow-y: auto;
      flex: 1;
      white-space: pre-wrap;
    `;
    revisedTextEl.textContent = revisedText;
    revisedPane.appendChild(revisedLabel);
    revisedPane.appendChild(revisedTextEl);

    diffContainer.appendChild(originalPane);
    diffContainer.appendChild(revisedPane);

    const footer = document.createElement('div');
    footer.style.cssText = `
      padding: 16px 20px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    `;

    const hint = document.createElement('div');
    hint.style.cssText = `
      font: 12px system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      color: #6b7280;
    `;
    hint.innerHTML = '<kbd style="padding: 2px 6px; background: #f3f4f6; border-radius: 4px; font-family: monospace;">⌘ Enter</kbd> to accept &nbsp;•&nbsp; <kbd style="padding: 2px 6px; background: #f3f4f6; border-radius: 4px; font-family: monospace;">Esc</kbd> to reject';

    const buttons = document.createElement('div');
    buttons.style.cssText = `
      display: flex;
      gap: 8px;
    `;

    const rejectBtn = document.createElement('button');
    rejectBtn.textContent = 'Reject';
    rejectBtn.style.cssText = `
      padding: 8px 16px;
      border-radius: 6px;
      border: 1px solid #d1d5db;
      background: white;
      color: #374151;
      font: 600 13px system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      cursor: pointer;
    `;
    rejectBtn.onmouseover = () => { rejectBtn.style.background = '#f9fafb'; };
    rejectBtn.onmouseout = () => { rejectBtn.style.background = 'white'; };
    rejectBtn.onclick = () => {
      modal.remove();
      onReject();
    };

    const acceptBtn = document.createElement('button');
    acceptBtn.textContent = 'Accept Revision';
    acceptBtn.style.cssText = `
      padding: 8px 16px;
      border-radius: 6px;
      border: none;
      background: #059669;
      color: white;
      font: 600 13px system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      cursor: pointer;
    `;
    acceptBtn.onmouseover = () => { acceptBtn.style.background = '#047857'; };
    acceptBtn.onmouseout = () => { acceptBtn.style.background = '#059669'; };
    acceptBtn.onclick = () => {
      modal.remove();
      onAccept();
    };

    buttons.appendChild(rejectBtn);
    buttons.appendChild(acceptBtn);

    footer.appendChild(hint);
    footer.appendChild(buttons);

    content.appendChild(header);
    content.appendChild(diffContainer);
    content.appendChild(footer);
    modal.appendChild(content);

    // Keyboard shortcuts
    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        modal.remove();
        onReject();
        document.removeEventListener('keydown', handleKeydown);
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        modal.remove();
        onAccept();
        document.removeEventListener('keydown', handleKeydown);
      }
    };
    document.addEventListener('keydown', handleKeydown);

    // Close on backdrop click
    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.remove();
        onReject();
        document.removeEventListener('keydown', handleKeydown);
      }
    };

    document.body.appendChild(modal);
  }

  async function triggerRewrite() {
    const box = findComposeBox();
    if (!box) {
      setStatus('No compose box found. Open a draft / compose window first.');
      return;
    }

    // Get full compose box content (includes draft + quoted thread if replying)
    const text = (box.innerText || '').trim();
    if (!text) {
      setStatus('Compose body is empty. Type something first.');
      return;
    }

    setLoading(true);
    setStatus('Sending to model…', true);

    // Get custom system prompt from storage
    chrome.storage.local.get(['systemPrompt'], (storage) => {
      const instruction = storage.systemPrompt || 'Rewrite the email to be clearer and more concise, while keeping my vibe. Preserve meaning. Do not add new facts. Avoid corporate filler. Return ONLY the rewritten email body.';

      chrome.runtime.sendMessage(
        {
          type: 'REWRITE',
          text,
          instruction
        },
        (res) => {
          setLoading(false);

          if (!res || !res.ok) {
            setStatus(`Error: ${res?.error || 'Unknown error'}`);
            return;
          }

          const revised = res.revised;
          setStatus('', false);

          showDiffModal(
            text,
            revised,
            () => {
              // Accept
              box.innerText = revised;
              setStatus('✓ Revision accepted. (Undo: Cmd+Z / Ctrl+Z)');
              setTimeout(() => setStatus('', false), 3000);
            },
            () => {
              // Reject
              setStatus('Revision rejected. Your draft was not changed.');
              setTimeout(() => setStatus('', false), 3000);
            }
          );
        }
      );
    });
  }

  btn.onclick = triggerRewrite;

  document.body.appendChild(btn);
  document.body.appendChild(status);
}

// Gmail/Outlook are SPAs; DOM loads after navigation. Keep it simple: poll.
const interval = setInterval(() => {
  // Only inject on supported sites.
  if (!isGmail() && !isOutlook()) return;
  ensureButton();
}, 1000);

// Safety: stop after a while to avoid infinite polling if user leaves the page.
setTimeout(() => clearInterval(interval), 10 * 60 * 1000);

// Listen for keyboard shortcut trigger from background script
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'TRIGGER_REWRITE') {
    // Find the button and trigger it
    const btn = document.getElementById('email-rewriter-btn');
    if (btn) {
      btn.click();
    }
  }
});
