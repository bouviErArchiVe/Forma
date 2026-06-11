import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { emptyPageFields } from '../types'
import type { Page } from '../types'

const updatePage = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)

vi.mock('./pages', () => ({ updatePage }))

vi.mock('../lib/save-recovery', () => ({
  stashPageRecovery: vi.fn(),
  clearPageRecovery: vi.fn(),
}))

vi.mock('../stores/toastStore', () => ({
  useToastStore: { getState: () => ({ show: vi.fn() }) },
}))

function testPage(id = 'page-1'): Page {
  return {
    id,
    notebookId: 'nb1',
    order: 0,
    template: 'blank',
    ...emptyPageFields(),
  }
}

describe('autosave', () => {
  beforeEach(async () => {
    updatePage.mockReset()
    updatePage.mockResolvedValue(undefined)
    vi.useFakeTimers()
    const mod = await import('./autosave')
    await mod.flushAllPending()
  })

  afterEach(async () => {
    vi.useRealTimers()
    updatePage.mockResolvedValue(undefined)
    const mod = await import('./autosave')
    await mod.flushAllPending()
  })

  it('autosaveErrorButtonLabel distinguishes quota from unknown', async () => {
    const { autosaveErrorButtonLabel } = await import('./autosave')
    expect(autosaveErrorButtonLabel('quota')).toBe('Espace insuffisant — réessayer')
    expect(autosaveErrorButtonLabel('unknown')).toBe('Erreur — réessayer')
    expect(autosaveErrorButtonLabel(null)).toBe('Erreur — réessayer')
  })

  it('debounces save for 2s then flushes via updatePage', async () => {
    const { schedulePageSave, hasPendingSaves, flushPage } = await import('./autosave')
    const pg = testPage()
    schedulePageSave(pg)
    expect(hasPendingSaves()).toBe(true)
    expect(updatePage).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1999)
    await Promise.resolve()
    expect(updatePage).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    await flushPage(pg.id)
    expect(updatePage).toHaveBeenCalledTimes(1)
    expect(updatePage).toHaveBeenCalledWith(expect.objectContaining({ id: pg.id, notebookId: pg.notebookId }))
  })

  it('flushPage persists the latest page snapshot after rapid edits', async () => {
    const { schedulePageSave, flushPage } = await import('./autosave')
    const pg = testPage()
    schedulePageSave(pg)
    schedulePageSave({
      ...pg,
      strokes: [
        {
          id: 's1',
          tool: 'pen',
          color: '#000',
          width: 2,
          opacity: 1,
          pageId: pg.id,
          points: [{ x: 1, y: 2, pressure: 0.5, timestamp: 0 }],
        },
      ],
    })
    await flushPage(pg.id)
    expect(updatePage).toHaveBeenCalledTimes(1)
    expect(updatePage.mock.calls[0][0].strokes).toHaveLength(1)
    expect(updatePage.mock.calls[0][0].strokes[0].id).toBe('s1')
  })

  it('flushAllPending saves all pending pages sequentially', async () => {
    const { schedulePageSave, flushAllPending } = await import('./autosave')
    schedulePageSave(testPage('a'))
    schedulePageSave(testPage('b'))
    await flushAllPending()
    expect(updatePage).toHaveBeenCalledTimes(2)
    const ids = updatePage.mock.calls.map((c) => (c[0] as Page).id)
    expect(ids).toContain('a')
    expect(ids).toContain('b')
  })
})
