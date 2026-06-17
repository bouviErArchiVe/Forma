/**
 * Service objectifs académiques — CRUD Dexie (table `academicGoals`, additive
 * v16) + suivi de progression.
 *
 * La logique pure (construction, bornes, état dérivé) vit dans
 * src/lib/study/goals.ts ; ce service ne fait que persister les objets renvoyés.
 * Lien matière (`subjectId`, notebook 'subject') optionnel.
 */
import { db } from '../db'
import { applyGoalPatch, buildGoal, type GoalPatch } from '../lib/study/goals'
import type { AcademicGoal } from '../types'

export interface CreateGoalInput {
  title: string
  subjectId?: string
  target: number
  progress?: number
  unit?: string
  /** Échéance locale `YYYY-MM-DD`. */
  dueDate?: string
}

/** Crée et persiste un objectif. */
export async function createGoal(
  input: CreateGoalInput,
  now: number = Date.now(),
): Promise<AcademicGoal> {
  const goal = buildGoal({
    title: input.title,
    target: input.target,
    ...(input.subjectId ? { subjectId: input.subjectId } : {}),
    ...(input.progress !== undefined ? { progress: input.progress } : {}),
    ...(input.unit ? { unit: input.unit } : {}),
    ...(input.dueDate ? { dueDate: input.dueDate } : {}),
    createdAt: now,
  })
  await db.academicGoals.add(goal)
  return goal
}

/**
 * Met à jour un objectif (titre, cible, progression, échéance…) en passant par
 * la logique pure (bornes + `completedAt`). Renvoie la version persistée, ou
 * `undefined` si introuvable.
 */
export async function updateGoal(
  id: string,
  patch: GoalPatch,
  now: number = Date.now(),
): Promise<AcademicGoal | undefined> {
  const goal = await db.academicGoals.get(id)
  if (!goal) return undefined
  const next = applyGoalPatch(goal, patch, now)
  await db.academicGoals.put(next)
  return next
}

/** Ajuste la progression d'un delta (peut être négatif). */
export async function adjustGoalProgress(
  id: string,
  delta: number,
  now: number = Date.now(),
): Promise<AcademicGoal | undefined> {
  const goal = await db.academicGoals.get(id)
  if (!goal) return undefined
  const next = applyGoalPatch(goal, { progress: goal.progress + delta }, now)
  await db.academicGoals.put(next)
  return next
}

export async function deleteGoal(id: string): Promise<void> {
  await db.academicGoals.delete(id)
}

export async function getGoal(id: string): Promise<AcademicGoal | undefined> {
  return db.academicGoals.get(id)
}

export interface ListGoalsOptions {
  subjectId?: string
}

/**
 * Liste les objectifs (tous ou filtrés par matière). Tri : non terminés
 * d'abord, puis par échéance croissante (sans échéance en dernier), puis par
 * récence de mise à jour.
 */
export async function listGoals(opts: ListGoalsOptions = {}): Promise<AcademicGoal[]> {
  let list = await db.academicGoals.toArray()
  if (opts.subjectId) list = list.filter((g) => g.subjectId === opts.subjectId)
  return list.sort((a, b) => {
    const aDone = a.progress >= a.target ? 1 : 0
    const bDone = b.progress >= b.target ? 1 : 0
    if (aDone !== bDone) return aDone - bDone
    if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1
    if (a.dueDate && !b.dueDate) return -1
    if (!a.dueDate && b.dueDate) return 1
    return b.updatedAt - a.updatedAt
  })
}
