/**
 * Service contenu d'étude — persistance des quiz et checklists (Dexie).
 * (Distinct de services/study.ts qui gère les cartes de révision/SRS.)
 */
import { db } from '../db'
import { createId } from '../lib/id'
import type { Checklist, ChecklistItem, Quiz, QuizQuestion } from '../types'

// ─── Quiz ────────────────────────────────────────────────────────────────────

export async function saveQuiz(input: {
  title: string
  subjectId?: string
  questions: QuizQuestion[]
  source: string
}): Promise<Quiz> {
  const quiz: Quiz = {
    id: createId(),
    title: input.title.trim() || 'Quiz',
    questions: input.questions,
    source: input.source,
    createdAt: Date.now(),
    ...(input.subjectId ? { subjectId: input.subjectId } : {}),
  }
  await db.quizzes.add(quiz)
  return quiz
}

export async function listQuizzes(opts: { subjectId?: string } = {}): Promise<Quiz[]> {
  let list = await db.quizzes.toArray()
  if (opts.subjectId) list = list.filter((q) => q.subjectId === opts.subjectId)
  return list.sort((a, b) => b.createdAt - a.createdAt)
}

export async function deleteQuiz(id: string): Promise<void> {
  await db.quizzes.delete(id)
}

// ─── Checklists ───────────────────────────────────────────────────────────────

export async function saveChecklist(input: {
  title: string
  projectId?: string
  items: string[] | ChecklistItem[]
  source: string
}): Promise<Checklist> {
  const items: ChecklistItem[] = input.items.map((it) =>
    typeof it === 'string' ? { id: createId(), text: it, done: false } : it,
  )
  const now = Date.now()
  const checklist: Checklist = {
    id: createId(),
    title: input.title.trim() || 'Checklist',
    items,
    source: input.source,
    createdAt: now,
    updatedAt: now,
    ...(input.projectId ? { projectId: input.projectId } : {}),
  }
  await db.checklists.add(checklist)
  return checklist
}

export async function listChecklists(opts: { projectId?: string } = {}): Promise<Checklist[]> {
  let list = await db.checklists.toArray()
  if (opts.projectId) list = list.filter((c) => c.projectId === opts.projectId)
  return list.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function toggleChecklistItem(checklistId: string, itemId: string): Promise<void> {
  const c = await db.checklists.get(checklistId)
  if (!c) return
  const items = c.items.map((it) => (it.id === itemId ? { ...it, done: !it.done } : it))
  await db.checklists.update(checklistId, { items, updatedAt: Date.now() })
}

export async function deleteChecklist(id: string): Promise<void> {
  await db.checklists.delete(id)
}
