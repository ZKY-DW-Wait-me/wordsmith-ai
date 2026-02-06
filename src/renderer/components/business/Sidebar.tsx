import { Link, useLocation } from 'react-router-dom'
import { BookTemplate, Clock, FilePlus2, HelpCircle, Settings } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useI18n } from '../../store/useI18nStore'

export function Sidebar() {
  const location = useLocation()
  const t = useI18n()

  const NAV = [
    { to: '/', label: t.nav.new, icon: FilePlus2 },
    { to: '/history', label: t.nav.history, icon: Clock },
    { to: '/templates', label: t.nav.templates, icon: BookTemplate },
    { to: '/settings', label: t.nav.settings, icon: Settings },
    { to: '/help', label: '帮助中心', icon: HelpCircle },
  ]

  return (
    <aside className="flex h-full w-[200px] shrink-0 flex-col border-r border-slate-200 bg-white px-3 py-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="px-2 pb-4">
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t.common.appName}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400">{t.common.appDesc.split(' - ')[0]}</div>
      </div>
      <nav className="space-y-1">
        {NAV.map((item) => {
          const active = location.pathname === item.to
          const Icon = item.icon
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900',
                active && 'bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-white',
              )}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="mt-auto px-2 pt-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          {t.nav.workflow}
        </div>
      </div>
    </aside>
  )
}

