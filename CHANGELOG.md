[简体中文](CHANGELOG.md) | [English](CHANGELOG.en-US.md) 
# Changelog
## v1.1.2 (Current)
### Added
- 新增OCR支持使用GPU推理加速，使用```DirectML```，对windows平台具有通用性
### Changed
- 调整了OCR功能，取消了此前版本中的PaddleOCR-VL，改采用流水线OCR模式(使用```layout_det.onnx,text_det.onnx,text_rec.onnx```并辅以```ppocr_keys_v1.txt```字典)

## v1.1.1
### Added
- 新增 OCR 在线推理功能，用户可以在“设置-高级-OCR 图片识别”中，手动选择指定服务商和视觉模型用于OCR识别，且识别结果支持手动修正更改。
### Changed
- 调整了模型选择功能，从手动填入改变为可以获取模型列表，支持搜索模型名称，最近使用模型名称。

## v1.1.0
### Added
- 新增 OCR 功能，引入了 PaddleOCR，用户可以选择或拖拽图片进行识别。
- OCR 功能为可选功能，需在“设置-高级-OCR 图片识别引擎”中手动选择 zip 包进行导入。

## v1.0.18
### Fixed
- 修复了标题栏处 UI 显示覆盖、错位问题。

## Pre-1.0.17 (Legacy Versions)
### Added
- 新增附件文档上传功能（支持转为 markdown/txt 进行上传）。
- 新增用户自定义提示词功能，可固定提示词在每次对话时默认发送。
- 新增历史记录界面，支持查看对话具体调试信息。
- 新增渲染窗口独立放大功能。
- UI 样式与核心功能初始化构建。