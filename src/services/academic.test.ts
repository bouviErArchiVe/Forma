/**
 * Tests session académique : calcul des semaines + CRUD.
 */
import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db'
import {
  createSession,
  currentSession,
  listSessions,
  sessionLabel,
  startOfWeek,
  weekInfo,
  weekRange,
} from './academic'
import type { AcademicSession } from '../types'

beforeEach(async () => {
  await db.open()
  await db.academicSessions.clear()
})

function session(p: Partial<AcademicSession> = {}): AcademicSession {
  return {
    id: 's', term: 'automne', year: 2026, startDate: '2026-09-07', weeks: 15,
    createdAt: 1, updatedAt: 1, ...p,
  }
}

describe('weekInfo', () => {
  it('semaine 1 le jour du début', () => {
    const s = session({ startDate: '2026-09-07' }) // lundi
    const info = weekInfo(s, '2026-09-07')
    expect(info.week).toBe(1)
    expect(info.totalWeeks).toBe(15)
  })

  it('semaine 3 deux semaines plus tard', () => {
    const s = session({ startDate: '2026-09-07' })
    expect(weekInfo(s, '2026-09-23').week).toBe(3)
  })

  it('avant le début → null, après la fin → null avec progress 100', () => {
    const s = session({ startDate: '2026-09-07', weeks: 15 })
    expect(weekInfo(s, '2026-08-01').week).toBeNull()
    expect(weekInfo(s, '2026-08-01').progress).toBe(0)
    const after = weekInfo(s, '2027-02-01')
    expect(after.week).toBeNull()
    expect(after.progress).toBe(100)
  })

  it('weekRange retourne lundi→dimanche', () => {
    const s = session({ startDate: '2026-09-07' })
    expect(weekRange(s, 1)).toEqual({ start: '2026-09-07', end: '2026-09-13' })
    expect(weekRange(s, 2).start).toBe('2026-09-14')
  })
})

describe('startOfWeek', () => {
  it('ramène au lundi', () => {
    expect(startOfWeek('2026-09-10')).toBe('2026-09-07') // jeudi → lundi
  })
})

describe('CRUD session', () => {
  it('createSession marque current et désactive les autres', async () => {
    await createSession({ term: 'automne', year: 2025, startDate: '2025-09-01' })
    const b = await createSession({ term: 'hiver', year: 2026, startDate: '2026-01-12' })
    const list = await listSessions()
    expect(list.filter((s) => s.current)).toHaveLength(1)
    expect((await currentSession())?.id).toBe(b.id)
  })

  it('sessionLabel formate « Hiver 2026 »', () => {
    expect(sessionLabel(session({ term: 'hiver', year: 2026 }))).toBe('Hiver 2026')
  })
})
