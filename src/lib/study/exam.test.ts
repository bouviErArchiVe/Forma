/**
 * Tests logique pure examens : génération, correction/score, statistiques.
 */
import { describe, expect, it } from 'vitest'
import {
  aggregateExamStats,
  buildExam,
  EMPTY_EXAM_STATS,
  gradeExam,
  isCorrect,
  normalizeAnswer,
  questionsFromFlashcards,
  questionsFromQuizzes,
  statsBySubject,
} from './exam'
import type { ExamAttempt, Flashcard, Quiz } from '../../types'

let seq = 0
const idFn = () => `id-${++seq}`

function card(p: Partial<Flashcard> = {}): Flashcard {
  return {
    id: 'c', front: 'Recto', back: 'Verso', easeFactor: 2.5, interval: 0,
    repetitions: 0, dueDate: 0, createdAt: 0, updatedAt: 0, ...p,
  }
}

function quiz(p: Partial<Quiz> = {}): Quiz {
  return { id: 'q', title: 'Quiz', questions: [], source: 'local', createdAt: 0, ...p }
}

describe('génération', () => {
  it('transforme les flashcards valides en questions courtes', () => {
    seq = 0
    const qs = questionsFromFlashcards([card({ front: 'A', back: '1' }), card({ front: ' B ', back: ' 2 ' })], { idFn })
    expect(qs).toHaveLength(2)
    expect(qs[0]).toMatchObject({ type: 'short', question: 'A', answer: '1', points: 1, source: 'flashcard' })
  })

  it('ignore les flashcards au recto/verso vide', () => {
    const qs = questionsFromFlashcards([card({ front: '', back: 'x' }), card({ front: 'y', back: '  ' })], { idFn })
    expect(qs).toHaveLength(0)
  })

  it('reprend les questions de quiz (mcq / truefalse / short)', () => {
    const qs = questionsFromQuizzes([
      quiz({ questions: [
        { id: 'a', type: 'mcq', question: 'Q1', options: ['x', 'y'], answer: '1' },
        { id: 'b', type: 'truefalse', question: 'Q2', answer: 'vrai' },
      ] }),
    ], { idFn })
    expect(qs).toHaveLength(2)
    expect(qs[0]?.options).toEqual(['x', 'y'])
    expect(qs[0]?.source).toBe('quiz')
  })

  it('buildExam combine, borne à count et calcule totalPoints', () => {
    seq = 0
    const exam = buildExam(
      {
        title: 'E',
        subjectId: 's1',
        flashcards: [card({ front: 'A', back: '1' }), card({ front: 'B', back: '2' })],
        quizzes: [quiz({ questions: [{ id: 'z', type: 'short', question: 'C', answer: '3' }] })],
        createdAt: 100,
      },
      { count: 2, idFn },
    )
    expect(exam).not.toBeNull()
    expect(exam!.questions).toHaveLength(2)
    expect(exam!.totalPoints).toBe(2)
    expect(exam!.subjectId).toBe('s1')
    expect(exam!.createdAt).toBe(100)
  })

  it('buildExam renvoie null sans matériel exploitable', () => {
    expect(buildExam({ title: 'E', createdAt: 0 }, { idFn })).toBeNull()
    expect(buildExam({ title: 'E', flashcards: [card({ front: '', back: '' })], createdAt: 0 }, { idFn })).toBeNull()
  })
})

describe('correction', () => {
  it('normalise pour les réponses courtes (casse, accents, ponctuation)', () => {
    expect(normalizeAnswer(' Béton Armé! ')).toBe('beton arme')
    const q = { id: 'x', type: 'short' as const, question: '?', answer: 'Béton armé', points: 1, source: 'flashcard' as const }
    expect(isCorrect(q, 'beton  arme')).toBe(true)
    expect(isCorrect(q, 'bois')).toBe(false)
    expect(isCorrect(q, '')).toBe(false)
  })

  it('mcq compare l’index', () => {
    const q = { id: 'x', type: 'mcq' as const, question: '?', options: ['a', 'b'], answer: '1', points: 1, source: 'quiz' as const }
    expect(isCorrect(q, '1')).toBe(true)
    expect(isCorrect(q, '0')).toBe(false)
  })

  it('truefalse tolère vrai/true/oui et faux/false/non', () => {
    const q = { id: 'x', type: 'truefalse' as const, question: '?', answer: 'vrai', points: 1, source: 'quiz' as const }
    expect(isCorrect(q, 'Vrai')).toBe(true)
    expect(isCorrect(q, 'true')).toBe(true)
    expect(isCorrect(q, 'faux')).toBe(false)
  })
})

