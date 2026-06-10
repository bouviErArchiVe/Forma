import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db'
import {
  createFolder,
  createFormaDoc,
  createFMoodboard,
  createFormaTab,
  createNotebook,
  createWhiteboard,
  deleteFolder,
  deleteNotebook,
  duplicateFolder,
  duplicateNotebook,
  emptyTrash,
  getAllNotebooks,
  getFavorites,
  getFolder,
  getFolders,
  getNotebook,
  getNotebooksByIds,
  getNotebooks,
  getPageCounts,
  getTrashNotebooks,
  mergeNotebooks,
  moveNotebook,
  permanentDeleteNotebook,
  purgeTrashOlderThan,
  renameFolder,
  renameNotebook,
  restoreNotebook,
  searchNotebooks,
  softDeleteNotebook,
  sortNotebooks,
  toggleFavorite,
  updateNotebookMetadata,
} from './library'
import { getPages } from './pages'
import type { Notebook } from '../types'

async function resetDb(): Promise<void> {
  db.close()
  await db.delete()
  await db.open()
}

beforeEach(async () => {
  await resetDb()
})

describe('createNotebook', () => {
  it('creates a notebook with one initial page', async () => {
    const nb = await createNotebook({
      name: 'Test',
      coverColor: '#fff',
      paperTemplate: 'lined',
      orientation: 'portrait',
    })
    expect(nb.id).toBeTruthy()
    expect(nb.type).toBe('notebook')
    expect(nb.folderId).toBeNull()
    const pages = await db.pages.where('notebookId').equals(nb.id).toArray()
    expect(pages).toHaveLength(1)
    expect(pages[0].order).toBe(0)
  })

  it('uses the supplied folderId', async () => {
    const folder = await createFolder('Mon dossier')
    const nb = await createNotebook({
      name: 'In folder',
      folderId: folder.id,
      coverColor: '#fff',
      paperTemplate: 'blank',
      orientation: 'portrait',
    })
    expect(nb.folderId).toBe(folder.id)
  })
})

describe('createWhiteboard / createFormaDoc / createFMoodboard / createFormaTab', () => {
  it('creates a whiteboard with type "whiteboard"', async () => {
    const nb = await createWhiteboard('Board')
    expect(nb.type).toBe('whiteboard')
    const stored = await db.notebooks.get(nb.id)
    expect(stored?.type).toBe('whiteboard')
  })

  it('creates a FormaDoc with initial HTML content', async () => {
    const nb = await createFormaDoc('Doc')
    expect(nb.type).toBe('formadoc')
    const page = await db.pages.where('notebookId').equals(nb.id).first()
    expect(page?.content).toContain('<h1>Doc</h1>')
  })

  it('creates a FormaDoc with default name when empty', async () => {
    const nb = await createFormaDoc('')
    expect(nb.name).toBe('Nouveau document')
    const page = await db.pages.where('notebookId').equals(nb.id).first()
    expect(page?.content).toContain('Nouveau document')
  })

  it('creates a moodboard with type "fmoodboard"', async () => {
    const nb = await createFMoodboard('Board')
    expect(nb.type).toBe('fmoodboard')
  })

  it('creates a FormaTab with the formataб type', async () => {
    const nb = await createFormaTab('Tableau')
    expect(nb.type).toBe('formataб')
  })
})

