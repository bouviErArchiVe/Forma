import { fmt, parseNum } from '@/lib/formulas/units'

function ok(rows, summary) {
  return { rows, summary, verdict: { id: 'ok', label: 'Calculé', color: '#2d6a4f' } }
}

export function materialTiles(v) {
  const area = parseNum(v.area)
  const tileW = parseNum(v.tileWidth)
  const tileH = parseNum(v.tileHeight)
  const waste = parseNum(v.waste) ?? 10
  if (area == null || tileW == null || tileH == null) return { error: 'Surface et format carreau requis.' }
  const tileM2 = (tileW / 1000) * (tileH / 1000)
  const qty = Math.ceil((area * (1 + waste / 100)) / tileM2)
  return ok([
    { label: 'Surface', value: `${fmt(area)} m²` },
    { label: 'Carreau', value: `${fmt(tileW, 0)} × ${fmt(tileH, 0)} mm` },
    { label: 'Carreaux (+% perte)', value: String(qty) },
  ], `${qty} carreaux (+${waste}%)`)
}

export function materialPaint(v) {
  const area = parseNum(v.area)
  const coverage = parseNum(v.coverage) ?? 10
  const coats = parseNum(v.coats) ?? 2
  if (area == null) return { error: 'Surface à peindre requise.' }
  const liters = (area * coats) / coverage
  return ok([
    { label: 'Surface', value: `${fmt(area)} m²` },
    { label: 'Couches', value: String(coats) },
    { label: 'Rendement', value: `${fmt(coverage)} m²/L` },
    { label: 'Peinture', value: `${fmt(liters, 1)} L` },
  ], `${fmt(liters, 1)} L de peinture`)
}

export function materialConcrete(v) {
  const l = parseNum(v.length)
  const w = parseNum(v.width)
  const t = parseNum(v.thickness)
  if (l == null || w == null || t == null) return { error: 'Dimensions requises.' }
  const m3 = l * w * t
  return ok([{ label: 'Volume béton', value: `${fmt(m3)} m³` }], `Béton : ${fmt(m3)} m³`)
}

export function materialBaseboard(v) {
  const perimeter = parseNum(v.perimeter)
  const openings = parseNum(v.openings) || 0
  if (perimeter == null) return { error: 'Périmètre requis.' }
  const len = Math.max(0, perimeter - openings)
  return ok([
    { label: 'Périmètre', value: `${fmt(perimeter)} m` },
    { label: 'Ouvertures', value: `${fmt(openings)} m` },
    { label: 'Plinthes', value: `${fmt(len)} m` },
  ], `Plinthes : ${fmt(len)} m lin.`)
}

export function materialDrywall(v) {
  const area = parseNum(v.area)
  const sheet = parseNum(v.sheetArea) ?? 2.88
  const waste = parseNum(v.waste) ?? 10
  if (area == null) return { error: 'Surface requise.' }
  const sheets = Math.ceil((area * (1 + waste / 100)) / sheet)
  return ok([
    { label: 'Surface gypse', value: `${fmt(area)} m²` },
    { label: 'Panneaux (estim.)', value: String(sheets) },
  ], `${sheets} panneaux`)
}
