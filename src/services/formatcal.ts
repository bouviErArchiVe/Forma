import { db } from '../db'
import { DEFAULT_FC_SETTINGS } from '../lib/formatcal/constants'
import { cloneEvent, createEvent } from '../lib/formatcal/model'
import type { FormaCalEvent, FormaCalSettings } from '../types'

const SETTINGS_KEY = 'formatcal-settings'

export async function listEvents(): Promise<FormaCalEvent[]> {
  return db.formaCalEvents.orderBy('startAt').toArray()
}

export async function getEvent(id: string): Promise<FormaCalEvent | undefined> {
  return db.formaCalEvents.get(id)
}

export async function upsertEvent(event: FormaCalEvent): Promise<FormaCalEvent> {
  const next = { ...event, updatedAt: Date.now() }
  await db.formaCalEvents.put(next)
  return next
}

export async function createAndSaveEvent(partial: Partial<FormaCalEvent> = {}): Promise<FormaCalEvent> {
  return upsertEvent(createEvent(partial))
}

export async function deleteEvent(id: string): Promise<void> {
  await db.formaCalEvents.delete(id)
}

export async function duplicateEvent(id: string): Promise<FormaCalEvent | null> {
  const ev = await getEvent(id)
  if (!ev) return null
  const copy = cloneEvent(ev)
  await db.formaCalEvents.add(copy)
  return copy
}

export async function moveEvent(
  id: string,
  newStartAt: number,
  newEndAt?: number,
): Promise<FormaCalEvent | null> {
  const ev = await getEvent(id)
  if (!ev) return null
  const duration = (ev.endAt || ev.startAt) - ev.startAt
  const start = newStartAt
  const end = newEndAt ?? start + duration
  return upsertEvent({ ...ev, startAt: start, endAt: end })
}

export async function getSettings(): Promise<FormaCalSettings> {
  const row = await db.settings.get(SETTINGS_KEY)
  if (!row?.value) return { ...DEFAULT_FC_SETTINGS }
  try {
    return { ...DEFAULT_FC_SETTINGS, ...JSON.parse(row.value) }
  } catch {
    return { ...DEFAULT_FC_SETTINGS }
  }
}

export async function updateSettings(patch: Partial<FormaCalSettings>): Promise<FormaCalSettings> {
  const current = await getSettings()
  const next = { ...current, ...patch }
  await db.settings.put({ key: SETTINGS_KEY, value: JSON.stringify(next) })
  return next
}

let saveTimer: ReturnType<typeof setTimeout> | null = null

export function autosaveEvent(event: FormaCalEvent, delay = 500): Promise<FormaCalEvent> {
  return new Promise((resolve) => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      void upsertEvent(event).then(resolve)
    }, delay)
  })
}
