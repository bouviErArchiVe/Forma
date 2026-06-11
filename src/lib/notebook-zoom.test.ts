import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clampZoom, getNotebookZoom, setNotebookZoom } from './notebook-zoom'

describe('clampZoom', () => {
  it('clamps below the minimum', () => {
    expect(clampZoom(0.1)).toBe(0.35)
  })

  it('clamps above the maximum', () => {
    expect(clampZoom(5)).toBe(1.6)
  })

  it('passes through values within range', () => {
    expect(clampZoom(1)).toBe(1)
  })
})

describe('getNotebookZoom / setNotebookZoom', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns the clamped fallback when nothing is stored', () => {
    expect(getNotebookZoom('nb1', 1)).toBe(1)
    expect(getNotebookZoom('nb1', 10)).toBe(1.6)
  })

  it('round-trips a stored zoom value', () => {
    setNotebookZoom('nb1', 0.8)
    expect(getNotebookZoom('nb1', 1)).toBe(0.8)
  })

  it('clamps stored values when read back', () => {
    localStorage.setItem('forma-zoom-nb1', '99')
    expect(getNotebookZoom('nb1', 1)).toBe(1.6)
  })

  it('falls back to clamped fallback when stored value is not a number', () => {
    localStorage.setItem('forma-zoom-nb1', 'not-a-number')
    expect(getNotebookZoom('nb1', 0.9)).toBe(0.9)
  })

  it('isolates zoom per notebook id', () => {
    setNotebookZoom('a', 0.5)
    setNotebookZoom('b', 1.2)
    expect(getNotebookZoom('a', 1)).toBe(0.5)
    expect(getNotebookZoom('b', 1)).toBe(1.2)
  })

  describe('storage errors', () => {
    let getItemSpy: ReturnType<typeof vi.spyOn>
    let setItemSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('blocked')
      })
      setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('quota')
      })
    })

    afterEach(() => {
      getItemSpy.mockRestore()
      setItemSpy.mockRestore()
    })

    it('getNotebookZoom falls back gracefully if localStorage throws', () => {
      expect(getNotebookZoom('nb1', 0.7)).toBe(0.7)
    })

    it('setNotebookZoom does not throw if localStorage throws', () => {
      expect(() => setNotebookZoom('nb1', 0.7)).not.toThrow()
    })
  })
})
