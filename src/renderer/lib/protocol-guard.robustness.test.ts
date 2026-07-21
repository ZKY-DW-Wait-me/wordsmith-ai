import { describe, expect, it } from 'vitest'
import { guardHtml } from './protocol-guard'

// 复刻 New.tsx 里的 bodyToDiv，锁定正则健壮性（大输入 / ReDoS 回溯）
const bodyToDiv = (html: string) => {
  const m = html.match(/^\s*<body([^>]*)>([\s\S]*)<\/body>\s*$/i)
  return m ? `<div${m[1]}>${m[2]}</div>` : html
}

describe('protocol-guard robustness', () => {
  it('processes a very large document correctly and without hanging', () => {
    const paras = Array.from({ length: 5000 }, (_, i) =>
      `<p style="margin:8px; font-size:${12 + (i % 5)}px;">段落 ${i}</p>`
    ).join('')
    const input = `<body>${paras}<table style="width:600px"><tr><td>c</td></tr></table></body>`

    const out = guardHtml(input, {
      fontFamily: 'SimSun', fontSizePt: 12,
      firstLineIndentValue: 2, firstLineIndentUnit: 'char',
      textAlign: 'justify', paragraphSpaceAfterPt: 6,
    })

    expect(out.report.tablesProcessed).toBe(1)
    expect(out.report.convertedUnits).toBeGreaterThan(5000)
    expect(out.html).toContain('text-indent: 24pt')
    expect(out.html).toContain('width: 440pt')
  })

  it('bodyToDiv is linear on huge and unterminated input (no catastrophic backtracking)', () => {
    const bigInner = '<p>x</p>'.repeat(200000) // ~1.6MB

    const wrapped = bodyToDiv(`<body style="margin:0">${bigInner}</body>`)
    expect(wrapped.startsWith('<div style="margin:0">')).toBe(true)
    expect(wrapped.endsWith('</div>')).toBe(true)

    // 无闭合 </body>：强制正则回溯到底后失败，必须线性、原样返回
    const t0 = performance.now()
    const unterminated = `<body>${bigInner}`
    const passthrough = bodyToDiv(unterminated)
    expect(passthrough).toBe(unterminated)
    // 生成 1000ms 的极宽松上限——线性实现只需个位数 ms；真正病态回溯会是几十秒
    expect(performance.now() - t0).toBeLessThan(1000)
  })

  it('does not throw on deeply nested / malformed html', () => {
    const nested = '<div>'.repeat(2000) + 'x' + '</div>'.repeat(2000)
    expect(() => guardHtml(`<body>${nested}</body>`, { fontFamily: 'SimSun', fontSizePt: 12 })).not.toThrow()
    expect(() => guardHtml('<body><p style="margin:1.5.5px">bad</p>', { fontFamily: 'SimSun', fontSizePt: 12 })).not.toThrow()
    expect(() => guardHtml('', { fontFamily: 'SimSun', fontSizePt: 12 })).not.toThrow()
  })

  it('keeps the minus sign when converting negative px', () => {
    const out = guardHtml('<body><p style="margin-left:-8px">x</p></body>', { fontFamily: 'SimSun', fontSizePt: 12 })
    expect(out.html).toContain('margin-left:-6pt')
  })
})
