import { hydratePageForRender } from './assets'
import { renderPdfPageDataUrl } from './pdf-page-render'
import { drawTemplate } from './templates'
import { drawStroke, drawStrokes, getStrokeBounds } from './stroke-render'
import { getSticker } from './stickers'
import type {
  ImageElement,
  Page,
  ShapeElement,
  StickerElement,
  Stroke,
  TapeElement,
  TextElement,
} from '../types'
import { PAGE_HEIGHT_PORTRAIT, PAGE_WIDTH_PORTRAIT } from './page-dimensions'

export const PAGE_WIDTH = PAGE_WIDTH_PORTRAIT
export const PAGE_HEIGHT = PAGE_HEIGHT_PORTRAIT

/** Ratio export PNG (spec §11.1 : 2× minimum). */
export const EXPORT_PIXEL_RATIO = 2

export interface PageRenderOptions {
  pdfSourceDataUrl?: string
  exportScale?: number
  notebook?: import('../types').Notebook | null
}

export interface InkClip {
  x: number
  y: number
  w: number
  h: number
}

function withPageRotation(
  ctx: CanvasRenderingContext2D,
  rotation: 0 | 90 | 180 | 270,
  w: number,
  h: number,
  fn: (cw: number, ch: number) => void,
): void {
  const r = rotation || 0
  if (!r) {
    fn(w, h)
    return
  }
  ctx.save()
  ctx.translate(w / 2, h / 2)
  ctx.rotate((r * Math.PI) / 180)
  if (r === 90 || r === 270) {
    ctx.translate(-h / 2, -w / 2)
    fn(h, w)
  } else {
    ctx.translate(-w / 2, -h / 2)
    fn(w, h)
  }
  ctx.restore()
}

export async function renderPageBackground(
  ctx: CanvasRenderingContext2D,
  page: Page,
  w: number,
  h: number,
  opts?: PageRenderOptions,
): Promise<void> {
  const rotation = page.rotation ?? 0
  await new Promise<void>((resolve, reject) => {
    withPageRotation(ctx, rotation, w, h, (cw, ch) => {
      void (async () => {
        try {
          let bgSrc = page.pdfDataUrl
          if (
            !bgSrc &&
            opts?.pdfSourceDataUrl != null &&
            page.pdfPageIndex != null
          ) {
            bgSrc = await renderPdfPageDataUrl(
              opts.pdfSourceDataUrl,
              page.pdfPageIndex,
              opts.exportScale ?? Math.min(2, window.devicePixelRatio || 1),
              opts.notebook?.id ?? 'page-bg',
            )
          }
          if (bgSrc) {
            const img = await loadImage(bgSrc)
            ctx.drawImage(img, 0, 0, cw, ch)
          } else {
            drawTemplate(ctx, page.template, cw, ch)
          }
          resolve()
        } catch (e) {
          reject(e)
        }
      })()
    })
  })
}

function intersectsClip(
  x: number,
  y: number,
  w: number,
  h: number,
  clip: InkClip,
): boolean {
  return x < clip.x + clip.w && x + w > clip.x && y < clip.y + clip.h && y + h > clip.y
}

