import type { ChatMessage, StreamChatRequest } from '../types/ai'
import { buildSystemPrompt } from '../lib/system-prompts'

interface ChatCompletionChunk {
  choices?: Array<{
    delta?: {
      content?: string
    }
  }>
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '')
}

function buildInjectedMessages(request: StreamChatRequest): ChatMessage[] {
  const injected: ChatMessage = {
    role: 'system',
    content: buildSystemPrompt(request.mode, request.defaults),
  }
  return [injected, ...request.messages]
}

function parseSseLines(buffer: string): { events: string[]; rest: string } {
  const parts = buffer.split('\n')
  const events: string[] = []
  let current: string[] = []

  for (let i = 0; i < parts.length; i += 1) {
    const line = parts[i]
    if (line === undefined) continue

    if (line.trim() === '') {
      if (current.length) events.push(current.join('\n'))
      current = []
      continue
    }

    current.push(line)
  }

  const rest = current.length ? current.join('\n') : ''
  return { events, rest }
}

function extractDataLines(eventBlock: string): string[] {
  return eventBlock
    .split('\n')
    .map((l) => l.trimEnd())
    .filter((l) => l.startsWith('data:'))
    .map((l) => l.slice('data:'.length).trimStart())
}

export async function* streamChat(request: StreamChatRequest): AsyncGenerator<string> {
  const baseUrl = normalizeBaseUrl(request.model.baseUrl)
  const url = `${baseUrl}/v1/chat/completions`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${request.model.apiKey}`,
    },
    body: JSON.stringify({
      model: request.model.model,
      stream: true,
      messages: buildInjectedMessages(request),
    }),
    signal: request.signal,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`AI request failed: ${res.status} ${res.statusText}${text ? ` - ${text}` : ''}`)
  }

  if (!res.body) throw new Error('AI stream body is empty')

  const reader = res.body.getReader()
  const decoder = new TextDecoder('utf-8')

  let sseBuffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    if (!value) continue

    sseBuffer += decoder.decode(value, { stream: true })
    const { events, rest } = parseSseLines(sseBuffer)
    sseBuffer = rest

    for (const eventBlock of events) {
      const dataLines = extractDataLines(eventBlock)
      for (const raw of dataLines) {
        if (raw === '[DONE]') return

        let json: ChatCompletionChunk
        try {
          json = JSON.parse(raw) as ChatCompletionChunk
        } catch {
          continue
        }

        const delta = json?.choices?.[0]?.delta?.content
        if (typeof delta === 'string' && delta.length) {
          yield delta
        }
      }
    }
  }
}
