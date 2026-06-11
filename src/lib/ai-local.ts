/** Résumé / aide locale sans API externe (MVP) */
export function summarizeText(text: string, maxSentences = 3): string {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (!cleaned) return 'Aucun contenu à résumer.'
  const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean)
  if (sentences.length <= maxSentences) return cleaned
  return sentences.slice(0, maxSentences).join(' ') + '…'
}

export function reformulate(text: string, mode: 'shorter' | 'longer' | 'formal'): string {
  const t = text.trim()
  if (!t) return ''
  if (mode === 'shorter') {
    const words = t.split(/\s+/)
    return words.slice(0, Math.max(5, Math.ceil(words.length * 0.6))).join(' ') + '.'
  }
  if (mode === 'longer') {
    return `${t} En résumé, ce passage souligne les points essentiels à retenir.`
  }
  return `Il convient de noter que ${t.charAt(0).toLowerCase()}${t.slice(1)}`
}

export function extractKeywords(text: string, n = 8): string[] {
  const stop = new Set(
    'le la les un une des du de et en au aux pour par sur avec dans est sont était'.split(' '),
  )
  const freq = new Map<string, number>()
  for (const w of text.toLowerCase().split(/\W+/)) {
    if (w.length < 4 || stop.has(w)) continue
    freq.set(w, (freq.get(w) ?? 0) + 1)
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([w]) => w)
}

export function answerQuestion(context: string, question: string): string {
  const q = question.toLowerCase()
  const keywords = q.split(/\W+/).filter((w) => w.length > 3)
  const sentences = context.split(/(?<=[.!?])\s+/).filter(Boolean)
  const scored = sentences
    .map((s) => ({
      s,
      score: keywords.reduce((acc, k) => acc + (s.toLowerCase().includes(k) ? 1 : 0), 0),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
  if (!scored.length) {
    return "Je n'ai pas trouvé de passage pertinent dans vos notes. Ajoutez du texte ou précisez la question."
  }
  return scored
    .slice(0, 3)
    .map((x) => x.s)
    .join(' ')
}
