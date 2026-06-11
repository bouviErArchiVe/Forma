/**
 * FMoodboard — modèle de données pour le tableau de vision libre.
 *
 * Design :
 * - Items positionnés librement (x, y, width, height) sur un canvas infini
 * - Kinds : image | text | shape (rect / ellipse)
 * - Groupes légers : groupId sur les items
 * - Z-index explicite pour l'ordre des couches
 * - Sérialisation JSON → Page.moodboardData
 */

import { createId } from './id'

// ─── Types ────────────────────────────────────────────────────────────────────

export type MBItemKind = 'image' | 'text' | 'shape'
export type MBShapeKind = 'rect' | 'ellipse'

export interface MBItem {
  id: string
  kind: MBItemKind
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  groupId?: string

  // image
  dataUrl?: string
  assetId?: string
  objectFit?: 'cover' | 'contain'

  // text
  text?: string
  fontSize?: number
  color?: string
  textAlign?: 'left' | 'center' | 'right'
  fontWeight?: 'normal' | 'bold'
  italic?: boolean

  // shape
  shapeKind?: MBShapeKind
  fillColor?: string
  strokeColor?: string
  strokeWidth?: number

  // shared style
  borderRadius?: number
  opacity?: number
  rotation?: number  // degrés, 0 par défaut
}

export interface MBGroup {
  id: string
  label?: string
}

