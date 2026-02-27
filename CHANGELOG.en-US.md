[简体中文](CHANGELOG.md) | [English](CHANGELOG.en-US.md) 
# Changelog
## v1.1.1 (Current)
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