/**
 * Tests Knowledge Core — loader paresseux des seeds.
 *
 * Vérifie que les ~920 entrées se chargent, sont toutes valides (source +
 * confidence), dédoublonnées par id, triées, et que le résultat est mémoïsé.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { __resetKnowledgeCache, loadKnowledgeBase } from './load'
import { isValidKnowledgeEntry } from './model'

beforeEach(() => {
  __resetKnowledgeCache()
})

describe('loadKnowledgeBase', () => {
  it('charge les 919 entrées des seeds (920 − 1 doublon fusionné Sprint #10)', async () => {
    const entries = await loadKnowledgeBase()
    expect(entries.length).toBe(919)
  })

  it('toutes les entrées chargées sont valides (source + confidence)', async () => {
    const entries = await loadKnowledgeBase()
    for (const e of entries) {
      expect(isValidKnowledgeEntry(e), e.id).toBe(true)
    }
  })

  it('dédoublonne par id (ids uniques)', async () => {
    const entries = await loadKnowledgeBase()
    const ids = entries.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('exclut le manifest (pas d’entrée « pack »/sans id)', async () => {
    const entries = await loadKnowledgeBase()
    expect(entries.every((e) => typeof e.id === 'string' && e.id.trim() !== '')).toBe(true)
  })

  it('trie par order croissant puis terme', async () => {
    const entries = await loadKnowledgeBase()
    for (let i = 1; i < entries.length; i++) {
      const ao = entries[i - 1].order ?? Number.POSITIVE_INFINITY
      const bo = entries[i].order ?? Number.POSITIVE_INFINITY
      expect(ao).toBeLessThanOrEqual(bo)
    }
  })

  it('mémoïse : deux appels renvoient la même référence', async () => {
    const a = await loadKnowledgeBase()
    const b = await loadKnowledgeBase()
    expect(a).toBe(b)
  })
})