export interface MoodBoard {
  items: MBItem[]
  groups: MBGroup[]
  /** Taille logique du canvas (px, peut être élargie). */
  canvasWidth: number
  canvasHeight: number
  /** Couleur de fond du canvas. */
  background: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const MB_DEFAULT_CANVAS_WIDTH = 1600
export const MB_DEFAULT_CANVAS_HEIGHT = 1000
export const MB_DEFAULT_BACKGROUND = '#f8fafc'
export const MB_GRID_SIZE = 20
export const MB_MAX_IMAGE_BYTES = 10 * 1024 * 1024
export const MB_ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']

// ─── Factories ────────────────────────────────────────────────────────────────

export function createDefaultBoard(): MoodBoard {
  return {
    items: [],
    groups: [],
    canvasWidth: MB_DEFAULT_CANVAS_WIDTH,
    canvasHeight: MB_DEFAULT_CANVAS_HEIGHT,
    background: MB_DEFAULT_BACKGROUND,
  }
}

export function createImageItem(
  dataUrl: string,
  x: number,
  y: number,
  width: number,
  height: number,
  zIndex: number,
  assetId?: string,
): MBItem {
  return {
    id: createId(),
    kind: 'image',
    x, y, width, height, zIndex,
    dataUrl: assetId ? '' : dataUrl,
    assetId,
    objectFit: 'cover',
    borderRadius: 6,
    opacity: 1,
    rotation: 0,
  }
}

export function createTextItem(
  x: number,
  y: number,
  zIndex: number,
): MBItem {
  return {
    id: createId(),
    kind: 'text',
    x, y,
    width: 200,
    height: 80,
    zIndex,
    text: 'Texte',
    fontSize: 18,
    color: '#1e293b',
    textAlign: 'left',
    fontWeight: 'normal',
    italic: false,
    opacity: 1,
    rotation: 0,
  }
}

export function createShapeItem(
  shapeKind: MBShapeKind,
  x: number,
  y: number,
  zIndex: number,
): MBItem {
  return {
    id: createId(),
    kind: 'shape',
    x, y,
    width: 160,
    height: 100,
    zIndex,
    shapeKind,
    fillColor: '#bfdbfe',
    strokeColor: '#3b82f6',
    strokeWidth: 2,
    borderRadius: shapeKind === 'rect' ? 8 : undefined,
    opacity: 1,
    rotation: 0,
  }
}

// ─── Board mutations ──────────────────────────────────────────────────────────

export function addItem(board: MoodBoard, item: MBItem): MoodBoard {
  return { ...board, items: [...board.items, item] }
}

export function removeItems(board: MoodBoard, ids: Set<string>): MoodBoard {
  return { ...board, items: board.items.filter((it) => !ids.has(it.id)) }
}

export function updateItem(board: MoodBoard, id: string, patch: Partial<MBItem>): MoodBoard {
  return {
    ...board,
    items: board.items.map((it) => it.id === id ? { ...it, ...patch } : it),
  }
}

export function updateItems(board: MoodBoard, ids: Set<string>, patch: Partial<MBItem>): MoodBoard {
  return {
    ...board,
    items: board.items.map((it) => ids.has(it.id) ? { ...it, ...patch } : it),
  }
}

export function bringForward(board: MoodBoard, id: string): MoodBoard {
  const item = board.items.find((it) => it.id === id)
  if (!item) return board
  const maxZ = Math.max(...board.items.map((it) => it.zIndex))
  if (item.zIndex >= maxZ) return board
  // Find the next item above
  const nexts = board.items.filter((it) => it.id !== id && it.zIndex > item.zIndex)
  if (!nexts.length) return board
  const nextZ = Math.min(...nexts.map((it) => it.zIndex))
  return {
    ...board,
    items: board.items.map((it) => {
      if (it.id === id) return { ...it, zIndex: nextZ }
      if (it.zIndex === nextZ) return { ...it, zIndex: item.zIndex }
      return it
    }),
  }
}

export function sendBackward(board: MoodBoard, id: string): MoodBoard {
  const item = board.items.find((it) => it.id === id)
  if (!item) return board
  const minZ = Math.min(...board.items.map((it) => it.zIndex))
  if (item.zIndex <= minZ) return board
  const prevs = board.items.filter((it) => it.id !== id && it.zIndex < item.zIndex)
  if (!prevs.length) return board
  const prevZ = Math.max(...prevs.map((it) => it.zIndex))
  return {
    ...board,
    items: board.items.map((it) => {
      if (it.id === id) return { ...it, zIndex: prevZ }
      if (it.zIndex === prevZ) return { ...it, zIndex: item.zIndex }
      return it
    }),
  }
}

export function bringToFront(board: MoodBoard, id: string): MoodBoard {
  const maxZ = Math.max(0, ...board.items.map((it) => it.zIndex))
  return updateItem(board, id, { zIndex: maxZ + 1 })
}

export function sendToBack(board: MoodBoard, id: string): MoodBoard {
  const minZ = Math.min(0, ...board.items.map((it) => it.zIndex))
  return updateItem(board, id, { zIndex: minZ - 1 })
}

export function groupItems(board: MoodBoard, ids: Set<string>): MoodBoard {
  if (ids.size < 2) return board
  const group: MBGroup = { id: createId() }
  return {
    ...board,
    groups: [...board.groups, group],
    items: board.items.map((it) => ids.has(it.id) ? { ...it, groupId: group.id } : it),
  }
}

export function ungroupItems(board: MoodBoard, ids: Set<string>): MoodBoard {
  const groupIds = new Set(board.items.filter((it) => ids.has(it.id) && it.groupId).map((it) => it.groupId!))
  return {
    ...board,
    groups: board.groups.filter((g) => !groupIds.has(g.id)),
    items: board.items.map((it) => groupIds.has(it.groupId ?? '') ? { ...it, groupId: undefined } : it),
  }
}

/** Expand selection to full group if any selected item belongs to a group. */
export function expandGroupSelection(board: MoodBoard, ids: Set<string>): Set<string> {
  const groupIds = new Set(board.items.filter((it) => ids.has(it.id) && it.groupId).map((it) => it.groupId!))
  if (!groupIds.size) return ids
  const expanded = new Set(ids)
  board.items.forEach((it) => { if (it.groupId && groupIds.has(it.groupId)) expanded.add(it.id) })
  return expanded
}

/** Snap a value to the nearest grid point. */
export function snapToGrid(v: number, snap: boolean): number {
  if (!snap) return v
  return Math.round(v / MB_GRID_SIZE) * MB_GRID_SIZE
}

/** Next available z-index (above all current items). */
export function nextZIndex(board: MoodBoard): number {
  return board.items.length === 0 ? 1 : Math.max(...board.items.map((it) => it.zIndex)) + 1
}

// ─── Serialization ────────────────────────────────────────────────────────────

export function serializeBoard(board: MoodBoard): string {
  return JSON.stringify(board)
}

export function deserializeBoard(json: string | undefined): MoodBoard {
  if (!json) return createDefaultBoard()
  try {
    const parsed = JSON.parse(json) as MoodBoard
    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
      groups: Array.isArray(parsed.groups) ? parsed.groups : [],
      canvasWidth: typeof parsed.canvasWidth === 'number' ? parsed.canvasWidth : MB_DEFAULT_CANVAS_WIDTH,
      canvasHeight: typeof parsed.canvasHeight === 'number' ? parsed.canvasHeight : MB_DEFAULT_CANVAS_HEIGHT,
      background: typeof parsed.background === 'string' ? parsed.background : MB_DEFAULT_BACKGROUND,
    }
  } catch {
    return createDefaultBoard()
  }
}

// ─── PNG Export ───────────────────────────────────────────────────────────────

/**
 * Render the board to a PNG data URL using an offscreen canvas.
 * Only image and shape items are rendered (text is omitted for simplicity
 * since Canvas 2D text metrics are complex — use print for full fidelity).
 * @param assetUrls Optional map from assetId → blob URL / data URL for items using assetId.
 */
