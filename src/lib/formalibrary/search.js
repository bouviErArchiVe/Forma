/** FormaLibrary — recherche avancée */

import { highlightParts, splitSearchTerms } from '@/lib/formaai/search/normalize'
import { getDescendantFolderIds } from './model'
import { categoryLabel } from './constants'

function norm(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

export function searchLibrary({ folders, items, query, filters = {} }) {
  const {
    folderId = null,
    category = 'all',
    tag = '',
    favoritesOnly = false,
    dateFrom = null,
    dateTo = null,
    recursive = true,
  } = filters

  let pool = items || []

  if (folderId !== undefined && folderId !== null) {
    const ids = new Set(recursive ? getDescendantFolderIds(folders, folderId) : [folderId])
    pool = pool.filter((i) => ids.has(i.folderId))
  }

  if (category && category !== 'all') {
    if (category === 'favorites') pool = pool.filter((i) => i.favorite)
    else pool = pool.filter((i) => i.category === category)
  }

  if (favoritesOnly) pool = pool.filter((i) => i.favorite)

  const tagQ = norm(tag).trim()
  if (tagQ) pool = pool.filter((i) => (i.tags || []).some((t) => norm(t).includes(tagQ)))

  if (dateFrom) pool = pool.filter((i) => (i.updatedAt || 0) >= dateFrom)
  if (dateTo) pool = pool.filter((i) => (i.updatedAt || 0) <= dateTo)

  const q = norm(query).trim()
  if (!q) {
    return pool
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .map((i) => ({ ...i, score: 0, snippet: i.textContent?.slice(0, 120) || i.name }))
  }

  const terms = splitSearchTerms(q)

  return pool
    .map((item) => {
      const hay = norm([item.name, item.textContent, ...(item.tags || []), categoryLabel(item.category)].join(' '))
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

export { highlightParts }
