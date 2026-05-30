import { SLIDE_SIZE } from './constants'
import type { FormaSlideElement } from '../../types'

export function snapValue(v: number, gridSize: number, enabled = true): number {
  if (!enabled || !gridSize) return v
  return Math.round(v / gridSize) * gridSize
}

export function snapElement(
  el: FormaSlideElement,
  gridSize: number,
  enabled: boolean,
): FormaSlideElement {
  return {
    ...el,
    x: snapValue(el.x, gridSize, enabled),
    y: snapValue(el.y, gridSize, enabled),
  }
}

export function alignElements(
  elements: FormaSlideElement[],
  ids: string[],
  alignment: string,
): FormaSlideElement[] {
  if (!elements.length || !ids.length) return elements
  const selected = elements.filter((el) => ids.includes(el.id))
  if (!selected.length) return elements

  const bounds = selected.reduce(
    (acc, el) => ({
      minX: Math.min(acc.minX, el.x),
      minY: Math.min(acc.minY, el.y),
      maxX: Math.max(acc.maxX, el.x + el.w),
      maxY: Math.max(acc.maxY, el.y + el.h),
    }),
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
  )

  const cx = (bounds.minX + bounds.maxX) / 2
  const cy = (bounds.minY + bounds.maxY) / 2

  return elements.map((el) => {
    if (!ids.includes(el.id)) return el
    let { x, y } = el
    switch (alignment) {
      case 'left':
        x = bounds.minX
        break
      case 'center':
        x = cx - el.w / 2
        break
      case 'right':
        x = bounds.maxX - el.w
        break
      case 'top':
        y = bounds.minY
        break
      case 'middle':
        y = cy - el.h / 2
        break
      case 'bottom':
        y = bounds.maxY - el.h
        break
      default:
        break
    }
    return { ...el, x, y }
  })
}

export function getGuideLines() {
  const { width, height } = SLIDE_SIZE
  return {
    vertical: [width / 3, (width * 2) / 3, width / 2],
    horizontal: [height / 3, (height * 2) / 3, height / 2],
  }
}
