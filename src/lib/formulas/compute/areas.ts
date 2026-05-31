import { fmt, parseNum } from './units'
import type { FormulaResult, FormulaResultRow, FormulaValues } from '../types'

function ok(rows: FormulaResultRow[], summary: string): FormulaResult {
  return { rows, summary, verdict: { id: 'ok', label: 'Calculé', color: '#2d6a4f' } }
}

export function areaRectangle(v: FormulaValues): FormulaResult {
  const l = parseNum(v.length)
  const w = parseNum(v.width)
  if (l == null || w == null) return { error: 'Longueur et largeur requises.' }
  const area = l * w
  return ok([
    { label: 'Surface', value: `${fmt(area)} m²` },
    { label: 'Périmètre', value: `${fmt(2 * (l + w))} m` },
  ], `Surface rectangle = ${fmt(area)} m²`)
}

export function areaTriangle(v: FormulaValues): FormulaResult {
  const b = parseNum(v.base)
  const h = parseNum(v.height)
  if (b == null || h == null) return { error: 'Base et hauteur requises.' }
  const area = (b * h) / 2
  return ok([{ label: 'Surface', value: `${fmt(area)} m²` }], `Surface triangle = ${fmt(area)} m²`)
}

export function areaCircle(v: FormulaValues): FormulaResult {
  const d = parseNum(v.diameter)
  if (d == null) return { error: 'Diamètre requis.' }
  const r = d / 2
  const area = Math.PI * r * r
  return ok([
    { label: 'Surface', value: `${fmt(area)} m²` },
    { label: 'Circonférence', value: `${fmt(Math.PI * d)} m` },
  ], `Surface cercle = ${fmt(area)} m²`)
}

export function areaTrapezoid(v: FormulaValues): FormulaResult {
  const a = parseNum(v.baseA)
  const b = parseNum(v.baseB)
  const h = parseNum(v.height)
  if (a == null || b == null || h == null) return { error: 'Bases et hauteur requises.' }
  const area = ((a + b) / 2) * h
  return ok([{ label: 'Surface', value: `${fmt(area)} m²` }], `Surface trapèze = ${fmt(area)} m²`)
}

export function areaRoom(v: FormulaValues): FormulaResult {
  const l = parseNum(v.length)
  const w = parseNum(v.width)
  if (l == null || w == null) return { error: 'Dimensions requises.' }
  const area = l * w
  return ok([
    { label: 'Surface au sol', value: `${fmt(area)} m²` },
    { label: 'Dimensions', value: `${fmt(l)} × ${fmt(w)} m` },
  ], `Pièce : ${fmt(area)} m²`)
}

export function areaWall(v: FormulaValues): FormulaResult {
  const l = parseNum(v.length)
  const h = parseNum(v.height)
  const openings = parseNum(v.openings) || 0
  if (l == null || h == null) return { error: 'Longueur et hauteur requises.' }
  const gross = l * h
  const net = Math.max(0, gross - openings)
  return ok([
    { label: 'Surface brute', value: `${fmt(gross)} m²` },
    { label: 'Ouvertures déduites', value: `${fmt(openings)} m²` },
    { label: 'Surface nette', value: `${fmt(net)} m²` },
  ], `Mur net : ${fmt(net)} m²`)
}

export function areaFloor(v: FormulaValues): FormulaResult {
  const l = parseNum(v.length)
  const w = parseNum(v.width)
  const waste = parseNum(v.waste) ?? 10
  if (l == null || w == null) return { error: 'Dimensions requises.' }
  const base = l * w
  const withWaste = base * (1 + waste / 100)
  return ok([
    { label: 'Surface plancher', value: `${fmt(base)} m²` },
    { label: 'Perte (+%)', value: `${fmt(waste, 0)} %` },
    { label: 'Surface commande', value: `${fmt(withWaste)} m²` },
  ], `Plancher + ${waste}% = ${fmt(withWaste)} m²`)
}
