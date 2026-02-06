import { useState } from 'react'
import {
  Globe, Palette, Bot, Wrench, Check, Loader2, X, ChevronDown, AlertTriangle
} from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { useI18n, useLocale, useSetLocale } from '../store/useI18nStore'
import { settingsService } from '../services/SettingsService'
import { toast } from '../store/useToastStore'
import { Button } from '../components/ui/button'
import { ConfirmDialog } from '../components/ui/Dialog'
import { cn } from '../lib/cn'

const TABS = [
  { id: 'general', label: '常规', icon: Globe },
  { id: 'appearance', label: '外观', icon: Palette },
  { id: 'ai', label: 'AI 模型', icon: Bot },
  { id: 'advanced', label: '高级', icon: Wrench },
]

const AI_PROVIDERS = [
  { url: 'https://api.deepseek.com', name: 'DeepSeek', models: ['deepseek-chat', 'deepseek-coder'] },
  { url: 'https://api-inference.modelscope.cn/v1', name: 'ModelScope 魔搭', models: ['qwen-max', 'qwen-plus'] },
  { url: 'https://api.siliconflow.cn', name: 'SiliconFlow 硅基流动', models: ['Qwen/Qwen2.5-72B-Instruct'] },
  { url: 'https://open.bigmodel.cn/api/paas/v4', name: 'Zhipu 智谱清言', models: ['glm-4', 'glm-4-flash'] },
  { url: 'https://api.moonshot.cn', name: 'Moonshot 月之暗面', models: ['moonshot-v1-8k', 'moonshot-v1-32k'] },
  { url: 'https://ark.cn-beijing.volces.com/api/v3', name: 'ByteDance 火山引擎', models: ['doubao-pro-4k'] },
  { url: 'https://api.minimax.chat/v1', name: 'Minimax', models: ['abab6.5-chat'] },
]