describe('score', () => {
  it('gradeExam corrige et calcule score/total/percent', () => {
    seq = 0
    const exam = buildExam(
      { title: 'E', flashcards: [card({ front: 'A', back: '1' }), card({ front: 'B', back: '2' })], createdAt: 0 },
      { idFn },
    )!
    const [q1, q2] = exam.questions
    const attempt = gradeExam(exam, { [q1!.id]: '1', [q2!.id]: 'mauvais' }, { createdAt: 500, durationSec: 42, idFn })
    expect(attempt.score).toBe(1)
    expect(attempt.total).toBe(2)
    expect(attempt.percent).toBe(50)
    expect(attempt.durationSec).toBe(42)
    expect(attempt.createdAt).toBe(500)
    expect(attempt.answers.find((a) => a.questionId === q1!.id)?.correct).toBe(true)
    expect(attempt.answers.find((a) => a.questionId === q2!.id)?.earned).toBe(0)
  })

  it('question sans réponse comptée fausse', () => {
    seq = 0
    const exam = buildExam({ title: 'E', flashcards: [card({ front: 'A', back: '1' })], createdAt: 0 }, { idFn })!
    const attempt = gradeExam(exam, {}, { createdAt: 0, idFn })
    expect(attempt.score).toBe(0)
    expect(attempt.percent).toBe(0)
    expect(attempt.answers[0]?.given).toBe('')
  })
})

describe('statistiques', () => {
  function attempt(p: Partial<ExamAttempt>): ExamAttempt {
    return {
      id: 'a', examId: 'e', answers: [], score: 0, total: 10, percent: 0, createdAt: 0, ...p,
    }
  }

  it('liste vide → stats nulles', () => {
    expect(aggregateExamStats([])).toEqual(EMPTY_EXAM_STATS)
  })

  it('agrège moyenne / meilleur / dernier et tendance', () => {
    const stats = aggregateExamStats([
      attempt({ id: '1', percent: 40, createdAt: 1 }),
      attempt({ id: '2', percent: 60, createdAt: 2 }),
      attempt({ id: '3', percent: 80, createdAt: 3 }),
    ])
    expect(stats.attempts).toBe(3)
    expect(stats.averagePercent).toBe(60)
    expect(stats.bestPercent).toBe(80)
    expect(stats.lastPercent).toBe(80)
    expect(stats.lastAt).toBe(3)
    expect(stats.trend).toBe('up') // 80 > moyenne(40,60)=50
  })

  it('tendance « down » quand le dernier est sous la moyenne antérieure', () => {
    const stats = aggregateExamStats([
      attempt({ id: '1', percent: 90, createdAt: 1 }),
      attempt({ id: '2', percent: 30, createdAt: 2 }),
    ])
    expect(stats.trend).toBe('down')
  })

  it('un seul passage → trend none', () => {
    expect(aggregateExamStats([attempt({ percent: 70, createdAt: 1 })]).trend).toBe('none')
  })

  it('statsBySubject regroupe par matière et ignore les sans-matière', () => {
    const groups = statsBySubject([
      attempt({ id: '1', subjectId: 's1', percent: 50, createdAt: 1 }),
      attempt({ id: '2', subjectId: 's1', percent: 70, createdAt: 2 }),
      attempt({ id: '3', subjectId: 's2', percent: 90, createdAt: 1 }),
      attempt({ id: '4', percent: 10, createdAt: 1 }), // sans matière → ignoré
    ])
    expect(groups).toHaveLength(2)
    const s1 = groups.find((g) => g.subjectId === 's1')!
    expect(s1.averagePercent).toBe(60)
    expect(s1.attempts).toBe(2)
  })
})
