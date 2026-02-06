import { useMemo, useState } from 'react'
import type { PromptMode } from '../types/ai'
import { templates } from '../lib/templates'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { PageLayout } from '../layouts/PageLayout'
import { useAppStore } from '../store/useAppStore'
import { useI18n } from '../store/useI18nStore'

export default function TemplatesPage() {
  const t = useI18n()
  const settings = useAppStore((s) => s.settings)
  const setTemplateId = useAppStore((s) => s.setTemplateId)
  const presets = useAppStore((s) => s.presets)
  const addPreset = useAppStore((s) => s.addPreset)
  const updatePreset = useAppStore((s) => s.updatePreset)
  const removePreset = useAppStore((s) => s.removePreset)

  const [name, setName] = useState('新预设')
  const [mode, setMode] = useState<PromptMode>('generate')
  const [userPrompt, setUserPrompt] = useState('严格遵循排版协议输出纯 HTML。')

  const canAdd = useMemo(() => name.trim().length > 0 && userPrompt.trim().length > 0, [name, userPrompt])

  return (
    <PageLayout>
      <div className="mx-auto flex w-full max-w-[920px] flex-col gap-4">
        <div>
          <div className="text-sm font-semibold">{t.templates.title}</div>
          <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">{t.templates.desc}</div>
        </div>

        {/* 模板选择区域 */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {templates.map((tpl) => {
            const isActive = settings.templateId === tpl.id
            return (
              <div
                key={tpl.id}
                onClick={() => setTemplateId(tpl.id)}
                className={`cursor-pointer rounded-xl border p-4 transition-all ${
                  isActive
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20 dark:bg-blue-900/20'
                    : 'border-slate-200 bg-white hover:border-blue-300 dark:border-slate-800 dark:bg-slate-950'
                }`}
              >
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  {/* @ts-ignore dynamic key access */}
                  {t.templates[tpl.id] || tpl.id}
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {isActive ? t.templates.current : t.templates.use}
                </div>
              </div>
            )
          })}
        </div>

        {/* 预设管理 (保留原有逻辑) */}
        <div className="my-4 border-t border-slate-200 dark:border-slate-800" />
        
        <Card>
          <CardHeader>
            <CardTitle>新增提示词预设</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="预设名称" />
              </div>
              <div className="flex gap-2">
                <Button variant={mode === 'generate' ? 'default' : 'secondary'} onClick={() => setMode('generate')} className="w-full">
                  {t.chat.generate}
                </Button>
                <Button variant={mode === 'fix' ? 'default' : 'secondary'} onClick={() => setMode('fix')} className="w-full">
                  {t.chat.fix}
                </Button>
              </div>
            </div>
            <Textarea value={userPrompt} onChange={(e) => setUserPrompt(e.target.value)} placeholder="提示词内容" />
            <Button
              onClick={() => {
                addPreset({ name: name.trim(), mode, userPrompt: userPrompt.trim() })
              }}
              disabled={!canAdd}
            >
              添加
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {presets.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="truncate">{p.name}</CardTitle>
                  <Button variant="destructive" size="sm" onClick={() => removePreset(p.id)} disabled={presets.length <= 1}>
                    {t.common.delete}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <Input value={p.name} onChange={(e) => updatePreset(p.id, { name: e.target.value })} />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={p.mode === 'generate' ? 'default' : 'secondary'}
                      onClick={() => updatePreset(p.id, { mode: 'generate' })}
                      className="w-full"
                    >
                      {t.chat.generate}
                    </Button>
                    <Button size="sm" variant={p.mode === 'fix' ? 'default' : 'secondary'} onClick={() => updatePreset(p.id, { mode: 'fix' })} className="w-full">
                      {t.chat.fix}
                    </Button>
                  </div>
                </div>
                <Textarea value={p.userPrompt} onChange={(e) => updatePreset(p.id, { userPrompt: e.target.value })} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PageLayout>
  )
}
