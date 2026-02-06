# WordSmith AI（智排精灵）

基于 AI 的智能文档排版桌面应用：通过 “AI → HTML（Inline CSS）→ Clipboard → Word” 的链路，最大化解决复制到 Word 时的格式错乱与公式问题。

## 开发

1. 切换 npm 镜像（可选，国内推荐）

```bash
npm config set registry https://registry.npmmirror.com
```

2. 安装依赖（如果 Electron 安装失败，可使用镜像）

```bash
# PowerShell
$env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"; npm install
```

3. 启动开发模式

```bash
# PowerShell
$env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"; npm run dev
```

## 关键约束（排版协议）

- 只允许使用 `style="..."` 行内样式，禁止 `<style>` 标签与外链样式
- 所有长度单位必须是 `pt`（会通过 Guard Layer 自动清洗/转换）
- `body` 固定基础样式：`margin:0; padding:0; font-family:'SimSun';`
- `table` 强制 `align="center"` 且 `style="width:440pt; border-collapse:collapse;"`
- 数学公式保留 `$...$ / $$...$$` 原样；清除 MathML 等可能导致 Word 报错的标签

## 测试与质量

```bash
npm run lint
npm test
```

## 打包（Windows）

```bash
npm run build
```
