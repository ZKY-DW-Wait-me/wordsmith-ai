import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AIModelConfig, ChatMessage, PromptMode } from '../types/ai'
import type { ReferenceFile } from '../lib/hidden-protocol'
import type { GuardReport } from '../types/guard'

/**
 * 默认排版配置
 */
export interface AIDefaultTypography {
  fontFamily: string
  fontSizePt: number
}

/**
 * 增强的聊天消息，包含 Debug 信息
 */
export interface EnhancedChatMessage extends ChatMessage {
  rawRequest?: string  // 发给 AI 的完整 Prompt
  rawResponse?: string // AI 返回的完整原始文本
}

/**
 * 历史记录项
 */
export interface HistoryItem {
  id: string
  title: string
  createdAt: number
  mode: PromptMode
  messages: EnhancedChatMessage[]
  finalHtml: string
}

export { type ReferenceFile } from '../lib/hidden-protocol'

/**
 * 工作区状态（当前编辑会话）
 */
export interface WorkspaceState {
  id: string | null  // 当前对话 ID，null 表示新对话
  htmlDraft: string
  finalHtml: string
  messages: EnhancedChatMessage[]
  guardReport: GuardReport | null
  mode: PromptMode
  input: string
  streaming: boolean
}

/**
 * 应用全局设置
 */
export interface AppSettings {
  ai: AIModelConfig
  typography: AIDefaultTypography
  templateId: string
  timeout: number
  eyeCareMode: boolean
  savePath: string
}

/**
 * 应用状态接口
 */
export interface AppState {
  settings: AppSettings
  history: HistoryItem[]
  customInstruction: string
  referenceFiles: ReferenceFile[]
  workspace: WorkspaceState

  updateAi: (partial: Partial<AIModelConfig>) => void
  updateTypography: (partial: Partial<AIDefaultTypography>) => void
  setTemplateId: (id: string) => void
  updateSettings: (partial: Partial<AppSettings>) => void

  addHistoryItem: (item: Omit<HistoryItem, 'id' | 'createdAt'>) => string
  updateHistoryItem: (id: string, partial: Partial<Omit<HistoryItem, 'id' | 'createdAt'>>) => void
  deleteHistoryItem: (id: string) => void
  clearHistory: () => void

  setCustomInstruction: (instruction: string) => void
  addReferenceFile: (file: Omit<ReferenceFile, 'id' | 'uploadedAt'>) => void
  removeReferenceFile: (id: string) => void
  clearReferenceFiles: () => void

  // 工作区操作
  updateWorkspace: (partial: Partial<WorkspaceState>) => void
  setWorkspaceMessages: (messages: EnhancedChatMessage[]) => void
  clearWorkspace: () => void

  // 多对话管理
  createNewChat: () => void
  loadChat: (historyId: string) => boolean
}

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
}

const DEFAULT_HTML = `<body style="margin:0; padding:0; font-family:'SimSun'; font-size:12pt;">
  <p style="margin:0 0 12pt 0;">在中间输入您的需求，AI 将生成符合 Word 排版规范的 HTML 内容。</p>
</body>`

const defaultWorkspace: WorkspaceState = {
  id: null,
  htmlDraft: DEFAULT_HTML,
  finalHtml: DEFAULT_HTML,
  messages: [],
  guardReport: null,
  mode: 'generate',
  input: '',
  streaming: false,
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      settings: {
        ai: { baseUrl: 'https://api.deepseek.com', apiKey: '', model: 'deepseek-chat' },
        typography: { fontFamily: 'SimSun', fontSizePt: 12 },
        templateId: 'default',
        timeout: 60000,
        eyeCareMode: false,
        savePath: 'My Documents/WordSmith',
      },
      history: [],
      customInstruction: '',
      referenceFiles: [],
      workspace: defaultWorkspace,

      updateAi: (partial) => set((s) => ({ settings: { ...s.settings, ai: { ...s.settings.ai, ...partial } } })),
      updateTypography: (partial) =>
        set((s) => ({ settings: { ...s.settings, typography: { ...s.settings.typography, ...partial } } })),
      setTemplateId: (id) => set((s) => ({ settings: { ...s.settings, templateId: id } })),
      updateSettings: (partial) => set((s) => ({ settings: { ...s.settings, ...partial } })),

      addHistoryItem: (item) => {
        const id = uid('history')
        set((s) => ({
          history: [
            { ...item, id, createdAt: Date.now() },
            ...s.history,
          ].slice(0, 50),
          workspace: { ...s.workspace, id },
        }))
        return id
      },
      updateHistoryItem: (id, partial) =>
        set((s) => ({
          history: s.history.map((item) =>
            item.id === id ? { ...item, ...partial } : item
          ),
        })),
      deleteHistoryItem: (id) => set((s) => ({ history: s.history.filter((item) => item.id !== id) })),
      clearHistory: () => set({ history: [] }),

      setCustomInstruction: (instruction) => set({ customInstruction: instruction }),
      addReferenceFile: (file) =>
        set((s) => ({
          referenceFiles: [
            ...s.referenceFiles,
            { ...file, id: uid('ref'), uploadedAt: Date.now() },
          ].slice(0, 10),
        })),
      removeReferenceFile: (id) => set((s) => ({ referenceFiles: s.referenceFiles.filter((f) => f.id !== id) })),
      clearReferenceFiles: () => set({ referenceFiles: [] }),

      // 工作区操作
      updateWorkspace: (partial) => set((s) => ({ workspace: { ...s.workspace, ...partial } })),
      setWorkspaceMessages: (messages) => set((s) => ({ workspace: { ...s.workspace, messages } })),
      clearWorkspace: () => set({ workspace: defaultWorkspace }),

      // 多对话管理
      createNewChat: () => set({ workspace: defaultWorkspace }),
      loadChat: (historyId: string) => {
        const state = get()
        const historyItem = state.history.find((item) => item.id === historyId)
        if (!historyItem) return false

        set({
          workspace: {
            id: historyItem.id,
            htmlDraft: historyItem.finalHtml,
            finalHtml: historyItem.finalHtml,
            messages: historyItem.messages,
            guardReport: null,
            mode: historyItem.mode,
            input: '',
            streaming: false,
          },
        })
        return true
      },
    }),
    {
      name: 'wordsmith-storage',
      partialize: (state) => ({
        settings: state.settings,
        history: state.history,
        customInstruction: state.customInstruction,
        referenceFiles: state.referenceFiles,
        workspace: state.workspace,
      }),
    },
  ),
)
