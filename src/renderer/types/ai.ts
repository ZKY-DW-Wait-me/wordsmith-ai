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

export interface PromptPreset {
  id: string
  name: string
  mode: PromptMode
  userPrompt: string
}

export interface StreamChatRequest {
  mode: PromptMode
  model: AIModelConfig
  defaults: AIDefaultTypography
  messages: ChatMessage[]
  signal?: AbortSignal
}

