import { useEffect, useState } from 'react'
import { listDocuments } from '../../services/formadoc'
import { GlassButton } from '../ui/GlassButton'
import type { FormaDocument } from '../../types'

interface FormulaDocInsertModalProps {
  open: boolean
  onClose: () => void
  onSelect: (doc: FormaDocument) => void | Promise<void>
}

export function FormulaDocInsertModal({ open, onClose, onSelect }: FormulaDocInsertModalProps) {
  const [docs, setDocs] = useState<FormaDocument[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    void listDocuments()
      .then(setDocs)
      .finally(() => setLoading(false))
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="forma-glass-modal w-full max-w-lg max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-forma-border/50">
          <h3 className="font-semibold m-0">Insérer dans FormaDoc</h3>
          <p className="text-xs text-forma-muted mt-1">
            Le calcul sera ajouté à la fin de la dernière page du document choisi.
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {loading && <p className="text-sm text-forma-muted text-center py-6">Chargement…</p>}
          {!loading && docs.length === 0 && (
            <p className="text-forma-muted text-sm text-center py-6">
              Aucun document FormaDoc. Créez-en un depuis FormaDoc d&apos;abord.
            </p>
          )}
          {docs.map((doc) => (
            <button
              key={doc.id}
              type="button"
              onClick={() => void Promise.resolve(onSelect(doc)).then(onClose)}
              className="block w-full text-left p-2.5 mb-1 rounded-lg border border-forma-border bg-forma-surface hover:bg-forma-panel text-sm"
            >
              <span className="font-medium">{doc.name}</span>
              <span className="block text-[10px] text-forma-muted mt-0.5">
                {doc.pages.length} page{doc.pages.length !== 1 ? 's' : ''}
              </span>
            </button>
          ))}
        </div>
        <div className="p-3 border-t border-forma-border/50 text-right">
          <GlassButton onClick={onClose}>Annuler</GlassButton>
        </div>
      </div>
    </div>
  )
}
