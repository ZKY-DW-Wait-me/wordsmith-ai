[简体中文](CHANGELOG.md) | [English](CHANGELOG.en-US.md)
# Changelog

> **版本号规范**: 正式版使用 `vX.Y.Z`，beta 分支使用 `vX.Y.Z-<feature>.N` 区分功能线。合并至 main 后统一提升为下一个正式版号。

## v1.1.4-latex.2 (beta/latex-editor)
### Added
- 新增 AI 公式助手：左侧可折叠面板，流式对话生成 LaTeX 公式，专用系统提示词限制只返回公式
- 新增公式提取 + 插入按钮：从 AI 回复中正则提取 `$$...$$`、`$...$`、代码块中的公式，一键填入输入框
- 新增悬停高亮：鼠标悬停插入按钮时，AI 消息中对应公式高亮（violet 背景）
- 新增自动填入开关：开启后流式输出结束自动将第一个公式填入输入框
- 新增上下文数滑条（0-20）：控制发送给 AI 的历史消息对数，默认 10
- 新增阶梯式双面板布局：AI 助手和历史记录可同时打开（AI 左 + 历史右），宽度自适应且不超过屏幕中线
### Changed
- 历史记录面板从右侧迁移到左侧，两个面板按钮统一放在左栏标题行
- 优化公式提取：`\begin{aligned}` 等多行环境按 `\\` 拆分为独立公式（≤10 行拆分，>10 行保留整块防过度拆分）
- 渲染成功即自动记录历史（无需手动操作）

## v1.1.4-latex.1 (beta/latex-editor)
### Added
- 新增 LaTeX 公式编辑器页面（侧边栏 Σ 入口），支持 KaTeX 实时预览 + 8 个示例公式
- 新增 LaTeX → UnicodeMath 转换器，覆盖：分数、上下标、希腊字母、根号、矩阵（`\matrix()` 格式）、分段函数（`\cases` → `{█(...)┤`）、`\dot`/`\ddot` 修饰符、`\mathbf` 等数学字体、大型算子保护
- 新增高清图片导出：4x 超采样 DOM 渲染 + 白转透明 + getImageData 智能裁剪 + PNG pHYs DPI 元数据注入（~524 DPI，适配 Word 11pt 字号）
- 新增 Edge 风格历史记录面板（右侧滑入，Zustand 持久化，最多 100 条，自动去重）
- 新增 `captureAreaAsDataUrl` IPC 通道（截取区域返回 data URL，供渲染器侧后处理）
- 新增 25 个 UnicodeMath 转换单元测试
### Changed
- 图片导出从 SVG foreignObject 方案改为 Electron captureArea + Canvas 后处理方案，解决 KaTeX 字体在 Blob URL 上下文无法加载的问题

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