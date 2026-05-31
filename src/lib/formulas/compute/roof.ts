import { fmt, parseNum } from './units'
import type { FormulaResult, FormulaResultRow, FormulaValues, FormulaVerdict } from '../types'

function ok(rows: FormulaResultRow[], summary: string, verdict?: FormulaVerdict): FormulaResult {
  return { rows, summary, verdict: verdict || { id: 'ok', label: 'Calculé', color: '#2d6a4f' } }
}

export function roofPitch(v: FormulaValues): FormulaResult {
  const rise = parseNum(v.rise)
  const run = parseNum(v.run)
  if (rise == null || run == null || run <= 0) return { error: 'Hauteur et portée requises.' }
  const pct = (rise / run) * 100
  const deg = (Math.atan(rise / run) * 180) / Math.PI
  return ok([
    { label: 'Pente toiture', value: `${fmt(pct, 1)} %` },
    { label: 'Angle', value: `${fmt(deg, 1)}°` },
  ], `Pente : ${fmt(pct, 1)} %`)
}

export function roofRidgeHeight(v: FormulaValues): FormulaResult {
  const span = parseNum(v.span)
  const pitch = parseNum(v.pitchPercent)
  if (span == null || pitch == null) return { error: 'Portée et pente requises.' }
  const h = (span / 2) * (pitch / 100)
  return ok([
    { label: 'Hauteur faîtage', value: `${fmt(h)} m` },
    { label: 'Portée', value: `${fmt(span)} m` },
    { label: 'Pente', value: `${fmt(pitch, 1)} %` },
  ], `Faîtage ≈ ${fmt(h)} m`)
}

export function roofRafterLength(v: FormulaValues): FormulaResult {
  const span = parseNum(v.span)
  const pitch = parseNum(v.pitchPercent)
  const overhang = parseNum(v.overhang) || 0
  if (span == null || pitch == null) return { error: 'Portée et pente requises.' }
  const half = span / 2 + overhang
  const rise = half * (pitch / 100)
  const len = Math.sqrt(half * half + rise * rise)
  return ok([
    { label: 'Longueur rampant', value: `${fmt(len)} m` },
    { label: 'Débord', value: `${fmt(overhang)} m` },
  ], `Rampant ≈ ${fmt(len)} m`)
}

export function roofSurface(v: FormulaValues): FormulaResult {
  const l = parseNum(v.length)
  const w = parseNum(v.width)
  const pitch = parseNum(v.pitchPercent) || 0
  if (l == null || w == null) return { error: 'Dimensions requises.' }
  const slopeFactor = 1 / Math.cos(Math.atan(pitch / 100))
  const base = l * w
  const roof = base * slopeFactor
  return ok([
    { label: 'Emprise au sol', value: `${fmt(base)} m²` },
    { label: 'Facteur pente', value: fmt(slopeFactor, 3) },
    { label: 'Surface toiture', value: `${fmt(roof)} m²` },
  ], `Surface toiture ≈ ${fmt(roof)} m²`)
}
