/** FORMATCAL — modèle événements et calendrier */

import { FC_CATEGORIES, FC_PRESETS } from './constants'

function uid(prefix = 'fc') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function getCategoryMeta(id) {
  return FC_CATEGORIES.find((c) => c.id === id) || FC_CATEGORIES[0]
}

export function getPresetMeta(id) {
  return FC_PRESETS.find((p) => p.id === id) || null
}

export function createChecklistItem(text = '') {
  return { id: uid('chk'), text, done: false }
}

export function createEvent(partial = {}) {
  const now = Date.now()
  const preset = partial.presetId ? getPresetMeta(partial.presetId) : null
  const cat = partial.category || preset?.category || 'school'
  const meta = getCategoryMeta(cat)
  const start = partial.startAt ?? now + 3600000
  const durationMs = (partial.durationMin ?? preset?.durationMin ?? 60) * 60000

  return {
    id: uid('ev'),
    title: partial.title || preset?.label || 'Nouvel événement',
    description: partial.description || '',
    startAt: start,
    endAt: partial.endAt ?? start + durationMs,
    allDay: !!partial.allDay,
    category: cat,
    presetId: partial.presetId || null,
    color: partial.color || meta.color,
    icon: partial.icon || preset?.icon || meta.icon,
    priority: partial.priority || 'normal',
    status: partial.status || 'todo',
    tags: partial.tags || [],
    reminderOffsets: partial.reminderOffsets || [15],
    recurrence: partial.recurrence || null,
    attachments: partial.attachments || [],
    links: partial.links || {},
    checklist: partial.checklist || [],
    completed: !!partial.completed,
    createdAt: now,
    updatedAt: now,
  }
}

export function cloneEvent(ev, patch = {}) {
  const now = Date.now()
  return {
    ...JSON.parse(JSON.stringify(ev)),
    id: uid('ev'),
    title: patch.title || `${ev.title} (copie)`,
    createdAt: now,
    updatedAt: now,
    ...patch,
  }
}

export function updateEvent(ev, patch) {
  return { ...ev, ...patch, updatedAt: Date.now() }
}

export function toggleChecklistItem(ev, itemId) {
  return updateEvent(ev, {
    checklist: ev.checklist.map((c) => (c.id === itemId ? { ...c, done: !c.done } : c)),
  })
}

export function checklistProgress(ev) {
  const list = ev.checklist || []
  if (!list.length) return ev.completed ? 100 : 0
  const done = list.filter((c) => c.done).length
  return Math.round((done / list.length) * 100)
}

export function createCalendarState() {
  return {
    version: 1,
    settings: {
      weekStartsOn: 1,
      defaultView: 'month',
      defaultReminder: 15,
    },
    events: [],
  }
}

export function normalizeCalendarState(raw) {
  if (!raw) return createCalendarState()
  let data = raw
  if (typeof data === 'string') {
    try { data = JSON.parse(data) } catch { return createCalendarState() }
  }
  return {
    ...createCalendarState(),
    ...data,
    events: (data.events || []).map((e) => ({
      checklist: [],
      attachments: [],
      links: {},
      tags: [],
      reminderOffsets: [15],
      ...e,
    })),
  }
}

export function eventOverlapsDay(ev, dayStart) {
  const d0 = new Date(dayStart).setHours(0, 0, 0, 0)
  const d1 = d0 + 86400000
  const s = ev.startAt
  const e = ev.endAt || ev.startAt
  return s < d1 && e >= d0
}

export function isEventLate(ev) {
  if (ev.status === 'done' || ev.completed) return false
  return (ev.endAt || ev.startAt) < Date.now()
}

export function autoStatus(ev) {
  if (ev.completed || ev.status === 'done') return 'done'
  if (isEventLate(ev)) return 'late'
  return ev.status || 'todo'
}
