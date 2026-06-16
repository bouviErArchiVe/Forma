/**
 * AnnotationDialog — création d'une annotation simple V1 (Pack B2).
 *
 * Saisie : type (étiquette / callout encadré / note avec rappel), texte,
 * taille de police, et (pour la note) longueur + direction de la ligne de
 * rappel. Aperçu en direct ; insertion via le pipeline bloc existant
 * (`annotationToBlock` → raster → ImageElement). Aucune modification du canvas.
 *
 * Calque sur `DimensionDialog` (même structure, même style Forma).
 */
import { useMemo, useState } from 'react'
import { blockToSvg, type DrawingBlock } from '../../lib/blocks/types'
import {
  annotationToBlock,
  createAnnotation,
  ANNOTATION_TYPE_LABELS,
  LEADER_DIRECTION_LABELS,
  type AnnotationType,
  type LeaderDirection,
} from '../../lib/drawing/annotations'

const TYPES: AnnotationType[] = ['label', 'callout', 'leader']
const DIRECTIONS: LeaderDirection[] = ['left', 'right', 'up', 'down']

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

export function AnnotationDialog({
  onClose,
  onInsert,
}: {
  onClose: () => void
  onInsert: (block: DrawingBlock) => void
}) {
  const [type, setType] = useState<AnnotationType>('label')
  const [text, setText] = useState('Note')
  const [fontSize, setFontSize] = useState('13')
  const [leaderLength, setLeaderLength] = useState('60')
  const [leaderDirection, setLeaderDirection] = useState<LeaderDirection>('left')

  const block = useMemo(() => {
    const fs = clamp(Number(fontSize.replace(',', '.')) || 13, 8, 48)
    const leader = clamp(Number(leaderLength.replace(',', '.')) || 60, 16, 240)
    const ann = createAnnotation({
      type,
      text,
      leaderLength: leader,
      leaderDirection,
      style: { fontSize: fs },
    })
    return annotationToBlock(ann)
  }, [type, text, fontSize, leaderLength, leaderDirection])

  const previewSvg = useMemo(() => blockToSvg(block, { stroke: 'currentColor' }), [block])
  const field = 'w-full text-sm border border-forma-border rounded-lg px-2.5 py-1.5 bg-forma-bg focus:outline-none focus:border-forma-accent'

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-forma-surface border border-forma-border rounded-xl shadow-xl p-4 w-80 max-w-full" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-forma-text mb-3">Nouvelle annotation</h3>

        {/* Type */}
        <div className="flex rounded-lg border border-forma-border overflow-hidden text-[11px] mb-3">
          {TYPES.map((t) => (
            <button key={t} type="button" onClick={() => setType(t)} className={`flex-1 px-2 py-1 transition-colors ${type === t ? 'bg-forma-accent text-white' : 'text-forma-muted hover:text-forma-text'}`}>
              {ANNOTATION_TYPE_LABELS[t].replace(' encadré', '').replace('Note avec rappel', 'Rappel')}
            </button>
          ))}
        </div>

        {/* Aperçu */}
        <div className="border border-forma-border rounded-lg p-2 mb-3 h-24 flex items-center justify-center text-forma-text [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto"
          dangerouslySetInnerHTML={{ __html: previewSvg }}
        />

        <div className="space-y-2">
          <label className="block text-xs">
            <span className="text-forma-muted">Texte</span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
              className={`mt-0.5 resize-none ${field}`}
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs">
              <span className="text-forma-muted">Police (px)</span>
              <input type="text" inputMode="decimal" value={fontSize} onChange={(e) => setFontSize(e.target.value)} className={`mt-0.5 ${field}`} />
            </label>
            {type === 'leader' ? (
              <label className="block text-xs">
                <span className="text-forma-muted">Rappel (px)</span>
                <input type="text" inputMode="decimal" value={leaderLength} onChange={(e) => setLeaderLength(e.target.value)} className={`mt-0.5 ${field}`} />
              </label>
            ) : (
              <span />
            )}
          </div>

          {type === 'leader' && (
            <label className="block text-xs">
              <span className="text-forma-muted">Direction du rappel</span>
              <select value={leaderDirection} onChange={(e) => setLeaderDirection(e.target.value as LeaderDirection)} className={`mt-0.5 ${field}`}>
                {DIRECTIONS.map((d) => <option key={d} value={d}>{LEADER_DIRECTION_LABELS[d]}</option>)}
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
