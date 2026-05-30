// @ts-nocheck
import { toCm, fromCm, fmt, parseNum } from './units'
import { blondelVerdict } from './blondel'

function ok(rows, summary, verdict) {
  return { rows, summary, verdict: verdict || { id: 'ok', label: 'Calculé', color: '#2d6a4f' } }
}

export function stairSlope(v, unit = 'cm') {
  const rise = toCm(v.totalHeight, unit)
  const run = toCm(v.totalRun, unit)
  if (rise == null || run == null || run <= 0) return { error: 'Hauteur et longueur requises.' }
  const pct = (rise / run) * 100
  const deg = (Math.atan(rise / run) * 180) / Math.PI
  return ok([
    { label: 'Pente', value: `${fmt(pct, 2)} %` },
    { label: 'Angle', value: `${fmt(deg, 2)}°` },
  ], `Pente escalier : ${fmt(pct, 2)} %`)
}

export function stairStepCount(v, unit = 'cm') {
  const rise = toCm(v.totalHeight, unit)
  const targetH = toCm(v.targetStepHeight, unit) ?? 17
  if (rise == null) return { error: 'Hauteur totale requise.' }
  const steps = Math.round(rise / targetH)
  const stepH = rise / steps
  const blondel = blondelVerdict(2 * stepH + 28)
  return ok([
    { label: 'Marches suggérées', value: String(steps) },
    { label: 'Hauteur marche', value: `${fmt(fromCm(stepH, unit))} ${unit}` },
    { label: 'Verdict (giron 28 cm)', value: blondel.label, highlight: blondel.color },
  ], `${steps} marches de ${fmt(fromCm(stepH, unit))} ${unit}`)
}

export function stairDevelopedLength(v, unit = 'cm') {
  const steps = parseNum(v.steps)
  const tread = toCm(v.tread, unit)
  if (steps == null || tread == null) return { error: 'Marches et giron requis.' }
  const len = tread * Math.max(steps - 1, 0)
  return ok([{ label: 'Longueur développée', value: `${fmt(fromCm(len, unit))} ${unit}` }], `L = ${fmt(fromCm(len, unit))} ${unit}`)
}

export function stairStepGiron(v, unit = 'cm') {
  const stepH = toCm(v.stepHeight, unit)
  const tread = toCm(v.tread, unit)
  if (stepH == null || tread == null) return { error: 'H et G requis.' }
  const sum = 2 * stepH + tread
  const verdict = blondelVerdict(sum)
  return ok([
    { label: '2H + G', value: `${fmt(sum)} cm` },
    { label: 'Verdict', value: verdict.label, highlight: verdict.color },
  ], `2H + G = ${fmt(sum)} cm — ${verdict.label}`, verdict)
}
