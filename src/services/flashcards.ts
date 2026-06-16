/**
 * Service flashcards — CRUD Dexie (table `flashcards`) + flux de révision SRS.
 *
 * La logique de planification est PURE et vit dans src/lib/study/srs.ts ; ce
 * service ne fait que persister l'état renvoyé par `review()`. Lien matière
 * (`subjectId`, notebook 'subject') optionnel. Distinct de services/study.ts
 * (cartes héritées liées au notebook).
 */
import { db } from '../db'
import { createId } from '../lib/id'
import { initialSrsState, isDue, review, type Grade, type SrsState } from '../lib/study/srs'
import type { Flashcard } from '../types'

export interface CreateFlashcardInput {
  front: string
  back: string
  subjectId?: string
  tags?: string[]
}

/** Crée une flashcard immédiatement due (état SRS initial). */
export async function createFlashcard(input: CreateFlashcardInput): Promise<Flashcard> {
  const now = Date.now()
  const srs = initialSrsState(now)
  const tags = (input.tags ?? []).map((t) => t.trim()).filter(Boolean)
  const card: Flashcard = {
    id: createId(),
    front: input.front.trim(),
    back: input.back.trim(),
    easeFactor: srs.easeFactor,
    interval: srs.interval,
    repetitions: srs.repetitions,
    dueDate: srs.dueDate,
    createdAt: now,
    updatedAt: now,
    ...(input.subjectId ? { subjectId: input.subjectId } : {}),
    ...(tags.length > 0 ? { tags } : {}),
  }
  await db.flashcards.add(card)
  return card
}

/** Met à jour le contenu (front/back/tags/subject) sans toucher à l'état SRS. */
export async function updateFlashcard(
  id: string,
  patch: Partial<Pick<Flashcard, 'front' | 'back' | 'subjectId' | 'tags'>>,
): Promise<void> {
  await db.flashcards.update(id, { ...patch, updatedAt: Date.now() })
}

export async function deleteFlashcard(id: string): Promise<void> {
  await db.flashcards.delete(id)
}

export interface ListFlashcardsOptions {
  subjectId?: string
}

/** Liste les flashcards (toutes ou filtrées par matière), récentes d'abord. */
export async function listFlashcards(opts: ListFlashcardsOptions = {}): Promise<Flashcard[]> {
  let list = await db.flashcards.toArray()
  if (opts.subjectId) list = list.filter((c) => c.subjectId === opts.subjectId)
  return list.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function getFlashcard(id: string): Promise<Flashcard | undefined> {
  return db.flashcards.get(id)
}

/** Extrait l'état SRS d'une flashcard (pour la logique pure). */
export function srsStateOf(card: Flashcard): SrsState {
  return {
    easeFactor: card.easeFactor,
    interval: card.interval,
    repetitions: card.repetitions,
    dueDate: card.dueDate,
    ...(card.lastReviewedAt !== undefined ? { lastReviewedAt: card.lastReviewedAt } : {}),
  }
}

/**
 * Cartes dues (échéance ≤ now), triées par échéance croissante.
 * `now` injectable pour la testabilité.
 */
export async function listDueFlashcards(
  opts: ListFlashcardsOptions & { now?: number } = {},
): Promise<Flashcard[]> {
  const now = opts.now ?? Date.now()
  const list = await listFlashcards({ ...(opts.subjectId ? { subjectId: opts.subjectId } : {}) })
  return list.filter((c) => isDue(c, now)).sort((a, b) => a.dueDate - b.dueDate)
}

/**
 * Note une carte : calcule le nouvel état SRS (fonction pure) et le persiste.
 * Renvoie la carte mise à jour, ou undefined si introuvable.
 */
export async function reviewFlashcard(
  id: string,
  grade: Grade,
  now: number = Date.now(),
): Promise<Flashcard | undefined> {
  const card = await db.flashcards.get(id)
  if (!card) return undefined
  const next = review(srsStateOf(card), grade, now)
  const patch: Partial<Flashcard> = {
    easeFactor: next.easeFactor,
    interval: next.interval,
    repetitions: next.repetitions,
    dueDate: next.dueDate,
    lastReviewedAt: next.lastReviewedAt,
    updatedAt: now,
  }
  await db.flashcards.update(id, patch)
  return { ...card, ...patch }
}

export interface FlashcardStats {
  total: number
  due: number
  /** Cartes jamais révisées (repetitions === 0). */
  fresh: number
}

/** Statistiques simples pour l'en-tête du panneau de révision. */
export async function flashcardStats(
  opts: ListFlashcardsOptions & { now?: number } = {},
): Promise<FlashcardStats> {
  const now = opts.now ?? Date.now()
  const list = await listFlashcards({ ...(opts.subjectId ? { subjectId: opts.subjectId } : {}) })
  return {
    total: list.length,
    due: list.filter((c) => isDue(c, now)).length,
    fresh: list.filter((c) => c.repetitions === 0).length,
  }
}
