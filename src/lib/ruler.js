import { MM_TO_PX } from '@/lib/pageFormats'
import { parseScaleFactor } from '@/lib/units'

const TARGET_MAJOR_SCREEN_PX = 64

function pickNiceStepRealMm(valueMm, unitSys) {
  if (valueMm <= 0) return unitSys === 'imperial' ? 25.4 : 10
  if (unitSys === 'imperial') {
    const stepsIn = [1 / 16, 1 / 8, 1 / 4, 1 / 2, 1, 2, 3, 6, 12, 24, 48, 120]
    for (const stepIn of stepsIn) {
      const stepMm = stepIn * 25.4
      if (stepMm >= valueMm * 0.65) return stepMm
    }
    return stepsIn[stepsIn.length - 1] * 25.4
  }
  const pow = 10 ** Math.floor(Math.log10(Math.max(valueMm, 0.001)))
  const n = valueMm / pow
  let nice = 10
  if (n <= 1) nice = 1
  else if (n <= 2) nice = 2
  else if (n <= 5) nice = 5
  return nice * pow
}

/** Formate une distance réelle (mm) pour affichage sur la règle. */
export function formatRulerLabel(realMm, unitSys) {
  if (!isFinite(realMm) || realMm < 0) return ''
  if (unitSys === 'imperial') {
    const totalIn = realMm / 25.4
    if (totalIn >= 12) {
      const ft = Math.round((totalIn / 12) * 100) / 100
      return Number.isInteger(ft) ? `${ft}'` : `${ft.toFixed(1)}'`
    }
    if (totalIn >= 1) {
      const quarters = Math.round(totalIn * 4) / 4
      return Number.isInteger(quarters) ? `${quarters}"` : `${quarters.toFixed(2).replace(/\.?0+$/, '')}"`
    }
    const sixteenths = Math.round(totalIn * 16) / 16
    return `${sixteenths}"`
  }
  if (realMm >= 1000) {
    const m = Math.round((realMm / 1000) * 100) / 100
    return `${m}m`
  }
  if (realMm >= 100) {
    const cm = Math.round(realMm / 10)
    return `${cm}cm`
  }
  if (realMm >= 10) {
    const cm = Math.round(realMm / 10 * 10) / 10
    return `${cm}cm`
  }
  return `${Math.round(realMm)}mm`
}

/**
 * Graduations de règle synchronisées avec unités, échelle et zoom.
 * Les positions x sont en pixels page ; les labels = distances réelles à l'échelle.
 */
export function buildRulerTicks({
  widthPx,
  unitSys = 'metric',
  scale = '1:50',
  zoom = 1,
  mmToPx = MM_TO_PX,
}) {
  const scaleFactor = parseScaleFactor(scale)
  const z = Math.max(zoom, 0.01)
  const targetDrawPx = TARGET_MAJOR_SCREEN_PX / z
  const targetDrawMm = targetDrawPx / mmToPx
  const targetRealMm = targetDrawMm * scaleFactor
  const majorRealMm = pickNiceStepRealMm(targetRealMm, unitSys)
  const majorDrawPx = (majorRealMm / scaleFactor) * mmToPx

  if (!isFinite(majorDrawPx) || majorDrawPx <= 0.5) {
    return { ticks: [], majorDrawPx: 1, majorRealMm: 0, scaleFactor, labelScale: 1 / z }
  }

  const subdivisions = majorRealMm >= 50 || unitSys === 'imperial' ? 10 : 5
  const ticks = []

  for (let x = 0; x <= widthPx + 0.5; x += majorDrawPx) {
    const drawMm = x / mmToPx
    const realMm = drawMm * scaleFactor
    ticks.push({
      x,
      kind: 'major',
      label: x < 0.5 ? null : formatRulerLabel(realMm, unitSys),
    })

    if (x + majorDrawPx <= widthPx + 0.5) {
      const minorStep = majorDrawPx / subdivisions
      for (let j = 1; j < subdivisions; j++) {
        const sx = x + j * minorStep
        if (sx > widthPx + 0.5) break
        ticks.push({
          x: sx,
          kind: j === subdivisions / 2 ? 'med' : 'minor',
          label: null,
        })
      }
    }
  }

  return {
    ticks,
    majorDrawPx,
    majorRealMm,
    scaleFactor,
    labelScale: 1 / z,
  }
}
