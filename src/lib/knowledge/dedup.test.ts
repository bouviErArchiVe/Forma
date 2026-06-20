import { describe, expect, it } from 'vitest'
import { findDuplicates, jaccard, normTerm } from './dedup'
import type { KnowledgeEntry } from './model'

function entry(p: Partial<KnowledgeEntry> & { id: string }): KnowledgeEntry {
  return {
    slug: p.slug ?? p.id, term: p.term ?? p.id, language: 'fr', type: 'concept',
    domain: p.domain ?? 'architecture', shortDefinition: 's', longDefinition: 'long définition substantielle ici présente.',
    examples: [], synonyms: p.synonyms ?? [], relatedTerms: [], tags: [],
    sources: [{ label: 'Base Forma', type: 'internal' }], confidence: 'concept',
    createdAt: '2026-06-20', updatedAt: '2026-06-20', ...p,
  }
}

describe('normTerm / jaccard', () => {
  it('normalise accents et casse', () => {
    expect(normTerm('Béton Armé')).toBe('beton arme')
  })
  it('jaccard mesure le recouvrement de tokens', () => {
    expect(jaccard(new Set(['a', 'b']), new Set(['a', 'b']))).toBe(1)
    expect(jaccard(new Set(['a']), new Set(['b']))).toBe(0)
  })
})

describe('findDuplicates — exact', () => {
  it('même slug', () => {
    const r = findDuplicates([entry({ id: 'a', slug: 'mur' }), entry({ id: 'b', slug: 'mur' })])
    expect(r.exact.some((d) => d.reason === 'same-slug')).toBe(true)
  })
  it('même terme normalisé (accents/casse)', () => {
    const r = findDuplicates([entry({ id: 'a', term: 'béton' }), entry({ id: 'b', term: 'BETON' })])
    expect(r.exact.some((d) => d.reason === 'same-term')).toBe(true)
  })
  it('même id', () => {
    const r = findDuplicates([entry({ id: 'a', slug: 's1' }), entry({ id: 'a', slug: 's2' })])
    expect(r.exact.some((d) => d.reason === 'same-id')).toBe(true)
  })
})

describe('findDuplicates — quasi', () => {
  it('synonyme croisé', () => {
    const r = findDuplicates([
      entry({ id: 'a', term: 'béton armé' }),
      entry({ id: 'b', term: 'ciment armé', synonyms: ['béton armé'] }),
    ])
    expect(r.near.some((d) => d.reason === 'synonym-match')).toBe(true)
  })
  it('similarité de termes au-dessus du seuil (termes distincts mais proches)', () => {
    const r = findDuplicates(
      [entry({ id: 'a', term: 'ossature bois' }), entry({ id: 'b', term: 'ossature bois massif' })],
      { similarityThreshold: 0.6 },
    )
    expect(r.near.some((d) => d.reason === 'similar-term')).toBe(true)
  })
  it('aucun faux positif entre termes distincts', () => {
    const r = findDuplicates([entry({ id: 'a', term: 'poutre' }), entry({ id: 'b', term: 'fenêtre' })])
    expect(r.near).toEqual([])
    expect(r.exact).toEqual([])
  })
})
