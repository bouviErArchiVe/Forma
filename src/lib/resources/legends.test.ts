/**
 * Tests bibliothèque de légendes (V1) : catalogue, recherche, conversion en
 * ressource/bloc insérable.
 */
import { describe, expect, it } from 'vitest'
import { blockToSvg } from '../blocks/types'
import {
  LEGENDS,
  LEGEND_CATEGORY_LABELS,
  getLegend,
  legendCategories,
  legendToResource,
  resolveLegendBlock,
  searchLegends,
} from './legends'
import { resourceToBlock } from './resourceToBlock'

describe('catalogue de légendes', () => {
  it('contient les 5 types V1', () => {
    expect(LEGENDS.length).toBeGreaterThanOrEqual(5)
    const cats = new Set(legendCategories())
    for (const c of ['materiaux', 'hachures', 'symboles', 'details', 'annotations'] as const) {
      expect(cats.has(c)).toBe(true)
    }
  })

  it('champs valides et ids uniques', () => {
    const ids = LEGENDS.map((l) => l.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const l of LEGENDS) {
      expect(l.id.startsWith('leg-')).toBe(true)
      expect(l.name).toBeTruthy()
      expect(l.description.length).toBeGreaterThan(5)
      expect(LEGEND_CATEGORY_LABELS[l.category]).toBeTruthy()
      expect(l.svg).toContain('<text')
      expect(l.width).toBeGreaterThan(0)
      expect(l.height).toBeGreaterThan(0)
    }
  })
})

describe('searchLegends', () => {
  it('trouve par nom/tag (accents-insensible)', () => {
    expect(searchLegends('matériaux').some((l) => l.id === 'leg-materiaux')).toBe(true)
    expect(searchLegends('HACHURES').some((l) => l.category === 'hachures')).toBe(true)
    expect(searchLegends('').length).toBe(LEGENDS.length)
    expect(searchLegends('zzzqqq')).toEqual([])
  })
})

describe('legendToResource / resolveLegendBlock', () => {
  it('adapte en GraphicResource insérable', () => {
    const r = legendToResource(getLegend('leg-symboles')!)
    expect(r.type).toBe('legend')
    expect(r.insertable).toBe(true)
    expect(r.blockCategory).toBe('annotations')
    const block = resourceToBlock(r)
    expect(block.id).toBe('legend-leg-symboles')
    const svg = blockToSvg(block)
    expect(svg.startsWith('<svg')).toBe(true)
  })

  it('resolveLegendBlock résout par id préfixé', () => {
    expect(resolveLegendBlock('legend-leg-details')?.name).toContain('Détails')
    expect(resolveLegendBlock('hatch-x')).toBeUndefined()
    expect(resolveLegendBlock('legend-inconnu')).toBeUndefined()
  })
})
