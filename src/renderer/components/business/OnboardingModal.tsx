import { useState, useEffect } from 'react'
import { Rocket, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { cn } from '../../lib/cn'

export function OnboardingModal() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const settings = useAppStore((s) => s.settings)
  const updateAi = useAppStore((s) => s.updateAi)

  useEffect(() => {
    const hasOnboarded = localStorage.getItem('wordsmith-onboarded')
    if (!hasOnboarded) {
      setOpen(true)
    }
  }, [])

  const handleComplete = () => {
    localStorage.setItem('wordsmith-onboarded', 'true')
    setOpen(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <CardHeader>
          <div className="flex items-center gap-2 text-blue-600">
            <Rocket className="h-6 w-6" />
            <span className="text-sm font-bold uppercase tracking-wider">欢迎使用 WordSmith AI</span>
          </div>
          <CardTitle className="text-2xl">
            {step === 1 && '开启智能排版之旅'}
            {step === 2 && '连接 AI 大脑'}
            {step === 3 && '核心操作要领'}
            {step === 4 && '准备就绪！'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Step 1: Welcome */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-zinc-600">
                WordSmith AI 是一款专为专业文档设计的排版工具。它能将 AI 生成的内容转换为符合 <strong>Word 排版协议</strong> 的格式，完美保留公式、表格和样式。
              </p>
              <div className="rounded-xl bg-zinc-50 p-4">
                <ul className="list-disc pl-4 space-y-2 text-sm text-zinc-700">
                  <li>支持所有 OpenAI 兼容接口 (DeepSeek, Kimi, etc.)</li>
                  <li>独家 Inline CSS 守卫技术</li>
                  <li>完美渲染 LaTeX 数学公式</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 2: Configuration */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-600">
                请先配置您的 AI 服务商。不用担心，稍后可以在【设置】中随时修改。
              </p>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">API 提供商</label>
                  <select
                    className="flex h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
                    onChange={(e) => updateAi({ baseUrl: e.target.value })}
                    value={settings.ai.baseUrl}
                  >
                    <option value="https://api.deepseek.com">DeepSeek</option>
                    <option value="https://api.moonshot.cn">Moonshot (月之暗面)</option>
                    <option value="https://api.siliconflow.cn">SiliconFlow (硅基流动)</option>
                    <option value="custom">Custom (自定义)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">API Key</label>
                  <Input
                    value={settings.ai.apiKey}
                    onChange={(e) => updateAi({ apiKey: e.target.value })}
                    placeholder="sk-..."
                    type="password"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Paste Warning */}
          {step === 3 && (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <AlertTriangle size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-amber-700">至关重要的一步</h3>
                <p className="text-sm text-zinc-600">
                  为了确保样式不丢失，在 Word 中粘贴内容时，<br />
                  <span className="font-bold text-zinc-900 underline decoration-amber-500 decoration-2 underline-offset-2">
                    必须选择"保留原格式 (Keep Source Formatting)"
                  </span>
                </p>
              </div>
              <div className="rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-500">
                (通常是粘贴选项中的第一个图标 📋)
              </div>
            </div>
          )}

          {/* Step 4: Ready */}
          {step === 4 && (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                <CheckCircle2 size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-zinc-900">配置完成！</h3>
                <p className="text-zinc-600">
                  您现在可以开始创建第一个排版任务了。<br />
                  记得查看左侧的【帮助中心】获取更多技巧。
                </p>
              </div>
            </div>
          )}

          {/* Footer Navigation */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={cn(
                    'h-2 w-2 rounded-full transition-colors',
                    step === i ? 'bg-zinc-900' : 'bg-zinc-200'
                  )}
                />
              ))}
            </div>
            <div className="flex gap-2">
              {step > 1 && (
                <Button variant="ghost" onClick={() => setStep(step - 1)}>
                  上一步
                </Button>
              )}
              {step < 4 ? (
                <Button onClick={() => setStep(step + 1)}>下一步</Button>
              ) : (
                <Button onClick={handleComplete} className="bg-green-600 hover:bg-green-700 text-white">
                  开始使用
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
