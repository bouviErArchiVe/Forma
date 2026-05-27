import { fmt, parseNum } from '@/lib/formulas/units'

function ok(rows, summary, verdict) {
  return { rows, summary, verdict: verdict || { id: 'ok', label: 'Calculé', color: '#2d6a4f' } }
}

export function slopePercentToDegrees(v) {
  const p = parseNum(v.percent)
  if (p == null) return { error: 'Pente % requise.' }
  const deg = (Math.atan(p / 100) * 180) / Math.PI
  return ok([
    { label: 'Pente', value: `${fmt(p, 2)} %` },
    { label: 'Angle', value: `${fmt(deg, 2)}°` },
    { label: 'Ratio', value: `1:${fmt(100 / p, 1)}` },
  ], `${fmt(p, 2)} % = ${fmt(deg, 2)}°`)
}

export function slopeDegreesToPercent(v) {
  const d = parseNum(v.degrees)
  if (d == null) return { error: 'Angle requis.' }
  const p = Math.tan((d * Math.PI) / 180) * 100
  return ok([
    { label: 'Angle', value: `${fmt(d, 2)}°` },
    { label: 'Pente', value: `${fmt(p, 2)} %` },
  ], `${fmt(d, 2)}° = ${fmt(p, 2)} %`)
}

export function slopeRamp(v) {
  const rise = parseNum(v.rise)
  const run = parseNum(v.run)
  if (rise == null || run == null || run <= 0) return { error: 'Dénivelé et longueur requis.' }
  const pct = (rise / run) * 100
  const deg = (Math.atan(rise / run) * 180) / Math.PI
  let verdict
  if (pct <= 5) verdict = { id: 'ok', label: 'Rampe accessible (≤ 5 %)', color: '#2d6a4f' }
  else if (pct <= 8) verdict = { id: 'limit', label: 'Limite PMR (5–8 %)', color: '#f5a623' }
  else verdict = { id: 'bad', label: 'Pente trop forte', color: '#e94560' }
  return ok([
    { label: 'Dénivelé', value: `${fmt(rise)} m` },
    { label: 'Longueur horizontale', value: `${fmt(run)} m` },
    { label: 'Pente', value: `${fmt(pct, 2)} %` },
    { label: 'Angle', value: `${fmt(deg, 2)}°` },
    { label: 'Verdict', value: verdict.label, highlight: verdict.color },
  ], `${fmt(pct, 2)} % — ${verdict.label}`, verdict)
}
