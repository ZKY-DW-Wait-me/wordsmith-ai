[简体中文](CHANGELOG.md) | [English](CHANGELOG.en-US.md)
# Changelog

> **版本号规范**：正式版使用 `vX.Y.Z`，测试分支使用 `vX.Y.Z-<feature>.N` 区分功能线。合入 main 后作为下一个正式版发布。

## v1.1.4-updater.1 (beta/updater)
### Added
- 新增版本更新检测：程序启动时自动访问远端 API 对比版本号，发现新版本弹窗提示
- 新增更新弹窗：显示新版本号、更新日期、更新内容，支持「前往下载」「稍后提醒」「跳过此版本」三个操作
- 新增 OCR 架构变更提示：远端 JSON 中 `ocrchange` 为 `1` 时，弹窗额外警告用户更新后需重新导入 OCR 引擎包
- 新增侧边栏设置图标红点提示，用户做出决定（稍后提醒/跳过）后自动消失
- 新增设置页「常规」tab「版本与更新」卡片：显示当前版本号、更新详情、手动「检查更新」按钮
- 新增 `window:openExternal` IPC 通道，通过系统默认浏览器打开下载链接
- 新增防打扰机制：「稍后提醒」3 天内不再弹窗，「跳过此版本」同版本永不弹窗，记录持久化到 localStorage
- 通过 Vite `define` 注入 `__APP_VERSION__`，运行时动态获取当前版本号
### Fixed
- 覆盖安装时用户数据（设置、历史记录）和 OCR 引擎自动保留，无需重新配置

## v1.1.3 (Current)
### Added
- 新增表格结构增强：接入 RT-DETR-L 有线/无线表格单元格检测模型（`table_wired_det.onnx` + `table_wireless_det.onnx`），3 级回退链（模型检测 → 形态学网格 → 坐标聚类），复杂表格重建精度显著提升
- 新增 OCR 后处理增强：数学符号正则纠错器（`sn→sin`, `coS→cos`, `tg→tan` 等）、公式区域 2D 空间重组（整块合并 + OpenCV 视觉分数线检测 + `\frac` 输出）、OpenCV 形态学表格网格提取
- 新增多页 PDF 支持：基于 PyMuPDF 逐页渲染 PNG 并 OCR 识别，合并结果添加到参考文件（最大 50 页）
- 新增表格检测模型转换脚本 `scripts/convert_table_det.py`（支持 PIR 格式）
### Changed
- 删除废弃的 `FormulaRecognizer` 类（~130 行），清理相关引用（公式识别模型均为自回归架构，DirectML 不可用）
- 解压导入加速：优先使用 Windows 原生 `tar.exe` 替代纯 JS `extract-zip`，速度提升数倍
- 更新 OCR 技术文档，新增公式识别模型全面调研结论

## v1.1.2
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