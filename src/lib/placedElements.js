/** Dimensions, bounds et transformations des éléments structuraux placés sur la page. */

export const PLACED_SC = 3.78 / 50

export function getPlacedBaseSize(el = {}) {
  if (el.type === 'spreadsheet') {
    return { w: el.pw || el.w || 320, h: el.ph || el.h || 180 }
  }
  return {
    w: (el.fw || el.w || 0) * PLACED_SC,
    h: (el.h || 0) * PLACED_SC,
  }
}

export function getPlacedSize(item) {
  const base = getPlacedBaseSize(item?.el || {})
  return {
    w: base.w * (item?.scaleX ?? 1),
    h: base.h * (item?.scaleY ?? 1),
  }
}

/** Boîte locale (non tournée) + centre pour les handles. */
export function getPlacedLocalBounds(item) {
  const { w, h } = getPlacedSize(item)
  const cx = item.x + w / 2
  const cy = item.y + h / 2
  return {
    x1: item.x,
    y1: item.y,
    x2: item.x + w,
    y2: item.y + h,
    cx,
    cy,
    w,
    h,
    rotation: item.rotation || 0,
  }
}

/** Boîte englobante axis-aligned (hit-test, lasso). */
export function getPlacedBounds(item) {
  const local = getPlacedLocalBounds(item)
  const rot = local.rotation
  if (!rot) return local

  const rad = (rot * Math.PI) / 180
  const cos = Math.abs(Math.cos(rad))
  const sin = Math.abs(Math.sin(rad))
  const rw = local.w * cos + local.h * sin
  const rh = local.w * sin + local.h * cos
  return {
    ...local,
    x1: local.cx - rw / 2,
    y1: local.cy - rh / 2,
    x2: local.cx + rw / 2,
    y2: local.cy + rh / 2,
  }
}

export function snapRotation(deg, snap = false) {
  const n = ((deg % 360) + 360) % 360
  if (!snap) return Math.round(n)
  return Math.round(n / 45) * 45
}

export function resizePlacedItem(item, x1, y1, x2, y2, { lockRatio = false } = {}) {
  const base = getPlacedBaseSize(item.el || {})
  if (base.w <= 0 || base.h <= 0) return item

  let nx1 = Math.min(x1, x2)
  let ny1 = Math.min(y1, y2)
  let nx2 = Math.max(x1, x2)
  let ny2 = Math.max(y1, y2)
  let nw = nx2 - nx1
  let nh = ny2 - ny1

  if (lockRatio) {
    const ratio = (item.scaleX ?? 1) * base.w / Math.max((item.scaleY ?? 1) * base.h, 0.001)
    if (nw / Math.max(nh, 0.001) > ratio) nw = nh * ratio
    else nh = nw / ratio
    nx2 = nx1 + nw
    ny2 = ny1 + nh
  }

  nw = Math.max(8, nw)
  nh = Math.max(8, nh)

  return {
    ...item,
    x: nx1,
    y: ny1,
    scaleX: nw / base.w,
    scaleY: nh / base.h,
  }
}
