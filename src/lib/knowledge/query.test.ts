/**
 * Tests Knowledge Core — requêtes de haut niveau (sur la base réelle chargée).
 *
 * Vérifie lookups par slug/id, recherche classée, et la réponse HONNÊTE :
 * un terme inconnu renvoie `{ found:false, reason:'unknown' }` (jamais inventé).
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { __resetKnowledgeCache } from './load'
import {
  __resetKnowledgeIndex,
  allKnowledgeEntries,
  answerKnowledgeBase,
  lookupById,
  lookupBySlug,
  searchKnowledgeBase,
} from './query'

beforeEach(() => {
  __resetKnowledgeCache()
  __resetKnowledgeIndex()
})

describe('allKnowledgeEntries', () => {
  it('renvoie toute la base (920)', async () => {
    expect((await allKnowledgeEntries()).length).toBe(920)
  })
})

describe('lookupBySlug / lookupById', () => {
  it('retrouve une entrée connue par slug', async () => {
    const e = await lookupBySlug('accessibilite-universelle')
    expect(e?.term).toBe('accessibilité universelle')
  })

  it('retrouve la même entrée par id', async () => {
    const bySlug = await lookupBySlug('accessibilite-universelle')
    expect(bySlug).toBeDefined()
    const byId = await lookupById(bySlug!.id)
    expect(byId?.id).toBe(bySlug!.id)
  })

  it('slug inconnu → undefined (honnête)', async () => {
    expect(await lookupBySlug('terme-totalement-inexistant')).toBeUndefined()
    expect(await lookupById('zzz:nope')).toBeUndefined()
  })
})

describe('searchKnowledgeBase — classement', () => {
  it('requête vide → []', async () => {
    expect(await searchKnowledgeBase('')).toEqual([])
  })

  it('place le terme exact en tête', async () => {
    const hits = await searchKnowledgeBase('accessibilité universelle')
    expect(hits[0]?.entry.term).toBe('accessibilité universelle')
  })

  it('respecte limit', async () => {
    const hits = await searchKnowledgeBase('architecture', { limit: 5 })
    expect(hits.length).toBeLessThanOrEqual(5)
  })

  it('les scores sont décroissants', async () => {
    const hits = await searchKnowledgeBase('plan')
    for (let i = 1; i < hits.length; i++) {
      expect(hits[i - 1].score).toBeGreaterThanOrEqual(hits[i].score)
    }
  })
})

describe('answerKnowledgeBase — honnêteté', () => {
  it('trouve un terme connu et porte une source', async () => {
    const res = await answerKnowledgeBase('accessibilite-universelle')
    expect(res.found).toBe(true)
    if (res.found) {
      expect(res.entry.sources.length).toBeGreaterThan(0)
      expect(res.entry.sources[0].label.trim()).not.toBe('')
    }
  })

  it('signale l’inconnu sans inventer', async () => {
    const res = await answerKnowledgeBase('xyzzy quantique blockchain inexistant')
    expect(res).toEqual({
      found: false,
      term: 'xyzzy quantique blockchain inexistant',
      reason: 'unknown',
    })
  })
})
