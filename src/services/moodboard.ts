import { db } from '../db'
import { dataUrlToBlob, putAsset, resolveAssetUrl } from '../lib/assets'
import { createId } from '../lib/id'
import type { MoodboardBoard, MoodboardImage } from '../types'

export const MOODBOARD_ASSET_PREFIX = '__moodboard__:'

function assetNotebookId(boardId: string): string {
  return `${MOODBOARD_ASSET_PREFIX}${boardId}`
}

export async function getBoards(includeArchived = false): Promise<MoodboardBoard[]> {
  const all = await db.moodboardBoards.orderBy('updatedAt').reverse().toArray()
  return includeArchived ? all : all.filter((b) => !b.archived)
}

export async function getArchivedBoards(): Promise<MoodboardBoard[]> {
  return db.moodboardBoards.filter((b) => b.archived).toArray()
}

export async function getBoard(id: string): Promise<MoodboardBoard | undefined> {
  return db.moodboardBoards.get(id)
}

export async function createBoard(
  name: string,
  emoji = '🎨',
  color = '#c8622a',
): Promise<MoodboardBoard> {
  const now = Date.now()
  const board: MoodboardBoard = {
    id: createId(),
    name: name.trim() || 'Moodboard',
    emoji,
    color,
    archived: false,
    createdAt: now,
    updatedAt: now,
  }
  await db.moodboardBoards.add(board)
  return board
}

export async function updateBoard(
  id: string,
  patch: Partial<Pick<MoodboardBoard, 'name' | 'emoji' | 'color' | 'archived'>>,
): Promise<void> {
  await db.moodboardBoards.update(id, { ...patch, updatedAt: Date.now() })
}

export async function deleteBoard(id: string): Promise<void> {
  const images = await db.moodboardImages.where('boardId').equals(id).toArray()
  const assetIds = images.map((i) => i.assetId).filter(Boolean) as string[]
  if (assetIds.length) await db.assets.bulkDelete(assetIds)
  await db.moodboardImages.where('boardId').equals(id).delete()
  await db.moodboardBoards.delete(id)
}

export async function toggleArchiveBoard(id: string): Promise<void> {
  const board = await db.moodboardBoards.get(id)
  if (!board) return
  await updateBoard(id, { archived: !board.archived })
}

export async function getBoardImages(boardId: string): Promise<MoodboardImage[]> {
  return db.moodboardImages.where('boardId').equals(boardId).sortBy('zIndex')
}

export async function getStarredImages(): Promise<MoodboardImage[]> {
  return db.moodboardImages.filter((i) => !!i.starred).toArray()
}

export async function resolveImageUrl(image: MoodboardImage): Promise<string> {
  if (image.assetId) return resolveAssetUrl(image.assetId)
  return image.remoteUrl ?? ''
}

export interface ResolvedMoodboardImage extends MoodboardImage {
  url: string
}

export async function resolveBoardImages(boardId: string): Promise<ResolvedMoodboardImage[]> {
  const images = await getBoardImages(boardId)
  return Promise.all(
    images.map(async (img) => ({
      ...img,
      url: await resolveImageUrl(img),
    })),
  )
}

async function nextZIndex(boardId: string): Promise<number> {
  const images = await getBoardImages(boardId)
  return images.reduce((m, i) => Math.max(m, i.zIndex), 0) + 1
}

function fitSize(nw: number, nh: number, maxW = 320, maxH = 240): { w: number; h: number } {
  const ratio = nw / nh
  let w = maxW
  let h = w / ratio
  if (h > maxH) {
    h = maxH
    w = h * ratio
  }
  return { w: Math.round(w), h: Math.round(h) }
}

