/**
 * Tests bibliothèque de blocs : catalogues, recherche, filtre, insertion.
 */
import { describe, expect, it } from 'vitest'
import { createEmptyPage } from '../../db'
import {
  blockToSvg,
  blocksForUnit,
  categoriesForUnit,
  expandQueryTerms,
  getBlock,
  IMPERIAL_BLOCKS,
  METRIC_BLOCKS,
  queryBlocks,
  resolveBlock,
} from './index'
import { buildBlockImageElement } from './insert'
import { buildParametricBlock, PARAMETRIC_DEFS } from './parametric'
import type { DrawingBlock } from './types'

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

// ─── V2 : catalogue enrichi ────────────────────────────────────────────────────

describe('catalogue enrichi (V2)', () => {
  it('métrique ≥ 65 blocs, impérial ≥ 45 blocs', () => {
    expect(METRIC_BLOCKS.length).toBeGreaterThanOrEqual(65)
    expect(IMPERIAL_BLOCKS.length).toBeGreaterThanOrEqual(45)
  })

  it('nouveaux blocs présents (W250, 2x12, WC accessible, ferme)', () => {
    expect(getBlock('m-steel-w250')).toBeDefined()
    expect(getBlock('i-wood-2x12')).toBeDefined()
    expect(getBlock('m-wc-accessible')).toBeDefined()
    expect(getBlock('m-wood-truss')).toBeDefined()
  })
})

// ─── V2 : recherche par synonymes FR/EN ────────────────────────────────────────

describe('expandQueryTerms (synonymes)', () => {
  it('toilet ↔ wc, beam ↔ poutre, steel ↔ acier (bidirectionnel)', () => {
    expect(expandQueryTerms('toilet')).toContain('wc')
    expect(expandQueryTerms('wc')).toContain('toilet')
    expect(expandQueryTerms('beam')).toContain('poutre')
    expect(expandQueryTerms('poutre')).toContain('beam')
    expect(expandQueryTerms('steel')).toContain('acier')
    expect(expandQueryTerms('wood')).toContain('bois')
    expect(expandQueryTerms('door')).toContain('porte')
  })
})

describe('queryBlocks avec synonymes', () => {
  it('« toilet » trouve le WC métrique', () => {
    expect(queryBlocks({ unit: 'metric', search: 'toilet' }).some((b) => b.id === 'm-wc')).toBe(true)
  })
  it('« poutre » trouve une W-beam impériale', () => {
    expect(queryBlocks({ unit: 'imperial', search: 'poutre' }).some((b) => b.category === 'steel')).toBe(true)
  })
  it('« door » trouve une porte métrique', () => {
    expect(queryBlocks({ unit: 'metric', search: 'door' }).some((b) => b.category === 'doors-windows')).toBe(true)
  })
})

// ─── V2 : blocs personnalisés (resolveBlock) ───────────────────────────────────

describe('resolveBlock avec blocs personnalisés', () => {
  const custom: DrawingBlock = {
    id: 'custom-1', name: 'Mon bloc', category: 'symbols', unitSystem: 'metric',
    tags: ['personnalisé'], defaultWidth: 60, defaultHeight: 60, svgBody: '',
    custom: true, assetId: 'asset-x',
  }

  it('résout un bloc du catalogue et un bloc custom', () => {
    expect(resolveBlock('m-wc')?.id).toBe('m-wc')
    expect(resolveBlock('custom-1', [custom])?.name).toBe('Mon bloc')
    expect(resolveBlock('inexistant', [custom])).toBeUndefined()
  })

  it('queryBlocks inclut les customs du bon système et filtre par recherche', () => {
    const res = queryBlocks({ unit: 'metric', search: 'mon bloc', customBlocks: [custom] })
    expect(res.some((b) => b.id === 'custom-1')).toBe(true)
    // pas affiché en impérial
    expect(queryBlocks({ unit: 'imperial', customBlocks: [custom] }).some((b) => b.id === 'custom-1')).toBe(false)
  })
})

// ─── V2 : blocs paramétriques ──────────────────────────────────────────────────

describe('buildParametricBlock', () => {
  it('rectangle : dimensions reflétées dans le nom et le SVG', () => {
    const def = PARAMETRIC_DEFS.find((d) => d.kind === 'rectangle')!
    const block = buildParametricBlock(def, 'metric', { w: 1000, h: 600 })
    expect(block.name).toContain('1000')
    expect(block.name).toContain('600')
    expect(block.svgBody).toContain('<rect')
    expect(block.defaultWidth).toBeGreaterThan(0)
    expect(block.scaleLabel).toContain('mm')
  })

  it('porte : génère un SVG d’ouverture, label impérial en pouces', () => {
    const def = PARAMETRIC_DEFS.find((d) => d.kind === 'door')!
    const block = buildParametricBlock(def, 'imperial', { w: 36 })
    expect(block.svgBody).toContain('path')
    expect(block.scaleLabel).toContain('″')
    expect(block.category).toBe('doors-windows')
  })

  it('valeurs hors bornes ramenées dans l’intervalle', () => {
    const def = PARAMETRIC_DEFS.find((d) => d.kind === 'rectangle')!
    const block = buildParametricBlock(def, 'metric', { w: 999999, h: -50 })
    // pas de NaN, dimensions positives et bornées
    expect(block.defaultWidth).toBeGreaterThan(0)
    expect(block.defaultHeight).toBeGreaterThan(0)
    expect(Number.isFinite(block.defaultWidth)).toBe(true)
  })

  it('axe : label injecté et échappé', () => {
    const def = PARAMETRIC_DEFS.find((d) => d.kind === 'grid')!
    const block = buildParametricBlock(def, 'metric', {}, 'B')
    expect(block.svgBody).toContain('>B<')
    const xss = buildParametricBlock(def, 'metric', {}, '<x')
    expect(xss.svgBody).not.toContain('<x<')
  })

  it('chaque définition produit un SVG valide', () => {
    for (const def of PARAMETRIC_DEFS) {
      const block = buildParametricBlock(def, 'metric', {})
      const svg = blockToSvg(block)
      expect(svg.startsWith('<svg'), def.kind).toBe(true)
      expect(svg).toContain('</svg>')
    }
  })
})
