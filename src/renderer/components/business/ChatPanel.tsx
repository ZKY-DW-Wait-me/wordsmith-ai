import { useMemo, useRef, useState } from 'react'
import { Send, Square } from 'lucide-react'
import type { ChatMessage, PromptMode } from '../../types/ai'
import type { GuardReport } from '../../types/guard'
import { guardHtml } from '../../lib/protocol-guard'
import { streamChat } from '../../services/ai-service'
import { errorHandler } from '../../services/ErrorHandler'
import { logger } from '../../services/LoggerService'
import { useI18n } from '../../store/useI18nStore'
import { Button } from '../ui/button'
import { CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'

export interface ChatPanelProps {
  baseUrl: string
  apiKey: string
  model: string
  defaults: { fontFamily: string; fontSizePt: number }
  presetPrompt?: string
  htmlDraft: string
  onHtmlFinalized: (html: string, report: GuardReport, payload: { mode: PromptMode; messages: ChatMessage[] }) => void
}

export function ChatPanel({ baseUrl, apiKey, model, defaults, presetPrompt, htmlDraft, onHtmlFinalized }: ChatPanelProps) {
  const t = useI18n()
  const [mode, setMode] = useState<PromptMode>('generate')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Array<ChatMessage>>([])
  const [streaming, setStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const canSend = useMemo(() => {
    if (streaming) return false
    if (!baseUrl || !model) return false
    if (mode === 'generate') return input.trim().length > 0
    return htmlDraft.trim().length > 0
  }, [baseUrl, model, mode, input, htmlDraft, streaming])

  const stop = () => {
    abortRef.current?.abort()
    abortRef.current = null
  }

  const send = async () => {
    const controller = new AbortController()
    abortRef.current = controller
    setStreaming(true)

    const userText = mode === 'generate' ? input.trim() : htmlDraft.trim()
    const seed: ChatMessage[] = messages.length === 0 && presetPrompt ? [{ role: 'system', content: presetPrompt }] : []
    const nextMessages: ChatMessage[] = [
      ...seed,
      ...messages,
      { role: 'user', content: userText },
      { role: 'assistant', content: '' },
    ]
    setMessages(nextMessages)

    logger.action('ChatPanel', 'Start generation', { mode, model })

    try {
      let assistantText = ''
      const stream = streamChat({
        mode,
        model: { baseUrl, apiKey, model },
        defaults,
        messages: nextMessages.slice(0, -1),
        signal: controller.signal,
      })

      // Use error handler wrapper but we need to iterate manually for streaming
      for await (const delta of stream) {
        assistantText += delta
        setMessages((prev) => {
          const cloned = prev.slice()
          const last = cloned[cloned.length - 1]
          if (!last || last.role !== 'assistant') return prev
          cloned[cloned.length - 1] = { ...last, content: assistantText }
          return cloned
        })
      }

      const guarded = guardHtml(assistantText, defaults)
      const finishedMessages: ChatMessage[] = [...nextMessages.slice(0, -1), { role: 'assistant', content: assistantText }]
      onHtmlFinalized(guarded.html, guarded.report, { mode, messages: finishedMessages })
      setInput('')
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

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 pb-3">
        <CardHeader className="p-0">
          <div className="flex items-center justify-between gap-3">
            <CardTitle>{t.chat.title}</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={mode === 'generate' ? 'default' : 'secondary'}
                onClick={() => setMode('generate')}
                disabled={streaming}
              >
                {t.chat.generate}
              </Button>
              <Button size="sm" variant={mode === 'fix' ? 'default' : 'secondary'} onClick={() => setMode('fix')} disabled={streaming}>
                {t.chat.fix}
              </Button>
            </div>
          </div>
        </CardHeader>
      </div>
      
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex-1 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="text-xs text-slate-500 dark:text-slate-400">{t.chat.emptyTip}</div>
            ) : null}
            {messages
              .filter((m) => m.role === 'user' || m.role === 'assistant')
              .map((m, idx) => {
                const isUser = m.role === 'user'
                return (
                  <div key={idx} className={isUser ? 'flex justify-end' : 'flex justify-start'}>
                    <div
                      className={
                        isUser
                          ? 'max-w-[90%] rounded-xl bg-slate-900 px-3 py-2 text-xs text-white dark:bg-slate-100 dark:text-slate-900'
                          : 'max-w-[90%] rounded-xl bg-white px-3 py-2 text-xs text-slate-800 dark:bg-slate-950 dark:text-slate-100'
                      }
                    >
                      <pre className="whitespace-pre-wrap font-sans">{m.content}</pre>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>

        <div className="flex shrink-0 items-end gap-2 pb-1">
          {mode === 'generate' ? (
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.chat.placeholder}
              disabled={streaming}
              className="max-h-[120px] min-h-[40px]"
            />
          ) : (
            <Input value={t.chat.placeholderFix} readOnly />
          )}

          {streaming ? (
            <Button variant="destructive" onClick={stop} className="shrink-0">
              <Square size={16} />
            </Button>
          ) : (
            <Button onClick={send} disabled={!canSend || !apiKey} className="shrink-0">
              <Send size={16} />
            </Button>
          )}
        </div>

        {!apiKey ? <div className="text-xs text-slate-500 dark:text-slate-400">{t.chat.noApiKey}</div> : null}
      </div>
    </div>
  )
}
