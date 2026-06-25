/**
 * Textes produits récurrents de Forma (Sprint #24 — Product Readiness Pass).
 *
 * SOURCE UNIQUE des messages d'IA, de sources et d'états (loading / vide /
 * erreur / no-result / interrompu) affichés par FormAI, le dictionnaire et le
 * navigateur de pack. Centraliser évite les variantes divergentes et garantit
 * une formulation uniforme.
 *
 * La phrase officielle de prudence (`REVIEW_WARNING`) reste définie dans
 * `services/knowledge-pack/validate` (source canonique utilisée par le RAG) et
 * est seulement RÉ-EXPORTÉE ici — elle ne doit JAMAIS être altérée.
 */
export { REVIEW_WARNING } from '../services/knowledge-pack/validate'

// ─── Sources / gates ────────────────────────────────────────────────────────

/** Note courte et uniforme « à vérifier » (chips + cartes pack). */
export const REVIEW_SHORT_NOTE = 'À vérifier dans la source officielle/applicable.'

export const BADGE_SOURCED = 'Sourcé'
export const BADGE_REVIEW = 'À vérifier'
export const BADGE_HISTORICAL = 'Historique'

// ─── États du pack documentaire ─────────────────────────────────────────────

export const PACK_UNAVAILABLE = 'Pack documentaire indisponible.'
export const PACK_NO_RESULT = 'Aucun résultat sourcé pour cette recherche.'

// ─── Messages FormAI (mode local) ───────────────────────────────────────────

/** No-result honnête après échec de l'extraction ET de la base Knowledge. */
export const FORMAI_NO_KNOWLEDGE =
  "Je n'ai pas trouvé cette information dans vos notes ni dans la base Knowledge locale. "
  + 'Ajoutez une source (collez le texte à analyser) ou activez un fournisseur IA dans '
  + 'Paramètres › IA.'

/** Aucune heuristique locale n'a produit de texte. */
export const FORMAI_EMPTY_FALLBACK =
  "Mode local : je n'ai pas pu produire de réponse à partir de ce contenu. "
  + 'Ajoutez du texte à analyser, ou configurez un fournisseur cloud dans Paramètres › IA.'

/** Limites du mode local (pas de génération générale). */
export const FORMAI_LOCAL_LIMITS =
  'Mode local : je fonctionne sans réseau, par analyse du texte que vous me donnez '
  + '(résumé, mots-clés, reformulation) et par recherche dans vos notes, vos documents '
  + 'et la base Knowledge locale.\n\n'
  + 'Pour une vraie réponse de connaissance générale à cette question, configurez un '
  + 'fournisseur IA dans Paramètres › IA, ou collez ici le texte à analyser.'

// ─── États FormAI (UI) ──────────────────────────────────────────────────────

/** Suffixe affiché pendant la génération en streaming (« {agent} · génération… »). */
export const FORMAI_GENERATING = 'génération…'
/** Indicateur d'attente avant le premier fragment (« {agent} réfléchit… »). */
export const FORMAI_THINKING = 'réfléchit…'
/** Réponse interrompue par l'utilisateur (Stop/Abort). */
export const FORMAI_INTERRUPTED = 'Génération interrompue.'
