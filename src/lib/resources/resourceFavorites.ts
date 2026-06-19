/**
 * Favoris des ressources graphiques (hachures / symboles / détails / légendes).
 *
 * Réutilise le store partagé `resourceFavoritesStore` (clés `${type}:${id}`
 * persistées en localStorage) SANS le modifier : le store expose un `toggle`
 * typé sur trois familles seulement (`material` | `norme` | `detail`), alors
 * que les ressources graphiques couvrent aussi `hatch` | `symbol` | `legend`.
 * On manipule donc ici le tableau `favorites` de façon générique (lecture +
 * `setState`), avec une clé dérivée de `ResourceType`.
 *
 * Logique pure (clé + filtre) séparée des liaisons store pour rester testable.
 */
import { useResourceFavoritesStore } from '../../stores/resourceFavoritesStore'
import type { GraphicResource, ResourceType } from './resourceTypes'

/** Clé de favori d'une ressource graphique : `${type}:${id}`. */
export function favoriteKey(type: ResourceType, id: string): string {
  return `${type}:${id}`
}

/** Clé de favori dérivée d'une ressource. */
export function resourceFavoriteKey(resource: Pick<GraphicResource, 'type' | 'id'>): string {
  return favoriteKey(resource.type, resource.id)
}

/** La ressource est-elle présente dans le tableau de favoris fourni ? */
export function isResourceFavorite(
  resource: Pick<GraphicResource, 'type' | 'id'>,
  favorites: readonly string[],
): boolean {
  return favorites.includes(resourceFavoriteKey(resource))
}

/**
 * Ne conserve que les ressources marquées comme favorites (ordre d'entrée
 * préservé). Pur et déterministe — c'est le cœur du filtre « ★ Favoris ».
 */
export function filterByFavorites<T extends GraphicResource>(
  resources: T[],
  favorites: readonly string[],
): T[] {
  if (favorites.length === 0) return []
  const set = new Set(favorites)
  return resources.filter((r) => set.has(resourceFavoriteKey(r)))
}

/**
 * Bascule générique d'un favori de ressource graphique dans le store partagé.
 * Passe par `setState` car le `toggle` typé du store ne couvre pas tous les
 * `ResourceType`. Idempotent par paire (ajout/retrait).
 */
export function toggleResourceFavorite(resource: Pick<GraphicResource, 'type' | 'id'>): void {
  const k = resourceFavoriteKey(resource)
  useResourceFavoritesStore.setState((s) => ({
    favorites: s.favorites.includes(k)
      ? s.favorites.filter((x) => x !== k)
      : [...s.favorites, k],
  }))
}
