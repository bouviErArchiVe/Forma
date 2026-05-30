/** FormaAI — recherche : normalisation, score et surlignage (pur, sans I/O). */

export function norm(s: unknown): string {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

export function splitSearchTerms(query: string): string[] {
  return norm(query).split(/\s+/).filter(Boolean)
}

export interface HighlightPart {
  text: string
  match: boolean
}

export function highlightParts(text: string, query: string): HighlightPart[] {
  const terms = splitSearchTerms(query)
  if (!terms.length) return [{ text: String(text ?? ''), match: false }]
  const parts: HighlightPart[] = []
  let rest = String(text ?? '')
  while (rest.length) {
    let found: string | null = null
    let idx = rest.length
    const restNorm = norm(rest)
    for (const t of terms) {
      const i = restNorm.indexOf(t)
      if (i >= 0 && i < idx) {
        idx = i
        found = t
      }
    }
    if (found == null) {
      parts.push({ text: rest, match: false })
      break
    }
    if (idx > 0) parts.push({ text: rest.slice(0, idx), match: false })
    parts.push({ text: rest.slice(idx, idx + found.length), match: true })
    rest = rest.slice(idx + found.length)
  }
  return parts
}

export function extractSnippet(text: string, query: string, radius = 80): string {
  const raw = String(text ?? '')
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

export function scoreMatch(text: string, query: string): number {
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
