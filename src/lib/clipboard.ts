import { cloneAsset, resolveAssetUrl } from './assets'
import { createId } from './id'
import type { Page, SelectionItem } from '../types'
import { normalizePage } from '../types'

export interface PageClipboard {
  strokes: Page['strokes']
  shapes: Page['shapes']
  texts: Page['texts']
  images: Page['images']
  stickers: Page['stickers']
  tapes: Page['tapes']
  offset: { x: number; y: number }
}

let clipboard: PageClipboard | null = null

export function copySelection(page: Page, selection: SelectionItem[]): PageClipboard | null {
  if (!selection.length) return null
  const strokeIds = new Set(selection.filter((s) => s.kind === 'stroke').map((s) => s.id))
  const shapeIds = new Set(selection.filter((s) => s.kind === 'shape').map((s) => s.id))
  const textIds = new Set(selection.filter((s) => s.kind === 'text').map((s) => s.id))
  const imageIds = new Set(selection.filter((s) => s.kind === 'image').map((s) => s.id))
  const stickerIds = new Set(selection.filter((s) => s.kind === 'sticker').map((s) => s.id))
  const tapeIds = new Set(selection.filter((s) => s.kind === 'tape').map((s) => s.id))

  const strokes = page.strokes.filter((s) => strokeIds.has(s.id))
  const shapes = page.shapes.filter((s) => shapeIds.has(s.id))
  const texts = page.texts.filter((t) => textIds.has(t.id))
  const images = page.images.filter((i) => imageIds.has(i.id))
  const stickers = page.stickers.filter((s) => stickerIds.has(s.id))
  const tapes = page.tapes.filter((t) => tapeIds.has(t.id))

  let minX = Infinity
  let minY = Infinity
  const mark = (x: number, y: number) => {
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
  }
  strokes.forEach((s) => s.points.forEach((p) => mark(p.x, p.y)))
  shapes.forEach((s) => {
    mark(s.x1, s.y1)
    mark(s.x2, s.y2)
  })
  texts.forEach((t) => mark(t.x, t.y))
  images.forEach((i) => mark(i.x, i.y))
  stickers.forEach((s) => mark(s.x, s.y))
  tapes.forEach((t) => mark(t.x, t.y))

  if (!Number.isFinite(minX)) minX = 0
  if (!Number.isFinite(minY)) minY = 0

  clipboard = { strokes, shapes, texts, images, stickers, tapes, offset: { x: minX, y: minY } }
  return clipboard
}

export async function pasteClipboard(page: Page, atX: number, atY: number): Promise<Page> {
  if (!clipboard) return page
  const dx = atX - clipboard.offset.x
  const dy = atY - clipboard.offset.y
  const pid = page.id

  const images = await Promise.all(
    clipboard.images.map(async (i) => {
      const newImageId = createId()
      let assetId: string | undefined
      let dataUrl = i.dataUrl
      if (i.assetId) {
        const cloned = await cloneAsset(i.assetId, newImageId, page.notebookId)
        if (cloned) {
          assetId = newImageId
          dataUrl = undefined
        } else if (!dataUrl) {
          dataUrl = await resolveAssetUrl(i.assetId)
        }
      }
      return {
        ...i,
        id: newImageId,
        pageId: pid,
        assetId,
        dataUrl: dataUrl || '',
        x: i.x + dx,
        y: i.y + dy,
      }
    }),
  )

  return normalizePage({
    ...page,
    strokes: [
      ...page.strokes,
      ...clipboard.strokes.map((s) => ({
        ...s,
        id: createId(),
        pageId: pid,
        points: s.points.map((p) => ({ ...p, x: p.x + dx, y: p.y + dy })),
      })),
    ],
    shapes: [
      ...page.shapes,
      ...clipboard.shapes.map((s) => ({
        ...s,
        id: createId(),
        pageId: pid,
        x1: s.x1 + dx,
        y1: s.y1 + dy,
        x2: s.x2 + dx,
        y2: s.y2 + dy,
      })),
    ],
    texts: [
      ...page.texts,
      ...clipboard.texts.map((t) => ({
        ...t,
        id: createId(),
        pageId: pid,
        x: t.x + dx,
        y: t.y + dy,
      })),
    ],
    images: [...page.images, ...images],
    stickers: [
      ...page.stickers,
      ...clipboard.stickers.map((s) => ({
        ...s,
        id: createId(),
        pageId: pid,
        x: s.x + dx,
        y: s.y + dy,
      })),
    ],
    tapes: [
      ...page.tapes,
      ...clipboard.tapes.map((t) => ({
        ...t,
        id: createId(),
        pageId: pid,
        x: t.x + dx,
        y: t.y + dy,
      })),
    ],
  })
}

export async function duplicateSelection(page: Page, selection: SelectionItem[]): Promise<Page> {
  copySelection(page, selection)
  if (!clipboard) return page
  return pasteClipboard(page, clipboard.offset.x + 24, clipboard.offset.y + 24)
}

export function hasClipboard(): boolean {
  return clipboard !== null
}
