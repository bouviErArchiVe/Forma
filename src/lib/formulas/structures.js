import { fmt, parseNum } from '@/lib/formulas/units'

function ok(rows, summary) {
  return { rows, summary, verdict: { id: 'ok', label: 'Calculé', color: '#2d6a4f' } }
}

export function loadTotal(v) {
  const g = parseNum(v.permanent)
  const q = parseNum(v.exploitation)
  if (g == null || q == null) return { error: 'Charges permanentes et d\'exploitation requises.' }
  const total = g + q
  return ok([{ label: 'Charge totale', value: `${fmt(total)} kN/m²` }], `G + Q = ${fmt(total)} kN/m²`)
}

export function linearLoad(v) {
  const q = parseNum(v.surfaceLoad)
  const w = parseNum(v.tributaryWidth)
  if (q == null || w == null) return { error: 'Charge surfacique et largeur tributaire requises.' }
  const ql = q * w
  return ok([{ label: 'Charge linéaire', value: `${fmt(ql)} kN/m` }], `q × l = ${fmt(ql)} kN/m`)
}

export function beamMoment(v) {
  const q = parseNum(v.load)
  const L = parseNum(v.span)
  if (q == null || L == null) return { error: 'Charge et portée requises.' }
  const M = (q * L * L) / 8
  return ok([{ label: 'Moment max.', value: `${fmt(M)} kN·m` }], `M = qL²/8 = ${fmt(M)} kN·m`)
}

export function beamShear(v) {
  const q = parseNum(v.load)
  const L = parseNum(v.span)
  if (q == null || L == null) return { error: 'Charge et portée requises.' }
  const V = (q * L) / 2
  return ok([{ label: 'Effort tranchant max.', value: `${fmt(V)} kN` }], `V = qL/2 = ${fmt(V)} kN`)
}

export function rectArea(v) {
  const l = parseNum(v.length)
  const w = parseNum(v.width)
  if (l == null || w == null) return { error: 'Longueur et largeur requises.' }
  const s = l * w
  return ok([{ label: 'Surface', value: `${fmt(s)} m²` }], `S = L × l = ${fmt(s)} m²`)
}

export function weightVolume(v) {
  const vol = parseNum(v.volume)
  const rho = parseNum(v.density)
  if (vol == null || rho == null) return { error: 'Volume et masse volumique requis.' }
  const p = vol * rho
  return ok([{ label: 'Poids', value: `${fmt(p)} kg` }], `P = V × ρ = ${fmt(p)} kg`)
}
