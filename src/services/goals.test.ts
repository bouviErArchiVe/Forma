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
  updateGoal,
} from './goals'

beforeEach(async () => {
  await db.open()
  await db.academicGoals.clear()
})

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
