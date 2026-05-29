import { createId } from './id'
import type { ImageElement, Page, StickerElement } from '../types'

export function addStickerToPage(
  page: Page,
  stickerId: string,
  x: number,
  y: number,
): Page {
  const el: StickerElement = {
    id: createId(),
    stickerId,
    x: x - 24,
    y: y - 24,
    size: 48,
    pageId: page.id,
  }
  return { ...page, stickers: [...page.stickers, el] }
}

export function addImageToPage(page: Page, dataUrl: string, cx: number, cy: number): Page {
  const w = 240
  const h = 180
  const img: ImageElement = {
    id: createId(),
    x: cx - w / 2,
    y: cy - h / 2,
    width: w,
    height: h,
    dataUrl,
    pageId: page.id,
  }
  return { ...page, images: [...page.images, img] }
}
