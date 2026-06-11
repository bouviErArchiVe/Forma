import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db'
import { buildFolderPath } from './folder-path'
import { createFolder } from '../services/library'

async function resetDb(): Promise<void> {
  db.close()
  await db.delete()
  await db.open()
}

beforeEach(async () => {
  await resetDb()
})

describe('buildFolderPath', () => {
  it('returns an empty array for null folderId', async () => {
    expect(await buildFolderPath(null)).toEqual([])
  })

  it('returns an empty array when the folder does not exist', async () => {
    expect(await buildFolderPath('missing')).toEqual([])
  })

  it('returns a single-element path for a root folder', async () => {
    const f = await createFolder('Root')
    const path = await buildFolderPath(f.id)
    expect(path.map((p) => p.id)).toEqual([f.id])
  })

  it('returns the full ancestor chain in order from root to leaf', async () => {
    const root = await createFolder('Root')
    const child = await createFolder('Child', root.id)
    const grandchild = await createFolder('Grandchild', child.id)

    const path = await buildFolderPath(grandchild.id)
    expect(path.map((p) => p.name)).toEqual(['Root', 'Child', 'Grandchild'])
  })

  it('stops gracefully if a parent folder is missing', async () => {
    const root = await createFolder('Root')
    const child = await createFolder('Child', root.id)
    await db.folders.delete(root.id)

    const path = await buildFolderPath(child.id)
    expect(path.map((p) => p.name)).toEqual(['Child'])
  })
})