describe('folders', () => {
  it('creates root folders and lists them', async () => {
    const f1 = await createFolder('A')
    const f2 = await createFolder('B')
    const roots = await getFolders(null)
    expect(roots.map((f) => f.id).sort()).toEqual([f1.id, f2.id].sort())
  })

  it('creates nested folders and lists by parentId', async () => {
    const parent = await createFolder('Parent')
    const child = await createFolder('Child', parent.id)
    const children = await getFolders(parent.id)
    expect(children.map((f) => f.id)).toEqual([child.id])
    const roots = await getFolders(null)
    expect(roots.map((f) => f.id)).toEqual([parent.id])
  })

  it('renames a folder', async () => {
    const f = await createFolder('Old')
    await renameFolder(f.id, 'New')
    const stored = await getFolder(f.id)
    expect(stored?.name).toBe('New')
  })

  it('deletes a folder, its subfolders, and soft-deletes contained notebooks', async () => {
    const parent = await createFolder('Parent')
    const child = await createFolder('Child', parent.id)
    const nbInParent = await createNotebook({
      name: 'NB1', folderId: parent.id, coverColor: '#fff', paperTemplate: 'blank', orientation: 'portrait',
    })
    const nbInChild = await createNotebook({
      name: 'NB2', folderId: child.id, coverColor: '#fff', paperTemplate: 'blank', orientation: 'portrait',
    })

    await deleteFolder(parent.id)

    expect(await getFolder(parent.id)).toBeUndefined()
    expect(await getFolder(child.id)).toBeUndefined()
    const trash = await getTrashNotebooks()
    expect(trash.map((n) => n.id).sort()).toEqual([nbInParent.id, nbInChild.id].sort())
  })

  it('duplicateFolder copies the folder, its notebooks, and nested subfolders', async () => {
    const parent = await createFolder('Parent')
    const child = await createFolder('Child', parent.id)
    await createNotebook({
      name: 'In parent', folderId: parent.id, coverColor: '#fff', paperTemplate: 'blank', orientation: 'portrait',
    })
    await createNotebook({
      name: 'In child', folderId: child.id, coverColor: '#fff', paperTemplate: 'blank', orientation: 'portrait',
    })

    const copy = await duplicateFolder(parent.id)
    expect(copy.name).toBe('Parent (copie)')
    expect(copy.id).not.toBe(parent.id)

    const copiedNotebooks = await getNotebooks(copy.id)
    expect(copiedNotebooks).toHaveLength(1)
    expect(copiedNotebooks[0].name).toBe('In parent (copie)')

    const copiedChildren = await getFolders(copy.id)
    expect(copiedChildren).toHaveLength(1)
    expect(copiedChildren[0].name).toBe('Child')

    const copiedChildNotebooks = await getNotebooks(copiedChildren[0].id)
    expect(copiedChildNotebooks).toHaveLength(1)
    expect(copiedChildNotebooks[0].name).toBe('In child (copie)')
  })

  it('throws when duplicating a non-existent folder', async () => {
    await expect(duplicateFolder('nope')).rejects.toThrow('Dossier introuvable')
  })
})

describe('trash / soft delete / restore / permanent delete', () => {
  let nb: Notebook
  beforeEach(async () => {
    nb = await createNotebook({ name: 'Test', coverColor: '#fff', paperTemplate: 'blank', orientation: 'portrait' })
  })

  it('softDeleteNotebook marks deletedAt and excludes from getAllNotebooks default view', async () => {
    await softDeleteNotebook(nb.id)
    const stored = await db.notebooks.get(nb.id)
    expect(stored?.deletedAt).toBeTypeOf('number')
    expect(await getAllNotebooks()).toHaveLength(0)
    expect(await getAllNotebooks(true)).toHaveLength(1)
  })

  it('deleteNotebook is an alias for softDeleteNotebook', async () => {
    await deleteNotebook(nb.id)
    const stored = await db.notebooks.get(nb.id)
    expect(stored?.deletedAt).toBeTypeOf('number')
  })

  it('appears in getTrashNotebooks after soft delete', async () => {
    await softDeleteNotebook(nb.id)
    const trash = await getTrashNotebooks()
    expect(trash.map((n) => n.id)).toEqual([nb.id])
  })

  it('restoreNotebook clears deletedAt', async () => {
    await softDeleteNotebook(nb.id)
    await restoreNotebook(nb.id)
    const stored = await db.notebooks.get(nb.id)
    expect(stored?.deletedAt).toBeUndefined()
    expect(await getTrashNotebooks()).toHaveLength(0)
  })

  it('permanentDeleteNotebook removes notebook, pages, and related records', async () => {
    const pages = await getPages(nb.id)
    expect(pages).toHaveLength(1)

    await permanentDeleteNotebook(nb.id)

    expect(await db.notebooks.get(nb.id)).toBeUndefined()
    expect(await db.pages.where('notebookId').equals(nb.id).count()).toBe(0)
  })

  it('emptyTrash permanently deletes all notebooks in trash and returns the count', async () => {
    const nb2 = await createNotebook({ name: 'Second', coverColor: '#fff', paperTemplate: 'blank', orientation: 'portrait' })
    await softDeleteNotebook(nb.id)
    await softDeleteNotebook(nb2.id)

    const count = await emptyTrash()
    expect(count).toBe(2)
    expect(await getTrashNotebooks()).toHaveLength(0)
    expect(await db.notebooks.get(nb.id)).toBeUndefined()
    expect(await db.notebooks.get(nb2.id)).toBeUndefined()
  })

  it('emptyTrash returns 0 when trash is empty', async () => {
    expect(await emptyTrash()).toBe(0)
  })

  it('purgeTrashOlderThan only deletes items older than the cutoff', async () => {
    const nb2 = await createNotebook({ name: 'Recent', coverColor: '#fff', paperTemplate: 'blank', orientation: 'portrait' })
    const oldTimestamp = Date.now() - 40 * 86400000
    await db.notebooks.update(nb.id, { deletedAt: oldTimestamp })
    await db.notebooks.update(nb2.id, { deletedAt: Date.now() })

    const purged = await purgeTrashOlderThan(30)
    expect(purged).toBe(1)
    expect(await db.notebooks.get(nb.id)).toBeUndefined()
    expect(await db.notebooks.get(nb2.id)).toBeDefined()
  })

  it('purgeTrashOlderThan returns 0 when nothing qualifies', async () => {
    await softDeleteNotebook(nb.id)
    expect(await purgeTrashOlderThan(30)).toBe(0)
  })
})

