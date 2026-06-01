import { useState } from 'react'
import { TEMPLATE_LABELS } from '../../lib/templates'
import { useSettingsStore } from '../../stores/settingsStore'
import { COVER_COLORS, type Orientation, type PaperTemplate } from '../../types'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

export type NewDocKind = 'notebook' | 'whiteboard' | 'formadoc' | 'formataб'

const KIND_META: Record<NewDocKind, { icon: string; label: string }> = {
  notebook: { icon: '📓', label: 'Carnet' },
  whiteboard: { icon: '🖼', label: 'Whiteboard' },
  formadoc: { icon: '📝', label: 'Document' },
  'formataб': { icon: '📊', label: 'Tableau' },
}

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

  const isFormadoc = kind === 'formadoc'
  const isFormataб = kind === 'formataб'
  const hidePageOptions = isFormadoc || isFormataб

  return (
    <Modal open onClose={onClose} maxWidth="max-w-md">
      <div className="p-6 space-y-4">
        <h2 className="text-lg font-semibold text-forma-text">Nouveau document</h2>

        {/* Kind selector */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
          {(Object.keys(KIND_META) as NewDocKind[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setKind(k)
                if (k === 'whiteboard') { setName('Tableau blanc'); setPaperTemplate('grid'); setOrientation('landscape') }
                else if (k === 'notebook') { setName('Nouveau carnet') }
                else if (k === 'formadoc') { setName('Nouveau document') }
                else if (k === 'formataб') { setName('Nouveau tableau') }
              }}
              className={`flex-1 py-1.5 rounded-lg border text-sm font-medium transition-all duration-150 ${
                kind === k
                  ? 'bg-forma-surface shadow-sm border-forma-border text-forma-accent'
                  : 'border-transparent text-forma-muted hover:text-forma-text'
              }`}
            >
              {KIND_META[k].icon} {KIND_META[k].label}
            </button>
          ))}
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-forma-muted uppercase tracking-wide mb-1.5">Nom</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="forma-input w-full"
            autoFocus
          />
        </div>

        {/* Cover color */}
        <div>
          <label className="block text-xs font-medium text-forma-muted uppercase tracking-wide mb-1.5">Couverture</label>
          <div className="flex gap-2 flex-wrap">
            {COVER_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCoverColor(c)}
                className={`w-9 h-11 rounded-lg border-2 transition-transform hover:scale-105 ${
                  coverColor === c ? 'border-forma-accent scale-105 ring-2 ring-forma-accent/20' : 'border-transparent'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Paper template — hidden for FormaDoc/FormaTab */}
        {!hidePageOptions && (
          <div>
            <label className="block text-xs font-medium text-forma-muted uppercase tracking-wide mb-1.5">Papier</label>
            <select
              value={paperTemplate}
              onChange={(e) => setPaperTemplate(e.target.value as PaperTemplate)}
              className="forma-input w-full"
            >
              {(Object.keys(TEMPLATE_LABELS) as PaperTemplate[]).map((t) => (
                <option key={t} value={t}>{TEMPLATE_LABELS[t]}</option>
              ))}
            </select>
          </div>
        )}

        {/* Orientation — hidden for FormaDoc/FormaTab */}
        {!hidePageOptions && (
          <div>
            <label className="block text-xs font-medium text-forma-muted uppercase tracking-wide mb-1.5">Orientation</label>
            <div className="flex gap-2">
              {(['portrait', 'landscape'] as Orientation[]).map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setOrientation(o)}
                  className={`flex-1 py-1.5 rounded-lg border text-sm transition-all duration-150 ${
                    orientation === o
                      ? 'border-forma-accent bg-forma-accent/10 text-forma-accent font-medium'
                      : 'border-forma-border text-forma-muted hover:border-forma-accent/40'
                  }`}
                >
                  {o === 'portrait' ? 'Portrait' : 'Paysage'}
                </button>
              ))}
            </div>
          </div>
        )}
        {isFormadoc && (
          <p className="text-xs text-forma-muted">
            📝 Un document texte riche — titres, paragraphes, listes, images, export PDF et Markdown.
          </p>
        )}
        {isFormataб && (
          <p className="text-xs text-forma-muted">
            📊 Un tableur simple — cellules, formules (=SUM, =AVG…), styles, export CSV.
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <Button variant="outline" size="md" className="flex-1" onClick={onClose}>Annuler</Button>
          <Button variant="primary" size="md" className="flex-1" onClick={() => onCreate(kind, { name, coverColor, paperTemplate, orientation })}>
            Créer
          </Button>
        </div>
      </div>
    </Modal>
  )
}
