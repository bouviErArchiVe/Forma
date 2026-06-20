import { describe, expect, it } from 'vitest'
import { applyUpgradePack, mergePatch, type UpgradePatch } from './upgrade'
import { scoreQuality } from './quality'
import { normalizeKnowledgeEntry, type KnowledgeEntry } from './model'

/** Entrée « gabarit » faible (comme le seed pro). */
function weakEntry(id: string): KnowledgeEntry {
  return normalizeKnowledgeEntry({
    id, slug: id, term: id, language: 'fr', type: 'concept', domain: 'architecture',
    shortDefinition: `${id} est une notion utilisée en architecture pour décrire un élément du projet.`,
    longDefinition: `Dans Forma, l'entrée « ${id} » sert de repère de vocabulaire pour comprendre un document.`,
    examples: [], synonyms: [], relatedTerms: [],
    tags: ['x'], sources: [{ label: 'Base Forma', type: 'internal' }], confidence: 'concept',
    createdAt: '2026-06-20', updatedAt: '2026-06-20',
  })
}

const richPatch = (id: string): UpgradePatch => ({
  id,
  shortDefinition: 'Élément structurel horizontal qui reprend les charges en flexion.',
  longDefinition: 'La poutre franchit une portée entre deux appuis et transmet les charges verticales aux poteaux ou aux murs. Sa hauteur est dimensionnée selon la portée et la charge.',
  examples: ['Poutre en béton armé', 'Poutre lamellé-collé'],
  synonyms: ['sommier'],
  relatedTerms: ['poteau', 'portée', 'flexion'],
  tags: ['structure'],
  sources: [{ label: "Vocabulaire de structure (cours Forma)", type: 'course' }],
  confidence: 'indicatif',
})

describe('mergePatch', () => {
  it('ne patche que les champs fournis et conserve la structure', () => {
    const base = weakEntry('a')
    const merged = mergePatch(base, { id: 'a', synonyms: ['z'] }, '2026-06-21')
    expect(merged.synonyms).toEqual(['z'])
    expect(merged.slug).toBe('a') // structure inchangée
    expect(merged.shortDefinition).toBe(base.shortDefinition)
    expect(merged.updatedAt).toBe('2026-06-21')
  })
})

describe('applyUpgradePack', () => {
  const base = [weakEntry('a'), weakEntry('b'), weakEntry('c')]

  it('fait passer une entrée faible (gabarit) à ok', () => {
    expect(scoreQuality(base[0]).status).not.toBe('ok')
    const r = applyUpgradePack(base, [richPatch('a')])
    const upgraded = r.base.find((e) => e.id === 'a')!
    expect(scoreQuality(upgraded).status).toBe('ok')
    expect(r.improvedToOk).toBe(1)
    expect(r.summaryAfter.ok).toBe(1)
    expect(r.summaryBefore.ok).toBe(0)
  })

  it('signale les id inconnus sans les appliquer', () => {
    const r = applyUpgradePack(base, [richPatch('zzz')])
    expect(r.unknownIds).toEqual(['zzz'])
    expect(r.applied).toEqual([])
  })

  it('ignore un patch qui rendrait l’entrée invalide (source vidée)', () => {
    const r = applyUpgradePack(base, [{ id: 'a', sources: [] }])
    expect(r.invalid.map((i) => i.id)).toEqual(['a'])
    expect(r.applied).toEqual([])
    // base inchangée pour 'a'
    expect(r.base.find((e) => e.id === 'a')!.sources.length).toBeGreaterThan(0)
  })

  it('préserve l’ordre et ne mute pas la base d’origine', () => {
    const r = applyUpgradePack(base, [richPatch('b')])
    expect(r.base.map((e) => e.id)).toEqual(['a', 'b', 'c'])
    expect(base[1].examples).toEqual([]) // original intact
  })
})
