/**
 * Tests Knowledge Core — index de recherche.
 *
 * Vérifie l'indexation diacritique-insensible (term, slug, synonyme, tag,
 * relatedTerm, domain, type), le classement par pertinence et les lookups.
 */
import { describe, expect, it } from 'vitest'
import { buildSearchIndex } from './search-index'
import type { KnowledgeEntry } from './model'

function entry(p: Partial<KnowledgeEntry>): KnowledgeEntry {
  return {
    id: p.id ?? 'x',
    slug: p.slug ?? 'x',
    term: p.term ?? 'X',
    language: 'fr',
    type: p.type ?? 'concept',
    domain: p.domain ?? 'architecture',
    shortDefinition: p.shortDefinition ?? 'def',
    longDefinition: p.longDefinition ?? 'def',
    examples: p.examples ?? [],
    synonyms: p.synonyms ?? [],
    relatedTerms: p.relatedTerms ?? [],
    tags: p.tags ?? [],
    sources: p.sources ?? [{ label: 'S', type: 'internal' }],
    confidence: p.confidence ?? 'indicatif',
    createdAt: '2026-06-20',
    updatedAt: '2026-06-20',
    ...(p.order !== undefined ? { order: p.order } : {}),
  }
}

const ENTRIES: KnowledgeEntry[] = [
  entry({ id: 'a', slug: 'beton-arme', term: 'béton armé', synonyms: ['BA'], tags: ['matériau'], domain: 'construction', type: 'material' }),
  entry({ id: 'b', slug: 'linteau', term: 'linteau', relatedTerms: ['poutre'], tags: ['structure'] }),
  entry({ id: 'c', slug: 'poutre', term: 'poutre', synonyms: ['sommier'] }),
]

const index = buildSearchIndex(ENTRIES)

describe('buildSearchIndex — lookups', () => {
  it('bySlug est insensible aux accents/casse', () => {
    expect(index.bySlug('linteau')?.id).toBe('b')
    expect(index.bySlug('BETON-ARME')?.id).toBe('a')
  })

  it('byId trouve l’entrée', () => {
    expect(index.byId('c')?.term).toBe('poutre')
    expect(index.byId('zzz')).toBeUndefined()
  })

  it('expose toutes les entrées', () => {
    expect(index.entries.length).toBe(3)
  })
})

describe('buildSearchIndex — recherche', () => {
  it('requête vide → []', () => {
    expect(index.search('')).toEqual([])
    expect(index.search('   ')).toEqual([])
  })

  it('trouve par terme, insensible aux accents', () => {
    expect(index.search('beton')[0]?.entry.id).toBe('a')
  })

  it('trouve par synonyme', () => {
    expect(index.search('sommier').some((h) => h.entry.id === 'c')).toBe(true)
  })

  it('trouve par tag', () => {
    expect(index.search('structure').some((h) => h.entry.id === 'b')).toBe(true)
  })

  it('trouve par relatedTerm', () => {
    expect(index.search('poutre').some((h) => h.entry.id === 'b')).toBe(true)
  })

  it('trouve par type et par domaine', () => {
    expect(index.search('material').some((h) => h.entry.id === 'a')).toBe(true)
    expect(index.search('construction').some((h) => h.entry.id === 'a')).toBe(true)
  })

  it('le match sur le terme prime sur le match sur related/tag', () => {
    // « poutre » : exact sur l'entrée c (term), related sur l'entrée b.
    const hits = index.search('poutre')
    expect(hits[0]?.entry.id).toBe('c')
  })

  it('respecte limit, filtre domain et type', () => {
    expect(index.search('e', { limit: 1 })).toHaveLength(1)
    const onlyMaterial = index.search('e', { type: 'material' })
    expect(onlyMaterial.every((h) => h.entry.type === 'material')).toBe(true)
    const onlyArch = index.search('e', { domain: 'architecture' })
    expect(onlyArch.every((h) => h.entry.domain === 'architecture')).toBe(true)
  })
})
