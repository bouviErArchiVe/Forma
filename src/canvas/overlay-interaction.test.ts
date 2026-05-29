import { describe, expect, it, vi } from 'vitest'

vi.mock('../lib/selection-engine', () => ({
  selectionBounds: () => ({ x: 100, y: 100, w: 80, h: 24 }),
  getSelectionRotationHandle: () => null,
}))

import { buildOverlayInteractionClip } from './overlay-interaction'
import { makeTestPage } from '../lib/forma-test-fixtures'

describe('overlay-interaction', () => {
  it('buildOverlayInteractionClip returns clip for lasso', () => {
    const page = makeTestPage('nb-1')
    const clip = buildOverlayInteractionClip(
      {
        lasso: { x: 10, y: 20, w: 100, h: 80 },
        prevLasso: null,
        selection: [],
        page,
        dragOffset: null,
        tapePreview: null,
        dragGhostBounds: null,
      },
      12,
      794,
      1123,
    )
    expect(clip).toBeDefined()
    expect(clip!.w).toBeGreaterThan(0)
  })
})
