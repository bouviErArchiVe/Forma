/**
 * Service examens blancs — génération depuis le matériel d'étude existant,
 * passage corrigé, persistance des examens et de l'historique des passages,
 * agrégation de statistiques d'apprentissage (Study C3/C4).
 *
 * La logique pure (construction, correction, score, stats) vit dans
 * src/lib/study/exam.ts ; ce service orchestre la lecture du contenu
 * (flashcards + quiz d'une matière) et la persistance Dexie (tables `exams`
 * et `examAttempts`, additives v15). Aucun contenu inventé : un examen ne peut
 * être généré que s'il existe des flashcards/quiz exploitables.
 */
import { db } from '../db'
import {
  aggregateExamStats,
  buildExam,
  gradeExam,
  statsBySubject,
  type ExamGenOptions,
  type ExamStats,
  type SubjectExamStat,
} from '../lib/study/exam'
import { listFlashcards } from './flashcards'
import { listQuizzes } from './study-content'
import type { Exam, ExamAttempt } from '../types'

export interface GenerateExamInput {
  title?: string
  subjectId?: string
  /** Inclure les flashcards de la matière (défaut true). */
  includeFlashcards?: boolean
  /** Inclure les quiz de la matière (défaut true). */
  includeQuizzes?: boolean
}

/**
 * Génère et persiste un examen blanc pour une matière à partir de ses
 * flashcards et/ou quiz. Renvoie `null` si aucune question exploitable.
 * `opts` permet d'injecter count / shuffle / idFn (tests).
 */
export async function generateExam(
  input: GenerateExamInput = {},
  opts: ExamGenOptions = {},
): Promise<Exam | null> {
  const filter = input.subjectId ? { subjectId: input.subjectId } : {}
  const includeFlashcards = input.includeFlashcards ?? true
  const includeQuizzes = input.includeQuizzes ?? true

  const flashcards = includeFlashcards ? await listFlashcards(filter) : []
  const quizzes = includeQuizzes ? await listQuizzes(filter) : []

  const exam = buildExam(
    {
      title: input.title ?? 'Examen blanc',
      ...(input.subjectId ? { subjectId: input.subjectId } : {}),
      flashcards,
      quizzes,
      createdAt: Date.now(),
    },
    opts,
  )
  if (!exam) return null
  await db.exams.add(exam)
  return exam
}

export async function getExam(id: string): Promise<Exam | undefined> {
  return db.exams.get(id)
}

export async function listExams(opts: { subjectId?: string } = {}): Promise<Exam[]> {
  let list = await db.exams.toArray()
  if (opts.subjectId) list = list.filter((e) => e.subjectId === opts.subjectId)
  return list.sort((a, b) => b.createdAt - a.createdAt)
}

export async function deleteExam(id: string): Promise<void> {
  await db.exams.delete(id)
  // Supprime aussi l'historique de passages associé (cohérence).
  const attempts = await db.examAttempts.where('examId').equals(id).primaryKeys()
  if (attempts.length > 0) await db.examAttempts.bulkDelete(attempts)
}

export interface SubmitExamInput {
  examId: string
  /** Réponses : questionId → texte donné. */
  given: Record<string, string>
  durationSec?: number
}

/**
 * Corrige un passage d'examen et l'historise. Renvoie le passage corrigé
 * (avec score), ou `undefined` si l'examen n'existe pas.
 */
export async function submitExam(
  input: SubmitExamInput,
  now: number = Date.now(),
): Promise<ExamAttempt | undefined> {
  const exam = await db.exams.get(input.examId)
  if (!exam) return undefined
  const attempt = gradeExam(exam, input.given, {
    createdAt: now,
    ...(input.durationSec !== undefined ? { durationSec: input.durationSec } : {}),
  })
  await db.examAttempts.add(attempt)
  return attempt
}

export interface ListAttemptsOptions {
  examId?: string
  subjectId?: string
}

/** Historique des passages (filtrable), du plus récent au plus ancien. */
export async function listAttempts(opts: ListAttemptsOptions = {}): Promise<ExamAttempt[]> {
  let list = await db.examAttempts.toArray()
  if (opts.examId) list = list.filter((a) => a.examId === opts.examId)
  if (opts.subjectId) list = list.filter((a) => a.subjectId === opts.subjectId)
  return list.sort((a, b) => b.createdAt - a.createdAt)
}

/** Statistiques d'examens (globales ou filtrées par matière). */
export async function examStats(opts: { subjectId?: string } = {}): Promise<ExamStats> {
  const attempts = await listAttempts(opts.subjectId ? { subjectId: opts.subjectId } : {})
  return aggregateExamStats(attempts)
}

/** Statistiques d'examens regroupées par matière (vue d'ensemble). */
export async function examStatsBySubject(): Promise<SubjectExamStat[]> {
  const attempts = await db.examAttempts.toArray()
  return statsBySubject(attempts)
}
