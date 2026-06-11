import { describe, expect, it } from 'vitest'
import { eraseStrokesInCircle } from './erase-circle'
import { createPoint } from './stroke-render'
import type { CircleRegion } from './circle-lasso'
import { makeTestPage } from './forma-test-fixtures'
import { normalizePage } from '../types'

describe('eraseStrokesInCircle', () => {
  const circle: CircleRegion = { cx: 0, cy: 0, r: 10 }

  it('removes strokes with a point inside the circle', () => {
    const page = makeTestPage('nb1', {
      strokes: [
        {
          id: 's1', tool: 'pen', color: '#000', width: 2, opacity: 1, pageId: 'p1',
          points: [createPoint(0, 0), createPoint(5, 5)],
        },
        {
          id: 's2', tool: 'pen', color: '#000', width: 2, opacity: 1, pageId: 'p1',
          points: [createPoint(100, 100), createPoint(200, 200)],
        },
      ],
    })
    const result = eraseStrokesInCircle(page, circle)
    expect(result.strokes.map((s) => s.id)).toEqual(['s2'])
  })

  it('removes shapes whose endpoints or midpoint fall in the circle', () => {
    const page = normalizePage({
      ...makeTestPage('nb1', { strokes: [] }),
      shapes: [
        { id: 'sh1', type: 'rectangle', x1: 0, y1: 0, x2: 4, y2: 4, color: '#000', width: 1, pageId: 'p1' },
        { id: 'sh2', type: 'rectangle', x1: 100, y1: 100, x2: 200, y2: 200, color: '#000', width: 1, pageId: 'p1' },
      ],
    })
    const result = eraseStrokesInCircle(page, circle)
    expect(result.shapes.map((s) => s.id)).toEqual(['sh2'])
  })

  it('keeps everything when nothing intersects the circle', () => {
    const page = makeTestPage('nb1', {
      strokes: [
        {
          id: 's1', tool: 'pen', color: '#000', width: 2, opacity: 1, pageId: 'p1',
          points: [createPoint(100, 100), createPoint(200, 200)],
        },
      ],
    })
    const result = eraseStrokesInCircle(page, circle)
    expect(result.strokes).toHaveLength(1)
  })

  it('does not mutate the original page object', () => {
    const page = makeTestPage('nb1', {
      strokes: [
        {
          id: 's1', tool: 'pen', color: '#000', width: 2, opacity: 1, pageId: 'p1',
          points: [createPoint(0, 0)],
        },
      ],
    })
    const result = eraseStrokesInCircle(page, circle)
    expect(result).not.toBe(page)
    expect(page.strokes).toHaveLength(1)
    expect(result.strokes).toHaveLength(0)
  })
})
