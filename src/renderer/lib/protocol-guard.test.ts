import { describe, expect, it } from 'vitest'
import { guardHtml } from './protocol-guard'

describe('protocol-guard', () => {
  it('removes <style> and stylesheet links', () => {
    const input = `<html><head><style>p{color:red}</style><link rel="stylesheet" href="x.css"></head><body><p>hi</p></body></html>`
    const out = guardHtml(input, { fontFamily: 'SimSun', fontSizePt: 12 })
    expect(out.report.removedStyleTags).toBe(1)
    expect(out.report.removedStylesheetLinks).toBe(1)
    expect(out.html).not.toContain('<style')
    expect(out.html).not.toContain('rel="stylesheet"')
  })

  it('enforces body style and converts px to pt', () => {
    const input = `<body style="margin:8px; padding:4px; font-family:Arial; font-size:16px;"><p style="margin-top:8px;">x</p></body>`
    const out = guardHtml(input, { fontFamily: 'SimSun', fontSizePt: 12 })
    // jsdom 序列化时会用双引号包裹字体名并保留冒号后的空格，故用更宽松的断言
    expect(out.html).toMatch(/font-family:\s*(?:&quot;|")SimSun(?:&quot;|")/)
    expect(out.html).toContain('font-size: 12pt')
    expect(out.html).toMatch(/margin:\s*0/)
    expect(out.html).toMatch(/padding:\s*0/)
    expect(out.report.convertedUnits).toBeGreaterThan(0)
    expect(out.html).toContain('margin-top:6pt')
  })

  it('enforces table protocol', () => {
    const input = `<body><table style="width:600px;"><tr><td>1</td></tr></table></body>`
    const out = guardHtml(input, { fontFamily: 'SimSun', fontSizePt: 12 })
    expect(out.report.tablesProcessed).toBe(1)
    expect(out.html).toContain('align="center"')
    expect(out.html).toContain('width: 440pt')
    expect(out.html).toMatch(/border-collapse:\s*collapse/)
  })

  it('strips MathML tags but keeps text content', () => {
    const input = `<body><p>before</p><math><mrow><mi>x</mi><mo>+</mo><mi>y</mi></mrow></math><p>after</p></body>`
    const out = guardHtml(input, { fontFamily: 'SimSun', fontSizePt: 12 })
    expect(out.report.mathMlNodesRemoved).toBeGreaterThan(0)
    expect(out.html).not.toContain('<math')
    expect(out.html).toContain('x+y')
  })

  it('returns a full <body> wrapper so enforced body styles survive', () => {
    const out = guardHtml(`<p>hi</p>`, { fontFamily: 'SimSun', fontSizePt: 14 })
    expect(out.html).toMatch(/^<body\b/)
    expect(out.html).toMatch(/<\/body>$/)
    expect(out.html).toContain('font-size: 14pt')
  })

  it('applies paragraph-level typography without overriding existing inline styles', () => {
    const input = `<body><p>plain</p><p style="text-align:left; text-indent:99pt;">kept</p></body>`
    const out = guardHtml(input, {
      fontFamily: 'SimSun',
      fontSizePt: 12,
      firstLineIndentValue: 2,
      firstLineIndentUnit: 'char',
      textAlign: 'justify',
      paragraphSpaceAfterPt: 6,
    })
    // 第一个 <p> 应被套用默认值：2 字符 * 12pt = 24pt 首行缩进 + 两端对齐 + 段后 6pt
    expect(out.html).toContain('text-indent: 24pt')
    expect(out.html).toContain('text-align: justify')
    expect(out.html).toContain('margin-bottom: 6pt')
    // 第二个 <p> 已有内联样式，不应被覆盖
    expect(out.html).toContain('text-indent: 99pt')
    expect(out.html).toContain('text-align: left')
  })

  it('renders fixed line-height in pt and multiple line-height unitless', () => {
    const fixed = guardHtml(`<p>x</p>`, {
      fontFamily: 'SimSun', fontSizePt: 12, lineHeightMode: 'fixed', lineHeightValue: 28,
    })
    expect(fixed.html).toContain('line-height: 28pt')
    const mult = guardHtml(`<p>x</p>`, {
      fontFamily: 'SimSun', fontSizePt: 12, lineHeightMode: 'multiple', lineHeightValue: 1.75,
    })
    expect(mult.html).toMatch(/line-height:\s*1\.75(?!pt)/)
  })
})
