# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WordSmith AI (智排精灵) is an Electron-based desktop application that converts AI-generated content into properly formatted Word documents through an "AI → HTML (Inline CSS) → Clipboard → Word" workflow.

## Common Commands

```bash
# Development
npm run dev          # Start development mode (runs cleanup + vite)
npm run start        # Alias for dev

# Build & Package
npm run build        # Full build: TypeScript compile + Vite build + electron-builder

# Code Quality
npm run lint         # ESLint on .ts and .tsx files
npm test             # Run Vitest tests once
npm run test:watch   # Run Vitest in watch mode
```

### Running Single Tests

Vitest supports filtering by test name or file path:

```bash
# Run tests in a specific file
npx vitest run src/renderer/lib/protocol-guard.test.ts

# Run tests matching a pattern
npx vitest run -t "should convert units"
```

### China Mirror Setup (if needed)

```bash
# Set npm registry
npm config set registry https://registry.npmmirror.com

# Install with Electron mirror (PowerShell)
$env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"; npm install

# Dev with mirror (PowerShell)
$env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"; npm run dev
```

## Architecture

### Electron Process Structure

- **Main Process** (`src/main/index.ts`): Window management, clipboard IPC handler
- **Preload Script** (`src/main/preload.ts`): Context bridge exposing `window.wordsmith.clipboard.write()`
- **Renderer Process** (`src/renderer/`): React SPA with HashRouter

### Core Data Flow

1. **ChatPanel** → User sends message to AI API (OpenAI-compatible)
2. **AI Response** → Returns HTML with inline CSS following the "排版协议" (Typesetting Protocol)
3. **Protocol Guard** (`src/renderer/lib/protocol-guard.ts`): Sanitizes HTML before preview/clipboard
   - Removes `<style>` tags and external stylesheets
   - Converts `px` units to `pt`
   - Enforces table attributes (`border-collapse`, borders)
   - Strips MathML (Word doesn't support it well)
   - Applies default typography (font family, size)
4. **PreviewFrame** → Renders sanitized HTML in sandboxed iframe
5. **CopyToWordButton** → Writes HTML + plain text to system clipboard via IPC
6. **User** → Pastes into Microsoft Word with formatting preserved

### State Management (Zustand)

- **`useAppStore`** (`src/renderer/store/useAppStore.ts`): Main application state with persistence
  - `settings`: Theme, AI config (baseUrl, apiKey, model), typography defaults, timeout, eye care mode
  - `presets`: User-defined prompt templates
  - `history`: Generated documents (limited to 50 items)
  - All state persisted to localStorage via `persist` middleware

### Key Constraints (排版协议)

The Protocol Guard enforces strict rules for Word compatibility:

- Only inline styles (`style="..."`), no `<style>` tags or external stylesheets
- All length units must be `pt` (converted automatically from `px`)
- Body base styles: `margin:0; padding:0; font-family:'SimSun';`
- Tables must have `border-collapse:collapse` and visible borders
- Math formulas should use `$...$` or `$$...$$` LaTeX syntax; MathML is removed

### Project Structure

```
src/
├── main/               # Electron main process
│   ├── index.ts       # Entry, window creation, clipboard IPC
│   └── preload.ts     # Context bridge
├── renderer/
│   ├── main.tsx       # React entry (HashRouter)
│   ├── App.tsx        # Root component with routes
│   ├── pages/         # Route pages: New, History, Templates, Settings, Help
│   ├── components/
│   │   ├── business/  # Domain components: ChatPanel, HtmlEditor, PreviewFrame, etc.
│   │   └── ui/        # Reusable UI primitives
│   ├── lib/           # Utilities: protocol-guard.ts, system-prompts.ts, templates/
│   ├── store/         # Zustand stores
│   └── types/         # TypeScript definitions
```

### Build Configuration

- **Vite** (`vite.config.ts`): Dev server at `127.0.0.1:5173`, electron-vite plugin for main/preload builds
- **TypeScript**: Strict mode with `noUnusedLocals` and `noUnusedParameters`
- **ESLint**: TypeScript + React Hooks rules
- **electron-builder** (`electron-builder.json5`): Packages for Windows (NSIS), Mac (DMG), Linux (AppImage)
- **Output**: `dist/` (renderer), `dist-electron/` (main), `release/` (packaged app)

### Important Technical Notes

- Uses ES Modules (`"type": "module"` in package.json)
- HashRouter is required (not BrowserRouter) for Electron file:// protocol compatibility
- Context isolation is enabled in Electron; all Node API access goes through preload script
- Monaco Editor is used for HTML editing with syntax highlighting via PrismJS
- Tailwind CSS v4 is used with PostCSS for styling
