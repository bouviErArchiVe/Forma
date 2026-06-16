/**
 * Tests cartouches (Pack B3) : tailles ISO, construction des champs, géométrie
 * SVG (cadre + colonnes), échappement, formats A4→A0, conversion en bloc.
 */
import { describe, expect, it } from 'vitest'
import { blockToSvg } from '../blocks/types'
import {
  buildTitleBlockSvg,
  createTitleBlock,
  titleBlockToBlock,
  titleBlockWidthPx,
  DEFAULT_TITLE_BLOCK_FIELDS,
  SHEET_FORMATS,
  SHEET_SIZES_MM,
} from './titleblocks'

describe('tailles ISO', () => {
  it('cinq formats A4→A0, largeur croissante', () => {
    expect(SHEET_FORMATS).toEqual(['A4', 'A3', 'A2', 'A1', 'A0'])
    const widths = SHEET_FORMATS.map((f) => SHEET_SIZES_MM[f].width)
    for (let i = 1; i < widths.length; i++) expect(widths[i]).toBeGreaterThan(widths[i - 1])
  })

  it('titleBlockWidthPx croît avec le format et reste borné', () => {
    expect(titleBlockWidthPx('A4')).toBeLessThan(titleBlockWidthPx('A0'))
    for (const f of SHEET_FORMATS) {
      const w = titleBlockWidthPx(f)
      expect(w).toBeGreaterThanOrEqual(180)
      expect(w).toBeLessThanOrEqual(740)
    }
  })
})

describe('createTitleBlock', () => {
  it('valeurs par défaut + id déterministe', () => {
    const tb = createTitleBlock({ format: 'A3', now: 9 })
    expect(tb.id).toBe('tb-9')
    expect(tb.format).toBe('A3')
    expect(tb.fields.projet).toBe(DEFAULT_TITLE_BLOCK_FIELDS.projet)
    expect(tb.fields.echelle).toBe('1:100')
  })

  it('format inconnu → A4', () => {
    // @ts-expect-error test de robustesse à l'exécution
    expect(createTitleBlock({ format: 'B5' }).format).toBe('A4')
  })

  it('projet vide ou espaces → libellé par défaut, autres champs trimés', () => {
    const tb = createTitleBlock({ format: 'A4', fields: { projet: '   ', date: '  2026  ', feuille: '' } })
    expect(tb.fields.projet).toBe(DEFAULT_TITLE_BLOCK_FIELDS.projet)
    expect(tb.fields.date).toBe('2026')
    expect(tb.fields.feuille).toBe('')
  })
})

describe('buildTitleBlockSvg', () => {
  it('cadre + 3 séparateurs de colonnes + estampille format', () => {
    const svg = buildTitleBlockSvg(createTitleBlock({ format: 'A2', fields: { projet: 'Villa' } }))
    expect(svg.width).toBe(titleBlockWidthPx('A2'))
    expect(svg.height).toBeGreaterThan(0)
    expect(svg.svgBody).toContain('<rect')
    // 3 séparateurs verticaux entre les 4 colonnes
    const dividers = (svg.svgBody.match(/<path/g) || []).length
    expect(dividers).toBe(3)
    expect(svg.svgBody).toContain('Villa')
    expect(svg.svgBody).toContain('A2')
  })

  it('valeur vide → tiret « — »', () => {
    const svg = buildTitleBlockSvg(createTitleBlock({ format: 'A4', fields: { projet: 'P', date: '', echelle: '', feuille: '' } }))
    expect(svg.svgBody).toContain('—')
  })

  it('libellés des champs présents', () => {
    const svg = buildTitleBlockSvg(createTitleBlock({ format: 'A4', fields: { projet: 'P' } }))
    expect(svg.svgBody).toContain('Projet')
    expect(svg.svgBody).toContain('Date')
    expect(svg.svgBody).toContain('Échelle')
    expect(svg.svgBody).toContain('Feuille')
  })

  it('échappement : caractères XML neutralisés dans les champs', () => {
    const svg = buildTitleBlockSvg(createTitleBlock({ format: 'A4', fields: { projet: '<x>&"\'' } }))
    expect(svg.svgBody).not.toContain('<x>')
    expect(svg.svgBody).toContain('&lt;x&gt;')
    expect(svg.svgBody).toContain('&amp;')
    expect(svg.svgBody).toContain('&quot;')
    expect(svg.svgBody).toContain('&#39;')
  })
})

describe('titleBlockToBlock', () => {
  it('produit un DrawingBlock annotations rasterisable', () => {
    const tb = createTitleBlock({ format: 'A1', fields: { projet: 'Tour', echelle: '1:200' } })
    const block = titleBlockToBlock(tb)
    expect(block.id).toBe(`titleblock-${tb.id}`)
    expect(block.category).toBe('annotations')
    expect(block.unitSystem).toBe('metric')
    expect(block.scaleLabel).toBe('A1')
    expect(block.name).toContain('A1')
    expect(block.name).toContain('Tour')
    expect(block.defaultWidth).toBeGreaterThan(0)
    expect(block.defaultHeight).toBeGreaterThan(0)
    expect(blockToSvg(block).startsWith('<svg')).toBe(true)
  })

  it('couvre les cinq formats sans erreur', () => {
    for (const f of SHEET_FORMATS) {
      const block = titleBlockToBlock(createTitleBlock({ format: f }))
      expect(block.defaultWidth).toBeGreaterThan(0)
      expect(blockToSvg(block).startsWith('<svg')).toBe(true)
    }
  })
})
