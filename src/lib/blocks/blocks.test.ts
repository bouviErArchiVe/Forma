/**
 * Tests bibliothèque de blocs : catalogues, recherche, filtre, insertion.
 */
import { describe, expect, it } from 'vitest'
import { createEmptyPage } from '../../db'
import {
  blockToSvg,
  blocksForUnit,
  categoriesForUnit,
  getBlock,
  IMPERIAL_BLOCKS,
  METRIC_BLOCKS,
  queryBlocks,
} from './index'
import { buildBlockImageElement } from './insert'

// ─── Catalogues ────────────────────────────────────────────────────────────────

describe('catalogues', () => {
  it('métrique et impérial chargent avec une base riche', () => {
    expect(METRIC_BLOCKS.length).toBeGreaterThanOrEqual(40)
    expect(IMPERIAL_BLOCKS.length).toBeGreaterThanOrEqual(25)
  })

  it('ids uniques et champs requis', () => {
    const all = [...METRIC_BLOCKS, ...IMPERIAL_BLOCKS]
    const ids = all.map((b) => b.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const b of all) {
      expect(b.name, b.id).toBeTruthy()
      expect(b.svgBody, b.id).toBeTruthy()
      expect(b.defaultWidth, b.id).toBeGreaterThan(0)
      expect(b.defaultHeight, b.id).toBeGreaterThan(0)
      expect(b.tags.length, b.id).toBeGreaterThan(0)
    }
  })

  it('chaque bloc porte le bon système d’unités', () => {
    expect(METRIC_BLOCKS.every((b) => b.unitSystem === 'metric')).toBe(true)
    expect(IMPERIAL_BLOCKS.every((b) => b.unitSystem === 'imperial')).toBe(true)
  })

  it('couvre des catégories variées (≥ 8 par système)', () => {
    expect(categoriesForUnit('metric').length).toBeGreaterThanOrEqual(8)
    expect(categoriesForUnit('imperial').length).toBeGreaterThanOrEqual(8)
  })

  it('contient les blocs emblématiques attendus', () => {
    expect(getBlock('m-wc')).toBeDefined() // WC métrique
    expect(getBlock('i-wood-2x4')).toBeDefined() // 2x4 impérial
    expect(getBlock('i-door-30')?.scaleLabel).toContain("3'-0")
  })

  it('blockToSvg produit un SVG valide avec viewBox', () => {
    const svg = blockToSvg(METRIC_BLOCKS[0])
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg).toContain('viewBox="0 0')
    expect(svg).toContain('</svg>')
  })
})

// ─── Recherche / filtre ──────────────────────────────────────────────────────

describe('queryBlocks', () => {
  it('filtre par catégorie', () => {
    const sanitary = queryBlocks({ unit: 'metric', category: 'sanitary' })
    expect(sanitary.length).toBeGreaterThan(0)
    expect(sanitary.every((b) => b.category === 'sanitary')).toBe(true)
  })

  it('recherche par nom, tag et échelle (insensible accents/casse)', () => {
    expect(queryBlocks({ unit: 'metric', search: 'lavabo' }).some((b) => b.id === 'm-sink')).toBe(true)
    expect(queryBlocks({ unit: 'imperial', search: '2x4' }).some((b) => b.id === 'i-wood-2x4')).toBe(true)
    expect(queryBlocks({ unit: 'metric', search: 'ACIER' }).length).toBeGreaterThan(0)
  })

  it('ne mélange pas les systèmes d’unités', () => {
    expect(blocksForUnit('metric').some((b) => b.unitSystem === 'imperial')).toBe(false)
  })

  it('recherche vide → tous les blocs du système', () => {
    expect(queryBlocks({ unit: 'metric', search: '' }).length).toBe(METRIC_BLOCKS.length)
  })
})

// ─── Insertion : page-op pur (la rasterisation canvas n'est pas testable hors navigateur) ──

describe('buildBlockImageElement', () => {
  it('produit une ImageElement centrée, avec assetId et métadonnées de bloc', () => {
    const page = createEmptyPage({
      id: 'p1', notebookId: 'nb1', order: 0, template: 'blank', rotation: 0,
    })
    const block = getBlock('m-wc')!
    const img = buildBlockImageElement(page, block, 'asset-1', 300, 200)
    expect(img.assetId).toBe('asset-1')
    expect(img.blockId).toBe('m-wc')
    expect(img.blockCategory).toBe('sanitary')
    expect(img.blockUnit).toBe('metric')
    // centré sur (300, 200)
    expect(img.x).toBe(300 - block.defaultWidth / 2)
    expect(img.y).toBe(200 - block.defaultHeight / 2)
    expect(img.width).toBe(block.defaultWidth)
    expect(img.pageId).toBe('p1')
  })

  it('un bloc impérial conserve son unité', () => {
    const page = createEmptyPage({
      id: 'p2', notebookId: 'nb1', order: 0, template: 'blank', rotation: 0,
    })
    const img = buildBlockImageElement(page, getBlock('i-wood-2x4')!, 'a2', 0, 0)
    expect(img.blockUnit).toBe('imperial')
    expect(img.blockId).toBe('i-wood-2x4')
  })
})
