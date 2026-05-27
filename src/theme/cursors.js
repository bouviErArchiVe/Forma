/** Curseurs SVG personnalisés par outil — data-URI, compatibles clair/sombre */

const cache = new Map()

function hexLuminance(hex) {
  const h = (hex || '').replace('#', '').trim()
  if (h.length < 6) return 1
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255
  return 0.299 * r + 0.587 * g + 0.114 * b
}

export function isDarkSurface(T) {
  return hexLuminance(T?.bg) < 0.42
}

function palette(dark) {
  return {
    ink: dark ? '#eef0f4' : '#1c1c24',
    muted: dark ? '#9aa3b2' : '#666',
    accent: dark ? '#58a6ff' : '#2196f3',
    eraser: dark ? '#ff8a80' : '#e57373',
    highlight: dark ? '#fff176' : '#fdd835',
    drop: dark ? '#81c784' : '#43a047',
  }
}

function svgUri(svg) {
  return `data:image/svg+xml,${encodeURIComponent(svg.replace(/\n/g, '').replace(/\s+/g, ' '))}`
}

function makeCursor(svg, hx, hy, fallback = 'auto') {
  return `url("${svgUri(svg)}") ${hx} ${hy}, ${fallback}`
}

function cached(key, factory) {
  if (cache.has(key)) return cache.get(key)
  const val = factory()
  cache.set(key, val)
  return val
}

/* ── SVG par outil (24×24) ─────────────────────────────── */

function penSvg(p) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M4 20 L11 4.5 L17.5 11 L8.5 19.5 Z" fill="${p.accent}" fill-opacity=".28" stroke="${p.ink}" stroke-width="1.4" stroke-linejoin="round"/><circle cx="11" cy="4.5" r="1.3" fill="${p.accent}"/></svg>`
}

function highlightSvg(p) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M5 18 L14 4 L19 9 L10 20 Z" fill="${p.highlight}" fill-opacity=".55" stroke="${p.ink}" stroke-width="1.2" stroke-linejoin="round"/></svg>`
}

function eraserSvg(p) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><rect x="5" y="9" width="14" height="7" rx="1.5" fill="${p.eraser}" fill-opacity=".75" stroke="${p.ink}" stroke-width="1.2"/><path d="M5 11 L19 11" stroke="${p.ink}" stroke-width=".8" opacity=".5"/></svg>`
}

function textSvg(p) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 4 L12 20 M7 4 L17 4 M7 20 L17 20" stroke="${p.ink}" stroke-width="1.6" stroke-linecap="round"/><path d="M10 4 L14 4" stroke="${p.accent}" stroke-width="2" stroke-linecap="round"/></svg>`
}

function eyedropperSvg(p) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M4 20 L14 10 L17 13 L7 23 Z" fill="${p.drop}" fill-opacity=".35" stroke="${p.ink}" stroke-width="1.3" stroke-linejoin="round"/><circle cx="18" cy="6" r="3" fill="${p.accent}" fill-opacity=".5" stroke="${p.ink}" stroke-width="1"/></svg>`
}

function lassoSvg(p) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M6 8 Q12 3 18 8 Q21 14 15 18 Q9 21 6 15 Q4 11 6 8 Z" fill="none" stroke="${p.accent}" stroke-width="1.5" stroke-dasharray="3 2"/><circle cx="6" cy="8" r="1.5" fill="${p.accent}"/></svg>`
}

function lassoRectSvg(p) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><rect x="5" y="6" width="14" height="12" rx="1" fill="none" stroke="${p.accent}" stroke-width="1.5" stroke-dasharray="3 2"/></svg>`
}

function moveSvg(p) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 3 L12 8 M12 16 L12 21 M3 12 L8 12 M16 12 L21 12" stroke="${p.ink}" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="12" r="2.5" fill="${p.accent}" fill-opacity=".6" stroke="${p.ink}" stroke-width="1"/></svg>`
}

function handSvg(p) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M10 4 L10 12 Q10 15 12 15 L12 8 Q12 6 14 6 Q16 6 16 8 L16 14 Q16 17 13 17 L11 17 Q8 17 8 14 L8 10 Q8 8 10 8" fill="${p.ink}" fill-opacity=".15" stroke="${p.ink}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`
}

function grabSvg(p) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M9 5 L9 13 Q9 16 11 16 L11 9 Q11 7 13 7 Q15 7 15 9 L15 15 Q15 18 12 18 L10 18 Q7 18 7 15 L7 11 Q7 9 9 9" fill="${p.accent}" fill-opacity=".25" stroke="${p.ink}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`
}

