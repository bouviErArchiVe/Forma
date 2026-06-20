import { beforeEach, describe, expect, it } from 'vitest'
import { RECENTS_LIMIT, useDictionaryStore } from './dictionaryStore'

beforeEach(() => {
  // Repart d'un état propre (le store est un singleton).
  useDictionaryStore.setState({ favorites: [], recents: [] })
  localStorage.clear()
})

describe('dictionaryStore — favoris', () => {
  it('toggleFavorite ajoute puis retire', () => {
    const { toggleFavorite } = useDictionaryStore.getState()
    toggleFavorite('beton')
    expect(useDictionaryStore.getState().favorites).toEqual(['beton'])
    expect(useDictionaryStore.getState().isFavorite('beton')).toBe(true)
    toggleFavorite('beton')
    expect(useDictionaryStore.getState().favorites).toEqual([])
    expect(useDictionaryStore.getState().isFavorite('beton')).toBe(false)
  })
  it('ignore les slugs vides', () => {
    useDictionaryStore.getState().toggleFavorite('   ')
    expect(useDictionaryStore.getState().favorites).toEqual([])
  })
})

describe('dictionaryStore — récents', () => {
  it('pushRecent place le plus récent en tête et dédoublonne', () => {
    const { pushRecent } = useDictionaryStore.getState()
    pushRecent('a')
    pushRecent('b')
    pushRecent('a')
    expect(useDictionaryStore.getState().recents).toEqual(['a', 'b'])
  })
  it('borne la liste à RECENTS_LIMIT', () => {
    const { pushRecent } = useDictionaryStore.getState()
    for (let i = 0; i < RECENTS_LIMIT + 5; i++) pushRecent('slug-' + i)
    const recents = useDictionaryStore.getState().recents
    expect(recents).toHaveLength(RECENTS_LIMIT)
    // Le plus récent est en tête.
    expect(recents[0]).toBe('slug-' + (RECENTS_LIMIT + 4))
  })
  it('clearRecents vide la liste', () => {
    useDictionaryStore.getState().pushRecent('x')
    useDictionaryStore.getState().clearRecents()
    expect(useDictionaryStore.getState().recents).toEqual([])
  })
})
