import { describe, expect, it } from 'vitest'
import { detectShapeFromPoints, snapLineToAxis } from './shape-detect'
import { createPoint } from './stroke-render'

describe('detectShapeFromPoints', () => {
  it('returns null for fewer than 2 points', () => {
    expect(detectShapeFromPoints([createPoint(0, 0)], 'rectangle', '#000', 2, 'p1')).toBeNull()
  })

  it('returns null for an explicit ellipse/rectangle when movement is tiny', () => {
    const pts = [createPoint(0, 0), createPoint(3, 3)]
    // 'ellipse' type bypasses guessShapeType, so the w<8 && h<8 guard applies directly
    expect(detectShapeFromPoints(pts, 'ellipse', '#000', 2, 'p1')).toBeNull()
  })

  it('falls back to a line for a tiny rectangle request (auto-detected as line)', () => {
    const pts = [createPoint(0, 0), createPoint(3, 3)]
    const shape = detectShapeFromPoints(pts, 'rectangle', '#000', 2, 'p1')
    expect(shape).not.toBeNull()
    expect(shape!.type).toBe('line')
  })

  it('detects an ellipse when w/h ratio is near square', () => {
    const pts = [createPoint(0, 0), createPoint(50, 55)]
    const shape = detectShapeFromPoints(pts, 'rectangle', '#000', 2, 'p1')
    expect(shape).not.toBeNull()
    expect(shape!.type).toBe('ellipse')
    expect(shape!.x1).toBe(0)
    expect(shape!.y2).toBe(55)
  })

  it('detects a rectangle for a wide, flat selection', () => {
    const pts = [createPoint(0, 0), createPoint(100, 20)]
    const shape = detectShapeFromPoints(pts, 'rectangle', '#000', 2, 'p1')
    expect(shape!.type).toBe('rectangle')
  })

  it('detects a line for a small movement', () => {
    const pts = [createPoint(0, 0), createPoint(10, 5)]
    const shape = detectShapeFromPoints(pts, 'rectangle', '#000', 2, 'p1')
    expect(shape!.type).toBe('line')
  })

  it('passes through explicit shape type for line/arrow', () => {
    const pts = [createPoint(0, 0), createPoint(50, 50)]
    const arrow = detectShapeFromPoints(pts, 'arrow', '#f00', 3, 'p1')
    expect(arrow!.type).toBe('arrow')
    expect(arrow!.color).toBe('#f00')
    expect(arrow!.width).toBe(3)
    expect(arrow!.pageId).toBe('p1')

    const line = detectShapeFromPoints(pts, 'line', '#f00', 3, 'p1')
    expect(line!.type).toBe('line')
  })

  it('passes through explicit ellipse type', () => {
    const pts = [createPoint(0, 0), createPoint(100, 20)]
    const shape = detectShapeFromPoints(pts, 'ellipse', '#000', 2, 'p1')
    expect(shape!.type).toBe('ellipse')
  })
})

describe('snapLineToAxis', () => {
  it('returns input unchanged for fewer than 2 points', () => {
    const pts = [createPoint(0, 0)]
    expect(snapLineToAxis(pts)).toBe(pts)
  })

  it('snaps to horizontal when dx >> dy', () => {
    const pts = [createPoint(0, 0), createPoint(100, 5)]
    const snapped = snapLineToAxis(pts)
    expect(snapped[snapped.length - 1].y).toBe(0)
    expect(snapped[snapped.length - 1].x).toBe(100)
  })

  it('snaps to vertical when dy >> dx', () => {
    const pts = [createPoint(0, 0), createPoint(5, 100)]
    const snapped = snapLineToAxis(pts)
    expect(snapped[snapped.length - 1].x).toBe(0)
    expect(snapped[snapped.length - 1].y).toBe(100)
  })

  it('leaves diagonal lines unchanged', () => {
    const pts = [createPoint(0, 0), createPoint(50, 50)]
    expect(snapLineToAxis(pts)).toBe(pts)
  })
})
