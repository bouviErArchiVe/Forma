/** FPause — persistance locale des meilleurs scores (localStorage). */

const SCORES_KEY = 'forma-game-scores'

export type GameScores = Record<string, number>

export function readScores(): GameScores {
  try {
    const raw = localStorage.getItem(SCORES_KEY)
    const data = raw ? (JSON.parse(raw) as unknown) : {}
    if (!data || typeof data !== 'object') return {}
    const out: GameScores = {}
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
      if (typeof v === 'number' && Number.isFinite(v)) out[k] = v
    }
    return out
  } catch {
    return {}
  }
}

export function getBest(gameId: string, scores: GameScores = readScores()): number {
  return scores[gameId] ?? 0
}

/** Met à jour le record si `score` est meilleur ; renvoie les scores résultants. */
export function saveBest(gameId: string, score: number, scores: GameScores = readScores()): GameScores {
  if (!Number.isFinite(score)) return scores
  if (score <= (scores[gameId] ?? 0)) return scores
  const next = { ...scores, [gameId]: Math.floor(score) }
  try {
    localStorage.setItem(SCORES_KEY, JSON.stringify(next))
  } catch {
    /* quota */
  }
  return next
}
