/** Formats de page — dimensions en px (@ ~96 dpi, 1 mm ≈ 3.78 px) */
export const MM_TO_PX = 3.78

export const PAGE_FORMATS = [
  { id: 'a0', l: 'A0', wMm: 841, hMm: 1189, desc: '841×1189 mm', group: 'iso' },
  { id: 'a1', l: 'A1', wMm: 594, hMm: 841, desc: '594×841 mm', group: 'iso' },
  { id: 'a2', l: 'A2', wMm: 420, hMm: 594, desc: '420×594 mm', group: 'iso' },
  { id: 'a3', l: 'A3', wMm: 297, hMm: 420, desc: '297×420 mm', group: 'iso' },
  { id: 'a4', l: 'A4', wMm: 210, hMm: 297, desc: '210×297 mm', group: 'iso' },
  { id: 'a5', l: 'A5', wMm: 148, hMm: 210, desc: '148×210 mm', group: 'iso' },
  { id: 'a6', l: 'A6', wMm: 105, hMm: 148, desc: '105×148 mm', group: 'iso' },
  { id: 'letter', l: 'Letter', wMm: 216, hMm: 279, desc: '8.5×11"', group: 'us' },
  { id: 'legal', l: 'Legal', wMm: 216, hMm: 356, desc: '8.5×14"', group: 'us' },
  { id: 'square', l: 'Carré', wMm: 210, hMm: 210, desc: '210×210 mm', group: 'other' },
  { id: 'custom', l: 'Personnalisé', wMm: 210, hMm: 297, desc: 'Taille libre', group: 'other', custom: true },
  { id: 'infinite', l: 'Infini', wMm: 3000, hMm: 3000, desc: 'Canvas infini', group: 'other', infinite: true },
]

export const PAGE_ROTATIONS = [
  { id: 0, l: '0°' },
  { id: 90, l: '90° horaire' },
  { id: 270, l: '90° anti-horaire' },
  { id: 120, l: '120°' },
  { id: 180, l: '180°' },
]

const LEGACY_MAP = {
  a4p: { format: 'a4', rotation: 0 },
  a4l: { format: 'a4', rotation: 90 },
  a3p: { format: 'a3', rotation: 0 },
  a3l: { format: 'a3', rotation: 90 },
  a5p: { format: 'a5', rotation: 0 },
  ltr: { format: 'letter', rotation: 0 },
  ltrl: { format: 'letter', rotation: 90 },
  lgl: { format: 'legal', rotation: 0 },
  lgll: { format: 'legal', rotation: 90 },
  tbl: { format: 'letter', rotation: 90 },
  sq: { format: 'square', rotation: 0 },
}

export function normalizeFormatId(formatId, rotation = 0) {
  if (LEGACY_MAP[formatId]) return LEGACY_MAP[formatId]
  const f = PAGE_FORMATS.find((x) => x.id === formatId)
  if (f) return { format: formatId, rotation: rotation || 0 }
  return { format: 'a4', rotation: 0 }
}

export function getFormatById(id) {
  const { format } = normalizeFormatId(id)
  return PAGE_FORMATS.find((f) => f.id === format) || PAGE_FORMATS.find((f) => f.id === 'a4')
}

function mmToPx(wMm, hMm) {
  return {
    w: Math.max(200, Math.round(wMm * MM_TO_PX)),
    h: Math.max(200, Math.round(hMm * MM_TO_PX)),
  }
}

export function resolvePageDimensions(formatId, customMm, rotation = 0) {
  const { format, rotation: rot } = normalizeFormatId(formatId, rotation)
  const fmt = getFormatById(format)

  if (format === 'infinite' || fmt.infinite) {
    return { w: 3000, h: 3000, rotation: rot, infinite: true }
  }

  let wMm = fmt.wMm
  let hMm = fmt.hMm
  if (format === 'custom' && customMm?.w && customMm?.h) {
    wMm = customMm.w
    hMm = customMm.h
  }

  if (rot === 90 || rot === 270) {
    ;[wMm, hMm] = [hMm, wMm]
  }

  const dims = mmToPx(wMm, hMm)
  return { ...dims, rotation: rot, infinite: false }
}

export function formatLabel(formatId, customMm, rotation = 0) {
  const { format, rotation: rot } = normalizeFormatId(formatId, rotation)
  if (format === 'custom' && customMm?.w && customMm?.h) {
    return `${customMm.w}×${customMm.h} mm · ${rot}°`
  }
  const f = getFormatById(format)
  return `${f.desc}${rot ? ` · ${rot}°` : ''}`
}

export function flipPageOrientation(formatId, customMm, currentRotation = 0) {
  const norm = normalizeFormatId(formatId, currentRotation)
  const nextRot = norm.rotation === 0 ? 90 : norm.rotation === 90 ? 0 : norm.rotation === 180 ? 270 : 180
  return { format: norm.format, rotation: nextRot, customMm }
}
