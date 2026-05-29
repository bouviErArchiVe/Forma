import { detectCircleStroke, pointInCircle, type CircleRegion } from './circle-lasso'
import { elementInRect } from './page-render'
import { getStrokeBounds, strokeIntersectsRect } from './stroke-render'
import type { Page, Point, SelectionItem, SelectableKind } from '../types'

/** Rect lasso trop petit = clic sans sélection zone. */
export const MIN_SELECTION_RECT_PX = 4

export function isMeaningfulSelectionRect(rect: { w: number; h: number }): boolean {
  return rect.w >= MIN_SELECTION_RECT_PX || rect.h >= MIN_SELECTION_RECT_PX
}

export function selectionKey(item: SelectionItem): string {
  return `${item.kind}:${item.id}`
}

export function collectSelection(
  page: Page,
  rect: { x: number; y: number; w: number; h: number },
): SelectionItem[] {
  const sel: SelectionItem[] = []
  for (const s of page.strokes) {
    if (strokeIntersectsRect(s, rect.x, rect.y, rect.w, rect.h))
      sel.push({ kind: 'stroke', id: s.id })
  }
  for (const s of page.shapes) {
    if (
      elementInRect(
        rect.x,
        rect.y,
        rect.w,
        rect.h,
        Math.min(s.x1, s.x2),
        Math.min(s.y1, s.y2),
        Math.abs(s.x2 - s.x1),
        Math.abs(s.y2 - s.y1),
      )
    )
      sel.push({ kind: 'shape', id: s.id })
  }
  for (const t of page.texts) {
    if (elementInRect(rect.x, rect.y, rect.w, rect.h, t.x, t.y, t.width, t.height))
      sel.push({ kind: 'text', id: t.id })
  }
  for (const i of page.images) {
    if (elementInRect(rect.x, rect.y, rect.w, rect.h, i.x, i.y, i.width, i.height))
      sel.push({ kind: 'image', id: i.id })
  }
  for (const st of page.stickers) {
    if (elementInRect(rect.x, rect.y, rect.w, rect.h, st.x, st.y, st.size, st.size))
      sel.push({ kind: 'sticker', id: st.id })
  }
  for (const t of page.tapes) {
    if (elementInRect(rect.x, rect.y, rect.w, rect.h, t.x, t.y, t.width, t.height))
      sel.push({ kind: 'tape', id: t.id })
  }
  return sel
}

export function collectSelectionCircle(page: Page, circle: CircleRegion): SelectionItem[] {
  const sel: SelectionItem[] = []
  for (const s of page.strokes) {
    if (s.points.some((p) => pointInCircle(p.x, p.y, circle)))
      sel.push({ kind: 'stroke', id: s.id })
  }
  for (const s of page.shapes) {
    if (
      pointInCircle(s.x1, s.y1, circle) ||
      pointInCircle(s.x2, s.y2, circle) ||
      pointInCircle((s.x1 + s.x2) / 2, (s.y1 + s.y2) / 2, circle)
    )
      sel.push({ kind: 'shape', id: s.id })
  }
  for (const t of page.texts) {
    if (pointInCircle(t.x + t.width / 2, t.y + t.height / 2, circle))
      sel.push({ kind: 'text', id: t.id })
  }
  for (const i of page.images) {
    if (pointInCircle(i.x + i.width / 2, i.y + i.height / 2, circle))
      sel.push({ kind: 'image', id: i.id })
  }
  for (const st of page.stickers) {
    if (pointInCircle(st.x + st.size / 2, st.y + st.size / 2, circle))
      sel.push({ kind: 'sticker', id: st.id })
  }
  for (const t of page.tapes) {
    if (pointInCircle(t.x + t.width / 2, t.y + t.height / 2, circle))
      sel.push({ kind: 'tape', id: t.id })
  }
  return sel
}

export function collectSelectionFromStrokeCircle(
  page: Page,
  points: Point[],
): SelectionItem[] | null {
  const circle = detectCircleStroke(points)
  if (!circle) return null
  return collectSelectionCircle(page, circle)
}

