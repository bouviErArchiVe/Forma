/**
 * Tests des helpers d'extraction de contexte (purs, sans Dexie ni réseau).
 */
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CONTEXT_BUDGET,
  extractDocumentContext,
  extractPageContext,
  truncateContext,
} from './canvas-context'
import type { Page, TextElement } from '../../types'

function textEl(content: string): TextElement {
  return {
    id: 't1',
    x: 0,
    y: 0,
    width: 100,
    height: 20,
    content,
    fontSize: 14,
    color: '#000',
    align: 'left',
    pageId: 'p1',
  }
}

function makePage(partial: Partial<Page>): Page {
  return {
    id: 'p1',
    notebookId: 'nb1',
    order: 0,
    template: 'blank',
    strokes: [],
    shapes: [],
    texts: [],
    images: [],
    stickers: [],
    tapes: [],
    rotation: 0,
    ...partial,
  }
}

describe('extractPageContext', () => {
  it('page vide → isEmpty true, texte vide', () => {
    const ctx = extractPageContext(makePage({}))
    expect(ctx.isEmpty).toBe(true)
    expect(ctx.text).toBe('')
    expect(ctx.charCount).toBe(0)
    expect(ctx.inkOnly).toBe(false)
  })

  it('extrait le texte des blocs canvas', () => {
    const ctx = extractPageContext(makePage({ texts: [textEl('Toiture végétalisée')] }))
    expect(ctx.isEmpty).toBe(false)
    expect(ctx.text).toContain('Toiture végétalisée')
    expect(ctx.segments.some((s) => s.source === 'text')).toBe(true)
  })

  it('extrait le HTML FormaDoc en texte brut', () => {
    const ctx = extractPageContext(
      makePage({ content: '<h1>Titre</h1><p>Un paragraphe <b>important</b>.</p>' }),
    )
    expect(ctx.text).toContain('Titre')
    expect(ctx.text).toContain('Un paragraphe')
    expect(ctx.text).not.toContain('<h1>')
    expect(ctx.segments.some((s) => s.source === 'content')).toBe(true)
  })

  it('extrait les cellules FormaTab (hors formules)', () => {
    const tableData = JSON.stringify({
      cells: { A1: { value: 'Mur extérieur' }, A2: { value: '=SUM(B1:B2)' }, A3: { value: '200 mm' } },
    })
    const ctx = extractPageContext(makePage({ tableData }))
    expect(ctx.text).toContain('Mur extérieur')
    expect(ctx.text).toContain('200 mm')
    expect(ctx.text).not.toContain('SUM')
  })

  it('extrait les items texte d’un moodboard', () => {
    const moodboardData = JSON.stringify({
      items: [
        { kind: 'text', text: 'Inspiration façade' },
        { kind: 'image', src: 'x' },
      ],
    })
    const ctx = extractPageContext(makePage({ moodboardData }))
    expect(ctx.text).toContain('Inspiration façade')
  })

  it('extrait le texte PDF', () => {
    const ctx = extractPageContext(makePage({ pdfText: 'Article extrait du PDF.' }))
    expect(ctx.text).toContain('Article extrait du PDF')
    expect(ctx.segments.some((s) => s.source === 'pdf')).toBe(true)
  })

  it('marque inkOnly quand seul l’OCR manuscrit fournit du texte', () => {
    const ctx = extractPageContext(makePage({ inkText: 'note manuscrite reconnue' }))
    expect(ctx.inkOnly).toBe(true)
    expect(ctx.text).toContain('note manuscrite')
  })

  it('inkOnly false dès qu’une autre source existe', () => {
    const ctx = extractPageContext(
      makePage({ inkText: 'manuscrit', content: '<p>document riche</p>' }),
    )
    expect(ctx.inkOnly).toBe(false)
  })

  it('combine plusieurs sources dans l’ordre de priorité', () => {
    const ctx = extractPageContext(
      makePage({
        texts: [textEl('bloc texte')],
        content: '<p>doc html</p>',
        pdfText: 'pdf brut',
      }),
    )
    expect(ctx.segments.map((s) => s.source)).toEqual(['text', 'content', 'pdf'])
  })
})

describe('extractDocumentContext', () => {
  it('agrège les pages non vides et les numérote', () => {
    const pages: Page[] = [
      makePage({ id: 'p1', order: 1, content: '<p>Deuxième page</p>' }),
      makePage({ id: 'p0', order: 0, content: '<p>Première page</p>' }),
      makePage({ id: 'p2', order: 2 }), // vide → ignorée
    ]
    const ctx = extractDocumentContext(pages)
    expect(ctx.isEmpty).toBe(false)
    expect(ctx.text).toContain('Page 1')
    expect(ctx.text).toContain('Première page')
    expect(ctx.text).toContain('Page 2')
    expect(ctx.text).toContain('Deuxième page')
    // L'ordre est respecté : « Première » avant « Deuxième »
    expect(ctx.text.indexOf('Première')).toBeLessThan(ctx.text.indexOf('Deuxième'))
  })

  it('document entièrement vide → isEmpty true', () => {
    const ctx = extractDocumentContext([makePage({}), makePage({ id: 'p2', order: 1 })])
    expect(ctx.isEmpty).toBe(true)
  })
})

describe('truncateContext', () => {
  it('ne tronque pas un texte sous le budget', () => {
    expect(truncateContext('court', 100)).toBe('court')
  })

  it('tronque au-delà du budget et ajoute un marqueur', () => {
    const long = 'mot '.repeat(3000) // ~12000 chars
    const out = truncateContext(long, 500)
    expect(out.length).toBeLessThan(long.length)
    expect(out).toContain('tronqué')
  })

  it('utilise le budget par défaut quand non précisé', () => {
    const long = 'a'.repeat(DEFAULT_CONTEXT_BUDGET + 1000)
    const out = truncateContext(long)
    expect(out).toContain('tronqué')
  })
})
