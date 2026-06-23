/**
 * Lien de navigation d'un chip de source (Sprint #21).
 *
 * Règle ANTI-DEAD-LINK : un chip n'est cliquable QUE si la cible peut réellement
 * afficher un résultat.
 *  - seed + slug   → `/dictionary?slug=…` (fiche Knowledge, route éprouvée).
 *  - pack + document → `/dictionary?source=pack&document=…(&page=…)` (onglet
 *    Documents pré-filtré ; le document provient d'un chunk réel du pack, donc
 *    le filtre le retrouvera). `page` est ajoutée seulement si disponible.
 *  - sinon → `null` (chip non-cliquable, comportement #19 conservé).
 *
 * Pur et sans dépendance UI : testable isolément, réutilisé par ChatView.
 */
import type { AssistantSource } from './types'

export function sourceChipHref(source: AssistantSource): string | null {
  if (source.kind === 'seed' && source.slug && source.slug.trim() !== '') {
    return `/dictionary?slug=${encodeURIComponent(source.slug)}`
  }
  if (source.kind === 'pack' && source.document && source.document.trim() !== '') {
    const base = `/dictionary?source=pack&document=${encodeURIComponent(source.document)}`
    return source.page !== undefined ? `${base}&page=${source.page}` : base
  }
  return null
}
