import { useState } from 'react'
import { PageLayout } from '../layouts/PageLayout'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { useAppStore } from '../store/useAppStore'
import { useI18n, useLocale, useSetLocale } from '../store/useI18nStore'
import { settingsService } from '../services/SettingsService'
import { toast } from '../store/useToastStore'
import { cn } from '../lib/cn'

const TABS = [
  { id: 'general', label: '常规' },
  { id: 'appearance', label: '外观' },
  { id: 'ai', label: 'AI 模型' },
  { id: 'advanced', label: '高级' },
]

export default function SettingsPage() {
  const t = useI18n()
  const locale = useLocale()
  const setLocale = useSetLocale()
  
  const settings = useAppStore((s) => s.settings)
  const setTheme = useAppStore((s) => s.setTheme)
  const updateAi = useAppStore((s) => s.updateAi)
  const updateTypography = useAppStore((s) => s.updateTypography)
  const updateSettings = useAppStore((s) => s.updateSettings)

  const [activeTab, setActiveTab] = useState('general')

  const handleReset = () => {
    if (confirm('确定要恢复出厂设置吗？这将丢失所有自定义配置。')) {
      settingsService.resetToDefaults()
      toast({ title: '已恢复出厂设置', variant: 'success' })
    }
  }

  const handleExport = () => {
    const json = settingsService.exportSettings()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wordsmith-settings-${Date.now()}.json`
    a.click()
    toast({ title: '配置已导出', variant: 'success' })
  }

  return (
    <PageLayout>
      <div className="mx-auto flex w-full max-w-[920px] flex-col gap-4">
        <div>
          <div className="text-sm font-semibold">{t.settings.title}</div>
          <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">{t.common.appDesc}</div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'border-b-2 px-4 py-2 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {/* 常规设置 */}
          {activeTab === 'general' && (
            <Card>
              <CardHeader>
                <CardTitle>{t.settings.language}</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button variant={locale === 'zh-CN' ? 'default' : 'secondary'} onClick={() => setLocale('zh-CN')}>
                  简体中文
                </Button>
                <Button variant={locale === 'en-US' ? 'default' : 'secondary'} onClick={() => setLocale('en-US')}>
                  English
                </Button>
              </CardContent>
            </Card>
          )}

          {/* 外观设置 */}
          {activeTab === 'appearance' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>{t.settings.theme}</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Button variant={settings.theme === 'system' ? 'default' : 'secondary'} onClick={() => setTheme('system')}>
                    {t.settings.themeSystem}
                  </Button>
                  <Button variant={settings.theme === 'light' ? 'default' : 'secondary'} onClick={() => setTheme('light')}>
                    {t.settings.themeLight}
                  </Button>
                  <Button variant={settings.theme === 'dark' ? 'default' : 'secondary'} onClick={() => setTheme('dark')}>
                    {t.settings.themeDark}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t.settings.typography}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                  <Input
                    value={settings.typography.fontFamily}
                    onChange={(e) => updateTypography({ fontFamily: e.target.value })}
                    placeholder={t.settings.fontFamily}
                  />
                  <Input
                    value={String(settings.typography.fontSizePt)}
                    onChange={(e) => updateTypography({ fontSizePt: Number(e.target.value) || 12 })}
                    placeholder={t.settings.fontSize}
                    inputMode="numeric"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>显示设置</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <span className="text-sm">护眼模式（降低对比度）</span>
                  <Button
                    variant={settings.eyeCareMode ? 'default' : 'secondary'}
                    onClick={() => updateSettings({ eyeCareMode: !settings.eyeCareMode })}
                    size="sm"
                  >
                    {settings.eyeCareMode ? '已开启' : '已关闭'}
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {/* AI 模型设置 */}
          {activeTab === 'ai' && (
            <Card>
              <CardHeader>
                <CardTitle>{t.settings.modelConfig}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-500">API 提供商</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300"
                    onChange={(e) => {
                      const url = e.target.value
                      if (url) updateAi({ baseUrl: url })
                    }}
                    value={
                      [
                        'https://api.deepseek.com',
                        'https://api-inference.modelscope.cn/v1',
                        'https://api.siliconflow.cn',
                        'https://open.bigmodel.cn/api/paas/v4',
                        'https://api.moonshot.cn',
                        'https://ark.cn-beijing.volces.com/api/v3',
                        'https://api.minimax.chat/v1',
                      ].includes(settings.ai.baseUrl)
                        ? settings.ai.baseUrl
                        : 'custom'
                    }
                  >
                    <option value="https://api.deepseek.com">DeepSeek</option>
                    <option value="https://api-inference.modelscope.cn/v1">ModelScope (魔搭)</option>
                    <option value="https://api.siliconflow.cn">SiliconFlow (硅基流动)</option>
                    <option value="https://open.bigmodel.cn/api/paas/v4">Zhipu (智谱清言)</option>
                    <option value="https://api.moonshot.cn">Moonshot (月之暗面)</option>
                    <option value="https://ark.cn-beijing.volces.com/api/v3">ByteDance (字节跳动/火山)</option>
                    <option value="https://api.minimax.chat/v1">Minimax</option>
                    <option value="custom">Custom (自定义)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-500">Base URL</label>
                  <Input
                    value={settings.ai.baseUrl}
                    onChange={(e) => updateAi({ baseUrl: e.target.value })}
                    placeholder={t.settings.baseUrl}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-500">模型名称 (Model)</label>
                  <Input
                    value={settings.ai.model}
                    onChange={(e) => updateAi({ model: e.target.value })}
                    placeholder={t.settings.model}
                  />
                  <div className="text-xs text-slate-400">
                    例如: deepseek-chat, qwen-max, moonshot-v1-8k
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-500">API Key</label>
                  <Input
                    value={settings.ai.apiKey}
                    onChange={(e) => updateAi({ apiKey: e.target.value })}
                    placeholder={t.settings.apiKey}
                    type="password"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* 高级设置 */}
          {activeTab === 'advanced' && (
            <Card>
              <CardHeader>
                <CardTitle>系统参数</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-500">API 请求超时 (ms)</label>
                  <Input
                    value={String(settings.timeout)}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      if (!isNaN(val)) updateSettings({ timeout: val })
                    }}
                    type="number"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-500">默认保存路径</label>
                  <Input
                    value={settings.savePath}
                    onChange={(e) => updateSettings({ savePath: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="secondary" onClick={handleExport} className="w-full">
                    导出配置
                  </Button>
                  <Button variant="destructive" onClick={handleReset} className="w-full">
                    恢复出厂设置
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
