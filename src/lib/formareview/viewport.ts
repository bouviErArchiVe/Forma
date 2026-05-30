export const ZOOM_MIN = 0.25
export const ZOOM_MAX = 3
export const ZOOM_DEFAULT = 0.85

export interface ViewportState {
  zoom: number
  panX: number
  panY: number
}

export function clampZoom(z: number, min = ZOOM_MIN, max = ZOOM_MAX): number {
  return Math.min(max, Math.max(min, z))
}

export function computeFitZoom({
  viewW,
  viewH,
  pageW,
  pageH,
  padding = 48,
}: {
  viewW: number
  viewH: number
  pageW: number
  pageH: number
  padding?: number
}): number {
  if (!viewW || !viewH || !pageW || !pageH) return ZOOM_DEFAULT
  const z = Math.min((viewW - padding) / pageW, (viewH - padding) / pageH)
  return clampZoom(z)
}

export function zoomAtPoint({
  zoom,
  panX,
  panY,
  viewW,
  viewH,
  sx,
  sy,
  newZoom,
}: ViewportState & { viewW: number; viewH: number; sx: number; sy: number; newZoom: number }): ViewportState {
  const ratio = newZoom / zoom
  const cx = sx - viewW / 2
  const cy = sy - viewH / 2
  return {
    zoom: newZoom,
    panX: cx * (1 - ratio) + panX * ratio,
    panY: cy * (1 - ratio) + panY * ratio,
  }
}

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
}: {
  sx: number
  sy: number
  viewW: number
  viewH: number
  pageW: number
  pageH: number
  zoom: number
  panX: number
  panY: number
}): { x: number; y: number } {
  return {
    x: pageW / 2 + (sx - viewW / 2 - panX) / zoom,
    y: pageH / 2 + (sy - viewH / 2 - panY) / zoom,
  }
}

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
}: {
  px: number
  py: number
  viewW: number
  viewH: number
  pageW: number
  pageH: number
  zoom: number
  panX: number
  panY: number
}): { sx: number; sy: number } {
  return {
    sx: viewW / 2 + (px - pageW / 2) * zoom + panX,
    sy: viewH / 2 + (py - pageH / 2) * zoom + panY,
  }
}

export function clampDocumentPan({
  panX,
  panY,
  zoom,
  viewW,
  viewH,
  pageW,
  pageH,
  margin = 32,
}: ViewportState & {
  viewW: number
  viewH: number
  pageW: number
  pageH: number
  margin?: number
}): Pick<ViewportState, 'panX' | 'panY'> {
  if (!viewW || !viewH || !pageW || !pageH || !zoom) return { panX, panY }
  const halfW = viewW / (2 * zoom)
  const halfH = viewH / (2 * zoom)
  const cx = pageW / 2 - panX / zoom
  const cy = pageH / 2 - panY / zoom
  let nx = cx
  let ny = cy
  if (halfW * 2 >= pageW + margin * 2) nx = pageW / 2
  else nx = Math.max(halfW - margin, Math.min(pageW - halfW + margin, cx))
  if (halfH * 2 >= pageH + margin * 2) ny = pageH / 2
  else ny = Math.max(halfH - margin, Math.min(pageH - halfH + margin, cy))
  return {
    panX: (pageW / 2 - nx) * zoom,
    panY: (pageH / 2 - ny) * zoom,
  }
}

export function zoomByFactor(
  viewport: ViewportState,
  factor: number,
  pointer: { x: number; y: number } | null,
  viewW: number,
  viewH: number,
): ViewportState {
  const newZoom = clampZoom(viewport.zoom * factor)
  if (pointer && viewW && viewH) {
    return zoomAtPoint({ ...viewport, viewW, viewH, sx: pointer.x, sy: pointer.y, newZoom })
  }
  return { ...viewport, zoom: newZoom }
}
