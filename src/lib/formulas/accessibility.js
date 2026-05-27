import { fmt, parseNum } from '@/lib/formulas/units'

function ok(rows, summary, verdict) {
  return { rows, summary, verdict: verdict || { id: 'ok', label: 'Calculé', color: '#2d6a4f' } }
}

export function accessRampSlope(v) {
  const rise = parseNum(v.rise)
  const run = parseNum(v.run)
  const maxPct = parseNum(v.maxPercent) ?? 5
  if (rise == null || run == null || run <= 0) return { error: 'Dénivelé et longueur requis.' }
  const pct = (rise / run) * 100
  const verdict = pct <= maxPct
    ? { id: 'ok', label: 'Conforme', color: '#2d6a4f' }
    : { id: 'bad', label: 'Non conforme', color: '#e94560' }
  return ok([
    { label: 'Pente', value: `${fmt(pct, 2)} %` },
    { label: 'Maximum autorisé', value: `${fmt(maxPct, 1)} %` },
    { label: 'Verdict', value: verdict.label, highlight: verdict.color },
  ], `${fmt(pct, 2)} % — ${verdict.label}`, verdict)
}

export function accessRampLength(v) {
  const rise = parseNum(v.rise)
  const maxPct = parseNum(v.maxPercent) ?? 5
  if (rise == null || maxPct <= 0) return { error: 'Hauteur à franchir requise.' }
  const run = (rise * 100) / maxPct
  return ok([
    { label: 'Hauteur', value: `${fmt(rise)} m` },
    { label: 'Pente max', value: `${fmt(maxPct, 1)} %` },
    { label: 'Longueur min.', value: `${fmt(run)} m` },
  ], `Rampe min. ${fmt(run)} m`)
}

export function accessClearHeight(v) {
  const floor = parseNum(v.floorHeight)
  const minClear = parseNum(v.minClear) ?? 2.05
  if (floor == null) return { error: 'Hauteur sous plafond requise.' }
  const verdict = floor >= minClear
    ? { id: 'ok', label: 'Conforme', color: '#2d6a4f' }
    : { id: 'bad', label: 'Insuffisant', color: '#e94560' }
  return ok([
    { label: 'Hauteur libre', value: `${fmt(floor)} m` },
    { label: 'Minimum', value: `${fmt(minClear)} m` },
    { label: 'Verdict', value: verdict.label, highlight: verdict.color },
  ], verdict.label, verdict)
}
