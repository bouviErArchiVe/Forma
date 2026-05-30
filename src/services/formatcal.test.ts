import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db'
import { exportEventsIcs } from '../lib/formatcal/export'
import { filterEvents } from '../lib/formatcal/filters'
import { createEvent, eventOverlapsDay } from '../lib/formatcal/model'
import {
  createAndSaveEvent,
  deleteEvent,
  duplicateEvent,
  getSettings,
  listEvents,
  moveEvent,
  updateSettings,
  upsertEvent,
} from './formatcal'

async function resetDb(): Promise<void> {
  db.close()
  await db.delete()
  await db.open()
}

describe('formatcal service', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('creates and lists events', async () => {
    await createAndSaveEvent({ title: 'Jury', category: 'architecture' })
    const list = await listEvents()
    expect(list).toHaveLength(1)
    expect(list[0]?.title).toBe('Jury')
  })

  it('upserts and moves event', async () => {
    const ev = await createAndSaveEvent({ title: 'Studio', startAt: Date.now() })
    const moved = await moveEvent(ev.id, ev.startAt + 86400000)
    expect(moved?.startAt).toBe(ev.startAt + 86400000)
  })

  it('duplicates and deletes event', async () => {
    const ev = await createAndSaveEvent({ title: 'Original' })
    const copy = await duplicateEvent(ev.id)
    expect(copy?.title).toContain('copie')
    expect(await listEvents()).toHaveLength(2)
    await deleteEvent(ev.id)
    expect(await listEvents()).toHaveLength(1)
  })

  it('persists settings', async () => {
    const next = await updateSettings({ defaultView: 'week', weekStartsOn: 0 })
    expect(next.defaultView).toBe('week')
    expect((await getSettings()).weekStartsOn).toBe(0)
  })
})

describe('formatcal model', () => {
  it('eventOverlapsDay detects same day', () => {
    const day = new Date()
    day.setHours(10, 0, 0, 0)
    const ev = createEvent({ startAt: day.getTime(), endAt: day.getTime() + 3600000 })
    const dayStart = new Date(day).setHours(0, 0, 0, 0)
    expect(eventOverlapsDay(ev, dayStart)).toBe(true)
  })

  it('filterEvents searches title', () => {
    const a = createEvent({ title: 'Remise plans' })
    const b = createEvent({ title: 'Pause café' })
    expect(filterEvents([a, b], { query: 'remise' })).toHaveLength(1)
  })

  it('exportEventsIcs produces valid calendar', () => {
    const ev = createEvent({ title: 'Test ICS' })
    const ics = exportEventsIcs([ev])
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('SUMMARY:Test ICS')
  })
})

describe('formatcal upsert', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('updates existing event', async () => {
    const ev = await createAndSaveEvent({ title: 'Avant' })
    await upsertEvent({ ...ev, title: 'Après' })
    expect((await listEvents())[0]?.title).toBe('Après')
  })
})