/** Sélectionne l’élément au premier plan sous le point (ordre z approximatif). */
export function hitTestAtPoint(page: Page, pt: Point): SelectionItem | null {
  for (const t of [...page.tapes].reverse()) {
    if (pt.x >= t.x && pt.x <= t.x + t.width && pt.y >= t.y && pt.y <= t.y + t.height)
      return { kind: 'tape', id: t.id }
  }
  for (const st of [...page.stickers].reverse()) {
    if (pt.x >= st.x && pt.x <= st.x + st.size && pt.y >= st.y && pt.y <= st.y + st.size)
      return { kind: 'sticker', id: st.id }
  }
  for (const i of [...page.images].reverse()) {
    if (pt.x >= i.x && pt.x <= i.x + i.width && pt.y >= i.y && pt.y <= i.y + i.height)
      return { kind: 'image', id: i.id }
  }
  for (const t of [...page.texts].reverse()) {
    if (pt.x >= t.x && pt.x <= t.x + t.width && pt.y >= t.y && pt.y <= t.y + t.height)
      return { kind: 'text', id: t.id }
  }
  for (const s of [...page.shapes].reverse()) {
    const near =
      Math.hypot(s.x1 - pt.x, s.y1 - pt.y) < 14 ||
      Math.hypot(s.x2 - pt.x, s.y2 - pt.y) < 14
    if (near) return { kind: 'shape', id: s.id }
  }
  for (const s of [...page.strokes].reverse()) {
    const b = getStrokeBounds(s)
    if (pt.x >= b.minX - 8 && pt.x <= b.maxX + 8 && pt.y >= b.minY - 8 && pt.y <= b.maxY + 8)
      return { kind: 'stroke', id: s.id }
  }
  return null
}

export function selectAllOnPage(page: Page): SelectionItem[] {
  const sel: SelectionItem[] = []
  for (const s of page.strokes) sel.push({ kind: 'stroke', id: s.id })
  for (const s of page.shapes) sel.push({ kind: 'shape', id: s.id })
  for (const t of page.texts) sel.push({ kind: 'text', id: t.id })
  for (const i of page.images) sel.push({ kind: 'image', id: i.id })
  for (const st of page.stickers) sel.push({ kind: 'sticker', id: st.id })
  for (const t of page.tapes) sel.push({ kind: 'tape', id: t.id })
  return sel
}

export function mergeSelection(
  current: SelectionItem[],
  next: SelectionItem[],
  additive: boolean,
): SelectionItem[] {
  if (!additive) return next
  const map = new Map(current.map((s) => [selectionKey(s), s]))
  for (const s of next) map.set(selectionKey(s), s)
  return [...map.values()]
}

/** Shift+clic : retire l’élément s’il est déjà sélectionné, sinon l’ajoute. */
export function toggleSelectionItem(
  current: SelectionItem[],
  item: SelectionItem,
): SelectionItem[] {
  const key = selectionKey(item)
  if (current.some((s) => selectionKey(s) === key)) {
    return current.filter((s) => selectionKey(s) !== key)
  }
  return [...current, item]
}

function idSet(selection: SelectionItem[], kind: SelectableKind): Set<string> {
  return new Set(selection.filter((s) => s.kind === kind).map((s) => s.id))
}

/** Page sans les éléments sélectionnés (aperçu pendant déplacement). */
export function omitSelectionFromPage(page: Page, selection: SelectionItem[]): Page {
  const strokes = idSet(selection, 'stroke')
  const shapes = idSet(selection, 'shape')
  const texts = idSet(selection, 'text')
  const images = idSet(selection, 'image')
  const stickers = idSet(selection, 'sticker')
  const tapes = idSet(selection, 'tape')
  return {
    ...page,
    strokes: page.strokes.filter((s) => !strokes.has(s.id)),
    shapes: page.shapes.filter((s) => !shapes.has(s.id)),
    texts: page.texts.filter((t) => !texts.has(t.id)),
    images: page.images.filter((i) => !images.has(i.id)),
    stickers: page.stickers.filter((s) => !stickers.has(s.id)),
    tapes: page.tapes.filter((t) => !tapes.has(t.id)),
  }
}

/** Sous-ensemble de page pour le rendu fantôme de sélection. */
export function pageWithOnlySelection(page: Page, selection: SelectionItem[]): Page {
  const strokes = idSet(selection, 'stroke')
  const shapes = idSet(selection, 'shape')
  const texts = idSet(selection, 'text')
  const images = idSet(selection, 'image')
  const stickers = idSet(selection, 'sticker')
  const tapes = idSet(selection, 'tape')
  return {
    ...page,
    strokes: page.strokes.filter((s) => strokes.has(s.id)),
    shapes: page.shapes.filter((s) => shapes.has(s.id)),
    texts: page.texts.filter((t) => texts.has(t.id)),
    images: page.images.filter((i) => images.has(i.id)),
    stickers: page.stickers.filter((s) => stickers.has(s.id)),
    tapes: page.tapes.filter((t) => tapes.has(t.id)),
  }
}

