import { describe, expect, it } from 'vitest'
import { applyDedupPlan, type DedupResolution } from './dedup-resolve'
import { findDuplicates } from './dedup'
import { normalizeKnowledgeEntry, type KnowledgeEntry } from './model'

function entry(id: string, slug: string, term: string, domain = 'architecture'): KnowledgeEntry {
  return normalizeKnowledgeEntry({
    id, slug, term, language: 'fr', type: 'concept', domain,
    shortDefinition: 'def', longDefinition: 'définition longue et substantielle présente ici pour validité.',
    examples: ['e'], synonyms: [], relatedTerms: ['r'], tags: ['t'],
    sources: [{ label: 'Base Forma', type: 'internal' }], confidence: 'concept',
    createdAt: '2026-06-20', updatedAt: '2026-06-20',
  })
}

describe('applyDedupPlan — distinguish', () => {
  it('désambiguïse un slug partagé (homographes) → unicité rétablie', () => {
    const base = [entry('arc-usage', 'usage', 'usage'), entry('gen-usage', 'usage', 'usage', 'études')]
    expect(findDuplicates(base).exact.some((d) => d.reason === 'same-slug')).toBe(true)
    const plan: DedupResolution[] = [{ action: 'distinguish', id: 'gen-usage', slug: 'usage-etudes' }]
    const out = applyDedupPlan(base, plan)
    expect(out.base.find((e) => e.id === 'gen-usage')!.slug).toBe('usage-etudes')
    expect(findDuplicates(out.base).exact.some((d) => d.reason === 'same-slug')).toBe(false)
    expect(out.distinguished).toHaveLength(1)
  })
})

describe('applyDedupPlan — merge', () => {
  it('retire explicitement les doublons vrais au profit du gardé', () => {
    const base = [entry('gen-composant', 'composant', 'composant', 'études'), entry('gen-composant-2', 'composant', 'composant', 'études')]
    const plan: DedupResolution[] = [{ action: 'merge', keep: 'gen-composant', drop: ['gen-composant-2'], reason: 'vrai doublon' }]
    const out = applyDedupPlan(base, plan)
    expect(out.base.map((e) => e.id)).toEqual(['gen-composant'])
    expect(out.merged[0].dropped).toEqual(['gen-composant-2'])
  })

  it('ne supprime rien si l’id gardé est absent', () => {
    const base = [entry('a', 'a', 'a')]
    const out = applyDedupPlan(base, [{ action: 'merge', keep: 'absent', drop: ['a'] }])
    expect(out.base.map((e) => e.id)).toEqual(['a'])
    expect(out.missing).toContain('absent')
  })

  it('rapporte les ids manquants sans planter', () => {
    const base = [entry('a', 'a', 'a')]
    const out = applyDedupPlan(base, [{ action: 'distinguish', id: 'zzz', slug: 'z' }])
    expect(out.missing).toContain('zzz')
    expect(out.base).toHaveLength(1)
  })
})
