import type { ReactNode } from 'react'

export function PageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-full w-full overflow-auto bg-white p-6">
      {children}
    </div>
  )
}