export default function SettingsPage() {
  const t = useI18n()
  const locale = useLocale()
  const setLocale = useSetLocale()

  const settings = useAppStore((s) => s.settings)
  const updateAi = useAppStore((s) => s.updateAi)
  const updateTypography = useAppStore((s) => s.updateTypography)
  const updateSettings = useAppStore((s) => s.updateSettings)

  const [activeTab, setActiveTab] = useState('general')
  const [showProviderDropdown, setShowProviderDropdown] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [resetConfirm, setResetConfirm] = useState(false)

  const currentProvider = AI_PROVIDERS.find(p => p.url === settings.ai.baseUrl)

  const testConnection = async () => {
    if (!settings.ai.apiKey || !settings.ai.baseUrl) {
      toast({ title: '请先填写 API Key 和 Base URL', variant: 'warning' })
      return
    }

    setTestingConnection(true)
    setConnectionStatus('idle')

    try {
      const response = await fetch(`${settings.ai.baseUrl}/v1/models`, {
        headers: { Authorization: `Bearer ${settings.ai.apiKey}` },
        signal: AbortSignal.timeout(10000),
      })

      if (response.ok) {
        setConnectionStatus('success')
        toast({ title: '连接成功', description: 'API 配置正确', variant: 'success' })
      } else {
        setConnectionStatus('error')
        toast({ title: '连接失败', description: `HTTP ${response.status}`, variant: 'destructive' })
      }
    } catch {
      setConnectionStatus('error')
      toast({ title: '连接失败', description: '请检查网络或 API 配置', variant: 'destructive' })
    } finally {
      setTestingConnection(false)
    }
  }

  const handleReset = () => {
    settingsService.resetToDefaults()
    toast({ title: '已恢复出厂设置', variant: 'success' })
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
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-zinc-900">
          {t.settings.title}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {t.common.appDesc}
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl bg-zinc-100 p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                activeTab === tab.id
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              )}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      <div className="space-y-4">
        {/* 常规设置 */}
        {activeTab === 'general' && (
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h3 className="mb-4 text-sm font-medium text-zinc-900">
              {t.settings.language}
            </h3>
            <div className="flex gap-2">
              <Button
                variant={locale === 'zh-CN' ? 'default' : 'outline'}
                onClick={() => setLocale('zh-CN')}
                className="flex-1"
              >
                简体中文
              </Button>
              <Button
                variant={locale === 'en-US' ? 'default' : 'outline'}
                onClick={() => setLocale('en-US')}
                className="flex-1"
              >
                English
              </Button>
            </div>
          </div>
        )}

        {/* 外观设置 */}
        {activeTab === 'appearance' && (
          <>
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <h3 className="mb-4 text-sm font-medium text-zinc-900">
                {t.settings.typography}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs text-zinc-500">{t.settings.fontFamily}</label>
                  <input
                    value={settings.typography.fontFamily}
                    onChange={(e) => updateTypography({ fontFamily: e.target.value })}
                    className="w-full rounded-lg border-0 bg-zinc-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-zinc-500">{t.settings.fontSize}</label>
                  <input
                    value={settings.typography.fontSizePt}
                    onChange={(e) => updateTypography({ fontSizePt: Number(e.target.value) || 12 })}
                    type="number"
                    className="w-full rounded-lg border-0 bg-zinc-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-zinc-900">护眼模式</h3>
                  <p className="mt-0.5 text-xs text-zinc-500">降低对比度，保护眼睛</p>
                </div>
                <button
                  onClick={() => updateSettings({ eyeCareMode: !settings.eyeCareMode })}
                  className={cn(
                    'relative h-6 w-11 rounded-full transition-colors',
                    settings.eyeCareMode ? 'bg-zinc-900' : 'bg-zinc-200'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                      settings.eyeCareMode ? 'left-[22px]' : 'left-0.5'
                    )}
                  />
                </button>
              </div>
            </div>
          </>
        )}

        {/* AI 模型设置 */}
        {activeTab === 'ai' && (
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h3 className="mb-4 text-sm font-medium text-zinc-900">
              {t.settings.modelConfig}
            </h3>

            <div className="space-y-4">
              {/* Provider Selector */}
              <div>
                <label className="mb-1.5 block text-xs text-zinc-500">API 提供商</label>
                <div className="relative">
                  <button
                    onClick={() => setShowProviderDropdown(!showProviderDropdown)}
                    className="flex w-full items-center justify-between rounded-lg border-0 bg-zinc-100 px-3 py-2.5 text-left text-sm transition-all hover:bg-zinc-200"
                  >
                    <span className="text-zinc-900">
                      {currentProvider?.name || '自定义'}
                    </span>
                    <ChevronDown size={16} className="text-zinc-400" />
                  </button>

                  {showProviderDropdown && (
                    <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-64 overflow-auto rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
                      {AI_PROVIDERS.map((provider) => (
                        <button
                          key={provider.url}
                          onClick={() => {
                            updateAi({ baseUrl: provider.url, model: provider.models[0] })
                            setShowProviderDropdown(false)
                            setConnectionStatus('idle')
                          }}
                          className={cn(
                            'flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors',
                            settings.ai.baseUrl === provider.url
                              ? 'bg-zinc-100'
                              : 'hover:bg-zinc-50'
                          )}
                        >
                          <span className="text-zinc-900">{provider.name}</span>
                          {settings.ai.baseUrl === provider.url && (
                            <Check size={14} className="text-zinc-500" />
                          )}
                        </button>
                      ))}
                      <div className="my-1 border-t border-zinc-200" />
                      <button
                        onClick={() => setShowProviderDropdown(false)}
                        className="flex w-full items-center px-3 py-2 text-left text-sm text-zinc-500 hover:bg-zinc-50"
                      >
                        自定义 URL
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Base URL */}
              <div>
                <label className="mb-1.5 block text-xs text-zinc-500">Base URL</label>
                <input
                  value={settings.ai.baseUrl}
                  onChange={(e) => {
                    updateAi({ baseUrl: e.target.value })
                    setConnectionStatus('idle')
                  }}
                  placeholder="https://api.example.com"
                  className="w-full rounded-lg border-0 bg-zinc-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
                />
              </div>

              {/* Model */}
              <div>
                <label className="mb-1.5 block text-xs text-zinc-500">模型名称</label>
                <input
                  value={settings.ai.model}
                  onChange={(e) => updateAi({ model: e.target.value })}
                  placeholder="deepseek-chat"
                  className="w-full rounded-lg border-0 bg-zinc-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
                />
                {currentProvider && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {currentProvider.models.map((m) => (
                      <button
                        key={m}
                        onClick={() => updateAi({ model: m })}
                        className={cn(
                          'rounded-md px-2 py-0.5 text-xs transition-colors',
                          settings.ai.model === m
                            ? 'bg-zinc-900 text-white'
                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* API Key */}
              <div>
                <label className="mb-1.5 block text-xs text-zinc-500">API Key</label>
                <input
                  value={settings.ai.apiKey}
                  onChange={(e) => {
                    updateAi({ apiKey: e.target.value })
                    setConnectionStatus('idle')
                  }}
                  type="password"
                  placeholder="sk-..."
                  className="w-full rounded-lg border-0 bg-zinc-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
                />
              </div>

              {/* Connection Test */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={testConnection}
                  disabled={testingConnection || !settings.ai.apiKey}
                  variant="outline"
                  className="gap-2"
                >
                  {testingConnection ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : connectionStatus === 'success' ? (
                    <Check size={14} className="text-emerald-500" />
                  ) : connectionStatus === 'error' ? (
                    <X size={14} className="text-red-500" />
                  ) : null}
                  测试连接
                </Button>
                {connectionStatus === 'success' && (
                  <span className="text-xs text-emerald-600">连接正常</span>
                )}
                {connectionStatus === 'error' && (
                  <span className="text-xs text-red-500">连接失败</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 高级设置 */}
        {activeTab === 'advanced' && (
          <>
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <h3 className="mb-4 text-sm font-medium text-zinc-900">
                系统参数
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs text-zinc-500">API 请求超时 (毫秒)</label>
                  <input
                    value={settings.timeout}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      if (!isNaN(val)) updateSettings({ timeout: val })
                    }}
                    type="number"
                    className="w-full rounded-lg border-0 bg-zinc-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-zinc-500">默认保存路径</label>
                  <input
                    value={settings.savePath}
                    onChange={(e) => updateSettings({ savePath: e.target.value })}
                    className="w-full rounded-lg border-0 bg-zinc-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <h3 className="mb-4 text-sm font-medium text-zinc-900">
                数据管理
              </h3>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleExport} className="flex-1">
                  导出配置
                </Button>
                <Button variant="destructive" onClick={() => setResetConfirm(true)} className="flex-1">
                  恢复出厂设置
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Reset Confirm Dialog */}
      <ConfirmDialog
        open={resetConfirm}
        onClose={() => setResetConfirm(false)}
        onConfirm={handleReset}
        title="恢复出厂设置"
        description="此操作将清除所有自定义配置，包括 API 密钥、排版设置等。此操作无法撤销，确定要继续吗？"
        confirmText="确认恢复"
        cancelText="取消"
        variant="destructive"
        icon={<AlertTriangle size={20} />}
      />
    </div>
  )
}
