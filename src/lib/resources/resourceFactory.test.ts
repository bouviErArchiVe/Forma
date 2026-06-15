/**
 * Tests Resource Factory : forme commune, recherche/catégories génériques,
 * conversion ressource → bloc, et NON-RÉGRESSION des convertisseurs existants
 * (hachures / symboles / détails produisent des blocs identiques).
 */
import { describe, expect, it } from 'vitest'
import {
  buildSearchText,
  resourceCategories,
  searchResources,
  type GraphicResource,
} from './resourceTypes'
import { resourceBlockId, resourceToBlock } from './resourceToBlock'
import { HATCHES, hatchToBlock, hatchToResource } from './hatches'
import { SYMBOLS, symbolToBlock, symbolToResource } from './symbols'
import { CONSTRUCTION_DETAILS, detailToBlock, detailToResource } from './details'

describe('helpers génériques', () => {
  it('buildSearchText normalise et concatène (accents/casse)', () => {
    const s = buildSearchText(['Béton Armé', ['acier', 'INOX'], undefined])
    expect(s).toBe('beton arme acier inox')
  })

  it('searchResources filtre par texte et catégorie', () => {
    const all: GraphicResource[] = HATCHES.map(hatchToResource)
    expect(searchResources(all, '').length).toBe(all.length)
    expect(searchResources(all, 'beton').length).toBeGreaterThan(0)
    const sol = searchResources(all, '', 'sol')
    expect(sol.every((r) => r.category === 'sol')).toBe(true)
    expect(searchResources(all, 'zzzqqq')).toEqual([])
  })

  it('resourceCategories renvoie clés + libellés uniques', () => {
    const cats = resourceCategories(SYMBOLS.map(symbolToResource))
    const keys = cats.map((c) => c.key)
    expect(new Set(keys).size).toBe(keys.length)
    expect(cats.every((c) => c.label.length > 0)).toBe(true)
  })
})

describe('resourceToBlock', () => {
  it('id déterministe `<type>-<id>`', () => {
    const r = hatchToResource(HATCHES[0])
    expect(resourceBlockId(r)).toBe(`hatch-${HATCHES[0].id}`)
  })

  it('produit un bloc cohérent', () => {
    const r = symbolToResource(SYMBOLS[0])
    const block = resourceToBlock(r)
    expect(block.id).toBe(`symbol-${SYMBOLS[0].id}`)
    expect(block.category).toBe('symbols')
    expect(block.svgBody).toBe(r.svg)
    expect(block.tags[0]).toBe('symbole')
  })
})

describe('non-régression des convertisseurs existants', () => {
  it('hachures : hatchToBlock inchangé après délégation', () => {
    for (const h of HATCHES) {
      const block = hatchToBlock(h)
      expect(block.id).toBe(`hatch-${h.id}`)
      expect(block.category).toBe('annotations')
      expect(block.unitSystem).toBe('metric')
      expect(block.svgBody).toBe(h.svgBody)
      expect(block.defaultWidth).toBe(h.size)
      expect(block.tags).toEqual(['hachure', ...h.tags])
    }
  })

  it('symboles : symbolToBlock inchangé', () => {
    for (const s of SYMBOLS) {
      const block = symbolToBlock(s)
      expect(block.id).toBe(`symbol-${s.id}`)
      expect(block.category).toBe('symbols')
      expect(block.svgBody).toBe(s.svg)
      expect(block.tags).toEqual(['symbole', ...s.tags])
    }
  })

  it('détails : detailToBlock inchangé', () => {
    for (const d of CONSTRUCTION_DETAILS) {
      const block = detailToBlock(d)
      expect(block.id).toBe(`detail-${d.id}`)
      expect(block.category).toBe('annotations')
      expect(block.svgBody).toBe(d.svgBody)
      expect(block.defaultWidth).toBe(d.width)
      expect(block.defaultHeight).toBe(d.height)
      expect(block.tags).toEqual(['détail', ...d.tags])
    }
  })

  it('adaptateurs : champs communs renseignés', () => {
    for (const r of [hatchToResource(HATCHES[0]), symbolToResource(SYMBOLS[0]), detailToResource(CONSTRUCTION_DETAILS[0])]) {
      expect(r.id).toBeTruthy()
      expect(r.name).toBeTruthy()
      expect(r.categoryLabel).toBeTruthy()
      expect(r.searchText).toBeTruthy()
      expect(r.insertable).toBe(true)
      expect(r.sourceType).toBe('svg-block')
      expect(r.viewBox.startsWith('0 0 ')).toBe(true)
    }
  })

  it('détails plus riches : notes portées dans la ressource', () => {
    const r = detailToResource(CONSTRUCTION_DETAILS[0])
    expect(r.notes).toBe(CONSTRUCTION_DETAILS[0].notes)
    expect(r.notes && r.notes.length).toBeGreaterThan(0)
    // les hachures/symboles n'ont pas de notes
    expect(hatchToResource(HATCHES[0]).notes).toBeUndefined()
  })
})
