/**
 * Notes utilisateur sur les ressources (fiches normatives, matériaux, détails),
 * persistées en localStorage. Clés génériques `${kind}:${id}` comme les favoris.
 * Distinct de [resourceFavoritesStore] : ici une note de texte libre par ressource.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ResourceKind } from './resourceFavoritesStore'

function key(kind: ResourceKind, id: string): string {
  return `${kind}:${id}`
}

interface ResourceNotesState {
  notes: Record<string, string>
  get: (kind: ResourceKind, id: string) => string
  set: (kind: ResourceKind, id: string, text: string) => void
}

export const useResourceNotesStore = create<ResourceNotesState>()(
  persist(
    (setState, getState) => ({
      notes: {},
      get: (kind, id) => getState().notes[key(kind, id)] ?? '',
      set: (kind, id, text) =>
        setState((s) => {
          const k = key(kind, id)
          const next = { ...s.notes }
          if (text.trim() === '') delete next[k]
          else next[k] = text
          return { notes: next }
        }),
    }),
    { name: 'forma-resource-notes' },
  ),
)
