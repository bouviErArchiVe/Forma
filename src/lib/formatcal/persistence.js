import { createSafePersistStorage } from '@/lib/storage'
import { createCalendarState, normalizeCalendarState, createEvent, cloneEvent } from './model'

const KEY = 'forma-formatcal'

function readState() {
  try {
    const raw = createSafePersistStorage().getItem(KEY)
    return normalizeCalendarState(raw ? JSON.parse(raw) : null)
  } catch {
    return createCalendarState()
  }
}

function writeState(state) {
  createSafePersistStorage().setItem(KEY, JSON.stringify(state))
}

export function loadCalendar() {
  return readState()
}

export function saveCalendar(state) {
  const next = { ...state, updatedAt: Date.now() }
  writeState(next)
  return next
}

export function listEvents() {
  return readState().events.sort((a, b) => a.startAt - b.startAt)
}

export function getEvent(id) {
  return readState().events.find((e) => e.id === id) || null
}

export function upsertEvent(event) {
  const state = readState()
  const idx = state.events.findIndex((e) => e.id === event.id)
  const next = { ...event, updatedAt: Date.now() }
  if (idx >= 0) state.events[idx] = next
  else state.events.push(next)
  return saveCalendar(state)
}

export function createAndSaveEvent(partial) {
  return upsertEvent(createEvent(partial))
}

export function deleteEvent(id) {
  const state = readState()
  state.events = state.events.filter((e) => e.id !== id)
  return saveCalendar(state)
}

export function duplicateEvent(id) {
  const ev = getEvent(id)
  if (!ev) return null
  return upsertEvent(cloneEvent(ev))
}

export function moveEvent(id, newStartAt, newEndAt) {
  const ev = getEvent(id)
  if (!ev) return null
  const duration = (ev.endAt || ev.startAt) - ev.startAt
  const start = newStartAt
  const end = newEndAt ?? start + duration
  return upsertEvent({ ...ev, startAt: start, endAt: end })
}

let saveTimer = null
export function autosaveCalendar(state, delay = 500) {
  return new Promise((resolve) => {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => resolve(saveCalendar(state)), delay)
  })
}

export function updateSettings(patch) {
  const state = readState()
  state.settings = { ...state.settings, ...patch }
  return saveCalendar(state)
}
