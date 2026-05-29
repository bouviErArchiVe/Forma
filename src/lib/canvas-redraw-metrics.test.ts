import { describe, expect, it } from 'vitest'
import {
  getCanvasRedrawMetrics,
  partialRedrawRatio,
  recordInkRedraw,
  recordOverlayRedraw,
  resetCanvasRedrawMetrics,
} from './canvas-redraw-metrics'

describe('canvas-redraw-metrics', () => {
  it('tracks full vs partial redraws', () => {
    resetCanvasRedrawMetrics(100, 100)
    recordInkRedraw(undefined, 100, 100)
    recordInkRedraw({ x: 0, y: 0, w: 10, h: 10 }, 100, 100)
    recordOverlayRedraw('partial', { x: 0, y: 0, w: 5, h: 5 }, 100, 100)
    const m = getCanvasRedrawMetrics()
    expect(m.inkFull).toBe(1)
    expect(m.inkPartial).toBe(1)
    expect(m.overlayPartial).toBe(1)
    expect(partialRedrawRatio(m)).toBeGreaterThan(0.5)
  })
})
