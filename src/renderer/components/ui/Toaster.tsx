import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react'
import { useToastStore, type Toast } from '../../store/useToastStore'
import { cn } from '../../lib/cn'

const ICONS = {
  default: Info,
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  destructive: AlertCircle,
}

const VARIANTS = {
  default: 'border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100',
  info: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100',
  success: 'border-green-200 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100',
  warning: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100',
  destructive: 'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100',
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [progress, setProgress] = useState(100)
  const [paused, setPaused] = useState(false)
  const Icon = ICONS[toast.variant || 'default']

  useEffect(() => {
    if (toast.duration === Infinity) return

    const duration = toast.duration || 5000
    const interval = 50
    const step = (interval / duration) * 100

    const timer = setInterval(() => {
      if (!paused) {
        setProgress((p) => Math.max(0, p - step))
      }
    }, interval)

    return () => clearInterval(timer)
  }, [toast.duration, paused])

  return (
    <div
      className={cn(
        'relative flex w-[360px] items-start gap-3 rounded-xl border p-4 shadow-lg transition-all animate-in slide-in-from-right-full',
        VARIANTS[toast.variant || 'default'],
      )}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      
      <div className="flex-1 space-y-1">
        {toast.title && <div className="font-semibold leading-none tracking-tight">{toast.title}</div>}
        {toast.description && <div className="text-sm opacity-90">{toast.description}</div>}
      </div>

      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded-md p-1 opacity-60 hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
      >
        <X size={16} />
      </button>

      {/* Progress Bar */}
      {toast.duration !== Infinity && (
        <div className="absolute bottom-0 left-0 h-1 w-full overflow-hidden rounded-b-xl">
          <div
            className="h-full bg-current opacity-20 transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismissToast)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 outline-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
      ))}
    </div>
  )
}
