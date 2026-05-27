/** Formats de page — dimensions en px (@ ~96 dpi, 1 mm ≈ 3.78 px) */
export const MM_TO_PX = 3.78

export const PAGE_FORMATS = [
  { id: 'a4p', l: 'A4 Portrait', w: 794, h: 1123, desc: '210×297 mm', group: 'iso' },
  { id: 'a4l', l: 'A4 Paysage', w: 1123, h: 794, desc: '297×210 mm', group: 'iso' },
  { id: 'a3p', l: 'A3 Portrait', w: 1123, h: 1587, desc: '297×420 mm', group: 'iso' },
  { id: 'a3l', l: 'A3 Paysage', w: 1587, h: 1123, desc: '420×297 mm', group: 'iso' },
  { id: 'a5p', l: 'A5 Portrait', w: 559, h: 794, desc: '148×210 mm', group: 'iso' },
  { id: 'ltr', l: 'Letter', w: 816, h: 1056, desc: '8.5×11"', group: 'us' },
  { id: 'ltrl', l: 'Letter Paysage', w: 1056, h: 816, desc: '11×8.5"', group: 'us' },
  { id: 'lgl', l: 'Legal', w: 816, h: 1344, desc: '8.5×14"', group: 'us' },
  { id: 'lgll', l: 'Legal Paysage', w: 1344, h: 816, desc: '14×8.5"', group: 'us' },
  { id: 'tbl', l: 'Tabloid', w: 1056, h: 1632, desc: '11×17"', group: 'us' },
  { id: 'sq', l: 'Carré', w: 794, h: 794, desc: '210×210 mm', group: 'other' },
  { id: 'custom', l: 'Personnalisé', w: 794, h: 1123, desc: 'Taille libre', group: 'other', custom: true },
]

export function getFormatById(id) {
  return PAGE_FORMATS.find(f => f.id === id) || PAGE_FORMATS[0]
}

export function resolvePageDimensions(formatId, customMm) {
  if (formatId === 'custom' && customMm?.w && customMm?.h) {
    return {
      w: Math.max(200, Math.round(customMm.w * MM_TO_PX)),
      h: Math.max(200, Math.round(customMm.h * MM_TO_PX)),
    }
  }
  const f = getFormatById(formatId)
  return { w: f.w, h: f.h }
}

export function formatLabel(formatId, customMm) {
  if (formatId === 'custom' && customMm?.w && customMm?.h) {
    return `${customMm.w}×${customMm.h} mm`
  }
  return getFormatById(formatId).desc
}

const ORIENTATION_PAIRS = {
  a4p: 'a4l', a4l: 'a4p',
  a3p: 'a3l', a3l: 'a3p',
  ltr: 'ltrl', ltrl: 'ltr',
  lgl: 'lgll', lgll: 'lgl',
}

export function flipPageOrientation(formatId, customMm) {
  if (formatId === 'custom') {
    return {
      format: 'custom',
      customMm: { w: customMm?.h ?? 297, h: customMm?.w ?? 210 },
    }
  }
  const next = ORIENTATION_PAIRS[formatId]
  return next ? { format: next } : { format: formatId }
}
