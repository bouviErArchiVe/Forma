/**
 * Tests for global-search v2 (PACK 6).
 * Covers: content extraction helpers, snippet generation,
 *         search across all content types.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  boardDataToPlainText,
  htmlToPlainText,
  tabDataToPlainText,
  searchGlobalPages,
} from './global-search'

// ─── htmlToPlainText ──────────────────────────────────────────────────────────

describe('htmlToPlainText', () => {
  it('strips simple tags', () => {
    expect(htmlToPlainText('<p>Hello world</p>')).toBe('Hello world')
  })

  it('strips heading tags', () => {
    expect(htmlToPlainText('<h1>Titre</h1>')).toContain('Titre')
    expect(htmlToPlainText('<h2>Sous-titre</h2>')).toContain('Sous-titre')
  })

  it('converts br to space', () => {
    const result = htmlToPlainText('<p>ligne1<br>ligne2</p>')
    expect(result).toContain('ligne1')
    expect(result).toContain('ligne2')
  })

  it('handles nested elements', () => {
    const result = htmlToPlainText('<p><strong>Important</strong> texte</p>')
    expect(result).toContain('Important')
    expect(result).toContain('texte')
  })

  it('decodes HTML entities', () => {
    expect(htmlToPlainText('&amp; &lt; &gt; &nbsp;')).toContain('&')
    expect(htmlToPlainText('&amp; &lt; &gt; &nbsp;')).toContain('<')
  })

  it('returns empty string for empty input', () => {
    expect(htmlToPlainText('')).toBe('')
  })

  it('does not return raw tag characters', () => {
    const result = htmlToPlainText('<p>text</p>')
    expect(result).not.toContain('<')
    expect(result).not.toContain('>')
  })
})

// ─── tabDataToPlainText ───────────────────────────────────────────────────────

describe('tabDataToPlainText', () => {
  it('extracts plain text cell values', () => {
    const json = JSON.stringify({
      rows: 2, cols: 2,
      cells: {
        A1: { value: 'Name' },
        B1: { value: 'Score' },
        A2: { value: 'Alice' },
        B2: { value: '42' },
      },
    })
    const result = tabDataToPlainText(json)
    expect(result).toContain('Name')
    expect(result).toContain('Alice')
    expect(result).toContain('Score')
  })

  it('skips formula cells', () => {
    const json = JSON.stringify({
      rows: 1, cols: 2,
      cells: {
        A1: { value: '10' },
        B1: { value: '=SUM(A1:A5)' },
      },
    })
    const result = tabDataToPlainText(json)
    expect(result).toContain('10')
    expect(result).not.toContain('=SUM')
  })

  it('returns empty string for invalid JSON', () => {
    expect(tabDataToPlainText('not json')).toBe('')
  })

  it('returns empty string for missing cells', () => {
    expect(tabDataToPlainText(JSON.stringify({ rows: 1, cols: 1 }))).toBe('')
  })
})

// ─── boardDataToPlainText ─────────────────────────────────────────────────────

describe('boardDataToPlainText', () => {
  it('extracts text item values', () => {
    const json = JSON.stringify({
      items: [
        { id: '1', kind: 'text', text: 'Inspiration voyage', x: 0, y: 0, width: 100, height: 50, zIndex: 1 },
        { id: '2', kind: 'image', dataUrl: 'data:image/png;base64,abc', x: 10, y: 10, width: 200, height: 150, zIndex: 2 },
        { id: '3', kind: 'text', text: 'Architecture moderne', x: 0, y: 100, width: 100, height: 50, zIndex: 3 },
      ],
      groups: [],
      canvasWidth: 1600,
      canvasHeight: 1000,
      background: '#fff',
    })
    const result = boardDataToPlainText(json)
    expect(result).toContain('Inspiration voyage')
    expect(result).toContain('Architecture moderne')
    expect(result).not.toContain('data:image') // image items ignored
  })

  it('returns empty string for invalid JSON', () => {
    expect(boardDataToPlainText('invalid{')).toBe('')
  })

  it('returns empty string when no text items', () => {
    const json = JSON.stringify({
      items: [{ id: '1', kind: 'image', dataUrl: 'data:...', x: 0, y: 0, width: 100, height: 100, zIndex: 1 }],
      groups: [],
      canvasWidth: 800, canvasHeight: 600, background: '#fff',
    })
    expect(boardDataToPlainText(json)).toBe('')
  })

  it('handles missing items array', () => {
    expect(boardDataToPlainText(JSON.stringify({ groups: [], canvasWidth: 800 }))).toBe('')
  })
})

// ─── searchGlobalPages ────────────────────────────────────────────────────────

describe('searchGlobalPages', () => {
  // We mock db and getAllNotebooks for unit tests
  beforeEach(() => {
    vi.mock('../db', () => ({
      db: {
        pages: {
          where: () => ({
            equals: () => ({
              toArray: async () => [],
            }),
          }),
        },
      },
    }))
    vi.mock('../services/library', () => ({
      getAllNotebooks: async () => [],
    }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns empty for short query (< 2 chars)', async () => {
    const results = await searchGlobalPages('a')
    expect(results).toEqual([])
  })

  it('returns empty for empty query', async () => {
    const results = await searchGlobalPages('')
    expect(results).toEqual([])
  })

  it('returns empty when no notebooks', async () => {
    const results = await searchGlobalPages('test')
    expect(results).toEqual([])
  })
})
