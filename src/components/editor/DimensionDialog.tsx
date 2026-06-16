/**
 * DimensionDialog — création d'une cote technique V1 (Pack B1).
 *
 * Saisie : type (horizontale / verticale / alignée), longueur réelle, unité,
 * échelle (1 px = N unités) et angle (pour l'alignée). Aperçu en direct ;
 * insertion via le pipeline bloc existant (`dimensionToBlock` → raster →
 * ImageElement). Aucune modification du canvas.
 */
import { useMemo, useState } from 'react'
import { blockToSvg, type DrawingBlock } from '../../lib/blocks/types'
import {
  createDimension,
  dimensionToBlock,
  DIMENSION_TYPE_LABELS,
  DIMENSION_UNIT_LABELS,
  type DimensionStyle,
  type DimensionType,
  type DimensionUnit,
} from '../../lib/dimensions/dimensions'

const TYPES: DimensionType[] = ['horizontal', 'vertical', 'aligned']
const UNITS: DimensionUnit[] = ['mm', 'cm', 'm', 'in', 'ft']

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

export function DimensionDialog({
  onClose,
  onInsert,
}: {
  onClose: () => void
  onInsert: (block: DrawingBlock) => void
}) {
  const [type, setType] = useState<DimensionType>('horizontal')
  const [length, setLength] = useState('2000')
  const [unit, setUnit] = useState<DimensionUnit>('mm')
  const [scale, setScale] = useState('10') // 1 px = N unités
  const [angle, setAngle] = useState('30')
  const [ends, setEnds] = useState<DimensionStyle['ends']>('arrows')

  const block = useMemo(() => {
    const realLength = Number(length.replace(',', '.'))
    const scaleVal = Number(scale.replace(',', '.'))
    const safeReal = Number.isFinite(realLength) && realLength > 0 ? realLength : 0
    const safeScale = Number.isFinite(scaleVal) && scaleVal > 0 ? scaleVal : 1
    const lengthPx = clamp(safeReal / safeScale, 30, 800)
    const dim = createDimension({
      type,
      lengthPx,
      unit,
      scale: safeScale,
      angleDeg: Number(angle.replace(',', '.')) || 0,
      style: { ends },
    })
    return dimensionToBlock(dim)
  }, [type, length, unit, scale, angle, ends])

  const previewSvg = useMemo(() => blockToSvg(block, { stroke: 'currentColor' }), [block])
  const field = 'w-full text-sm border border-forma-border rounded-lg px-2.5 py-1.5 bg-forma-bg focus:outline-none focus:border-forma-accent'

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-forma-surface border border-forma-border rounded-xl shadow-xl p-4 w-80 max-w-full" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-forma-text mb-3">Nouvelle cote</h3>

        {/* Type */}
        <div className="flex rounded-lg border border-forma-border overflow-hidden text-[11px] mb-3">
          {TYPES.map((t) => (
            <button key={t} type="button" onClick={() => setType(t)} className={`flex-1 px-2 py-1 transition-colors ${type === t ? 'bg-forma-accent text-white' : 'text-forma-muted hover:text-forma-text'}`}>
              {DIMENSION_TYPE_LABELS[t].replace('Cote ', '')}
            </button>
          ))}
        </div>

        {/* Aperçu */}
        <div className="border border-forma-border rounded-lg p-2 mb-3 h-20 flex items-center justify-center text-forma-text [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto"
          dangerouslySetInnerHTML={{ __html: previewSvg }}
        />

        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs">
              <span className="text-forma-muted">Longueur réelle</span>
              <input type="text" inputMode="decimal" value={length} onChange={(e) => setLength(e.target.value)} className={`mt-0.5 ${field}`} />
            </label>
            <label className="block text-xs">
              <span className="text-forma-muted">Unité</span>
              <select value={unit} onChange={(e) => setUnit(e.target.value as DimensionUnit)} className={`mt-0.5 ${field}`}>
                {UNITS.map((u) => <option key={u} value={u}>{DIMENSION_UNIT_LABELS[u]}</option>)}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs">
              <span className="text-forma-muted">Échelle (1 px = … {DIMENSION_UNIT_LABELS[unit]})</span>
              <input type="text" inputMode="decimal" value={scale} onChange={(e) => setScale(e.target.value)} className={`mt-0.5 ${field}`} />
            </label>
            {type === 'aligned' ? (
              <label className="block text-xs">
                <span className="text-forma-muted">Angle (°)</span>
                <input type="text" inputMode="decimal" value={angle} onChange={(e) => setAngle(e.target.value)} className={`mt-0.5 ${field}`} />
              </label>
            ) : (
              <label className="block text-xs">
                <span className="text-forma-muted">Embouts</span>
                <select value={ends} onChange={(e) => setEnds(e.target.value as DimensionStyle['ends'])} className={`mt-0.5 ${field}`}>
                  <option value="arrows">Flèches</option>
                  <option value="ticks">Ticks</option>
                </select>
              </label>
            )}
          </div>

          {type === 'aligned' && (
            <label className="block text-xs">
              <span className="text-forma-muted">Embouts</span>
              <select value={ends} onChange={(e) => setEnds(e.target.value as DimensionStyle['ends'])} className={`mt-0.5 ${field}`}>
                <option value="arrows">Flèches</option>
                <option value="ticks">Ticks</option>
              </select>
            </label>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <button type="button" onClick={onClose} className="flex-1 text-xs py-1.5 rounded-lg border border-forma-border text-forma-text hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Annuler</button>
          <button type="button" onClick={() => onInsert(block)} className="flex-1 text-xs py-1.5 rounded-lg bg-forma-accent text-white hover:bg-forma-accent-hover transition-colors">Insérer</button>
        </div>
      </div>
    </div>
  )
}
