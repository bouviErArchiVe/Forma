/**
 * srs.ts — répétition espacée (SM-2-lite), logique PURE et testable.
 *
 * Inspiré de l'algorithme SuperMemo SM-2, simplifié et déterministe :
 *  - `easeFactor` (facilité, ≥ 1.3) ajuste la vitesse de croissance des intervalles ;
 *  - `interval` (jours) entre deux révisions ;
 *  - `repetitions` (nombre de révisions consécutives réussies) ;
 *  - `dueDate` (timestamp ms) prochaine échéance.
 *
 * Aucune dépendance Dexie/React : `review()` est une fonction pure qui prend
 * l'état SRS courant + une note et renvoie le nouvel état. Le `now` est injecté
 * pour la testabilité. Le module ne lit ni n'écrit la base.
 */

/** Note de révision SM-2 : 0 (oubli total) … 5 (parfait, immédiat). */
export type Grade = 0 | 1 | 2 | 3 | 4 | 5

/**
 * Boutons de révision simples présentés à l'utilisateur, mappés vers une note
 * SM-2. C'est le contrat utilisé par l'UI « réviser les cartes dues ».
 */
export type ReviewButton = 'again' | 'hard' | 'good' | 'easy'

export const REVIEW_BUTTON_GRADE: Record<ReviewButton, Grade> = {
  again: 1,
  hard: 3,
  good: 4,
  easy: 5,
}

export const REVIEW_BUTTON_LABELS: Record<ReviewButton, string> = {
  again: 'À revoir',
  hard: 'Difficile',
  good: 'Correct',
  easy: 'Facile',
}

/** Ordre d'affichage stable des boutons (du plus dur au plus facile). */
export const REVIEW_BUTTONS: ReviewButton[] = ['again', 'hard', 'good', 'easy']

/** État de planification persisté sur une carte. */
export interface SrsState {
  /** Facteur de facilité (≥ MIN_EASE). Plus haut = intervalles plus longs. */
  easeFactor: number
  /** Intervalle courant en jours jusqu'à la prochaine révision. */
  interval: number
  /** Nombre de révisions consécutives réussies (note ≥ 3). */
  repetitions: number
  /** Prochaine échéance (timestamp ms). */
  dueDate: number
  /** Dernière révision (timestamp ms), undefined si jamais révisée. */
  lastReviewedAt?: number
}

export const MIN_EASE = 1.3
export const DEFAULT_EASE = 2.5
const DAY_MS = 24 * 60 * 60 * 1000

/** Note considérée comme « réussie » (pas de remise à zéro des répétitions). */
const PASSING_GRADE = 3

/**
 * État SRS initial pour une carte fraîchement créée.
 * `dueDate = now` → la carte est immédiatement « due » (révisable).
 */
export function initialSrsState(now: number = Date.now()): SrsState {
  return {
    easeFactor: DEFAULT_EASE,
    interval: 0,
    repetitions: 0,
    dueDate: now,
  }
}

/**
 * Nouvel `easeFactor` après une note SM-2.
 * Formule SM-2 classique, bornée à [MIN_EASE, +∞) :
 *   EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
 */
export function nextEase(easeFactor: number, grade: Grade): number {
  const q = grade
  const delta = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)
  return Math.max(MIN_EASE, round2(easeFactor + delta))
}

/**
 * Calcule le nouvel état de planification d'une carte après révision.
 * Fonction PURE : ne modifie pas l'entrée, n'accède pas à la base.
 *
 * Règles :
 *  - note < 3 (échec) : repetitions → 0, interval → 1 jour (réapprentissage),
 *    l'easeFactor est tout de même pénalisé ;
 *  - note ≥ 3 (réussite) : repetitions++, l'intervalle croît
 *    (1 jour → 6 jours → interval * ease …).
 */
export function review(state: SrsState, grade: Grade, now: number = Date.now()): SrsState {
  const easeFactor = nextEase(state.easeFactor, grade)

  if (grade < PASSING_GRADE) {
    return {
      easeFactor,
      interval: 1,
      repetitions: 0,
      dueDate: now + 1 * DAY_MS,
      lastReviewedAt: now,
    }
  }

  const repetitions = state.repetitions + 1
  let interval: number
  if (repetitions === 1) {
    interval = 1
  } else if (repetitions === 2) {
    interval = 6
  } else {
    interval = Math.round(state.interval * easeFactor)
  }
  // Garantit une progression stricte même si interval initial était 0.
  interval = Math.max(1, interval)

  return {
    easeFactor,
    interval,
    repetitions,
    dueDate: now + interval * DAY_MS,
    lastReviewedAt: now,
  }
}

/** Une carte est due si son échéance est passée (ou égale à maintenant). */
export function isDue(state: Pick<SrsState, 'dueDate'>, now: number = Date.now()): boolean {
  return state.dueDate <= now
}

/** Arrondi à 2 décimales (évite la dérive flottante de l'easeFactor). */
function round2(n: number): number {
  return Math.round(n * 100) / 100
}
