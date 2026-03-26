// 更新状态 store（非持久化，仅当前会话有效）
import { create } from 'zustand'
import type { UpdateInfo } from '../services/UpdateService'

interface UpdateState {
  updateInfo: UpdateInfo | null
  dismissed: boolean  // 用户关闭了弹窗，但红点仍显示
  setUpdateInfo: (info: UpdateInfo | null) => void
  dismiss: () => void
}

export const useUpdateStore = create<UpdateState>((set) => ({
  updateInfo: null,
  dismissed: false,
  setUpdateInfo: (info) => set({ updateInfo: info, dismissed: false }),
  dismiss: () => set({ dismissed: true }),
}))
