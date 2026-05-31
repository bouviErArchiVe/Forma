import { fmt, parseNum } from './units'
import type { FormulaResult, FormulaResultRow, FormulaValues, FormulaVerdict } from '../types'

function ok(rows: FormulaResultRow[], summary: string, verdict?: FormulaVerdict): FormulaResult {
  return { rows, summary, verdict: verdict || { id: 'ok', label: 'Calculé', color: '#2d6a4f' } }
}

export function lightWindowRatio(v: FormulaValues): FormulaResult {
  const room = parseNum(v.roomArea)
  const window = parseNum(v.windowArea)
  const minPct = parseNum(v.minPercent) ?? 17
  if (room == null || window == null || room <= 0) return { error: 'Surfaces requises.' }
  const pct = (window / room) * 100
  const verdict = pct >= minPct
    ? { id: 'ok', label: 'Ratio suffisant', color: '#2d6a4f' }
    : { id: 'limit', label: 'Sous le minimum courant', color: '#f5a623' }
  return ok([
    { label: 'Surface pièce', value: `${fmt(room)} m²` },
    { label: 'Surface vitrée', value: `${fmt(window)} m²` },
    { label: 'Ratio', value: `${fmt(pct, 1)} %` },
    { label: 'Réf. courante', value: `≥ ${fmt(minPct, 0)} %` },
    { label: 'Verdict', value: verdict.label, highlight: verdict.color },
  ], `${fmt(pct, 1)} % vitrage — ${verdict.label}`, verdict)
}

export function lightOpeningPercent(v: FormulaValues): FormulaResult {
  const wall = parseNum(v.wallArea)
  const opening = parseNum(v.openingArea)
  if (wall == null || opening == null || wall <= 0) return { error: 'Surfaces requises.' }
  const pct = (opening / wall) * 100
  return ok([
    { label: 'Mur', value: `${fmt(wall)} m²` },
    { label: 'Ouverture', value: `${fmt(opening)} m²` },
    { label: 'Pourcentage', value: `${fmt(pct, 1)} %` },
  ], `Ouverture = ${fmt(pct, 1)} % du mur`)
}

export function lightMinGlazing(v: FormulaValues): FormulaResult {
  const room = parseNum(v.roomArea)
  const minPct = parseNum(v.minPercent) ?? 17
  if (room == null) return { error: 'Surface pièce requise.' }
  const min = room * (minPct / 100)
  return ok([
    { label: 'Surface pièce', value: `${fmt(room)} m²` },
    { label: 'Ratio cible', value: `${fmt(minPct, 0)} %` },
    { label: 'Vitrage minimal', value: `${fmt(min)} m²` },
  ], `Vitrage min. ≈ ${fmt(min)} m²`)
}