export function nudgeSelection(
  page: Page,
  selection: SelectionItem[],
  dx: number,
  dy: number,
): Page {
  if (!selection.length || (dx === 0 && dy === 0)) return page
  return applySelectionMove(page, selection, { x: dx, y: dy })
}

/** Redimensionne la sélection depuis un coin ancré (échelle uniforme min 0.15). */
function rotatePoint(
  x: number,
  y: number,
  cx: number,
  cy: number,
  cos: number,
  sin: number,
): { x: number; y: number } {
  const dx = x - cx
  const dy = y - cy
  return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos }
}

/** Rotation de la sélection autour du centre de sa bbox (ou pivot explicite). */
export function rotateSelection(
  page: Page,
  selection: SelectionItem[],
  angleRad: number,
  pivot?: { x: number; y: number },
): Page {
  if (!selection.length || angleRad === 0) return page
  const bounds = selectionBounds(page, selection)
  if (!bounds) return page
  const cx = pivot?.x ?? bounds.x + bounds.w / 2
  const cy = pivot?.y ?? bounds.y + bounds.h / 2
  const cos = Math.cos(angleRad)
  const sin = Math.sin(angleRad)
  const mapPt = (x: number, y: number) => rotatePoint(x, y, cx, cy, cos, sin)

  const strokeIds = idSet(selection, 'stroke')
  const shapeIds = idSet(selection, 'shape')
  const textIds = idSet(selection, 'text')
  const imageIds = idSet(selection, 'image')
  const stickerIds = idSet(selection, 'sticker')
  const tapeIds = idSet(selection, 'tape')

  return {
    ...page,
    strokes: page.strokes.map((st) => {
      if (!strokeIds.has(st.id)) return st
      return {
        ...st,
        points: st.points.map((p) => {
          const m = mapPt(p.x, p.y)
          return { ...p, x: m.x, y: m.y }
        }),
      }
    }),
    shapes: page.shapes.map((sh) => {
      if (!shapeIds.has(sh.id)) return sh
      const a = mapPt(sh.x1, sh.y1)
      const b = mapPt(sh.x2, sh.y2)
      return { ...sh, x1: a.x, y1: a.y, x2: b.x, y2: b.y }
    }),
    texts: page.texts.map((t) => {
      if (!textIds.has(t.id)) return t
      const h = Math.max(t.height, 40)
      const center = mapPt(t.x + t.width / 2, t.y + h / 2)
      return { ...t, x: center.x - t.width / 2, y: center.y - h / 2 }
    }),
    images: page.images.map((i) => {
      if (!imageIds.has(i.id)) return i
      const center = mapPt(i.x + i.width / 2, i.y + i.height / 2)
      return { ...i, x: center.x - i.width / 2, y: center.y - i.height / 2 }
    }),
    stickers: page.stickers.map((st) => {
      if (!stickerIds.has(st.id)) return st
      const center = mapPt(st.x + st.size / 2, st.y + st.size / 2)
      return { ...st, x: center.x - st.size / 2, y: center.y - st.size / 2 }
    }),
    tapes: page.tapes.map((t) => {
      if (!tapeIds.has(t.id)) return t
      const center = mapPt(t.x + t.width / 2, t.y + t.height / 2)
      return { ...t, x: center.x - t.width / 2, y: center.y - t.height / 2 }
    }),
  }
}

/** Estimation du coût de rendu des traits (segments canvas) pour benchmarks. */
export function countStrokesRenderCost(page: Page): number {
  let cost = 0
  for (const s of page.strokes) {
    const n = s.points.length
    if (n < 2) continue
    cost += s.tool === 'pencil' ? n - 1 : n
  }
  return cost
}

