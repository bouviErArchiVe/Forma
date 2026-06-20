import { describe, expect, it } from 'vitest'
import smokePack from '../../data/knowledge/test-packs/sprint9-smoke.json'
import { importPack } from './import-pack'
import { normalizeKnowledgeEntry, type KnowledgeEntry } from './model'

// Base existante minimale reproduisant les entrées que le pack test doit
// détecter comme doublons (même slug « acier », même terme « Aldo Rossi »).
const existing: KnowledgeEntry[] = [
  normalizeKnowledgeEntry({
    id: 'mat-acier', slug: 'acier', term: 'acier', language: 'fr', type: 'material',
    domain: 'construction', shortDefinition: 'Alliage fer-carbone.', longDefinition: 'Acier de construction, long texte présent ici pour la validité.',
    examples: ['poutre acier'], synonyms: [], relatedTerms: [], tags: [],
    sources: [{ label: 'Base Forma', type: 'internal' }], confidence: 'concept',
    createdAt: '2026-06-20', updatedAt: '2026-06-20',
  }),
  normalizeKnowledgeEntry({
    id: 'per-aldo-rossi', slug: 'aldo-rossi', term: 'Aldo Rossi', language: 'fr', type: 'person',
    domain: 'architecture', shortDefinition: 'Architecte italien.', longDefinition: 'Figure du mouvement, long texte présent ici pour la validité.',
    examples: ['œuvre'], synonyms: [], relatedTerms: [], tags: [],
    sources: [{ label: 'Base Forma', type: 'internal' }], confidence: 'à-vérifier',
    createdAt: '2026-06-20', updatedAt: '2026-06-20',
  }),
]

describe('importPack (pack test Sprint #9)', () => {
  const report = importPack(smokePack as unknown[], existing)

  it('rejette les entrées invalides (sans source, slug mal formé, type illégal)', () => {
    const ids = report.rejected.map((r) => r.id)
    expect(ids).toEqual(expect.arrayContaining(['tst-invalid-nosource', 'tst-invalid-slug', 'tst-invalid-type']))
    expect(report.summary.rejected).toBe(3)
  })

  it('détecte les doublons contre la base (slug acier + terme Aldo Rossi)', () => {
    const dupIds = report.duplicatesAgainstBase.map((d) => d.id)
    expect(dupIds).toEqual(expect.arrayContaining(['tst-dup-slug-acier', 'tst-dup-term-rossi']))
    expect(report.duplicatesAgainstBase.find((d) => d.id === 'tst-dup-slug-acier')?.reason).toBe('same-slug')
    expect(report.duplicatesAgainstBase.find((d) => d.id === 'tst-dup-term-rossi')?.reason).toBe('same-term')
  })

  it('accepte les nouvelles entrées valides et non-doublons', () => {
    const accIds = report.accepted.map((a) => a.entry.id)
    expect(accIds).toEqual(expect.arrayContaining([
      'tst-claveau', 'tst-encorbellement', 'tst-ext-norme', 'tst-generated-demo', 'tst-templated-weak',
    ]))
    expect(report.summary.accepted).toBe(5)
  })

  it('classe la provenance (forma / external / generated)', () => {
    expect(report.summary.byProvenance.forma).toBe(3) // claveau, encorbellement (course) + parement (internal)
    expect(report.summary.byProvenance.external).toBe(1) // garde-corps (standard)
    expect(report.summary.byProvenance.generated).toBe(1) // lambourde (marquée)
  })

  it('marque l’entrée gabarit comme faible (templated)', () => {
    const parement = report.accepted.find((a) => a.entry.id === 'tst-templated-weak')
    expect(parement?.quality.flags).toContain('templated')
    expect(parement?.quality.status).not.toBe('ok')
    expect(report.summary.weak).toBeGreaterThanOrEqual(1)
  })

  it('ne mute pas la base existante', () => {
    expect(existing).toHaveLength(2)
  })
})
