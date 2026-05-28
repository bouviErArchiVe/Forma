/** Bornes visuelles d'une page tournée (coords canvas = base non tournée). */

export function computeRotatedBounds(baseW, baseH, rotationDeg = 0) {
  const w = baseW || 1
  const h = baseH || 1
  const rot = ((rotationDeg % 360) + 360) % 360
  if (rot === 0) {
    return { baseW: w, baseH: h, boxW: w, boxH: h, rotation: 0, offsetX: 0, offsetY: 0 }
  }
  const rad = (rot * Math.PI) / 180
  const cos = Math.abs(Math.cos(rad))
  const sin = Math.abs(Math.sin(rad))
  const boxW = w * cos + h * sin
  const boxH = w * sin + h * cos
  return {
    baseW: w,
    baseH: h,
    boxW,
    boxH,
    rotation: rot,
    offsetX: (boxW - w) / 2,
    offsetY: (boxH - h) / 2,
  }
}

/** Point page (non tourné) → coords dans la boîte d'affichage (display box). */
export function pagePointToBox(px, py, baseW, baseH, rotationDeg = 0, offsetX = 0, offsetY = 0) {
  const rot = ((rotationDeg % 360) + 360) % 360
  if (!rot) return { x: px + offsetX, y: py + offsetY }
  const rad = (rot * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const cx = px - baseW / 2
  const cy = py - baseH / 2
  return {
    x: cx * cos - cy * sin + baseW / 2 + offsetX,
    y: cx * sin + cy * cos + baseH / 2 + offsetY,
  }
}

/** Coords boîte d'affichage → point page (non tourné). */
export function boxPointToPage(bx, by, baseW, baseH, rotationDeg = 0, offsetX = 0, offsetY = 0) {
  const lx = bx - offsetX
  const ly = by - offsetY
  const rot = ((rotationDeg % 360) + 360) % 360
  if (!rot) return { x: lx, y: ly }
  const rad = (-rot * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const cx = lx - baseW / 2
  const cy = ly - baseH / 2
  return {
    x: cx * cos - cy * sin + baseW / 2,
    y: cx * sin + cy * cos + baseH / 2,
  }
}
