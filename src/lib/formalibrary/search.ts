/** FormaLibrary — recherche, filtres et tri (pur, sans I/O). */

import { norm, splitSearchTerms } from '../formaai/normalize'
import { getDescendantFolderIds, type LibraryFolder, type LibraryItem } from './model'
import { categoryLabel, type SortOption } from './constants'

export interface LibrarySearchFilters {
  folderId?: string | null
  category?: string
  tag?: string
  favoritesOnly?: boolean
  recursive?: boolean
}

export interface LibrarySearchResult extends LibraryItem {
  score: number
  snippet: string
}

export interface LibrarySearchInput {
  folders: LibraryFolder[]
  items: LibraryItem[]
  query?: string
  filters?: LibrarySearchFilters
}

export function searchLibrary({
  folders,
  items,
  query = '',
  filters = {},
}: LibrarySearchInput): LibrarySearchResult[] {
  const { folderId = null, category = 'all', tag = '', favoritesOnly = false, recursive = true } = filters

  let pool = items || []

  if (folderId !== null && folderId !== undefined) {
    const ids = new Set(recursive ? getDescendantFolderIds(folders, folderId) : [folderId])
    pool = pool.filter((i) => i.folderId != null && ids.has(i.folderId))
  }

  if (category && category !== 'all') {
    if (category === 'favorites') pool = pool.filter((i) => i.favorite)
    else pool = pool.filter((i) => i.category === category)
  }

  if (favoritesOnly) pool = pool.filter((i) => i.favorite)

  const tagQ = norm(tag).trim()
  if (tagQ) pool = pool.filter((i) => (i.tags || []).some((t) => norm(t).includes(tagQ)))

  const q = norm(query).trim()
  if (!q) {
    return pool
      .slice()
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .map((i) => ({ ...i, score: 0, snippet: i.textContent?.slice(0, 120) || i.name }))
  }

  const terms = splitSearchTerms(q)

  return pool
    .map((item) => {
      const hay = norm(
        [item.name, item.textContent, ...(item.tags || []), categoryLabel(item.category)].join(' '),
      )
      let score = 0
      if (norm(item.name).includes(q)) score += 80
      if (norm(item.name).startsWith(q)) score += 40
      for (const t of terms) {
        if (hay.includes(t)) score += 25
        if ((item.tags || []).some((tg) => norm(tg).includes(t))) score += 15
      }
      if (item.textContent && norm(item.textContent).includes(q)) score += 30

      let snippet = item.textContent || item.name
      const idx = norm(snippet).indexOf(terms[0] || q)
      if (idx >= 0) snippet = `${idx > 40 ? '…' : ''}${snippet.slice(Math.max(0, idx - 40), idx + 100)}…`

      return { ...item, score, snippet }
    })
    .filter((i) => i.score > 0)
    .sort((a, b) => b.score - a.score || (b.updatedAt || 0) - (a.updatedAt || 0))
}

export function sortItems(items: LibraryItem[], sort: SortOption): LibraryItem[] {
  const list = items.slice()
  switch (sort) {
    case 'name':
      return list.sort((a, b) => a.name.localeCompare(b.name, 'fr'))
    case 'created':
      return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    case 'type':
      return list.sort((a, b) => a.category.localeCompare(b.category) || (b.updatedAt || 0) - (a.updatedAt || 0))
    case 'updated':
    default:
      return list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
  }
}
