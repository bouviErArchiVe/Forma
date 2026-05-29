import { describe, expect, it } from 'vitest'
import { computeDashboardStats, groupNotebooksByMonth } from './library-views'
import { DEFAULT_SUBJECTS } from './subjects'
import { sortNotebooks } from '../services/library'
import type { Notebook } from '../types'

const nb = (id: string, patch: Partial<Notebook> = {}): Notebook => ({
  id,
  folderId: null,
  name: id,
  coverColor: '#ccc',
  paperTemplate: 'lined',
  orientation: 'portrait',
  type: 'notebook',
  createdAt: Date.parse('2026-01-15'),
  updatedAt: Date.parse('2026-03-01'),
  ...patch,
})

describe('library-views', () => {
  it('groups notebooks by month', () => {
    const groups = groupNotebooksByMonth([
      nb('a', { updatedAt: Date.parse('2026-03-10') }),
      nb('b', { updatedAt: Date.parse('2026-01-05') }),
    ])
    expect(groups.length).toBe(2)
    expect(groups[0].items[0].id).toBe('a')
  })

  it('computes dashboard stats', () => {
    const stats = computeDashboardStats(
      [nb('a', { favorite: true, subjectId: 'arch' }), nb('b', { type: 'pdf' })],
      DEFAULT_SUBJECTS,
      ['a'],
    )
    expect(stats.totalNotebooks).toBe(2)
    expect(stats.favorites).toBe(1)
    expect(stats.pdfs).toBe(1)
    expect(stats.bySubject[0]?.count).toBe(1)
  })

  it('sorts notebooks by subject label', () => {
    const sorted = sortNotebooks(
      [nb('b', { subjectId: 'math', name: 'B' }), nb('a', { subjectId: 'arch', name: 'A' })],
      'subject',
      'asc',
      { subjects: DEFAULT_SUBJECTS },
    )
    expect(sorted[0].id).toBe('a')
  })
})