export async function boardToPngDataUrl(board: MoodBoard, assetUrls?: Map<string, string>): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = board.canvasWidth
  canvas.height = board.canvasHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not available')

  // Background
  ctx.fillStyle = board.background
  ctx.fillRect(0, 0, board.canvasWidth, board.canvasHeight)

  // Sort by zIndex
  const sorted = [...board.items].sort((a, b) => a.zIndex - b.zIndex)

  for (const item of sorted) {
    ctx.save()
    ctx.globalAlpha = item.opacity ?? 1

    // Apply rotation around item center
    if (item.rotation) {
      const cx = item.x + item.width / 2
      const cy = item.y + item.height / 2
      ctx.translate(cx, cy)
      ctx.rotate(item.rotation * Math.PI / 180)
      ctx.translate(-cx, -cy)
    }

    const resolvedUrl = item.kind === 'image'
      ? (item.dataUrl || (item.assetId ? (assetUrls?.get(item.assetId) ?? '') : ''))
      : ''

    if (item.kind === 'image' && resolvedUrl) {
      await new Promise<void>((resolve) => {
        const img = new Image()
        img.onload = () => {
          const br = item.borderRadius ?? 0
          if (br > 0) {
            ctx.beginPath()
            ctx.roundRect(item.x, item.y, item.width, item.height, br)
            ctx.clip()
          }
          if (item.objectFit === 'contain') {
            ctx.drawImage(img, item.x, item.y, item.width, item.height)
          } else {
            // cover: draw centered + clipped
            const scale = Math.max(item.width / img.naturalWidth, item.height / img.naturalHeight)
            const dw = img.naturalWidth * scale
            const dh = img.naturalHeight * scale
            ctx.drawImage(img,
              item.x + (item.width - dw) / 2,
              item.y + (item.height - dh) / 2,
              dw, dh,
            )
          }
          resolve()
        }
        img.onerror = () => resolve()
        img.src = resolvedUrl
      })
    } else if (item.kind === 'shape') {
      ctx.fillStyle = item.fillColor ?? 'transparent'
      ctx.strokeStyle = item.strokeColor ?? 'transparent'
      ctx.lineWidth = item.strokeWidth ?? 1
      if (item.shapeKind === 'ellipse') {
        ctx.beginPath()
        ctx.ellipse(
          item.x + item.width / 2, item.y + item.height / 2,
          item.width / 2, item.height / 2,
          0, 0, Math.PI * 2,
        )
        ctx.fill()
        ctx.stroke()
      } else {
        const br = item.borderRadius ?? 0
        ctx.beginPath()
        if (br > 0) ctx.roundRect(item.x, item.y, item.width, item.height, br)
        else ctx.rect(item.x, item.y, item.width, item.height)
        ctx.fill()
        ctx.stroke()
      }
    } else if (item.kind === 'text' && item.text) {
      ctx.font = `${item.italic ? 'italic ' : ''}${item.fontWeight ?? 'normal'} ${item.fontSize ?? 18}px sans-serif`
      ctx.fillStyle = item.color ?? '#000'
      ctx.textAlign = (item.textAlign ?? 'left') as CanvasTextAlign
      ctx.textBaseline = 'top'
      // Simple word-wrap
      const words = item.text.split(' ')
      const lineH = (item.fontSize ?? 18) * 1.4
      let line = ''
      let y = item.y + 4
      for (const word of words) {
        const test = line ? `${line} ${word}` : word
        if (ctx.measureText(test).width > item.width - 8 && line) {
          ctx.fillText(line, item.x + 4, y)
          line = word
          y += lineH
        } else {
          line = test
        }
      }
      if (line) ctx.fillText(line, item.x + 4, y)
    }

    ctx.restore()
  }

  const dataUrl = canvas.toDataURL('image/png')
  canvas.width = 0
  canvas.height = 0
  return dataUrl
}

export function downloadBoardPng(board: MoodBoard, title: string, assetUrls?: Map<string, string>): void {
  void boardToPngDataUrl(board, assetUrls).then((dataUrl) => {
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `${title.replace(/[<>:"/\\|?*]/g, '_') || 'moodboard'}.png`
    a.click()
  })
}

export function printBoard(board: MoodBoard, title: string, assetUrls?: Map<string, string>): void {
  void boardToPngDataUrl(board, assetUrls).then((dataUrl) => {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
<style>body{margin:0;padding:0}img{max-width:100%;height:auto}@media print{body{margin:0}}</style>
</head><body><img src="${dataUrl}" alt="${title}" /></body></html>`
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(html)
    w.document.close()
    w.focus()
    setTimeout(() => w.print(), 500)
  })
}
