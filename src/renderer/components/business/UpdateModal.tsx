import type { UpdateInfo } from '../../services/UpdateService'
import { useI18nStore } from '../../store/useI18nStore'
import { Dialog, DialogHeader, DialogTitle, DialogClose, DialogContent, DialogFooter } from '../ui/Dialog'
import { Button } from '../ui/button'
import { Download, AlertTriangle } from 'lucide-react'

interface UpdateModalProps {
  info: UpdateInfo
  onClose: () => void
}

export function UpdateModal({ info, onClose }: UpdateModalProps) {
  const t = useI18nStore((s) => s.t())

  const handleDownload = () => {
    window.open(info.update_url, '_blank')
    onClose()
  }

  return (
    <Dialog open onClose={onClose} className="max-w-md">
      <DialogHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600">
            <Download size={20} />
          </div>
          <DialogTitle>{t.update.title}</DialogTitle>
        </div>
        <DialogClose onClose={onClose} />
      </DialogHeader>

      <DialogContent>
        <div className="space-y-3">
          {/* 版本信息 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500">{t.update.newVersion}</span>
            <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-sm font-semibold text-violet-700">
              v{info.version}
            </span>
            <span className="text-xs text-zinc-400">{info.date}</span>
          </div>

          {/* 更新日志 */}
          <div className="rounded-lg bg-zinc-50 p-3">
            <p className="mb-1 text-xs font-medium text-zinc-500">{t.update.changelog}</p>
            <p className="whitespace-pre-wrap text-sm text-zinc-700">{info.changelog}</p>
          </div>

          {/* OCR 警告 */}
          {info.ocrchange === '1' && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-500" />
              <p className="text-sm text-amber-700">{t.update.ocrWarning}</p>
            </div>
          )}
        </div>
      </DialogContent>

      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          {t.update.later}
        </Button>
        <Button onClick={handleDownload}>
          {t.update.download}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
