import type { InkClip } from './page-render'

export interface CanvasRedrawMetrics {
  inkFull: number
  inkPartial: number
  overlayFull: number
  overlayPartial: number
  partialAreaPx: number
  canvasPixelArea: number
}

let metrics: CanvasRedrawMetrics = {
  inkFull: 0,
  inkPartial: 0,
  overlayFull: 0,
  overlayPartial: 0,
  partialAreaPx: 0,
  canvasPixelArea: 794 * 1123,
}

export function resetCanvasRedrawMetrics(pageW = 794, pageH = 1123): void {
  metrics = {
    inkFull: 0,
    inkPartial: 0,
    overlayFull: 0,
    overlayPartial: 0,
    partialAreaPx: 0,
    canvasPixelArea: pageW * pageH,
  }
}

export function recordInkRedraw(clip: InkClip | undefined, pageW = 794, pageH = 1123): void {
  if (clip) {
    metrics.inkPartial++
    metrics.partialAreaPx += clip.w * clip.h
  } else {
    metrics.inkFull++
    metrics.partialAreaPx += pageW * pageH
  }
}

export function recordOverlayRedraw(
  mode: 'full' | 'partial',
  clip?: InkClip,
  pageW = 794,
  pageH = 1123,
): void {
  if (mode === 'partial' && clip) {
    metrics.overlayPartial++
    metrics.partialAreaPx += clip.w * clip.h
  } else {
    metrics.overlayFull++
    if (mode === 'full') metrics.partialAreaPx += pageW * pageH
  }
}

export function getCanvasRedrawMetrics(): CanvasRedrawMetrics {
  return { ...metrics }
}

export function partialRedrawRatio(m: CanvasRedrawMetrics = metrics): number {
  const total = m.inkFull + m.inkPartial + m.overlayFull + m.overlayPartial
  if (total === 0) return 0
  return (m.inkPartial + m.overlayPartial) / total
}

/** Ratio surface invalidée / surface page (0–1+, peut dépasser 1 si overlaps). */
export function partialAreaRatio(m: CanvasRedrawMetrics = metrics): number {
  if (m.canvasPixelArea <= 0) return 0
  return m.partialAreaPx / m.canvasPixelArea
}
