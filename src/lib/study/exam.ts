/**
 * exam.ts — examens blancs : génération, correction, score, statistiques.
 *
 * Logique PURE et déterministe (aucune dépendance Dexie/React). Le service
 * src/services/exams.ts persiste les résultats renvoyés ici. Les examens sont
 * construits à partir du matériel d'étude existant — flashcards (recto/verso)
 * et quiz (mcq / vrai-faux / réponse courte) — sans rien inventer.
 *
 * Grammaire des réponses (alignée sur QuizQuestion) :
 *  - mcq        : `answer` = index (chaîne) de la bonne option ;
 *  - truefalse  : `answer` = 'vrai' | 'faux' ;
 *  - short      : `answer` = texte attendu (comparaison normalisée).
 */
import type {
  Exam,
  ExamAnswer,
  ExamAttempt,
  ExamQuestion,
  Flashcard,
  Quiz,
} from '../../types'

// ─── Identité (injectable pour des tests déterministes) ─────────────────────────

/** Générateur d'id par défaut (uuid v4 via lib/id). */
import { createId } from '../id'

export interface ExamGenOptions {
  /** Nombre maximum de questions (défaut 10). */
  count?: number
  /** Points par question (défaut 1). */
  pointsPerQuestion?: number
  /** Fonction d'id (tests). */
  idFn?: () => string
  /**
   * Fonction de mélange pseudo-aléatoire. Par défaut identité (ordre stable,
   * déterministe) ; l'UI peut injecter un shuffle réel.
   */
  shuffle?: <T>(arr: T[]) => T[]
}

/**
 * Construit la banque de questions à partir des flashcards d'une matière.
 * Chaque flashcard valide (recto + verso non vides) devient une question
 * « réponse courte » : énoncé = recto, réponse attendue = verso.
 */
export function questionsFromFlashcards(
  cards: Flashcard[],
  opts: { pointsPerQuestion?: number; idFn?: () => string } = {},
): ExamQuestion[] {
  const points = opts.pointsPerQuestion ?? 1
  const id = opts.idFn ?? createId
  const out: ExamQuestion[] = []
  for (const c of cards) {
    const front = c.front.trim()
    const back = c.back.trim()
    if (front === '' || back === '') continue
    out.push({
      id: id(),
      type: 'short',
      question: front,
      answer: back,
      points,
      source: 'flashcard',
    })
  }
  return out
}

/**
 * Construit la banque de questions à partir des quiz d'une matière.
 * Réutilise les questions de quiz telles quelles (mcq / truefalse / short).
 */
export function questionsFromQuizzes(
  quizzes: Quiz[],
  opts: { pointsPerQuestion?: number; idFn?: () => string } = {},
): ExamQuestion[] {
  const points = opts.pointsPerQuestion ?? 1
  const id = opts.idFn ?? createId
  const out: ExamQuestion[] = []
  for (const q of quizzes) {
    for (const qq of q.questions) {
      const question = qq.question.trim()
      const answer = qq.answer.trim()
      if (question === '' || answer === '') continue
      out.push({
        id: id(),
        type: qq.type,
        question,
        ...(qq.options ? { options: qq.options } : {}),
        answer,
        points,
        source: 'quiz',
      })
    }
  }
  return out
}

export interface BuildExamInput {
  title: string
  subjectId?: string
  flashcards?: Flashcard[]
  quizzes?: Quiz[]
  createdAt: number
}

/**
 * Assemble un examen à partir des flashcards et quiz fournis. Combine les deux
 * banques, applique un éventuel mélange puis tronque à `count` questions.
 * Renvoie `null` si aucune question exploitable n'est disponible (pas de
 * contenu inventé). PURE : aucun accès base.
 */
export function buildExam(input: BuildExamInput, opts: ExamGenOptions = {}): Exam | null {
  const count = opts.count ?? 10
  const id = opts.idFn ?? createId
  const shuffle = opts.shuffle ?? ((arr) => arr)
  const pointsPerQuestion = opts.pointsPerQuestion ?? 1

  const bank = [
    ...questionsFromFlashcards(input.flashcards ?? [], { pointsPerQuestion, idFn: id }),
    ...questionsFromQuizzes(input.quizzes ?? [], { pointsPerQuestion, idFn: id }),
  ]
  if (bank.length === 0) return null

  const selected = shuffle(bank).slice(0, Math.max(1, count))
  const totalPoints = selected.reduce((sum, q) => sum + q.points, 0)

  return {
    id: id(),
    title: input.title.trim() || 'Examen blanc',
    ...(input.subjectId ? { subjectId: input.subjectId } : {}),
    questions: selected,
    totalPoints,
    createdAt: input.createdAt,
  }
}

// ─── Correction ──────────────────────────────────────────────────────────────

