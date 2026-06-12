/**
 * Tests Présence V2 : statistiques de présence, cycle de statut.
 */
import { describe, expect, it } from 'vitest'
import {
  attendanceStats,
  cycleStatus,
  sortByDateDesc,
  type Session,
} from './presence-data'

function session(partial: Partial<Session> & { id: string }): Session {
  return {
    subjectLabel: 'Structure',
    date: '2026-06-01',
    status: 'present',
    ...partial,
  }
}

describe('attendanceStats', () => {
  it('liste vide → compteurs à 0 sans NaN', () => {
    const { global, bySubject } = attendanceStats([])
    expect(global).toEqual({ total: 0, present: 0, absent: 0, late: 0, presentPct: 0 })
    expect(bySubject).toEqual([])
    expect(Number.isNaN(global.presentPct)).toBe(false)
  })

  it('mix présent/absent/retard — retard compte comme présent pour le %', () => {
    const { global } = attendanceStats([
      session({ id: '1', status: 'present' }),
      session({ id: '2', status: 'present' }),
      session({ id: '3', status: 'absent' }),
      session({ id: '4', status: 'late' }),
    ])
    expect(global.total).toBe(4)
    expect(global.present).toBe(2)
    expect(global.absent).toBe(1)
    expect(global.late).toBe(1)
    expect(global.presentPct).toBe(75) // (2+1)/4
  })

  it('regroupe par matière (subjectId prioritaire, sinon libellé)', () => {
    const { bySubject } = attendanceStats([
      session({ id: '1', subjectId: 's1', subjectLabel: 'Structure' }),
      session({ id: '2', subjectId: 's1', subjectLabel: 'Structure', status: 'absent' }),
      session({ id: '3', subjectLabel: 'Anglais' }),
    ])
    expect(bySubject).toHaveLength(2)
    const structure = bySubject.find((s) => s.subjectId === 's1')!
    expect(structure.total).toBe(2)
    expect(structure.presentPct).toBe(50)
    const anglais = bySubject.find((s) => s.label === 'Anglais')!
    expect(anglais.total).toBe(1)
  })
})

describe('cycleStatus', () => {
  it('present → absent → late → present', () => {
    expect(cycleStatus('present')).toBe('absent')
    expect(cycleStatus('absent')).toBe('late')
    expect(cycleStatus('late')).toBe('present')
  })
})

describe('sortByDateDesc', () => {
  it('récentes d’abord', () => {
    const sorted = sortByDateDesc([
      session({ id: 'old', date: '2026-01-10' }),
      session({ id: 'new', date: '2026-06-10' }),
      session({ id: 'mid', date: '2026-03-10' }),
    ])
    expect(sorted.map((s) => s.id)).toEqual(['new', 'mid', 'old'])
  })
})
