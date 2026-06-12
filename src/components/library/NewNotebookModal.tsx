import { useState } from 'react'
import { creatableKindsByGroup, getKindMeta } from '../../lib/document-kinds'
import { TEMPLATE_LABELS } from '../../lib/templates'
import { useSettingsStore } from '../../stores/settingsStore'
import { COVER_COLORS, type DocumentType, type Orientation, type PaperTemplate } from '../../types'
import { Icon } from '../ui/Icon'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

/** Types proposés à la création (tous sauf 'pdf', créé via import). */
export type NewDocKind = Exclude<DocumentType, 'pdf'>

/** Nom par défaut d'un nouveau document selon son type. */
export function defaultNameForKind(kind: NewDocKind): string {
  switch (kind) {
    case 'notebook': return 'Nouveau carnet'
    case 'whiteboard': return 'Tableau blanc'
    case 'formadoc': return 'Nouveau document'
    case 'formataб': return 'Nouveau tableau'
    case 'fmoodboard': return 'Nouveau moodboard'
    case 'subject': return 'Nouvelle matière'
    case 'formula': return 'Mes formules'
    case 'translator': return 'Traduction'
    case 'dictionary': return 'Dictionnaire'
    case 'calendar': return 'Mon calendrier'
    case 'presence': return 'Suivi de présence'
    case 'combine': return 'Projet Combine'
    case 'pause': return 'Pause'
  }
}

/** Le type utilise les options page (papier/orientation) du canvas. */
function usesCanvasOptions(kind: NewDocKind): boolean {
  return kind === 'notebook' || kind === 'whiteboard'
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
  /** Type présélectionné à l'ouverture (depuis le menu "+ Nouveau"). */
  initialKind?: NewDocKind
}

export function NewNotebookModal({ onClose, onCreate, initialKind }: NewNotebookModalProps) {
  const defaultTemplate = useSettingsStore((s) => s.defaultPaperTemplate)
  const defaultCover = useSettingsStore((s) => s.defaultCoverColor)
  const startKind = initialKind ?? 'notebook'
  const [kind, setKind] = useState<NewDocKind>(startKind)
  const [name, setName] = useState(defaultNameForKind(startKind))
  const [coverColor, setCoverColor] = useState<string>(defaultCover)
  const [paperTemplate, setPaperTemplate] = useState<PaperTemplate>(
    startKind === 'whiteboard' ? 'grid' : defaultTemplate,
  )
  const [orientation, setOrientation] = useState<Orientation>(
    startKind === 'whiteboard' ? 'landscape' : 'portrait',
  )

  const meta = getKindMeta(kind)
  const hidePageOptions = !usesCanvasOptions(kind)

  const selectKind = (k: NewDocKind) => {
    setKind(k)
    setName(defaultNameForKind(k))
    if (k === 'whiteboard') {
      setPaperTemplate('grid')
      setOrientation('landscape')
    }
  }

  return (
    <Modal open onClose={onClose} maxWidth="max-w-md">
      <div className="p-6 space-y-4">
        <h2 className="text-lg font-semibold text-forma-text">Nouveau document</h2>

        {/* Type — select groupé (Créer / Étudier / Organiser / Outils) */}
        <div>
          <label className="block text-xs font-medium text-forma-muted uppercase tracking-wide mb-1.5">Type</label>
          <div className="flex items-center gap-2">
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${meta.color}1a`, color: meta.color }}
            >
              <Icon name={meta.icon} className="w-4 h-4" />
            </span>
            <select
              value={kind}
              onChange={(e) => selectKind(e.target.value as NewDocKind)}
              className="forma-input w-full"
            >
              {creatableKindsByGroup().map((g) => (
                <optgroup key={g.group} label={g.label}>
                  {g.kinds.map((k) => (
                    <option key={k.id} value={k.id}>{k.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <p className="text-xs text-forma-muted mt-1.5">{meta.description}</p>
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

        {/* Paper template — carnets/whiteboards uniquement */}
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

        {/* Orientation — carnets/whiteboards uniquement */}
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
