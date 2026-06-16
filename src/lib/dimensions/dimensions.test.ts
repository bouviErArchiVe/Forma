/**
 * Tests cotes techniques (Pack B1) : fonctions pures, formatage, échelle,
 * construction H/V/alignée, entrées invalides, conversion en bloc.
 */
import { describe, expect, it } from 'vitest'
import { blockToSvg } from '../blocks/types'
import {
  angleOf,
  buildDimensionSvg,
  createDimension,
  dimensionToBlock,
  distance,
  formatLength,
  midpoint,
  pxToReal,
} from './dimensions'

describe('fonctions pures', () => {
  it('distance euclidienne', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
    expect(distance({ x: 1, y: 1 }, { x: 1, y: 1 })).toBe(0)
  })

  it('pxToReal applique l’échelle', () => {
    expect(pxToReal(200, 10)).toBe(2000)
    expect(pxToReal(50, 0.5)).toBe(25)
  })

  it('angleOf et midpoint', () => {
    expect(angleOf({ x: 0, y: 0 }, { x: 1, y: 0 })).toBeCloseTo(0, 6)
    expect(angleOf({ x: 0, y: 0 }, { x: 0, y: 1 })).toBeCloseTo(Math.PI / 2, 6)
    expect(midpoint({ x: 0, y: 0 }, { x: 10, y: 20 })).toEqual({ x: 5, y: 10 })
  })
})

describe('formatLength', () => {
  it('métrique', () => {
    expect(formatLength(2000, 'mm')).toBe('2000 mm')
    expect(formatLength(12.34, 'cm')).toBe('12.3 cm')
    expect(formatLength(2.456, 'm')).toBe('2.46 m')
  })
  it('impérial', () => {
    expect(formatLength(10, 'in')).toBe('10″')
    expect(formatLength(5, 'ft')).toBe('5′')
    expect(formatLength(5.5, 'ft')).toBe('5′ 6″')
  })
  it('valeur non finie → tiret', () => {
    expect(formatLength(NaN, 'mm')).toBe('—')
  })
})

describe('createDimension', () => {
  it('horizontale : end sur l’axe X, displayLength = px × scale', () => {
    const d = createDimension({ type: 'horizontal', lengthPx: 200, unit: 'mm', scale: 10, now: 1 })
    expect(d.end.y).toBe(0)
    expect(d.end.x).toBeCloseTo(200, 3)
    expect(d.measuredLength).toBeCloseTo(200, 3)
    expect(d.displayLength).toBeCloseTo(2000, 3)
    expect(d.text).toBe('2000 mm')
    expect(d.id).toBe('dim-1')
  })

  it('verticale : end sur l’axe Y', () => {
    const d = createDimension({ type: 'vertical', lengthPx: 120, unit: 'cm', scale: 1 })
    expect(d.end.x).toBeCloseTo(0, 3)
    expect(d.end.y).toBeCloseTo(120, 3)
  })

  it('alignée : suit l’angle donné', () => {
    const d = createDimension({ type: 'aligned', lengthPx: 100, angleDeg: 90, unit: 'mm', scale: 1 })
    expect(d.end.x).toBeCloseTo(0, 1)
    expect(d.end.y).toBeCloseTo(100, 1)
  })

  it('libellé personnalisé respecté', () => {
    const d = createDimension({ type: 'horizontal', lengthPx: 100, unit: 'mm', scale: 1, text: 'A-B' })
    expect(d.text).toBe('A-B')
  })

  it('entrées invalides : longueur/échelle ≤ 0 → valeurs sûres', () => {
    const d = createDimension({ type: 'horizontal', lengthPx: -5, unit: 'mm', scale: 0 })
    expect(d.measuredLength).toBe(0)
    expect(d.scale).toBe(1)
    expect(Number.isFinite(d.displayLength)).toBe(true)
  })
})

describe('buildDimensionSvg', () => {
  it('produit un corps SVG et des dimensions de boîte positives', () => {
    const d = createDimension({ type: 'horizontal', lengthPx: 200, unit: 'mm', scale: 10 })
    const svg = buildDimensionSvg(d)
    expect(svg.width).toBeGreaterThan(200)
    expect(svg.height).toBeGreaterThan(0)
    expect(svg.svgBody).toContain('<text')
    expect(svg.svgBody).toContain('2000 mm')
  })

  it('ticks au lieu de flèches : pas de tête de flèche remplie', () => {
    const arrows = buildDimensionSvg(createDimension({ type: 'horizontal', lengthPx: 100, unit: 'mm', scale: 1, style: { ends: 'arrows' } }))
    const ticks = buildDimensionSvg(createDimension({ type: 'horizontal', lengthPx: 100, unit: 'mm', scale: 1, style: { ends: 'ticks' } }))
    // la tête de flèche est un polygone fermé rempli (« Z" fill="currentColor" »)
    expect(arrows.svgBody).toContain('Z" fill="currentColor"')
    expect(ticks.svgBody).not.toContain('Z" fill="currentColor"')
  })
})

describe('dimensionToBlock', () => {
  it('produit un DrawingBlock annotations rasterisable', () => {
    const d = createDimension({ type: 'aligned', lengthPx: 150, angleDeg: 30, unit: 'm', scale: 0.05 })
    const block = dimensionToBlock(d)
    expect(block.id).toBe(`dimension-${d.id}`)
    expect(block.category).toBe('annotations')
    expect(block.defaultWidth).toBeGreaterThan(0)
    expect(block.defaultHeight).toBeGreaterThan(0)
    expect(blockToSvg(block).startsWith('<svg')).toBe(true)
  })
})
