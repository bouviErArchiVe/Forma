/** FormaAI — recherche multi-documents */

import { buildSearchIndex } from './indexer'
import { scoreMatch, extractSnippet, splitSearchTerms } from './normalize'

export function searchAll(query, { sourceFilter = 'all', limit = 50 } = {}) {
  const q = String(query || '').trim()
  if (!q) return []

  const terms = splitSearchTerms(q)
  if (!terms.length) return []

  const index = buildSearchIndex()
  let items = index

  if (sourceFilter && sourceFilter !== 'all') {
    items = items.filter((i) => i.source === sourceFilter || i.type === sourceFilter)
  }

  return items
    .map((item) => {
      const fullText = `${item.title} ${item.text}`
      const score = scoreMatch(fullText, q)
      const titleScore = scoreMatch(item.title, q)
      return {
        ...item,
        score: score + titleScore * 0.5,
        snippet: extractSnippet(fullText, q, 100),
      }
    })
    .filter((i) => i.score > 0)
    .sort((a, b) => b.score - a.score || (b.updatedAt || 0) - (a.updatedAt || 0))
    .slice(0, limit)
}

export function findMatchPositions(text, query) {
  const terms = splitSearchTerms(query)
  const positions = []
  const n = String(text || '').toLowerCase()
  for (const t of terms) {
    let idx = 0
    while (idx < n.length) {
      const i = n.indexOf(t, idx)
      if (i < 0) break
      positions.push({ start: i, end: i + t.length, term: t })
      idx = i + 1
    }
  }
  return positions.sort((a, b) => a.start - b.start)
}
