/**
 * TitleBlockDialog — création d'un cartouche V1 (Pack B3).
 *
 * Saisie : format de feuille (A4→A0) et champs (projet, date, échelle,
 * feuille). Aperçu en direct ; insertion via le pipeline bloc existant
 * (`titleBlockToBlock` → raster → ImageElement). Aucune modification du canvas.
 *
 * Calque sur `DimensionDialog` (même structure, même style Forma).
 */
import { useMemo, useState } from 'react'
import { blockToSvg, type DrawingBlock } from '../../lib/blocks/types'
import {
  createTitleBlock,
  titleBlockToBlock,
  SHEET_FORMATS,
  type SheetFormat,
} from '../../lib/drawing/titleblocks'

export function TitleBlockDialog({
  onClose,
  onInsert,
}: {
  onClose: () => void
  onInsert: (block: DrawingBlock) => void
}) {
  const [format, setFormat] = useState<SheetFormat>('A4')
  const [projet, setProjet] = useState('Projet')
  const [date, setDate] = useState('')
  const [echelle, setEchelle] = useState('1:100')
  const [feuille, setFeuille] = useState('A-01')

  const block = useMemo(() => {
    const tb = createTitleBlock({
      format,
      fields: { projet, date, echelle, feuille },
    })
    return titleBlockToBlock(tb)
  }, [format, projet, date, echelle, feuille])

  const previewSvg = useMemo(() => blockToSvg(block, { stroke: 'currentColor' }), [block])
  const field = 'w-full text-sm border border-forma-border rounded-lg px-2.5 py-1.5 bg-forma-bg focus:outline-none focus:border-forma-accent'

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-forma-surface border border-forma-border rounded-xl shadow-xl p-4 w-80 max-w-full" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-forma-text mb-3">Nouveau cartouche</h3>

        {/* Format */}
        <div className="flex rounded-lg border border-forma-border overflow-hidden text-[11px] mb-3">
          {SHEET_FORMATS.map((f) => (
            <button key={f} type="button" onClick={() => setFormat(f)} className={`flex-1 px-2 py-1 transition-colors ${format === f ? 'bg-forma-accent text-white' : 'text-forma-muted hover:text-forma-text'}`}>
              {f}
            </button>
          ))}
        </div>

        {/* Aperçu */}
        <div className="border border-forma-border rounded-lg p-2 mb-3 h-20 flex items-center justify-center text-forma-text [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto"
          dangerouslySetInnerHTML={{ __html: previewSvg }}
        />

        <div className="space-y-2">
          <label className="block text-xs">
            <span className="text-forma-muted">Projet</span>
            <input type="text" value={projet} onChange={(e) => setProjet(e.target.value)} className={`mt-0.5 ${field}`} />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs">
              <span className="text-forma-muted">Date</span>
              <input type="text" value={date} onChange={(e) => setDate(e.target.value)} placeholder="2026-06-15" className={`mt-0.5 ${field}`} />
            </label>
            <label className="block text-xs">
              <span className="text-forma-muted">Échelle</span>
              <input type="text" value={echelle} onChange={(e) => setEchelle(e.target.value)} placeholder="1:100" className={`mt-0.5 ${field}`} />
            </label>
          </div>
          <label className="block text-xs">
            <span className="text-forma-muted">Feuille</span>
            <input type="text" value={feuille} onChange={(e) => setFeuille(e.target.value)} placeholder="A-01" className={`mt-0.5 ${field}`} />
          </label>
        </div>

        <div className="flex gap-2 mt-4">
          <button type="button" onClick={onClose} className="flex-1 text-xs py-1.5 rounded-lg border border-forma-border text-forma-text hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Annuler</button>
          <button type="button" onClick={() => onInsert(block)} className="flex-1 text-xs py-1.5 rounded-lg bg-forma-accent text-white hover:bg-forma-accent-hover transition-colors">Insérer</button>
        </div>
      </div>
    </div>
  )
}
