import { useEffect, useState } from 'react'
import { getAllNotebooks } from '../../services/library'
import { movePageToNotebook } from '../../services/pages'
import type { Notebook, Page } from '../../types'

interface MovePageModalProps {
  page: Page
  onClose: () => void
  onMoved: (targetNotebookId: string) => void
}

export function MovePageModal({ page, onClose, onMoved }: MovePageModalProps) {
  const [list, setList] = useState<Notebook[]>([])
  const [targetId, setTargetId] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    getAllNotebooks().then((all) => {
      const filtered = all.filter((nb) => !nb.deletedAt && nb.id !== page.notebookId)
      setList(filtered.sort((a, b) => a.name.localeCompare(b.name, 'fr')))
      if (filtered[0]) setTargetId(filtered[0].id)
    })
  }, [page.notebookId])

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-forma-surface rounded-xl shadow-xl max-w-sm w-full p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold mb-2">Déplacer la page</h3>
        <p className="text-xs text-forma-muted mb-3">
          La page quitte ce carnet (il doit rester au moins une page).
        </p>
        {list.length === 0 ? (
          <p className="text-sm text-forma-muted">Aucun autre carnet disponible.</p>
        ) : (
          <>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filtrer les carnets…"
              className="forma-input w-full mb-2"
            />
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="forma-input w-full mb-3"
            >
              {list
                .filter((nb) => !query.trim() || nb.name.toLowerCase().includes(query.toLowerCase()))
                .map((nb) => (
                  <option key={nb.id} value={nb.id}>
                    {nb.name}
                  </option>
                ))}
            </select>
          </>
        )}
        {err && <p className="text-xs text-red-600 mb-2">{err}</p>}
        <div className="flex gap-2">
          <button type="button" className="flex-1 py-2 border rounded-lg text-sm" onClick={onClose}>
            Annuler
          </button>
          <button
            type="button"
            disabled={!targetId || busy || list.length === 0}
            className="flex-1 py-2 bg-forma-accent text-white rounded-lg text-sm disabled:opacity-50"
            onClick={async () => {
              setBusy(true)
              setErr('')
              const moved = await movePageToNotebook(page.id, targetId)
              setBusy(false)
              if (!moved) {
                setErr('Impossible : carnet source à une seule page.')
                return
              }
              onMoved(targetId)
              onClose()
            }}
          >
            Déplacer
          </button>
        </div>
      </div>
    </div>
  )
}
