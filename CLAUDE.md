# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WordSmith AI (智排精灵) is an Electron + React + TypeScript desktop application for AI-powered document formatting. It generates Word-compatible HTML through the pipeline: **AI → HTML (Inline CSS) → Clipboard → Word**.

## Commands

```bash
# Development (Windows - kills stale Electron processes first)
npm run dev

# Build for production (Windows)
npm run build

# Lint
npm run lint

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

For China users, set Electron mirror before install/dev:
```powershell
$env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"; npm install
```

## Architecture

### Process Structure
- **Main process** (`src/main/`): Electron window management, IPC handlers, preload bridge
- **Renderer process** (`src/renderer/`): React application

### Key Directories
- `src/renderer/pages/` - Route pages: New (editor), History, Settings, Help
- `src/renderer/components/business/` - Feature components: ChatPanel, HtmlEditor, PreviewFrame, CopyToWordButton
- `src/renderer/components/ui/` - Reusable UI primitives
- `src/renderer/store/` - Zustand stores (useAppStore for main state, useI18nStore, useToastStore)
- `src/renderer/services/` - AI service, settings persistence, error handling
- `src/renderer/lib/` - Utilities including protocol-guard and system-prompts

### State Management
Global state in `useAppStore` (Zustand with persistence):
- `settings` - AI config, typography defaults, app preferences
- `workspace` - Current editing session (HTML draft, messages, mode)
- `history` - Saved conversations (max 50)
- `referenceFiles` - Uploaded reference documents

### AI Integration
- `ai-service.ts` - OpenAI-compatible streaming API client
- `system-prompts.ts` - Builds system prompts with typography rules
- `protocol-guard.ts` - Sanitizes HTML output for Word compatibility

## Typography Protocol (Critical)

All generated HTML must follow these rules for Word paste compatibility:

1. **Inline styles only** - No `<style>` tags or external stylesheets
2. **Units must be `pt`** - No px/rem/em/%/vw/vh (Guard Layer auto-converts px→pt)
3. **Body base style**: `margin:0; padding:0; font-family:'SimSun';`
4. **Tables**: `align="center"` with `width:440pt; border-collapse:collapse;`
5. **Math formulas**: Keep `$...$` or `$$...$$` as-is; remove MathML tags

The `guardHtml()` function in `protocol-guard.ts` enforces these rules before clipboard copy.

## Testing

Tests use Vitest with jsdom environment. Test files follow `*.test.ts` pattern in `src/`.

Run a single test file:
```bash
npx vitest run src/renderer/lib/protocol-guard.test.ts
```
