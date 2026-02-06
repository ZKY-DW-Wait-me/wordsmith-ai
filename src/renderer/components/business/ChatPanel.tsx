import { useMemo, useRef, useEffect, useState, type ReactNode } from 'react'
import { Send, Square, Sparkles, Wrench, Bug, X } from 'lucide-react'
import type { PromptMode, ReferenceFileInput } from '../../types/ai'
import type { GuardReport } from '../../types/guard'
import { guardHtml } from '../../lib/protocol-guard'
import { streamChat, getFullPromptForDebug } from '../../services/ai-service'
import { errorHandler } from '../../services/ErrorHandler'
import { logger } from '../../services/LoggerService'
import { useI18n } from '../../store/useI18nStore'
import { useAppStore, type EnhancedChatMessage } from '../../store/useAppStore'
import { Button } from '../ui/button'

export interface ChatPanelProps {
  baseUrl: string
  apiKey: string
  model: string
  defaults: { fontFamily: string; fontSizePt: number }
  customInstruction?: string
  referenceFiles?: ReferenceFileInput[]
  htmlDraft: string
  onHtmlFinalized: (html: string, report: GuardReport, payload: { mode: PromptMode; messages: EnhancedChatMessage[] }) => void
  emptyState?: ReactNode
}

export function ChatPanel({ baseUrl, apiKey, model, defaults, customInstruction, referenceFiles, htmlDraft, onHtmlFinalized, emptyState }: ChatPanelProps) {
  const t = useI18n()

  // 使用全局状态
  const workspace = useAppStore((s) => s.workspace)
  const updateWorkspace = useAppStore((s) => s.updateWorkspace)
  const setWorkspaceMessages = useAppStore((s) => s.setWorkspaceMessages)

  const { mode, input, messages, streaming } = workspace
  const abortRef = useRef<AbortController | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Debug Modal 状态
  const [debugModal, setDebugModal] = useState<{ open: boolean; content: string }>({ open: false, content: '' })

  const canSend = useMemo(() => {
    if (streaming) return false
    if (!baseUrl || !model) return false
    if (mode === 'generate') return input.trim().length > 0
    return htmlDraft.trim().length > 0
  }, [baseUrl, model, mode, input, htmlDraft, streaming])

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const setMode = (newMode: PromptMode) => updateWorkspace({ mode: newMode })
  const setInput = (newInput: string) => updateWorkspace({ input: newInput })
  const setStreaming = (value: boolean) => updateWorkspace({ streaming: value })

  const stop = () => {
    abortRef.current?.abort()
    abortRef.current = null
    setStreaming(false)
  }

  const showDebug = (msg: EnhancedChatMessage) => {
    const content = msg.rawRequest || '无 Debug 信息'
    setDebugModal({ open: true, content })
  }

  const send = async () => {
    const controller = new AbortController()
    abortRef.current = controller
    setStreaming(true)

    const userText = mode === 'generate' ? input.trim() : htmlDraft.trim()
    const nextMessages: EnhancedChatMessage[] = [
      ...messages,
      { role: 'user', content: userText },
      { role: 'assistant', content: '' },
    ]
    setWorkspaceMessages(nextMessages)
    setInput('')

    logger.action('ChatPanel', 'Start generation', { mode, model })

    // 获取完整的请求 Prompt 用于 Debug
    const rawRequest = getFullPromptForDebug(
      {
        mode,
        model: { baseUrl, apiKey, model },
        defaults,
        messages: nextMessages.slice(0, -1),
      },
      customInstruction,
      referenceFiles
    )

    try {
      let assistantText = ''
      const stream = streamChat({
        mode,
        model: { baseUrl, apiKey, model },
        defaults,
        messages: nextMessages.slice(0, -1),
        signal: controller.signal,
        customInstruction,
        referenceFiles,
      })

      for await (const delta of stream) {
        assistantText += delta
        setWorkspaceMessages([
          ...nextMessages.slice(0, -1),
          { role: 'assistant', content: assistantText },
        ])
      }

      const guarded = guardHtml(assistantText, defaults)
      const finishedMessages: EnhancedChatMessage[] = [
        ...nextMessages.slice(0, -1),
        { role: 'assistant', content: assistantText, rawRequest, rawResponse: assistantText },
      ]
      setWorkspaceMessages(finishedMessages)
      onHtmlFinalized(guarded.html, guarded.report, { mode, messages: finishedMessages })
      logger.info('ChatPanel', 'Generation success', { length: assistantText.length })
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        logger.info('ChatPanel', 'Generation aborted')
      } else {
        errorHandler.handle(e, 'api')
      }
    } finally {
      setStreaming(false)
      abortRef.current = null
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && canSend && apiKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages Area */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (
          emptyState || (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-2xl bg-zinc-100 p-4">
                <Sparkles className="h-8 w-8 text-zinc-400" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-zinc-700">
                开始创作
              </h3>
              <p className="max-w-sm text-sm text-zinc-500">
                {t.chat.emptyTip}
              </p>
            </div>
          )
        ) : (
          <div className="space-y-4">
            {messages
              .filter((m) => m.role === 'user' || m.role === 'assistant')
              .map((m, idx) => (
                <div
                  key={idx}
                  className={`flex animate-fade-in-up ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex items-start gap-2">
                    {m.role === 'assistant' && m.rawRequest && (
                      <button
                        onClick={() => showDebug(m)}
                        className="mt-2 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
                        title="查看 Debug 信息"
                      >
                        <Bug size={14} />
                      </button>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        m.role === 'user'
                          ? 'bg-gradient-to-br from-zinc-800 to-zinc-900 text-white'
                          : 'bg-zinc-100/80 text-zinc-800'
                      }`}
                    >
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {m.content || (streaming && m.role === 'assistant' ? (
                          <span className="inline-flex items-center gap-1 text-zinc-400">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" style={{ animationDelay: '0.2s' }} />
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" style={{ animationDelay: '0.4s' }} />
                          </span>
                        ) : null)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Floating Input Area */}
      <div className="shrink-0 p-4">
        <div className="mx-auto max-w-3xl">
          {/* Mode Toggle */}
          <div className="mb-3 flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant={mode === 'generate' ? 'default' : 'ghost'}
              onClick={() => setMode('generate')}
              disabled={streaming}
              className="gap-1.5"
            >
              <Sparkles size={14} />
              {t.chat.generate}
            </Button>
            <Button
              size="sm"
              variant={mode === 'fix' ? 'default' : 'ghost'}
              onClick={() => setMode('fix')}
              disabled={streaming}
              className="gap-1.5"
            >
              <Wrench size={14} />
              {t.chat.fix}
            </Button>
          </div>

          {/* Input Container */}
          <div className="relative rounded-2xl bg-zinc-100/80 p-1.5 shadow-lg ring-1 ring-zinc-200/50 backdrop-blur-sm">
            <div className="flex items-end gap-2">
              <textarea
                value={mode === 'generate' ? input : (mode === 'fix' ? t.chat.placeholderFix : '')}
                onChange={(e) => mode === 'generate' && setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={mode === 'generate' ? t.chat.placeholder : ''}
                disabled={streaming || mode === 'fix'}
                rows={1}
                className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                style={{ height: 'auto' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = 'auto'
                  target.style.height = Math.min(target.scrollHeight, 128) + 'px'
                }}
              />
              {streaming ? (
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={stop}
                  className="mb-1.5 mr-1.5 shrink-0"
                >
                  <Square size={16} />
                </Button>
              ) : (
                <Button
                  size="icon"
                  onClick={send}
                  disabled={!canSend || !apiKey}
                  className="mb-1.5 mr-1.5 shrink-0"
                >
                  <Send size={16} />
                </Button>
              )}
            </div>
          </div>

          {/* Status */}
          {!apiKey && (
            <p className="mt-2 text-center text-xs text-zinc-500">
              {t.chat.noApiKey}
            </p>
          )}
          {streaming && (
            <p className="mt-2 text-center text-xs text-zinc-500">
              正在生成中...
            </p>
          )}
        </div>
      </div>

      {/* Debug Modal */}
      {debugModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[80vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-6 py-4">
              <div className="flex items-center gap-2">
                <Bug size={18} className="text-zinc-500" />
                <h2 className="text-lg font-semibold text-zinc-900">Debug: 完整请求内容</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setDebugModal({ open: false, content: '' })}>
                <X size={18} />
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-6">
              <pre className="whitespace-pre-wrap rounded-xl bg-zinc-900 p-4 font-mono text-xs leading-relaxed text-zinc-300">
                {debugModal.content}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
