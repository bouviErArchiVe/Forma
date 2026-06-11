import { describe, expect, it } from 'vitest'
import {
  buildPdfBenchPageIndices,
  clampPdfPageNumber,
  computePdfFitScale,
  defaultPdfDpr,
  orderPdfPrefetchIndices,
  PDF_BENCH_PAGE_COUNTS,
  pdfDocCacheKey,
  pdfPageCacheKey,
  PDF_PAGE_CACHE_MAX,
  PDF_PREFETCH_MAX_CONCURRENT,
  PDF_PREFETCH_RADIUS,
} from './pdf-page-render-helpers'

describe('pdf-page-render helpers', () => {
  it('exports documented prefetch/cache constants', () => {
    expect(PDF_PAGE_CACHE_MAX).toBeGreaterThan(0)
    expect(PDF_PREFETCH_RADIUS).toBe(2)
    expect(PDF_PREFETCH_MAX_CONCURRENT).toBeGreaterThan(0)
  })

  it('builds stable cache keys', () => {
    expect(pdfPageCacheKey('nb-1', 3, 2)).toBe('nb-1:3:2')
    expect(pdfDocCacheKey('data:application/pdf;base64,abc', 'nb-1')).toBe('nb-1')
    expect(pdfDocCacheKey('data:application/pdf;base64,abc', '')).toBe(
      'data:application/pdf;base64,abc',
    )
  })

  it('clamps page numbers to valid PDF range', () => {
    expect(clampPdfPageNumber(-2, 10)).toBe(1)
    expect(clampPdfPageNumber(0, 10)).toBe(1)
    expect(clampPdfPageNumber(4, 10)).toBe(5)
    expect(clampPdfPageNumber(99, 10)).toBe(10)
    expect(clampPdfPageNumber(0, 0)).toBe(1)
  })

  it('computes fit scale from PDF and page dimensions', () => {
    const scale = computePdfFitScale(595, 842, 794, 1123, 2)
    expect(scale).toBeGreaterThan(2)
    expect(scale).toBeCloseTo(Math.max(794 / 595, 1123 / 842) * 2, 5)
  })

  it('orders prefetch indices center-first', () => {
    expect(orderPdfPrefetchIndices([1, 5, 3, 7], 5)).toEqual([5, 3, 7, 1])
    expect(orderPdfPrefetchIndices([0, 2, 4], 2)).toEqual([2, 0, 4])
  })

  it('dedupes prefetch indices', () => {
    expect(orderPdfPrefetchIndices([2, 2, 3], 2)).toEqual([2, 3])
  })

  it('defaultPdfDpr caps display DPR at 2', () => {
    expect(defaultPdfDpr(false)).toBeLessThanOrEqual(2)
    expect(defaultPdfDpr(true)).toBeGreaterThanOrEqual(2)
  })

  it('builds bench page index loops', () => {
    expect(PDF_BENCH_PAGE_COUNTS).toEqual([50, 100, 200])
    expect(buildPdfBenchPageIndices(0)).toEqual([])
    expect(buildPdfBenchPageIndices(3)).toEqual([0, 1, 2])
    expect(buildPdfBenchPageIndices(50)).toHaveLength(50)
    expect(buildPdfBenchPageIndices(50)[49]).toBe(49)
  })
})
