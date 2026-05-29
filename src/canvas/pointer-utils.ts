import { createPoint } from '../lib/stroke-render'
import type { Point } from '../types'
import { snapToGrid } from '../lib/grid-snap'
import { unrotatePoint } from '../lib/page-dimensions'

export interface PointerToPageOptions {
  pageWidth: number
  pageHeight: number
  rotation?: 0 | 90 | 180 | 270
  gridSnap?: boolean
}

/** Convertit un événement pointeur canvas en coordonnées page (world). */
export function pointerEventToPagePoint(
  e: React.PointerEvent | PointerEvent,
  canvas: HTMLCanvasElement,
  options: PointerToPageOptions,
): Point {
  const { pageWidth, pageHeight, rotation = 0, gridSnap = false } = options
  const rect = canvas.getBoundingClientRect()
  const raw = unrotatePoint(
    ((e.clientX - rect.left) / rect.width) * pageWidth,
    ((e.clientY - rect.top) / rect.height) * pageHeight,
    rotation,
    pageWidth,
    pageHeight,
  )
  if (gridSnap) {
    const s = snapToGrid(raw.x, raw.y)
    return createPoint(s.x, s.y, e.pressure > 0 ? e.pressure : 0.5)
  }
  return createPoint(
    raw.x,
    raw.y,
    e.pressure > 0 ? e.pressure : 0.5,
    e.tiltX ?? 0,
    e.tiltY ?? 0,
  )
}
