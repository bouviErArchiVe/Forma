import { describe, expect, it, vi } from 'vitest'
import { emptyPageFields } from '../types'
import type { Page, SelectionItem } from '../types'

vi.mock('./page-render', () => ({
  elementInRect: (
    rx: number,
    ry: number,
    rw: number,
    rh: number,
    ex: number,
    ey: number,
    ew: number,
    eh: number,
  ) => ex < rx + rw && ex + ew > rx && ey < ry + rh && ey + eh > ry,
}))

import {
  applySelectionMove,
  collectSelection,
  countStrokesRenderCost,
  getSelectionRotationHandle,
  hitTestAtPoint,
  hitTestRotationHandle,
  isMeaningfulSelectionRect,
  mergeSelection,
  MIN_SELECTION_RECT_PX,
  rotateSelection,
  scaleSelection,
  selectionBounds,
  toggleSelectionItem,
} from './selection-engine'

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

describe('selection-engine', () => {
  it('collectSelection returns items intersecting rect', () => {
    const pg = page({
      strokes: [
        {
          id: 's1',
          tool: 'pen',
          color: '#000',
          width: 2,
          opacity: 1,
          pageId: 'p1',
          points: [
            { x: 10, y: 10, pressure: 0.5, timestamp: 0 },
            { x: 30, y: 30, pressure: 0.5, timestamp: 1 },
          ],
        },
      ],
      texts: [
        {
          id: 't1',
          x: 200,
          y: 200,
          width: 80,
          height: 24,
          content: 'hors zone',
          fontSize: 16,
          color: '#000',
          align: 'left',
          pageId: 'p1',
        },
      ],
    })
    const sel = collectSelection(pg, { x: 0, y: 0, w: 50, h: 50 })
    expect(sel).toEqual([{ kind: 'stroke', id: 's1' }])
  })

  it('hitTestAtPoint prefers topmost tape over stroke', () => {
    const pg = page({
      strokes: [
        {
          id: 's1',
          tool: 'pen',
          color: '#000',
          width: 2,
          opacity: 1,
          pageId: 'p1',
          points: [{ x: 50, y: 50, pressure: 0.5, timestamp: 0 }],
        },
      ],
      tapes: [
        {
          id: 'tape1',
          x: 40,
          y: 40,
          width: 30,
          height: 20,
          color: '#ff0',
          revealed: false,
          pageId: 'p1',
        },
      ],
    })
    expect(hitTestAtPoint(pg, { x: 50, y: 50, pressure: 0, timestamp: 0 })).toEqual({
      kind: 'tape',
      id: 'tape1',
    })
  })

  it('mergeSelection and toggleSelectionItem handle additive mode', () => {
    const a: SelectionItem[] = [{ kind: 'stroke', id: 's1' }]
    const b: SelectionItem[] = [{ kind: 'text', id: 't1' }]
    expect(mergeSelection(a, b, false)).toEqual(b)
    expect(mergeSelection(a, b, true)).toHaveLength(2)
    expect(toggleSelectionItem(a, { kind: 'stroke', id: 's1' })).toEqual([])
    expect(toggleSelectionItem(a, { kind: 'shape', id: 'sh1' })).toHaveLength(2)
  })

  it('applySelectionMove and scaleSelection transform only selected items', () => {
    const pg = page({
      strokes: [
        {
          id: 's1',
          tool: 'pen',
          color: '#000',
          width: 2,
          opacity: 1,
          pageId: 'p1',
          points: [{ x: 10, y: 10, pressure: 0.5, timestamp: 0 }],
        },
        {
          id: 's2',
          tool: 'pen',
          color: '#000',
          width: 2,
          opacity: 1,
          pageId: 'p1',
          points: [{ x: 100, y: 100, pressure: 0.5, timestamp: 0 }],
        },
      ],
    })
    const sel: SelectionItem[] = [{ kind: 'stroke', id: 's1' }]
    const moved = applySelectionMove(pg, sel, { x: 5, y: -3 })
    expect(moved.strokes[0].points[0]).toMatchObject({ x: 15, y: 7 })
    expect(moved.strokes[1].points[0]).toMatchObject({ x: 100, y: 100 })

    const scaled = scaleSelection(moved, sel, { x: 0, y: 0 }, 2)
    expect(scaled.strokes[0].points[0]).toMatchObject({ x: 30, y: 14 })
    const bounds = selectionBounds(scaled, sel)
    expect(bounds).not.toBeNull()
    expect(bounds!.w).toBeGreaterThan(0)
  })

  it('ignores tiny lasso rects', () => {
    expect(isMeaningfulSelectionRect({ w: 0, h: 0 })).toBe(false)
    expect(isMeaningfulSelectionRect({ w: MIN_SELECTION_RECT_PX - 1, h: 0 })).toBe(false)
    expect(isMeaningfulSelectionRect({ w: MIN_SELECTION_RECT_PX, h: 0 })).toBe(true)
  })

  it('rotateSelection rotates mixed stroke and shape around bbox center', () => {
    const pg = page({
      strokes: [
        {
          id: 's1',
          tool: 'pen',
          color: '#000',
          width: 2,
          opacity: 1,
          pageId: 'p1',
          points: [
            { x: 0, y: 10, pressure: 0.5, timestamp: 0 },
            { x: 20, y: 10, pressure: 0.5, timestamp: 1 },
          ],
        },
      ],
      shapes: [
        {
          id: 'sh1',
          type: 'line',
          x1: 10,
          y1: 0,
          x2: 10,
          y2: 20,
          color: '#f00',
          width: 2,
          pageId: 'p1',
        },
      ],
      texts: [
        {
          id: 't1',
          x: 40,
          y: 40,
          width: 80,
          height: 24,
          content: 'outside',
          fontSize: 16,
          color: '#000',
          align: 'left',
          pageId: 'p1',
        },
      ],
    })
    const sel: SelectionItem[] = [
      { kind: 'stroke', id: 's1' },
      { kind: 'shape', id: 'sh1' },
    ]
    const quarter = rotateSelection(pg, sel, Math.PI / 2)
    expect(quarter.strokes[0].points[1]).toMatchObject({ x: 10, y: 20 })
    expect(quarter.shapes[0]).toMatchObject({ x1: 20, y1: 10, x2: 0, y2: 10 })
    expect(quarter.texts[0]).toMatchObject({ x: 40, y: 40 })

    const halfTurn = rotateSelection(quarter, sel, Math.PI / 2)
    expect(halfTurn.strokes[0].points[0].x).toBeCloseTo(20, 0)
    expect(halfTurn.shapes[0].x1).toBeCloseTo(10, 0)
    expect(halfTurn.shapes[0].y1).toBeCloseTo(20, 0)
  })

  it('countStrokesRenderCost weights pencil segments higher', () => {
    const pg = page({
      strokes: [
        {
          id: 's1',
          tool: 'pen',
          color: '#000',
          width: 2,
          opacity: 1,
          pageId: 'p1',
          points: [
            { x: 0, y: 0, pressure: 0.5, timestamp: 0 },
            { x: 10, y: 0, pressure: 0.5, timestamp: 1 },
            { x: 20, y: 0, pressure: 0.5, timestamp: 2 },
          ],
        },
        {
          id: 's2',
          tool: 'pencil',
          color: '#000',
          width: 2,
          opacity: 1,
          pageId: 'p1',
          points: [
            { x: 0, y: 10, pressure: 0.5, timestamp: 0 },
            { x: 5, y: 10, pressure: 0.5, timestamp: 1 },
            { x: 10, y: 10, pressure: 0.5, timestamp: 2 },
          ],
        },
      ],
    })
    expect(countStrokesRenderCost(pg)).toBe(3 + 2)
    expect(countStrokesRenderCost(page())).toBe(0)
  })

  it('getSelectionRotationHandle appears for text/image/sticker only', () => {
    const pg = page({
      texts: [
        {
          id: 't1',
          x: 100,
          y: 100,
          width: 80,
          height: 24,
          content: 'hi',
          fontSize: 16,
          color: '#000',
          align: 'left',
          pageId: 'p1',
        },
      ],
    })
    const handle = getSelectionRotationHandle(pg, [{ kind: 'text', id: 't1' }])
    expect(handle).not.toBeNull()
    expect(handle!.pivotY).toBeGreaterThan(handle!.y)
    expect(getSelectionRotationHandle(pg, [{ kind: 'stroke', id: 'missing' }])).toBeNull()
  })

  it('hitTestRotationHandle detects pointer near handle', () => {
    const handle = { x: 200, y: 50, pivotX: 200, pivotY: 120 }
    expect(hitTestRotationHandle({ x: 200, y: 50 }, handle)).toBe(true)
    expect(hitTestRotationHandle({ x: 300, y: 50 }, handle)).toBe(false)
  })

  it('rotateSelection accumulates rotation on image', () => {
    const pg = page({
      images: [
        {
          id: 'i1',
          x: 50,
          y: 50,
          width: 100,
          height: 80,
          assetId: 'a1',
          pageId: 'p1',
        },
      ],
    })
    const sel: SelectionItem[] = [{ kind: 'image', id: 'i1' }]
    const rotated = rotateSelection(pg, sel, Math.PI / 4)
    expect(rotated.images[0].rotation).toBeCloseTo(Math.PI / 4, 5)
  })
})
