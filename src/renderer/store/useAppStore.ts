import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AIModelConfig, PromptPreset } from '../types/ai'

export type ThemeMode = 'light' | 'dark' | 'system'

/**
 * 默认排版配置
 * 包含字体和字号信息，用于初始化编辑器和排版引擎
 */
export interface AIDefaultTypography {
  /** 字体名称 (如 "SimSun", "Microsoft YaHei") */
  fontFamily: string
  /** 字号 (以磅/pt为单位) */
  fontSizePt: number
}

export interface HistoryItem {
  id: string
  title: string
  createdAt: number
  mode: 'generate' | 'fix'
  messages: any[]
  finalHtml: string
}

/**
 * 应用全局设置
 * 存储用户偏好、AI配置、排版默认值等
 */
export interface AppSettings {
  /** 主题模式 */
  theme: ThemeMode
  /** AI 模型配置 */
  ai: AIModelConfig
  /** 默认排版参数 */
  typography: AIDefaultTypography
  /** 当前选中的模板ID */
  templateId: string
  // Advanced Settings
  /** API 请求超时时间 (毫秒) */
  timeout: number
  /** 是否开启护眼模式 */
  eyeCareMode: boolean
  /** 默认文件保存路径 */
  savePath: string
}

/**
 * 应用状态接口
 * 定义了 Zustand Store 的结构和操作方法
 */
export interface AppState {
  settings: AppSettings
  presets: PromptPreset[]
  history: HistoryItem[]
  
  /** 设置主题模式 */
  setTheme: (theme: ThemeMode) => void
  /** 更新 AI 配置 */
  updateAi: (partial: Partial<AIModelConfig>) => void
  /** 更新排版默认值 */
  updateTypography: (partial: Partial<AIDefaultTypography>) => void
  /** 设置当前模板ID */
  setTemplateId: (id: string) => void
  /** 更新通用设置 */
  updateSettings: (partial: Partial<AppSettings>) => void // Generic updater
  
  /** 添加新的提示词预设 */
  addPreset: (preset: Omit<PromptPreset, 'id'>) => void
  /** 更新现有的提示词预设 */
  updatePreset: (id: string, partial: Partial<Omit<PromptPreset, 'id'>>) => void
  /** 删除提示词预设 */
  removePreset: (id: string) => void
  
  /** 添加历史记录 */
  addHistoryItem: (item: Omit<HistoryItem, 'id' | 'createdAt'>) => void
  /** 删除单条历史记录 */
  deleteHistoryItem: (id: string) => void
  /** 清空所有历史记录 */
  clearHistory: () => void
}

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
}

/**
 * 创建应用全局 Store
 * 使用 persist 中间件实现数据持久化 (localStorage)
 */
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      settings: {
        theme: 'system',
        ai: { baseUrl: 'https://api.openai.com', apiKey: '', model: 'gpt-4o-mini' },
        typography: { fontFamily: 'SimSun', fontSizePt: 12 },
        templateId: 'default',
        timeout: 60000,
        eyeCareMode: false,
        savePath: 'My Documents/WordSmith',
      },
      presets: [
        {
          id: uid('preset'),
          name: '默认（严格协议）',
          mode: 'generate',
          userPrompt: '严格遵循排版协议输出 HTML，段落层次清晰，表格居中，必要时使用 12pt。',
        },
      ],
      history: [],

      setTheme: (theme) => set((s) => ({ settings: { ...s.settings, theme } })),
      updateAi: (partial) => set((s) => ({ settings: { ...s.settings, ai: { ...s.settings.ai, ...partial } } })),
      updateTypography: (partial) =>
        set((s) => ({ settings: { ...s.settings, typography: { ...s.settings.typography, ...partial } } })),
      setTemplateId: (id) => set((s) => ({ settings: { ...s.settings, templateId: id } })),
      updateSettings: (partial) => set((s) => ({ settings: { ...s.settings, ...partial } })),

      addPreset: (preset) => set((s) => ({ presets: [{ ...preset, id: uid('preset') }, ...s.presets] })),
      updatePreset: (id, partial) =>
        set((s) => ({
          presets: s.presets.map((p) => (p.id === id ? { ...p, ...partial } : p)),
        })),
      removePreset: (id) => set((s) => ({ presets: s.presets.filter((p) => p.id !== id) })),

      addHistoryItem: (item) =>
        set((s) => ({
          history: [
            { ...item, id: uid('history'), createdAt: Date.now() },
            ...s.history,
          ].slice(0, 50), // Limit history size
        })),
      deleteHistoryItem: (id) => set((s) => ({ history: s.history.filter((item) => item.id !== id) })),
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'wordsmith-storage',
    },
  ),
)

export function getSelectedPreset(): PromptPreset | null {
  const state = useAppStore.getState()
  return state.presets[0] ?? null
}
