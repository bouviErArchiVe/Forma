import type { InkClip } from './page-render'
import type { Page, SelectionItem } from '../types'
import { selectionBounds } from './selection-engine'

export function expandClip(clip: InkClip, pad: number, maxW: number, maxH: number): InkClip {
  const x = Math.max(0, clip.x - pad)
  const y = Math.max(0, clip.y - pad)
  const w = Math.min(maxW - x, clip.w + pad * 2)
  const h = Math.min(maxH - y, clip.h + pad * 2)
  return { x, y, w, h }
}

export function unionClip(a: InkClip, b: InkClip): InkClip {
  const x = Math.min(a.x, b.x)
  const y = Math.min(a.y, b.y)
  const maxX = Math.max(a.x + a.w, b.x + b.w)
  const maxY = Math.max(a.y + a.h, b.y + b.h)
  return { x, y, w: maxX - x, h: maxY - y }
}

export function rectToClip(x: number, y: number, w: number, h: number): InkClip {
  return { x, y, w: Math.max(0, w), h: Math.max(0, h) }
}

/** Zone encre à invalider pour une sélection en déplacement / rotation. */
export function selectionInkClip(
  page: Page,
  selection: SelectionItem[],
  offset?: { x: number; y: number },
  pad = 28,
  pageW = 794,
  pageH = 1123,
): InkClip | undefined {
  const bounds = selectionBounds(page, selection, offset)
  if (!bounds) return undefined
  return expandClip(rectToClip(bounds.x, bounds.y, bounds.w, bounds.h), pad, pageW, pageH)
}

/** Union lasso courant + précédent pour overlay partiel. */
export function lassoOverlayClip(
  current: { x: number; y: number; w: number; h: number } | null,
  previous: { x: number; y: number; w: number; h: number } | null,
  pad = 12,
  pageW = 794,
  pageH = 1123,
): InkClip | undefined {
  if (!current && !previous) return undefined
  let clip: InkClip | undefined
  if (current) clip = expandClip(rectToClip(current.x, current.y, current.w, current.h), pad, pageW, pageH)
  if (previous) {
    const prev = expandClip(rectToClip(previous.x, previous.y, previous.w, previous.h), pad, pageW, pageH)
    clip = clip ? unionClip(clip, prev) : prev
  }
  return clip
}
