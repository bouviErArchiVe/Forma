import { useEffect, useState } from 'react'
import { computeNotebookWordCount } from '../../lib/page-stats'
import { COVER_COLORS, type Notebook, type Orientation, type PaperTemplate } from '../../types'
import { clearNotebookPin, hasNotebookPin, setNotebookPin } from '../../services/lock'
import { updateNotebookMetadata } from '../../services/library'
import { getPages } from '../../services/pages'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

const TEMPLATES: PaperTemplate[] = [
  'blank',
  'lined',
  'grid',
  'dots',
  'cornell',
  'planner',
  'music',
]

interface NotebookOptionsProps {
  notebook: Notebook
  onClose: () => void
  onUpdated?: (nb: Notebook) => void
}

export function NotebookOptions({ notebook, onClose, onUpdated }: NotebookOptionsProps) {
  const [pin, setPin] = useState('')
  const [hasPin, setHasPin] = useState(false)
  const [msg, setMsg] = useState('')
  const [coverColor, setCoverColor] = useState(notebook.coverColor)
  const [paperTemplate, setPaperTemplate] = useState(notebook.paperTemplate)
  const [orientation, setOrientation] = useState<Orientation>(notebook.orientation)
  const [pageCount, setPageCount] = useState(0)
  const [wordCount, setWordCount] = useState(0)

  useEffect(() => {
    hasNotebookPin(notebook.id).then(setHasPin)
    void getPages(notebook.id).then((pages) => {
      setPageCount(pages.length)
      setWordCount(computeNotebookWordCount(pages))
    })
  }, [notebook.id])

  const saveMeta = async () => {
    await updateNotebookMetadata(notebook.id, { coverColor, paperTemplate, orientation })
    onUpdated?.({ ...notebook, coverColor, paperTemplate, orientation })
    setMsg('Options enregistrées')
  }

  return (
    <Modal open onClose={onClose} maxWidth="max-w-sm">
      <div className="p-5 space-y-4">
        {/* Header */}
        <div>
          <h3 className="font-semibold text-base">Options du carnet</h3>
          <p className="text-xs text-forma-muted mt-0.5">
            {pageCount} page{pageCount !== 1 ? 's' : ''} · ~{wordCount} mot{wordCount !== 1 ? 's' : ''} indexés
          </p>
        </div>

        {/* Cover color */}
        <div>
          <p className="text-xs font-medium text-forma-muted uppercase tracking-wide mb-1.5">Couleur de couverture</p>
          <div className="flex flex-wrap gap-1.5">
            {COVER_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCoverColor(c)}
                className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                  coverColor === c ? 'border-forma-accent ring-2 ring-forma-accent/30 scale-110' : 'border-gray-300 dark:border-gray-600'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Paper template */}
        <div>
          <label className="block text-xs font-medium text-forma-muted uppercase tracking-wide mb-1.5">
            Modèle par défaut
          </label>
          <select
            value={paperTemplate}
            onChange={(e) => setPaperTemplate(e.target.value as PaperTemplate)}
            className="forma-input w-full"
          >
            {TEMPLATES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Orientation */}
        <div>
          <label className="block text-xs font-medium text-forma-muted uppercase tracking-wide mb-1.5">
            Orientation
          </label>
          <select
            value={orientation}
            onChange={(e) => setOrientation(e.target.value as Orientation)}
            className="forma-input w-full"
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Paysage</option>
          </select>
        </div>

        <Button variant="primary" size="sm" className="w-full" onClick={() => void saveMeta()}>
          Enregistrer apparence
        </Button>

        <div className="border-t border-forma-border pt-4 space-y-2">
          <p className="text-xs font-medium text-forma-muted uppercase tracking-wide">Code PIN (verrouillage local)</p>
          <input
            type="password"
            inputMode="numeric"
            maxLength={8}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="4–8 chiffres"
            className="forma-input w-full"
          />
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={async () => {
                if (pin.length >= 4) {
                  await setNotebookPin(notebook.id, pin)
                  setHasPin(true)
                  setMsg('PIN enregistré')
                  setPin('')
                }
              }}
            >
              Définir PIN
            </Button>
            {hasPin && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={async () => {
                  await clearNotebookPin(notebook.id)
                  setHasPin(false)
                  setMsg('PIN supprimé')
                }}
              >
                Retirer
              </Button>
            )}
          </div>
          {msg && <p className="text-xs text-forma-success">{msg}</p>}
        </div>

        <Button variant="ghost" size="sm" className="w-full" onClick={onClose}>
          Fermer
        </Button>
      </div>
    </Modal>
  )
}
