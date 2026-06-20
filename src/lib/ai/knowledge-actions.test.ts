/**
 * Tests des actions FormAI ancrées sur des fiches de connaissance.
 *
 * Couvre :
 *   • Ancrage des builders : source + confiance toujours injectées, consigne
 *     « uniquement à partir de la/les fiche(s) fournie(s) », anti-invention.
 *   • `compare` exige deux fiches (builder ET orchestration).
 *   • Routage d'action (buildKnowledgePrompt) vers le bon prompt.
 *   • Orchestration locale honnête (provider local par défaut, aucune invention,
 *     fiches utilisées renvoyées avec source + confiance).
 */
import { describe, expect, it } from 'vitest'
import {
  KNOWLEDGE_AI_DISCLAIMER,
  TWO_ENTRY_ACTIONS,
  buildCompareEntriesPrompt,
  buildExplainEntryPrompt,
  buildKnowledgePrompt,
  buildQuizFromEntryPrompt,
  buildSummarizeEntryPrompt,
  confidenceLabel,
  renderEntryBlock,
  requiresTwoEntries,
  runKnowledgeAction,
  type KnowledgeActionKind,
} from './knowledge-actions'
import { KNOWLEDGE_CONFIDENCE_LABEL, type KnowledgeEntry } from '../knowledge'

const ARCH_SOURCE = 'Base intégrée — Glossaire d’architecture Forma'

function makeEntry(partial: Partial<KnowledgeEntry> = {}): KnowledgeEntry {
  return {
    id: 'architecture:linteau',
    slug: 'linteau',
    term: 'Linteau',
    language: 'fr',
    type: 'concept',
    domain: 'architecture',
    shortDefinition: 'Élément horizontal porteur au-dessus d’une ouverture.',
    longDefinition: 'Élément horizontal porteur au-dessus d’une ouverture.',
    examples: [],
    synonyms: [],
    relatedTerms: [],
    tags: ['structure', 'ouverture'],
    sources: [{ label: ARCH_SOURCE, type: 'internal' }],
    confidence: 'indicatif',
    createdAt: '2026-06-20',
    updatedAt: '2026-06-20',
    ...partial,
  }
}

const ALL_KINDS: KnowledgeActionKind[] = ['explain', 'compare', 'summarize', 'quiz']

describe('confidenceLabel / requiresTwoEntries', () => {
  it('mappe le niveau de confiance sur son libellé humain', () => {
    expect(confidenceLabel(makeEntry({ confidence: 'indicatif' }))).toBe(
      KNOWLEDGE_CONFIDENCE_LABEL.indicatif,
    )
    expect(confidenceLabel(makeEntry({ confidence: 'à-vérifier' }))).toBe(
      KNOWLEDGE_CONFIDENCE_LABEL['à-vérifier'],
    )
  })

  it('marque uniquement « comparer » comme action à deux fiches', () => {
    expect(requiresTwoEntries('compare')).toBe(true)
    expect(requiresTwoEntries('explain')).toBe(false)
    expect(requiresTwoEntries('summarize')).toBe(false)
    expect(requiresTwoEntries('quiz')).toBe(false)
    expect(TWO_ENTRY_ACTIONS).toEqual(['compare'])
  })
})

describe('renderEntryBlock — source + confiance toujours présentes', () => {
  it('inclut terme, définition, source et confiance', () => {
    const block = renderEntryBlock(makeEntry())
    expect(block).toContain('Linteau')
    expect(block).toContain('Élément horizontal porteur')
    expect(block).toContain('Source : Base intégrée — Glossaire d’architecture Forma')
    expect(block).toContain(`Niveau de confiance : ${KNOWLEDGE_CONFIDENCE_LABEL.indicatif}`)
  })

  it('numérote la fiche quand un index est fourni', () => {
    expect(renderEntryBlock(makeEntry(), 1)).toContain('Fiche 1')
    expect(renderEntryBlock(makeEntry(), 2)).toContain('Fiche 2')
  })
})

