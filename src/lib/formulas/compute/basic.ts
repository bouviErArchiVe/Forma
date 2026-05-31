/** Formules maths de base */
import { fmt } from './units'
import type { FormulaResult, FormulaValues } from '../types'

const n = (v: string | undefined): number => parseFloat(String(v ?? '').replace(',', '.')) || 0

function ok(label: string, value: number, unit = '', detail = ''): FormulaResult {
  const safe = Number.isFinite(value) ? value : 0
  const display = unit ? `${fmt(safe)} ${unit}` : fmt(safe)
  const rows = [{ label, value: display }]
  if (detail) rows.push({ label: 'Détail', value: detail })
  return {
    rows,
    summary: `${label} = ${display}`,
    verdict: { id: 'ok', label: 'Calculé', color: '#2d6a4f' },
  }
}

export function sinDeg(v: FormulaValues): FormulaResult {
  const a = n(v.angle)
  return ok('sin(α)', Math.sin((a * Math.PI) / 180), '', `α = ${a}°`)
}

export function cosDeg(v: FormulaValues): FormulaResult {
  const a = n(v.angle)
  return ok('cos(α)', Math.cos((a * Math.PI) / 180), '', `α = ${a}°`)
}

export function tanDeg(v: FormulaValues): FormulaResult {
  const a = n(v.angle)
  return ok('tan(α)', Math.tan((a * Math.PI) / 180), '', `α = ${a}°`)
}

export function pythagore(v: FormulaValues): FormulaResult {
  const a = n(v.a)
  const b = n(v.b)
  const c = Math.sqrt(a * a + b * b)
  return ok('Hypoténuse c', c, 'm', `c = √(${a}² + ${b}²)`)
}

export function circleArea(v: FormulaValues): FormulaResult {
  const r = n(v.radius)
  return ok('Aire cercle', Math.PI * r * r, 'm²', `A = πr², r = ${r}`)
}

export function circlePerimeter(v: FormulaValues): FormulaResult {
  const r = n(v.radius)
  return ok('Périmètre cercle', 2 * Math.PI * r, 'm', `P = 2πr, r = ${r}`)
}

export function triangleArea(v: FormulaValues): FormulaResult {
  const b = n(v.base)
  const h = n(v.height)
  return ok('Aire triangle', (b * h) / 2, 'm²', `A = bh/2`)
}

export function rectangleArea(v: FormulaValues): FormulaResult {
  const l = n(v.length)
  const w = n(v.width)
  return ok('Aire rectangle', l * w, 'm²', `A = L × l`)
}

export function cubeVolume(v: FormulaValues): FormulaResult {
  const a = n(v.edge)
  return ok('Volume cube', a * a * a, 'm³', `V = a³`)
}

export function cylinderVolume(v: FormulaValues): FormulaResult {
  const r = n(v.radius)
  const h = n(v.height)
  return ok('Volume cylindre', Math.PI * r * r * h, 'm³', `V = πr²h`)
}

export function degToRad(v: FormulaValues): FormulaResult {
  const d = n(v.degrees)
  return ok('Radians', (d * Math.PI) / 180, 'rad', `${d}° → rad`)
}

export function radToDeg(v: FormulaValues): FormulaResult {
  const r = n(v.radians)
  return ok('Degrés', (r * 180) / Math.PI, '°', `${r} rad → °`)
}
