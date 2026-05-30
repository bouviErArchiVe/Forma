import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db'
import {
  addImageFromBlob,
  createBoard,
  deleteBoard,
  deleteImage,
  getArchivedBoards,
  getBoardImages,
  getBoards,
  getStarredImages,
  MOODBOARD_ASSET_PREFIX,
  moodboardShareUrl,
  toggleArchiveBoard,
  toggleStarImage,
} from './moodboard'

async function resetDb(): Promise<void> {
  db.close()
  await db.delete()
  await db.open()
}

describe('moodboard service', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('creates and lists boards', async () => {
    const board = await createBoard('Projet A', '🏛', '#3d6b8c')
    expect(board.name).toBe('Projet A')
    const boards = await getBoards()
    expect(boards).toHaveLength(1)
    expect(boards[0]!.id).toBe(board.id)
  })

  it('archives and lists archived boards', async () => {
    const board = await createBoard('Archive me')
    await toggleArchiveBoard(board.id)
    expect(await getBoards()).toHaveLength(0)
    expect(await getArchivedBoards()).toHaveLength(1)
  })

  it('adds image blob and deletes board with assets', async () => {
    const board = await createBoard('Images')
    const img = await addImageFromBlob(board.id, new Blob([1, 2, 3], { type: 'image/png' }), {
      name: 'Test',
      naturalWidth: 800,
      naturalHeight: 600,
    })
    expect(img.boardId).toBe(board.id)
    expect(img.assetId).toBeTruthy()

    const images = await getBoardImages(board.id)
    expect(images).toHaveLength(1)

    const asset = await db.assets.get(img.assetId!)
    expect(asset?.notebookId).toBe(`${MOODBOARD_ASSET_PREFIX}${board.id}`)

    await deleteBoard(board.id)
    expect(await getBoardImages(board.id)).toHaveLength(0)
    expect(await db.assets.get(img.assetId!)).toBeUndefined()
  })

  it('toggles star and lists starred images', async () => {
    const board = await createBoard('Star')
    const img = await addImageFromBlob(board.id, new Blob([1], { type: 'image/png' }))
    expect(await getStarredImages()).toHaveLength(0)
    await toggleStarImage(img.id)
    expect(await getStarredImages()).toHaveLength(1)
    await toggleStarImage(img.id)
    expect(await getStarredImages()).toHaveLength(0)
  })

  it('deleteImage removes asset', async () => {
    const board = await createBoard('Del')
    const img = await addImageFromBlob(board.id, new Blob([1], { type: 'image/png' }))
    await deleteImage(img.id)
    expect(await getBoardImages(board.id)).toHaveLength(0)
    expect(await db.assets.get(img.assetId!)).toBeUndefined()
  })

  it('moodboardShareUrl encodes board id', () => {
    expect(moodboardShareUrl('abc-123')).toContain('/moodboard?board=abc-123')
  })
})
