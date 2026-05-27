import { convertDrawingScale, parseScaleFactor } from '@/lib/units'
import { fmt, parseNum } from '@/lib/formulas/units'

function ok(rows, summary) {
  return { rows, summary, verdict: { id: 'ok', label: 'Converti', color: '#2d6a4f' } }
}

export function scaleDrawingToReal(v) {
  const drawing = parseNum(v.drawing)
  const fromUnit = v.fromUnit || 'mm'
  const scale = v.scale || '1:50'
  if (drawing == null) return { error: 'Longueur dessin requise.' }
  const r = convertDrawingScale(drawing, fromUnit, scale)
  if (!r) return { error: 'Échelle ou unité invalide.' }
  return ok([
    { label: 'Mesure dessin', value: `${fmt(drawing)} ${fromUnit}` },
    { label: 'Échelle', value: scale },
    { label: 'Réel (mm)', value: `${fmt(r.mm)} mm` },
    { label: 'Réel (cm)', value: `${fmt(r.cm)} cm` },
    { label: 'Réel (m)', value: `${fmt(r.m)} m` },
  ], `À l'échelle ${scale} : ${fmt(r.m)} m`)
}

export function scaleRealToDrawing(v) {
  const real = parseNum(v.real)
  const toUnit = v.toUnit || 'mm'
  const scale = v.scale || '1:50'
  if (real == null) return { error: 'Longueur réelle requise (m).' }
  const factor = parseScaleFactor(scale)
  const realMm = real * 1000
  const drawMm = realMm / factor
  const draw = toUnit === 'cm' ? drawMm / 10 : toUnit === 'm' ? drawMm / 1000 : drawMm
  return ok([
    { label: 'Réel', value: `${fmt(real)} m` },
    { label: 'Échelle', value: scale },
    { label: 'Sur plan', value: `${fmt(draw)} ${toUnit}` },
    { label: 'Facteur', value: fmt(factor, 4) },
  ], `Sur plan ${scale} : ${fmt(draw)} ${toUnit}`)
}

export function scaleFactor(v) {
  const scale = v.scale || '1:50'
  const factor = parseScaleFactor(scale)
  return ok([
    { label: 'Échelle', value: scale },
    { label: '1 unité plan → réel', value: `${fmt(factor)} unités` },
    { label: '1 m réel → plan (mm)', value: `${fmt(1000 / factor)} mm` },
  ], `Facteur ${scale} = ×${fmt(factor)}`)
}
