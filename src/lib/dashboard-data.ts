/**
 * Agrégations transverses pour le tableau de bord et les espaces de travail.
 * Lit le contenu des documents Calendrier (page.moduleData) sans dépendre
 * du module lui-même (parsing JSON défensif).
 */
import { db } from '../db'

export interface UpcomingEvent {
  id: string
  notebookId: string
  title: string
  date: string
  startTime?: string
  color: string
  subjectId?: string
}

function todayISO(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

interface RawEvent {
  id?: string
  title?: string
  date?: string
  startTime?: string
  color?: string
  subjectId?: string
}

/**
 * Événements futurs (date ≥ aujourd'hui) de tous les calendriers, triés par
 * date+heure. Filtre optionnel par matière. `limit` borne le résultat.
 */
export async function upcomingEvents(
  limit = 10,
  opts: { subjectId?: string } = {},
): Promise<UpcomingEvent[]> {
  const today = todayISO()
  const calendars = await db.notebooks.filter((n) => n.type === 'calendar' && !n.deletedAt).toArray()
  const out: UpcomingEvent[] = []

  for (const nb of calendars) {
    const page = await db.pages.where('notebookId').equals(nb.id).first()
    if (!page?.moduleData) continue
    let events: RawEvent[]
    try {
      const parsed = JSON.parse(page.moduleData) as { events?: RawEvent[] }
      events = Array.isArray(parsed.events) ? parsed.events : []
    } catch {
      continue
    }
    for (const e of events) {
      if (!e.date || typeof e.title !== 'string' || e.date < today) continue
      if (opts.subjectId && e.subjectId !== opts.subjectId) continue
      out.push({
        id: `${nb.id}:${e.id ?? e.title}`,
        notebookId: nb.id,
        title: e.title,
        date: e.date,
        ...(e.startTime ? { startTime: e.startTime } : {}),
        color: typeof e.color === 'string' ? e.color : '#3b82f6',
        ...(e.subjectId ? { subjectId: e.subjectId } : {}),
      })
    }
  }

  out.sort((a, b) =>
    a.date !== b.date ? a.date.localeCompare(b.date) : (a.startTime ?? '').localeCompare(b.startTime ?? ''),
  )
  return out.slice(0, limit)
}
