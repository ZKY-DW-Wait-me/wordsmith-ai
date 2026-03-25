import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AIModelConfig, ChatMessage, PinnedRound, PromptMode, RecentModels, VlmOcrConfig } from '../types/ai'
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
  // key=轮次索引, true=强制包含(窗口外), false=强制排除(窗口内)
  roundOverrides: Record<number, boolean>
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
  ocrEnginePath: string | null
  ocrMode: 'vlm' | 'local'
  vlmOcr: VlmOcrConfig
  recentModels: RecentModels
  providerApiKeys: Record<string, string>
  acceleratorPath: string | null
  contextMaxRounds: number
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
  pinnedRounds: PinnedRound[]

  updateAi: (partial: Partial<AIModelConfig>) => void
  updateTypography: (partial: Partial<AIDefaultTypography>) => void
  updateVlmOcr: (partial: Partial<VlmOcrConfig>) => void
  setTemplateId: (id: string) => void
  updateSettings: (partial: Partial<AppSettings>) => void
  addRecentModel: (context: 'ai' | 'vlm', baseUrl: string, model: string) => void
  removeRecentModel: (context: 'ai' | 'vlm', baseUrl: string, model: string) => void

  addHistoryItem: (item: Omit<HistoryItem, 'id' | 'createdAt'>) => string
  updateHistoryItem: (id: string, partial: Partial<Omit<HistoryItem, 'id' | 'createdAt'>>) => void
  deleteHistoryItem: (id: string) => void
  clearHistory: () => void

  setCustomInstruction: (instruction: string) => void
  addReferenceFile: (file: Omit<ReferenceFile, 'id' | 'uploadedAt'>) => void
  updateReferenceFile: (id: string, content: string) => void
  removeReferenceFile: (id: string) => void
  clearReferenceFiles: () => void

  // 工作区操作
  updateWorkspace: (partial: Partial<WorkspaceState>) => void
  setWorkspaceMessages: (messages: EnhancedChatMessage[]) => void
  clearWorkspace: () => void

  // 多对话管理
  createNewChat: () => void
  loadChat: (historyId: string) => boolean

  // 上下文控制
  toggleRoundOverride: (roundIndex: number) => void
  addPinnedRound: (round: Omit<PinnedRound, 'id' | 'pinnedAt'>) => boolean
  removePinnedRound: (id: string) => void
  clearPinnedRounds: () => void
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
  roundOverrides: {},
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
        ocrEnginePath: null,
        ocrMode: 'vlm',
        vlmOcr: { baseUrl: '', apiKey: '', model: '', systemPrompt: '' },
        recentModels: { ai: {}, vlm: {} },
        providerApiKeys: {},
        acceleratorPath: null,
        contextMaxRounds: 10,
      },
      history: [],
      customInstruction: '',
      referenceFiles: [],
      workspace: defaultWorkspace,
      pinnedRounds: [],

      updateAi: (partial) =>
        set((s) => {
          const current = s.settings.ai
          const newKeys = { ...s.settings.providerApiKeys }
          const merged = { ...partial }

          // 切换提供商时：保存当前 key，恢复目标提供商的 key
          if (merged.baseUrl && merged.baseUrl !== current.baseUrl) {
            newKeys[current.baseUrl] = current.apiKey
            if (!('apiKey' in merged)) {
              merged.apiKey = newKeys[merged.baseUrl] || ''
            }
          }

          // apiKey 变化时，存入 providerApiKeys
          if ('apiKey' in merged) {
            const targetUrl = merged.baseUrl || current.baseUrl
            newKeys[targetUrl] = merged.apiKey || ''
          }

          return {
            settings: {
              ...s.settings,
              ai: { ...current, ...merged },
              providerApiKeys: newKeys,
            },
          }
        }),
      updateTypography: (partial) =>
        set((s) => ({ settings: { ...s.settings, typography: { ...s.settings.typography, ...partial } } })),
      updateVlmOcr: (partial) =>
        set((s) => {
          const current = s.settings.vlmOcr
          const newKeys = { ...s.settings.providerApiKeys }
          const merged = { ...partial }

          // 切换 VLM 提供商时：保存当前 key，恢复目标提供商的 key
          if (merged.baseUrl && merged.baseUrl !== current.baseUrl) {
            newKeys[current.baseUrl] = current.apiKey
            if (!('apiKey' in merged)) {
              merged.apiKey = newKeys[merged.baseUrl] || ''
            }
          }

          if ('apiKey' in merged) {
            const targetUrl = merged.baseUrl || current.baseUrl
            newKeys[targetUrl] = merged.apiKey || ''
          }

          return {
            settings: {
              ...s.settings,
              vlmOcr: { ...current, ...merged },
              providerApiKeys: newKeys,
            },
          }
        }),
      setTemplateId: (id) => set((s) => ({ settings: { ...s.settings, templateId: id } })),
      updateSettings: (partial) => set((s) => ({ settings: { ...s.settings, ...partial } })),
      addRecentModel: (context, baseUrl, model) =>
        set((s) => {
          const bucket = s.settings.recentModels[context]
          const list = bucket[baseUrl] || []
          const updated = [model, ...list.filter((m) => m !== model)].slice(0, 5)
          return {
            settings: {
              ...s.settings,
              recentModels: {
                ...s.settings.recentModels,
                [context]: { ...bucket, [baseUrl]: updated },
              },
            },
          }
        }),
      removeRecentModel: (context, baseUrl, model) =>
        set((s) => {
          const bucket = s.settings.recentModels[context]
          const list = bucket[baseUrl] || []
          const updated = list.filter((m) => m !== model)
          return {
            settings: {
              ...s.settings,
              recentModels: {
                ...s.settings.recentModels,
                [context]: { ...bucket, [baseUrl]: updated },
              },
            },
          }
        }),

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
      updateReferenceFile: (id, content) =>
        set((s) => ({
          referenceFiles: s.referenceFiles.map((f) =>
            f.id === id ? { ...f, content } : f
          ),
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
            roundOverrides: {},
          },
        })
        return true
      },

      // 上下文控制
      toggleRoundOverride: (roundIndex: number) =>
        set((s) => {
          const overrides = { ...s.workspace.roundOverrides }
          if (roundIndex in overrides) {
            delete overrides[roundIndex]
          } else {
            // 计算当前轮次总数
            const totalRounds = Math.floor(
              s.workspace.messages.filter((m) => m.role === 'user' || m.role === 'assistant').length / 2
            )
            const windowStart = Math.max(0, totalRounds - s.settings.contextMaxRounds)
            const inWindow = s.settings.contextMaxRounds === 0 || roundIndex >= windowStart
            // 窗口内默认包含 → 设为 false 排除；窗口外默认排除 → 设为 true 包含
            overrides[roundIndex] = !inWindow
          }
          return { workspace: { ...s.workspace, roundOverrides: overrides } }
        }),

      addPinnedRound: (round) => {
        const state = get()
        if (state.pinnedRounds.length >= 10) return false
        set({
          pinnedRounds: [
            ...state.pinnedRounds,
            { ...round, id: uid('pin'), pinnedAt: Date.now() },
          ],
        })
        return true
      },

      removePinnedRound: (id) =>
        set((s) => ({
          pinnedRounds: s.pinnedRounds.filter((p) => p.id !== id),
        })),

      clearPinnedRounds: () => set({ pinnedRounds: [] }),
    }),
    {
      name: 'wordsmith-storage',
      partialize: (state) => ({
        settings: state.settings,
        history: state.history,
        customInstruction: state.customInstruction,
        referenceFiles: state.referenceFiles,
        workspace: state.workspace,
        pinnedRounds: state.pinnedRounds,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<AppState>
        const merged = { ...current, ...p }
        // 深合并 settings，确保老用户升级后新增字段有默认值
        if (p.settings) {
          merged.settings = {
            ...(current as AppState).settings,
            ...p.settings,
            vlmOcr: {
              ...(current as AppState).settings.vlmOcr,
              ...(p.settings.vlmOcr || {}),
            },
            recentModels: {
              ...(current as AppState).settings.recentModels,
              ...( // 兼容老格式：如果 persisted 是数组就丢弃，只接受对象
                p.settings.recentModels &&
                typeof p.settings.recentModels.ai === 'object' &&
                !Array.isArray(p.settings.recentModels.ai)
                  ? p.settings.recentModels
                  : {}
              ),
            },
            providerApiKeys: {
              ...(current as AppState).settings.providerApiKeys,
              ...(p.settings.providerApiKeys || {}),
            },
          }
        }
        // 兼容老用户 workspace 中没有 roundOverrides 的情况
        if (p.workspace && !('roundOverrides' in p.workspace)) {
          (merged as AppState).workspace.roundOverrides = {}
        }
        return merged as AppState
      },
    },
  ),
)
