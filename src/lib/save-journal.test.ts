import { beforeEach, describe, expect, it } from 'vitest'
import {
  appendSaveJournalEvent,
  clearSaveJournal,
  peekSaveJournal,
} from './save-journal'

const KEY = 'forma-save-journal'

describe('save-journal', () => {
  beforeEach(() => {
    localStorage.clear()
    clearSaveJournal()
  })

  it('appends events and keeps ring buffer max 80', () => {
    for (let i = 0; i < 85; i++) {
      appendSaveJournalEvent({ type: 'autosave_ok', pageId: `p${i}`, at: i })
    }
    const events = peekSaveJournal(100)
    expect(events).toHaveLength(80)
    expect(events[0].pageId).toBe('p5')
    expect(events[79].pageId).toBe('p84')
  })

  it('persists to localStorage with version header', () => {
    appendSaveJournalEvent({ type: 'recovery_stash', pageId: 'p1', at: 42 })
    const raw = localStorage.getItem(KEY)
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw!) as { v: number; events: unknown[] }
    expect(parsed.v).toBe(1)
    expect(parsed.events).toHaveLength(1)
  })

  it('peekSaveJournal respects limit', () => {
    for (let i = 0; i < 10; i++) {
      appendSaveJournalEvent({ type: 'autosave_ok', pageId: `p${i}`, at: i })
    }
    expect(peekSaveJournal(3)).toHaveLength(3)
    expect(peekSaveJournal(3)[0].pageId).toBe('p7')
  })
})
