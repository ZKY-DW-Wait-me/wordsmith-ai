[简体中文](CHANGELOG.md) | [English](CHANGELOG.en-US.md)
# Changelog

> **版本号规范**: 正式版使用 `vX.Y.Z`，beta 分支使用 `vX.Y.Z-<feature>.N` 区分功能线。合并至 main 后统一提升为下一个正式版号。

## v1.1.4-context.1 (beta/smart-context)
### Added
- 新增上下文轮次滑条（0=不限，最大 20 轮），控制发送给 AI 的历史对话轮数，减少 Token 消耗
- 新增逐轮勾选框：每轮已完成对话旁显示勾选控件，手动包含/排除特定轮次，覆盖窗口默认规则
- 新增引用历史对话（Pinned Rounds）：从历史记录中选取对话轮次作为跨对话上下文快照，独立于历史记录存储
- 新增引用对话弹窗：左栏历史列表 + 搜索、右栏轮次预览 + 逐轮 pin 操作
- 新增重新生成按钮：点击可重新生成最后一轮 AI 回复
- 新增继续生成按钮：AI 输出中断时自动检测并显示，追加内容到现有回复（不新建气泡）
- 新增上下文过滤引擎 `context-filter.ts`，含 14 个单元测试
### Fixed
- 修复聊天面板输入框被窗口底部截断的布局问题（`h-full` → `flex-1 min-h-0`）
- 修复左侧栏新增区域挤占自定义指令和参考文档空间的问题

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