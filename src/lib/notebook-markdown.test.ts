import { describe, expect, it } from 'vitest'
import { notebookToMarkdown, pageToMarkdown } from './notebook-markdown'
import { makeTestNotebook, makeTestPage } from './forma-test-fixtures'
import { normalizePage } from '../types'

describe('pageToMarkdown', () => {
  it('renders text elements as markdown body', () => {
    const page = normalizePage({
      ...makeTestPage('nb1', { strokes: [] }),
      texts: [
        { id: 't1', x: 0, y: 0, width: 100, height: 50, content: 'Hello world', fontSize: 14, color: '#000', align: 'left', pageId: 'p1' },
      ],
    })
    const md = pageToMarkdown(page, 1)
    expect(md).toContain('## Page 1')
    expect(md).toContain('Hello world')
  })

  it('includes pdfText under its own heading', () => {
    const page = normalizePage({ ...makeTestPage('nb1', { strokes: [] }), pdfText: 'extracted text' })
    const md = pageToMarkdown(page, 2)
    expect(md).toContain('### Texte PDF')
    expect(md).toContain('extracted text')
  })

  it('includes inkText (OCR) under its own heading', () => {
    const page = normalizePage({ ...makeTestPage('nb1', { strokes: [] }), inkText: 'handwritten note' })
    const md = pageToMarkdown(page, 3)
    expect(md).toContain('### Manuscrit (OCR)')
    expect(md).toContain('handwritten note')
  })

  it('shows a placeholder when there is no text content at all', () => {
    const page = normalizePage({ ...makeTestPage('nb1', { strokes: [] }) })
    const md = pageToMarkdown(page, 1)
    expect(md).toContain('_(aucun texte indexé sur cette page)_')
  })

  it('skips whitespace-only text elements', () => {
    const page = normalizePage({
      ...makeTestPage('nb1', { strokes: [] }),
      texts: [
        { id: 't1', x: 0, y: 0, width: 100, height: 50, content: '   ', fontSize: 14, color: '#000', align: 'left', pageId: 'p1' },
      ],
    })
    const md = pageToMarkdown(page, 1)
    expect(md).toContain('_(aucun texte indexé sur cette page)_')
  })
})

describe('notebookToMarkdown', () => {
  it('includes the notebook name as a top-level heading', () => {
    const nb = makeTestNotebook({ name: 'Mon Carnet' })
    const page = makeTestPage(nb.id, { strokes: [] })
    const md = notebookToMarkdown(nb, [page])
    expect(md).toContain('# Mon Carnet')
  })

  it('orders pages by their `order` field', () => {
    const nb = makeTestNotebook()
    const p1 = normalizePage({
      ...makeTestPage(nb.id, { strokes: [], order: 1 }),
      texts: [{ id: 't1', x: 0, y: 0, width: 100, height: 50, content: 'Second', fontSize: 14, color: '#000', align: 'left', pageId: 'p1' }],
    })
    const p0 = normalizePage({
      ...makeTestPage(nb.id, { strokes: [], order: 0 }),
      texts: [{ id: 't2', x: 0, y: 0, width: 100, height: 50, content: 'First', fontSize: 14, color: '#000', align: 'left', pageId: 'p2' }],
    })
    const md = notebookToMarkdown(nb, [p1, p0])
    expect(md.indexOf('First')).toBeLessThan(md.indexOf('Second'))
  })

  it('separates pages with horizontal rules', () => {
    const nb = makeTestNotebook()
    const p1 = makeTestPage(nb.id, { strokes: [], order: 0 })
    const p2 = makeTestPage(nb.id, { strokes: [], order: 1 })
    const md = notebookToMarkdown(nb, [p1, p2])
    expect(md).toContain('---')
  })

  it('handles an empty page list', () => {
    const nb = makeTestNotebook()
    const md = notebookToMarkdown(nb, [])
    expect(md).toContain(`# ${nb.name}`)
  })
})