export function scaleSelection(
  page: Page,
  selection: SelectionItem[],
  anchor: { x: number; y: number },
  scale: number,
): Page {
  const s = Math.max(0.15, scale)
  const mapPt = (x: number, y: number) => ({
    x: anchor.x + (x - anchor.x) * s,
    y: anchor.y + (y - anchor.y) * s,
  })
  const strokeIds = idSet(selection, 'stroke')
  const shapeIds = idSet(selection, 'shape')
  const textIds = idSet(selection, 'text')
  const imageIds = idSet(selection, 'image')
  const stickerIds = idSet(selection, 'sticker')
  const tapeIds = idSet(selection, 'tape')
  return {
    ...page,
    strokes: page.strokes.map((st) => {
      if (!strokeIds.has(st.id)) return st
      const pts = st.points.map((p) => {
        const m = mapPt(p.x, p.y)
        return { ...p, x: m.x, y: m.y }
      })
      return { ...st, points: pts, width: st.width * s }
    }),
    shapes: page.shapes.map((sh) => {
      if (!shapeIds.has(sh.id)) return sh
      const a = mapPt(sh.x1, sh.y1)
      const b = mapPt(sh.x2, sh.y2)
      return { ...sh, x1: a.x, y1: a.y, x2: b.x, y2: b.y, width: sh.width * s }
    }),
    texts: page.texts.map((t) => {
      if (!textIds.has(t.id)) return t
      const p = mapPt(t.x, t.y)
      return {
        ...t,
        x: p.x,
        y: p.y,
        width: t.width * s,
        height: t.height * s,
        fontSize: Math.max(8, t.fontSize * s),
      }
    }),
    images: page.images.map((i) => {
      if (!imageIds.has(i.id)) return i
      const p = mapPt(i.x, i.y)
      return { ...i, x: p.x, y: p.y, width: i.width * s, height: i.height * s }
    }),
    stickers: page.stickers.map((st) => {
      if (!stickerIds.has(st.id)) return st
      const p = mapPt(st.x, st.y)
      return { ...st, x: p.x, y: p.y, size: st.size * s }
    }),
    tapes: page.tapes.map((t) => {
      if (!tapeIds.has(t.id)) return t
      const p = mapPt(t.x, t.y)
      return { ...t, x: p.x, y: p.y, width: t.width * s, height: t.height * s }
    }),
  }
}

export function applySelectionMove(
  page: Page,
  selection: SelectionItem[],
  offset: { x: number; y: number },
): Page {
  const ids = (kind: SelectableKind) =>
    new Set(selection.filter((s) => s.kind === kind).map((s) => s.id))
  return {
    ...page,
    strokes: page.strokes.map((s) =>
      ids('stroke').has(s.id)
        ? { ...s, points: s.points.map((p) => ({ ...p, x: p.x + offset.x, y: p.y + offset.y })) }
        : s,
    ),
    shapes: page.shapes.map((s) =>
      ids('shape').has(s.id)
        ? { ...s, x1: s.x1 + offset.x, y1: s.y1 + offset.y, x2: s.x2 + offset.x, y2: s.y2 + offset.y }
        : s,
    ),
    texts: page.texts.map((t) =>
      ids('text').has(t.id) ? { ...t, x: t.x + offset.x, y: t.y + offset.y } : t,
    ),
    images: page.images.map((i) =>
      ids('image').has(i.id) ? { ...i, x: i.x + offset.x, y: i.y + offset.y } : i,
    ),
    stickers: page.stickers.map((s) =>
      ids('sticker').has(s.id) ? { ...s, x: s.x + offset.x, y: s.y + offset.y } : s,
    ),
    tapes: page.tapes.map((t) =>
      ids('tape').has(t.id) ? { ...t, x: t.x + offset.x, y: t.y + offset.y } : t,
    ),
  }
}

export function deleteSelectionItems(page: Page, selection: SelectionItem[]): Page {
  const ids = new Set(selection.map(selectionKey))
  return {
    ...page,
    strokes: page.strokes.filter((s) => !ids.has(`stroke:${s.id}`)),
    shapes: page.shapes.filter((s) => !ids.has(`shape:${s.id}`)),
    texts: page.texts.filter((t) => !ids.has(`text:${t.id}`)),
    images: page.images.filter((i) => !ids.has(`image:${i.id}`)),
    stickers: page.stickers.filter((s) => !ids.has(`sticker:${s.id}`)),
    tapes: page.tapes.filter((t) => !ids.has(`tape:${t.id}`)),
  }
}

export function applyColorToSelection(
  page: Page,
  selection: SelectionItem[],
  color: string,
): Page {
  const strokeIds = new Set(selection.filter((s) => s.kind === 'stroke').map((s) => s.id))
  const shapeIds = new Set(selection.filter((s) => s.kind === 'shape').map((s) => s.id))
  const textIds = new Set(selection.filter((s) => s.kind === 'text').map((s) => s.id))
  return {
    ...page,
    strokes: page.strokes.map((s) => (strokeIds.has(s.id) ? { ...s, color } : s)),
    shapes: page.shapes.map((s) => (shapeIds.has(s.id) ? { ...s, color } : s)),
    texts: page.texts.map((t) => (textIds.has(t.id) ? { ...t, color } : t)),
  }
}

