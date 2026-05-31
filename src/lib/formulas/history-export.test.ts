import { describe, expect, it } from 'vitest'
import type { FormulaHistoryEntry } from '../../stores/formulaHistoryStore'
import { formatHistoryEntry, formatHistoryReport } from './history-export'

const SAMPLE: FormulaHistoryEntry = {
  id: 'abc',
  formulaId: 'blondel',
  title: 'Loi de Blondel',
  mode: 'height-steps',
  values: { totalHeight: '280', steps: '18' },
  summary: '2H + G = 62 cm → Confortable',
  createdAt: new Date('2026-05-30T12:00:00').getTime(),
}

describe('formulas/history-export', () => {
  it('formats a single entry with title, values and summary', () => {
    const text = formatHistoryEntry(SAMPLE)
    expect(text).toContain('Loi de Blondel')
    expect(text).toContain('totalHeight: 280')
    expect(text).toContain('Résultat : 2H + G = 62 cm')
  })

  it('builds a multi-entry report with separators', () => {
    const report = formatHistoryReport([SAMPLE, { ...SAMPLE, id: 'def', title: 'Pente escalier' }])
    expect(report).toContain('Historique Formules — 2 calculs')
    expect(report).toContain('1. Loi de Blondel')
    expect(report).toContain('2. Pente escalier')
    expect(report).toContain('-'.repeat(40))
  })

  it('returns empty string for empty history', () => {
    expect(formatHistoryReport([])).toBe('')
  })
})
