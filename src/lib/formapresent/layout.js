/** FormaPresent — alignements, grilles, guides */

import { SLIDE_SIZE } from './constants'

export function snapValue(v, gridSize, enabled = true) {
  if (!enabled || !gridSize) return v
  return Math.round(v / gridSize) * gridSize
}

export function snapElement(el, gridSize, enabled) {
  return {
    ...el,
    x: snapValue(el.x, gridSize, enabled),
    y: snapValue(el.y, gridSize, enabled),
  }
}

export function alignElements(elements, ids, alignment) {
  if (!elements?.length || !ids?.length) return elements
  const selected = elements.filter((el) => ids.includes(el.id))
  if (!selected.length) return elements

  const bounds = selected.reduce((acc, el) => ({
    minX: Math.min(acc.minX, el.x),
    minY: Math.min(acc.minY, el.y),
    maxX: Math.max(acc.maxX, el.x + el.w),
    maxY: Math.max(acc.maxY, el.y + el.h),
  }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity })

  const cx = (bounds.minX + bounds.maxX) / 2
  const cy = (bounds.minY + bounds.maxY) / 2

  return elements.map((el) => {
    if (!ids.includes(el.id)) return el
    let { x, y } = el
    switch (alignment) {
      case 'left': x = bounds.minX; break
      case 'center': x = cx - el.w / 2; break
      case 'right': x = bounds.maxX - el.w; break
      case 'top': y = bounds.minY; break
      case 'middle': y = cy - el.h / 2; break
      case 'bottom': y = bounds.maxY - el.h; break
      default: break
    }
    return { ...el, x, y }
  })
}

export function distributeElements(elements, ids, axis = 'horizontal') {
  if (ids.length < 3) return elements
  const selected = elements.filter((el) => ids.includes(el.id)).sort((a, b) => (axis === 'horizontal' ? a.x - b.x : a.y - b.y))
  const first = selected[0]
  const last = selected[selected.length - 1]
  const totalSpace = axis === 'horizontal'
    ? (last.x - first.x)
    : (last.y - first.y)
  const gap = totalSpace / (selected.length - 1)

  const posMap = {}
  selected.forEach((el, i) => {
    if (i === 0 || i === selected.length - 1) return
    posMap[el.id] = axis === 'horizontal'
      ? { x: first.x + gap * i, y: el.y }
      : { x: el.x, y: first.y + gap * i }
  })

  return elements.map((el) => (posMap[el.id] ? { ...el, ...posMap[el.id] } : el))
}

export function getGuideLines() {
  const { width, height } = SLIDE_SIZE
  return {
    vertical: [width / 3, (width * 2) / 3, width / 2],
    horizontal: [height / 3, (height * 2) / 3, height / 2],
  }
}
