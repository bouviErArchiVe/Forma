/**
 * Tests des stores de ressources (favoris + notes), persistés localStorage.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { useResourceFavoritesStore } from './resourceFavoritesStore'
import { useResourceNotesStore } from './resourceNotesStore'

beforeEach(() => {
  useResourceFavoritesStore.setState({ favorites: [] })
  useResourceNotesStore.setState({ notes: {} })
})

describe('resourceFavoritesStore', () => {
  it('bascule un favori par type + id', () => {
    const { toggle, has } = useResourceFavoritesStore.getState()
    expect(has('material', 'acier-charpente')).toBe(false)
    toggle('material', 'acier-charpente')
    expect(useResourceFavoritesStore.getState().has('material', 'acier-charpente')).toBe(true)
    toggle('material', 'acier-charpente')
    expect(useResourceFavoritesStore.getState().has('material', 'acier-charpente')).toBe(false)
  })

  it('isole les types (norme vs material) sous le même id', () => {
    const { toggle } = useResourceFavoritesStore.getState()
    toggle('norme', 'cnb-usages')
    const s = useResourceFavoritesStore.getState()
    expect(s.has('norme', 'cnb-usages')).toBe(true)
    expect(s.has('material', 'cnb-usages')).toBe(false)
  })
})

describe('resourceNotesStore', () => {
  it('enregistre et lit une note par type + id', () => {
    const { set } = useResourceNotesStore.getState()
    set('norme', 'cnb-usages', 'Vérifier le groupe d’usage du projet')
    expect(useResourceNotesStore.getState().get('norme', 'cnb-usages')).toBe('Vérifier le groupe d’usage du projet')
  })

  it('supprime la clé quand la note devient vide', () => {
    const { set } = useResourceNotesStore.getState()
    set('material', 'bois-spf', 'note')
    expect(useResourceNotesStore.getState().notes['material:bois-spf']).toBe('note')
    set('material', 'bois-spf', '   ')
    expect('material:bois-spf' in useResourceNotesStore.getState().notes).toBe(false)
  })
})
