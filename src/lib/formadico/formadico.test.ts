import { beforeEach, describe, expect, it } from 'vitest'
import {
  getCachedEntry,
  setCachedEntry,
  readDicoCache,
  pinCachedEntry,
  unpinCachedEntry,
  dicoCacheStats,
  clearUnpinnedDicoCache,
  isPinned,
} from './cache'
import { FD_MAX_CACHE, type DicoEntry } from './constants'
import { useFormaDicoStore } from '../../stores/formadicoStore'

function makeEntry(word: string): DicoEntry {
  return { word, lang: 'fr', found: true, definitions: [{ pos: 'nom', text: 'def' }] }
}

beforeEach(() => {
  localStorage.clear()
  useFormaDicoStore.setState({ favorites: [], history: [], pendingWord: null, schoolMode: false, lang: 'fr' })
})

describe('formadico cache', () => {
  it('stores and reads an entry case-insensitively', () => {
    setCachedEntry('Mur', 'fr', makeEntry('mur'))
    const got = getCachedEntry('mur', 'fr')
    expect(got?.word).toBe('mur')
  })

  it('returns null for a missing entry', () => {
    expect(getCachedEntry('absent', 'fr')).toBeNull()
  })

  it('evicts oldest entries beyond the cache cap', () => {
    for (let i = 0; i < FD_MAX_CACHE + 5; i += 1) {
      setCachedEntry(`w${i}`, 'fr', makeEntry(`w${i}`))
    }
    expect(Object.keys(readDicoCache()).length).toBeLessThanOrEqual(FD_MAX_CACHE)
    expect(getCachedEntry('w0', 'fr')).toBeNull()
    expect(getCachedEntry(`w${FD_MAX_CACHE + 4}`, 'fr')).not.toBeNull()
  })

  it('keeps pinned (favorite) entries despite eviction pressure', () => {
    setCachedEntry('béton', 'fr', makeEntry('béton'))
    pinCachedEntry('béton', 'fr')
    for (let i = 0; i < FD_MAX_CACHE + 20; i += 1) {
      setCachedEntry(`w${i}`, 'fr', makeEntry(`w${i}`))
    }
    expect(getCachedEntry('béton', 'fr')).not.toBeNull()
  })

  it('preserves the pinned flag across a fresh lookup write', () => {
    setCachedEntry('mur', 'fr', makeEntry('mur'))
    pinCachedEntry('mur', 'fr')
    setCachedEntry('mur', 'fr', makeEntry('mur'))
    expect(readDicoCache()['fr:mur']?.pinned).toBe(true)
  })

  it('unpins across languages', () => {
    setCachedEntry('wall', 'en', makeEntry('wall'))
    pinCachedEntry('wall', 'en')
    unpinCachedEntry('wall')
    expect(readDicoCache()['en:wall']?.pinned).toBe(false)
  })

  it('reports cache stats (total and pinned)', () => {
    setCachedEntry('a', 'fr', makeEntry('a'))
    setCachedEntry('b', 'fr', makeEntry('b'))
    pinCachedEntry('b', 'fr')
    const stats = dicoCacheStats()
    expect(stats.total).toBe(2)
    expect(stats.pinned).toBe(1)
    expect(isPinned('b', 'fr')).toBe(true)
    expect(isPinned('a', 'fr')).toBe(false)
  })

  it('clearUnpinnedDicoCache keeps pinned favorites only', () => {
    setCachedEntry('keep', 'fr', makeEntry('keep'))
    pinCachedEntry('keep', 'fr')
    setCachedEntry('drop', 'fr', makeEntry('drop'))
    const removed = clearUnpinnedDicoCache()
    expect(removed).toBe(1)
    expect(getCachedEntry('keep', 'fr')).not.toBeNull()
    expect(getCachedEntry('drop', 'fr')).toBeNull()
  })
})

describe('formadico store', () => {
  it('toggles favorites and reports membership', () => {
    const s = useFormaDicoStore.getState()
    s.toggleFavorite('Béton')
    expect(useFormaDicoStore.getState().isFavorite('béton')).toBe(true)
    useFormaDicoStore.getState().toggleFavorite('béton')
    expect(useFormaDicoStore.getState().isFavorite('béton')).toBe(false)
  })

  it('pushes history without duplicates, most recent first', () => {
    const s = useFormaDicoStore.getState()
    s.pushHistory('mur', 'fr')
    s.pushHistory('toit', 'fr')
    s.pushHistory('mur', 'fr')
    const hist = useFormaDicoStore.getState().history
    expect(hist[0].word).toBe('mur')
    expect(hist.filter((h) => h.word === 'mur')).toHaveLength(1)
  })

  it('consumes the pending word once', () => {
    useFormaDicoStore.getState().setPendingWord('façade')
    expect(useFormaDicoStore.getState().consumePendingWord()).toBe('façade')
    expect(useFormaDicoStore.getState().consumePendingWord()).toBeNull()
  })

  it('pins the cached entry when favoriting and unpins when removing', () => {
    setCachedEntry('béton', 'fr', makeEntry('béton'))
    useFormaDicoStore.getState().toggleFavorite('béton')
    expect(readDicoCache()['fr:béton']?.pinned).toBe(true)
    useFormaDicoStore.getState().toggleFavorite('béton')
    expect(readDicoCache()['fr:béton']?.pinned).toBe(false)
  })
})
