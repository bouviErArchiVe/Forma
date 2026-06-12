/**
 * Tests Calendrier V2 : grille de mois, requêtes jour/semaine, tri.
 */
import { describe, expect, it } from 'vitest'
import {
  addDays,
  compareByTime,
  eventsInWeek,
  eventsOnDay,
  monthGrid,
  startOfWeek,
  type CalendarEvent,
  type CalendarState,
} from './calendar-data'

function ev(partial: Partial<CalendarEvent> & { id: string; date: string }): CalendarEvent {
  return { title: partial.id, color: '#3b82f6', ...partial }
}

function state(events: CalendarEvent[]): CalendarState {
  return { v: 1, events }
}

describe('monthGrid', () => {
  it('retourne toujours 42 cases alignées lundi→dimanche', () => {
    const grid = monthGrid(2026, 6) // juin 2026 : le 1er est un lundi
    expect(grid).toHaveLength(42)
    expect(grid[0].iso).toBe('2026-06-01')
    expect(grid[0].inMonth).toBe(true)
    expect(grid.filter((c) => c.inMonth)).toHaveLength(30)
  })

  it('mois commençant en milieu de semaine : jours adjacents marqués', () => {
    const grid = monthGrid(2026, 1) // 1er janvier 2026 = jeudi
    expect(grid[0].iso).toBe('2025-12-29') // lundi précédent
    expect(grid[0].inMonth).toBe(false)
    expect(grid[3].iso).toBe('2026-01-01')
    expect(grid[3].inMonth).toBe(true)
  })

  it('février bissextile (2024) : 29 jours dans le mois', () => {
    const grid = monthGrid(2024, 2)
    expect(grid.filter((c) => c.inMonth)).toHaveLength(29)
  })
})

describe('startOfWeek / addDays', () => {
  it('semaine lundi→dimanche', () => {
    expect(startOfWeek('2026-06-11')).toBe('2026-06-08') // jeudi → lundi
    expect(startOfWeek('2026-06-08')).toBe('2026-06-08') // lundi stable
    expect(startOfWeek('2026-06-14')).toBe('2026-06-08') // dimanche → lundi
  })

  it('addDays franchit les mois', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })
})

describe('eventsOnDay / eventsInWeek', () => {
  const s = state([
    ev({ id: 'a', date: '2026-06-08', startTime: '14:00' }),
    ev({ id: 'b', date: '2026-06-08', startTime: '09:00' }),
    ev({ id: 'c', date: '2026-06-08' }), // toute la journée
    ev({ id: 'd', date: '2026-06-14' }), // dimanche même semaine
    ev({ id: 'e', date: '2026-06-15' }), // lundi suivant
  ])

  it('eventsOnDay trie : toute-la-journée puis heures', () => {
    const day = eventsOnDay(s, '2026-06-08')
    expect(day.map((e) => e.id)).toEqual(['c', 'b', 'a'])
  })

  it('eventsInWeek borne lundi→dimanche', () => {
    const week = eventsInWeek(s, '2026-06-11')
    expect(week.map((e) => e.id).sort()).toEqual(['a', 'b', 'c', 'd'])
  })
})

describe('compareByTime', () => {
  it('sans heure avant avec heure, puis tri horaire', () => {
    const allDay = ev({ id: 'x', date: '2026-06-08' })
    const nine = ev({ id: 'y', date: '2026-06-08', startTime: '09:00' })
    const noon = ev({ id: 'z', date: '2026-06-08', startTime: '12:00' })
    expect(compareByTime(allDay, nine)).toBeLessThan(0)
    expect(compareByTime(nine, noon)).toBeLessThan(0)
  })
})