describe('favorites', () => {
  it('toggleFavorite flips the favorite flag', async () => {
    const nb = await createNotebook({ name: 'Fav test', coverColor: '#fff', paperTemplate: 'blank', orientation: 'portrait' })
    expect((await db.notebooks.get(nb.id))?.favorite).toBeFalsy()

    await toggleFavorite(nb.id)
    expect((await db.notebooks.get(nb.id))?.favorite).toBe(true)

    await toggleFavorite(nb.id)
    expect((await db.notebooks.get(nb.id))?.favorite).toBe(false)
  })

  it('toggleFavorite is a no-op for a non-existent notebook', async () => {
    await expect(toggleFavorite('nope')).resolves.toBeUndefined()
  })

  it('getFavorites returns only favorited, non-deleted notebooks', async () => {
    const nb1 = await createNotebook({ name: 'A', coverColor: '#fff', paperTemplate: 'blank', orientation: 'portrait' })
    const nb2 = await createNotebook({ name: 'B', coverColor: '#fff', paperTemplate: 'blank', orientation: 'portrait' })
    const nb3 = await createNotebook({ name: 'C (deleted fav)', coverColor: '#fff', paperTemplate: 'blank', orientation: 'portrait' })

    await toggleFavorite(nb1.id)
    await toggleFavorite(nb3.id)
    await softDeleteNotebook(nb3.id)

    const favs = await getFavorites()
    expect(favs.map((n) => n.id)).toEqual([nb1.id])
    expect(favs.map((n) => n.id)).not.toContain(nb2.id)
    expect(favs.map((n) => n.id)).not.toContain(nb3.id)
  })
})

describe('search', () => {
  it('searchNotebooks finds case-insensitive substring matches', async () => {
    await createNotebook({ name: 'Mathématiques', coverColor: '#fff', paperTemplate: 'blank', orientation: 'portrait' })
    await createNotebook({ name: 'Physique', coverColor: '#fff', paperTemplate: 'blank', orientation: 'portrait' })

    const results = await searchNotebooks('math')
    expect(results).toHaveLength(1)
    expect(results[0].name).toBe('Mathématiques')
  })

  it('searchNotebooks excludes deleted notebooks', async () => {
    const nb = await createNotebook({ name: 'Histoire', coverColor: '#fff', paperTemplate: 'blank', orientation: 'portrait' })
    await softDeleteNotebook(nb.id)
    expect(await searchNotebooks('histoire')).toHaveLength(0)
  })

  it('searchNotebooks returns all (non-deleted) notebooks for an empty query', async () => {
    await createNotebook({ name: 'A', coverColor: '#fff', paperTemplate: 'blank', orientation: 'portrait' })
    await createNotebook({ name: 'B', coverColor: '#fff', paperTemplate: 'blank', orientation: 'portrait' })
    expect(await searchNotebooks('   ')).toHaveLength(2)
  })

  it('searchNotebooks returns empty array when nothing matches', async () => {
    await createNotebook({ name: 'A', coverColor: '#fff', paperTemplate: 'blank', orientation: 'portrait' })
    expect(await searchNotebooks('zzz')).toHaveLength(0)
  })
})

describe('getNotebooksByIds', () => {
  it('returns notebooks in request order, skipping deleted/missing ids', async () => {
    const nb1 = await createNotebook({ name: 'A', coverColor: '#fff', paperTemplate: 'blank', orientation: 'portrait' })
    const nb2 = await createNotebook({ name: 'B', coverColor: '#fff', paperTemplate: 'blank', orientation: 'portrait' })
    const nb3 = await createNotebook({ name: 'C', coverColor: '#fff', paperTemplate: 'blank', orientation: 'portrait' })
    await softDeleteNotebook(nb3.id)

    const result = await getNotebooksByIds([nb2.id, 'missing', nb3.id, nb1.id])
    expect(result.map((n) => n.id)).toEqual([nb2.id, nb1.id])
  })
})

