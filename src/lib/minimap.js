/** Viewport ↔ page coords (transform: center origin + translate + scale) */

export function getViewportInPage({ pageW, pageH, viewW, viewH, zoom, panX, panY }) {
  const x1 = pageW / 2 - (viewW / 2 + panX) / zoom
  const y1 = pageH / 2 - (viewH / 2 + panY) / zoom
  const x2 = pageW / 2 + (viewW / 2 - panX) / zoom
  const y2 = pageH / 2 + (viewH / 2 - panY) / zoom
  return { x1, y1, x2, y2, w: x2 - x1, h: y2 - y1 }
}

export function panForPagePoint({ pageX, pageY, pageW, pageH, zoom }) {
  return {
    panX: (pageW / 2 - pageX) * zoom,
    panY: (pageH / 2 - pageY) * zoom,
  }
}

export function isPageFullyVisible(vp, pageW, pageH, margin = 24) {
  return (
    vp.x1 >= -margin &&
    vp.y1 >= -margin &&
    vp.x2 <= pageW + margin &&
    vp.y2 <= pageH + margin
  )
}

export function shouldShowMinimap({ pageW, pageH, viewW, viewH, zoom, panX, panY }) {
  if (!viewW || !viewH || !pageW || !pageH) return false
  const vp = getViewportInPage({ pageW, pageH, viewW, viewH, zoom, panX, panY })
  if (!isPageFullyVisible(vp, pageW, pageH)) return true
  return zoom > 1.02 || Math.abs(panX) > 12 || Math.abs(panY) > 12
}

export function minimapLayout(pageW, pageH, maxW = 168, maxH = 130) {
  const ratio = pageW / pageH
  let w = maxW
  let h = w / ratio
  if (h > maxH) {
    h = maxH
    w = h * ratio
  }
  return { w: Math.round(w), h: Math.round(h), scaleX: w / pageW, scaleY: h / pageH }
}

export function pagePointFromMinimap(mx, my, scaleX, scaleY) {
  return { x: mx / scaleX, y: my / scaleY }
}
