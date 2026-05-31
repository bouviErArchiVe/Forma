import { fmt, parseNum } from './units'
import type { FormulaResult, FormulaResultRow, FormulaValues } from '../types'

function ok(rows: FormulaResultRow[], summary: string): FormulaResult {
  return { rows, summary, verdict: { id: 'ok', label: 'Calculé', color: '#2d6a4f' } }
}

export function volumeBox(v: FormulaValues): FormulaResult {
  const l = parseNum(v.length)
  const w = parseNum(v.width)
  const h = parseNum(v.height)
  if (l == null || w == null || h == null) return { error: 'L × l × h requis.' }
  const vol = l * w * h
  return ok([{ label: 'Volume', value: `${fmt(vol)} m³` }], `Volume = ${fmt(vol)} m³`)
}

export function volumeCylinder(v: FormulaValues): FormulaResult {
  const d = parseNum(v.diameter)
  const h = parseNum(v.height)
  if (d == null || h == null) return { error: 'Diamètre et hauteur requis.' }
  const vol = Math.PI * (d / 2) ** 2 * h
  return ok([{ label: 'Volume', value: `${fmt(vol)} m³` }], `Cylindre = ${fmt(vol)} m³`)
}

export function volumeConcrete(v: FormulaValues): FormulaResult {
  const l = parseNum(v.length)
  const w = parseNum(v.width)
  const h = parseNum(v.thickness)
  if (l == null || w == null || h == null) return { error: 'Dimensions requises.' }
  const vol = l * w * h
  const bags = Math.ceil(vol * 1000 / 35)
  return ok([
    { label: 'Volume béton', value: `${fmt(vol)} m³` },
    { label: 'Sacs ~35 L (estim.)', value: String(bags) },
  ], `Béton : ${fmt(vol)} m³ (~${bags} sacs)`)
}

export function volumeExcavation(v: FormulaValues): FormulaResult {
  const l = parseNum(v.length)
  const w = parseNum(v.width)
  const d = parseNum(v.depth)
  const swell = parseNum(v.swell) ?? 15
  if (l == null || w == null || d == null) return { error: 'Dimensions requises.' }
  const net = l * w * d
  const haul = net * (1 + swell / 100)
  return ok([
    { label: 'Volume excavation', value: `${fmt(net)} m³` },
    { label: 'Gonflement (+%)', value: `${fmt(swell, 0)} %` },
    { label: 'Volume à évacuer', value: `${fmt(haul)} m³` },
  ], `Excavation : ${fmt(haul)} m³`)
}

export function volumeRoom(v: FormulaValues): FormulaResult {
  const l = parseNum(v.length)
  const w = parseNum(v.width)
  const h = parseNum(v.height)
  if (l == null || w == null || h == null) return { error: 'Dimensions requises.' }
  const vol = l * w * h
  return ok([
    { label: 'Volume pièce', value: `${fmt(vol)} m³` },
    { label: 'Surface sol', value: `${fmt(l * w)} m²` },
  ], `Volume pièce = ${fmt(vol)} m³`)
}
