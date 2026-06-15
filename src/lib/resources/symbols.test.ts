/**
 * Tests bibliothèque de symboles techniques (Pack A — A4) : intégrité du
 * catalogue, couverture des catégories, recherche, conversion en bloc.
 */
import { describe, expect, it } from 'vitest'
import { blockToSvg } from '../blocks/types'
import {
  SYMBOLS,
  SYMBOL_CATEGORY_LABELS,
  getSymbol,
  resolveSymbolBlock,
  searchSymbols,
  symbolCategories,
  symbolToBlock,
} from './symbols'

describe('catalogue de symboles', () => {
  it('contient un catalogue substantiel (≥ 35)', () => {
    expect(SYMBOLS.length).toBeGreaterThanOrEqual(35)
  })

  it('couvre les 5 catégories V1', () => {
    const cats = new Set(symbolCategories())
    for (const c of ['architecture', 'structure', 'mecanique', 'electricite', 'annotation'] as const) {
      expect(cats.has(c)).toBe(true)
    }
  })

  it('chaque catégorie a plusieurs symboles', () => {
    for (const c of symbolCategories()) {
      expect(SYMBOLS.filter((s) => s.category === c).length).toBeGreaterThanOrEqual(3)
    }
  })

  it('chaque symbole a des champs valides', () => {
    for (const s of SYMBOLS) {
      expect(s.id.startsWith('sym-')).toBe(true)
      expect(s.name).toBeTruthy()
      expect(s.description.length).toBeGreaterThan(5)
      expect(SYMBOL_CATEGORY_LABELS[s.category]).toBeTruthy()
      expect(s.tags.length).toBeGreaterThan(0)
      expect(s.svg).toBeTruthy()
      expect(s.viewBox).toBeTruthy()
      expect(s.defaultSize).toBeGreaterThan(0)
    }
  })

  it('identifiants uniques', () => {
    const ids = SYMBOLS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('getSymbol / searchSymbols', () => {
  it('résout un symbole existant', () => {
    expect(getSymbol('sym-nord')?.name).toBe('Flèche Nord')
    expect(getSymbol('inconnu')).toBeUndefined()
  })

  it('recherche par nom/tag, insensible aux accents', () => {
    expect(searchSymbols('nord').some((s) => s.id === 'sym-nord')).toBe(true)
    expect(searchSymbols('PRISE').some((s) => s.category === 'electricite')).toBe(true)
    expect(searchSymbols('coupe').length).toBeGreaterThan(0)
    expect(searchSymbols('').length).toBe(SYMBOLS.length)
  })

  it('filtre par catégorie', () => {
    const struct = searchSymbols('', 'structure')
    expect(struct.length).toBeGreaterThan(0)
    expect(struct.every((s) => s.category === 'structure')).toBe(true)
  })

  it('aucune correspondance → vide', () => {
    expect(searchSymbols('zzzxxqq')).toEqual([])
  })
})

describe('symbolToBlock / resolveSymbolBlock', () => {
  it('produit un DrawingBlock carré rasterisable', () => {
    const block = symbolToBlock(getSymbol('sym-prise')!)
    expect(block.id).toBe('symbol-sym-prise')
    expect(block.category).toBe('symbols')
    expect(block.unitSystem).toBe('metric')
    expect(block.defaultWidth).toBe(block.defaultHeight)
    const svg = blockToSvg(block)
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg).toContain(block.svgBody)
  })

  it('resolveSymbolBlock résout par id préfixé', () => {
    expect(resolveSymbolBlock('symbol-sym-porte')?.name).toBe('Porte (plan)')
    expect(resolveSymbolBlock('hatch-x')).toBeUndefined()
    expect(resolveSymbolBlock('symbol-inconnu')).toBeUndefined()
  })
})
