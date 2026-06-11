import { extractKeywords } from './ai-local'

/** Génère des paires Q/R simples depuis un texte (Study Set). */
export function generateStudyPairs(
  text: string,
  maxCards = 5,
): { front: string; back: string }[] {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (!cleaned) return []

  const sentences = cleaned.split(/(?<=[.!?])\s+/).filter((s) => s.length > 20)
  const pairs: { front: string; back: string }[] = []

  for (const s of sentences.slice(0, maxCards)) {
    const words = s.split(/\s+/)
    if (words.length < 6) continue
    const blankAt = Math.min(Math.floor(words.length / 2), words.length - 2)
    const front = words.slice(0, blankAt).join(' ') + ' … ?'
    pairs.push({ front: front.slice(0, 120), back: s.slice(0, 280) })
  }

  if (pairs.length < 2) {
    const kw = extractKeywords(cleaned, 4)
    if (kw.length) {
      pairs.push({
        front: `Définir : ${kw[0]}`,
        back: cleaned.slice(0, 280),
      })
    }
  }

  return pairs.slice(0, maxCards)
}

export function bulletOutline(text: string): string {
  const sentences = text
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.length > 12)
  if (!sentences.length) return '• (aucun contenu)'
  return sentences
    .slice(0, 8)
    .map((s) => `• ${s}`)
    .join('\n')
}
