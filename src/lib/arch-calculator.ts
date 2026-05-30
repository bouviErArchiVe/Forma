import { convertDrawingScale, convertValue } from './units'

export function calcAreaRect(w: string | number, h: string | number): number | null {
  const a = parseFloat(String(w))
  const b = parseFloat(String(h))
  if (!isFinite(a) || !isFinite(b)) return null
  return a * b
}

export function calcVolumeBox(
  w: string | number,
  h: string | number,
  d: string | number,
): number | null {
  const a = parseFloat(String(w))
  const b = parseFloat(String(h))
  const c = parseFloat(String(d))
  if (!isFinite(a) || !isFinite(b) || !isFinite(c)) return null
  return a * b * c
}

export function calcSlope(
  rise: string | number,
  run: string | number,
): { ratio: number; pct: number; deg: number } | null {
  const r = parseFloat(String(rise))
  const u = parseFloat(String(run))
  if (!isFinite(r) || !isFinite(u) || u === 0) return null
  const ratio = r / u
  const pct = ratio * 100
  const deg = (Math.atan(ratio) * 180) / Math.PI
  return { ratio, pct, deg }
}

export function calcAngleFromSides(opp: string | number, adj: string | number): number | null {
  const o = parseFloat(String(opp))
  const a = parseFloat(String(adj))
  if (!isFinite(o) || !isFinite(a) || a === 0) return null
  return (Math.atan(o / a) * 180) / Math.PI
}

export function ruleOfThree(a: string | number, b: string | number, c: string | number): number | null {
  const va = parseFloat(String(a))
  const vb = parseFloat(String(b))
  const vc = parseFloat(String(c))
  if (!isFinite(va) || !isFinite(vb) || !isFinite(vc) || va === 0) return null
  return (vb * vc) / va
}

export function proportion(a: string | number, b: string | number, c: string | number): number | null {
  return ruleOfThree(a, b, c)
}

export function simplifyRatio(
  a: string | number,
  b: string | number,
): { a: number; b: number; decimal: number } | null {
  const va = Math.round(parseFloat(String(a)))
  const vb = Math.round(parseFloat(String(b)))
  if (!isFinite(va) || !isFinite(vb) || vb === 0) return null
  const g = (x: number, y: number): number => (y === 0 ? x : g(y, x % y))
  const d = g(Math.abs(va), Math.abs(vb))
  return { a: va / d, b: vb / d, decimal: va / vb }
}

export { convertValue, convertDrawingScale }
