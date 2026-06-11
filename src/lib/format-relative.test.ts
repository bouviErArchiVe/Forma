import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { formatRelativeTime } from './format-relative'

describe('formatRelativeTime', () => {
  const NOW = new Date('2026-06-10T12:00:00Z').getTime()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "À l\'instant" for timestamps in the future', () => {
    expect(formatRelativeTime(NOW + 1000)).toBe("À l'instant")
  })

  it('returns "À l\'instant" for very recent timestamps', () => {
    expect(formatRelativeTime(NOW - 10_000)).toBe("À l'instant")
  })

  it('returns minutes for timestamps under an hour', () => {
    expect(formatRelativeTime(NOW - 5 * 60_000)).toBe('Il y a 5 min')
  })

  it('returns hours for timestamps under a day', () => {
    expect(formatRelativeTime(NOW - 3 * 3_600_000)).toBe('Il y a 3 h')
  })

  it('returns "Hier" for exactly one day ago', () => {
    expect(formatRelativeTime(NOW - 24 * 3_600_000)).toBe('Hier')
  })

  it('returns days for less than a week', () => {
    expect(formatRelativeTime(NOW - 3 * 24 * 3_600_000)).toBe('Il y a 3 j')
  })

  it('returns weeks for less than a month', () => {
    expect(formatRelativeTime(NOW - 14 * 24 * 3_600_000)).toBe('Il y a 2 sem.')
  })

  it('returns a localized date for older timestamps', () => {
    const result = formatRelativeTime(NOW - 60 * 24 * 3_600_000)
    expect(result).not.toMatch(/Il y a|Hier|instant/)
  })
})
