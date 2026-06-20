/**
 * Tests des helpers Knowledge → Study (logique pure, déterministe).
 */
import { describe, expect, it } from 'vitest'
import {
  examQuestionFromKnowledge,
  flashcardFromKnowledge,
  tagsFromKnowledge,
} from './knowledge-study'
import { KNOWLEDGE_CONFIDENCE_LABEL, type KnowledgeEntry } from '../knowledge'

function entry(p: Partial<KnowledgeEntry> = {}): KnowledgeEntry {
  return {
    id: 'structure:poutre',
    slug: 'poutre',
    term: 'Poutre',
    language: 'fr',
    type: 'concept',
    domain: 'Structure',
    shortDefinition: 'Élément structural horizontal travaillant en flexion.',
    longDefinition: 'Élément structural horizontal travaillant en flexion.',
    examples: [],
    synonyms: [],
    relatedTerms: [],
    tags: [],
    sources: [{ label: 'glossaire-local', type: 'internal' }],
    confidence: 'indicatif',
    createdAt: '2026-06-20',
    updatedAt: '2026-06-20',
    ...p,
  }
}

describe('tagsFromKnowledge', () => {
  it('inclut knowledge, le domaine, la source préfixée et les synonymes (normalisés, dédupliqués)', () => {
    const tags = tagsFromKnowledge(entry({ synonyms: ['Sommier', 'sommier', '  Poutre maîtresse '] }))
    expect(tags).toContain('knowledge')
    expect(tags).toContain('structure')
    expect(tags).toContain('source:glossaire-local')
    expect(tags).toContain('sommier')
    expect(tags).toContain('poutre maîtresse')
    // déduplication (sommier x2 → 1 seule occurrence)
    expect(tags.filter((t) => t === 'sommier')).toHaveLength(1)
  })

  it('ignore les valeurs vides', () => {
    const tags = tagsFromKnowledge(entry({ synonyms: ['', '   '], sources: [{ label: '', type: 'internal' }] }))
    expect(tags).toEqual(['knowledge', 'structure'])
  })
})

describe('flashcardFromKnowledge', () => {
  it('mappe terme→recto, définition→verso et porte les tags', () => {
    const input = flashcardFromKnowledge(entry())
    expect(input).not.toBeNull()
    expect(input!.front).toBe('Poutre')
    expect(input!.back).toBe('Élément structural horizontal travaillant en flexion.')
    expect(input!.tags).toContain('knowledge')
    expect(input!.tags).toContain('structure')
    expect(input!.subjectId).toBeUndefined()
  })

  it('lie la matière si subjectId fourni', () => {
    const input = flashcardFromKnowledge(entry(), { subjectId: 'subj-1' })
    expect(input!.subjectId).toBe('subj-1')
  })

  it('trim le recto/verso', () => {
    const input = flashcardFromKnowledge(
      entry({ term: '  Dalle  ', shortDefinition: '  Plancher.  ', longDefinition: '  Plancher.  ' }),
    )
    expect(input!.front).toBe('Dalle')
    expect(input!.back).toBe('Plancher.')
  })

  it('renvoie null si terme ou définition vide', () => {
    expect(flashcardFromKnowledge(entry({ term: '   ' }))).toBeNull()
    expect(flashcardFromKnowledge(entry({ shortDefinition: '', longDefinition: '' }))).toBeNull()
  })
})

describe('examQuestionFromKnowledge', () => {
  it('crée une question short terme→définition, source flashcard, id déterministe via idFn', () => {
    const q = examQuestionFromKnowledge(entry(), { idFn: () => 'q-1' })
    expect(q).not.toBeNull()
    expect(q!.id).toBe('q-1')
    expect(q!.type).toBe('short')
    expect(q!.question).toBe('Poutre')
    expect(q!.answer).toBe('Élément structural horizontal travaillant en flexion.')
    expect(q!.points).toBe(1)
    expect(q!.source).toBe('flashcard')
  })

  it('porte la source et le libellé de confiance dans les notes (traçabilité)', () => {
    const q = examQuestionFromKnowledge(
      entry({ sources: [{ label: 'wiki-extract', type: 'web' }], confidence: 'à-vérifier' }),
      { idFn: () => 'q-2' },
    )
    expect(q!.notes).toContain('source: wiki-extract')
    expect(q!.notes).toContain(`confiance: ${KNOWLEDGE_CONFIDENCE_LABEL['à-vérifier']}`)
  })

  it('indique « inconnue » quand la source est vide', () => {
    const q = examQuestionFromKnowledge(
      entry({ sources: [{ label: '', type: 'internal' }] }),
      { idFn: () => 'a' },
    )
    expect(q!.notes).toContain('source: inconnue')
  })

  it('respecte points custom et renvoie null si vide', () => {
    expect(examQuestionFromKnowledge(entry(), { points: 3, idFn: () => 'd' })!.points).toBe(3)
    expect(examQuestionFromKnowledge(entry({ term: '' }))).toBeNull()
  })
})
