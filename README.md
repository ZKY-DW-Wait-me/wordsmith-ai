 [简体中文](README.md) | [English](README.en-US.md)
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

## 📄 开源协议 (License)
本项目采用 [GPL v3](LICENSE) 协议开源。