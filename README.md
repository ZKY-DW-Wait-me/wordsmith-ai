 [简体中文](README.md) | [English](README.en-US.md)
 ## 📄 开源协议 (License)
本项目采用 [GPL v3](LICENSE) 协议开源。
> 
⚖️开源协议与版权声明(License&Copyright)
本项目（包括但不限于源代码、文档、资源文件等）的著作权归原作者（本人）所有。
授权协议说明：
1. 
统一授权： 本项目自 首个 Commit (Initial Commit) 起的所有历史版本、分支及后续更新，现统一采用 GNU General Public License v3.0 (GPLv3) 协议进行授权。
2. 
溯及力声明： 无论您是在本项目添加 LICENSE 文件之前还是之后获取的源代码，只要您分发、修改或使用本项目代码，均须严格遵守 GPLv3 协议的所有条款。
3. 
闭源限制： 严禁任何个人或机构在未履行 GPLv3 义务（如开源衍生项目源码）的情况下，将本项目代码用于商业闭源软件、打包为 .exe 或其他二进制形式进行分发。
4. 
侵权追究： 任何违反 GPLv3 协议的行为均视为对著作权的直接侵权。本人保留通过法律途径（包括但不限于向托管平台提交 DMCA/侵权申诉、提起司法诉讼等）追究侵权者法律责任的权利。
提示： 如果您希望在不遵守 GPLv3 协议（如保持闭源）的情况下使用本项目代码，请务必联系作者获得额外的商业授权。

# WordSmith AI（智排精灵）
> 基于HTML的word排版工具

---

## 📱 给用户的使用指南 (User Guide)

### 🎯 程序介绍
WordSmith AI 是利用HTML格式，通过严格提示词限制，与AI对话，进行文章段落排版，并复制粘贴回word中的便捷排版工具，同时支持数学物理公式渲染。既可以让AI直接生成文章，也可以根据word原有文章段落进行仿照排版，同时也支持对网页HTML复制的HTML格式进行清洗，精确符合word排版功能。最新版本已支持OCR，可以选择本地推理和云端推理两种模式，且识别结果支持手动二次更正。用户可以直接上传，拖拽图片进行文本，公式识别。


### 📥 如何安装
1.  下载最新版本的 `.exe` 文件（当前最新：**v1.1.1**）。
3.  **注意**：OCR功能需在“设置-高级-OCR 图片识别”中手动选择 zip 包进行导入或者填写对应服务商的APIkey，通过选择对应视觉模型进行识别。


---

## 🛠️ 给开发者的文档 (Developer Guide)

### 技术栈

Electron 30 + React 18 + TypeScript + Tailwind CSS v4 + Zustand + Vite

### 环境准备

```bash
# 1. 安装依赖（国内 Electron 下载慢可加镜像）
$env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"; npm install

# 2. 启动开发
npm run dev

# 3. 打包
npm run build
```

### 排版协议

核心约束 — 保证 HTML 粘贴到 Word 格式正确：

- 仅行内样式，禁止 `<style>` 标签
- 单位必须为 `pt`（Guard Layer 自动 px→pt ×0.75）
- 表格 `align="center"`，`width:440pt; border-collapse:collapse;`
- 数学公式保留 `$...$` / `$$...$$` 原样，清除 MathML

### OCR 引擎

不含在安装包中（约 2.5GB），用户通过「设置 → 高级」导入 zip。开发时将 `ocr_engine/` 放项目根目录即可自动检测。

打包 OCR 引擎 zip：`powershell -ExecutionPolicy Bypass -File scripts/pack-ocr-engine.ps1`

## 📄 开源协议
本项目采用 [GPL v3 协议](LICENSE) 开源。