/**
 * Tests service examens : génération depuis flashcards/quiz Dexie, persistance,
 * passage corrigé, historique et statistiques.
 */
import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db'
import { createFlashcard } from './flashcards'
import { saveQuiz } from './study-content'
import {
  deleteExam,
  examStats,
  examStatsBySubject,
  generateExam,
  getExam,
  listAttempts,
  listExams,
  submitExam,
} from './exams'

beforeEach(async () => {
  await db.open()
  await db.flashcards.clear()
  await db.quizzes.clear()
  await db.exams.clear()
  await db.examAttempts.clear()
})

describe('génération + persistance', () => {
  it('génère et persiste un examen à partir des flashcards de la matière', async () => {
    await createFlashcard({ front: 'Béton', back: 'Matériau', subjectId: 's1' })
    await createFlashcard({ front: 'Acier', back: 'Métal', subjectId: 's1' })
    await createFlashcard({ front: 'Autre', back: 'X', subjectId: 's2' }) // autre matière

    const exam = await generateExam({ title: 'E1', subjectId: 's1' })
    expect(exam).not.toBeNull()
    expect(exam!.questions).toHaveLength(2)
    expect(exam!.subjectId).toBe('s1')

    // persisté + interrogeable
    expect(await getExam(exam!.id)).toBeDefined()
    expect(await listExams({ subjectId: 's1' })).toHaveLength(1)
    expect(await listExams({ subjectId: 's2' })).toHaveLength(0)
  })

  it('combine flashcards et quiz de la matière', async () => {
    await createFlashcard({ front: 'A', back: '1', subjectId: 's1' })
    await saveQuiz({
      title: 'Q', subjectId: 's1', source: 'local',
      questions: [{ id: 'qq1', type: 'truefalse', question: 'Vrai ?', answer: 'vrai' }],
    })
    const exam = await generateExam({ subjectId: 's1' }, { count: 10 })
    expect(exam!.questions).toHaveLength(2)
    expect(exam!.questions.some((q) => q.source === 'flashcard')).toBe(true)
    expect(exam!.questions.some((q) => q.source === 'quiz')).toBe(true)
  })

  it('renvoie null quand aucun matériel exploitable', async () => {
    expect(await generateExam({ subjectId: 'vide' })).toBeNull()
    expect(await listExams()).toHaveLength(0)
  })

  it('respecte includeFlashcards / includeQuizzes', async () => {
    await createFlashcard({ front: 'A', back: '1', subjectId: 's1' })
    await saveQuiz({
      title: 'Q', subjectId: 's1', source: 'local',
      questions: [{ id: 'qq1', type: 'short', question: 'C', answer: '3' }],
    })
    const onlyQuiz = await generateExam({ subjectId: 's1', includeFlashcards: false })
    expect(onlyQuiz!.questions.every((q) => q.source === 'quiz')).toBe(true)
  })
})

describe('passage + correction', () => {
  it('corrige un passage et l’historise', async () => {
    await createFlashcard({ front: 'A', back: 'bonne', subjectId: 's1' })
    await createFlashcard({ front: 'B', back: 'autre', subjectId: 's1' })
    const exam = (await generateExam({ subjectId: 's1' }))!
    expect(exam.questions).toHaveLength(2)
    // Réponse juste pour la carte « bonne », fausse pour l'autre (ordre indifférent).
    const given: Record<string, string> = {}
    for (const q of exam.questions) given[q.id] = q.answer === 'bonne' ? 'bonne' : 'fausse'

    const attempt = await submitExam({ examId: exam.id, given, durationSec: 30 }, 1000)
    expect(attempt).toBeDefined()
    expect(attempt!.score).toBe(1)
    expect(attempt!.total).toBe(2)
    expect(attempt!.percent).toBe(50)
    expect(attempt!.subjectId).toBe('s1')
    expect(attempt!.createdAt).toBe(1000)

    // historisé
    const history = await listAttempts({ examId: exam.id })
    expect(history).toHaveLength(1)
    expect(history[0]?.percent).toBe(50)
  })

  it('submitExam renvoie undefined si l’examen n’existe pas', async () => {
    expect(await submitExam({ examId: 'inconnu', given: {} })).toBeUndefined()
  })

  it('deleteExam supprime aussi l’historique associé', async () => {
    await createFlashcard({ front: 'A', back: '1', subjectId: 's1' })
    const exam = (await generateExam({ subjectId: 's1' }))!
    await submitExam({ examId: exam.id, given: {} })
    expect(await listAttempts({ examId: exam.id })).toHaveLength(1)

    await deleteExam(exam.id)
    expect(await getExam(exam.id)).toBeUndefined()
    expect(await listAttempts({ examId: exam.id })).toHaveLength(0)
  })
})

describe('statistiques', () => {
  it('examStats agrège les passages d’une matière', async () => {
    await createFlashcard({ front: 'A', back: 'x', subjectId: 's1' })
    const exam = (await generateExam({ subjectId: 's1' }))!
    const [q1] = exam.questions
    await submitExam({ examId: exam.id, given: { [q1!.id]: 'mauvais' } }, 1) // 0%
    await submitExam({ examId: exam.id, given: { [q1!.id]: 'x' } }, 2) // 100%

    const stats = await examStats({ subjectId: 's1' })
    expect(stats.attempts).toBe(2)
    expect(stats.averagePercent).toBe(50)
    expect(stats.bestPercent).toBe(100)
    expect(stats.lastPercent).toBe(100)
    expect(stats.trend).toBe('up')
  })

  it('examStatsBySubject regroupe toutes matières', async () => {
    await createFlashcard({ front: 'A', back: 'x', subjectId: 's1' })
    await createFlashcard({ front: 'B', back: 'y', subjectId: 's2' })
    const e1 = (await generateExam({ subjectId: 's1' }))!
    const e2 = (await generateExam({ subjectId: 's2' }))!
    await submitExam({ examId: e1.id, given: { [e1.questions[0]!.id]: 'x' } }, 1)
    await submitExam({ examId: e2.id, given: { [e2.questions[0]!.id]: 'faux' } }, 1)

    const bySubject = await examStatsBySubject()
    expect(bySubject).toHaveLength(2)
    expect(bySubject.find((s) => s.subjectId === 's1')?.lastPercent).toBe(100)
    expect(bySubject.find((s) => s.subjectId === 's2')?.lastPercent).toBe(0)
  })
})
