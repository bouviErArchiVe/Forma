/**
 * Tests de la logique de favoris des ressources graphiques (Sprint #5, Lane A) :
 * dérivation de clé et filtre « ★ Favoris » (pur, sans store).
 */
import { describe, expect, it } from 'vitest'
import {
  favoriteKey,
  filterByFavorites,
  isResourceFavorite,
  resourceFavoriteKey,
} from './resourceFavorites'
import type { GraphicResource } from './resourceTypes'

function res(type: GraphicResource['type'], id: string): GraphicResource {
  return {
    id,
    type,
    name: id,
    category: 'c',
    categoryLabel: 'C',
    description: '',
    tags: [],
    svg: '',
    viewBox: '0 0 10 10',
    defaultWidth: 10,
    defaultHeight: 10,
    searchText: id,
    insertable: true,
    sourceType: 'svg-block',
    blockCategory: 'symbols',
    blockTagPrefix: 'h',
  }
}

describe('favoriteKey / resourceFavoriteKey', () => {
  it('compose `${type}:${id}` et couvre toutes les familles graphiques', () => {
    expect(favoriteKey('hatch', 'h-beton')).toBe('hatch:h-beton')
    expect(favoriteKey('symbol', 'sym-nord')).toBe('symbol:sym-nord')
    expect(favoriteKey('detail', 'd-wall')).toBe('detail:d-wall')
    expect(favoriteKey('legend', 'lg-1')).toBe('legend:lg-1')
    expect(resourceFavoriteKey(res('hatch', 'h-beton'))).toBe('hatch:h-beton')
  })

  it('ne collisionne pas entre familles partageant un id', () => {
    expect(favoriteKey('hatch', 'x')).not.toBe(favoriteKey('legend', 'x'))
  })
})

describe('isResourceFavorite', () => {
  it('reflète la présence de la clé dans le tableau', () => {
    const favs = ['hatch:h-beton', 'material:bois-spf']
    expect(isResourceFavorite(res('hatch', 'h-beton'), favs)).toBe(true)
    expect(isResourceFavorite(res('hatch', 'h-autre'), favs)).toBe(false)
    expect(isResourceFavorite(res('hatch', 'h-beton'), [])).toBe(false)
  })
})

describe('filterByFavorites', () => {
  const list = [res('hatch', 'a'), res('symbol', 'b'), res('legend', 'c')]

  it('ne garde que les favoris, dans l’ordre d’entrée', () => {
    const out = filterByFavorites(list, ['legend:c', 'hatch:a'])
    expect(out.map((r) => r.id)).toEqual(['a', 'c'])
  })

  it('retourne une liste vide sans favoris', () => {
    expect(filterByFavorites(list, [])).toEqual([])
  })

  it('ignore les clés de favoris d’autres familles (matériaux/normes)', () => {
    const out = filterByFavorites(list, ['material:a', 'norme:b'])
    expect(out).toEqual([])
  })
})
