import { describe, expect, it } from 'vitest'
import { GRID_SIZE, snapToGrid } from './grid-snap'

describe('snapToGrid', () => {
  it('snaps coordinates to the default grid size', () => {
    expect(snapToGrid(10, 10)).toEqual({ x: 0, y: 0 })
    expect(snapToGrid(20, 20)).toEqual({ x: 32, y: 32 })
  })

  it('rounds to the nearest multiple', () => {
    expect(snapToGrid(15, 17)).toEqual({ x: 0, y: 32 })
    expect(snapToGrid(16, 15)).toEqual({ x: 32, y: 0 })
  })

  it('handles negative coordinates', () => {
    const result = snapToGrid(-10, -20)
    expect(result.x === 0 || Object.is(result.x, -0)).toBe(true)
    expect(result.y).toBe(-32)
  })

  it('handles a custom grid size', () => {
    expect(snapToGrid(7, 12, 10)).toEqual({ x: 10, y: 10 })
    expect(snapToGrid(4, 12, 10)).toEqual({ x: 0, y: 10 })
  })

  it('snaps zero to zero', () => {
    expect(snapToGrid(0, 0)).toEqual({ x: 0, y: 0 })
  })

  it('exposes GRID_SIZE constant', () => {
    expect(GRID_SIZE).toBe(32)
  })
})