describe('getPageCounts', () => {
  it('counts pages per notebook id', async () => {
    const nb1 = await createNotebook({ name: 'A', coverColor: '#fff', paperTemplate: 'blank', orientation: 'portrait' })
    const nb2 = await createNotebook({ name: 'B', coverColor: '#fff', paperTemplate: 'blank', orientation: 'portrait' })
    await db.pages.add({
      ...((await getPages(nb2.id))[0]),
      id: 'extra-page',
      order: 1,
    })

    const counts = await getPageCounts([nb1.id, nb2.id])
    expect(counts[nb1.id]).toBe(1)
    expect(counts[nb2.id]).toBe(2)
  })

  it('returns 0 for an empty list', async () => {
    expect(await getPageCounts([])).toEqual({})
  })
})

describe('moveNotebook / renameNotebook / updateNotebookMetadata', () => {
  it('moveNotebook updates folderId', async () => {
    const folder = await createFolder('Target')
    const nb = await createNotebook({ name: 'A', coverColor: '#fff', paperTemplate: 'blank', orientation: 'portrait' })
    await moveNotebook(nb.id, folder.id)
    expect((await db.notebooks.get(nb.id))?.folderId).toBe(folder.id)
  })

  it('renameNotebook updates the name', async () => {
    const nb = await createNotebook({ name: 'Old', coverColor: '#fff', paperTemplate: 'blank', orientation: 'portrait' })
    await renameNotebook(nb.id, 'New')
    expect((await db.notebooks.get(nb.id))?.name).toBe('New')
  })

  it('updateNotebookMetadata patches coverColor/paperTemplate/orientation', async () => {
    const nb = await createNotebook({ name: 'A', coverColor: '#fff', paperTemplate: 'blank', orientation: 'portrait' })
    await updateNotebookMetadata(nb.id, { coverColor: '#000', orientation: 'landscape' })
    const stored = await db.notebooks.get(nb.id)
    expect(stored?.coverColor).toBe('#000')
    expect(stored?.orientation).toBe('landscape')
    expect(stored?.paperTemplate).toBe('blank')
  })
})

describe('sortNotebooks', () => {
  const a = { id: 'a', name: 'Banane', createdAt: 10, updatedAt: 100 } as Notebook
  const b = { id: 'b', name: 'Avocat', createdAt: 20, updatedAt: 50 } as Notebook
  const c = { id: 'c', name: 'Cerise', createdAt: 5, updatedAt: 200 } as Notebook

  it('sorts by name', () => {
    expect(sortNotebooks([a, b, c], 'name', 'asc').map((n) => n.id)).toEqual(['b', 'a', 'c'])
  })

  it('sorts by created/modified', () => {
    expect(sortNotebooks([a, b, c], 'created', 'asc').map((n) => n.id)).toEqual(['c', 'a', 'b'])
    expect(sortNotebooks([a, b, c], 'modified', 'desc').map((n) => n.id)).toEqual(['c', 'a', 'b'])
  })

  it('does not mutate the input array', () => {
    const input = [a, b, c]
    sortNotebooks(input, 'name', 'asc')
    expect(input).toEqual([a, b, c])
  })
})

describe('duplicateNotebook', () => {
  it('returns null for a non-existent notebook', async () => {
    expect(await duplicateNotebook('nope')).toBeNull()
  })

  it('copies the notebook, its pages, and resets favorite/deletedAt', async () => {
    const nb = await createNotebook({ name: 'Original', coverColor: '#fff', paperTemplate: 'blank', orientation: 'portrait' })
    await toggleFavorite(nb.id)
    await softDeleteNotebook(nb.id)
    await restoreNotebook(nb.id)

    const copy = await duplicateNotebook(nb.id)
    expect(copy).not.toBeNull()
    expect(copy!.id).not.toBe(nb.id)
    expect(copy!.name).toBe('Original (copie)')
    expect(copy!.favorite).toBe(false)
    expect(copy!.deletedAt).toBeUndefined()

    const copiedPages = await db.pages.where('notebookId').equals(copy!.id).toArray()
    expect(copiedPages).toHaveLength(1)
    expect(copiedPages[0].id).not.toBe((await db.pages.where('notebookId').equals(nb.id).toArray())[0].id)
  })

  it('places the copy in a different folder when targetFolderId is given', async () => {
    const nb = await createNotebook({ name: 'Original', coverColor: '#fff', paperTemplate: 'blank', orientation: 'portrait' })
    const folder = await createFolder('Target')
    const copy = await duplicateNotebook(nb.id, folder.id)
    expect(copy!.folderId).toBe(folder.id)
  })

  it('copies study cards and audio records', async () => {
    const nb = await createNotebook({ name: 'Original', coverColor: '#fff', paperTemplate: 'blank', orientation: 'portrait' })
    await db.studyCards.add({
      id: 'card1',
      notebookId: nb.id,
      front: 'Q',
      back: 'A',
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
      nextReview: Date.now(),
      createdAt: Date.now(),
    })
    await db.audio.add({
      id: 'audio1',
      notebookId: nb.id,
      name: 'Recording',
      duration: 10,
      createdAt: Date.now(),
      dataUrl: 'data:audio/webm;base64,AAAA',
    })

    const copy = await duplicateNotebook(nb.id)
    const copiedCards = await db.studyCards.where('notebookId').equals(copy!.id).toArray()
    expect(copiedCards).toHaveLength(1)
    expect(copiedCards[0].id).not.toBe('card1')

    const copiedAudio = await db.audio.where('notebookId').equals(copy!.id).toArray()
    expect(copiedAudio).toHaveLength(1)
    expect(copiedAudio[0].id).not.toBe('audio1')
  })
})

