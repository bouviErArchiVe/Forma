/**
 * Service tâches — CRUD Dexie (table `tasks`).
 *
 * Tâches simples et fiables : statut (todo/doing/done), priorité, échéance,
 * liens optionnels (matière, projet, document). Pas un gestionnaire de
 * projet complet.
 */
import { db } from '../db'
import { createId } from '../lib/id'
import type { Task, TaskPriority, TaskStatus } from '../types'

export interface CreateTaskInput {
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  dueDate?: string
  subjectId?: string
  projectId?: string
  documentId?: string
  important?: boolean
}

/** Date locale du jour `YYYY-MM-DD`. */
export function todayISO(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const now = Date.now()
  const task: Task = {
    id: createId(),
    title: input.title.trim() || 'Nouvelle tâche',
    status: input.status ?? 'todo',
    priority: input.priority ?? 'medium',
    createdAt: now,
    updatedAt: now,
    ...(input.description?.trim() ? { description: input.description.trim() } : {}),
    ...(input.dueDate ? { dueDate: input.dueDate } : {}),
    ...(input.subjectId ? { subjectId: input.subjectId } : {}),
    ...(input.projectId ? { projectId: input.projectId } : {}),
    ...(input.documentId ? { documentId: input.documentId } : {}),
    ...(input.important ? { important: true } : {}),
  }
  await db.tasks.add(task)
  return task
}

export async function updateTask(id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<void> {
  await db.tasks.update(id, { ...patch, updatedAt: Date.now() })
}

export async function setTaskStatus(id: string, status: TaskStatus): Promise<void> {
  await updateTask(id, { status })
}

/** Cycle todo → doing → done → todo. */
export function nextStatus(status: TaskStatus): TaskStatus {
  return status === 'todo' ? 'doing' : status === 'doing' ? 'done' : 'todo'
}

export async function deleteTask(id: string): Promise<void> {
  await db.tasks.update(id, { deletedAt: Date.now(), updatedAt: Date.now() })
}

export async function restoreTask(id: string): Promise<void> {
  await db.tasks.update(id, { deletedAt: undefined, updatedAt: Date.now() })
}

export async function purgeTask(id: string): Promise<void> {
  await db.tasks.delete(id)
}

export interface ListTasksOptions {
  includeDeleted?: boolean
  subjectId?: string
  projectId?: string
  documentId?: string
  status?: TaskStatus
}

/** Tâches actives, triées par échéance (sans échéance en dernier) puis priorité. */
export async function listTasks(opts: ListTasksOptions = {}): Promise<Task[]> {
  let list = await db.tasks.toArray()
  if (!opts.includeDeleted) list = list.filter((t) => !t.deletedAt)
  if (opts.subjectId) list = list.filter((t) => t.subjectId === opts.subjectId)
  if (opts.projectId) list = list.filter((t) => t.projectId === opts.projectId)
  if (opts.documentId) list = list.filter((t) => t.documentId === opts.documentId)
  if (opts.status) list = list.filter((t) => t.status === opts.status)
  return sortTasks(list)
}

const PRIORITY_RANK: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 }

/** Tri : échéance croissante (sans échéance en dernier), puis priorité. */
export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const da = a.dueDate ?? '9999-99-99'
    const db_ = b.dueDate ?? '9999-99-99'
    if (da !== db_) return da < db_ ? -1 : 1
    return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
  })
}

/** Tâches dont l'échéance est passée et non terminées. */
export function overdueTasks(tasks: Task[], today = todayISO()): Task[] {
  return sortTasks(tasks.filter((t) => t.status !== 'done' && t.dueDate !== undefined && t.dueDate < today))
}

/** Tâches dont l'échéance est aujourd'hui. */
export function tasksDueToday(tasks: Task[], today = todayISO()): Task[] {
  return sortTasks(tasks.filter((t) => t.status !== 'done' && t.dueDate === today))
}