export function selectionBounds(
  page: Page,
  selection: SelectionItem[],
  offset?: { x: number; y: number },
): { x: number; y: number; w: number; h: number } | null {
  const ox = offset?.x ?? 0
  const oy = offset?.y ?? 0
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  const mark = (x1: number, y1: number, x2: number, y2: number) => {
    minX = Math.min(minX, x1 + ox, x2 + ox)
    minY = Math.min(minY, y1 + oy, y2 + oy)
    maxX = Math.max(maxX, x1 + ox, x2 + ox)
    maxY = Math.max(maxY, y1 + oy, y2 + oy)
  }
  for (const s of selection) {
    if (s.kind === 'stroke') {
      const st = page.strokes.find((x) => x.id === s.id)
      if (st) {
        const b = getStrokeBounds(st)
        mark(b.minX, b.minY, b.maxX, b.maxY)
      }
    } else if (s.kind === 'shape') {
      const sh = page.shapes.find((x) => x.id === s.id)
      if (sh) mark(sh.x1, sh.y1, sh.x2, sh.y2)
    } else if (s.kind === 'text') {
      const t = page.texts.find((x) => x.id === s.id)
      if (t) mark(t.x, t.y, t.x + t.width, t.y + Math.max(t.height, 40))
    } else if (s.kind === 'image') {
      const i = page.images.find((x) => x.id === s.id)
      if (i) mark(i.x, i.y, i.x + i.width, i.y + i.height)
    } else if (s.kind === 'sticker') {
      const st = page.stickers.find((x) => x.id === s.id)
      if (st) mark(st.x, st.y, st.x + st.size, st.y + st.size)
    } else if (s.kind === 'tape') {
      const t = page.tapes.find((x) => x.id === s.id)
      if (t) mark(t.x, t.y, t.x + t.width, t.y + t.height)
    }
  }
  if (!Number.isFinite(minX)) return null
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
}

export function drawSelectionBoxes(
  ctx: CanvasRenderingContext2D,
  page: Page,
  selection: SelectionItem[],
  offset?: { x: number; y: number },
): void {
  const ox = offset?.x ?? 0
  const oy = offset?.y ?? 0
  const bounds = selectionBounds(page, selection, offset)
  if (bounds && selection.length > 1) {
    ctx.strokeStyle = '#2563eb'
    ctx.setLineDash([6, 4])
    ctx.strokeRect(bounds.x - 4, bounds.y - 4, bounds.w + 8, bounds.h + 8)
    ctx.setLineDash([])
  }
  const drawBox = (minX: number, minY: number, maxX: number, maxY: number) => {
    ctx.strokeStyle = '#2563eb'
    ctx.setLineDash([4, 3])
    ctx.strokeRect(minX + ox - 4, minY + oy - 4, maxX - minX + 8, maxY - minY + 8)
    ctx.setLineDash([])
  }
  for (const s of selection) {
    if (s.kind === 'stroke') {
      const st = page.strokes.find((x) => x.id === s.id)
      if (st) {
        const b = getStrokeBounds(st)
        drawBox(b.minX, b.minY, b.maxX, b.maxY)
      }
    } else if (s.kind === 'shape') {
      const sh = page.shapes.find((x) => x.id === s.id)
      if (sh) drawBox(Math.min(sh.x1, sh.x2), Math.min(sh.y1, sh.y2), Math.max(sh.x1, sh.x2), Math.max(sh.y1, sh.y2))
    } else if (s.kind === 'text') {
      const t = page.texts.find((x) => x.id === s.id)
      if (t) drawBox(t.x, t.y, t.x + t.width, t.y + Math.max(t.height, 40))
    } else if (s.kind === 'image') {
      const img = page.images.find((x) => x.id === s.id)
      if (img) drawBox(img.x, img.y, img.x + img.width, img.y + img.height)
    } else if (s.kind === 'sticker') {
      const st = page.stickers.find((x) => x.id === s.id)
      if (st) drawBox(st.x, st.y, st.x + st.size, st.y + st.size)
    } else if (s.kind === 'tape') {
      const t = page.tapes.find((x) => x.id === s.id)
      if (t) drawBox(t.x, t.y, t.x + t.width, t.y + t.height)
    }
  }
}
