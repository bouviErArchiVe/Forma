/**
 * Tests service drilldown par matière : lecture Dexie filtrée + agrégation.
 */
import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db'
import { listDrilldownSubjects, loadSubjectDrilldown } from './study-stats'
import type { ExamAttempt, Flashcard, Notebook } from '../types'

const NOW = 1_000_000

beforeEach(async () => {
  await db.open()
  await db.notebooks.clear()
  await db.examAttempts.clear()
  await db.flashcards.clear()
  await db.academicGoals.clear()
})

function notebook(id: string, name: string, extra: Partial<Notebook> = {}): Notebook {
  return {
    id,
    name,
    type: 'subject',
    createdAt: 0,
    updatedAt: 0,
    ...extra,
  } as Notebook
}

function attempt(p: Partial<ExamAttempt>): ExamAttempt {
  return {
    id: Math.random().toString(36).slice(2),
    examId: 'e',
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
    id: Math.random().toString(36).slice(2),
    front: 'f',
    back: 'b',
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    dueDate: 0,
    createdAt: 0,
    updatedAt: 0,
    ...p,
  }
}

describe('listDrilldownSubjects', () => {
  it('ne renvoie que les matières avec du matériel, triées par nom', async () => {
    await db.notebooks.bulkAdd([
      notebook('s1', 'Maths'),
      notebook('s2', 'Bio'),
      notebook('s3', 'Vide'), // aucun matériel
      notebook('n1', 'Note', { type: 'note' }),
    ])
    await db.flashcards.add(card({ subjectId: 's1' }))
    await db.examAttempts.add(attempt({ subjectId: 's2' }))

    const subjects = await listDrilldownSubjects()
    expect(subjects.map((s) => s.id)).toEqual(['s2', 's1']) // Bio avant Maths
  })

  it('exclut les matières supprimées', async () => {
    await db.notebooks.add(notebook('s1', 'Maths', { deletedAt: 123 }))
    await db.flashcards.add(card({ subjectId: 's1' }))
    expect(await listDrilldownSubjects()).toHaveLength(0)
  })
})

describe('loadSubjectDrilldown', () => {
  it('agrège uniquement le matériel de la matière demandée', async () => {
    await db.examAttempts.bulkAdd([
      attempt({ subjectId: 's1', percent: 70, createdAt: 1 }),
      attempt({ subjectId: 's2', percent: 10, createdAt: 1 }),
    ])
    await db.flashcards.bulkAdd([
      card({ subjectId: 's1', repetitions: 2 }),
      card({ subjectId: 's1', repetitions: 0 }),
      card({ subjectId: 's2', repetitions: 5 }),
    ])
    await db.academicGoals.add({
      id: 'g1',
      title: 'g',
      subjectId: 's1',
      target: 4,
      progress: 4,
      createdAt: 0,
      updatedAt: 0,
      completedAt: 0,
    })

    const d = await loadSubjectDrilldown('s1', { now: NOW })
    expect(d.subjectId).toBe('s1')
    expect(d.exams.attempts).toBe(1)
    expect(d.exams.bestPercent).toBe(70)
    expect(d.flashcards.total).toBe(2)
    expect(d.flashcards.reviewed).toBe(1)
    expect(d.goals.total).toBe(1)
    expect(d.goals.done).toBe(1)
  })
})
