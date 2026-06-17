/**
 * goals.ts — objectifs académiques : construction, progression, état dérivé.
 *
 * Logique PURE et déterministe (aucune dépendance Dexie/React). Le service
 * src/services/goals.ts persiste les objets renvoyés ici. Un objectif est un
 * compteur `progress` vers une cible `target` (> 0), avec échéance optionnelle.
 * Le pourcentage, l'état (atteint / en retard) et l'agrégat sont calculés ici
 * et jamais stockés (sauf `completedAt`, figé au moment de l'atteinte).
 */
import type { AcademicGoal } from '../../types'
import { createId } from '../id'

export interface BuildGoalInput {
  title: string
  subjectId?: string
  target: number
  /** Progression initiale (défaut 0). */
  progress?: number
  unit?: string
  /** Échéance locale `YYYY-MM-DD`. */
  dueDate?: string
  createdAt: number
}

export interface BuildGoalOptions {
  idFn?: () => string
}

/**
 * Construit un objectif valide. `target` est forcé ≥ 1 (un objectif sans cible
 * positive n'a pas de sens), `progress` borné à [0, target]. Si la progression
 * atteint d'emblée la cible, `completedAt` est figé sur `createdAt`. PURE.
 */
export function buildGoal(input: BuildGoalInput, opts: BuildGoalOptions = {}): AcademicGoal {
  const id = (opts.idFn ?? createId)()
  const target = Math.max(1, Math.round(input.target))
  const progress = clamp(Math.round(input.progress ?? 0), 0, target)
  const title = input.title.trim() || 'Objectif'
  const unit = input.unit?.trim()
  const dueDate = input.dueDate?.trim()
  const reached = progress >= target
  return {
    id,
    title,
    target,
    progress,
    ...(input.subjectId ? { subjectId: input.subjectId } : {}),
    ...(unit ? { unit } : {}),
    ...(dueDate ? { dueDate } : {}),
    ...(reached ? { completedAt: input.createdAt } : {}),
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  }
}

export interface GoalPatch {
  title?: string
  subjectId?: string | undefined
  target?: number
  progress?: number
  unit?: string | undefined
  dueDate?: string | undefined
}

/**
 * Applique un patch à un objectif et renvoie une nouvelle version cohérente :
 * `target` reste ≥ 1, `progress` borné à la cible, `completedAt` figé/effacé
 * selon que la cible est atteinte. `updatedAt` rafraîchi avec `now`. PURE.
 */
export function applyGoalPatch(
  goal: AcademicGoal,
  patch: GoalPatch,
  now: number,
): AcademicGoal {
  const target = patch.target !== undefined ? Math.max(1, Math.round(patch.target)) : goal.target
  const rawProgress = patch.progress !== undefined ? Math.round(patch.progress) : goal.progress
  const progress = clamp(rawProgress, 0, target)

  const next: AcademicGoal = {
    ...goal,
    target,
    progress,
    updatedAt: now,
  }

  if (patch.title !== undefined) next.title = patch.title.trim() || goal.title
  if ('subjectId' in patch) setOptional(next, 'subjectId', patch.subjectId)
  if ('unit' in patch) setOptional(next, 'unit', patch.unit?.trim() || undefined)
  if ('dueDate' in patch) setOptional(next, 'dueDate', patch.dueDate?.trim() || undefined)

  const reached = progress >= target
  if (reached) {
    next.completedAt = goal.completedAt ?? now
  } else {
    delete next.completedAt
  }
  return next
}

/** Incrémente la progression (peut être négatif), borné à [0, target]. PURE. */
export function adjustProgress(goal: AcademicGoal, delta: number, now: number): AcademicGoal {
  return applyGoalPatch(goal, { progress: goal.progress + delta }, now)
}

// ─── État dérivé ─────────────────────────────────────────────────────────────

export type GoalStatus = 'done' | 'overdue' | 'active'

export interface GoalView {
  /** Pourcentage 0-100 arrondi (target garanti > 0). */
  percent: number
  /** Cible atteinte. */
  done: boolean
  /** Échéance dépassée et non atteinte. */
  overdue: boolean
  status: GoalStatus
  /** Jours restants jusqu'à l'échéance (négatif si dépassée), null sans échéance. */
  daysLeft: number | null
}

/**
 * État dérivé d'un objectif à une date donnée. `today` au format `YYYY-MM-DD`
 * (par défaut le jour courant local). PURE.
 */
export function goalView(goal: AcademicGoal, today: string = todayISO()): GoalView {
  const percent = goal.target > 0 ? clamp(Math.round((goal.progress / goal.target) * 100), 0, 100) : 0
  const done = goal.progress >= goal.target
  const daysLeft = goal.dueDate ? daysBetween(today, goal.dueDate) : null
  const overdue = !done && daysLeft !== null && daysLeft < 0
  const status: GoalStatus = done ? 'done' : overdue ? 'overdue' : 'active'
  return { percent, done, overdue, status, daysLeft }
}

export interface GoalsSummary {
  total: number
  done: number
  active: number
  overdue: number
  /** Pourcentage de complétion moyen sur tous les objectifs (0-100). */
  averagePercent: number
}

export const EMPTY_GOALS_SUMMARY: GoalsSummary = {
  total: 0,
  done: 0,
  active: 0,
  overdue: 0,
  averagePercent: 0,
}

/** Agrège l'état d'une liste d'objectifs. PURE. */
export function summarizeGoals(goals: AcademicGoal[], today: string = todayISO()): GoalsSummary {
  if (goals.length === 0) return EMPTY_GOALS_SUMMARY
  let done = 0
  let overdue = 0
  let sumPercent = 0
  for (const g of goals) {
    const v = goalView(g, today)
    sumPercent += v.percent
    if (v.status === 'done') done += 1
    else if (v.status === 'overdue') overdue += 1
  }
  return {
    total: goals.length,
    done,
    overdue,
    active: goals.length - done - overdue,
    averagePercent: Math.round(sumPercent / goals.length),
  }
}

// ─── Dates (local, jamais toISOString) ─────────────────────────────────────────

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** Date locale du jour `YYYY-MM-DD`. */
export function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function parseISO(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0).getTime()
}

/** Jours entiers de `from` à `to` (positif si `to` est dans le futur). */
function daysBetween(from: string, to: string): number {
  return Math.round((parseISO(to) - parseISO(from)) / 86_400_000)
}

// ─── Helpers internes ─────────────────────────────────────────────────────────

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

/** Pose ou retire une propriété optionnelle (évite `key: undefined` persisté). */
function setOptional<K extends keyof AcademicGoal>(
  obj: AcademicGoal,
  key: K,
  value: AcademicGoal[K] | undefined,
): void {
  if (value === undefined) delete obj[key]
  else obj[key] = value
}
