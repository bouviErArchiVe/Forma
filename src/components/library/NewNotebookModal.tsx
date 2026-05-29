import { useState } from 'react'
import { TEMPLATE_LABELS } from '../../lib/templates'
import { useSettingsStore } from '../../stores/settingsStore'
import { COVER_COLORS, type Orientation, type PaperTemplate } from '../../types'

export type NewDocKind = 'notebook' | 'whiteboard'

interface NewNotebookModalProps {
  onClose: () => void
  onCreate: (
    kind: NewDocKind,
    opts: {
      name: string
      coverColor: string
      paperTemplate: PaperTemplate
      orientation: Orientation
    },
  ) => void
}

export function NewNotebookModal({ onClose, onCreate }: NewNotebookModalProps) {
  const defaultTemplate = useSettingsStore((s) => s.defaultPaperTemplate)
  const defaultCover = useSettingsStore((s) => s.defaultCoverColor)
  const [kind, setKind] = useState<NewDocKind>('notebook')
  const [name, setName] = useState('Nouveau carnet')
  const [coverColor, setCoverColor] = useState<string>(defaultCover)
  const [paperTemplate, setPaperTemplate] = useState<PaperTemplate>(defaultTemplate)
  const [orientation, setOrientation] = useState<Orientation>('portrait')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-forma-surface rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-4">Nouveau document</h2>

        <div className="flex gap-2 mb-4">
          {(['notebook', 'whiteboard'] as NewDocKind[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setKind(k)
                if (k === 'whiteboard') {
                  setName('Tableau blanc')
                  setPaperTemplate('grid')
                  setOrientation('landscape')
                }
              }}
              className={`flex-1 py-2 rounded-lg border text-sm ${
                kind === k ? 'border-forma-accent bg-forma-accent/10' : ''
              }`}
            >
              {k === 'notebook' ? 'Carnet' : 'Whiteboard'}
            </button>
          ))}
        </div>

        <label className="block text-sm text-forma-muted mb-1">Nom</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-forma-border rounded-lg px-3 py-2 mb-4"
        />

        <label className="block text-sm text-forma-muted mb-2">Couverture</label>
        <div className="flex gap-2 mb-4 flex-wrap">
          {COVER_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCoverColor(c)}
              className={`w-10 h-12 rounded-md border-2 ${
                coverColor === c ? 'border-forma-accent scale-105' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <label className="block text-sm text-forma-muted mb-1">Papier</label>
        <select
          value={paperTemplate}
          onChange={(e) => setPaperTemplate(e.target.value as PaperTemplate)}
          className="w-full border border-forma-border rounded-lg px-3 py-2 mb-4"
        >
          {(Object.keys(TEMPLATE_LABELS) as PaperTemplate[]).map((t) => (
            <option key={t} value={t}>
              {TEMPLATE_LABELS[t]}
            </option>
          ))}
        </select>

        <label className="block text-sm text-forma-muted mb-1">Orientation</label>
        <div className="flex gap-2 mb-6">
          {(['portrait', 'landscape'] as Orientation[]).map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => setOrientation(o)}
              className={`flex-1 py-2 rounded-lg border text-sm ${
                orientation === o
                  ? 'border-forma-accent bg-forma-accent/10 text-forma-accent'
                  : 'border-forma-border'
              }`}
            >
              {o === 'portrait' ? 'Portrait' : 'Paysage'}
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-forma-border hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => onCreate(kind, { name, coverColor, paperTemplate, orientation })}
            className="px-4 py-2 rounded-lg bg-forma-accent text-white hover:bg-forma-accent-hover"
          >
            Créer
          </button>
        </div>
      </div>
    </div>
  )
}
