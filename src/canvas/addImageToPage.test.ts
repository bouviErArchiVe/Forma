import { describe, expect, it } from 'vitest'
import { addImageToPage } from './page-ops'
import type { Page } from '../types'

function makePage(): Page {
  return {
    id: 'p1',
    notebookId: 'nb1',
    order: 0,
    template: 'lined',
    strokes: [],
    shapes: [],
    texts: [],
    images: [],
    stickers: [],
    tapes: [],
    rotation: 0,
  }
}

describe('addImageToPage', () => {
  it('uses fallback 240×180 when no dims provided', () => {
    const page = addImageToPage(makePage(), 'data:x', 100, 100)
    const img = page.images[0]
    expect(img.width).toBe(240)
    expect(img.height).toBe(180)
  })

  it('uses real dims when provided and within MAX', () => {
    const page = addImageToPage(makePage(), 'data:x', 100, 100, { width: 200, height: 150 })
    const img = page.images[0]
    expect(img.width).toBe(200)
    expect(img.height).toBe(150)
  })

  it('scales down wide image to fit within 380px max', () => {
    const page = addImageToPage(makePage(), 'data:x', 0, 0, { width: 760, height: 380 })
    const img = page.images[0]
    expect(img.width).toBe(380)
    expect(img.height).toBe(190)
  })

  it('scales down tall image to fit within 380px max', () => {
    const page = addImageToPage(makePage(), 'data:x', 0, 0, { width: 200, height: 800 })
    const img = page.images[0]
    expect(img.height).toBe(380)
    expect(img.width).toBe(95)
  })

  it('does not scale up small images', () => {
    const page = addImageToPage(makePage(), 'data:x', 0, 0, { width: 50, height: 50 })
    const img = page.images[0]
    expect(img.width).toBe(50)
    expect(img.height).toBe(50)
  })

  it('centers image on cx, cy', () => {
    const page = addImageToPage(makePage(), 'data:x', 200, 300, { width: 100, height: 60 })
    const img = page.images[0]
    expect(img.x).toBe(200 - 50)
    expect(img.y).toBe(300 - 30)
  })

  it('appends to existing images', () => {
    let page = addImageToPage(makePage(), 'data:a', 0, 0, { width: 10, height: 10 })
    page = addImageToPage(page, 'data:b', 0, 0, { width: 10, height: 10 })
    expect(page.images).toHaveLength(2)
  })
})
