import { beforeEach, describe, expect, it } from 'vitest'
import { getCachedEntry, setCachedEntry, readDicoCache } from './cache'
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
})
