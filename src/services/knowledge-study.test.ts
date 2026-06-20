/**
 * Tests service knowledge-study : persistance d'une flashcard issue d'une fiche
 * Knowledge via le service flashcards existant (table Dexie `flashcards`).
 */
import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db'
import { createFlashcardFromKnowledge } from './knowledge-study'
import { listFlashcards } from './flashcards'
import type { KnowledgeEntry } from '../lib/study/knowledge-study'

function entry(p: Partial<KnowledgeEntry> = {}): KnowledgeEntry {
  return {
    term: 'Solive',
    domain: 'Charpente',
    definition: 'Pièce horizontale répétitive supportant un plancher.',
    source: 'glossaire-local',
    confidence: 0.8,
    ...p,
  }
}

beforeEach(async () => {
  await db.open()
  await db.flashcards.clear()
})

describe('createFlashcardFromKnowledge', () => {
  it('persiste une flashcard avec recto/verso et tags issus de la fiche', async () => {
    const card = await createFlashcardFromKnowledge(entry())
    expect(card).not.toBeNull()
    expect(card!.front).toBe('Solive')
    expect(card!.back).toBe('Pièce horizontale répétitive supportant un plancher.')
    expect(card!.tags).toContain('knowledge')
    expect(card!.tags).toContain('charpente')

    const all = await listFlashcards()
    expect(all).toHaveLength(1)
    expect(all[0]!.id).toBe(card!.id)
  })

  it('lie la matière quand subjectId fourni', async () => {
    const card = await createFlashcardFromKnowledge(entry(), { subjectId: 'subj-x' })
    expect(card!.subjectId).toBe('subj-x')
    expect(await listFlashcards({ subjectId: 'subj-x' })).toHaveLength(1)
  })

  it('ne persiste rien si la fiche est inexploitable', async () => {
    const card = await createFlashcardFromKnowledge(entry({ definition: '   ' }))
    expect(card).toBeNull()
    expect(await listFlashcards()).toHaveLength(0)
  })
})
