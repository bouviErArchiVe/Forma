import { beforeEach, describe, expect, it } from 'vitest'
import { setCachedEntry, pinCachedEntry, isPinned } from './cache'
import { prepareFavoritesOffline } from './offline'
import type { DicoEntry } from './constants'

function found(word: string): DicoEntry {
  return { word, lang: 'fr', found: true, definitions: [{ pos: 'nom', text: 'def' }] }
}
function notFound(word: string): DicoEntry {
  return { word, lang: 'fr', found: false }
}

beforeEach(() => {
  localStorage.clear()
})

describe('prepareFavoritesOffline', () => {
  it('pins cached-but-unpinned favorites and skips already-ready ones', async () => {
    // 'mur' déjà prêt (épinglé), 'toit' présent mais non épinglé.
    setCachedEntry('mur', 'fr', found('mur'))
    pinCachedEntry('mur', 'fr')
    setCachedEntry('toit', 'fr', found('toit'))

    const res = await prepareFavoritesOffline(['mur', 'toit'], 'fr')

    expect(res.alreadyReady).toBe(1)
    expect(res.pinned).toBe(1)
    expect(res.failed).toHaveLength(0)
    expect(isPinned('toit', 'fr')).toBe(true)
  })

  it('reports words that cannot be found as failed', async () => {
    // Entrée non trouvée mise en cache → lookupWord la renvoie sans réseau.
    setCachedEntry('zzz', 'fr', notFound('zzz'))
    const res = await prepareFavoritesOffline(['zzz'], 'fr')
    expect(res.pinned).toBe(0)
    expect(res.failed).toEqual(['zzz'])
  })

  it('emits progress for each word', async () => {
    setCachedEntry('a', 'fr', found('a'))
    setCachedEntry('b', 'fr', found('b'))
    const seen: number[] = []
    await prepareFavoritesOffline(['a', 'b'], 'fr', (p) => seen.push(p.done))
    expect(seen).toEqual([1, 2])
  })
})
