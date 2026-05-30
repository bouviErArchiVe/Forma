import { FD_CACHE_KEY, FD_MAX_CACHE, type DicoEntry } from './constants'

export function readDicoCache(): Record<string, DicoEntry & { cachedAt?: number }> {
  try {
    const raw = localStorage.getItem(FD_CACHE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, DicoEntry & { cachedAt?: number }>) : {}
  } catch {
    return {}
  }
}

export function getCachedEntry(word: string, lang: string): DicoEntry | null {
  const key = `${lang}:${word.toLowerCase()}`
  return readDicoCache()[key] || null
}

export function setCachedEntry(word: string, lang: string, entry: DicoEntry): void {
  try {
    const cache = readDicoCache()
    const key = `${lang}:${word.toLowerCase()}`
    cache[key] = { ...entry, cachedAt: Date.now() }
    const keys = Object.keys(cache)
    if (keys.length > FD_MAX_CACHE) {
      keys.sort((a, b) => (cache[a].cachedAt || 0) - (cache[b].cachedAt || 0))
      keys.slice(0, keys.length - FD_MAX_CACHE).forEach((k) => delete cache[k])
    }
    localStorage.setItem(FD_CACHE_KEY, JSON.stringify(cache))
  } catch {
    /* quota */
  }
}
