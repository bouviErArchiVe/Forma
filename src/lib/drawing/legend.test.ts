/**
 * Tests légende de dessin (Pack B6) : construction (titre/échelle/clés),
 * géométrie SVG (cadre + pastilles + libellés), échappement, couleurs sûres,
 * conversion en bloc, et intégration du label d'échelle B4.
 */
import { describe, expect, it } from 'vitest'
import { blockToSvg } from '../blocks/types'
import {
  buildLegendSvg,
  createLegend,
  legendToBlock,
} from './legend'
import { scaleFromRatio } from './scale'

describe('createLegend', () => {
  it('valeurs par défaut + id déterministe', () => {
    const l = createLegend({ now: 7 })
    expect(l.id).toBe('legend-7')
    expect(l.title).toBe('Légende')
    expect(l.entries).toEqual([])
    expect(l.scale).toBeUndefined()
  })

  it('titre vide → libellé par défaut', () => {
    expect(createLegend({ title: '   ' }).title).toBe('Légende')
  })

  it('filtre les clés sans libellé et trime', () => {
    const l = createLegend({
      entries: [{ label: '  Mur  ' }, { label: '' }, { label: '   ' }, { label: 'Cloison', color: '#abc' }],
    })
    expect(l.entries).toHaveLength(2)
    expect(l.entries[0].label).toBe('Mur')
    expect(l.entries[1]).toEqual({ label: 'Cloison', color: '#abc' })
  })

  it('conserve le profil d’échelle fourni', () => {
    const scale = scaleFromRatio(50, 'm')
    expect(createLegend({ scale }).scale).toBe(scale)
  })
})

describe('buildLegendSvg', () => {
  it('cadre + titre + une ligne par clé', () => {
    const l = createLegend({ title: 'Clé', entries: [{ label: 'A' }, { label: 'B' }] })
    const svg = buildLegendSvg(l)
    expect(svg.width).toBeGreaterThan(0)
    expect(svg.height).toBeGreaterThan(0)
    expect(svg.svgBody).toContain('<rect') // cadre + pastilles
    expect(svg.svgBody).toContain('Clé')
    expect(svg.svgBody).toContain('A')
    expect(svg.svgBody).toContain('B')
    // 1 cadre + 2 pastilles
    const rects = (svg.svgBody.match(/<rect/g) || []).length
    expect(rects).toBe(3)
  })

  it('la hauteur croît avec le nombre de clés', () => {
    const few = buildLegendSvg(createLegend({ entries: [{ label: 'A' }] }))
    const many = buildLegendSvg(createLegend({ entries: [{ label: 'A' }, { label: 'B' }, { label: 'C' }] }))
    expect(many.height).toBeGreaterThan(few.height)
  })

  it('ligne d’échelle présente quand un profil est fourni (B4)', () => {
    const svg = buildLegendSvg(createLegend({ scale: scaleFromRatio(100, 'm'), entries: [] }))
    expect(svg.svgBody).toContain('Échelle')
    expect(svg.svgBody).toContain('1:100')
  })

  it('pas de ligne d’échelle sans profil', () => {
    const svg = buildLegendSvg(createLegend({ entries: [{ label: 'A' }] }))
    expect(svg.svgBody).not.toContain('Échelle')
  })

  it('échappement XML dans le titre et les libellés', () => {
    const svg = buildLegendSvg(createLegend({ title: '<x>&"\'', entries: [{ label: '<y>' }] }))
    expect(svg.svgBody).not.toContain('<x>')
    expect(svg.svgBody).not.toContain('<y>')
    expect(svg.svgBody).toContain('&lt;x&gt;')
    expect(svg.svgBody).toContain('&lt;y&gt;')
    expect(svg.svgBody).toContain('&amp;')
  })

  it('couleur invalide → currentColor (pas d’injection)', () => {
    const svg = buildLegendSvg(createLegend({ entries: [{ label: 'A', color: '"/><script>' }] }))
    expect(svg.svgBody).not.toContain('<script>')
    expect(svg.svgBody).toContain('fill="currentColor"')
  })

  it('couleur hex valide conservée', () => {
    const svg = buildLegendSvg(createLegend({ entries: [{ label: 'A', color: '#ff8800' }] }))
    expect(svg.svgBody).toContain('fill="#ff8800"')
  })
})

describe('legendToBlock', () => {
  it('produit un DrawingBlock annotations rasterisable', () => {
    const l = createLegend({ title: 'Plan', scale: scaleFromRatio(50, 'm'), entries: [{ label: 'Mur' }] })
    const block = legendToBlock(l)
    expect(block.id).toBe(`drawing-legend-${l.id}`)
    expect(block.category).toBe('annotations')
    expect(block.unitSystem).toBe('metric')
    expect(block.scaleLabel).toBe('1:50')
    expect(block.name).toContain('Plan')
    expect(block.defaultWidth).toBeGreaterThan(0)
    expect(block.defaultHeight).toBeGreaterThan(0)
    expect(block.tags).toContain('legend')
    expect(blockToSvg(block).startsWith('<svg')).toBe(true)
  })

  it('sans échelle → pas de scaleLabel', () => {
    const block = legendToBlock(createLegend({ entries: [{ label: 'A' }] }))
    expect(block.scaleLabel).toBeUndefined()
    expect(blockToSvg(block).startsWith('<svg')).toBe(true)
  })
})
