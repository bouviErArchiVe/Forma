/**
 * Tests des helpers Knowledge → Study (logique pure, déterministe).
 */
import { describe, expect, it } from 'vitest'
import {
  examQuestionFromKnowledge,
  flashcardFromKnowledge,
  tagsFromKnowledge,
  type KnowledgeEntry,
} from './knowledge-study'

function entry(p: Partial<KnowledgeEntry> = {}): KnowledgeEntry {
  return {
    term: 'Poutre',
    domain: 'Structure',
    definition: 'Élément structural horizontal travaillant en flexion.',
    source: 'glossaire-local',
    confidence: 0.9,
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
    const tags = tagsFromKnowledge(entry({ synonyms: ['', '   '], source: '' }))
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
    const input = flashcardFromKnowledge(entry({ term: '  Dalle  ', definition: '  Plancher.  ' }))
    expect(input!.front).toBe('Dalle')
    expect(input!.back).toBe('Plancher.')
  })

  it('renvoie null si terme ou définition vide', () => {
    expect(flashcardFromKnowledge(entry({ term: '   ' }))).toBeNull()
    expect(flashcardFromKnowledge(entry({ definition: '' }))).toBeNull()
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

  it('porte la source et la confidence dans les notes (traçabilité)', () => {
    const q = examQuestionFromKnowledge(entry({ source: 'wiki-extract', confidence: 0.42 }), {
      idFn: () => 'q-2',
    })
    expect(q!.notes).toContain('source: wiki-extract')
    expect(q!.notes).toContain('confiance: 0.42')
  })

  it('borne la confidence hors [0,1] et tolère NaN', () => {
    expect(examQuestionFromKnowledge(entry({ confidence: 5 }), { idFn: () => 'a' })!.notes).toContain(
      'confiance: 1.00',
    )
    expect(
      examQuestionFromKnowledge(entry({ confidence: -2 }), { idFn: () => 'b' })!.notes,
    ).toContain('confiance: 0.00')
    expect(
      examQuestionFromKnowledge(entry({ confidence: Number.NaN }), { idFn: () => 'c' })!.notes,
    ).toContain('confiance: 0.00')
  })

  it('respecte points custom et renvoie null si vide', () => {
    expect(examQuestionFromKnowledge(entry(), { points: 3, idFn: () => 'd' })!.points).toBe(3)
    expect(examQuestionFromKnowledge(entry({ term: '' }))).toBeNull()
  })
})
