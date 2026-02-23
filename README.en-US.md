 [简体中文](README.md) | [English](README.en-US.md)
# WordSmith AI (Smart Formatting Wizard)
> A Word formatting tool based on HTML

---

## 📱 User Guide

### 🎯 Program Introduction
WordSmith AI is a convenient formatting tool that leverages HTML format and strict prompt constraints to interact with AI for article paragraph formatting, which can then be copied and pasted back into Word. It also supports rendering mathematical and physical formulas. The tool allows AI to directly generate articles, format content by imitating existing paragraphs from Word documents, and clean HTML content copied from web pages to precisely comply with Word's formatting capabilities. The **latest version** now supports OCR functionality. Users can directly upload or drag-and-drop images for text and formula recognition.

### 📥 Installation Instructions
1. Download the **latest** version of the `.exe` file (Current latest version: **v1.1.0**).
2. **Note**: For the OCR feature, manually select and import the zip package in "Settings > Advanced > OCR Image Recognition Engine".

---

## 🛠️ Developer Guide

### Tech Stack
Electron 30 + React 18 + TypeScript + Tailwind CSS v4 + Zustand + Vite

### Environment Setup

```bash
# 1. Install dependencies (add mirror for slow Electron downloads in China)
$env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"; npm install

# 2. Start development
npm run dev

# 3. Package the application
npm run build
```

### Formatting Protocol

Core Constraints — Ensure HTML pasted into Word has correct formatting:
- Inline styles only, `<style>` tags are prohibited
- Units must be `pt` (Guard Layer automatically converts px→pt by ×0.75)
- Tables use `align="center"` and `width:440pt; border-collapse:collapse;`
- Mathematical formulas retain `$...$` / `$$...$$` as-is, MathML is removed

### OCR Engine
Not included in the installation package (≈ 2.5GB). Users import the zip via "Settings → Advanced". During development, place the `ocr_engine/` directory in the project root for automatic detection.

Package OCR engine to zip: `powershell -ExecutionPolicy Bypass -File scripts/pack-ocr-engine.ps1`

## 📄 Open Source License (License)
This project is licensed under the [GPL v3 License](LICENSE).