/**
 * Tests bibliothèque de hachures (Pack A — A5) : intégrité du catalogue,
 * recherche, catégories, conversion en bloc insérable.
 */
import { describe, expect, it } from 'vitest'
import { blockToSvg } from '../blocks/types'
import {
  HATCHES,
  HATCH_CATEGORY_LABELS,
  getHatch,
  hatchCategories,
  hatchToBlock,
  resolveHatchBlock,
  searchHatches,
} from './hatches'

const REQUIRED = [
  'béton', 'béton armé', 'bois', 'acier', 'isolation', 'terre', 'gravier',
  'brique', 'pierre', 'membrane', 'verre', 'sable', 'eau', 'gypse', 'maçonnerie',
]

describe('catalogue de hachures', () => {
  it('contient au moins les 15 hachures V1', () => {
    expect(HATCHES.length).toBeGreaterThanOrEqual(15)
  })

  it('couvre tous les matériaux V1 requis (par nom ou tag)', () => {
    const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    for (const req of REQUIRED) {
      const found = HATCHES.some((h) => norm(`${h.name} ${h.tags.join(' ')}`).includes(norm(req)))
      expect(found, `hachure manquante : ${req}`).toBe(true)
    }
  })

  it('chaque hachure a des champs valides', () => {
    for (const h of HATCHES) {
      expect(h.id).toBeTruthy()
      expect(h.name).toBeTruthy()
      expect(h.description.length).toBeGreaterThan(5)
      expect(HATCH_CATEGORY_LABELS[h.category]).toBeTruthy()
      expect(h.tags.length).toBeGreaterThan(0)
      expect(h.svgBody).toBeTruthy()
      expect(h.size).toBeGreaterThan(0)
    }
  })

  it('identifiants uniques', () => {
    const ids = HATCHES.map((h) => h.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('toutes les catégories déclarées sont utilisées', () => {
    const used = new Set(hatchCategories())
    for (const c of Object.keys(HATCH_CATEGORY_LABELS)) {
      expect(used.has(c as never)).toBe(true)
    }
  })
})

describe('getHatch / searchHatches', () => {
  it('résout une hachure existante', () => {
    expect(getHatch('h-beton')?.name).toBe('Béton')
    expect(getHatch('inconnu')).toBeUndefined()
  })

  it('recherche par nom/tag, insensible aux accents', () => {
    expect(searchHatches('beton').some((h) => h.id === 'h-beton')).toBe(true)
    expect(searchHatches('ISOLATION').some((h) => h.category === 'isolation')).toBe(true)
    expect(searchHatches('').length).toBe(HATCHES.length)
  })

  it('filtre par catégorie', () => {
    const sol = searchHatches('', 'sol')
    expect(sol.length).toBeGreaterThan(0)
    expect(sol.every((h) => h.category === 'sol')).toBe(true)
  })

  it('aucune correspondance → vide', () => {
    expect(searchHatches('zzzxxqq')).toEqual([])
  })
})

describe('hatchToBlock / resolveHatchBlock', () => {
  it('produit un DrawingBlock insérable rasterisable', () => {
    const block = hatchToBlock(getHatch('h-acier')!)
    expect(block.id).toBe('hatch-h-acier')
    expect(block.category).toBe('annotations')
    expect(block.unitSystem).toBe('metric')
    expect(block.defaultWidth).toBeGreaterThan(0)
    // Le SVG complet se construit sans erreur (pipeline bloc).
    const svg = blockToSvg(block)
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg).toContain(block.svgBody)
  })

  it('resolveHatchBlock résout par id préfixé', () => {
    expect(resolveHatchBlock('hatch-h-bois')?.name).toBe('Bois (fil)')
    expect(resolveHatchBlock('detail-x')).toBeUndefined()
    expect(resolveHatchBlock('hatch-inconnu')).toBeUndefined()
  })
})
