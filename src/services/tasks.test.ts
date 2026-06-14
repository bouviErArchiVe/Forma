/**
 * Tests service tâches (Dexie fake-indexeddb).
 */
import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db'
import {
  createTask,
  deleteTask,
  listTasks,
  nextStatus,
  overdueTasks,
  restoreTask,
  setTaskStatus,
  sortTasks,
  tasksDueToday,
  updateTask,
} from './tasks'
import type { Task } from '../types'

beforeEach(async () => {
  await db.open()
  await db.tasks.clear()
})

describe('createTask / listTasks', () => {
  it('crée une tâche avec valeurs par défaut', async () => {
    const t = await createTask({ title: 'Réviser structure' })
    expect(t.status).toBe('todo')
    expect(t.priority).toBe('medium')
    const list = await listTasks()
    expect(list).toHaveLength(1)
    expect(list[0].title).toBe('Réviser structure')
  })

  it('filtre par matière, projet, document', async () => {
    await createTask({ title: 'A', subjectId: 's1' })
    await createTask({ title: 'B', projectId: 'p1' })
    await createTask({ title: 'C', documentId: 'd1' })
    expect(await listTasks({ subjectId: 's1' })).toHaveLength(1)
    expect(await listTasks({ projectId: 'p1' })).toHaveLength(1)
    expect(await listTasks({ documentId: 'd1' })).toHaveLength(1)
  })
})

describe('statut & suppression', () => {
  it('cycle de statut', () => {
    expect(nextStatus('todo')).toBe('doing')
    expect(nextStatus('doing')).toBe('done')
    expect(nextStatus('done')).toBe('todo')
  })

  it('setTaskStatus persiste', async () => {
    const t = await createTask({ title: 'X' })
    await setTaskStatus(t.id, 'done')
    expect((await listTasks({ status: 'done' }))[0].id).toBe(t.id)
  })

  it('soft delete puis restore', async () => {
    const t = await createTask({ title: 'Y' })
    await deleteTask(t.id)
    expect(await listTasks()).toHaveLength(0)
    expect(await listTasks({ includeDeleted: true })).toHaveLength(1)
    await restoreTask(t.id)
    expect(await listTasks()).toHaveLength(1)
  })

  it('updateTask modifie titre/priorité', async () => {
    const t = await createTask({ title: 'Z' })
    await updateTask(t.id, { title: 'Z2', priority: 'high' })
    const got = (await listTasks())[0]
    expect(got.title).toBe('Z2')
    expect(got.priority).toBe('high')
  })
})

describe('tri & échéances', () => {
  function task(p: Partial<Task> & { id: string }): Task {
    return { title: p.id, status: 'todo', priority: 'medium', createdAt: 1, updatedAt: 1, ...p }
  }

  it('sortTasks : échéance croissante puis priorité', () => {
    const sorted = sortTasks([
      task({ id: 'late', dueDate: '2026-06-20' }),
      task({ id: 'none' }),
      task({ id: 'soon', dueDate: '2026-06-10' }),
      task({ id: 'soon-high', dueDate: '2026-06-10', priority: 'high' }),
    ])
    expect(sorted.map((t) => t.id)).toEqual(['soon-high', 'soon', 'late', 'none'])
  })

  it('overdueTasks et tasksDueToday', () => {
    const today = '2026-06-13'
    const list = [
      task({ id: 'over', dueDate: '2026-06-10' }),
      task({ id: 'today', dueDate: today }),
      task({ id: 'future', dueDate: '2026-06-20' }),
      task({ id: 'done', dueDate: '2026-06-01', status: 'done' }),
    ]
    expect(overdueTasks(list, today).map((t) => t.id)).toEqual(['over'])
    expect(tasksDueToday(list, today).map((t) => t.id)).toEqual(['today'])
  })
})
