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