export function renderPageContent(
  ctx: CanvasRenderingContext2D,
  page: Page,
  w: number,
  h: number,
  opts?: {
    extraStroke?: Stroke | null
    hideRevealedTape?: boolean
    laserTrail?: { x: number; y: number }[]
    inkOnly?: boolean
    clip?: InkClip
  },
): void {
  withPageRotation(ctx, page.rotation ?? 0, w, h, (cw, ch) => {
    void cw
    void ch
    const clip = opts?.clip
    const tapes = opts?.hideRevealedTape
      ? page.tapes
      : page.tapes.filter((t) => !t.revealed)

    if (!opts?.inkOnly) {
      for (const img of page.images) {
        if (!clip || intersectsClip(img.x, img.y, img.width, img.height, clip)) {
          drawImageEl(ctx, img)
        }
      }
      for (const st of page.stickers) {
        if (!clip || intersectsClip(st.x, st.y, st.size, st.size, clip)) {
          drawStickerEl(ctx, st)
        }
      }
    }

    const strokes = clip
      ? page.strokes.filter((s) => {
          const b = getStrokeBounds(s)
          return intersectsClip(b.minX, b.minY, b.maxX - b.minX, b.maxY - b.minY, clip)
        })
      : page.strokes
    drawStrokes(ctx, strokes)
    if (opts?.extraStroke) {
      const ex = opts.extraStroke
      if (!clip) drawStroke(ctx, ex)
      else {
        const b = getStrokeBounds(ex)
        if (intersectsClip(b.minX, b.minY, b.maxX - b.minX, b.maxY - b.minY, clip)) {
          drawStroke(ctx, ex)
        }
      }
    }

    if (!opts?.inkOnly) {
      for (const shape of page.shapes) {
        if (
          !clip ||
          intersectsClip(
            Math.min(shape.x1, shape.x2),
            Math.min(shape.y1, shape.y2),
            Math.abs(shape.x2 - shape.x1),
            Math.abs(shape.y2 - shape.y1),
            clip,
          )
        ) {
          drawShape(ctx, shape)
        }
      }
      for (const tape of tapes) {
        if (!clip || intersectsClip(tape.x, tape.y, tape.width, tape.height, clip)) {
          drawTape(ctx, tape)
        }
      }
      for (const text of page.texts) {
        if (!clip || intersectsClip(text.x, text.y, text.width, text.height, clip)) {
          drawTextPreview(ctx, text)
        }
      }
    }

    if (opts?.laserTrail && opts.laserTrail.length > 1) {
      ctx.save()
      ctx.strokeStyle = '#ef4444'
      ctx.lineWidth = 3
      ctx.globalAlpha = 0.7
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(opts.laserTrail[0].x, opts.laserTrail[0].y)
      for (let i = 1; i < opts.laserTrail.length; i++) {
        ctx.lineTo(opts.laserTrail[i].x, opts.laserTrail[i].y)
      }
      ctx.stroke()
      ctx.restore()
    }
  })
}

export function drawShape(ctx: CanvasRenderingContext2D, s: ShapeElement): void {
  ctx.save()
  ctx.strokeStyle = s.color
  ctx.lineWidth = s.width
  ctx.lineCap = 'round'
  ctx.beginPath()
  switch (s.type) {
    case 'line':
      ctx.moveTo(s.x1, s.y1)
      ctx.lineTo(s.x2, s.y2)
      break
    case 'arrow':
      drawArrow(ctx, s)
      break
    case 'rectangle':
      ctx.strokeRect(s.x1, s.y1, s.x2 - s.x1, s.y2 - s.y1)
      ctx.restore()
      return
    case 'ellipse': {
      const cx = (s.x1 + s.x2) / 2
      const cy = (s.y1 + s.y2) / 2
      const rx = Math.abs(s.x2 - s.x1) / 2
      const ry = Math.abs(s.y2 - s.y1) / 2
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
      break
    }
  }
  ctx.stroke()
  ctx.restore()
}

function drawArrow(ctx: CanvasRenderingContext2D, s: ShapeElement): void {
  const head = 12 + s.width
  const angle = Math.atan2(s.y2 - s.y1, s.x2 - s.x1)
  ctx.moveTo(s.x1, s.y1)
  ctx.lineTo(s.x2, s.y2)
  ctx.lineTo(
    s.x2 - head * Math.cos(angle - Math.PI / 6),
    s.y2 - head * Math.sin(angle - Math.PI / 6),
  )
  ctx.moveTo(s.x2, s.y2)
  ctx.lineTo(
    s.x2 - head * Math.cos(angle + Math.PI / 6),
    s.y2 - head * Math.sin(angle + Math.PI / 6),
  )
}

