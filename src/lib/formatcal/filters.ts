import type { FormaCalEvent } from '../../types'
import { startOfDayTs } from './dates'
import { autoStatus, eventOverlapsDay } from './model'

export interface EventFilters {
  query?: string
  category?: string
  status?: string
  priority?: string
  tag?: string
  from?: number | null
  to?: number | null
}

export function filterEvents(events: FormaCalEvent[], filters: EventFilters = {}): FormaCalEvent[] {
  const {
    query = '',
    category = 'all',
    status = 'all',
    priority = 'all',
    tag = '',
    from = null,
    to = null,
  } = filters
  const q = String(query || '').trim().toLowerCase()
  return events.filter((ev) => {
    if (category !== 'all' && ev.category !== category) return false
    const st = autoStatus(ev)
    if (status !== 'all' && st !== status) return false
    if (priority !== 'all' && ev.priority !== priority) return false
    if (tag && !(ev.tags || []).includes(tag)) return false
    if (from != null && (ev.endAt || ev.startAt) < from) return false
    if (to != null && ev.startAt > to) return false
    if (q) {
      const hay = [ev.title, ev.description, ...(ev.tags || [])].join(' ').toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
}

export function sortEvents(events: FormaCalEvent[], by = 'date'): FormaCalEvent[] {
  const copy = [...events]
  if (by === 'priority') {
    const rank: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 }
    copy.sort((a, b) => (rank[a.priority] ?? 9) - (rank[b.priority] ?? 9) || a.startAt - b.startAt)
    return copy
  }
  if (by === 'category') {
    copy.sort((a, b) => a.category.localeCompare(b.category) || a.startAt - b.startAt)
    return copy
  }
  copy.sort((a, b) => a.startAt - b.startAt)
  return copy
}

export function eventsForDay(events: FormaCalEvent[], dayTs: number): FormaCalEvent[] {
  const dayStart = startOfDayTs(dayTs)
  return events.filter((ev) => eventOverlapsDay(ev, dayStart))
}

export function eventsForMonth(events: FormaCalEvent[], monthTs: number): FormaCalEvent[] {
  const d = new Date(monthTs)
  const from = new Date(d.getFullYear(), d.getMonth(), 1).getTime()
  const to = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).getTime()
  return events.filter((ev) => ev.startAt <= to && (ev.endAt || ev.startAt) >= from)
}

export function deadlineEvents(events: FormaCalEvent[]): FormaCalEvent[] {
  return events.filter((ev) => ['deadline', 'exam', 'homework'].includes(ev.category))
}

export function projectEvents(events: FormaCalEvent[]): FormaCalEvent[] {
  return events.filter((ev) => ['project', 'architecture'].includes(ev.category))
}

export function allTags(events: FormaCalEvent[]): string[] {
  const set = new Set<string>()
  events.forEach((ev) => (ev.tags || []).forEach((t) => set.add(t)))
  return [...set].sort()
}

export function todayEvents(events: FormaCalEvent[]): FormaCalEvent[] {
  return eventsForDay(events, Date.now())
}

export function upcomingEvents(events: FormaCalEvent[], limit = 8): FormaCalEvent[] {
  const now = Date.now()
  return events
    .filter((ev) => (ev.endAt || ev.startAt) >= now && !ev.completed)
    .sort((a, b) => a.startAt - b.startAt)
    .slice(0, limit)
}
