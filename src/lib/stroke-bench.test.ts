import { describe, expect, it } from 'vitest'
import { benchmarkStrokeLevels, benchmarkStrokePage, generateSyntheticStrokePage } from './stroke-bench'

describe('stroke-bench', () => {
  it('generates the requested stroke count', () => {
    const page = generateSyntheticStrokePage(100)
    expect(page.strokes).toHaveLength(100)
  })

  it('benchmarkStrokePage returns segment estimate', () => {
    const r = benchmarkStrokePage(500)
    expect(r.strokeCount).toBe(500)
    expect(r.segmentEstimate).toBeGreaterThan(500)
    expect(r.elapsedMs).toBeGreaterThanOrEqual(0)
  })

  it('benchmarkStrokeLevels covers 1k/5k/10k', () => {
    const results = benchmarkStrokeLevels()
    expect(results).toHaveLength(3)
    expect(results.map((r) => r.strokeCount)).toEqual([1000, 5000, 10_000])
  })
})