function drawTape(ctx: CanvasRenderingContext2D, t: TapeElement): void {
  ctx.save()
  ctx.fillStyle = t.revealed ? 'transparent' : t.color
  ctx.globalAlpha = t.revealed ? 0 : 0.92
  ctx.fillRect(t.x, t.y, t.width, t.height)
  if (!t.revealed) {
    ctx.strokeStyle = 'rgba(0,0,0,0.08)'
    ctx.strokeRect(t.x, t.y, t.width, t.height)
  }
  ctx.restore()
}

function drawStickerEl(ctx: CanvasRenderingContext2D, st: StickerElement): void {
  const def = getSticker(st.stickerId)
  if (!def) return
  ctx.save()
  ctx.font = `${st.size}px Segoe UI Emoji, Apple Color Emoji, sans-serif`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText(def.emoji, st.x, st.y)
  ctx.restore()
}

function drawImageEl(ctx: CanvasRenderingContext2D, img: ImageElement): void {
  const src = img.dataUrl
  if (!src) return
  const image = imageCache.get(src)
  if (image?.complete) {
    ctx.drawImage(image, img.x, img.y, img.width, img.height)
  } else if (image) {
    image.onload = () => ctx.drawImage(image, img.x, img.y, img.width, img.height)
  } else {
    const el = new Image()
    el.src = src
    imageCache.set(src, el)
    el.onload = () => ctx.drawImage(el, img.x, img.y, img.width, img.height)
  }
}

function drawTextPreview(ctx: CanvasRenderingContext2D, t: TextElement): void {
  ctx.save()
  ctx.fillStyle = t.color
  ctx.font = `${t.fontSize}px Segoe UI, sans-serif`
  ctx.textAlign = t.align
  const lines = t.content.split('\n')
  let y = t.y + t.fontSize
  const lineH = t.fontSize * 1.35
  for (const line of lines) {
    let x = t.x
    if (t.align === 'center') x = t.x + t.width / 2
    if (t.align === 'right') x = t.x + t.width
    ctx.fillText(line, x, y, t.width)
    y += lineH
  }
  ctx.restore()
}

const imageCache = new Map<string, HTMLImageElement>()

export function clearPageImageCache(): void {
  imageCache.clear()
}

function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(src)
  if (cached?.complete) return Promise.resolve(cached)
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      imageCache.set(src, img)
      resolve(img)
    }
    img.onerror = reject
    img.src = src
  })
}

export async function renderFullPage(
  page: Page,
  w = PAGE_WIDTH,
  h = PAGE_HEIGHT,
  opts?: PageRenderOptions,
): Promise<HTMLCanvasElement> {
  const scale = opts?.exportScale ?? 1
  const canvas = document.createElement('canvas')
  const rot = page.rotation ?? 0
  const dw = (rot === 90 || rot === 270 ? h : w) * scale
  const dh = (rot === 90 || rot === 270 ? w : h) * scale
  canvas.width = dw
  canvas.height = dh
  const ctx = canvas.getContext('2d')!
  if (scale !== 1) ctx.scale(scale, scale)
  const lw = rot === 90 || rot === 270 ? h : w
  const lh = rot === 90 || rot === 270 ? w : h
  const hydrated = await hydratePageForRender(page, opts?.notebook ?? null)
  const renderOpts: PageRenderOptions = {
    ...opts,
    pdfSourceDataUrl: hydrated.pdfSourceDataUrl ?? opts?.pdfSourceDataUrl,
  }
  await renderPageBackground(ctx, hydrated.page, lw, lh, renderOpts)
  renderPageContent(ctx, hydrated.page, lw, lh)
  return canvas
}

export function rectIntersects(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
}

export function elementInRect(
  x: number,
  y: number,
  w: number,
  h: number,
  ex: number,
  ey: number,
  ew: number,
  eh: number,
): boolean {
  return rectIntersects(x, y, w, h, ex, ey, ew, eh)
}
