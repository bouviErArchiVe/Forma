/**
 * calendar-data — types et helpers purs du module Calendrier (Forma V2).
 *
 * Toutes les dates sont des chaînes locales `YYYY-MM-DD` (jamais
 * Date.toISOString(), qui décale selon le fuseau). Les conversions Date
 * passent par midi local pour éviter les surprises de changement d'heure.
 * Les heures sont des chaînes `HH:mm` — le tri lexicographique suffit.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CalendarEvent {
  id: string
  title: string
  /** Date locale `YYYY-MM-DD`. */
  date: string
  /** Heure de début `HH:mm` — absent = événement « toute la journée ». */
  startTime?: string
  endTime?: string
  description?: string
  /** Couleur de la pastille (hex). */
  color: string
  /** Matière associée (id d'un notebook de type 'subject'). */
  subjectId?: string
  /** Document lié (id d'un notebook) — navigation /document/:id. */
  linkedDocId?: string
}

export interface CalendarState {
  v: 1
  events: CalendarEvent[]
}

/** Palette des 6 pastilles proposées à la création d'un événement. */
export const EVENT_COLORS = [
  '#3b82f6', // bleu
  '#10b981', // vert
  '#f59e0b', // ambre
  '#ef4444', // rouge
  '#8b5cf6', // violet
  '#ec4899', // rose
] as const

// ─── (Dé)sérialisation ────────────────────────────────────────────────────────

export function parseCalendarState(json: string): CalendarState {
  if (json) {
    try {
      const parsed = JSON.parse(json) as Partial<CalendarState> | null
      if (parsed && Array.isArray(parsed.events)) {
        return { v: 1, events: parsed.events }
      }
    } catch {
      // JSON corrompu → état vierge (le module reste utilisable)
    }
  }
  return { v: 1, events: [] }
}

export function serializeCalendarState(state: CalendarState): string {
  return JSON.stringify(state)
}

// ─── Dates locales YYYY-MM-DD ────────────────────────────────────────────────

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** Date → `YYYY-MM-DD` en heure locale (jamais toISOString). */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/** `YYYY-MM-DD` → Date à midi local (évite les bascules DST à minuit). */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0)
}

export function todayISO(): string {
  return toISODate(new Date())
}

export function addDays(iso: string, n: number): string {
  const d = parseISODate(iso)
  d.setDate(d.getDate() + n)
  return toISODate(d)
}

/**
 * Décale de `n` mois en conservant le jour quand c'est possible,
 * sinon clampe au dernier jour du mois cible (31 janv. +1 → 28/29 févr.).
 */
export function addMonths(iso: string, n: number): string {
  const d = parseISODate(iso)
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1, 12)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(d.getDate(), lastDay))
  return toISODate(target)
}

/** Lundi de la semaine contenant `iso` (semaines lundi → dimanche). */
export function startOfWeek(iso: string): string {
  const d = parseISODate(iso)
  const offset = (d.getDay() + 6) % 7 // lundi = 0 … dimanche = 6
  d.setDate(d.getDate() - offset)
  return toISODate(d)
}

/** Les 7 jours (lundi → dimanche) de la semaine contenant `iso`. */
export function weekDays(iso: string): string[] {
  const monday = startOfWeek(iso)
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

// ─── Grille mensuelle ─────────────────────────────────────────────────────────

export interface MonthCell {
  /** Date locale `YYYY-MM-DD` de la case. */
  iso: string
  /** Jour du mois (1-31) — pour l'affichage. */
  day: number
  /** false pour les jours des mois adjacents qui complètent la grille. */
  inMonth: boolean
}

/**
 * Grille 7×6 (42 cases) du mois donné, alignée sur des semaines
 * lundi → dimanche. `month` est 1-12 (pas l'indexation 0-11 de Date).
 */
export function monthGrid(year: number, month: number): MonthCell[] {
  let cursor = startOfWeek(`${year}-${pad2(month)}-01`)
  const cells: MonthCell[] = []
  for (let i = 0; i < 42; i++) {
    const d = parseISODate(cursor)
    cells.push({
      iso: cursor,
      day: d.getDate(),
      inMonth: d.getFullYear() === year && d.getMonth() + 1 === month,
    })
    cursor = addDays(cursor, 1)
  }
  return cells
}

// ─── Requêtes événements ──────────────────────────────────────────────────────

/**
 * Tri chronologique intra-journée : les événements sans heure
 * (« toute la journée ») d'abord, puis par heure de début, puis par titre.
 */
export function compareByTime(a: CalendarEvent, b: CalendarEvent): number {
  const ta = a.startTime ?? ''
  const tb = b.startTime ?? ''
  if (ta !== tb) return ta < tb ? -1 : 1
  return a.title.localeCompare(b.title)
}

/** Événements d'un jour donné, triés par heure. */
export function eventsOnDay(state: CalendarState, isoDate: string): CalendarEvent[] {
  return state.events.filter((e) => e.date === isoDate).sort(compareByTime)
}

/**
 * Événements de la semaine (lundi → dimanche) contenant `anyDateInWeek`,
 * triés par date puis par heure. Bornes incluses.
 */
export function eventsInWeek(state: CalendarState, anyDateInWeek: string): CalendarEvent[] {
  const monday = startOfWeek(anyDateInWeek)
  const sunday = addDays(monday, 6)
  return state.events
    .filter((e) => e.date >= monday && e.date <= sunday)
    .sort((a, b) => (a.date !== b.date ? a.date.localeCompare(b.date) : compareByTime(a, b)))
}
