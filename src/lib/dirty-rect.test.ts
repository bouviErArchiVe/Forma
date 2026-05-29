import { describe, expect, it, vi } from 'vitest'

vi.mock('./selection-engine', () => ({
  selectionBounds: () => ({ x: 100, y: 100, w: 80, h: 24 }),
}))

import { computeOverlayDirtyClip, expandClip, lassoOverlayClip, selectionInkClip, unionClip, clipArea } from './dirty-rect'
import { emptyPageFields } from '../types'
import type { Page } from '../types'

function page(partial: Partial<Page> = {}): Page {
  return {
    id: 'p1',
    notebookId: 'nb1',
    order: 0,
    template: 'blank',
    ...emptyPageFields(),
    ...partial,
  }
}

describe('dirty-rect', () => {
  it('expandClip pads and clamps to page', () => {
    const c = expandClip({ x: 10, y: 10, w: 50, h: 50 }, 8, 794, 1123)
    expect(c).toEqual({ x: 2, y: 2, w: 66, h: 66 })
  })

  it('unionClip merges two regions', () => {
    const u = unionClip({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 })
    expect(u).toEqual({ x: 0, y: 0, w: 15, h: 15 })
  })

  it('selectionInkClip returns padded bounds for selection', () => {
    const pg = page({
      texts: [
        {
          id: 't1',
          x: 100,
          y: 100,
          width: 80,
          height: 24,
          content: 'x',
          fontSize: 16,
          color: '#000',
          align: 'left',
          pageId: 'p1',
        },
      ],
    })
    const clip = selectionInkClip(pg, [{ kind: 'text', id: 't1' }], undefined, 10)
    expect(clip).toBeDefined()
    expect(clip!.x).toBeLessThanOrEqual(100)
  })

  it('lassoOverlayClip unions current and previous lasso', () => {
    const clip = lassoOverlayClip({ x: 10, y: 10, w: 20, h: 20 }, { x: 30, y: 30, w: 20, h: 20 }, 4)
    expect(clip!.w).toBeGreaterThan(20)
  })

  it('computeOverlayDirtyClip unions lasso and selection', () => {
    const clip = computeOverlayDirtyClip({
      lasso: { x: 0, y: 0, w: 50, h: 50 },
      prevLasso: { x: 60, y: 0, w: 40, h: 40 },
      selectionBounds: { x: 200, y: 200, w: 80, h: 40 },
      rotationHandle: null,
      tapePreview: null,
      dragGhostBounds: null,
    })
    expect(clip).toBeDefined()
    expect(clipArea(clip!)).toBeGreaterThan(50 * 50)
  })
})