/** Normalise un texte pour la comparaison (casse, accents, espaces, ponctuation). */
export function normalizeAnswer(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // diacritiques
    .replace(/[.,;:!?'"()«»]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Vérifie une réponse selon le type de question.
 *  - mcq        : index égal (tolère « 0 » vs « 0 ») ;
 *  - truefalse  : booléen normalisé (vrai/faux, true/false, oui/non) ;
 *  - short      : égalité après normalisation.
 */
export function isCorrect(question: ExamQuestion, given: string): boolean {
  const g = given ?? ''
  if (question.type === 'truefalse') {
    return normalizeTrueFalse(g) === normalizeTrueFalse(question.answer)
  }
  if (question.type === 'mcq') {
    return g.trim() === question.answer.trim()
  }
  // short
  return normalizeAnswer(g) === normalizeAnswer(question.answer) && normalizeAnswer(g) !== ''
}

function normalizeTrueFalse(s: string): 'vrai' | 'faux' | '' {
  const n = normalizeAnswer(s)
  if (['vrai', 'true', 'oui', 'v', '1'].includes(n)) return 'vrai'
  if (['faux', 'false', 'non', 'f', '0'].includes(n)) return 'faux'
  return ''
}

/**
 * Corrige un examen passé : pour chaque question, récupère la réponse donnée
 * (map questionId → texte), calcule justesse et points, agrège le score.
 * PURE : renvoie un `ExamAttempt` prêt à persister.
 */
export function gradeExam(
  exam: Exam,
  given: Record<string, string>,
  meta: { createdAt: number; durationSec?: number; idFn?: () => string } = { createdAt: Date.now() },
): ExamAttempt {
  const id = meta.idFn ?? createId
  const answers: ExamAnswer[] = exam.questions.map((q) => {
    const value = given[q.id] ?? ''
    const correct = isCorrect(q, value)
    return {
      questionId: q.id,
      given: value,
      correct,
      earned: correct ? q.points : 0,
    }
  })

  const score = answers.reduce((sum, a) => sum + a.earned, 0)
  const total = exam.totalPoints
  const percent = total > 0 ? Math.round((score / total) * 100) : 0

  return {
    id: id(),
    examId: exam.id,
    ...(exam.subjectId ? { subjectId: exam.subjectId } : {}),
    answers,
    score,
    total,
    percent,
    ...(meta.durationSec !== undefined ? { durationSec: meta.durationSec } : {}),
    createdAt: meta.createdAt,
  }
}

// ─── Statistiques ──────────────────────────────────────────────────────────────

export interface ExamStats {
  /** Nombre de passages. */
  attempts: number
  /** Score moyen en pourcentage (0-100), arrondi. */
  averagePercent: number
  /** Meilleur pourcentage obtenu. */
  bestPercent: number
  /** Dernier pourcentage (passage le plus récent). */
  lastPercent: number
  /** Date du dernier passage (timestamp ms), ou undefined. */
  lastAt?: number
  /**
   * Tendance par rapport à la moyenne des passages antérieurs au dernier :
   * 'up' | 'down' | 'flat' | 'none' (un seul passage ou aucun).
   */
  trend: 'up' | 'down' | 'flat' | 'none'
}

export const EMPTY_EXAM_STATS: ExamStats = {
  attempts: 0,
  averagePercent: 0,
  bestPercent: 0,
  lastPercent: 0,
  trend: 'none',
}

/**
 * Agrège les statistiques d'une liste de passages (toutes matières confondues
 * ou pré-filtrée par matière en amont). PURE : l'ordre d'entrée est libre, le
 * « dernier » est déterminé par `createdAt`.
 */
export function aggregateExamStats(attempts: ExamAttempt[]): ExamStats {
  if (attempts.length === 0) return EMPTY_EXAM_STATS

  const sorted = [...attempts].sort((a, b) => a.createdAt - b.createdAt)
  const percents = sorted.map((a) => a.percent)
  const sum = percents.reduce((s, p) => s + p, 0)
  const last = sorted[sorted.length - 1]!

  let trend: ExamStats['trend'] = 'none'
  if (sorted.length >= 2) {
    const prior = percents.slice(0, -1)
    const priorAvg = prior.reduce((s, p) => s + p, 0) / prior.length
    if (last.percent > priorAvg) trend = 'up'
    else if (last.percent < priorAvg) trend = 'down'
    else trend = 'flat'
  }

  return {
    attempts: sorted.length,
    averagePercent: Math.round(sum / sorted.length),
    bestPercent: Math.max(...percents),
    lastPercent: last.percent,
    lastAt: last.createdAt,
    trend,
  }
}

export interface SubjectExamStat extends ExamStats {
  subjectId: string
}

/**
 * Regroupe les passages par matière (subjectId) et calcule les stats de chacune.
 * Les passages sans subjectId sont ignorés (stats par-matière uniquement).
 */
export function statsBySubject(attempts: ExamAttempt[]): SubjectExamStat[] {
  const groups = new Map<string, ExamAttempt[]>()
  for (const a of attempts) {
    if (!a.subjectId) continue
    const list = groups.get(a.subjectId) ?? []
    list.push(a)
    groups.set(a.subjectId, list)
  }
  return [...groups.entries()].map(([subjectId, list]) => ({
    subjectId,
    ...aggregateExamStats(list),
  }))
}
