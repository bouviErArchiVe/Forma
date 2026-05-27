/** FORMATCAL — recherche, filtres, tri */

import { autoStatus, eventOverlapsDay } from './model'
import { startOfDayTs } from './dates'

export function filterEvents(events, {
  query = '',
  category = 'all',
  status = 'all',
  priority = 'all',
  tag = '',
  from = null,
  to = null,
} = {}) {
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

export function sortEvents(events, by = 'date') {
  const copy = [...events]
  if (by === 'priority') {
    const rank = { urgent: 0, high: 1, normal: 2, low: 3 }
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

export function eventsForDay(events, dayTs) {
  const dayStart = startOfDayTs(dayTs)
  return events.filter((ev) => eventOverlapsDay(ev, dayStart))
}

export function eventsForMonth(events, monthTs) {
  const d = new Date(monthTs)
  const from = new Date(d.getFullYear(), d.getMonth(), 1).getTime()
  const to = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).getTime()
  return events.filter((ev) => ev.startAt <= to && (ev.endAt || ev.startAt) >= from)
}

export function deadlineEvents(events) {
  return events.filter((ev) => ['deadline', 'exam', 'homework'].includes(ev.category))
}

export function projectEvents(events) {
  return events.filter((ev) => ['project', 'architecture'].includes(ev.category))
}

export function allTags(events) {
  const set = new Set()
  events.forEach((ev) => (ev.tags || []).forEach((t) => set.add(t)))
  return [...set].sort()
}

export function todayEvents(events) {
  return eventsForDay(events, Date.now())
}

export function upcomingEvents(events, limit = 8) {
  const now = Date.now()
  return events.filter((ev) => (ev.endAt || ev.startAt) >= now && !ev.completed)
    .sort((a, b) => a.startAt - b.startAt)
    .slice(0, limit)
}
