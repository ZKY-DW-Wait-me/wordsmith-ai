# CLAUDE.md
## Project Overview

WordSmith AI (智排精灵) is an Electron + React + TypeScript desktop application for AI-powered document formatting. It generates Word-compatible HTML through the pipeline: **AI → HTML (Inline CSS) → Clipboard → Word**.

## Commands

```bash
# Development (Windows - kills stale Electron processes first)
npm run dev

# Build for production (tsc → vite build → electron-builder)
npm run build

# Lint (zero warnings tolerance)
npm run lint

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run a single test file
npx vitest run src/renderer/lib/protocol-guard.test.ts

# Pack OCR engine into distributable zip (PowerShell)
powershell -ExecutionPolicy Bypass -File scripts/pack-ocr-engine.ps1
```

For China users, set Electron mirror before install/dev:
```powershell
$env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"; npm install
```

## Architecture

### Process Structure
- **Main process** (`src/main/index.ts`): Electron window management, IPC handlers for clipboard, OCR engine management, and window controls
- **Preload** (`src/main/preload.ts`): Exposes `window.wordsmith` API via `contextBridge` with three namespaces: `clipboard`, `ocr`, `window`
- **Renderer process** (`src/renderer/`): React 18 application with HashRouter routing

Security: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: false`.

### Routing
Routes in `App.tsx` using HashRouter. The New page (`/`) renders without `PageLayout` (has its own 3-column layout with per-column drag regions); all other pages (`/history`, `/settings`, `/help`) are wrapped in `PageLayout` which provides the Windows title bar safe zone (36px `h-9` drag region).

### State Management
Global state in `useAppStore` (Zustand, persisted as `wordsmith-storage` in localStorage):
- `settings` — AI config, typography defaults, templateId, timeout, eyeCareMode, ocrEnginePath
- `workspace` — Current editing session (htmlDraft, finalHtml, messages, guardReport, mode, streaming state)
- `history` — Saved conversations (max 50)
- `referenceFiles` — Uploaded reference documents (max 10, .txt/.md + OCR-extracted images)
- `customInstruction` — Persistent custom AI instructions

Other stores: `useI18nStore` (persisted, zh-CN/en-US), `useToastStore` (not persisted, max 5), `useLoggerStore` (persisted, max 1000 entries — defined inside `services/LoggerService.ts`, not in `store/`).

### AI Integration — Three-Layer Prompt Architecture
1. **Hidden protocol** (`hidden-protocol.ts`): `buildHiddenSystemPrompt()` injects invisible typography rules as system message. Contains `CORE_PROTOCOL_RULES` (6 rules in Chinese). Two modes: `generate` and `fix`.
2. **AI service** (`ai-service.ts`): OpenAI-compatible SSE streaming client. `streamChat()` is an async generator yielding string deltas. `buildInjectedMessages()` constructs: [system prompt, optional reference context, ...conversation messages].
3. **Protocol guard** (`protocol-guard.ts`): `guardHtml()` post-processes AI output before clipboard copy — removes `<style>` tags, converts px→pt (×0.75), enforces table formatting, applies body styles.

### OCR Engine — Separated Architecture
The OCR engine (Python + PaddlePaddle + models, ~2.5GB) is **not bundled** in the installer. Users import it via Settings → Advanced.

- **`src/main/ocr-provider.ts`**: `CpuOcrProvider` class manages OCR via an embedded Python sidecar. All paths derive from a single `enginePath` root (contains `python/`, `site-packages/`, `paddlex_home/`, `ocr_cli.py`).
- **Dev mode**: Constructor auto-detects `ocr_engine/` in project root if it contains both `python/python.exe` and `paddlex_home/official_models/`.
- **Production**: `enginePath` is restored from `settings.ocrEnginePath` (persisted in localStorage) via `App.tsx` useEffect on startup.
- **Import flow** (IPC `ocr:importEngineZip`): Extract zip → resolve engine root → validate 10 required models → move to `userData/ocr_engine/` → update provider.
- **Sentinel error**: When engine is not installed, `recognize()` returns `{ error: 'OCR_ENGINE_NOT_INSTALLED' }`, caught in `New.tsx` to show a toast guiding to Settings.
- **Pack script**: `scripts/pack-ocr-engine.ps1` creates `wordsmith-ocr-engine.zip` from `ocr_engine/` (excludes `.cache/`).

### Clipboard Strategy
Two-tier approach in `New.tsx`:
1. **Electron IPC** (preferred): `window.wordsmith.clipboard.write({ html, text })` → main process `clipboard.write()`
2. **Web API fallback**: `navigator.clipboard.write()` with `text/html` + `text/plain` MIME types

### Templates System
6 built-in templates in `src/renderer/lib/templates/` (default, academic, financial, government, resume, whitepaper). Each defines fontFamily, fontSizePt, lineHeight, paragraphSpacing, optional CSS, and optional systemPrompt. Templates affect both the AI system prompt and the guard layer's body styles.

### I18n
Two locales in `src/renderer/locales/`: `zh-CN` (default), `en-US`. Type-safe: `en-US` implements `LocaleResource` type exported from `zh-CN`. Managed by `useI18nStore`.

## Typography Protocol (Critical)

All generated HTML must follow these rules for Word paste compatibility:

1. **Inline styles only** — No `<style>` tags or external stylesheets
2. **Units must be `pt`** — No px/rem/em/%/vw/vh (Guard Layer auto-converts px→pt at 0.75 ratio)
3. **Body base style**: `margin:0; padding:0; font-family:'SimSun';`
4. **Tables**: `align="center"` with `width:440pt; border-collapse:collapse;`
5. **Math formulas**: Keep `$...$` or `$$...$$` as-is; remove MathML tags
6. **Forbidden tags**: No JavaScript, iframe, object, embed

The `guardHtml()` function in `protocol-guard.ts` enforces these rules before clipboard copy.

## Testing

Tests use Vitest with jsdom environment (`vitest.config.ts`). Test files follow `*.test.ts` pattern in `src/`.

## Platform Notes

- **Windows-centric**: The `cleanup` script uses `taskkill`, title bar uses Windows overlay controls (`titleBarOverlay` at 36px), `PageLayout` accounts for Windows caption button safe zone.
- **Styling**: Tailwind CSS v4 (via `@tailwindcss/postcss` plugin). Eye-care mode toggles green-tinted backgrounds via `html.eye-care` class in `index.css`. `cn()` utility in `lib/cn.ts` is a simple falsy-filter joiner (not `clsx` or `tailwind-merge`).
- **No dark mode**: Only light mode and optional eye-care mode.
- **Default AI provider**: DeepSeek (`https://api.deepseek.com`, model `deepseek-chat`). Settings page has 7 pre-configured providers.
