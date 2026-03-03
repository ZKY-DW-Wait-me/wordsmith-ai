 [简体中文](README.md) | [English](README.en-US.md)
 ## 📄 Open Source License  
This project is open-sourced under the [GPL v3](LICENSE) license.  

# WordSmith AI (Smart Formatting Wizard)
> A Word formatting tool based on HTML

---

## 📱 User Guide

### 🎯 Program Introduction
WordSmith AI is a convenient formatting tool that leverages HTML format and strict prompt constraints to interact with AI for article paragraph formatting, which can then be copied and pasted back into Word. It also supports rendering mathematical and physical formulas. The tool allows AI to directly generate articles, format content by imitating existing paragraphs from Word documents, and clean HTML content copied from web pages to precisely comply with Word's formatting capabilities. The **latest version** now supports OCR functionality.You can choose between **local inference** and **cloud inference** modes, and the recognition results support manual secondary correction. Users can directly upload or drag-and-drop images for text and formula recognition.

### 📥 Installation Instructions
1. Download the latest version of the .exe file (Current latest: v1.1.1).
2. **Note**: For the OCR function, you need to manually select and import a zip package or fill in the API key of the corresponding service provider in "Settings - Advanced - OCR Image Recognition", and perform recognition by selecting the corresponding vision model.

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
>   

⚖️ License & Copyright  
The copyright of this project (including but not limited to source code, documentation, resource files, etc.) is owned by the original author (myself).  

License Terms:  

1. **Unified Authorization**: All historical versions, branches, and subsequent updates of this project, starting from the first commit (Initial Commit), are now uniformly authorized under the GNU General Public License v3.0 (GPLv3).  

2. **Retroactive Effect Declaration**: Regardless of whether you obtained the source code before or after the addition of the LICENSE file to this project, any distribution, modification, or use of this project's code must strictly comply with all terms of the GPLv3 license.  

3. **Closed-Source Restriction**: No individual or organization is permitted to use this project's code for commercial closed-source software, package it into .exe or other binary forms for distribution, without fulfilling the obligations of the GPLv3 (such as open-sourcing the derivative project's source code).  

4. **Infringement Action**: Any violation of the GPLv3 license shall be deemed as direct infringement of copyright. I reserve the right to pursue legal action (including but not limited to submitting DMCA/takedown requests to hosting platforms, filing judicial lawsuits, etc.) against infringers.  

Notice: If you wish to use this project's code without complying with the GPLv3 license (e.g., keeping it closed-source), you must contact the author to obtain a separate commercial license.

## 📫 联系我 (Contact)
If you have any suggestions or need a commercial license, feel free to contact us via email: zkydw.dev@outlook.com