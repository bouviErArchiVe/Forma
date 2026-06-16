/**
 * Tests de la planification SRS (SM-2-lite) — logique pure, déterministe.
 */
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_EASE,
  MIN_EASE,
  REVIEW_BUTTON_GRADE,
  initialSrsState,
  isDue,
  nextEase,
  review,
  type Grade,
  type SrsState,
} from './srs'

const DAY = 24 * 60 * 60 * 1000
const NOW = 1_000_000_000_000

function state(p: Partial<SrsState> = {}): SrsState {
  return { easeFactor: DEFAULT_EASE, interval: 0, repetitions: 0, dueDate: 0, ...p }
}

describe('initialSrsState', () => {
  it('démarre dû immédiatement avec ease par défaut', () => {
    const s = initialSrsState(NOW)
    expect(s.easeFactor).toBe(DEFAULT_EASE)
    expect(s.interval).toBe(0)
    expect(s.repetitions).toBe(0)
    expect(s.dueDate).toBe(NOW)
    expect(isDue(s, NOW)).toBe(true)
  })
})

describe('nextEase', () => {
  it('augmente légèrement pour une note parfaite (5)', () => {
    expect(nextEase(2.5, 5)).toBeCloseTo(2.6, 5)
  })

  it('reste stable pour une bonne note (4)', () => {
    expect(nextEase(2.5, 4)).toBeCloseTo(2.5, 5)
  })

  it('diminue pour une note moyenne (3)', () => {
    expect(nextEase(2.5, 3)).toBeLessThan(2.5)
  })

  it('ne descend jamais sous MIN_EASE', () => {
    let ease = 1.4
    for (let i = 0; i < 10; i++) ease = nextEase(ease, 0)
    expect(ease).toBeGreaterThanOrEqual(MIN_EASE)
    expect(ease).toBe(MIN_EASE)
  })
})

describe('review — réussite', () => {
  it('première réussite → interval 1 jour, repetitions 1', () => {
    const s = review(initialSrsState(NOW), 4, NOW)
    expect(s.repetitions).toBe(1)
    expect(s.interval).toBe(1)
    expect(s.dueDate).toBe(NOW + 1 * DAY)
    expect(s.lastReviewedAt).toBe(NOW)
  })

  it('deuxième réussite → interval 6 jours', () => {
    const after1 = review(initialSrsState(NOW), 4, NOW)
    const after2 = review(after1, 4, NOW)
    expect(after2.repetitions).toBe(2)
    expect(after2.interval).toBe(6)
    expect(after2.dueDate).toBe(NOW + 6 * DAY)
  })

  it('troisième réussite → interval = interval précédent * ease', () => {
    const after1 = review(initialSrsState(NOW), 5, NOW)
    const after2 = review(after1, 5, NOW)
    const after3 = review(after2, 5, NOW)
    expect(after3.repetitions).toBe(3)
    expect(after3.interval).toBe(Math.round(after2.interval * after3.easeFactor))
    expect(after3.interval).toBeGreaterThan(after2.interval)
  })

  it('les intervalles croissent strictement sur des réussites répétées', () => {
    let s = initialSrsState(NOW)
    let prev = 0
    for (let i = 0; i < 6; i++) {
      s = review(s, 5, NOW)
      expect(s.interval).toBeGreaterThanOrEqual(prev)
      prev = s.interval
    }
    expect(s.interval).toBeGreaterThan(6)
  })
})

describe('review — échec', () => {
  it('note < 3 remet repetitions à 0 et interval à 1 jour', () => {
    const learned = review(review(initialSrsState(NOW), 5, NOW), 5, NOW)
    const failed = review(learned, 1, NOW)
    expect(failed.repetitions).toBe(0)
    expect(failed.interval).toBe(1)
    expect(failed.dueDate).toBe(NOW + 1 * DAY)
  })

  it('un échec pénalise tout de même l’easeFactor', () => {
    const before = state({ easeFactor: 2.5 })
    const after = review(before, 0, NOW)
    expect(after.easeFactor).toBeLessThan(2.5)
  })
})

describe('isDue', () => {
  it('dû quand dueDate ≤ now', () => {
    expect(isDue({ dueDate: NOW - 1 }, NOW)).toBe(true)
    expect(isDue({ dueDate: NOW }, NOW)).toBe(true)
    expect(isDue({ dueDate: NOW + 1 }, NOW)).toBe(false)
  })
})

describe('REVIEW_BUTTON_GRADE', () => {
  it('mappe les boutons sur des notes SM-2 cohérentes', () => {
    expect(REVIEW_BUTTON_GRADE.again).toBeLessThan(3) // échec
    expect(REVIEW_BUTTON_GRADE.hard).toBeGreaterThanOrEqual(3) // réussite
    expect(REVIEW_BUTTON_GRADE.good).toBeGreaterThan(REVIEW_BUTTON_GRADE.hard as Grade)
    expect(REVIEW_BUTTON_GRADE.easy).toBeGreaterThan(REVIEW_BUTTON_GRADE.good as Grade)
  })
})
