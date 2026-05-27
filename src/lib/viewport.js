/** Viewport math — zoom centré curseur, coords écran ↔ page */

export const ZOOM_MIN = 0.25
export const ZOOM_MAX = 3
export const ZOOM_DEFAULT = 0.85

export function clampZoom(z, min = ZOOM_MIN, max = ZOOM_MAX) {
  return Math.min(max, Math.max(min, z))
}

/** Zoom pour afficher une page entière dans le viewport */
export function computeFitZoom({ viewW, viewH, pageW, pageH, padding = 48 }) {
  if (!viewW || !viewH || !pageW || !pageH) return ZOOM_DEFAULT
  const z = Math.min((viewW - padding) / pageW, (viewH - padding) / pageH)
  return clampZoom(z)
}

/** Garde le point (sx,sy) dans le viewport fixe lors d'un changement de zoom */
export function zoomAtPoint({ zoom, panX, panY, viewW, viewH, sx, sy, newZoom }) {
  const ratio = newZoom / zoom
  const cx = sx - viewW / 2
  const cy = sy - viewH / 2
  return {
    zoom: newZoom,
    panX: cx * (1 - ratio) + panX * ratio,
    panY: cy * (1 - ratio) + panY * ratio,
  }
}

/** Coords écran (viewport) → coords page logique */
export function screenToPage({
  sx,
  sy,
  viewW,
  viewH,
  pageW,
  pageH,
  zoom,
  panX,
  panY,
  offsetX = 0,
  offsetY = 0,
}) {
  const x = pageW / 2 + (sx - viewW / 2 - panX) / zoom - offsetX
  const y = pageH / 2 + (sy - viewH / 2 - panY) / zoom - offsetY
  return { x, y }
}

/** Coords page logique → coords écran (viewport) */
export function pageToScreen({
  px,
  py,
  viewW,
  viewH,
  pageW,
  pageH,
  zoom,
  panX,
  panY,
  offsetX = 0,
  offsetY = 0,
}) {
  const bx = px + offsetX
  const by = py + offsetY
  return {
    sx: viewW / 2 + (bx - pageW / 2) * zoom + panX,
    sy: viewH / 2 + (by - pageH / 2) * zoom + panY,
  }
}

export function clampDocumentPan({ panX, panY, zoom, viewW, viewH, pageW, pageH, margin = 32 }) {
  if (!viewW || !viewH || !pageW || !pageH || !zoom) return { panX, panY }
  const halfW = viewW / (2 * zoom)
  const halfH = viewH / (2 * zoom)
  const cx = pageW / 2 - panX / zoom
  const cy = pageH / 2 - panY / zoom
  let nx = cx
  let ny = cy
  if (halfW * 2 >= pageW + margin * 2) {
    nx = pageW / 2
  } else {
    nx = Math.max(halfW - margin, Math.min(pageW - halfW + margin, cx))
  }
  if (halfH * 2 >= pageH + margin * 2) {
    ny = pageH / 2
  } else {
    ny = Math.max(halfH - margin, Math.min(pageH - halfH + margin, cy))
  }
  return {
    panX: (pageW / 2 - nx) * zoom,
    panY: (pageH / 2 - ny) * zoom,
  }
}

export function zoomByFactor(viewport, factor, pointer, viewW, viewH) {
  const newZoom = clampZoom(viewport.zoom * factor)
  if (pointer && viewW && viewH) {
    return zoomAtPoint({ ...viewport, viewW, viewH, sx: pointer.x, sy: pointer.y, newZoom })
  }
  return { ...viewport, zoom: newZoom }
}
