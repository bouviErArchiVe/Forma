import { describe, expect, it } from 'vitest'
import { buildQualityReport } from './quality-report'
import type { KnowledgeEntry } from './model'

function entry(p: Partial<KnowledgeEntry> & { id: string }): KnowledgeEntry {
  return {
    slug: p.slug ?? p.id, term: p.term ?? p.id, language: 'fr', type: p.type ?? 'concept',
    domain: p.domain ?? 'architecture', shortDefinition: p.shortDefinition ?? 's',
    longDefinition: p.longDefinition ?? 'long définition substantielle bien remplie ici présente.',
    examples: p.examples ?? ['e'], synonyms: p.synonyms ?? ['y'], relatedTerms: p.relatedTerms ?? ['r'], tags: ['t'],
    sources: p.sources ?? [{ label: 'Base Forma', type: 'internal' }], confidence: p.confidence ?? 'concept',
    createdAt: '2026-06-20', updatedAt: '2026-06-20', ...p,
  }
}

describe('buildQualityReport', () => {
  const entries: KnowledgeEntry[] = [
    entry({ id: 'a', slug: 'poutre', term: 'poutre', domain: 'architecture', type: 'concept' }),
    entry({ id: 'b', term: 'acier', domain: 'construction', type: 'material',
      shortDefinition: 'acier est une notion utilisée en construction', confidence: 'à-vérifier',
      sources: [{ label: 'Norme X', type: 'standard' }] }),
    entry({ id: 'c', slug: 'poutre', term: 'poutre-2', domain: 'architecture' }), // doublon slug
  ]

  it('agrège totaux, statuts et provenance dérivée', () => {
    const r = buildQualityReport(entries)
    expect(r.total).toBe(3)
    expect(r.byStatus.ok + r.byStatus.weak + r.byStatus.review).toBe(3)
    // a,c → internal → forma ; b → standard → external
    expect(r.byProvenance.forma).toBe(2)
    expect(r.byProvenance.external).toBe(1)
  })

  it('compte les doublons (slug)', () => {
    const r = buildQualityReport(entries)
    expect(r.duplicates.exact).toBeGreaterThanOrEqual(1)
    expect(r.duplicates.involved).toBeGreaterThanOrEqual(2)
  })

  it('ventile par domaine/type/confidence', () => {
    const r = buildQualityReport(entries)
    expect(r.byDomain.architecture.total).toBe(2)
    expect(r.byType.material).toBe(1)
    expect(r.byConfidence['à-vérifier']).toBe(1)
  })

  it('échantillon faible trié par score croissant et borné', () => {
    const r = buildQualityReport(entries, { weakSampleSize: 1 })
    expect(r.weakSamples.length).toBeLessThanOrEqual(1)
    expect(r.weakSamples.every((s) => s.status !== 'ok')).toBe(true)
  })
})
