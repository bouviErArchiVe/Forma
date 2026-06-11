import { describe, expect, it } from 'vitest'
import { computeNotebookWordCount, computePageStats } from './page-stats'
import { makeTestPage } from './forma-test-fixtures'
import { normalizePage } from '../types'

describe('computePageStats', () => {
  it('counts strokes, shapes, texts, images, stickers, tapes', () => {
    const page = makeTestPage('nb1')
    const stats = computePageStats(page)
    expect(stats.strokes).toBe(1)
    expect(stats.shapes).toBe(0)
    expect(stats.texts).toBe(0)
    expect(stats.images).toBe(0)
    expect(stats.stickers).toBe(0)
    expect(stats.tapes).toBe(0)
  })

  it('counts words and chars from text elements', () => {
    const page = makeTestPage('nb1', {
      texts: [
        {
          id: 't1',
          x: 0,
          y: 0,
          width: 100,
          height: 50,
          content: 'hello world',
          fontSize: 14,
          color: '#000',
          align: 'left',
          pageId: 'p1',
        },
      ],
    })
    const stats = computePageStats(page)
    expect(stats.texts).toBe(1)
    expect(stats.words).toBe(2)
    // chars counts the joined string ("hello world" + 2 separator spaces
    // for the empty pdfText/inkText parts)
    expect(stats.chars).toBe('hello world'.length + 2)
  })

  it('combines text content, pdfText and inkText for word counting', () => {
    const page = normalizePage({
      ...makeTestPage('nb1'),
      strokes: [],
      pdfText: 'foo bar',
      inkText: 'baz',
    })
    const stats = computePageStats(page)
    expect(stats.words).toBe(3)
  })

  it('returns 0 words for an empty page', () => {
    const page = normalizePage({ ...makeTestPage('nb1'), strokes: [] })
    const stats = computePageStats(page)
    expect(stats.words).toBe(0)
  })

  it('handles whitespace-only text as zero words', () => {
    const page = makeTestPage('nb1', {
      texts: [
        {
          id: 't1',
          x: 0,
          y: 0,
          width: 100,
          height: 50,
          content: '   \n  ',
          fontSize: 14,
          color: '#000',
          align: 'left',
          pageId: 'p1',
        },
      ],
    })
    const stats = computePageStats(page)
    expect(stats.words).toBe(0)
  })
})

describe('computeNotebookWordCount', () => {
  it('sums word counts across multiple pages', () => {
    const p1 = makeTestPage('nb1', {
      texts: [
        {
          id: 't1', x: 0, y: 0, width: 100, height: 50,
          content: 'one two three', fontSize: 14, color: '#000', align: 'left', pageId: 'p1',
        },
      ],
    })
    const p2 = makeTestPage('nb1', {
      texts: [
        {
          id: 't2', x: 0, y: 0, width: 100, height: 50,
          content: 'four five', fontSize: 14, color: '#000', align: 'left', pageId: 'p2',
        },
      ],
    })
    expect(computeNotebookWordCount([p1, p2])).toBe(5)
  })

  it('returns 0 for an empty list of pages', () => {
    expect(computeNotebookWordCount([])).toBe(0)
  })
})
