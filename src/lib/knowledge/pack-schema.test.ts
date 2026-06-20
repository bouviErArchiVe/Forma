import { describe, expect, it } from 'vitest'
import { validatePackEntry, validatePack } from './pack-schema'
import type { KnowledgeEntry } from './model'

function valid(p: Partial<KnowledgeEntry> = {}): Record<string, unknown> {
  return {
    id: 'arc-poutre',
    slug: 'poutre',
    term: 'poutre',
    language: 'fr',
    type: 'concept',
    domain: 'architecture',
    subdomain: 'structure',
    shortDefinition: 'Élément structurel horizontal.',
    longDefinition: 'Une poutre reprend les charges en flexion entre appuis.',
    examples: ['Poutre en béton armé'],
    synonyms: ['sommier'],
    relatedTerms: ['linteau'],
    tags: ['structure'],
    sources: [{ label: 'Base Forma', type: 'internal' }],
    confidence: 'concept',
    createdAt: '2026-06-20',
    updatedAt: '2026-06-20',
    ...p,
  }
}

describe('validatePackEntry', () => {
  it('accepte une entrée bien formée', () => {
    const r = validatePackEntry(valid(), 0)
    expect(r.ok).toBe(true)
    expect(r.errors).toEqual([])
  })

  it('rejette sans source (anti-hallucination)', () => {
    const r = validatePackEntry(valid({ sources: [] as never }), 0)
    expect(r.ok).toBe(false)
    expect(r.errors.some((e) => e.field === 'sources')).toBe(true)
  })

  it('rejette sans confidence', () => {
    const r = validatePackEntry(valid({ confidence: undefined as never }), 0)
    expect(r.errors.some((e) => e.field === 'confidence')).toBe(true)
  })

  it('rejette un type illégal', () => {
    const r = validatePackEntry(valid({ type: 'banana' as never }), 0)
    expect(r.errors.some((e) => e.field === 'type')).toBe(true)
  })

  it('rejette un slug mal formé', () => {
    expect(validatePackEntry(valid({ slug: 'Pas Bon' }), 0).errors.some((e) => e.field === 'slug')).toBe(true)
    expect(validatePackEntry(valid({ slug: 'MAJ' }), 0).errors.some((e) => e.field === 'slug')).toBe(true)
  })

  it('rejette une source sans label ou de type illégal', () => {
    const r1 = validatePackEntry(valid({ sources: [{ label: '', type: 'internal' }] as never }), 0)
    expect(r1.errors.some((e) => e.field.startsWith('sources['))).toBe(true)
    const r2 = validatePackEntry(valid({ sources: [{ label: 'X', type: 'wiki' }] as never }), 0)
    expect(r2.errors.some((e) => e.field.includes('.type'))).toBe(true)
  })

  it('rejette un tableau optionnel mal typé', () => {
    const r = validatePackEntry(valid({ synonyms: [1, 2] as never }), 0)
    expect(r.errors.some((e) => e.field === 'synonyms')).toBe(true)
  })

  it('rejette une provenance illégale mais accepte une légale', () => {
    expect(validatePackEntry({ ...valid(), provenance: 'martian' }, 0).errors.some((e) => e.field === 'provenance')).toBe(true)
    expect(validatePackEntry({ ...valid(), provenance: 'external' }, 0).ok).toBe(true)
  })

  it('warning (non bloquant) si language ou createdAt absents', () => {
    const r = validatePackEntry(valid({ language: undefined as never, createdAt: undefined as never }), 0)
    expect(r.ok).toBe(true)
    expect(r.warnings.length).toBeGreaterThan(0)
  })
})

describe('validatePack', () => {
  it('détecte les collisions internes d id et de slug', () => {
    const rep = validatePack([valid(), valid(), valid({ slug: 'autre' })])
    expect(rep.duplicateIds).toContain('arc-poutre')
    expect(rep.duplicateSlugs).toContain('poutre')
    expect(rep.ok).toBe(false)
  })

  it('un pack propre est ok', () => {
    const rep = validatePack([valid(), valid({ id: 'arc-mur', slug: 'mur', term: 'mur' })])
    expect(rep.ok).toBe(true)
    expect(rep.okCount).toBe(2)
  })
})
