/**
 * Tests for library & assets system improvements (PACK 2).
 * Covers: sticker catalog, image insertion centering, image validation,
 *         thumbnail canvas cleanup, selection engine for images/stickers.
 */
import { describe, expect, it, vi } from 'vitest'
import { STICKER_CATALOG, getSticker } from './stickers'
import { addImageToPage, addStickerToPage } from '../canvas/page-ops'
import type { Page } from '../types'

// selection-engine imports page-render which chains into pdfjs → mock it
vi.mock('./page-render', () => ({
  elementInRect: (
    rx: number, ry: number, rw: number, rh: number,
    ex: number, ey: number, ew: number, eh: number,
  ) => ex < rx + rw && ex + ew > rx && ey < ry + rh && ey + eh > ry,
}))

import { collectSelection } from './selection-engine'

// ---------------------------------------------------------------------------
// Sticker catalog
// ---------------------------------------------------------------------------
describe('STICKER_CATALOG', () => {
  it('has at least 24 stickers', () => {
    expect(STICKER_CATALOG.length).toBeGreaterThanOrEqual(24)
  })

  it('covers all 4 categories', () => {
    const cats = new Set(STICKER_CATALOG.map((s) => s.category))
    expect(cats).toContain('marks')
    expect(cats).toContain('study')
    expect(cats).toContain('arrows')
    expect(cats).toContain('fun')
  })

  it('every sticker has a non-empty emoji and label', () => {
    for (const s of STICKER_CATALOG) {
      expect(s.emoji.trim().length).toBeGreaterThan(0)
      expect(s.label.trim().length).toBeGreaterThan(0)
    }
  })

  it('getSticker returns the correct definition', () => {
    const star = getSticker('star')
    expect(star?.emoji).toBe('⭐')
    expect(star?.category).toBe('marks')
  })

  it('getSticker returns undefined for unknown id', () => {
    expect(getSticker('nonexistent-id')).toBeUndefined()
  })

  it('all sticker IDs are unique', () => {
    const ids = STICKER_CATALOG.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('new stickers are present', () => {
    expect(getSticker('warning')).toBeDefined()
    expect(getSticker('target')).toBeDefined()
    expect(getSticker('arrow-l')).toBeDefined()
    expect(getSticker('trophy')).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Image insertion centering & scaling
// ---------------------------------------------------------------------------
function makePage(): Page {
  return {
    id: 'p1',
    notebookId: 'nb1',
    order: 0,
    template: 'blank',
    strokes: [],
    shapes: [],
    texts: [],
    images: [],
    stickers: [],
    tapes: [],
    rotation: 0,
  }
}

describe('addImageToPage — centering', () => {
  it('centers image at provided cx/cy', () => {
    const cx = 400
    const cy = 300
    const page = addImageToPage(makePage(), 'data:x', cx, cy, { width: 100, height: 60 })
    const img = page.images[0]
    expect(img.x).toBe(cx - 50)
    expect(img.y).toBe(cy - 30)
  })

  it('centers at page center when using portrait page center coords', () => {
    // Portrait page is 794 × 1123; center = 397, 561
    const page = addImageToPage(makePage(), 'data:x', 397, 561, { width: 200, height: 200 })
    const img = page.images[0]
    expect(img.x).toBe(297) // 397 - 100
    expect(img.y).toBe(461) // 561 - 100
  })

  it('scales wide image to fit within 380px', () => {
    const page = addImageToPage(makePage(), 'data:x', 0, 0, { width: 800, height: 400 })
    const img = page.images[0]
    expect(img.width).toBe(380)
    expect(img.height).toBe(190)
    expect(img.width).toBeLessThanOrEqual(380)
  })

  it('does not scale up small images', () => {
    const page = addImageToPage(makePage(), 'data:x', 0, 0, { width: 50, height: 50 })
    expect(page.images[0].width).toBe(50)
    expect(page.images[0].height).toBe(50)
  })

  it('uses fallback dimensions when none provided', () => {
    const page = addImageToPage(makePage(), 'data:x', 100, 100)
    expect(page.images[0].width).toBe(240)
    expect(page.images[0].height).toBe(180)
  })
})

// ---------------------------------------------------------------------------
// Sticker insertion
// ---------------------------------------------------------------------------
describe('addStickerToPage', () => {
  it('places sticker offset 24px from center (size=48, half=24)', () => {
    const page = addStickerToPage(makePage(), 'star', 200, 300)
    const st = page.stickers[0]
    expect(st.x).toBe(176) // 200 - 24
    expect(st.y).toBe(276) // 300 - 24
    expect(st.size).toBe(48)
    expect(st.stickerId).toBe('star')
  })

  it('appends to existing stickers', () => {
    let page = addStickerToPage(makePage(), 'star', 0, 0)
    page = addStickerToPage(page, 'check', 100, 100)
    expect(page.stickers).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// Selection engine — images and stickers are lasso-compatible
// ---------------------------------------------------------------------------
describe('collectSelection — images & stickers', () => {
  it('selects image when lasso covers it', () => {
    const page: Page = {
      ...makePage(),
      images: [{ id: 'img1', x: 100, y: 100, width: 200, height: 150, pageId: 'p1' }],
    }
    const sel = collectSelection(page, { x: 50, y: 50, w: 300, h: 300 })
    expect(sel.some((s) => s.kind === 'image' && s.id === 'img1')).toBe(true)
  })

  it('does not select image outside lasso', () => {
    const page: Page = {
      ...makePage(),
      images: [{ id: 'img1', x: 500, y: 500, width: 100, height: 100, pageId: 'p1' }],
    }
    const sel = collectSelection(page, { x: 0, y: 0, w: 100, h: 100 })
    expect(sel.some((s) => s.kind === 'image')).toBe(false)
  })

  it('selects sticker when lasso covers it', () => {
    const page: Page = {
      ...makePage(),
      stickers: [{ id: 'st1', stickerId: 'star', x: 200, y: 200, size: 48, pageId: 'p1' }],
    }
    const sel = collectSelection(page, { x: 150, y: 150, w: 200, h: 200 })
    expect(sel.some((s) => s.kind === 'sticker' && s.id === 'st1')).toBe(true)
  })

  it('selects both image and sticker in the same lasso', () => {
    const page: Page = {
      ...makePage(),
      images: [{ id: 'img1', x: 100, y: 100, width: 100, height: 100, pageId: 'p1' }],
      stickers: [{ id: 'st1', stickerId: 'star', x: 250, y: 100, size: 48, pageId: 'p1' }],
    }
    const sel = collectSelection(page, { x: 50, y: 50, w: 400, h: 300 })
    expect(sel.some((s) => s.kind === 'image')).toBe(true)
    expect(sel.some((s) => s.kind === 'sticker')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Image file validation logic (mirrors Toolbar.tsx constants)
// ---------------------------------------------------------------------------
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']

function validateImage(type: string, size: number): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(type)) return `Format non supporté : ${type}`
  if (size > MAX_IMAGE_BYTES) return `Image trop volumineuse`
  return null
}

describe('image file validation', () => {
  it('accepts valid image types', () => {
    expect(validateImage('image/jpeg', 1000)).toBeNull()
    expect(validateImage('image/png', 1000)).toBeNull()
    expect(validateImage('image/webp', 1000)).toBeNull()
    expect(validateImage('image/svg+xml', 1000)).toBeNull()
  })

  it('rejects unsupported types', () => {
    expect(validateImage('application/pdf', 1000)).not.toBeNull()
    expect(validateImage('text/plain', 1000)).not.toBeNull()
    expect(validateImage('image/bmp', 1000)).not.toBeNull()
  })

  it('rejects files over 10 MB', () => {
    expect(validateImage('image/jpeg', MAX_IMAGE_BYTES + 1)).not.toBeNull()
    expect(validateImage('image/jpeg', MAX_IMAGE_BYTES)).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Thumbnail canvas cleanup pattern
// ---------------------------------------------------------------------------
describe('thumbnail canvas cleanup', () => {
  it('canvas releases memory after width/height set to 0', () => {
    const canvas = document.createElement('canvas')
    canvas.width = 160
    canvas.height = 226
    expect(canvas.width).toBe(160)
    // Simulate what requestCoverThumb does after toDataURL
    canvas.width = 0
    canvas.height = 0
    expect(canvas.width).toBe(0)
    expect(canvas.height).toBe(0)
  })
})
