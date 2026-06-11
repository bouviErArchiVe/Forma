import { describe, expect, it } from 'vitest'
import {
  estimateDataUrlBytes,
  resolveExportImageHref,
  SVG_INLINE_DATA_URL_MAX_BYTES,
} from './export-resolve'

describe('export-resolve', () => {
  it('estimates base64 data URL payload size', () => {
    const tiny = 'data:image/png;base64,AAAA'
    expect(estimateDataUrlBytes(tiny)).toBeGreaterThan(0)
    expect(estimateDataUrlBytes('data:text/plain,hello')).toBe(5)
  })

  it('prefers blob href without inlining', async () => {
    const href = 'blob:http://localhost/abc'
    await expect(resolveExportImageHref(href, 'asset-1')).resolves.toEqual({ href })
  })

  it('skips oversized inline data URLs with note', async () => {
    const payload = 'A'.repeat(Math.ceil((SVG_INLINE_DATA_URL_MAX_BYTES * 4) / 3) + 4)
    const huge = `data:image/png;base64,${payload}`
    const result = await resolveExportImageHref(huge, 'img-big')
    expect(result.skipped).toBe(true)
    expect(result.href).toBeUndefined()
    expect(result.note).toContain('Image omise')
    expect(result.note).toContain('asset img-big')
  })

  it('keeps small data URLs inline', async () => {
    const small = 'data:image/png;base64,AAAA'
    await expect(resolveExportImageHref(small)).resolves.toEqual({ href: small })
  })
})
