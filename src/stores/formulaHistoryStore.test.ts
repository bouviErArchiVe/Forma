import { beforeEach, describe, expect, it } from 'vitest'
import { MAX_FORMULA_HISTORY, useFormulaHistoryStore } from './formulaHistoryStore'

function reset() {
  useFormulaHistoryStore.setState({ entries: [] })
}

describe('formulaHistoryStore', () => {
  beforeEach(reset)

  it('adds an entry at the front with an id and timestamp', () => {
    useFormulaHistoryStore.getState().addEntry({
      formulaId: 'blondel',
      title: 'Loi de Blondel',
      mode: 'height-steps',
      values: { totalHeight: '280', steps: '18' },
      summary: '2H + G = 62 cm',
    })
    const { entries } = useFormulaHistoryStore.getState()
    expect(entries).toHaveLength(1)
    expect(entries[0].id).toBeTruthy()
    expect(entries[0].createdAt).toBeGreaterThan(0)
    expect(entries[0].values.totalHeight).toBe('280')
  })

  it('keeps newest entries first and caps the list', () => {
    for (let i = 0; i < MAX_FORMULA_HISTORY + 10; i += 1) {
      useFormulaHistoryStore.getState().addEntry({
        formulaId: `f-${i}`,
        title: `Formule ${i}`,
        mode: 'default',
        values: {},
        summary: `result ${i}`,
      })
    }
    const { entries } = useFormulaHistoryStore.getState()
    expect(entries).toHaveLength(MAX_FORMULA_HISTORY)
    expect(entries[0].formulaId).toBe(`f-${MAX_FORMULA_HISTORY + 9}`)
  })

  it('removes a single entry by id', () => {
    const store = useFormulaHistoryStore.getState()
    store.addEntry({ formulaId: 'a', title: 'A', mode: 'm', values: {}, summary: 's' })
    store.addEntry({ formulaId: 'b', title: 'B', mode: 'm', values: {}, summary: 's' })
    const target = useFormulaHistoryStore.getState().entries[0]
    useFormulaHistoryStore.getState().removeEntry(target.id)
    const { entries } = useFormulaHistoryStore.getState()
    expect(entries).toHaveLength(1)
    expect(entries.find((e) => e.id === target.id)).toBeUndefined()
  })

  it('clears all entries', () => {
    useFormulaHistoryStore.getState().addEntry({ formulaId: 'a', title: 'A', mode: 'm', values: {}, summary: 's' })
    useFormulaHistoryStore.getState().clear()
    expect(useFormulaHistoryStore.getState().entries).toHaveLength(0)
  })
})
