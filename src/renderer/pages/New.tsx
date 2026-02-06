import { useEffect, useMemo, useState } from 'react'
import type { GuardReport } from '../types/guard'
import { guardHtml } from '../lib/protocol-guard'
import { getTemplateById } from '../lib/templates'
import { ChatPanel } from '../components/business/ChatPanel'
import { CopyToWordButton } from '../components/business/CopyToWordButton'
import { HtmlEditor } from '../components/business/HtmlEditor'
import { MacroGenerator } from '../components/business/MacroGenerator'
import { PreviewFrame } from '../components/business/PreviewFrame'
import { Sidebar } from '../components/business/Sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { useAppStore } from '../store/useAppStore'
import { useI18n } from '../store/useI18nStore'

const DEFAULT_HTML = `<body style="margin:0; padding:0; font-family:'SimSun'; font-size:12pt;">
  <p style="margin:0 0 12pt 0;">将 AI 生成的内容粘贴到这里，右侧预览与复制会自动使用排版协议守卫。</p>
  <table style="width:600px; border:1px solid #333;">
    <tr>
      <td style="padding:8px;">示例</td>
      <td style="padding:8px;">$E=mc^2$</td>
    </tr>
  </table>
</body>`

export default function NewPage() {
  const t = useI18n()
  const settings = useAppStore((s) => s.settings)
  const updateTypography = useAppStore((s) => s.updateTypography)
  const presets = useAppStore((s) => s.presets)
  const addHistoryItem = useAppStore((s) => s.addHistoryItem)
  const selectedPreset = presets[0]

  const template = useMemo(() => getTemplateById(settings.templateId), [settings.templateId])

  const [htmlDraft, setHtmlDraft] = useState(DEFAULT_HTML)
  const [finalHtml, setFinalHtml] = useState(DEFAULT_HTML)
  const [guardReport, setGuardReport] = useState<GuardReport | null>(null)

  // Merge template styles with settings (Settings take priority if modified, or just use template as base)
  // Here we use settings.typography as the source of truth for the ChatPanel generation parameters,
  // but for the visual guard/preview, we might want to ensure the template CSS is respected.
  // Actually, guardHtml uses `defaults` to inject styles if missing.
  
  const activeTypography = useMemo(() => ({
    fontFamily: settings.typography.fontFamily || template.style.fontFamily,
    fontSizePt: settings.typography.fontSizePt || template.style.fontSizePt,
  }), [settings.typography, template])

  const guarded = useMemo(() => guardHtml(htmlDraft, activeTypography), [htmlDraft, activeTypography])

  useEffect(() => {
    setFinalHtml(guarded.html)
    setGuardReport(guarded.report)
  }, [guarded])

  return (
    <div className="h-full w-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex h-full">
        <Sidebar />

        <main className="flex h-full min-w-0 flex-1 gap-3 p-3">
          {/* 中间主要区域：对话 + 编辑 */}
          <section className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <ChatPanel
                baseUrl={settings.ai.baseUrl}
                apiKey={settings.ai.apiKey}
                model={settings.ai.model}
                defaults={activeTypography}
                presetPrompt={template.systemPrompt || selectedPreset?.userPrompt}
                htmlDraft={htmlDraft}
                onHtmlFinalized={(html, report, payload) => {
                  setHtmlDraft(html)
                  setFinalHtml(html)
                  setGuardReport(report)
                  const title = payload.messages.find((m) => m.role === 'user')?.content?.slice(0, 24) || t.history.itemTitle
                  addHistoryItem({
                    title,
                    mode: payload.mode,
                    messages: payload.messages,
                    finalHtml: html,
                  })
                }}
              />
            </div>
            <div className="h-[300px] shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <HtmlEditor value={htmlDraft} onChange={setHtmlDraft} />
            </div>
          </section>

          {/* 右侧配置与预览 */}
          <section className="flex w-[400px] shrink-0 flex-col gap-3 overflow-y-auto pb-2">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">排版参数</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2 py-0 pb-3">
                <Input value={settings.typography.fontFamily} onChange={(e) => updateTypography({ fontFamily: e.target.value })} placeholder={t.settings.fontFamily} />
                <Input
                  value={String(settings.typography.fontSizePt)}
                  onChange={(e) => updateTypography({ fontSizePt: Number(e.target.value) || 12 })}
                  placeholder={t.settings.fontSize}
                  inputMode="numeric"
                />
              </CardContent>
            </Card>

            <div className="flex h-[400px] shrink-0 flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <PreviewFrame html={finalHtml} />
            </div>

            <div className="grid grid-cols-1 gap-2">
              <CopyToWordButton html={finalHtml} />
              {guardReport ? (
                <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                  <div className="grid grid-cols-2 gap-2">
                    <div>{t.preview.guardReport.units}：{guardReport.convertedUnits}</div>
                    <div>{t.preview.guardReport.tables}：{guardReport.tablesProcessed}</div>
                    <div>{t.preview.guardReport.styles}：{guardReport.removedStyleTags}</div>
                    <div>{t.preview.guardReport.links}：{guardReport.removedStylesheetLinks}</div>
                    <div>{t.preview.guardReport.mathml}：{guardReport.mathMlNodesRemoved}</div>
                    <div>{t.preview.guardReport.body}：{guardReport.enforcedBodyStyle ? t.preview.guardReport.yes : t.preview.guardReport.no}</div>
                  </div>
                </div>
              ) : null}
            </div>

            <MacroGenerator />
          </section>
        </main>
      </div>
    </div>
  )
}
