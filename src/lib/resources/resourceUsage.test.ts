/**
 * Tests Resource Usage (Phase 3) : détection, résolution, déduplication,
 * comptage, et génération de légende depuis les ressources utilisées.
 */
import { describe, expect, it } from 'vitest'
import { blockToSvg } from '../blocks/types'
import { resourceToBlock } from './resourceToBlock'
import {
  collectResourceUsage,
  parseResourceBlockId,
  resolveUsedResource,
} from './resourceUsage'
import { generateUsageLegend, LEGENDS, legendToResource } from './legends'

describe('parseResourceBlockId', () => {
  it('découpe type + resourceId au premier tiret', () => {
    expect(parseResourceBlockId('hatch-h-beton')).toEqual({ type: 'hatch', resourceId: 'h-beton' })
    expect(parseResourceBlockId('symbol-sym-nord')).toEqual({ type: 'symbol', resourceId: 'sym-nord' })
    expect(parseResourceBlockId('detail-d-wall-wood')).toEqual({ type: 'detail', resourceId: 'd-wall-wood' })
  })
  it('rejette les types inconnus ou ids vides', () => {
    expect(parseResourceBlockId('steel-w-200')).toBeNull()
    expect(parseResourceBlockId('hatch-')).toBeNull()
    expect(parseResourceBlockId('nodash')).toBeNull()
  })
})

describe('resolveUsedResource', () => {
  it('résout des ressources Factory connues', () => {
    expect(resolveUsedResource('hatch-h-beton')?.type).toBe('hatch')
    expect(resolveUsedResource('symbol-sym-nord')?.type).toBe('symbol')
    expect(resolveUsedResource('detail-d-wall-wood')?.type).toBe('detail')
  })
  it('renvoie undefined pour inconnu ou bloc générique', () => {
    expect(resolveUsedResource('hatch-inconnu')).toBeUndefined()
    expect(resolveUsedResource('steel-beam')).toBeUndefined()
  })
})

describe('collectResourceUsage', () => {
  it('page vide → usage vide', () => {
    const u = collectResourceUsage([])
    expect(u.total).toBe(0)
    expect(u.uniqueCount).toBe(0)
    expect(u.entries).toEqual([])
    expect(u.typesUsed).toEqual([])
  })

  it('déduplique et compte les occurrences', () => {
    const u = collectResourceUsage([
      { blockId: 'hatch-h-beton' },
      { blockId: 'hatch-h-beton' },
      { blockId: 'symbol-sym-nord' },
      { blockId: 'detail-d-wall-wood' },
      { }, // sans blockId
      { blockId: 'steel-generic' }, // hors Factory → ignoré
    ])
    expect(u.total).toBe(4)
    expect(u.uniqueCount).toBe(3)
    const beton = u.entries.find((e) => e.resource.id === 'h-beton')
    expect(beton?.count).toBe(2)
    expect(u.typesUsed.sort()).toEqual(['detail', 'hatch', 'symbol'])
    expect(u.categories.length).toBeGreaterThan(0)
  })

  it('trie par occurrences décroissantes', () => {
    const u = collectResourceUsage([
      { blockId: 'symbol-sym-nord' },
      { blockId: 'hatch-h-beton' },
      { blockId: 'hatch-h-beton' },
      { blockId: 'hatch-h-beton' },
    ])
    expect(u.entries[0].resource.id).toBe('h-beton')
    expect(u.entries[0].count).toBe(3)
  })
})

describe('generateUsageLegend', () => {
  it('produit une légende GraphicResource insérable', () => {
    const usage = collectResourceUsage([{ blockId: 'hatch-h-beton' }, { blockId: 'symbol-sym-nord' }])
    const legend = generateUsageLegend(usage.entries.map((e) => e.resource))
    expect(legend.type).toBe('legend')
    expect(legend.insertable).toBe(true)
    expect(legend.defaultWidth).toBeGreaterThan(0)
    expect(legend.defaultHeight).toBeGreaterThan(0)
    // chaque ressource apparaît (nom dans le SVG)
    expect(legend.svg).toContain('Béton')
    expect(legend.svg).toContain('Flèche Nord')
    // rasterisable via le pipeline bloc
    const block = resourceToBlock(legend)
    expect(blockToSvg(block).startsWith('<svg')).toBe(true)
  })

  it('état vide : génère une légende avec message clair', () => {
    const legend = generateUsageLegend([])
    expect(legend.svg).toContain('Aucune ressource')
    expect(legend.defaultHeight).toBeGreaterThan(0)
  })

  it('titre personnalisable', () => {
    const legend = generateUsageLegend([], { title: 'Ma légende' })
    expect(legend.name).toBe('Ma légende')
    expect(legend.svg).toContain('Ma légende')
  })
})

describe('non-régression des légendes statiques', () => {
  it('les 5 légendes V1 sont toujours présentes et convertibles', () => {
    expect(LEGENDS.length).toBe(5)
    for (const l of LEGENDS) {
      const block = resourceToBlock(legendToResource(l))
      expect(block.id).toBe(`legend-${l.id}`)
      expect(block.svgBody).toBe(l.svg)
    }
  })
})
