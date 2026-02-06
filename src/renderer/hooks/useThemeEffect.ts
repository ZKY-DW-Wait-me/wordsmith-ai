import { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'

function getSystemIsDark(): boolean {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

export function useThemeEffect() {
  const theme = useAppStore((s) => s.settings.theme)

  useEffect(() => {
    const root = document.documentElement
    const apply = () => {
      const isDark = theme === 'dark' ? true : theme === 'light' ? false : getSystemIsDark()
      root.classList.toggle('dark', isDark)
    }

    apply()

    if (theme !== 'system') return
    const media = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!media) return
    const listener = () => apply()
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [theme])
}

