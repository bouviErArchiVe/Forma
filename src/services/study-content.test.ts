/**
 * Tests persistance quiz & checklists (Dexie).
 */
import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db'
import {
  deleteQuiz,
  listChecklists,
  listQuizzes,
  saveChecklist,
  saveQuiz,
  toggleChecklistItem,
} from './study-content'

beforeEach(async () => {
  await db.open()
  await db.quizzes.clear()
  await db.checklists.clear()
})

describe('quiz', () => {
  it('save + list par matière, suppression', async () => {
    await saveQuiz({ title: 'Quiz structure', subjectId: 's1', source: 'local', questions: [
      { id: 'q1', type: 'truefalse', question: 'Le béton résiste en compression ?', answer: 'vrai' },
    ] })
    await saveQuiz({ title: 'Autre', subjectId: 's2', source: 'local', questions: [] })
    expect(await listQuizzes({ subjectId: 's1' })).toHaveLength(1)
    expect(await listQuizzes()).toHaveLength(2)
    const all = await listQuizzes()
    await deleteQuiz(all[0].id)
    expect(await listQuizzes()).toHaveLength(1)
  })
})

describe('checklist', () => {
  it('save depuis strings → items avec done=false', async () => {
    const c = await saveChecklist({ title: 'Projet', projectId: 'p1', source: 'local', items: ['Étape 1', 'Étape 2'] })
    expect(c.items).toHaveLength(2)
    expect(c.items.every((i) => !i.done)).toBe(true)
  })

  it('toggle item', async () => {
    const c = await saveChecklist({ title: 'C', source: 'local', items: ['a', 'b'] })
    await toggleChecklistItem(c.id, c.items[0].id)
    const got = (await listChecklists())[0]
    expect(got.items[0].done).toBe(true)
    expect(got.items[1].done).toBe(false)
  })

  it('filtre par projet', async () => {
    await saveChecklist({ title: 'A', projectId: 'p1', source: 'local', items: [] })
    await saveChecklist({ title: 'B', projectId: 'p2', source: 'local', items: [] })
    expect(await listChecklists({ projectId: 'p1' })).toHaveLength(1)
  })
})
