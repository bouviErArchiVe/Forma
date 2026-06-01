import { beforeEach, describe, expect, it } from 'vitest'
import { readPersistedFormulaHistory } from './history-read'

describe('formulas/history-read', () => {
  beforeEach(() => {
    localStorage.removeItem('forma-formula-history')
  })

  it('returns empty array when nothing stored', () => {
    expect(readPersistedFormulaHistory()).toEqual([])
  })

  it('reads entries from zustand persist payload', () => {
    localStorage.setItem(
      'forma-formula-history',
      JSON.stringify({
        state: {
          entries: [
            {
              id: 'h1',
              formulaId: 'blondel',
              title: 'Loi de Blondel',
              mode: 'height-steps',
              values: { totalHeight: '280', steps: '18' },
              summary: '2H + G = 62 cm',
              createdAt: 1000,
            },
          ],
        },
        version: 0,
      }),
    )
    const entries = readPersistedFormulaHistory()
    expect(entries).toHaveLength(1)
    expect(entries[0].title).toBe('Loi de Blondel')
  })

  it('returns empty array on invalid JSON', () => {
    localStorage.setItem('forma-formula-history', '{bad')
    expect(readPersistedFormulaHistory()).toEqual([])
  })
})
