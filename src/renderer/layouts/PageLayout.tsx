import type { ReactNode } from 'react'
import { Sidebar } from '../components/business/Sidebar'

export function PageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-full w-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex h-full">
        <Sidebar />
        <main className="h-full flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}

