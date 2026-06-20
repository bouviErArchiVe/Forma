import { describe, expect, it } from 'vitest'
import {
  applyFilter,
  distinctDomains,
  distinctTypes,
  isFilterEmpty,
  paginate,
  resolveTerm,
  sortEntries,
  DICTIONARY_PAGE_SIZE,
} from './dictionary-filters'
import type { KnowledgeEntry } from './knowledge'

function entry(p: Partial<KnowledgeEntry> & { id: string; term: string }): KnowledgeEntry {
  return {
    slug: p.slug ?? p.id,
    language: 'fr',
    type: p.type ?? 'concept',
    domain: p.domain ?? 'architecture',
    subdomain: p.subdomain ?? '',
    shortDefinition: p.shortDefinition ?? `${p.term} (court)`,
    longDefinition: p.longDefinition ?? `${p.term} (long)`,
    examples: p.examples ?? [],
    synonyms: p.synonyms ?? [],
    relatedTerms: p.relatedTerms ?? [],
    tags: p.tags ?? [],
    sources: p.sources ?? [{ label: 'Base Forma', type: 'internal' }],
    confidence: p.confidence ?? 'concept',
    createdAt: '2026-06-20',
    updatedAt: '2026-06-20',
    ...p,
  }
}

const SAMPLE: KnowledgeEntry[] = [
  entry({ id: 'beton', term: 'béton', type: 'material', domain: 'construction', confidence: 'concept', synonyms: ['ciment armé'] }),
  entry({ id: 'acier', term: 'acier', type: 'material', domain: 'construction', confidence: 'indicatif' }),
  entry({ id: 'rossi', term: 'Aldo Rossi', type: 'person', domain: 'architecture', confidence: 'à-vérifier', relatedTerms: ['architecte'] }),
  entry({ id: 'arche', term: 'arche', type: 'concept', domain: 'architecture', confidence: 'concept' }),
]

describe('isFilterEmpty', () => {
  it('vrai sans filtre, faux dès qu un champ est posé', () => {
    expect(isFilterEmpty({})).toBe(true)
    expect(isFilterEmpty({ type: 'material' })).toBe(false)
    expect(isFilterEmpty({ favoritesOnly: true })).toBe(false)
  })
})

describe('applyFilter', () => {
  it('filtre par type', () => {
    expect(applyFilter(SAMPLE, { type: 'material' }).map((e) => e.id)).toEqual(['beton', 'acier'])
  })
  it('filtre par domaine', () => {
    expect(applyFilter(SAMPLE, { domain: 'architecture' }).map((e) => e.id)).toEqual(['rossi', 'arche'])
  })
  it('filtre par confiance', () => {
    expect(applyFilter(SAMPLE, { confidence: 'à-vérifier' }).map((e) => e.id)).toEqual(['rossi'])
  })
  it('combine les filtres en ET', () => {
    expect(applyFilter(SAMPLE, { type: 'material', confidence: 'indicatif' }).map((e) => e.id)).toEqual(['acier'])
  })
  it('favoritesOnly / recentsOnly utilisent les ensembles fournis', () => {
    const favs = new Set(['acier'])
    const recents = new Set(['arche'])
    expect(applyFilter(SAMPLE, { favoritesOnly: true }, favs, recents).map((e) => e.id)).toEqual(['acier'])
    expect(applyFilter(SAMPLE, { recentsOnly: true }, favs, recents).map((e) => e.id)).toEqual(['arche'])
    // Sans ensemble fourni → rien.
    expect(applyFilter(SAMPLE, { favoritesOnly: true })).toEqual([])
  })
})

describe('sortEntries', () => {
  it('term-asc / term-desc (locale fr)', () => {
    expect(sortEntries(SAMPLE, 'term-asc').map((e) => e.term)).toEqual(['acier', 'Aldo Rossi', 'arche', 'béton'])
    expect(sortEntries(SAMPLE, 'term-desc').map((e) => e.term)).toEqual(['béton', 'arche', 'Aldo Rossi', 'acier'])
  })
  it('confidence ordonne indicatif < concept < à-vérifier', () => {
    const ids = sortEntries(SAMPLE, 'confidence').map((e) => e.confidence)
    expect(ids[0]).toBe('indicatif')
    expect(ids[ids.length - 1]).toBe('à-vérifier')
  })
  it('relevance préserve l ordre d entrée (stable)', () => {
    expect(sortEntries(SAMPLE, 'relevance').map((e) => e.id)).toEqual(SAMPLE.map((e) => e.id))
  })
  it('ne mute pas l entrée d origine', () => {
    const before = SAMPLE.map((e) => e.id)
    sortEntries(SAMPLE, 'term-desc')
    expect(SAMPLE.map((e) => e.id)).toEqual(before)
  })
})

describe('paginate', () => {
  const items = Array.from({ length: 50 }, (_, i) => i)
  it('mode cumulatif renvoie tout jusqu à la page courante', () => {
    const p1 = paginate(items, 1, 10, true)
    expect(p1.items).toHaveLength(10)
    expect(p1.hasMore).toBe(true)
    expect(p1.pageCount).toBe(5)
    const p3 = paginate(items, 3, 10, true)
    expect(p3.items).toHaveLength(30)
  })
  it('borne la page hors limites', () => {
    expect(paginate(items, 99, 10, true).page).toBe(5)
    expect(paginate(items, 0, 10, true).page).toBe(1)
  })
  it('hasMore faux sur la dernière page', () => {
    expect(paginate(items, 5, 10, true).hasMore).toBe(false)
  })
  it('taille de page par défaut', () => {
    expect(paginate(items, 1).items).toHaveLength(Math.min(DICTIONARY_PAGE_SIZE, 50))
  })
})

describe('resolveTerm', () => {
  it('résout par slug, terme et synonyme (insensible accents/casse)', () => {
    expect(resolveTerm('beton', SAMPLE)?.id).toBe('beton')
    expect(resolveTerm('BÉTON', SAMPLE)?.id).toBe('beton')
    expect(resolveTerm('ciment armé', SAMPLE)?.id).toBe('beton')
  })
  it('renvoie undefined si rien ne correspond (pas de clic mort)', () => {
    expect(resolveTerm('inconnuxyz', SAMPLE)).toBeUndefined()
    expect(resolveTerm('', SAMPLE)).toBeUndefined()
  })
})

describe('distinctDomains / distinctTypes', () => {
  it('domaines distincts triés', () => {
    expect(distinctDomains(SAMPLE)).toEqual(['architecture', 'construction'])
  })
  it('types distincts dans l ordre canonique', () => {
    expect(distinctTypes(SAMPLE)).toEqual(['concept', 'material', 'person'])
  })
})
