/**
 * Service knowledge-study — persistance du matériel d'étude créé depuis une
 * fiche Knowledge (Sprint #6, Lane C).
 *
 * Orchestration mince : la logique de mapping est PURE
 * (src/lib/study/knowledge-study.ts) ; ici on ne fait que persister via le
 * service existant `createFlashcard` (services/flashcards.ts). Aucune table
 * Dexie nouvelle (réutilise `flashcards`).
 */
import { flashcardFromKnowledge, type KnowledgeEntry } from '../lib/study/knowledge-study'
import { createFlashcard } from './flashcards'
import type { Flashcard } from '../types'

/**
 * Crée et persiste une flashcard à partir d'une fiche Knowledge via le service
 * flashcards existant. Renvoie la carte créée, ou `null` si la fiche n'est pas
 * exploitable (terme/définition vides). `subjectId` optionnel.
 */
export async function createFlashcardFromKnowledge(
  entry: KnowledgeEntry,
  opts: { subjectId?: string } = {},
): Promise<Flashcard | null> {
  const input = flashcardFromKnowledge(entry, opts)
  if (!input) return null
  return createFlashcard(input)
}
