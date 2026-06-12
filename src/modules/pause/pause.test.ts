/**
 * Tests Pause V2 : logique Snake (pas de simulation) et meilleurs scores.
 */
import { describe, expect, it } from 'vitest'
import { advanceSnake, GAMES, SNAKE, updateBestScore, type SnakeState } from './games/core'

function snakeState(partial: Partial<SnakeState> = {}): SnakeState {
  return {
    grid: 10,
    snake: [{ x: 5, y: 5 }, { x: 4, y: 5 }],
    dir: { x: 1, y: 0 },
    nextDir: { x: 1, y: 0 },
    food: { x: 9, y: 9 },
    acc: 0,
    interval: 0.14,
    score: 0,
    over: false,
    ...partial,
  }
}

describe('advanceSnake', () => {
  it('avance d’une case dans la direction courante', () => {
    const s = snakeState()
    advanceSnake(s)
    expect(s.snake[0]).toEqual({ x: 6, y: 5 })
    expect(s.snake).toHaveLength(2) // pas de nourriture → pas de croissance
    expect(s.over).toBe(false)
  })

  it('mur → partie terminée', () => {
    const s = snakeState({ snake: [{ x: 9, y: 5 }, { x: 8, y: 5 }] })
    advanceSnake(s)
    expect(s.over).toBe(true)
  })

  it('collision avec la queue → partie terminée', () => {
    const s = snakeState({
      snake: [
        { x: 5, y: 5 }, { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 6, y: 5 }, { x: 6, y: 4 },
      ],
      nextDir: { x: 1, y: 0 }, // la tête va sur (6,5) occupé
    })
    advanceSnake(s)
    expect(s.over).toBe(true)
  })

  it('nourriture → croissance + score + accélération', () => {
    const s = snakeState({ food: { x: 6, y: 5 } })
    const intervalBefore = s.interval
    advanceSnake(s)
    expect(s.snake).toHaveLength(3)
    expect(s.score).toBe(10)
    expect(s.interval).toBeLessThan(intervalBefore)
    // la nourriture a été replacée hors du serpent
    expect(s.snake.some((c) => c.x === s.food.x && c.y === s.food.y)).toBe(false)
  })
})

describe('updateBestScore', () => {
  it('met à jour seulement si meilleur', () => {
    const best = { snake: 50 }
    expect(updateBestScore(best, 'snake', 40)).toBe(best) // même réf si pas mieux
    expect(updateBestScore(best, 'snake', 60)).toEqual({ snake: 60 })
    expect(updateBestScore(best, 'pong', 10)).toEqual({ snake: 50, pong: 10 })
  })
})

describe('GAMES', () => {
  it('expose les 5 jeux requis avec init/update/draw', () => {
    expect(GAMES.map((g) => g.id).sort()).toEqual(['bounce', 'breakout', 'pong', 'runner', 'snake'])
    for (const g of GAMES) {
      const s = g.init(480, 320)
      expect(s).toBeDefined()
      expect(g.isGameOver(s)).toBe(false)
      expect(g.score(s)).toBe(0)
    }
  })

  it('snake : init cohérent', () => {
    const s = SNAKE.init(480, 320)
    expect(s.snake.length).toBeGreaterThanOrEqual(3)
    expect(s.grid).toBe(20)
  })
})
