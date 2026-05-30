import { describe, expect, it } from 'vitest'
import {
  buildFolderTree,
  createFolder,
  createItem,
  getDescendantFolderIds,
  getFolderPath,
  type LibraryFolder,
  type LibraryItem,
} from './model'
import { autoClassify } from './classify'
import { searchLibrary, sortItems } from './search'

function folder(id: string, parentId: string | null, name: string): LibraryFolder {
  return createFolder({ id, parentId, name })
}

function item(partial: Partial<LibraryItem>): LibraryItem {
  const base = createItem(partial)
  return {
    ...base,
    createdAt: partial.createdAt ?? base.createdAt,
    updatedAt: partial.updatedAt ?? base.updatedAt,
  }
}

describe('formalibrary model', () => {
  const folders = [
    folder('a', null, 'A'),
    folder('b', 'a', 'B'),
    folder('c', 'b', 'C'),
    folder('d', null, 'D'),
  ]

  it('builds a nested folder tree sorted by name', () => {
    const tree = buildFolderTree(folders)
    expect(tree.map((n) => n.id)).toEqual(['a', 'd'])
    expect(tree[0].children[0].id).toBe('b')
    expect(tree[0].children[0].children[0].id).toBe('c')
  })

  it('resolves a folder path from root', () => {
    expect(getFolderPath(folders, 'c').map((f) => f.id)).toEqual(['a', 'b', 'c'])
    expect(getFolderPath(folders, null)).toEqual([])
  })

  it('collects descendant folder ids recursively', () => {
    expect(getDescendantFolderIds(folders, 'a').sort()).toEqual(['a', 'b', 'c'])
    expect(getDescendantFolderIds(folders, 'd')).toEqual(['d'])
  })
})

describe('formalibrary autoClassify', () => {
  it('detects PDFs by extension and mime', () => {
    expect(autoClassify({ name: 'plan.pdf' }).category).toBe('pdf')
    expect(autoClassify({ name: 'x', mimeType: 'application/pdf' }).category).toBe('pdf')
  })

  it('detects norms and materials by keywords', () => {
    expect(autoClassify({ name: 'CNB 2020' }).category).toBe('norm')
    expect(autoClassify({ name: 'fiche béton' }).category).toBe('material')
  })

  it('classifies textures and falls back to image', () => {
    expect(autoClassify({ name: 'texture-bois.png' }).category).toBe('texture')
    expect(autoClassify({ name: 'random' }).category).toBe('image')
  })
})

describe('formalibrary search & sort', () => {
  const folders = [folder('a', null, 'A'), folder('b', 'a', 'B')]
  const items = [
    item({ id: '1', name: 'Béton armé', folderId: 'b', category: 'material', tags: ['béton'], updatedAt: 10 }),
    item({ id: '2', name: 'Texture brique', folderId: 'a', category: 'texture', favorite: true, updatedAt: 20 }),
    item({ id: '3', name: 'Plan CNB', folderId: null, category: 'pdf', textContent: 'code du bâtiment', updatedAt: 30 }),
  ]

  it('returns all sorted by updated when no query', () => {
    const res = searchLibrary({ folders, items, query: '' })
    expect(res.map((r) => r.id)).toEqual(['3', '2', '1'])
  })

  it('filters by folder recursively', () => {
    const res = searchLibrary({ folders, items, query: '', filters: { folderId: 'a' } })
    expect(res.map((r) => r.id).sort()).toEqual(['1', '2'])
  })

  it('filters favorites and categories', () => {
    expect(searchLibrary({ folders, items, query: '', filters: { category: 'favorites' } }).map((r) => r.id)).toEqual(['2'])
    expect(searchLibrary({ folders, items, query: '', filters: { category: 'pdf' } }).map((r) => r.id)).toEqual(['3'])
  })

  it('ranks query matches by score', () => {
    const res = searchLibrary({ folders, items, query: 'béton' })
    expect(res[0].id).toBe('1')
  })

  it('matches text content', () => {
    const res = searchLibrary({ folders, items, query: 'bâtiment' })
    expect(res.map((r) => r.id)).toContain('3')
  })

  it('sorts items by name and type', () => {
    expect(sortItems(items, 'name').map((i) => i.id)).toEqual(['1', '3', '2'])
    expect(sortItems(items, 'created').length).toBe(3)
  })
})
