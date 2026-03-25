export type ChatRole = 'system' | 'user' | 'assistant'

export interface ChatMessage {
  role: ChatRole
  content: string
}

export type PromptMode = 'generate' | 'fix'

export interface AIDefaultTypography {
  fontFamily: string
  fontSizePt: number
}

export interface AIModelConfig {
  baseUrl: string
  apiKey: string
  model: string
}

export interface ReferenceFileInput {
  id: string
  name: string
  content: string
  uploadedAt: number
}

export interface VlmOcrConfig {
  baseUrl: string
  apiKey: string
  model: string
  systemPrompt: string
}

export interface RecentModels {
  ai: Record<string, string[]>
  vlm: Record<string, string[]>
}

export interface StreamChatRequest {
  mode: PromptMode
  model: AIModelConfig
  defaults: AIDefaultTypography
  messages: ChatMessage[]
  signal?: AbortSignal
  customInstruction?: string
  referenceFiles?: ReferenceFileInput[]
  /** 提供时直接作为请求消息，跳过 buildInjectedMessages 注入 */
  rawMessages?: ChatMessage[]
}
