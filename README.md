# Candid by Candace Labs

A privacy-focused browser extension that intelligently rewrites your email drafts using AI. Works with Gmail and Outlook 365, supports any OpenAI-compatible API (including local models), and processes everything locally in your browser.

Context-aware. BYOM (Bring Your Own Model). Fully local. No compliance headaches, no vendor lock-in, no expensive API bills. Run the cheapest inference possible, even CPU-only models on your laptop.

## Features

### Context-Aware Rewriting
- Automatically includes full email thread context when rewriting replies
- AI understands the conversation history for more relevant responses
- No manual copying/pasting - thread context is built into every reply/forward

### Privacy-First Design
- **BYOM (Bring Your Own Model)**: Use any OpenAI-compatible API endpoint
- Works with OpenAI, local models (Ollama, LM Studio), or self-hosted solutions
- Extension only reads compose box content when you explicitly trigger it
- No data collection, no tracking, no third-party services
- **Zero compliance issues**: Your emails never touch our servers because we don't have any
- **Cost control**: Use free CPU-only models or pay pennies per request with cheap APIs
- **No vendor lock-in**: Switch models anytime without losing data or changing workflow

### Cursor-Style Diff Interface
- Side-by-side comparison: Original vs. Revised
- Beautiful, modern UI with clear visual distinction
- Accept or reject changes before applying

<img width="901" height="467" alt="image" src="https://github.com/user-attachments/assets/19bd07aa-5fd1-43d2-bc91-cb875b919a6f" />


### Keyboard Shortcuts
- **`Cmd+Shift+R`** (Mac) / **`Ctrl+Shift+R`** (Windows/Linux): Trigger rewrite
- **`Cmd+Enter`** / **`Ctrl+Enter`**: Accept revision
- **`Esc`**: Reject revision
- Click backdrop to dismiss

### Fully Customizable
- Edit system prompt to match your communication style
- Pre-populated with smart defaults based on clear communication principles
- Adjust tone: casual, formal, concise, detailed, etc.

### Multi-Platform Support
- Gmail (mail.google.com)
- Outlook 365 (outlook.office.com)

## Installation

### Chrome/Edge/Brave

1. **Download the extension**
   ```bash
   git clone https://github.com/candace-labs/candid.git
   # or download and extract the ZIP
   ```

2. **Load in Chrome**
   - Open `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `candid` folder

3. **Configure your API**
   - Click the extension icon in your toolbar
   - Paste your API key (OpenAI, local model endpoint, etc.)
   - Customize the system prompt (optional)
   - Click "Save"

### Firefox

1. Open `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select any file from the extension directory
4. Configure API key via the extension popup

## Usage

### Basic Workflow

1. **Compose or reply to an email** in Gmail or Outlook 365
2. **Write your draft** (rough version is fine!)
3. **Trigger rewrite**:
   - Press `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows/Linux)
   - OR click the "Revise" button (bottom-right corner)
4. **Review the comparison** in the side-by-side diff modal
5. **Accept or reject**:
   - Press `Cmd+Enter` to accept
   - Press `Esc` to reject
   - Click the "Accept Revision" or "Reject" buttons

### Using Local Models

Candid works with any OpenAI-compatible API. Run models locally to avoid all costs and compliance concerns.

**Ollama** (localhost:11434) - CPU or GPU:
```bash
# Start Ollama with OpenAI compatibility
ollama serve

# Pull a small, fast model (runs on CPU!)
ollama pull phi3:mini  # 2.3GB, runs on any laptop

# Configure endpoint in extension:
# API Key: "ollama" (or any string)
# Modify background.js line 6:
# Change: 'https://api.openai.com/v1/chat/completions'
# To: 'http://localhost:11434/v1/chat/completions'
```

**LM Studio** (localhost:1234) - CPU or GPU:
```bash
# Start LM Studio server with OpenAI compatibility
# Load any GGUF model (many run fine on CPU)
# Modify background.js line 6:
# Change to: 'http://localhost:1234/v1/chat/completions'
```

**CPU-Only Models** (Zero GPU required):
- phi3:mini (2.3GB) - Fast, accurate, runs on any laptop
- llama3.2:1b (1.3GB) - Ultra-fast, good for basic rewrites
- qwen2.5:0.5b (0.5GB) - Smallest option, surprisingly capable

**Other Providers**:
- LocalAI, Jan, vLLM, or any OpenAI-compatible API
- Update the API endpoint in `background.js` line 6
- Use your API key in the settings popup

**Why Local Models?**
- **$0 per request**: No API costs ever
- **Complete privacy**: Emails never leave your machine
- **No rate limits**: Rewrite as many emails as you want
- **Works offline**: No internet required after model download
- **GDPR/HIPAA compliant by default**: Your data, your hardware

## Customization

### System Prompt

The extension includes a smart default prompt that:
- Uses active voice and direct language
- Removes corporate jargon
- Keeps sentences short and scannable
- Preserves original tone and intent
- Never adds new information

**To customize:**
1. Click the extension icon
2. Edit the "System Prompt" textarea
3. Click "Save"

**Example prompts:**

**Ultra-concise:**
```
Rewrite this email to be extremely brief while staying polite.
Maximum 3 sentences. Cut all fluff. Preserve key facts only.
Return only the rewritten email.
```

**Formal business:**
```
Rewrite this email in formal business English.
Use professional tone, proper grammar, structured paragraphs.
Maintain all technical details and action items.
Return only the rewritten email.
```

**Friendly casual:**
```
Rewrite this email in a friendly, conversational tone.
Keep it warm and approachable, use contractions, stay brief.
Preserve meaning and key points.
Return only the rewritten email.
```

### Keyboard Shortcuts

To change keyboard shortcuts:
1. Go to `chrome://extensions/shortcuts`
2. Find "Candid"
3. Click the edit icon
4. Set your preferred shortcut

