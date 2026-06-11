import { createId } from '../lib/id'
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

export function addImageToPage(
  page: Page,
  dataUrl: string,
  cx: number,
  cy: number,
  dims?: { width: number; height: number },
): Page {
  // Scale to fit within 380px max dimension while preserving aspect ratio
  const MAX = 380
  let w = dims?.width ?? 240
  let h = dims?.height ?? 180
  if (w > MAX || h > MAX) {
    const ratio = Math.min(MAX / w, MAX / h)
    w = Math.round(w * ratio)
    h = Math.round(h * ratio)
  }
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
