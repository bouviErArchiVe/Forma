import { db } from '../db'
import { createId } from '../lib/id'
import type { StudyCard } from '../types'

export async function getCards(notebookId: string): Promise<StudyCard[]> {
  return db.studyCards.where('notebookId').equals(notebookId).toArray()
}

export async function addCard(
  notebookId: string,
  front: string,
  back: string,
): Promise<StudyCard> {
  const card: StudyCard = {
    id: createId(),
    notebookId,
    front,
    back,
    mastery: 0,
    nextReview: Date.now(),
    createdAt: Date.now(),
  }
  await db.studyCards.add(card)
  return card
}

export async function updateCard(id: string, patch: Partial<StudyCard>): Promise<void> {
  await db.studyCards.update(id, patch)
}

export async function deleteCard(id: string): Promise<void> {
  await db.studyCards.delete(id)
}

export async function getDueCards(notebookId: string): Promise<StudyCard[]> {
  const now = Date.now()
  const cards = await getCards(notebookId)
  return cards.filter((c) => c.nextReview <= now)
}

export function rateCard(card: StudyCard, quality: 0 | 1 | 2 | 3): StudyCard {
  const intervals = [1, 3, 7, 14]
  const mastery = Math.max(0, Math.min(3, quality === 0 ? 0 : card.mastery + 1))
  const days = intervals[mastery] ?? 14
  return {
    ...card,
    mastery,
    nextReview: Date.now() + days * 24 * 60 * 60 * 1000,
  }
}