## How It Works

### Architecture

```
┌─────────────────────────────────────────────────────┐
│  Gmail / Outlook 365 Web UI                         │
│  ┌──────────────────────────────────────┐          │
│  │  Compose Box (contenteditable div)   │          │
│  │  ├─ Your draft                        │          │
│  │  └─ Quoted thread (if replying)      │          │
│  └──────────────────────────────────────┘          │
│                    ▼                                 │
│  ┌──────────────────────────────────────┐          │
│  │  Content Script (content.js)         │          │
│  │  ├─ Injects "Revise ✨" button      │          │
│  │  ├─ Reads compose box content        │          │
│  │  └─ Shows diff modal                 │          │
│  └──────────────────────────────────────┘          │
└─────────────────────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────┐
│  Background Service Worker (background.js)          │
│  ├─ Receives: draft + thread context               │
│  ├─ Fetches: system prompt from storage            │
│  └─ Calls: OpenAI-compatible API                   │
└─────────────────────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────┐
│  OpenAI-Compatible API Endpoint                     │
│  ├─ OpenAI API (gpt-4.1-mini)                      │
│  ├─ Ollama (llama3, mistral, etc.)                 │
│  ├─ LM Studio (any local model)                    │
│  └─ Other providers (Anthropic, Groq, etc.)        │
└─────────────────────────────────────────────────────┘
```

### Context Awareness

When you reply to or forward an email, Gmail/Outlook automatically includes the previous messages in the compose box as quoted text. The extension reads this entire content, so the AI always has full conversation context without any special extraction logic.

### Privacy & Security

- **No external servers**: Extension code runs entirely in your browser
- **You control the API**: Choose OpenAI, local models, or self-hosted
- **Minimal permissions**: Only `storage` and `activeTab` - no background tabs access
- **No telemetry**: Zero tracking, analytics, or data collection
- **Open source**: Full code visibility for security audits

## Technical Details

### Files

```
candid/
├── manifest.json           # Extension configuration (Manifest V3)
├── content.js             # UI injection & compose box interaction
├── background.js          # API calls & message handling
├── popup.html             # Settings UI
├── popup.js               # Settings logic
└── README.md              # This file
```

### Browser Compatibility

- Chrome/Edge/Brave: Full support (Manifest V3)
- Firefox: Compatible (with minor adaptations)
- Safari: Requires conversion to Safari App Extension

### API Compatibility

Works with any service that implements the OpenAI `/v1/chat/completions` endpoint:
- OpenAI (GPT-4, GPT-3.5)
- Anthropic Claude (via API adapter)
- Local models via Ollama, LM Studio, LocalAI
- Self-hosted solutions (vLLM, TGI, etc.)
- Third-party providers (Groq, Together, Fireworks, etc.)

## Troubleshooting

### "No compose box found" error
- Make sure you've clicked inside a compose/reply window
- Try refreshing the page and reopening the compose window

### "No API key set" error
- Click the extension icon and paste your API key
- Ensure you clicked "Save" after entering the key

### Extension not appearing
- Verify the extension is enabled in `chrome://extensions/`
- Check that you're on `mail.google.com` or `outlook.office.com`
- Try refreshing the page

### Rewrites are poor quality
- Customize the system prompt to be more specific
- Try a different model (GPT-4 vs GPT-3.5, or local alternatives)
- Ensure your draft has enough detail for context

### Keyboard shortcut not working
- Check `chrome://extensions/shortcuts` to verify binding
- Some sites may capture certain key combinations
- Try clicking the "Revise ✨" button instead

## Roadmap

- [ ] Support for more email clients (ProtonMail, FastMail, etc.)
- [ ] Tone presets (formal, casual, concise, detailed)
- [ ] Multi-language support
- [ ] Draft history and undo
- [ ] Inline editing suggestions (Grammarly-style)
- [ ] Template library for common responses
- [ ] A/B testing: generate multiple variations

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Inspired by Cursor AI's diff interface
- Built for privacy-conscious users who want control over their AI tools
- Thanks to the open-source community for making local AI accessible

---

**Made for email productivity**

Star this repo if you find it useful.