function shapeSvg(p, type) {
  const base = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">`
  const cross = `<path d="M12 4 L12 20 M4 12 L20 12" stroke="${p.muted}" stroke-width="1" opacity=".45"/>`
  let shape = ''
  if (type === 'line') shape = `<path d="M5 19 L19 5" stroke="${p.accent}" stroke-width="1.8" stroke-linecap="round"/>`
  else if (type === 'rect') shape = `<rect x="6" y="7" width="12" height="10" fill="none" stroke="${p.accent}" stroke-width="1.5" rx="1"/>`
  else if (type === 'circle') shape = `<ellipse cx="12" cy="12" rx="7" ry="5.5" fill="none" stroke="${p.accent}" stroke-width="1.5"/>`
  else if (type === 'arrow') shape = `<path d="M5 19 L19 5 M19 5 L13 5 M19 5 L19 11" fill="none" stroke="${p.accent}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`
  else if (type === 'dimline') shape = `<path d="M4 12 L20 12 M4 12 L4 9 M4 12 L4 15 M20 12 L20 9 M20 12 L20 15" stroke="${p.accent}" stroke-width="1.4" stroke-linecap="round"/>`
  else if (type === 'cloud') shape = `<rect x="5" y="7" width="14" height="9" rx="3" fill="none" stroke="${p.accent}" stroke-width="1.4"/><path d="M8 16 L6 19 L11 16" fill="${p.accent}" fill-opacity=".3" stroke="${p.accent}" stroke-width="1"/>`
  return `${base}${cross}${shape}</svg>`
}

const SHAPE_TOOLS = new Set(['line', 'rect', 'circle', 'arrow', 'shape-arrow', 'dimline', 'cloud'])

/**
 * @param {string} tool — id outil FORMA
 * @param {{ selectionActive?: boolean, dark?: boolean, panning?: boolean }} opts
 */
export function getToolCursor(tool, opts = {}) {
  const { selectionActive = false, dark = false, panning = false } = opts
  const p = palette(dark)

  if (selectionActive) {
    return cached(`move-${dark}`, () => makeCursor(moveSvg(p), 12, 12, 'move'))
  }

  const key = `${tool}-${dark}-${panning}`
  if (cache.has(key)) return cache.get(key)

  let url
  switch (tool) {
    case 'select':
    case 'arrow':
      url = makeCursor(panning ? grabSvg(p) : moveSvg(p), 10, panning ? 12 : 10, panning ? 'grabbing' : 'default')
      break
    case 'hand':
      url = makeCursor(panning ? grabSvg(p) : handSvg(p), 10, panning ? 12 : 10, panning ? 'grabbing' : 'grab')
      break
    case 'pen':
      url = makeCursor(penSvg(p), 4, 20, 'crosshair')
      break
    case 'highlight':
      url = makeCursor(highlightSvg(p), 5, 18, 'crosshair')
      break
    case 'eraser':
      url = makeCursor(eraserSvg(p), 12, 12, 'cell')
      break
    case 'text':
      url = makeCursor(textSvg(p), 12, 12, 'text')
      break
    case 'eyedropper':
      url = makeCursor(eyedropperSvg(p), 4, 20, 'crosshair')
      break
    case 'lasso':
      url = makeCursor(lassoSvg(p), 6, 8, 'crosshair')
      break
    case 'lasso-rect':
      url = makeCursor(lassoRectSvg(p), 12, 12, 'crosshair')
      break
    default:
      if (SHAPE_TOOLS.has(tool)) {
        url = makeCursor(shapeSvg(p, tool), 12, 12, 'crosshair')
      } else {
        url = makeCursor(penSvg(p), 4, 20, 'crosshair')
      }
  }

  cache.set(key, url)
  return url
}

/** Curseur placement bibliothèque (croix + point) */
export function getPlacementCursor(dark = false) {
  const p = palette(dark)
  return cached(`place-${dark}`, () => makeCursor(
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 4 L12 20 M4 12 L20 12" stroke="${p.accent}" stroke-width="1.2" opacity=".7"/><circle cx="12" cy="12" r="2.5" fill="${p.accent}" fill-opacity=".8"/></svg>`,
    12, 12, 'crosshair',
  ))
}