describe('builders — ancrage strict (grounding)', () => {
  const grounded = [
    ['explain', buildExplainEntryPrompt(makeEntry())],
    ['summarize', buildSummarizeEntryPrompt(makeEntry())],
    ['quiz', buildQuizFromEntryPrompt(makeEntry())],
  ] as const

  it.each(grounded)('%s : exige « uniquement à partir de la/les fiche(s) fournie(s) »', (_k, prompt) => {
    const blob = `${prompt.system}\n${prompt.user}`.toLowerCase()
    expect(blob).toContain('uniquement')
    expect(blob).toContain('fiche')
  })

  it.each(grounded)('%s : interdit explicitement l’invention (anti-hallucination)', (_k, prompt) => {
    expect(prompt.system.toLowerCase()).toContain('n’ajoute aucune')
  })

  it.each(grounded)('%s : injecte la source et la confiance de la fiche dans le user prompt', (_k, prompt) => {
    expect(prompt.user).toContain('Source :')
    expect(prompt.user).toContain(`Niveau de confiance : ${KNOWLEDGE_CONFIDENCE_LABEL.indicatif}`)
  })

  it('compare : injecte les DEUX fiches sourcées et leur ancrage', () => {
    const a = makeEntry({ id: 'a', term: 'Linteau' })
    const b = makeEntry({ id: 'b', term: 'Poutre', confidence: 'concept' })
    const prompt = buildCompareEntriesPrompt(a, b)
    expect(prompt.user).toContain('Fiche 1')
    expect(prompt.user).toContain('Fiche 2')
    expect(prompt.user).toContain('Linteau')
    expect(prompt.user).toContain('Poutre')
    expect(prompt.user).toContain(`Niveau de confiance : ${KNOWLEDGE_CONFIDENCE_LABEL.concept}`)
    expect(prompt.system.toLowerCase()).toContain('uniquement')
  })
})

describe('buildKnowledgePrompt — routage d’action', () => {
  it('route chaque genre vers un prompt non vide', () => {
    for (const kind of ALL_KINDS) {
      const entries = kind === 'compare'
        ? [makeEntry({ id: 'a' }), makeEntry({ id: 'b', term: 'Poutre' })]
        : [makeEntry()]
      const prompt = buildKnowledgePrompt(kind, entries)
      expect(prompt.system.length).toBeGreaterThan(0)
      expect(prompt.user.length).toBeGreaterThan(0)
    }
  })

  it('explain/summarize/quiz n’utilisent que la première fiche', () => {
    const first = makeEntry({ id: 'a', term: 'Linteau' })
    const second = makeEntry({ id: 'b', term: 'IgnoréDansSolo' })
    for (const kind of ['explain', 'summarize', 'quiz'] as KnowledgeActionKind[]) {
      const prompt = buildKnowledgePrompt(kind, [first, second])
      expect(prompt.user).toContain('Linteau')
      expect(prompt.user).not.toContain('IgnoréDansSolo')
    }
  })

  it('compare exige deux fiches : lève une erreur avec une seule', () => {
    expect(() => buildKnowledgePrompt('compare', [makeEntry()])).toThrow(/deux fiches/i)
  })

  it('lève une erreur si aucune fiche n’est fournie', () => {
    expect(() => buildKnowledgePrompt('explain', [])).toThrow(/au moins une fiche/i)
  })
})

describe('runKnowledgeAction — orchestration locale honnête', () => {
  it('produit une réponse locale sans cloud et renvoie la fiche sourcée', async () => {
    const entry = makeEntry()
    const res = await runKnowledgeAction({ kind: 'explain', entries: [entry] })
    expect(res.text.length).toBeGreaterThan(0)
    expect(res.fromCloud).toBe(false)
    expect(res.entries).toHaveLength(1)
    expect(res.entries[0].sources[0].label).toBe(entry.sources[0].label)
    expect(res.entries[0].confidence).toBe(entry.confidence)
  })

  it('compare sans seconde fiche : erreur portée « needs-two-entries », pas de throw', async () => {
    const res = await runKnowledgeAction({ kind: 'compare', entries: [makeEntry()] })
    expect(res.error).toBe('needs-two-entries')
    expect(res.fromCloud).toBe(false)
    expect(res.text.toLowerCase()).toContain('deux fiches')
  })

  it('compare avec deux fiches : succès, deux fiches renvoyées', async () => {
    const a = makeEntry({ id: 'a', term: 'Linteau' })
    const b = makeEntry({ id: 'b', term: 'Poutre' })
    const res = await runKnowledgeAction({ kind: 'compare', entries: [a, b] })
    expect(res.entries).toHaveLength(2)
    expect(res.error).toBeUndefined()
  })

  it('aucune fiche : erreur portée « no-entry », pas de throw', async () => {
    const res = await runKnowledgeAction({ kind: 'explain', entries: [] })
    expect(res.error).toBe('no-entry')
    expect(res.entries).toHaveLength(0)
  })
})

describe('disclaimer', () => {
  it('mentionne l’ancrage « uniquement à partir de la/les fiche(s) fournie(s) »', () => {
    expect(KNOWLEDGE_AI_DISCLAIMER.toLowerCase()).toContain('uniquement à partir de la/les fiche')
  })
})
