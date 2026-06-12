/**
 * presence-data — types et helpers purs du module Présence (Forma V2).
 *
 * Les dates de séance sont des chaînes locales `YYYY-MM-DD` (jamais
 * Date.toISOString(), qui décale selon le fuseau).
 *
 * Convention statistique : un RETARD compte comme une présence dans le
 * calcul du taux (`presentPct = (present + late) / total`) — l'étudiant
 * était là, juste en retard. Les retards restent comptés à part dans
 * `late` pour l'affichage.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type AttendanceStatus = 'present' | 'absent' | 'late'

export interface Session {
  id: string
  /** Matière associée (id d'un notebook 'subject') — optionnel. */
  subjectId?: string
  /** Libellé affiché (nom de la matière ou saisie libre). */
  subjectLabel: string
  /** Date locale `YYYY-MM-DD`. */
  date: string
  status: AttendanceStatus
  note?: string
}

export interface PresenceState {
  v: 1
  sessions: Session[]
}

// ─── (Dé)sérialisation ────────────────────────────────────────────────────────

export function parsePresenceState(json: string): PresenceState {
  if (json) {
    try {
      const parsed = JSON.parse(json) as Partial<PresenceState> | null
      if (parsed && Array.isArray(parsed.sessions)) {
        return { v: 1, sessions: parsed.sessions }
      }
    } catch {
      // JSON corrompu → état vierge (le module reste utilisable)
    }
  }
  return { v: 1, sessions: [] }
}

export function serializePresenceState(state: PresenceState): string {
  return JSON.stringify(state)
}

// ─── Dates locales ────────────────────────────────────────────────────────────

/** Aujourd'hui en `YYYY-MM-DD` local (jamais toISOString). */
export function todayISO(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// ─── Statistiques ─────────────────────────────────────────────────────────────

export interface AttendanceStats {
  total: number
  present: number
  absent: number
  late: number
  /** Taux de présence 0-100 arrondi — retard compté comme présent. 0 si vide. */
  presentPct: number
}

export interface SubjectStats extends AttendanceStats {
  /** Clé de regroupement : subjectId si présent, sinon libellé. */
  key: string
  label: string
  subjectId?: string
}

function computeStats(sessions: Session[]): AttendanceStats {
  const total = sessions.length
  const present = sessions.filter((s) => s.status === 'present').length
  const absent = sessions.filter((s) => s.status === 'absent').length
  const late = sessions.filter((s) => s.status === 'late').length
  // Retard = présent pour le taux ; total 0 → 0 (jamais NaN).
  const presentPct = total === 0 ? 0 : Math.round(((present + late) / total) * 100)
  return { total, present, absent, late, presentPct }
}

/** Clé de regroupement par matière : id de la matière, sinon libellé. */
export function subjectKey(session: Session): string {
  return session.subjectId ?? `label:${session.subjectLabel.trim().toLowerCase()}`
}

/**
 * Statistiques globales + par matière, triées par libellé.
 * Liste vide → tous compteurs à 0 (presentPct = 0, jamais NaN).
 */
export function attendanceStats(sessions: Session[]): {
  global: AttendanceStats
  bySubject: SubjectStats[]
} {
  const groups = new Map<string, Session[]>()
  for (const s of sessions) {
    const key = subjectKey(s)
    const list = groups.get(key)
    if (list) list.push(s)
    else groups.set(key, [s])
  }
  const bySubject: SubjectStats[] = [...groups.entries()].map(([key, list]) => {
    const first = list[0]
    return {
      key,
      label: first.subjectLabel,
      ...(first.subjectId ? { subjectId: first.subjectId } : {}),
      ...computeStats(list),
    }
  })
  bySubject.sort((a, b) => a.label.localeCompare(b.label))
  return { global: computeStats(sessions), bySubject }
}

// ─── Tri & cycle de statut ────────────────────────────────────────────────────

/** Séances triées par date décroissante (récentes d'abord), stable. */
export function sortByDateDesc(sessions: Session[]): Session[] {
  return sessions.slice().sort((a, b) => b.date.localeCompare(a.date))
}

/** Cycle au clic sur un badge de statut : present → absent → late → present. */
export function cycleStatus(status: AttendanceStatus): AttendanceStatus {
  if (status === 'present') return 'absent'
  if (status === 'absent') return 'late'
  return 'present'
}
