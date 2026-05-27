/** FormaAI — recherche : normalisation et surlignage */

export function norm(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

export function splitSearchTerms(query) {
  return norm(query).split(/\s+/).filter(Boolean)
}

export function highlightParts(text, query) {
  const terms = splitSearchTerms(query)
  if (!terms.length) return [{ text: String(text || ''), match: false }]
  const parts = []
  let rest = String(text || '')
  while (rest.length) {
    let found = null
    let idx = rest.length
    for (const t of terms) {
      const i = norm(rest).indexOf(t)
      if (i >= 0 && i < idx) { idx = i; found = t }
    }
    if (found == null) { parts.push({ text: rest, match: false }); break }
    if (idx > 0) parts.push({ text: rest.slice(0, idx), match: false })
    parts.push({ text: rest.slice(idx, idx + found.length), match: true })
    rest = rest.slice(idx + found.length)
  }
  return parts
}

export function extractSnippet(text, query, radius = 80) {
  const raw = String(text || '')
  const terms = splitSearchTerms(query)
  if (!terms.length) return raw.slice(0, radius * 2)
  const n = norm(raw)
  let bestIdx = -1
  for (const t of terms) {
    const i = n.indexOf(t)
    if (i >= 0 && (bestIdx < 0 || i < bestIdx)) bestIdx = i
  }
  if (bestIdx < 0) return raw.slice(0, radius * 2)
  const start = Math.max(0, bestIdx - radius)
  const end = Math.min(raw.length, bestIdx + radius)
  return `${start > 0 ? '…' : ''}${raw.slice(start, end)}${end < raw.length ? '…' : ''}`
}

export function scoreMatch(text, query) {
  const q = norm(query).trim()
  if (!q) return 0
  const terms = splitSearchTerms(q)
  const n = norm(text)
  let score = 0
  if (n.includes(q)) score += 80
  for (const t of terms) {
    if (n.includes(t)) score += 25
  }
  return score
}
