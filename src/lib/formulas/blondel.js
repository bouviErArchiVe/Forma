import { toCm, fromCm, fmt, parseNum } from '@/lib/formulas/units'

const BLONDEL_MIN = 60
const BLONDEL_MAX = 64

export function blondelVerdict(sumCm) {
  if (sumCm == null || !isFinite(sumCm)) return { id: 'unknown', label: 'Données insuffisantes', color: '#888' }
  if (sumCm < 58) return { id: 'steep', label: 'Trop raide', color: '#e94560' }
  if (sumCm < BLONDEL_MIN) return { id: 'limit-low', label: 'Limite (raide)', color: '#f5a623' }
  if (sumCm <= BLONDEL_MAX) return { id: 'ok', label: 'Confortable', color: '#2d6a4f' }
  if (sumCm <= 66) return { id: 'limit-high', label: 'Limite (plat)', color: '#f5a623' }
  return { id: 'flat', label: 'Non conforme (trop plat)', color: '#e94560' }
}

function baseResults({ stepH, tread, steps, totalLength, slopeDeg, blondelSum, unit }) {
  const verdict = blondelVerdict(blondelSum)
  return {
    verdict,
    rows: [
      { label: 'Hauteur de marche (H)', value: `${fmt(fromCm(stepH, unit))} ${unit}` },
      { label: 'Giron (G)', value: `${fmt(fromCm(tread, unit))} ${unit}` },
      { label: 'Nombre de marches', value: steps != null ? String(steps) : '—' },
      { label: 'Longueur développée', value: totalLength != null ? `${fmt(fromCm(totalLength, unit))} ${unit}` : '—' },
      { label: '2H + G (Blondel)', value: blondelSum != null ? `${fmt(blondelSum)} cm` : '—' },
      { label: 'Pente', value: slopeDeg != null ? `${fmt(slopeDeg, 1)}°` : '—' },
      { label: 'Verdict', value: verdict.label, highlight: verdict.color },
    ],
    summary: blondelSum != null
      ? `2H + G = ${fmt(blondelSum)} cm → ${verdict.label}`
      : verdict.label,
  }
}

/** Mode 1 : hauteur totale + nombre de marches */
export function blondelFromHeightSteps(values, unit = 'cm') {
  const totalH = toCm(values.totalHeight, unit)
  const steps = parseNum(values.steps)
  if (totalH == null || steps == null || steps < 1) return { error: 'Entrez une hauteur totale et un nombre de marches valides.' }

  const stepH = totalH / steps
  const tread = (BLONDEL_MIN + BLONDEL_MAX) / 2 - 2 * stepH
  const blondelSum = 2 * stepH + tread
  const totalLength = tread * Math.max(steps - 1, 0)
  const slopeDeg = totalLength > 0 ? (Math.atan(totalH / totalLength) * 180) / Math.PI : null

  return baseResults({ stepH, tread, steps, totalLength, slopeDeg, blondelSum, unit })
}

/** Mode 2 : H + G → vérification */
export function blondelFromStepTread(values, unit = 'cm') {
  const stepH = toCm(values.stepHeight, unit)
  const tread = toCm(values.tread, unit)
  if (stepH == null || tread == null) return { error: 'Entrez H et G.' }

  const blondelSum = 2 * stepH + tread
  const slopeDeg = tread > 0 ? (Math.atan(stepH / tread) * 180) / Math.PI : null
  return baseResults({ stepH, tread, steps: null, totalLength: tread, slopeDeg, blondelSum, unit })
}

/** Mode 3 : hauteur totale + longueur disponible */
export function blondelFromHeightLength(values, unit = 'cm') {
  const totalH = toCm(values.totalHeight, unit)
  const avail = toCm(values.availableLength, unit)
  if (totalH == null || avail == null || avail <= 0) return { error: 'Entrez hauteur totale et longueur disponible.' }

  let best = null
  for (let steps = 2; steps <= 30; steps += 1) {
    const stepH = totalH / steps
    const tread = avail / Math.max(steps - 1, 1)
    const blondelSum = 2 * stepH + tread
    const score = Math.abs(blondelSum - 62)
    if (!best || score < best.score) {
      best = { steps, stepH, tread, blondelSum, totalLength: avail, score,
        slopeDeg: (Math.atan(totalH / avail) * 180) / Math.PI }
    }
  }
  if (!best) return { error: 'Impossible de calculer.' }
  return baseResults({ ...best, unit })
}

export function computeBlondel(mode, values, unit = 'cm') {
  switch (mode) {
    case 'height-steps': return blondelFromHeightSteps(values, unit)
    case 'step-tread': return blondelFromStepTread(values, unit)
    case 'height-length': return blondelFromHeightLength(values, unit)
    default: return { error: 'Mode inconnu.' }
  }
}
