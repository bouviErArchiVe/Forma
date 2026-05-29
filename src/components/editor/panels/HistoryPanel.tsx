import { useCallback, useEffect, useState } from 'react'
import { formatRelativeTime } from '../../../lib/format-relative'
import { confirm } from '../../../stores/confirmStore'
import {
  createPageSnapshot,
  deletePageSnapshot,
  listPageSnapshots,
  restorePageSnapshot,
} from '../../../services/page-snapshots'
import type { Page, PageSnapshot } from '../../../types'

interface HistoryPanelProps {
  page: Page
  onRestored: (page: Page) => void
}

export function HistoryPanel({ page, onRestored }: HistoryPanelProps) {
  const [snaps, setSnaps] = useState<PageSnapshot[]>([])
  const [label, setLabel] = useState('')
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    setSnaps(await listPageSnapshots(page.id))
  }, [page.id])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const handleSave = async () => {
    setBusy(true)
    try {
      await createPageSnapshot(page, label)
      setLabel('')
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  const handleRestore = async (id: string) => {
    if (
      !(await confirm(
        'Le contenu actuel sera remplacé. Vous pourrez annuler avec Ctrl+Z après restauration.',
        { title: 'Restaurer cette version', confirmLabel: 'Restaurer' },
      ))
    )
      return
    setBusy(true)
    try {
      const restored = await restorePageSnapshot(id)
      if (restored) onRestored(restored)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3 text-sm">
      <p className="text-forma-muted text-xs">
        Jusqu&apos;à 15 versions par page. Créez un instantané avant une grosse modification.
      </p>
      <div className="flex gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Nom (optionnel)"
          className="flex-1 border border-forma-border rounded px-2 py-1 text-xs"
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleSave()}
          className="shrink-0 px-2 py-1 bg-forma-accent text-white rounded text-xs disabled:opacity-50"
        >
          Sauver
        </button>
      </div>
      {snaps.length === 0 ? (
        <p className="text-forma-muted text-xs">Aucune version enregistrée.</p>
      ) : (
        <ul className="space-y-1 max-h-64 overflow-y-auto">
          {snaps.map((s) => (
            <li
              key={s.id}
              className="flex items-center gap-1 border border-forma-border rounded px-2 py-1.5"
            >
              <div className="flex-1 min-w-0">
                <span className="font-medium block truncate">{s.label}</span>
                <span
                  className="text-[10px] text-forma-muted"
                  title={new Date(s.createdAt).toLocaleString('fr-FR')}
                >
                  {s.data.strokes.length} traits · {formatRelativeTime(s.createdAt)}
                </span>
              </div>
              <button
                type="button"
                title="Restaurer"
                disabled={busy}
                onClick={() => void handleRestore(s.id)}
                className="text-xs px-1.5 py-0.5 rounded hover:bg-forma-accent/10"
              >
                ↩
              </button>
              <button
                type="button"
                title="Supprimer"
                disabled={busy}
                onClick={async () => {
                  await deletePageSnapshot(s.id)
                  await refresh()
                }}
                className="text-xs px-1.5 py-0.5 rounded hover:bg-red-100 text-red-600"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
