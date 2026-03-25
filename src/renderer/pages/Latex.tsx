import { useCallback, useEffect, useRef, useState } from 'react'
import { Copy, Image, AlertCircle, Clock, X, Trash2 } from 'lucide-react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { latexToUnicodeMath } from '../lib/latex-to-unicodemath'
import { useI18nStore } from '../store/useI18nStore'
import { useLatexHistoryStore } from '../store/useLatexHistoryStore'
import { toast } from '../store/useToastStore'
import { cn } from '../lib/cn'

// 相对时间格式化
function formatRelativeTime(ts: number, t: { timeJustNow: string; timeMinAgo: string; timeHrAgo: string; timeDayAgo: string }): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return t.timeJustNow
  if (diff < 3600) return t.timeMinAgo.replace('{n}', String(Math.floor(diff / 60)))
  if (diff < 86400) return t.timeHrAgo.replace('{n}', String(Math.floor(diff / 3600)))
  return t.timeDayAgo.replace('{n}', String(Math.floor(diff / 86400)))
}

// 示例公式
const EXAMPLES = [
  { label: 'E=mc²', latex: 'E = mc^2' },
  { label: '二次公式', latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}' },
  { label: '欧拉公式', latex: 'e^{i\\pi} + 1 = 0' },
  { label: '求和', latex: '\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}' },
  { label: '积分', latex: '\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}' },
  { label: '矩阵', latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
  { label: '极限', latex: '\\lim_{n \\to \\infty} \\left(1 + \\frac{1}{n}\\right)^n = e' },
  { label: '分段', latex: '|x| = \\begin{cases} x & x \\geq 0 \\\\ -x & x < 0 \\end{cases}' },
]

export default function LatexPage() {
  const t = useI18nStore((s) => s.t)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [copying, setCopying] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const historyItems = useLatexHistoryStore((s) => s.items)
  const addHistoryItem = useLatexHistoryStore((s) => s.addItem)
  const removeHistoryItem = useLatexHistoryStore((s) => s.removeItem)
  const clearHistory = useLatexHistoryStore((s) => s.clearAll)

  // 150ms 防抖渲染 KaTeX
  const renderPreview = useCallback((latex: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (!previewRef.current) return
      if (!latex.trim()) {
        previewRef.current.innerHTML = ''
        setError('')
        return
      }
      try {
        katex.render(latex, previewRef.current, {
          displayMode: true,
          throwOnError: true,
          output: 'html',
        })
        setError('')
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : t.latex.parseError)
      }
    }, 150)
  }, [t])

  useEffect(() => {
    renderPreview(input)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [input, renderPreview])

  // 复制 UnicodeMath 文本
  const handleCopyUnicodeMath = async () => {
    if (!input.trim()) return
    try {
      const um = latexToUnicodeMath(input)
      await navigator.clipboard.writeText(um)
      addHistoryItem(input)
      toast({ title: t.latex.copySuccess })
    } catch {
      toast({ title: t.latex.copyFailed, variant: 'destructive' })
    }
  }

  // 复制为图片 — 高 DPI 超采样 + 智能裁剪 + 物理尺寸适配
  const handleCopyImage = async () => {
    if (!input.trim() || copying) return
    setCopying(true)
    try {
      const { katexToDataUrl } = await import('../lib/katex-to-image')
      const dataUrl = await katexToDataUrl(input, { scale: 4, targetPtSize: 11 })
      if (window.wordsmith?.clipboard?.writeImage) {
        // Electron: 通过 IPC 写入剪贴板
        await window.wordsmith.clipboard.writeImage(dataUrl)
      } else {
        // Web API 回退
        const res = await fetch(dataUrl)
        const blob = await res.blob()
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ])
      }
      addHistoryItem(input)
      toast({ title: t.latex.copySuccess })
    } catch {
      toast({ title: t.latex.copyFailed, variant: 'destructive' })
    } finally {
      setCopying(false)
    }
  }

  const loadFromHistory = (latex: string) => {
    setInput(latex)
    setHistoryOpen(false)
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* 拖拽区域 */}
      <div
        className="h-9 w-full shrink-0"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      />

      {/* 主体内容 */}
      <div className="flex min-h-0 flex-1 gap-4 px-6 pb-6">
        {/* 左栏：输入 */}
        <div className="flex w-1/2 flex-col gap-3">
          <h2 className="text-sm font-medium text-zinc-700">{t.latex.title}</h2>

          <textarea
            className="min-h-0 flex-1 resize-none rounded-xl border border-zinc-200 bg-white p-4 font-mono text-sm leading-relaxed text-zinc-800 outline-none transition-colors focus:border-zinc-400"
            placeholder={t.latex.inputPlaceholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
          />

          {/* 示例公式 */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-zinc-500">{t.latex.examples}</span>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => setInput(ex.latex)}
                  className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 右栏：预览 + 操作 */}
        <div className="flex w-1/2 flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-zinc-700">{t.latex.preview}</h2>
            <button
              onClick={() => setHistoryOpen(!historyOpen)}
              className={cn(
                'flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors',
                historyOpen
                  ? 'bg-zinc-200 text-zinc-900'
                  : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'
              )}
            >
              <Clock size={14} />
              <span>{t.latex.history}</span>
              {historyItems.length > 0 && (
                <span className="ml-0.5 rounded-full bg-zinc-300 px-1.5 text-[10px] font-medium text-zinc-700">
                  {historyItems.length}
                </span>
              )}
            </button>
          </div>

          {/* KaTeX 渲染区 */}
          <div className="relative min-h-0 flex-1 overflow-auto rounded-xl border border-zinc-200 bg-white p-6">
            <div
              ref={previewRef}
              className="flex min-h-full items-center justify-center text-xl"
            />
            {error && (
              <div className="absolute inset-x-0 bottom-0 flex items-start gap-2 border-t border-red-100 bg-red-50/90 p-3 text-xs text-red-600">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span className="break-all">{error}</span>
              </div>
            )}
            {!input.trim() && !error && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-400">
                {t.latex.inputPlaceholder}
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <button
              onClick={handleCopyUnicodeMath}
              disabled={!input.trim()}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all',
                input.trim()
                  ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                  : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
              )}
            >
              <Copy size={16} />
              <div className="flex flex-col items-start">
                <span>{t.latex.copyUnicodeMath}</span>
                <span className="text-[10px] font-normal opacity-70">{t.latex.copyUnicodeMathDesc}</span>
              </div>
            </button>

            <button
              onClick={handleCopyImage}
              disabled={!input.trim() || copying}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all',
                input.trim() && !copying
                  ? 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200'
                  : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
              )}
            >
              <Image size={16} />
              <div className="flex flex-col items-start">
                <span>{t.latex.copyImage}</span>
                <span className="text-[10px] font-normal opacity-70">{t.latex.copyImageDesc}</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 历史记录面板 — Edge 下载面板风格，从右侧滑入 */}
      <div
        className={cn(
          'absolute right-0 top-9 bottom-0 z-10 flex w-80 flex-col border-l border-zinc-200 bg-white shadow-lg transition-transform duration-200',
          historyOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* 面板头部 */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
          <h3 className="text-sm font-medium text-zinc-800">{t.latex.history}</h3>
          <div className="flex items-center gap-1">
            {historyItems.length > 0 && (
              <button
                onClick={clearHistory}
                className="rounded-md px-2 py-1 text-xs text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600"
              >
                {t.latex.clearHistory}
              </button>
            )}
            <button
              onClick={() => setHistoryOpen(false)}
              className="rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* 面板列表 */}
        <div className="flex-1 overflow-y-auto">
          {historyItems.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-xs text-zinc-400">
              {t.latex.historyEmpty}
            </div>
          ) : (
            <div className="flex flex-col">
              {historyItems.map((item) => (
                <div
                  key={item.id}
                  className="group flex cursor-pointer items-start gap-2 border-b border-zinc-50 px-4 py-3 transition-colors hover:bg-zinc-50"
                  onClick={() => loadFromHistory(item.latex)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-xs text-zinc-700">
                      {item.latex.length > 80 ? item.latex.slice(0, 80) + '...' : item.latex}
                    </p>
                    <p className="mt-0.5 text-[10px] text-zinc-400">
                      {formatRelativeTime(item.createdAt, t.latex)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeHistoryItem(item.id)
                    }}
                    className="mt-0.5 shrink-0 rounded p-0.5 text-zinc-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
