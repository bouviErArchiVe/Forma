import { convertValue, convertDrawingScale } from '@/lib/units'

export function calcAreaRect(w, h) {
  const a = parseFloat(w)
  const b = parseFloat(h)
  if (!isFinite(a) || !isFinite(b)) return null
  return a * b
}

export function calcVolumeBox(w, h, d) {
  const a = parseFloat(w)
  const b = parseFloat(h)
  const c = parseFloat(d)
  if (!isFinite(a) || !isFinite(b) || !isFinite(c)) return null
  return a * b * c
}

/** Pente : rise / run → % et degrés */
export function calcSlope(rise, run) {
  const r = parseFloat(rise)
  const u = parseFloat(run)
  if (!isFinite(r) || !isFinite(u) || u === 0) return null
  const ratio = r / u
  const pct = ratio * 100
  const deg = (Math.atan(ratio) * 180) / Math.PI
  return { ratio, pct, deg }
}

/** Angle rectangle : opposé / adjacent */
export function calcAngleFromSides(opp, adj) {
  const o = parseFloat(opp)
  const a = parseFloat(adj)
  if (!isFinite(o) || !isFinite(a) || a === 0) return null
  return (Math.atan(o / a) * 180) / Math.PI
}

/** Règle de trois : a → b comme c → x */
export function ruleOfThree(a, b, c) {
  const va = parseFloat(a)
  const vb = parseFloat(b)
  const vc = parseFloat(c)
  if (!isFinite(va) || !isFinite(vb) || !isFinite(vc) || va === 0) return null
  return (vb * vc) / va
}

/** Proportion A:B = C:? */
export function proportion(a, b, c) {
  return ruleOfThree(a, b, c)
}

/** Ratio simplifié */
export function simplifyRatio(a, b) {
  const va = Math.round(parseFloat(a))
  const vb = Math.round(parseFloat(b))
  if (!isFinite(va) || !isFinite(vb) || vb === 0) return null
  const g = (x, y) => (y === 0 ? x : g(y, x % y))
  const d = g(Math.abs(va), Math.abs(vb))
  return { a: va / d, b: vb / d, decimal: va / vb }
}

export { convertValue, convertDrawingScale }
