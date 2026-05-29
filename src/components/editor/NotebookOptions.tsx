import { useEffect, useState } from 'react'
import { computeNotebookWordCount } from '../../lib/page-stats'
import { COVER_COLORS, type Notebook, type Orientation, type PaperTemplate } from '../../types'
import { clearNotebookPin, hasNotebookPin, setNotebookPin } from '../../services/lock'
import { updateNotebookMetadata } from '../../services/library'
import { getPages } from '../../services/pages'

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-forma-surface dark:bg-gray-900 rounded-xl shadow-xl max-w-sm w-full p-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold mb-3">Options du carnet</h3>
        <p className="text-xs text-forma-muted mb-3">
          {pageCount} page{pageCount !== 1 ? 's' : ''} · ~{wordCount} mot{wordCount !== 1 ? 's' : ''} indexés
        </p>

        <label className="block text-sm mb-2">
          Couleur de couverture
          <div className="flex flex-wrap gap-1 mt-1">
            {COVER_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCoverColor(c)}
                className={`w-7 h-7 rounded-full border-2 ${coverColor === c ? 'border-forma-accent' : 'border-gray-300'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </label>

        <label className="block text-sm mb-2">
          Modèle par défaut (nouvelles pages)
          <select
            value={paperTemplate}
            onChange={(e) => setPaperTemplate(e.target.value as PaperTemplate)}
            className="mt-1 w-full border rounded-lg px-2 py-1.5 dark:bg-gray-800"
          >
            {TEMPLATES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm mb-3">
          Orientation
          <select
            value={orientation}
            onChange={(e) => setOrientation(e.target.value as Orientation)}
            className="mt-1 w-full border rounded-lg px-2 py-1.5 dark:bg-gray-800"
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Paysage</option>
          </select>
        </label>

        <button
          type="button"
          onClick={() => void saveMeta()}
          className="w-full py-2 mb-4 bg-forma-accent text-white rounded-lg text-sm"
        >
          Enregistrer apparence
        </button>

        <p className="text-sm text-forma-muted mb-2">Code PIN (verrouillage local)</p>
        <input
          type="password"
          inputMode="numeric"
          maxLength={8}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          placeholder="4–8 chiffres"
          className="w-full border rounded-lg px-3 py-2 mb-2 dark:bg-gray-800"
        />
        <div className="flex gap-2">
          <button
            type="button"
            className="flex-1 py-2 bg-forma-accent text-white rounded-lg text-sm"
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
          </button>
          {hasPin && (
            <button
              type="button"
              className="flex-1 py-2 border rounded-lg text-sm dark:border-gray-600"
              onClick={async () => {
                await clearNotebookPin(notebook.id)
                setHasPin(false)
                setMsg('PIN supprimé')
              }}
            >
              Retirer
            </button>
          )}
        </div>
        {msg && <p className="text-xs text-green-600 mt-2">{msg}</p>}
        <button type="button" onClick={onClose} className="mt-4 w-full py-2 border rounded-lg text-sm">
          Fermer
        </button>
      </div>
    </div>
  )
}
