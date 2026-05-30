// @ts-nocheck
export const LENGTH_UNITS = [
  { id: 'mm', label: 'mm', toCm: (v) => v / 10, fromCm: (v) => v * 10 },
  { id: 'cm', label: 'cm', toCm: (v) => v, fromCm: (v) => v },
  { id: 'm', label: 'm', toCm: (v) => v * 100, fromCm: (v) => v / 100 },
]

export const AREA_UNITS = [
  { id: 'cm2', label: 'cm²', toM2: (v) => v / 10_000, fromM2: (v) => v * 10_000 },
  { id: 'm2', label: 'm²', toM2: (v) => v, fromM2: (v) => v },
]

export const VOLUME_UNITS = [
  { id: 'L', label: 'L', toM3: (v) => v / 1000, fromM3: (v) => v * 1000 },
  { id: 'm3', label: 'm³', toM3: (v) => v, fromM3: (v) => v },
]

export function toCm(value, unitId = 'cm') {
  const v = parseFloat(value)
  if (!isFinite(v)) return null
  const u = LENGTH_UNITS.find((x) => x.id === unitId) || LENGTH_UNITS[1]
  return u.toCm(v)
}

export function fromCm(cm, unitId = 'cm') {
  if (cm == null || !isFinite(cm)) return null
  const u = LENGTH_UNITS.find((x) => x.id === unitId) || LENGTH_UNITS[1]
  return u.fromCm(cm)
}

export function fmt(value, decimals = 2) {
  if (value == null || !isFinite(value)) return '—'
  const abs = Math.abs(value)
  if (abs >= 1000) return (+value.toFixed(1)).toLocaleString('fr-FR')
  if (abs >= 10) return (+value.toFixed(decimals)).toLocaleString('fr-FR')
  return (+value.toFixed(Math.min(decimals + 1, 3))).toLocaleString('fr-FR')
}

export function parseNum(value) {
  const v = parseFloat(String(value ?? '').replace(',', '.'))
  return isFinite(v) ? v : null
}
