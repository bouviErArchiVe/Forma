import { useEffect, useState } from 'react'
import { pastePageToNotebook } from '../../services/page-clipboard'
import { getAllNotebooks } from '../../services/library'
import type { Notebook } from '../../types'

interface PastePageModalProps {
  afterOrder?: number
  excludeNotebookId?: string
  onClose: () => void
  onPasted: (notebookId: string, pageId: string) => void
}

export function PastePageModal({
  afterOrder,
  excludeNotebookId,
  onClose,
  onPasted,
}: PastePageModalProps) {
  const [list, setList] = useState<Notebook[]>([])
  const [targetId, setTargetId] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getAllNotebooks().then((all) => {
      const filtered = all
        .filter((nb) => !nb.deletedAt && nb.id !== excludeNotebookId)
        .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
      setList(filtered)
      if (filtered[0]) setTargetId(filtered[0].id)
    })
  }, [excludeNotebookId])

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-forma-surface dark:bg-gray-900 rounded-xl shadow-xl max-w-sm w-full p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold mb-2">Coller la page</h3>
        <p className="text-xs text-forma-muted mb-3">La page copiée sera ajoutée au carnet choisi.</p>
        {list.length === 0 ? (
          <p className="text-sm text-forma-muted">Aucun carnet disponible.</p>
        ) : (
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm mb-3 dark:bg-gray-800 dark:border-gray-600"
          >
            {list.map((nb) => (
              <option key={nb.id} value={nb.id}>
                {nb.name}
              </option>
            ))}
          </select>
        )}
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
              const order = excludeNotebookId === targetId ? afterOrder : undefined
              const page = await pastePageToNotebook(targetId, order)
              setBusy(false)
              if (page) {
                onPasted(targetId, page.id)
                onClose()
              }
            }}
          >
            Coller
          </button>
        </div>
      </div>
    </div>
  )
}
