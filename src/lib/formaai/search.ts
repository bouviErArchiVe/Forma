/** FormaAI — recherche multi-documents (lecture index unifié). */

import { buildSearchIndex, type SearchItem } from './indexer'
import { extractSnippet, scoreMatch, splitSearchTerms } from './normalize'

export interface SearchResult extends SearchItem {
  score: number
  snippet: string
}

export interface SearchOptions {
  sourceFilter?: string
  limit?: number
}

/** Filtre + score un index déjà construit (synchrone, testable). */
export function rankItems(
  index: SearchItem[],
  query: string,
  { sourceFilter = 'all', limit = 50 }: SearchOptions = {},
): SearchResult[] {
  const q = String(query ?? '').trim()
  if (!q) return []
  if (!splitSearchTerms(q).length) return []

  let items = index
  if (sourceFilter && sourceFilter !== 'all') {
    items = items.filter((i) => i.source === sourceFilter || i.type === sourceFilter)
  }

  return items
    .map((item) => {
      const fullText = `${item.title} ${item.text}`
      const score = scoreMatch(fullText, q) + scoreMatch(item.title, q) * 0.5
      return { ...item, score, snippet: extractSnippet(fullText, q, 100) }
    })
    .filter((i) => i.score > 0)
    .sort((a, b) => b.score - a.score || (b.updatedAt || 0) - (a.updatedAt || 0))
    .slice(0, limit)
}

export async function searchAll(query: string, opts: SearchOptions = {}): Promise<SearchResult[]> {
  const q = String(query ?? '').trim()
  if (!q) return []
  const index = await buildSearchIndex()
  return rankItems(index, q, opts)
}
