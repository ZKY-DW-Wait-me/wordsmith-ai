import { useEffect, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { useI18n } from '../../store/useI18nStore'

const CN_FONTS = [
  { label: '宋体', value: 'SimSun' },
  { label: '黑体', value: 'SimHei' },
  { label: '楷体', value: 'KaiTi' },
  { label: '仿宋', value: 'FangSong' },
  { label: '微软雅黑', value: 'Microsoft YaHei' },
  { label: '等线', value: 'DengXian' },
]

const WESTERN_FONTS = [
  { label: 'Times New Roman', value: 'Times New Roman' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Calibri', value: 'Calibri' },
  { label: 'Cambria', value: 'Cambria' },
  { label: 'Georgia', value: 'Georgia' },
]

/** 当前值不在预设里时（兼容旧的自定义字体名），把它补进选项首位，避免下拉错位 */
function withCurrent(options: { label: string; value: string }[], current?: string) {
  if (current && !options.some((o) => o.value === current)) {
    return [{ label: current, value: current }, ...options]
  }
  return options
}

const fieldCls =
  'w-full rounded-lg border-0 bg-zinc-100 px-2 py-1.5 text-xs text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-300'
const labelCls = 'mb-1 block text-[10px] font-medium text-zinc-500'

/**
 * 数字输入：用本地字符串缓冲，允许中途清空/重输，不会因受控值立即弹回旧值。
 * 仅在输入是合法数字时才向上提交；失焦时把显示值规整回真实值。
 */
function NumberField({
  value,
  onCommit,
  min,
  step,
}: {
  value: number
  onCommit: (n: number) => void
  min?: number
  step?: number
}) {
  const [draft, setDraft] = useState(String(value))

  // 外部值变化（切换模式/重置等）时同步，避免显示与真实值脱节
  useEffect(() => {
    setDraft(String(value))
  }, [value])

  return (
    <input
      type="number"
      min={min}
      step={step}
      className={fieldCls}
      value={draft}
      onChange={(e) => {
        const raw = e.target.value
        setDraft(raw)
        const n = Number(raw)
        if (raw !== '' && !Number.isNaN(n)) onCommit(n)
      }}
      onBlur={() => setDraft(String(value))}
    />
  )
}

export function TypographyPanel() {
  const t = useI18n()
  const tt = t.typography
  const typo = useAppStore((s) => s.settings.typography)
  const updateTypography = useAppStore((s) => s.updateTypography)

  const fixedLine = typo.lineHeightMode === 'fixed'

  return (
    <div className="shrink-0 space-y-2 rounded-xl border border-zinc-200 bg-white px-3 py-3">
      <div className="grid grid-cols-2 gap-2">
        {/* 中文字体 */}
        <div>
          <label className={labelCls}>{tt.cnFont}</label>
          <select
            className={fieldCls}
            value={typo.fontFamily}
            onChange={(e) => updateTypography({ fontFamily: e.target.value })}
          >
            {withCurrent(CN_FONTS, typo.fontFamily).map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        {/* 西文字体 */}
        <div>
          <label className={labelCls}>{tt.westernFont}</label>
          <select
            className={fieldCls}
            value={typo.fontFamilyWestern || 'Times New Roman'}
            onChange={(e) => updateTypography({ fontFamilyWestern: e.target.value || undefined })}
          >
            {withCurrent(WESTERN_FONTS, typo.fontFamilyWestern).map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        {/* 字号 */}
        <div>
          <label className={labelCls}>{tt.fontSize}（pt）</label>
          <NumberField
            min={1}
            step={0.5}
            value={typo.fontSizePt}
            onCommit={(n) => updateTypography({ fontSizePt: n })}
          />
        </div>

        {/* 字间距 */}
        <div>
          <label className={labelCls}>{tt.letterSpacing}（pt）</label>
          <NumberField
            step={0.5}
            value={typo.letterSpacingPt ?? 0}
            onCommit={(n) => updateTypography({ letterSpacingPt: n })}
          />
        </div>

        {/* 行距模式 */}
        <div>
          <label className={labelCls}>{tt.lineHeight}</label>
          <select
            className={fieldCls}
            value={typo.lineHeightMode ?? 'multiple'}
            onChange={(e) => updateTypography({ lineHeightMode: e.target.value as 'multiple' | 'fixed' })}
          >
            <option value="multiple">{tt.lineHeightMultiple}</option>
            <option value="fixed">{tt.lineHeightFixed}</option>
          </select>
        </div>

        {/* 行距值 */}
        <div>
          <label className={labelCls}>{fixedLine ? `${tt.lineHeight}（pt）` : tt.lineHeightTimes}</label>
          <NumberField
            min={fixedLine ? 1 : 0.5}
            step={fixedLine ? 1 : 0.1}
            value={typo.lineHeightValue ?? 1.5}
            onCommit={(n) => updateTypography({ lineHeightValue: n })}
          />
        </div>

        {/* 段前 */}
        <div>
          <label className={labelCls}>{tt.spaceBefore}（pt）</label>
          <NumberField
            min={0}
            step={1}
            value={typo.paragraphSpaceBeforePt ?? 0}
            onCommit={(n) => updateTypography({ paragraphSpaceBeforePt: n })}
          />
        </div>

        {/* 段后 */}
        <div>
          <label className={labelCls}>{tt.spaceAfter}（pt）</label>
          <NumberField
            min={0}
            step={1}
            value={typo.paragraphSpaceAfterPt ?? 0}
            onCommit={(n) => updateTypography({ paragraphSpaceAfterPt: n })}
          />
        </div>

        {/* 首行缩进值 */}
        <div>
          <label className={labelCls}>{tt.firstLineIndent}</label>
          <NumberField
            min={0}
            step={typo.firstLineIndentUnit === 'pt' ? 1 : 0.5}
            value={typo.firstLineIndentValue ?? 0}
            onCommit={(n) => updateTypography({ firstLineIndentValue: n })}
          />
        </div>

        {/* 缩进单位 */}
        <div>
          <label className={labelCls}>{tt.indentUnit}</label>
          <select
            className={fieldCls}
            value={typo.firstLineIndentUnit ?? 'char'}
            onChange={(e) => updateTypography({ firstLineIndentUnit: e.target.value as 'char' | 'pt' })}
          >
            <option value="char">{tt.indentCharUnit}</option>
            <option value="pt">{tt.indentPtUnit}</option>
          </select>
        </div>

        {/* 对齐 */}
        <div>
          <label className={labelCls}>{tt.align}</label>
          <select
            className={fieldCls}
            value={typo.textAlign ?? 'justify'}
            onChange={(e) => updateTypography({ textAlign: e.target.value as 'left' | 'center' | 'right' | 'justify' })}
          >
            <option value="left">{tt.alignLeft}</option>
            <option value="center">{tt.alignCenter}</option>
            <option value="right">{tt.alignRight}</option>
            <option value="justify">{tt.alignJustify}</option>
          </select>
        </div>

        {/* 字色 */}
        <div>
          <label className={labelCls}>{tt.color}</label>
          <input
            type="color"
            className="h-[30px] w-full cursor-pointer rounded-lg border-0 bg-zinc-100 p-0.5"
            value={typo.color ?? '#000000'}
            onChange={(e) => updateTypography({ color: e.target.value })}
          />
        </div>
      </div>
    </div>
  )
}
