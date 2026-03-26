// 更新状态 store（非持久化，仅当前会话有效）
// dismiss 记录通过 localStorage 跨会话持久化
import { create } from 'zustand'
import type { UpdateInfo } from '../services/UpdateService'

const DISMISS_KEY = 'wordsmith-update-dismissed'
const DISMISS_EXPIRY_MS = 3 * 24 * 60 * 60 * 1000 // 3 天后重新提醒

interface DismissRecord {
  version: string
  at: number
}

/** 检查某版本是否在 3 天内被用户跳过 */
function isDismissed(version: string): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY)
    if (!raw) return false
    const record: DismissRecord = JSON.parse(raw)
    return record.version === version && (Date.now() - record.at) < DISMISS_EXPIRY_MS
  } catch {
    return false
  }
}

/** 记录用户跳过了某版本 */
function saveDismiss(version: string) {
  localStorage.setItem(DISMISS_KEY, JSON.stringify({ version, at: Date.now() }))
}

/** 清除 dismiss 记录（新版本出现时自动清除） */
function clearDismiss() {
  localStorage.removeItem(DISMISS_KEY)
}

interface UpdateState {
  updateInfo: UpdateInfo | null
  dismissed: boolean  // 当前会话是否已关闭弹窗
  /** 设置更新信息，自动判断是否应弹窗 */
  setUpdateInfo: (info: UpdateInfo | null, fromManualCheck?: boolean) => void
  /** 用户点击「稍后提醒」 */
  dismiss: () => void
}

export const useUpdateStore = create<UpdateState>((set, get) => ({
  updateInfo: null,
  dismissed: false,

  setUpdateInfo: (info, fromManualCheck = false) => {
    if (!info) {
      set({ updateInfo: null, dismissed: false })
      return
    }

    // 手动检查（设置页按钮）：总是显示最新状态，清除旧 dismiss
    if (fromManualCheck) {
      clearDismiss()
      set({ updateInfo: info, dismissed: false })
      return
    }

    // 自动检查（启动时）：如果用户 3 天内跳过了这个版本，不弹窗但仍记录信息（红点可见）
    if (isDismissed(info.version)) {
      set({ updateInfo: info, dismissed: true })
    } else {
      set({ updateInfo: info, dismissed: false })
    }
  },

  dismiss: () => {
    const { updateInfo } = get()
    if (updateInfo) {
      saveDismiss(updateInfo.version)
    }
    set({ dismissed: true })
  },
}))
