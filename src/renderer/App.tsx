import { Route, Routes } from 'react-router-dom'
import { useAppStore } from './store/useAppStore'
import { useEffect } from 'react'
import NewPage from './pages/New'
import HistoryPage from './pages/History'
import SettingsPage from './pages/Settings'
import HelpPage from './pages/Help'
import { OnboardingModal } from './components/business/OnboardingModal'
import { Toaster } from './components/ui/Toaster'
import { GlobalSidebar } from './components/business/GlobalSidebar'
import { PageLayout } from './layouts/PageLayout'

function App() {
  const eyeCareMode = useAppStore((s) => s.settings.eyeCareMode)

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('eye-care')
    if (eyeCareMode) {
      root.classList.add('eye-care')
    }
  }, [eyeCareMode])

  return (
    <div className="flex h-full w-full bg-zinc-50">
      <OnboardingModal />
      <Toaster />

      {/* Global Navigation Sidebar - extends to top */}
      <GlobalSidebar />

      {/* Main Content Area */}
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <Routes>
          <Route path="/" element={<NewPage />} />
          <Route path="/history" element={<PageLayout><HistoryPage /></PageLayout>} />
          <Route path="/settings" element={<PageLayout><SettingsPage /></PageLayout>} />
          <Route path="/help" element={<PageLayout><HelpPage /></PageLayout>} />
        </Routes>
      </div>
    </div>
  )
}

export default App