describe('mergeNotebooks', () => {
  it('returns false when target and source are the same', async () => {
    const nb = await createNotebook({ name: 'A', coverColor: '#fff', paperTemplate: 'blank', orientation: 'portrait' })
    expect(await mergeNotebooks(nb.id, nb.id)).toBe(false)
  })

  it('returns false when either notebook does not exist', async () => {
    const nb = await createNotebook({ name: 'A', coverColor: '#fff', paperTemplate: 'blank', orientation: 'portrait' })
    expect(await mergeNotebooks(nb.id, 'missing')).toBe(false)
    expect(await mergeNotebooks('missing', nb.id)).toBe(false)
  })

  it('returns false when source or target is deleted', async () => {
    const a = await createNotebook({ name: 'A', coverColor: '#fff', paperTemplate: 'blank', orientation: 'portrait' })
    const b = await createNotebook({ name: 'B', coverColor: '#fff', paperTemplate: 'blank', orientation: 'portrait' })
    await softDeleteNotebook(b.id)
    expect(await mergeNotebooks(a.id, b.id)).toBe(false)
  })

  it('moves pages from source into target with continued ordering, then trashes source', async () => {
    const target = await createNotebook({ name: 'Target', coverColor: '#fff', paperTemplate: 'blank', orientation: 'portrait' })
    const source = await createNotebook({ name: 'Source', coverColor: '#fff', paperTemplate: 'blank', orientation: 'portrait' })

    const ok = await mergeNotebooks(target.id, source.id)
    expect(ok).toBe(true)

    const targetPages = await getPages(target.id)
    expect(targetPages).toHaveLength(2)
    expect(targetPages.map((p) => p.order).sort()).toEqual([0, 1])

    const sourcePages = await db.pages.where('notebookId').equals(source.id).toArray()
    expect(sourcePages).toHaveLength(0)

    const stored = await db.notebooks.get(source.id)
    expect(stored?.deletedAt).toBeTypeOf('number')
  })

  it('moves study cards and audio from source to target', async () => {
    const target = await createNotebook({ name: 'Target', coverColor: '#fff', paperTemplate: 'blank', orientation: 'portrait' })
    const source = await createNotebook({ name: 'Source', coverColor: '#fff', paperTemplate: 'blank', orientation: 'portrait' })
    await db.studyCards.add({
      id: 'card1', notebookId: source.id, front: 'Q', back: 'A', interval: 1,
      easeFactor: 2.5, repetitions: 0, nextReview: Date.now(), createdAt: Date.now(),
    })
    await db.audio.add({
      id: 'audio1', notebookId: source.id, name: 'Rec', duration: 5, createdAt: Date.now(), dataUrl: 'data:audio/webm;base64,AAAA',
    })

    await mergeNotebooks(target.id, source.id)

    expect((await db.studyCards.get('card1'))?.notebookId).toBe(target.id)
    expect((await db.audio.get('audio1'))?.notebookId).toBe(target.id)
  })
})

describe('getNotebook / getFolder', () => {
  it('returns undefined for missing ids', async () => {
    expect(await getNotebook('missing')).toBeUndefined()
    expect(await getFolder('missing')).toBeUndefined()
  })

  it('returns the stored entity', async () => {
    const nb = await createNotebook({ name: 'A', coverColor: '#fff', paperTemplate: 'blank', orientation: 'portrait' })
    const folder = await createFolder('F')
    expect((await getNotebook(nb.id))?.id).toBe(nb.id)
    expect((await getFolder(folder.id))?.id).toBe(folder.id)
  })
})
