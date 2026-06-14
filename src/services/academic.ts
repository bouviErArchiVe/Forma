/**
 * Service session académique — CRUD Dexie + calcul des semaines.
 *
 * Une session (Automne / Hiver / Été) commence un lundi (semaine 1) et dure
 * N semaines (15 par défaut). Les calculs de semaines sont purs et testables.
 */
import { db } from '../db'
import { createId } from '../lib/id'
import type { AcademicSession, AcademicTerm } from '../types'

export const TERM_LABELS: Record<AcademicTerm, string> = {
  automne: 'Automne',
  hiver: 'Hiver',
  ete: 'Été',
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** `YYYY-MM-DD` local d'une Date (jamais toISOString). */
function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/** `YYYY-MM-DD` → Date à midi local. */
function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0)
}

export function todayISO(): string {
  return toISO(new Date())
}

/** Lundi de la semaine contenant `iso`. */
export function startOfWeek(iso: string): string {
  const d = parseISO(iso)
  const offset = (d.getDay() + 6) % 7 // lundi = 0
  d.setDate(d.getDate() - offset)
  return toISO(d)
}

function addDays(iso: string, n: number): string {
  const d = parseISO(iso)
  d.setDate(d.getDate() + n)
  return toISO(d)
}

export interface WeekInfo {
  /** Numéro de semaine (1-based) ; null si hors session. */
  week: number | null
  /** Progression 0-100 (0 avant, 100 après). */
  progress: number
  /** Total de semaines de la session. */
  totalWeeks: number
}

/**
 * Numéro de semaine et progression d'une session pour une date donnée.
 * `today` injecté pour la testabilité.
 */
export function weekInfo(session: AcademicSession, today = todayISO()): WeekInfo {
  const start = startOfWeek(session.startDate)
  const todayWeekStart = startOfWeek(today)
  const diffDays = Math.round(
    (parseISO(todayWeekStart).getTime() - parseISO(start).getTime()) / 86_400_000,
  )
  const weekIndex = Math.floor(diffDays / 7) // 0-based
  const totalWeeks = session.weeks
  if (weekIndex < 0) return { week: null, progress: 0, totalWeeks }
  if (weekIndex >= totalWeeks) return { week: null, progress: 100, totalWeeks }
  return {
    week: weekIndex + 1,
    progress: Math.round(((weekIndex + 1) / totalWeeks) * 100),
    totalWeeks,
  }
}

/** Intervalle de dates `[lundi, dimanche]` d'une semaine donnée (1-based). */
export function weekRange(session: AcademicSession, week: number): { start: string; end: string } {
  const start = addDays(startOfWeek(session.startDate), (week - 1) * 7)
  return { start, end: addDays(start, 6) }
}

// ─── CRUD ──────────────────────────────────────────────────────────────────────

export interface CreateSessionInput {
  term: AcademicTerm
  year: number
  startDate: string
  weeks?: number
}

export async function createSession(input: CreateSessionInput): Promise<AcademicSession> {
  const now = Date.now()
  // Une seule session courante : désactive les autres.
  const existing = await db.academicSessions.toArray()
  for (const s of existing) {
    if (s.current) await db.academicSessions.update(s.id, { current: false })
  }
  const session: AcademicSession = {
    id: createId(),
    term: input.term,
    year: input.year,
    startDate: input.startDate,
    weeks: input.weeks ?? 15,
    current: true,
    createdAt: now,
    updatedAt: now,
  }
  await db.academicSessions.add(session)
  return session
}

export async function updateSession(
  id: string,
  patch: Partial<Omit<AcademicSession, 'id' | 'createdAt'>>,
): Promise<void> {
  await db.academicSessions.update(id, { ...patch, updatedAt: Date.now() })
}

export async function deleteSession(id: string): Promise<void> {
  await db.academicSessions.delete(id)
}

export async function listSessions(): Promise<AcademicSession[]> {
  return (await db.academicSessions.toArray()).sort((a, b) => b.updatedAt - a.updatedAt)
}

/** Session active (la plus récemment marquée current), ou undefined. */
export async function currentSession(): Promise<AcademicSession | undefined> {
  const all = await listSessions()
  return all.find((s) => s.current) ?? all[0]
}

/** Libellé affichable « Automne 2026 ». */
export function sessionLabel(session: AcademicSession): string {
  return `${TERM_LABELS[session.term]} ${session.year}`
}
