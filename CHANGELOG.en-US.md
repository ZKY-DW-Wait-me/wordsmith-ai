[简体中文](CHANGELOG.md) | [English](CHANGELOG.en-US.md)
# Changelog

> **Version Numbering**: Release versions use `vX.Y.Z`, beta branches use `vX.Y.Z-<feature>.N` to distinguish feature lines. Merged to main as the next release version.

## v1.1.4-latex.2 (beta/latex-editor)
### Added
- Added AI Formula Assistant: collapsible left panel with streaming chat to generate LaTeX formulas, specialized system prompt restricting output to formulas only
- Added formula extraction + insert buttons: regex extracts formulas from AI responses (`$$...$$`, `$...$`, code blocks), one-click insert to input
- Added hover highlight: hovering insert button highlights corresponding formula in AI message (violet background)
- Added auto-insert toggle: when enabled, automatically inserts first formula after streaming completes
- Added context count slider (0-20): controls how many historical message pairs to send to AI, default 10
- Added staircase dual-panel layout: AI assistant and history can open simultaneously (AI left + history right), adaptive width not exceeding screen midpoint
### Changed
- Moved history panel from right to left side, both panel buttons unified on left column header
- Improved formula extraction: `\begin{aligned}` and similar multi-line environments split by `\\` into individual formulas (≤10 lines split, >10 lines kept as whole block to prevent over-splitting)
- History auto-records on successful render (no manual action needed)

## v1.1.4-latex.1 (beta/latex-editor)
### Added
- Added LaTeX formula editor page (sidebar Σ entry) with real-time KaTeX preview and 8 example formulas
- Added LaTeX → UnicodeMath converter covering: fractions, superscripts/subscripts, Greek letters, roots, matrices (`\matrix()` format), piecewise functions (`\cases` → `{█(...)┤`), `\dot`/`\ddot` modifiers, `\mathbf` and other math fonts, large operator protection in fractions
- Added high-DPI image export: 4x super-sampling DOM rendering + white-to-transparent conversion + getImageData smart crop + PNG pHYs DPI metadata injection (~524 DPI, matching Word 11pt font size)
- Added Edge-style history panel (slides in from right, Zustand persisted, max 100 entries, auto-deduplication)
- Added `captureAreaAsDataUrl` IPC channel (captures area as data URL for renderer-side post-processing)
- Added 25 UnicodeMath conversion unit tests
### Changed
- Switched image export from SVG foreignObject to Electron captureArea + Canvas post-processing, fixing KaTeX font loading failure in Blob URL context

## v1.1.4-context.1 (beta/smart-context)
### Added
- Added context round slider (0=unlimited, max 20 rounds) to control the number of historical conversation rounds sent to AI, reducing token consumption
- Added per-round checkbox: each completed round displays a toggle control for manual include/exclude, overriding default window rules
- Added pinned history rounds: select conversation rounds from history as cross-session context snapshots, stored independently from history records
- Added pinned rounds dialog: left panel with history list + search, right panel with round preview + per-round pin controls
- Added regenerate button: click to regenerate the last AI reply
- Added continue generation button: auto-detected when AI output is interrupted, appends content to existing reply (no new bubble)
- Added context filter engine `context-filter.ts` with 14 unit tests
### Fixed
- Fixed chat panel input box being clipped at window bottom (`h-full` → `flex-1 min-h-0`)
- Fixed left sidebar new sections crowding custom instruction and reference document space

## v1.1.4-updater.1 (beta/updater)
### Added
- Added version update detection: automatically checks remote API on startup, prompts user when a new version is available
- Added update modal with three actions: "Go to Download", "Remind Me Later", and "Skip This Version"
- Added OCR architecture change warning: when remote `ocrchange` is `1`, shows extra warning that OCR engine packs need to be re-imported after update
- Added red dot indicator on sidebar settings icon, disappears after user takes action (later/skip)
- Added "About & Updates" card in Settings "General" tab: current version, update details, manual "Check for Updates" button
- Added `window:openExternal` IPC channel to open download links in system default browser
- Added anti-annoyance mechanism: "Remind Later" suppresses popup for 3 days, "Skip Version" permanently skips same version, persisted in localStorage
- Injected `__APP_VERSION__` via Vite `define` for runtime version comparison
### Fixed
- User data (settings, history) and OCR engine are automatically preserved during overlay installation

## v1.1.3 (Current)
### Added
- Added table structure enhancement: integrated RT-DETR-L wired/wireless table cell detection models (`table_wired_det.onnx` + `table_wireless_det.onnx`), 3-level fallback chain (model detection → morphological grid → coordinate clustering), significantly improved complex table reconstruction
- Added OCR post-processing enhancements: math symbol regex corrector (`sn→sin`, `coS→cos`, `tg→tan`, etc.), formula region 2D spatial reconstruction (block merging + OpenCV visual fraction bar detection + `\frac` output), OpenCV morphological table grid extraction
- Added multi-page PDF support: renders PDF pages to PNG via PyMuPDF and OCR-processes them, with merged results added to reference files (max 50 pages)
- Added table detection model conversion script `scripts/convert_table_det.py` (supports PIR format)
### Changed
- Removed deprecated `FormulaRecognizer` class (~130 lines) and cleaned up related references (all formula recognition models use autoregressive architecture, incompatible with DirectML)
- Accelerated zip extraction: prioritizes native Windows `tar.exe` over pure JS `extract-zip`, several times faster
- Updated OCR technical documentation with comprehensive formula recognition model research conclusions

## v1.1.2
### Added
- Added OCR support for GPU inference acceleration using ```DirectML```, with universal compatibility for the Windows platform.
### Changed
- Adjusted OCR functionality, removed the PaddleOCR-VL from previous versions, and adopted a pipeline OCR mode (using ```layout_det.onnx, text_det.onnx, text_rec.onnx``` supplemented with the ```ppocr_keys_v1.txt``` dictionary)

## v1.1.1
### Added
- Added online OCR inference function. Users can manually select a specified service provider and vision model for OCR recognition in "Settings - Advanced - OCR Image Recognition", and the recognition results support manual modification.
### Changed
- Adjusted the model selection function: changed from manual input to obtaining a model list, supporting searching by model name and recently used model names.

## v1.1.0
### Added
- Added OCR functionality with the integration of PaddleOCR, allowing users to select or drag-and-drop images for recognition.
- The OCR feature is optional and requires manual selection and import of the zip package in "Settings > Advanced > OCR Image Recognition Engine".

## v1.0.18
### Fixed
- Fixed the issue of UI overlay and misalignment in the title bar.

## Pre-1.0.17 (Legacy Versions)
### Added
- Added the attachment document upload feature (supports conversion to markdown/txt for upload).
- Added the user-defined prompt feature, enabling prompts to be fixed and sent by default in each conversation.
- Added the history record interface to support viewing detailed debugging information of conversations.
- Added the independent zoom-in function for the rendering window.
- Initial construction of UI styles and core functions.