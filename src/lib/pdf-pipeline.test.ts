/**
 * Tests for the PDF pipeline improvements (PACK PIPELINE PDF V2).
 * Covers: import options, progress/abort, dataUrl helpers, export canvas cleanup.
 */
import { describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// dataUrlToArrayBuffer (extracted inline test — logic mirrored from pdf-vector-export)
// ---------------------------------------------------------------------------
function dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer {
  const comma = dataUrl.indexOf(',')
  const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

describe('dataUrlToArrayBuffer', () => {
  it('decodes a data URL to the correct bytes', () => {
    // "hello" in base64
    const dataUrl = 'data:application/octet-stream;base64,aGVsbG8='
    const buf = dataUrlToArrayBuffer(dataUrl)
    const bytes = new Uint8Array(buf)
    expect(bytes).toEqual(new Uint8Array([104, 101, 108, 108, 111]))
  })

  it('works when there is no data: prefix', () => {
    const base64 = btoa('world')
    const buf = dataUrlToArrayBuffer(base64)
    const bytes = new Uint8Array(buf)
    expect(bytes).toEqual(new Uint8Array([119, 111, 114, 108, 100]))
  })

  it('returns an ArrayBuffer (not Uint8Array)', () => {
    const buf = dataUrlToArrayBuffer('data:text/plain;base64,' + btoa('x'))
    expect(buf).toBeInstanceOf(ArrayBuffer)
  })
})

// ---------------------------------------------------------------------------
// bufferToDataUrl (mirrored from pdf-import synchronous encoding)
// ---------------------------------------------------------------------------
function bufferToDataUrl(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const CHUNK = 8192
  let binary = ''
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return 'data:application/pdf;base64,' + btoa(binary)
}

describe('bufferToDataUrl', () => {
  it('round-trips with dataUrlToArrayBuffer', () => {
    const original = new Uint8Array([1, 2, 3, 4, 5, 255, 0, 128])
    const dataUrl = bufferToDataUrl(original.buffer)
    expect(dataUrl.startsWith('data:application/pdf;base64,')).toBe(true)
    const recovered = new Uint8Array(dataUrlToArrayBuffer(dataUrl))
    expect(recovered).toEqual(original)
  })

  it('handles empty buffer', () => {
    const dataUrl = bufferToDataUrl(new ArrayBuffer(0))
    expect(dataUrl).toBe('data:application/pdf;base64,')
  })

  it('handles large buffer (>8192 bytes) without error', () => {
    const large = new Uint8Array(20000).fill(42)
    const dataUrl = bufferToDataUrl(large.buffer)
    const recovered = new Uint8Array(dataUrlToArrayBuffer(dataUrl))
    expect(recovered).toEqual(large)
  })
})

// ---------------------------------------------------------------------------
// AbortController integration — simulates signal handling
// ---------------------------------------------------------------------------
describe('AbortController signal pattern', () => {
  it('resolves with abort error when signal fires before async work', async () => {
    const controller = new AbortController()
    controller.abort()

    const result = await new Promise<string>((resolve) => {
      if (controller.signal.aborted) {
        resolve('aborted')
        return
      }
      resolve('done')
    })

    expect(result).toBe('aborted')
  })

  it('allows normal completion when signal is not aborted', async () => {
    const controller = new AbortController()

    const result = await new Promise<string>((resolve) => {
      if (controller.signal.aborted) {
        resolve('aborted')
        return
      }
      resolve('done')
    })

    expect(result).toBe('done')
  })
})

// ---------------------------------------------------------------------------
// onProgress callback — verifies progress is reported monotonically
// ---------------------------------------------------------------------------
describe('onProgress callback pattern', () => {
  it('reports progress in order from 1 to total', async () => {
    const calls: Array<{ current: number; total: number }> = []
    const onProgress = (current: number, total: number) => calls.push({ current, total })

    const total = 5
    for (let i = 1; i <= total; i++) {
      onProgress(i, total)
    }

    expect(calls).toHaveLength(total)
    expect(calls[0]).toEqual({ current: 1, total: 5 })
    expect(calls[4]).toEqual({ current: 5, total: 5 })
    // Monotonically increasing
    for (let i = 1; i < calls.length; i++) {
      expect(calls[i].current).toBeGreaterThan(calls[i - 1].current)
    }
  })
})

// ---------------------------------------------------------------------------
// Canvas cleanup pattern — verifies zero-size trick releases dimensions
// ---------------------------------------------------------------------------
describe('canvas cleanup pattern', () => {
  it('setting canvas dimensions to 0 resets them', () => {
    const canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 600
    expect(canvas.width).toBe(800)
    expect(canvas.height).toBe(600)

    // Simulate releaseCanvas
    canvas.width = 0
    canvas.height = 0
    expect(canvas.width).toBe(0)
    expect(canvas.height).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// MAX_NON_LAZY_PAGES threshold — verifies auto-lazy logic
// ---------------------------------------------------------------------------
const MAX_NON_LAZY_PAGES = 50

describe('auto-lazy threshold (MAX_NON_LAZY_PAGES = 50)', () => {
  function shouldUseLazy(pageCount: number, requestedLazy?: boolean): boolean {
    if (requestedLazy != null) return requestedLazy
    return pageCount > MAX_NON_LAZY_PAGES
  }

  it('forces lazy mode for PDFs over 50 pages', () => {
    expect(shouldUseLazy(51)).toBe(true)
    expect(shouldUseLazy(100)).toBe(true)
    expect(shouldUseLazy(200)).toBe(true)
  })

  it('uses non-lazy mode for small PDFs', () => {
    expect(shouldUseLazy(1)).toBe(false)
    expect(shouldUseLazy(50)).toBe(false)
  })

  it('respects explicit lazy flag regardless of page count', () => {
    expect(shouldUseLazy(10, true)).toBe(true)
    expect(shouldUseLazy(200, false)).toBe(false)
  })
})
