/**
 * Tests de la façade unifiée Resource Factory (`resourceFactory.ts`) :
 * agrégation de toutes les familles, recherche transverse, facettes de
 * catégorie qualifiées (sans collision), déterminisme.
 */
import { describe, expect, it } from 'vitest'
import {
  RESOURCE_ROUTE_BY_TYPE,
  allGraphicResourceGroups,
  allGraphicResources,
  globalResourceId,
  graphicResourceCategoryFacets,
  graphicResourceCount,
  graphicResourceHits,
  graphicResourcesByType,
  groupResourcesByTypeThenCategory,
  qualifiedCategoryKey,
  resourceCategoryCounts,
  resourceRoute,
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

describe('groupResourcesByTypeThenCategory', () => {
  it('deux niveaux : types stables, puis catégories', () => {
    const groups = groupResourcesByTypeThenCategory(allGraphicResources())
    expect(groups.map((g) => g.type)).toEqual(['hatch', 'symbol', 'detail', 'legend'])
    expect(groups.every((g) => g.categories.length > 0)).toBe(true)
  })

  it('count du type = somme des ressources de ses catégories = total du type', () => {
    const groups = groupResourcesByTypeThenCategory(allGraphicResources())
    for (const g of groups) {
      const sum = g.categories.reduce((acc, c) => acc + c.resources.length, 0)
      expect(g.count).toBe(sum)
      expect(g.count).toBe(graphicResourcesByType(g.type).length)
    }
  })

  it('partitionne sans perte (somme = total global)', () => {
    const groups = groupResourcesByTypeThenCategory(allGraphicResources())
    const total = groups.reduce((acc, g) => acc + g.count, 0)
    expect(total).toBe(graphicResourceCount())
  })

  it('catégories uniques au sein d’un type', () => {
    for (const g of groupResourcesByTypeThenCategory(allGraphicResources())) {
      const cats = g.categories.map((c) => c.category)
      expect(new Set(cats).size).toBe(cats.length)
    }
  })

  it('liste vide → aucun groupe', () => {
    expect(groupResourcesByTypeThenCategory([])).toEqual([])
  })
})

describe('graphicResourceHits (source unique pour la recherche)', () => {
  it('sans argument → un hit par ressource, même ordre', () => {
    const hits = graphicResourceHits()
    expect(hits.length).toBe(graphicResourceCount())
    expect(hits.map((h) => h.id)).toEqual(allGraphicResources().map((r) => r.id))
  })

  it('kind = type de ressource (compatible kinds de recherche existants)', () => {
    expect(new Set(graphicResourceHits().map((h) => h.kind))).toEqual(
      new Set(['hatch', 'symbol', 'detail', 'legend']),
    )
  })

  it('sous-titre prêt à l’emploi « Type · Catégorie »', () => {
    for (const h of graphicResourceHits()) {
      expect(h.subtitle).toBe(`${h.typeLabel} · ${h.categoryLabel}`)
      expect(h.title.length).toBeGreaterThan(0)
      expect(h.searchText.length).toBeGreaterThan(0)
    }
  })

  it('avec query → déjà filtré (même résultat que searchGraphicResources)', () => {
    const ids = graphicResourceHits('beton').map((h) => h.id)
    expect(ids).toEqual(searchGraphicResources('beton').map((r) => r.id))
    expect(ids.length).toBeGreaterThan(0)
  })

  it('query introuvable → vide', () => {
    expect(graphicResourceHits('zzzqqq-nope')).toEqual([])
  })

  // ── Hardening Lane E : id global stable, route, couverture, anti-doublon ──

  it('couvre TOUTES les familles (un hit par ressource de chaque catalogue)', () => {
    const byKind = new Map<string, number>()
    for (const h of graphicResourceHits()) byKind.set(h.kind, (byKind.get(h.kind) ?? 0) + 1)
    expect(byKind.get('hatch')).toBe(HATCHES.length)
    expect(byKind.get('symbol')).toBe(SYMBOLS.length)
    expect(byKind.get('detail')).toBe(CONSTRUCTION_DETAILS.length)
    expect(byKind.get('legend')).toBe(LEGENDS.length)
  })

  it('globalId = `type-id` et globalement unique (aucun doublon inter-familles)', () => {
    const hits = graphicResourceHits()
    for (const h of hits) expect(h.globalId).toBe(`${h.kind}-${h.id}`)
    const globals = hits.map((h) => h.globalId)
    expect(new Set(globals).size).toBe(globals.length)
  })

  it('globalId désambiguïse les id bruts homonymes entre familles', () => {
    // garde-fou : si un id brut se répète entre deux types, le globalId reste unique.
    const hits = graphicResourceHits()
    const byRawId = new Map<string, Set<string>>()
    for (const h of hits) {
      const set = byRawId.get(h.id) ?? new Set()
      set.add(h.kind)
      byRawId.set(h.id, set)
    }
    for (const [, kinds] of byRawId) {
      if (kinds.size > 1) {
        // même id brut, types différents → globalId distincts
        const collisions = hits.filter((h) => kinds.has(h.kind))
        expect(new Set(collisions.map((h) => h.globalId)).size).toBe(collisions.length)
      }
    }
  })

  it('chaque hit porte un indice de route cohérent avec resourceRoute', () => {
    for (const h of graphicResourceHits()) {
      expect(h.to.length).toBeGreaterThan(0)
      expect(h.to).toBe(resourceRoute(h.kind))
      expect(h.to).toBe(RESOURCE_ROUTE_BY_TYPE[h.kind])
    }
  })

  it('route stable `/resources` pour toutes les familles graphiques', () => {
    for (const t of RESOURCE_TYPE_ORDER) expect(resourceRoute(t)).toBe('/resources')
  })

  it('globalResourceId est pur (mêmes entrées → même sortie)', () => {
    expect(globalResourceId({ type: 'hatch', id: 'x' })).toBe('hatch-x')
    expect(globalResourceId({ type: 'detail', id: 'd-1' })).toBe('detail-d-1')
  })

  it('forme du hit complète : champs requis renseignés', () => {
    for (const h of graphicResourceHits()) {
      expect(h.kind.length).toBeGreaterThan(0)
      expect(h.id.length).toBeGreaterThan(0)
      expect(h.title.length).toBeGreaterThan(0)
      expect(h.typeLabel.length).toBeGreaterThan(0)
      expect(h.categoryLabel.length).toBeGreaterThan(0)
    }
  })
})

describe('resourceCategoryCounts (filtre catalogue plus riche)', () => {
  it('compte par catégorie, ordre de première apparition', () => {
    const hatches = graphicResourcesByType('hatch')
    const counts = resourceCategoryCounts(hatches)
    expect(counts.length).toBeGreaterThan(0)
    const firstSeen: string[] = []
    for (const r of hatches) if (!firstSeen.includes(r.category)) firstSeen.push(r.category)
    expect(counts.map((c) => c.key)).toEqual(firstSeen)
  })

  it('somme des comptes = nombre de ressources, libellés portés', () => {
    const details = graphicResourcesByType('detail')
    const counts = resourceCategoryCounts(details)
    expect(counts.reduce((acc, c) => acc + c.count, 0)).toBe(details.length)
    expect(counts.every((c) => c.label.length > 0)).toBe(true)
    expect(new Set(counts.map((c) => c.key)).size).toBe(counts.length)
  })

  it('détails : filtrage par catégorie cohérent avec les comptes', () => {
    const details = graphicResourcesByType('detail')
    for (const c of resourceCategoryCounts(details)) {
      expect(details.filter((r) => r.category === c.key).length).toBe(c.count)
    }
  })

  it('liste vide → aucun compte', () => {
    expect(resourceCategoryCounts([])).toEqual([])
  })
})
