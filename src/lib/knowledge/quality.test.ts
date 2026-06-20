import { describe, expect, it } from 'vitest'
import { scoreQuality } from './quality'
import type { KnowledgeEntry } from './model'

function entry(p: Partial<KnowledgeEntry>): KnowledgeEntry {
  return {
    id: 'x', slug: 'x', term: 'x', language: 'fr', type: 'concept', domain: 'architecture',
    shortDefinition: 'def', longDefinition: 'une définition longue et substantielle qui dépasse quarante caractères.',
    examples: ['ex'], synonyms: ['syn'], relatedTerms: ['rel'], tags: ['t'],
    sources: [{ label: 'Base Forma', type: 'internal' }], confidence: 'concept',
    createdAt: '2026-06-20', updatedAt: '2026-06-20', ...p,
  }
}

describe('scoreQuality', () => {
  it('entrée riche et sourcée → ok, score élevé', () => {
    const q = scoreQuality(entry({}))
    expect(q.status).toBe('ok')
    expect(q.score).toBeGreaterThanOrEqual(0.8)
    expect(q.flags).toEqual([])
  })

  it('détecte une définition gabarit → flag templated, jamais ok', () => {
    const q = scoreQuality(entry({
      shortDefinition: 'accessibilité est une notion utilisée en architecture pour décrire.',
      longDefinition: "Dans Forma, l'entrée « x » sert de repère de vocabulaire pour comprendre un document.",
    }))
    expect(q.flags).toContain('templated')
    expect(q.status).not.toBe('ok')
  })

  it('flag les manques (examples/synonyms/related)', () => {
    const q = scoreQuality(entry({ examples: [], synonyms: [], relatedTerms: [] }))
    expect(q.flags).toEqual(expect.arrayContaining(['no-examples', 'no-synonyms', 'no-related']))
  })

  it('confidence à-vérifier → low-confidence + jamais ok', () => {
    const q = scoreQuality(entry({ confidence: 'à-vérifier' }))
    expect(q.flags).toContain('low-confidence')
    expect(q.status).not.toBe('ok')
  })

  it('sans source exploitable → flag + statut review (score effondré)', () => {
    const q = scoreQuality(entry({ sources: [{ label: '  ', type: 'internal' }] }))
    expect(q.flags).toContain('no-usable-source')
    expect(q.status).toBe('review')
  })

  it('définition longue trop courte → short-long-equal', () => {
    const q = scoreQuality(entry({ longDefinition: 'court' }))
    expect(q.flags).toContain('short-long-equal')
  })

  it('score borné entre 0 et 1', () => {
    const q = scoreQuality(entry({ shortDefinition: 'est une notion utilisée en x', longDefinition: 'court', examples: [], synonyms: [], relatedTerms: [], confidence: 'à-vérifier', sources: [{ label: '', type: 'web' }] }))
    expect(q.score).toBeGreaterThanOrEqual(0)
    expect(q.score).toBeLessThanOrEqual(1)
  })
})