export async function addImageFromBlob(
  boardId: string,
  blob: Blob,
  opts: {
    name?: string
    tags?: string[]
    naturalWidth?: number
    naturalHeight?: number
    x?: number
    y?: number
  } = {},
): Promise<MoodboardImage> {
  const assetId = createId()
  await putAsset(assetId, assetNotebookId(boardId), blob, blob.type || 'image/png')

  const nw = opts.naturalWidth ?? 400
  const nh = opts.naturalHeight ?? 300
  const { w, h } = fitSize(nw, nh)
  const now = Date.now()
  const image: MoodboardImage = {
    id: createId(),
    boardId,
    assetId,
    name: opts.name ?? 'Image',
    tags: opts.tags ?? [],
    description: '',
    starred: false,
    x: opts.x ?? 40 + Math.random() * 80,
    y: opts.y ?? 40 + Math.random() * 80,
    w,
    h,
    rotation: 0,
    zIndex: await nextZIndex(boardId),
    naturalWidth: nw,
    naturalHeight: nh,
    createdAt: now,
    updatedAt: now,
  }
  await db.moodboardImages.add(image)
  await db.moodboardBoards.update(boardId, { updatedAt: now })
  return image
}

export async function addImageFromFile(boardId: string, file: File): Promise<MoodboardImage> {
  const blob = file
  const url = URL.createObjectURL(blob)
  const dims = await new Promise<{ nw: number; nh: number }>((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ nw: img.naturalWidth, nh: img.naturalHeight })
    img.onerror = () => resolve({ nw: 400, nh: 300 })
    img.src = url
  })
  URL.revokeObjectURL(url)
  const name = file.name.replace(/\.[^.]+$/, '') || 'Image'
  return addImageFromBlob(boardId, blob, { name, ...dims })
}

export async function addImageFromDataUrl(
  boardId: string,
  dataUrl: string,
  name = 'Image',
): Promise<MoodboardImage> {
  const blob = await dataUrlToBlob(dataUrl)
  return addImageFromBlob(boardId, blob, { name })
}

export async function addImageFromRemoteUrl(
  boardId: string,
  url: string,
  name?: string,
): Promise<MoodboardImage> {
  try {
    const res = await fetch(url)
    if (res.ok) {
      const blob = await res.blob()
      return addImageFromBlob(boardId, blob, { name: name ?? 'Image web' })
    }
  } catch {
    /* fallback remote ref */
  }

  const now = Date.now()
  const image: MoodboardImage = {
    id: createId(),
    boardId,
    remoteUrl: url,
    name: name ?? url.split('/').pop()?.slice(0, 40) ?? 'Image',
    tags: [],
    description: '',
    starred: false,
    x: 40,
    y: 40,
    w: 260,
    h: 180,
    rotation: 0,
    zIndex: await nextZIndex(boardId),
    createdAt: now,
    updatedAt: now,
  }
  await db.moodboardImages.add(image)
  await db.moodboardBoards.update(boardId, { updatedAt: now })
  return image
}

export async function updateImage(
  id: string,
  patch: Partial<
    Pick<
      MoodboardImage,
      | 'name'
      | 'tags'
      | 'description'
      | 'starred'
      | 'x'
      | 'y'
      | 'w'
      | 'h'
      | 'rotation'
      | 'zIndex'
    >
  >,
): Promise<void> {
  const row = await db.moodboardImages.get(id)
  if (!row) return
  await db.moodboardImages.update(id, { ...patch, updatedAt: Date.now() })
  await db.moodboardBoards.update(row.boardId, { updatedAt: Date.now() })
}

export async function deleteImage(id: string): Promise<void> {
  const row = await db.moodboardImages.get(id)
  if (!row) return
  if (row.assetId) await db.assets.delete(row.assetId)
  await db.moodboardImages.delete(id)
  await db.moodboardBoards.update(row.boardId, { updatedAt: Date.now() })
}

export async function toggleStarImage(id: string): Promise<void> {
  const row = await db.moodboardImages.get(id)
  if (!row) return
  await updateImage(id, { starred: !row.starred })
}

export async function bringImageToFront(id: string): Promise<void> {
  const row = await db.moodboardImages.get(id)
  if (!row) return
  await updateImage(id, { zIndex: await nextZIndex(row.boardId) })
}

export function moodboardShareUrl(boardId: string): string {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}/moodboard?board=${encodeURIComponent(boardId)}`
}

export async function copyMoodboardLink(boardId: string): Promise<boolean> {
  const url = moodboardShareUrl(boardId)
  if (!url) return false
  try {
    await navigator.clipboard.writeText(url)
    return true
  } catch {
    return false
  }
}
