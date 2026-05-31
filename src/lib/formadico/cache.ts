import { FD_CACHE_KEY, FD_LANGS, FD_MAX_CACHE, type DicoEntry } from './constants'

type CachedEntry = DicoEntry & { cachedAt?: number; pinned?: boolean }

export function readDicoCache(): Record<string, CachedEntry> {
  try {
    const raw = localStorage.getItem(FD_CACHE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, CachedEntry>) : {}
  } catch {
    return {}
  }
}

function writeDicoCache(cache: Record<string, CachedEntry>): void {
  try {
    localStorage.setItem(FD_CACHE_KEY, JSON.stringify(cache))
  } catch {
    /* quota */
  }
}

function cacheKey(word: string, lang: string): string {
  return `${lang}:${word.toLowerCase()}`
}

export function getCachedEntry(word: string, lang: string): DicoEntry | null {
  return readDicoCache()[cacheKey(word, lang)] || null
}

export function setCachedEntry(
  word: string,
  lang: string,
  entry: DicoEntry,
  opts?: { pin?: boolean },
): void {
  const cache = readDicoCache()
  const key = cacheKey(word, lang)
  // Conserve l'épingle existante (un nouveau lookup ne doit pas désépingler un favori).
  const pinned = opts?.pin || cache[key]?.pinned || undefined
  cache[key] = { ...entry, cachedAt: Date.now(), pinned }
  evictIfNeeded(cache)
  writeDicoCache(cache)
}

/** Purge les plus anciennes entrées NON épinglées au-delà du plafond. */
function evictIfNeeded(cache: Record<string, CachedEntry>): void {
  const keys = Object.keys(cache)
  if (keys.length <= FD_MAX_CACHE) return
  const evictable = keys
    .filter((k) => !cache[k].pinned)
    .sort((a, b) => (cache[a].cachedAt || 0) - (cache[b].cachedAt || 0))
  const removeCount = keys.length - FD_MAX_CACHE
  for (const k of evictable.slice(0, removeCount)) delete cache[k]
}

/** Épingle l'entrée (favori) pour qu'elle reste disponible hors-ligne. */
export function pinCachedEntry(word: string, lang: string): void {
  const cache = readDicoCache()
  const key = cacheKey(word, lang)
  if (!cache[key]) return
  cache[key] = { ...cache[key], pinned: true }
  writeDicoCache(cache)
}

/** Désépingle l'entrée dans toutes les langues connues. */
export function unpinCachedEntry(word: string): void {
  const cache = readDicoCache()
  let changed = false
  for (const l of FD_LANGS) {
    const key = cacheKey(word, l.id)
    if (cache[key]?.pinned) {
      cache[key] = { ...cache[key], pinned: false }
      changed = true
    }
  }
  if (changed) writeDicoCache(cache)
}

/** Indique si une entrée est en cache ET épinglée (disponible hors-ligne). */
export function isPinned(word: string, lang: string): boolean {
  return !!readDicoCache()[cacheKey(word, lang)]?.pinned
}

export interface DicoCacheStats {
  total: number
  pinned: number
}

export function dicoCacheStats(): DicoCacheStats {
  const cache = readDicoCache()
  const keys = Object.keys(cache)
  return {
    total: keys.length,
    pinned: keys.filter((k) => cache[k].pinned).length,
  }
}

/** Vide les entrées non épinglées (conserve les favoris hors-ligne). Renvoie le nombre supprimé. */
export function clearUnpinnedDicoCache(): number {
  const cache = readDicoCache()
  const next: Record<string, CachedEntry> = {}
  let removed = 0
  for (const [k, v] of Object.entries(cache)) {
    if (v.pinned) next[k] = v
    else removed++
  }
  writeDicoCache(next)
  return removed
}
