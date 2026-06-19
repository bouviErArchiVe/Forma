/**
 * TitleBlockDialog — création d'un cartouche (Pack B3 V1 + B/Sprint4 V2).
 *
 * Saisie : format de feuille (A4→A0) et champs (projet, date, échelle,
 * feuille). V2 (additif) : zone logo optionnelle, champs personnalisés et une
 * ligne de révision. Aperçu en direct ; insertion via le pipeline bloc existant
 * (`titleBlockToBlock` → raster → ImageElement). Aucune modification du canvas.
 *
 * Calque sur `DimensionDialog` (même structure, même style Forma).
 */
import { useMemo, useState } from 'react'
import { blockToSvg, type DrawingBlock } from '../../lib/blocks/types'
import {
  createTitleBlock,
  titleBlockToBlock,
  MAX_CUSTOM_FIELDS,
  SHEET_FORMATS,
  type SheetFormat,
  type TitleBlockCustomField,
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
  // V2
  const [logo, setLogo] = useState(false)
  const [customFields, setCustomFields] = useState<TitleBlockCustomField[]>([])
  const [revIndice, setRevIndice] = useState('')
  const [revDate, setRevDate] = useState('')
  const [revDesc, setRevDesc] = useState('')

  const addCustomField = () =>
    setCustomFields((prev) => (prev.length >= MAX_CUSTOM_FIELDS ? prev : [...prev, { label: '', value: '' }]))
  const updateCustomField = (i: number, patch: Partial<TitleBlockCustomField>) =>
    setCustomFields((prev) => prev.map((f, idx) => (idx === i ? { ...f, ...patch } : f)))
  const removeCustomField = (i: number) => setCustomFields((prev) => prev.filter((_, idx) => idx !== i))

  const block = useMemo(() => {
    const tb = createTitleBlock({
      format,
      fields: { projet, date, echelle, feuille },
      logo,
      customFields,
      revisions: [{ indice: revIndice, date: revDate, description: revDesc }],
    })
    return titleBlockToBlock(tb)
  }, [format, projet, date, echelle, feuille, logo, customFields, revIndice, revDate, revDesc])

  const previewSvg = useMemo(() => blockToSvg(block, { stroke: 'currentColor' }), [block])
  const field = 'w-full text-sm border border-forma-border rounded-lg px-2.5 py-1.5 bg-forma-bg focus:outline-none focus:border-forma-accent'

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-forma-surface border border-forma-border rounded-xl shadow-xl p-4 w-80 max-w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
        <div className="border border-forma-border rounded-lg p-2 h-20 flex items-center justify-center text-forma-text [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto"
          dangerouslySetInnerHTML={{ __html: previewSvg }}
        />
        <p className="text-[10px] text-forma-muted text-center mb-3 mt-1">
          {format} · {block.defaultWidth} × {block.defaultHeight} px
        </p>

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

        {/* V2 — Zone logo */}
        <label className="flex items-center gap-2 mt-3 text-xs cursor-pointer select-none">
          <input type="checkbox" checked={logo} onChange={(e) => setLogo(e.target.checked)} className="accent-forma-accent" />
          <span className="text-forma-text">Réserver une zone logo</span>
        </label>

        {/* V2 — Champs personnalisés */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-forma-muted">Champs personnalisés</span>
            <button
              type="button"
              onClick={addCustomField}
              disabled={customFields.length >= MAX_CUSTOM_FIELDS}
              className="text-[11px] px-2 py-0.5 rounded-md border border-forma-border text-forma-text hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              + Ajouter
            </button>
          </div>
          <div className="space-y-1.5">
            {customFields.map((f, i) => (
              <div key={i} className="flex gap-1.5 items-center">
                <input type="text" value={f.label} onChange={(e) => updateCustomField(i, { label: e.target.value })} placeholder="Libellé" className={`${field} flex-1`} />
                <input type="text" value={f.value} onChange={(e) => updateCustomField(i, { value: e.target.value })} placeholder="Valeur" className={`${field} flex-1`} />
                <button type="button" onClick={() => removeCustomField(i)} aria-label="Supprimer le champ" className="text-forma-muted hover:text-red-500 px-1 text-sm leading-none transition-colors">×</button>
              </div>
            ))}
          </div>
        </div>

        {/* V2 — Révision */}
        <div className="mt-3">
          <span className="text-xs text-forma-muted">Révision</span>
          <div className="grid grid-cols-[3rem_1fr] gap-2 mt-0.5">
            <input type="text" value={revIndice} onChange={(e) => setRevIndice(e.target.value)} placeholder="Ind." className={field} />
            <input type="text" value={revDate} onChange={(e) => setRevDate(e.target.value)} placeholder="Date" className={field} />
          </div>
          <input type="text" value={revDesc} onChange={(e) => setRevDesc(e.target.value)} placeholder="Description" className={`mt-1.5 ${field}`} />
        </div>

        <div className="flex gap-2 mt-4">
          <button type="button" onClick={onClose} className="flex-1 text-xs py-1.5 rounded-lg border border-forma-border text-forma-text hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Annuler</button>
          <button type="button" onClick={() => onInsert(block)} className="flex-1 text-xs py-1.5 rounded-lg bg-forma-accent text-white hover:bg-forma-accent-hover transition-colors">Insérer</button>
        </div>
      </div>
    </div>
  )
}
