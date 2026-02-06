import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { CopyToWordButton } from '../components/business/CopyToWordButton'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { PageLayout } from '../layouts/PageLayout'
import { useAppStore } from '../store/useAppStore'
import { useI18n } from '../store/useI18nStore'

export default function HistoryPage() {
  const t = useI18n()
  const history = useAppStore((s) => s.history)
  const clearHistory = useAppStore((s) => s.clearHistory)
  const deleteHistoryItem = useAppStore((s) => s.deleteHistoryItem)
  const [search, setSearch] = useState('')

  const filtered = history.filter((item) => {
    if (!search) return true
    return item.title.toLowerCase().includes(search.toLowerCase()) || item.finalHtml.includes(search)
  })

  return (
    <PageLayout>
      <div className="mx-auto flex w-full max-w-[920px] flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">{t.history.title}</div>
            <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              {t.common.appDesc}
            </div>
          </div>
          <Button variant="secondary" onClick={() => {
            if (confirm(t.history.clearConfirm)) clearHistory()
          }} disabled={history.length === 0}>
            {t.history.clear}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder={t.common.searchPlaceholder}
            className="max-w-[300px]"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
            {t.common.noData}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="truncate">{item.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-slate-500 dark:text-slate-400">{new Date(item.createdAt).toLocaleString()}</div>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-400 hover:text-rose-500" onClick={() => {
                        if (confirm(t.history.deleteConfirm)) deleteHistoryItem(item.id)
                      }}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 gap-2">
                    <CopyToWordButton html={item.finalHtml} />
                    <details className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                      <summary className="cursor-pointer select-none">{t.history.viewSource}</summary>
                      <pre className="mt-2 max-h-[240px] overflow-auto whitespace-pre-wrap">{item.finalHtml}</pre>
                    </details>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  )
}
