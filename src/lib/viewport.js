/** Viewport math — zoom centré curseur, coords écran ↔ page */

export const ZOOM_MIN = 0.25
export const ZOOM_MAX = 3
export const ZOOM_DEFAULT = 0.85

export function clampZoom(z, min = ZOOM_MIN, max = ZOOM_MAX) {
  return Math.min(max, Math.max(min, z))
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

export function screenToPage({ sx, sy, viewW, viewH, pageW, pageH, zoom, panX, panY }) {
  return {
    x: pageW / 2 + (sx - viewW / 2 - panX) / zoom,
    y: pageH / 2 + (sy - viewH / 2 - panY) / zoom,
  }
}

export function zoomByFactor(viewport, factor, pointer, viewW, viewH) {
  const newZoom = clampZoom(viewport.zoom * factor)
  if (pointer && viewW && viewH) {
    return zoomAtPoint({ ...viewport, viewW, viewH, sx: pointer.x, sy: pointer.y, newZoom })
  }
  return { ...viewport, zoom: newZoom }
}
