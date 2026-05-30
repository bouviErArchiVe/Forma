import { useEffect, useState } from 'react'
import type { InternalCombineSource } from '../../types'
import { listInternalSources } from '../../lib/formacombine/import'
import { GlassButton } from '../ui/GlassButton'

const TABS = [
  { id: 'formadoc' as const, label: 'FormaDoc' },
  { id: 'formatab' as const, label: 'FormaTab' },
  { id: 'forma' as const, label: 'Pages Forma' },
]

interface CombineImportModalProps {
  open: boolean
  onClose: () => void
  onImportInternal: (item: InternalCombineSource) => void
}

export function CombineImportModal({ open, onClose, onImportInternal }: CombineImportModalProps) {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('formadoc')
  const [sources, setSources] = useState<Awaited<ReturnType<typeof listInternalSources>> | null>(
    null,
  )

  useEffect(() => {
    if (!open) return
    void listInternalSources().then(setSources)
  }, [open])

  if (!open) return null

  const items = sources?.[tab] || []

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
          <h3 className="font-semibold m-0">Importer depuis Forma</h3>
        </div>
        <div className="flex gap-1 p-2 border-b border-forma-border/50">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-md text-xs ${
                tab === t.id ? 'bg-forma-accent text-white' : 'bg-forma-surface text-forma-muted'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {items.length === 0 && (
            <p className="text-forma-muted text-sm text-center py-6">Aucun élément disponible</p>
          )}
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onImportInternal(item)
                onClose()
              }}
              className="block w-full text-left p-2.5 mb-1 rounded-lg border border-forma-border bg-forma-surface hover:bg-forma-panel text-sm"
            >
              {item.name}
            </button>
          ))}
        </div>
        <div className="p-3 border-t border-forma-border/50 text-right">
          <GlassButton onClick={onClose}>Fermer</GlassButton>
        </div>
      </div>
    </div>
  )
}
