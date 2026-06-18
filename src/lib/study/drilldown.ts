/**
 * drilldown.ts — agrégation par matière du matériel d'étude (Study Sprint #4).
 *
 * Logique PURE et déterministe (aucune dépendance Dexie/React). Combine, pour
 * une matière donnée, les statistiques d'examens, de flashcards et d'objectifs
 * déjà calculées par les modules purs voisins (`exam.ts`, `srs`-dérivé,
 * `goals.ts`). Aucune donnée recalculée en doublon : on réutilise
 * `aggregateExamStats` et `summarizeGoals`, et on dérive les compteurs de
 * flashcards localement (mêmes règles que services/flashcards.flashcardStats).
 *
 * L'appelant (service / page) fournit le matériel brut filtré par matière ; ce
 * module agrège. Le tri / la résolution des noms de matières restent côté UI.
 */
import type { AcademicGoal, ExamAttempt, Flashcard } from '../../types'
import { aggregateExamStats, type ExamStats } from './exam'
import { isDue } from './srs'
import { summarizeGoals, type GoalsSummary } from './goals'

/** Compteurs de flashcards (miroir pur de services/flashcards.FlashcardStats). */
export interface FlashcardCounts {
  total: number
  /** Cartes dues (échéance ≤ now). */
  due: number
  /** Cartes jamais révisées (repetitions === 0). */
  fresh: number
  /** Cartes révisées au moins une fois. */
  reviewed: number
}

export const EMPTY_FLASHCARD_COUNTS: FlashcardCounts = {
  total: 0,
  due: 0,
  fresh: 0,
  reviewed: 0,
}

/** Agrège les compteurs de flashcards à `now`. PURE. */
export function countFlashcards(cards: Flashcard[], now: number): FlashcardCounts {
  let due = 0
  let fresh = 0
  for (const c of cards) {
    if (isDue(c, now)) due += 1
    if (c.repetitions === 0) fresh += 1
  }
  return {
    total: cards.length,
    due,
    fresh,
    reviewed: cards.length - fresh,
  }
}

/** Matériel brut d'une matière (déjà filtré par l'appelant). */
export interface SubjectMaterial {
  subjectId: string
  attempts: ExamAttempt[]
  flashcards: Flashcard[]
  goals: AcademicGoal[]
}

/** Vue agrégée d'une matière (drilldown). */
export interface SubjectDrilldown {
  subjectId: string
  exams: ExamStats
  flashcards: FlashcardCounts
  goals: GoalsSummary
}

/**
 * Construit la vue agrégée d'une matière en réutilisant les agrégateurs purs
 * existants. `now`/`today` injectables pour la testabilité (échéances). PURE.
 */
export function subjectDrilldown(
  material: SubjectMaterial,
  opts: { now?: number; today?: string } = {},
): SubjectDrilldown {
  const now = opts.now ?? Date.now()
  return {
    subjectId: material.subjectId,
    exams: aggregateExamStats(material.attempts),
    flashcards: countFlashcards(material.flashcards, now),
    goals: opts.today
      ? summarizeGoals(material.goals, opts.today)
      : summarizeGoals(material.goals),
  }
}
