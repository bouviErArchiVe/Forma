/** Hit-test objets canvas (bibliothèque, images) pour lasso / sélection */

const SC = 3.78 / 50

export function bboxPlaced(item) {
  const el = item.el || {}
  const w = (el.fw || el.w || 0) * SC
  const h = (el.h || 0) * SC
  return { x1: item.x, y1: item.y, x2: item.x + w, y2: item.y + h }
}

export function bboxImage(img) {
  return { x1: img.x, y1: img.y, x2: img.x + img.w, y2: img.y + img.h }
}

export function pointInRect(p, r) {
  return p.x >= r.x1 && p.x <= r.x2 && p.y >= r.y1 && p.y <= r.y2
}

export function rectIntersects(a, b) {
  return !(a.x2 < b.x1 || a.x1 > b.x2 || a.y2 < b.y1 || a.y1 > b.y2)
}

export function pointInPolygon(p, poly) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x
    const yi = poly[i].y
    const xj = poly[j].x
    const yj = poly[j].y
    if ((yi > p.y) !== (yj > p.y) && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi + 1e-9) + xi) inside = !inside
  }
  return inside
}

export function bboxIntersectsRect(bbox, rect) {
  return rectIntersects(bbox, rect)
}

export function bboxIntersectsPolygon(bbox, poly) {
  const corners = [
    { x: bbox.x1, y: bbox.y1 },
    { x: bbox.x2, y: bbox.y1 },
    { x: bbox.x2, y: bbox.y2 },
    { x: bbox.x1, y: bbox.y2 },
    { x: (bbox.x1 + bbox.x2) / 2, y: (bbox.y1 + bbox.y2) / 2 },
  ]
  return corners.some((c) => pointInPolygon(c, poly))
}

export function selectObjectsInRect(placed, images, rect) {
  const placedIds = placed.filter((it) => bboxIntersectsRect(bboxPlaced(it), rect)).map((it) => it.id)
  const imageIds = images.filter((img) => bboxIntersectsRect(bboxImage(img), rect)).map((img) => img.id)
  return { placedIds, imageIds }
}

export function selectObjectsInPolygon(placed, images, poly) {
  const placedIds = placed.filter((it) => bboxIntersectsPolygon(bboxPlaced(it), poly)).map((it) => it.id)
  const imageIds = images.filter((img) => bboxIntersectsPolygon(bboxImage(img), poly)).map((img) => img.id)
  return { placedIds, imageIds }
}

export function hitTestObjects(placed, images, p) {
  for (let i = placed.length - 1; i >= 0; i--) {
    const b = bboxPlaced(placed[i])
    if (pointInRect(p, b)) return { kind: 'placed', id: placed[i].id }
  }
  for (let i = images.length - 1; i >= 0; i--) {
    const b = bboxImage(images[i])
    if (pointInRect(p, b)) return { kind: 'image', id: images[i].id }
  }
  return null
}
