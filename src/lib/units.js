export const UNIT_CATEGORIES = [
  { id: "length", label: "Longueur" },
  { id: "area", label: "Surface" },
  { id: "volume", label: "Volume" },
]

// Base units:
// - length: meter
// - area: square meter
// - volume: cubic meter
export const UNITS_BY_CATEGORY = {
  length: [
    { id: "mm", label: "mm", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    { id: "cm", label: "cm", toBase: (v) => v / 100, fromBase: (v) => v * 100 },
    { id: "m", label: "m", toBase: (v) => v, fromBase: (v) => v },
    { id: "km", label: "km", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    { id: "in", label: 'po (")', toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
    { id: "ft", label: "pi (ft)", toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
    { id: "yd", label: "yd", toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
  ],
  area: [
    { id: "mm2", label: "mm²", toBase: (v) => v / 1_000_000, fromBase: (v) => v * 1_000_000 },
    { id: "cm2", label: "cm²", toBase: (v) => v / 10_000, fromBase: (v) => v * 10_000 },
    { id: "m2", label: "m²", toBase: (v) => v, fromBase: (v) => v },
    { id: "km2", label: "km²", toBase: (v) => v * 1_000_000, fromBase: (v) => v / 1_000_000 },
    { id: "in2", label: "in²", toBase: (v) => v * 0.00064516, fromBase: (v) => v / 0.00064516 },
    { id: "ft2", label: "ft²", toBase: (v) => v * 0.09290304, fromBase: (v) => v / 0.09290304 },
    { id: "yd2", label: "yd²", toBase: (v) => v * 0.83612736, fromBase: (v) => v / 0.83612736 },
  ],
  volume: [
    { id: "mm3", label: "mm³", toBase: (v) => v / 1_000_000_000, fromBase: (v) => v * 1_000_000_000 },
    { id: "cm3", label: "cm³", toBase: (v) => v / 1_000_000, fromBase: (v) => v * 1_000_000 },
    { id: "m3", label: "m³", toBase: (v) => v, fromBase: (v) => v },
    { id: "in3", label: "in³", toBase: (v) => v * 0.000016387064, fromBase: (v) => v / 0.000016387064 },
    { id: "ft3", label: "ft³", toBase: (v) => v * 0.028316846592, fromBase: (v) => v / 0.028316846592 },
    { id: "yd3", label: "yd³", toBase: (v) => v * 0.764554857984, fromBase: (v) => v / 0.764554857984 },
  ],
}

export function convertValue(value, categoryId, fromUnitId, toUnitId) {
  const v = typeof value === "number" ? value : parseFloat(String(value || ""))
  if (!isFinite(v)) return ""
  const units = UNITS_BY_CATEGORY[categoryId] || []
  const fu = units.find((u) => u.id === fromUnitId)
  const tu = units.find((u) => u.id === toUnitId)
  if (!fu || !tu) return ""
  const base = fu.toBase(v)
  const out = tu.fromBase(base)
  // keep it stable but not overly rounded
  const rounded = Math.abs(out) >= 1 ? +out.toFixed(8) : +out.toPrecision(10)
  return rounded
}

/** Mesure dessin → réalité selon l'échelle (ex. 1:50) */
export function convertDrawingScale(value, fromUnitId, scaleStr) {
  const v = parseFloat(String(value || ""))
  if (!isFinite(v)) return null
  const lengthUnits = UNITS_BY_CATEGORY.length || []
  const fu = lengthUnits.find((u) => u.id === fromUnitId)
  if (!fu) return null
  const drawingMm = fu.toBase(v) * 1000
  const scParts = String(scaleStr || "1:50").split(":").map(Number)
  const scFactor = scParts.length === 2 && scParts[0] > 0 ? scParts[1] / scParts[0] : 50
  const realMm = drawingMm * scFactor
  return {
    mm: Math.round(realMm * 100) / 100,
    cm: Math.round(realMm / 10 * 100) / 100,
    m: Math.round(realMm / 1000 * 1000) / 1000,
  }
}

