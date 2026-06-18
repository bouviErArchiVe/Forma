/**
 * Tests logique pure drilldown par matière : agrégation examens / flashcards /
 * objectifs. Aucune dépendance Dexie.
 */
import { describe, expect, it } from 'vitest'
import { countFlashcards, subjectDrilldown, EMPTY_FLASHCARD_COUNTS } from './drilldown'
import { buildGoal } from './goals'
import type { ExamAttempt, Flashcard } from '../../types'

const NOW = 1_000_000

function attempt(p: Partial<ExamAttempt>): ExamAttempt {
  return {
    id: 'a',
    examId: 'e',
    subjectId: 'math',
    answers: [],
    score: 0,
    total: 100,
    percent: 0,
    createdAt: 0,
    ...p,
  }
}

function card(p: Partial<Flashcard>): Flashcard {
  return {
    id: 'c',
    front: 'f',
    back: 'b',
    subjectId: 'math',
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    dueDate: 0,
    createdAt: 0,
    updatedAt: 0,
    ...p,
  }
}

describe('countFlashcards', () => {
  it('liste vide → compteurs à zéro', () => {
    expect(countFlashcards([], NOW)).toEqual(EMPTY_FLASHCARD_COUNTS)
  })

  it('compte total / dues / fraîches / révisées', () => {
    const cards = [
      card({ repetitions: 0, dueDate: NOW - 1 }), // fraîche + due
      card({ repetitions: 2, dueDate: NOW + 100_000 }), // révisée, pas due
      card({ repetitions: 1, dueDate: NOW }), // révisée + due (≤ now)
    ]
    const c = countFlashcards(cards, NOW)
    expect(c.total).toBe(3)
    expect(c.fresh).toBe(1)
    expect(c.reviewed).toBe(2)
    expect(c.due).toBe(2)
  })
})

describe('subjectDrilldown', () => {
  it('agrège examens, flashcards et objectifs d’une matière', () => {
    const today = '2026-06-17'
    const d = subjectDrilldown(
      {
        subjectId: 'math',
        attempts: [
          attempt({ percent: 50, createdAt: 1 }),
          attempt({ percent: 80, createdAt: 2 }),
        ],
        flashcards: [card({ repetitions: 0 }), card({ repetitions: 3 })],
        goals: [
          buildGoal({ title: 'g1', target: 2, progress: 2, createdAt: 1 }),
          buildGoal({ title: 'g2', target: 4, progress: 1, dueDate: '2026-06-01', createdAt: 1 }),
        ],
      },
      { now: NOW, today },
    )

    expect(d.subjectId).toBe('math')
    expect(d.exams.attempts).toBe(2)
    expect(d.exams.bestPercent).toBe(80)
    expect(d.exams.lastPercent).toBe(80)
    expect(d.flashcards.total).toBe(2)
    expect(d.flashcards.reviewed).toBe(1)
    expect(d.goals.total).toBe(2)
    expect(d.goals.done).toBe(1)
    expect(d.goals.overdue).toBe(1)
  })

  it('matière vide → agrégats vides cohérents', () => {
    const d = subjectDrilldown(
      { subjectId: 'vide', attempts: [], flashcards: [], goals: [] },
      { now: NOW },
    )
    expect(d.exams.attempts).toBe(0)
    expect(d.flashcards).toEqual(EMPTY_FLASHCARD_COUNTS)
    expect(d.goals.total).toBe(0)
  })
})
