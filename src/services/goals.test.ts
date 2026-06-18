/**
 * Tests service objectifs académiques : CRUD Dexie, persistance, progression,
 * filtre par matière, tri.
 */
import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db'
import {
  adjustGoalProgress,
  createGoal,
  deleteGoal,
  getGoal,
  listGoals,
  refreshAutoGoals,
  updateGoal,
} from './goals'
import type { ExamAttempt, Flashcard } from '../types'

beforeEach(async () => {
  await db.open()
  await db.academicGoals.clear()
  await db.examAttempts.clear()
  await db.flashcards.clear()
})

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

describe('CRUD + persistance', () => {
  it('crée et persiste un objectif', async () => {
    const g = await createGoal({ title: ' Réviser ', target: 5, subjectId: 's1', unit: 'h' })
    expect(g.title).toBe('Réviser')
    expect(g.target).toBe(5)
    expect(g.progress).toBe(0)
    expect(g.subjectId).toBe('s1')

    const stored = await getGoal(g.id)
    expect(stored).toBeDefined()
    expect(stored?.unit).toBe('h')
  })

  it('updateGoal applique les bornes et fige completedAt', async () => {
    const g = await createGoal({ title: 'A', target: 4 })
    const done = await updateGoal(g.id, { progress: 10 }, 999)
    expect(done?.progress).toBe(4) // borné
    expect(done?.completedAt).toBe(999)
    expect((await getGoal(g.id))?.completedAt).toBe(999)
  })

  it('updateGoal renvoie undefined si introuvable', async () => {
    expect(await updateGoal('nope', { progress: 1 })).toBeUndefined()
  })

  it('adjustGoalProgress incrémente et persiste, borné à 0', async () => {
    const g = await createGoal({ title: 'A', target: 5 })
    const up = await adjustGoalProgress(g.id, 3)
    expect(up?.progress).toBe(3)
    const down = await adjustGoalProgress(g.id, -10)
    expect(down?.progress).toBe(0)
    expect((await getGoal(g.id))?.progress).toBe(0)
  })

  it('deleteGoal supprime', async () => {
    const g = await createGoal({ title: 'A', target: 2 })
    await deleteGoal(g.id)
    expect(await getGoal(g.id)).toBeUndefined()
  })
})

describe('listGoals', () => {
  it('filtre par matière', async () => {
    await createGoal({ title: 'A', target: 2, subjectId: 's1' })
    await createGoal({ title: 'B', target: 2, subjectId: 's2' })
    expect(await listGoals({ subjectId: 's1' })).toHaveLength(1)
    expect(await listGoals()).toHaveLength(2)
  })

  it('trie les non terminés avant les terminés', async () => {
    const done = await createGoal({ title: 'done', target: 1, progress: 1 }, 1)
    const active = await createGoal({ title: 'active', target: 5, progress: 1 }, 2)
    const list = await listGoals()
    expect(list[0]?.id).toBe(active.id)
    expect(list[list.length - 1]?.id).toBe(done.id)
  })

  it('parmi les actifs, trie par échéance croissante (sans échéance en dernier)', async () => {
    const later = await createGoal({ title: 'later', target: 5, dueDate: '2026-08-01' }, 1)
    const sooner = await createGoal({ title: 'sooner', target: 5, dueDate: '2026-07-01' }, 2)
    const noDue = await createGoal({ title: 'noDue', target: 5 }, 3)
    const list = await listGoals()
    expect(list.map((g) => g.id)).toEqual([sooner.id, later.id, noDue.id])
  })
})

describe('refreshAutoGoals', () => {
  it('dérive la progression des objectifs auto depuis l’activité (filtré matière)', async () => {
    const g = await createGoal({ title: 'passages', target: 5, subjectId: 's1', auto: 'exam-attempts' })
    await db.examAttempts.bulkAdd([
      attempt({ subjectId: 's1' }),
      attempt({ subjectId: 's1' }),
      attempt({ subjectId: 's2' }),
    ])

    const updated = await refreshAutoGoals(999)
    expect(updated).toBe(1)
    const stored = await getGoal(g.id)
    expect(stored?.progress).toBe(2) // deux passages s1
    expect(stored?.updatedAt).toBe(999)
  })

  it('dérive flashcards maîtrisées et fige completedAt si la cible est atteinte', async () => {
    const g = await createGoal({ title: 'maîtrise', target: 2, subjectId: 's1', auto: 'flashcards-mastered' })
    await db.flashcards.bulkAdd([
      card({ subjectId: 's1', repetitions: 3 }),
      card({ subjectId: 's1', repetitions: 2 }),
      card({ subjectId: 's1', repetitions: 1 }),
    ])
    await refreshAutoGoals(999)
    const stored = await getGoal(g.id)
    expect(stored?.progress).toBe(2)
    expect(stored?.completedAt).toBe(999)
  })

  it('ne touche pas les objectifs manuels et est idempotent', async () => {
    const manual = await createGoal({ title: 'manuel', target: 5, progress: 3 })
    await db.examAttempts.add(attempt({}))
    const first = await refreshAutoGoals(999)
    expect(first).toBe(0) // aucun objectif auto
    expect((await getGoal(manual.id))?.progress).toBe(3)

    // Avec un objectif auto déjà à jour : seconde passe sans réécriture.
    await createGoal({ title: 'auto', target: 5, auto: 'exam-attempts' })
    await refreshAutoGoals(1000)
    const second = await refreshAutoGoals(1001)
    expect(second).toBe(0)
  })
})
