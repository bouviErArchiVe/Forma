/**
 * Tests de la façade unifiée Resource Factory (`resourceFactory.ts`) :
 * agrégation de toutes les familles, recherche transverse, facettes de
 * catégorie qualifiées (sans collision), déterminisme.
 */
import { describe, expect, it } from 'vitest'
import {
  allGraphicResourceGroups,
  allGraphicResources,
  graphicResourceCategoryFacets,
  graphicResourceCount,
  graphicResourcesByType,
  qualifiedCategoryKey,
  searchGraphicResources,
} from './resourceFactory'
import { HATCHES } from './hatches'
import { SYMBOLS } from './symbols'
import { CONSTRUCTION_DETAILS } from './details'
import { LEGENDS } from './legends'
import { RESOURCE_TYPE_ORDER } from './resourceTypes'

describe('allGraphicResources', () => {
  it('agrège toutes les familles', () => {
    const all = allGraphicResources()
    expect(all.length).toBe(HATCHES.length + SYMBOLS.length + CONSTRUCTION_DETAILS.length + LEGENDS.length)
    expect(all.length).toBe(graphicResourceCount())
  })

  it('couvre les quatre types insérables', () => {
    const types = new Set(allGraphicResources().map((r) => r.type))
    expect(types).toEqual(new Set(['hatch', 'symbol', 'detail', 'legend']))
  })

  it('ordre stable : types dans RESOURCE_TYPE_ORDER', () => {
    const seen = allGraphicResources().map((r) => r.type)
    const order = [...new Set(seen)]
    const expected = RESOURCE_TYPE_ORDER.filter((t) => order.includes(t))
    expect(order).toEqual(expected)
  })

  it('déterministe : deux appels → mêmes ids dans le même ordre', () => {
    expect(allGraphicResources().map((r) => r.id)).toEqual(allGraphicResources().map((r) => r.id))
  })

  it('chaque ressource a un id globalement unique (type-id)', () => {
    const keys = allGraphicResources().map((r) => `${r.type}-${r.id}`)
    expect(new Set(keys).size).toBe(keys.length)
  })
})

describe('graphicResourcesByType / groups', () => {
  it('filtre par type', () => {
    expect(graphicResourcesByType('hatch').length).toBe(HATCHES.length)
    expect(graphicResourcesByType('hatch').every((r) => r.type === 'hatch')).toBe(true)
  })

  it('groupes non vides, ordre des types respecté', () => {
    const groups = allGraphicResourceGroups()
    expect(groups.map((g) => g.type)).toEqual(['hatch', 'symbol', 'detail', 'legend'])
    expect(groups.every((g) => g.resources.length > 0)).toBe(true)
  })
})

describe('searchGraphicResources', () => {
  it('requête vide → tout', () => {
    expect(searchGraphicResources('').length).toBe(graphicResourceCount())
  })

  it('filtre par sous-chaîne normalisée (transverse)', () => {
    const res = searchGraphicResources('beton')
    expect(res.length).toBeGreaterThan(0)
    // un terme aussi courant que « béton » traverse plusieurs familles
    expect(new Set(res.map((r) => r.type)).size).toBeGreaterThan(1)
  })

  it('requête introuvable → vide', () => {
    expect(searchGraphicResources('zzzqqq-nope')).toEqual([])
  })
})

describe('facettes de catégorie qualifiées', () => {
  it('clé qualifiée = <type>:<category>', () => {
    const r = allGraphicResources()[0]
    expect(qualifiedCategoryKey(r)).toBe(`${r.type}:${r.category}`)
  })

  it('clés de facette uniques (pas de collision inter-familles)', () => {
    const facets = graphicResourceCategoryFacets()
    const keys = facets.map((f) => f.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('la somme des comptes = total des ressources', () => {
    const facets = graphicResourceCategoryFacets()
    const sum = facets.reduce((acc, f) => acc + f.count, 0)
    expect(sum).toBe(graphicResourceCount())
  })

  it('isole les catégories homonymes entre types (ex. « isolation »)', () => {
    // `isolation` existe pour hachures ET détails : deux facettes distinctes.
    const facets = graphicResourceCategoryFacets()
    const isolations = facets.filter((f) => f.category === 'isolation')
    if (isolations.length > 1) {
      expect(new Set(isolations.map((f) => f.key)).size).toBe(isolations.length)
      expect(new Set(isolations.map((f) => f.type)).size).toBe(isolations.length)
    }
  })

  it('facettes triées par ordre de type stable', () => {
    const facets = graphicResourceCategoryFacets()
    const rank = (t: string) => RESOURCE_TYPE_ORDER.indexOf(t as never)
    for (let i = 1; i < facets.length; i++) {
      expect(rank(facets[i].type)).toBeGreaterThanOrEqual(rank(facets[i - 1].type))
    }
  })

  it('chaque facette porte un libellé de type et de catégorie', () => {
    for (const f of graphicResourceCategoryFacets()) {
      expect(f.typeLabel.length).toBeGreaterThan(0)
      expect(f.categoryLabel.length).toBeGreaterThan(0)
    }
  })
})
