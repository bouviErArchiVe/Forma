/** FormaDico — préparation des favoris pour une consultation hors-ligne. */
import { lookupWord } from './provider'
import { isPinned, pinCachedEntry } from './cache'
import type { DicoEntry } from './constants'

export interface PrepareProgress {
  done: number
  total: number
  word: string
}

export interface PrepareResult {
  pinned: number
  alreadyReady: number
  failed: string[]
}

/**
 * Récupère et épingle chaque favori absent du cache hors-ligne.
 * Les favoris déjà épinglés sont ignorés (aucune requête réseau).
 */
export async function prepareFavoritesOffline(
  words: string[],
  lang: string,
  onProgress?: (p: PrepareProgress) => void,
): Promise<PrepareResult> {
  const result: PrepareResult = { pinned: 0, alreadyReady: 0, failed: [] }
  let done = 0
  for (const raw of words) {
    const word = raw.trim().toLowerCase()
    done++
    onProgress?.({ done, total: words.length, word })
    if (!word) continue
    if (isPinned(word, lang)) {
      result.alreadyReady++
      continue
    }
    try {
      const entry = (await lookupWord(word, lang)) as DicoEntry
      if (entry?.found) {
        pinCachedEntry(word, lang)
        result.pinned++
      } else {
        result.failed.push(word)
      }
    } catch {
      result.failed.push(word)
    }
  }
  return result
}
