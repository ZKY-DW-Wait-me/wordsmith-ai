import type { GuardReport, GuardTypography } from '../types/guard'

/**
 * HTML 排版协议守卫
 * 负责将普通的 HTML 清洗、转换为符合 Word 粘贴标准的 HTML
 *
 * 主要功能：
 * 0. 安全清洗：移除脚本/事件处理器等可执行内容（协议规则 6，兼防 XSS）
 * 1. 单位统一转换为 pt
 * 2. 移除 style 标签和外链样式
 * 3. 确保表格边框、宽度、居中对齐
 * 4. 强制应用全局排版设置 (字体、字号、行距、字间距、字色等)
 * 5. 清洗 MathML 等不兼容标签
 * 6. 段落级排版（首行缩进、段前/段后、对齐）在不覆盖已有内联样式的前提下应用
 *
 * @param html 原始 HTML 字符串
 * @param defaults 全局排版默认值
 * @returns 清洗后的 HTML（包含完整 <body>）和处理报告
 */
export function guardHtml(
  html: string,
  defaults: GuardTypography,
): { html: string; report: GuardReport } {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const report: GuardReport = {
    convertedUnits: 0,
    tablesProcessed: 0,
    removedStyleTags: 0,
    removedStylesheetLinks: 0,
    mathMlNodesRemoved: 0,
    enforcedBodyStyle: false,
    removedForbiddenNodes: 0,
  }

  // 0. 安全清洗：移除协议禁止的标签与可执行内容（协议规则 6）。
  //    输出会经 dangerouslySetInnerHTML 渲染进应用 DOM，故必须防 XSS：
  //    - 危险标签整体删除
  //    - 内联事件处理器（onclick / onerror 等）删除
  //    - href/src 里的 javascript:/vbscript:/data:text/html 协议置空
  doc.querySelectorAll('script, iframe, object, embed, noscript, template, form, meta, base').forEach((el) => {
    el.remove()
    report.removedForbiddenNodes++
  })
  doc.querySelectorAll('*').forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase()
      if (name.startsWith('on')) {
        // 删除所有 on* 内联事件属性
        el.removeAttribute(attr.name)
        report.removedForbiddenNodes++
      } else if (name === 'href' || name === 'src' || name === 'xlink:href') {
        // 去掉空白/控制字符（防 "java\tscript:" 之类绕过）后判断协议
        const v = attr.value.replace(/\s+/g, '').toLowerCase()
        if (v.startsWith('javascript:') || v.startsWith('vbscript:') || v.startsWith('data:text/html')) {
          el.removeAttribute(attr.name)
          report.removedForbiddenNodes++
        }
      }
    }
  })

  // 1. Remove <style> and <link rel="stylesheet">
  doc.querySelectorAll('style').forEach((el) => {
    el.remove()
    report.removedStyleTags++
  })
  doc.querySelectorAll('link[rel="stylesheet"]').forEach((el) => {
    el.remove()
    report.removedStylesheetLinks++
  })

  // 2. Process all elements with style attributes for unit conversion
  doc.querySelectorAll('*').forEach((el) => {
    const style = el.getAttribute('style')
    if (style) {
      const newStyle = style.replace(/([\d.]+)px/g, (_, num) => {
        report.convertedUnits++
        return `${Number(num) * 0.75}pt`
      })
      el.setAttribute('style', newStyle)
    }
  })

  // 3. Process Tables
  doc.querySelectorAll('table').forEach((table) => {
    report.tablesProcessed++
    // 表格宽度与居中对齐按协议固定
    table.setAttribute('align', 'center')
    table.style.width = '440pt'
    // Ensure borders are visible in Word
    if (!table.style.borderCollapse) table.style.borderCollapse = 'collapse'
    // Default border if missing（协议要求 pt 单位）
    if (!table.style.border) table.style.border = '1pt solid #000'

    // Process cells
    table.querySelectorAll('td, th').forEach((cell) => {
      const el = cell as HTMLElement
      if (!el.style.border) el.style.border = '1pt solid #000'
      if (!el.style.padding) el.style.padding = '4pt'
    })
  })

  // 4. Clean MathML (Word doesn't support MathML paste well, prefers plain text or OMath)
  doc.querySelectorAll('math').forEach((el) => {
    const text = el.textContent || ''
    el.replaceWith(text)
    report.mathMlNodesRemoved++
  })

  // 5. 强制 body 排版（字体 / 字号 / 行距 / 字间距 / 字色）
  const cnFont = defaults.fontFamily || 'SimSun'
  doc.body.style.fontFamily = defaults.fontFamilyWestern
    ? `'${defaults.fontFamilyWestern}', '${cnFont}', 'SimSun', serif`
    : `'${cnFont}', 'SimSun', serif`
  doc.body.style.fontSize = `${defaults.fontSizePt}pt`
  // 行距：固定模式输出磅值，倍数模式输出无单位数值
  const hasFixedLineHeight = defaults.lineHeightMode === 'fixed' && defaults.lineHeightValue != null
  doc.body.style.lineHeight = hasFixedLineHeight
    ? `${defaults.lineHeightValue}pt`
    : String(defaults.lineHeightValue ?? 1.5)
  if (defaults.letterSpacingPt != null) doc.body.style.letterSpacing = `${defaults.letterSpacingPt}pt`
  if (defaults.color) doc.body.style.color = defaults.color
  doc.body.style.margin = '0'
  doc.body.style.padding = '0'
  report.enforcedBodyStyle = true

  // 6. 段落级排版：首行缩进、段前 / 段后、对齐 —— 仅作用于 <p>，不动标题；不覆盖已有内联样式
  const indentPt =
    defaults.firstLineIndentValue != null
      ? defaults.firstLineIndentUnit === 'pt'
        ? defaults.firstLineIndentValue
        : defaults.firstLineIndentValue * defaults.fontSizePt
      : null
  doc.body.querySelectorAll('p').forEach((p) => {
    const el = p as HTMLElement
    if (indentPt != null && !el.style.textIndent) el.style.textIndent = `${indentPt}pt`
    if (defaults.paragraphSpaceBeforePt != null && !el.style.marginTop) el.style.marginTop = `${defaults.paragraphSpaceBeforePt}pt`
    if (defaults.paragraphSpaceAfterPt != null && !el.style.marginBottom) el.style.marginBottom = `${defaults.paragraphSpaceAfterPt}pt`
    if (defaults.textAlign && !el.style.textAlign) el.style.textAlign = defaults.textAlign
  })

  return {
    html: doc.body.outerHTML,
    report,
  }
}
