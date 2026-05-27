const SCORES_KEY = 'forma-games-scores'

function readScores() {
  try {
    return JSON.parse(localStorage.getItem(SCORES_KEY) || '{}')
  } catch {
    return {}
  }
}

function writeScores(scores) {
  try {
    localStorage.setItem(SCORES_KEY, JSON.stringify(scores))
  } catch { /* quota */ }
}

export function useGameScores() {
  const getBest = (gameId) => readScores()[gameId] || 0

  const saveBest = (gameId, score) => {
    const current = readScores()
    const best = Math.max(current[gameId] || 0, score)
    if (best !== current[gameId]) {
      writeScores({ ...current, [gameId]: best })
    }
    return best
  }

  return { getBest, saveBest, allScores: readScores() }
}

export { SCORES_KEY }
