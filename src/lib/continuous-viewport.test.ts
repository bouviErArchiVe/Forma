import { describe, expect, it } from 'vitest'
import { computePrefetchIndices, continuousRootMargin, maxMountedCanvases } from './continuous-viewport'

describe('continuous-viewport', () => {
  it('prefetches neighbors around center', () => {
    expect(computePrefetchIndices(5, 20, 2)).toEqual([3, 4, 5, 6, 7])
  })

  it('clamps at bounds', () => {
    expect(computePrefetchIndices(0, 10, 2)).toEqual([0, 1, 2])
    expect(computePrefetchIndices(9, 10, 2)).toEqual([7, 8, 9])
  })

  it('reduces root margin for large notebooks', () => {
    expect(continuousRootMargin(10)).toContain('240px')
    expect(continuousRootMargin(50)).toContain('120px')
    expect(continuousRootMargin(100)).toContain('80px')
  })

  it('caps mounted canvases for large notebooks', () => {
    expect(maxMountedCanvases(10)).toBe(10)
    expect(maxMountedCanvases(30)).toBe(5)
    expect(maxMountedCanvases(60)).toBe(4)
    expect(maxMountedCanvases(120)).toBe(3)
  })
})
