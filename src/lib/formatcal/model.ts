import { createId } from '../id'
import type {
  FormaCalCategory,
  FormaCalChecklistItem,
  FormaCalEvent,
  FormaCalSettings,
} from '../../types'
import { DEFAULT_FC_SETTINGS, FC_CATEGORIES, FC_PRESETS } from './constants'

export function getCategoryMeta(id: string) {
  return FC_CATEGORIES.find((c) => c.id === id) || FC_CATEGORIES[0]!
}

export function getPresetMeta(id: string) {
  return FC_PRESETS.find((p) => p.id === id) || null
}

export function createChecklistItem(text = ''): FormaCalChecklistItem {
  return { id: createId(), text, done: false }
}

export function createEvent(partial: Partial<FormaCalEvent> = {}): FormaCalEvent {
  const now = Date.now()
  const preset = partial.presetId ? getPresetMeta(partial.presetId) : null
  const cat = (partial.category || preset?.category || 'school') as FormaCalCategory
  const meta = getCategoryMeta(cat)
  const start = partial.startAt ?? now + 3600000
  const durationMin = preset?.durationMin ?? 60
  const durationMs = durationMin * 60000

  return {
    id: createId(),
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

export function cloneEvent(ev: FormaCalEvent, patch: Partial<FormaCalEvent> = {}): FormaCalEvent {
  const now = Date.now()
  return {
    ...structuredClone(ev),
    id: createId(),
    title: patch.title || `${ev.title} (copie)`,
    createdAt: now,
    updatedAt: now,
    ...patch,
  }
}

export function updateEvent(ev: FormaCalEvent, patch: Partial<FormaCalEvent>): FormaCalEvent {
  return { ...ev, ...patch, updatedAt: Date.now() }
}

export function checklistProgress(ev: FormaCalEvent): number {
  const list = ev.checklist || []
  if (!list.length) return ev.completed ? 100 : 0
  const done = list.filter((c) => c.done).length
  return Math.round((done / list.length) * 100)
}

export function defaultSettings(): FormaCalSettings {
  return { ...DEFAULT_FC_SETTINGS }
}

export function normalizeEvent(raw: Partial<FormaCalEvent>): FormaCalEvent {
  const base = createEvent()
  return {
    ...base,
    ...raw,
    checklist: raw.checklist || [],
    attachments: raw.attachments || [],
    links: raw.links || {},
    tags: raw.tags || [],
    reminderOffsets: raw.reminderOffsets?.length ? raw.reminderOffsets : [15],
  }
}

export function eventOverlapsDay(ev: FormaCalEvent, dayStart: number): boolean {
  const d0 = new Date(dayStart).setHours(0, 0, 0, 0)
  const d1 = d0 + 86400000
  const s = ev.startAt
  const e = ev.endAt || ev.startAt
  return s < d1 && e >= d0
}

export function isEventLate(ev: FormaCalEvent): boolean {
  if (ev.status === 'done' || ev.completed) return false
  return (ev.endAt || ev.startAt) < Date.now()
}

export function autoStatus(ev: FormaCalEvent): FormaCalEvent['status'] {
  if (ev.completed || ev.status === 'done') return 'done'
  if (isEventLate(ev)) return 'late'
  return ev.status || 'todo'
}
