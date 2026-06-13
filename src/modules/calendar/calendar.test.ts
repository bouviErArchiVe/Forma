/**
 * Tests Calendrier V2 : grille de mois, requêtes jour/semaine, tri.
 */
import { describe, expect, it } from 'vitest'
import {
  addDays,
  compareByTime,
  eventsInWeek,
  eventsOnDay,
  eventsToMarkdown,
  monthGrid,
  occursOn,
  startOfWeek,
  type CalendarEvent,
  type CalendarState,
} from './calendar-data'
import { parseEventSuggestion } from './event-suggest'

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

// ─── Récurrence ─────────────────────────────────────────────────────────────

describe('occursOn (récurrence)', () => {
  it('événement non récurrent : seulement sa date', () => {
    const e = ev({ id: 'a', date: '2026-06-10' })
    expect(occursOn(e, '2026-06-10')).toBe(true)
    expect(occursOn(e, '2026-06-17')).toBe(false)
  })

  it('hebdomadaire : tous les 7 jours, jamais avant la source', () => {
    const e = ev({ id: 'w', date: '2026-06-10', recurrence: 'weekly' }) // mercredi
    expect(occursOn(e, '2026-06-10')).toBe(true)
    expect(occursOn(e, '2026-06-17')).toBe(true)
    expect(occursOn(e, '2026-06-24')).toBe(true)
    expect(occursOn(e, '2026-06-16')).toBe(false) // mardi
    expect(occursOn(e, '2026-06-03')).toBe(false) // avant la source
  })

  it('quotidienne et mensuelle', () => {
    const daily = ev({ id: 'd', date: '2026-06-10', recurrence: 'daily' })
    expect(occursOn(daily, '2026-06-11')).toBe(true)
    const monthly = ev({ id: 'm', date: '2026-06-10', recurrence: 'monthly' })
    expect(occursOn(monthly, '2026-07-10')).toBe(true)
    expect(occursOn(monthly, '2026-07-11')).toBe(false)
  })

  it('horizon limité à ~1 an', () => {
    const e = ev({ id: 'w', date: '2026-06-10', recurrence: 'weekly' })
    expect(occursOn(e, '2028-06-10')).toBe(false)
  })

  it('eventsInWeek déplie les occurrences hebdomadaires', () => {
    const s = state([ev({ id: 'w', date: '2026-06-03', recurrence: 'weekly' })]) // mercredi
    const week = eventsInWeek(s, '2026-06-10') // semaine du 8 au 14 juin
    const wed = week.filter((e) => e.id === 'w')
    expect(wed).toHaveLength(1)
    expect(wed[0].occurrenceDate).toBe('2026-06-10')
  })
})

// ─── Export markdown ──────────────────────────────────────────────────────────

describe('eventsToMarkdown', () => {
  it('liste vide → message', () => {
    expect(eventsToMarkdown(state([]))).toBe('Aucun événement.')
  })

  it('groupe par mois et mentionne la récurrence', () => {
    const md = eventsToMarkdown(state([
      ev({ id: 'a', title: 'Examen', date: '2026-06-15', startTime: '09:00' }),
      ev({ id: 'b', title: 'Cours', date: '2026-06-17', recurrence: 'weekly' }),
    ]))
    expect(md).toContain('## Juin 2026')
    expect(md).toContain('**Examen**')
    expect(md).toContain('09:00')
    expect(md).toContain('chaque semaine')
  })
})

// ─── parseEventSuggestion ──────────────────────────────────────────────────────

describe('parseEventSuggestion', () => {
  const TODAY = '2026-06-10' // mercredi

  it('« examen structure vendredi 9h »', () => {
    const s = parseEventSuggestion('examen structure vendredi 9h', TODAY)
    expect(s).not.toBeNull()
    expect(s!.title).toBe('Examen structure')
    expect(s!.date).toBe('2026-06-12') // vendredi suivant
    expect(s!.startTime).toBe('09:00')
    expect(s!.recurrence).toBeUndefined()
  })

  it('« remise projet demain »', () => {
    const s = parseEventSuggestion('remise projet demain', TODAY)
    expect(s!.title).toBe('Remise projet')
    expect(s!.date).toBe('2026-06-11')
  })

  it('« cours construction chaque mercredi 13h » → hebdomadaire', () => {
    const s = parseEventSuggestion('cours construction chaque mercredi 13h', TODAY)
    expect(s!.title).toBe('Cours construction')
    expect(s!.recurrence).toBe('weekly')
    expect(s!.startTime).toBe('13:00')
    expect(s!.date).toBe('2026-06-10') // mercredi = aujourd'hui
  })

  it('heure avec minutes « 13h30 »', () => {
    const s = parseEventSuggestion('réunion demain 13h30', TODAY)
    expect(s!.startTime).toBe('13:30')
  })

  it('phrase sans date/heure → null', () => {
    expect(parseEventSuggestion('faire quelque chose', TODAY)).toBeNull()
    expect(parseEventSuggestion('', TODAY)).toBeNull()
  })
})
