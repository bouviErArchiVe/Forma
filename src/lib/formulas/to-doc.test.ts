import { describe, expect, it } from 'vitest'
import { createDocument } from '../docs/model'
import { appendCalculationToDocument, formatCalculationHtml } from './to-doc'

describe('formulas/to-doc', () => {
  it('formats a calculation block with values and result rows', () => {
    const html = formatCalculationHtml({
      title: 'Loi de Blondel',
      formulaText: '2H + G = 60 à 64 cm',
      values: { totalHeight: '280', steps: '18' },
      fieldLabels: { totalHeight: 'Hauteur totale', steps: 'Marches' },
      result: {
        summary: '2H + G = 62 cm',
        rows: [
          { label: '2H + G (Blondel)', value: '62 cm' },
          { label: 'Verdict', value: 'Confortable' },
        ],
      },
    })
    expect(html).toContain('Loi de Blondel')
    expect(html).toContain('Hauteur totale')
    expect(html).toContain('data-forma-calc="1"')
    expect(html).toContain('2H + G = 62 cm')
    expect(html).not.toContain('<script')
  })

  it('escapes HTML in user values', () => {
    const html = formatCalculationHtml({
      title: 'Test',
      formulaText: 'x',
      values: { a: '<b>hack</b>' },
      result: { summary: 'ok' },
    })
    expect(html).toContain('&lt;b&gt;hack&lt;/b&gt;')
    expect(html).not.toContain('<b>hack</b>')
  })

  it('appends block to the last page', () => {
    const doc = createDocument('Notes', 'blank')
    const block = '<section data-forma-calc="1"><p>calc</p></section>'
    const next = appendCalculationToDocument(doc, block)
    expect(next.pages).toHaveLength(1)
    expect(next.pages[0].html).toContain('calc')
    expect(next.pages[0].html).toContain('<h1>')
  })
})
