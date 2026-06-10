import { describe, expect, it } from 'vitest'
import {
  applyLibraryFilters,
  buildRecentList,
  filterByType,
  filterFavorites,
  sortNotebooksBy,
} from './library-helpers'
import type { Notebook } from '../types'

function nb(partial: Partial<Notebook> & Pick<Notebook, 'id'>): Notebook {
  return {
    folderId: null,
    name: 'Sans titre',
    coverColor: '#3b82f6',
    paperTemplate: 'blank',
    orientation: 'portrait',
    type: 'notebook',
    createdAt: 0,
    updatedAt: 0,
    ...partial,
  }
}

describe('sortNotebooksBy', () => {
  const a = nb({ id: 'a', name: 'Banane', createdAt: 10, updatedAt: 100 })
  const b = nb({ id: 'b', name: 'Avocat', createdAt: 20, updatedAt: 50 })
  const c = nb({ id: 'c', name: 'Cerise', createdAt: 5, updatedAt: 200 })

  it('sorts by name asc/desc (locale fr)', () => {
    expect(sortNotebooksBy([a, b, c], 'name', 'asc').map((n) => n.id)).toEqual(['b', 'a', 'c'])
    expect(sortNotebooksBy([a, b, c], 'name', 'desc').map((n) => n.id)).toEqual(['c', 'a', 'b'])
  })

  it('sorts by created asc/desc', () => {
    expect(sortNotebooksBy([a, b, c], 'created', 'asc').map((n) => n.id)).toEqual(['c', 'a', 'b'])
    expect(sortNotebooksBy([a, b, c], 'created', 'desc').map((n) => n.id)).toEqual(['b', 'a', 'c'])
  })

  it('sorts by modified (updatedAt) asc/desc', () => {
    expect(sortNotebooksBy([a, b, c], 'modified', 'asc').map((n) => n.id)).toEqual(['b', 'a', 'c'])
    expect(sortNotebooksBy([a, b, c], 'modified', 'desc').map((n) => n.id)).toEqual(['c', 'a', 'b'])
  })

  it('does not mutate the input array', () => {
    const input = [a, b, c]
    const copy = [...input]
    sortNotebooksBy(input, 'name', 'asc')
    expect(input).toEqual(copy)
  })
})

describe('filterByType', () => {
  const notebook = nb({ id: '1', type: 'notebook' })
  const pdf = nb({ id: '2', type: 'pdf' })
  const board = nb({ id: '3', type: 'whiteboard' })

  it('returns all notebooks when typeFilter is "all"', () => {
    expect(filterByType([notebook, pdf, board], 'all')).toEqual([notebook, pdf, board])
  })

  it('filters by a specific type', () => {
    expect(filterByType([notebook, pdf, board], 'pdf')).toEqual([pdf])
    expect(filterByType([notebook, pdf, board], 'whiteboard')).toEqual([board])
  })

  it('returns empty array when no notebook matches', () => {
    expect(filterByType([notebook, pdf], 'fmoodboard')).toEqual([])
  })
})

describe('filterFavorites', () => {
  it('keeps only notebooks with favorite === true', () => {
    const fav = nb({ id: 'fav', favorite: true })
    const notFav = nb({ id: 'not-fav', favorite: false })
    const undefinedFav = nb({ id: 'undef-fav' })
    expect(filterFavorites([fav, notFav, undefinedFav])).toEqual([fav])
  })
})

describe('buildRecentList', () => {
  const a = nb({ id: 'a' })
  const b = nb({ id: 'b' })
  const c = nb({ id: 'c', deletedAt: 123 })
  const byId = new Map([
    ['a', a],
    ['b', b],
    ['c', c],
  ])

  it('orders notebooks according to recentIds', () => {
    expect(buildRecentList(byId, ['b', 'a']).map((n) => n.id)).toEqual(['b', 'a'])
  })

  it('skips deleted notebooks and unknown ids', () => {
    expect(buildRecentList(byId, ['c', 'x', 'a']).map((n) => n.id)).toEqual(['a'])
  })

  it('truncates to the given limit', () => {
    expect(buildRecentList(byId, ['a', 'b'], 1).map((n) => n.id)).toEqual(['a'])
  })
})

describe('applyLibraryFilters', () => {
  const fav = nb({ id: 'fav', favorite: true, type: 'pdf', name: 'Z-fav', updatedAt: 1, createdAt: 1 })
  const notFav = nb({ id: 'not-fav', favorite: false, type: 'notebook', name: 'A-notfav', updatedAt: 2, createdAt: 2 })
  const all = [fav, notFav]

  it('"all" tab applies type filter then sort', () => {
    const result = applyLibraryFilters(all, { tab: 'all', sortBy: 'name', sortOrder: 'asc' })
    expect(result.map((n) => n.id)).toEqual(['not-fav', 'fav'])
  })

  it('"favorites" tab keeps only favorites', () => {
    const result = applyLibraryFilters(all, { tab: 'favorites' })
    expect(result.map((n) => n.id)).toEqual(['fav'])
  })

  it('"favorites" tab combined with type filter', () => {
    const result = applyLibraryFilters(all, { tab: 'favorites', typeFilter: 'notebook' })
    expect(result).toEqual([])
  })

  it('"recent" tab preserves recentIds order regardless of sortBy', () => {
    const result = applyLibraryFilters(all, {
      tab: 'recent',
      recentIds: ['not-fav', 'fav'],
      sortBy: 'name',
      sortOrder: 'asc',
    })
    expect(result.map((n) => n.id)).toEqual(['not-fav', 'fav'])
  })

  it('"recent" tab respects recentLimit', () => {
    const result = applyLibraryFilters(all, {
      tab: 'recent',
      recentIds: ['fav', 'not-fav'],
      recentLimit: 1,
    })
    expect(result.map((n) => n.id)).toEqual(['fav'])
  })

  it('"recent" tab applies type filter', () => {
    const result = applyLibraryFilters(all, {
      tab: 'recent',
      recentIds: ['fav', 'not-fav'],
      typeFilter: 'pdf',
    })
    expect(result.map((n) => n.id)).toEqual(['fav'])
  })
})
