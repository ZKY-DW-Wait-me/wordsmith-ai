import { Route, Routes } from 'react-router-dom'
import { useAppStore } from './store/useAppStore'
import { useEffect } from 'react'
import NewPage from './pages/New'
import HistoryPage from './pages/History'
import SettingsPage from './pages/Settings'
import TemplatesPage from './pages/Templates'
import HelpPage from './pages/Help'
import { OnboardingModal } from './components/business/OnboardingModal'

function App() {
  const theme = useAppStore((s) => s.settings.theme)
  const eyeCareMode = useAppStore((s) => s.settings.eyeCareMode)

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark', 'eye-care')

    // Handle Theme
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }

    // Handle Eye Care Mode (only effective in light mode ideally, but we apply class anyway)
    // We check if current resolved theme is light to apply eye-care fully effectively
    if (eyeCareMode) {
      root.classList.add('eye-care')
    }
  }, [theme, eyeCareMode])

  return (
    <div className="h-full w-full overflow-hidden">
      <OnboardingModal />
      <Routes>
        <Route path="/" element={<NewPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/help" element={<HelpPage />} />
      </Routes>
    </div>
  )
}

export default App
