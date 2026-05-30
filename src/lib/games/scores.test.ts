import { beforeEach, describe, expect, it } from 'vitest'
import { getBest, readScores, saveBest } from './scores'
import { GAMES, getGameById } from './catalog'

describe('fpause scores', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns 0 for unknown game', () => {
    expect(getBest('snake')).toBe(0)
    expect(readScores()).toEqual({})
  })

  it('saves a new record and persists it', () => {
    const next = saveBest('snake', 12)
    expect(next.snake).toBe(12)
    expect(getBest('snake')).toBe(12)
  })

  it('only keeps the higher score', () => {
    saveBest('pong', 5)
    const lower = saveBest('pong', 3)
    expect(lower.pong).toBe(5)
    const higher = saveBest('pong', 9)
    expect(higher.pong).toBe(9)
  })

  it('floors fractional scores and ignores invalid', () => {
    expect(saveBest('dino', 7.8).dino).toBe(7)
    expect(saveBest('dino', Number.NaN).dino).toBe(7)
  })

  it('ignores malformed stored data', () => {
    localStorage.setItem('forma-game-scores', 'not json')
    expect(readScores()).toEqual({})
  })
})

describe('fpause catalog', () => {
  it('exposes the five games with unique ids', () => {
    expect(GAMES).toHaveLength(5)
    expect(new Set(GAMES.map((g) => g.id)).size).toBe(5)
  })

  it('looks up by id and returns null otherwise', () => {
    expect(getGameById('snake')?.title).toBe('Snake')
    expect(getGameById('nope')).toBeNull()
    expect(getGameById(null)).toBeNull()
  })
})
