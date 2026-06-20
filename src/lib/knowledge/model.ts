/**
 * Knowledge Core — modèle de base (schéma canonique V1).
 *
 * Définit `KnowledgeEntry`, l'unité de connaissance partagée entre les lanes
 * Study (C), FormAI (D) et Search (E). Chaque entrée DOIT porter au moins une
 * `source` (avec un libellé non vide) et un niveau de `confidence` : la base est
 * **extractive** (jamais inventée). Aucune entrée sans source ni confiance n'est
 * valide (politique anti-hallucination).
 *
 * Conventions :
 *  - `sources`    : provenance(s) de la définition (≥ 1, libellé obligatoire).
 *  - `confidence` : honnêteté sur la fiabilité de l'entrée.
 *      • 'indicatif'  → définition usuelle, terminologie courante.
 *      • 'concept'    → notion explicative, non normative.
 *      • 'à-vérifier' → à confirmer auprès d'une source faisant autorité.
 *
 * Compatibilité legacy (Sprint #6) : certains consommateurs lisent encore
 * `entry.definition` (string) et `entry.source` (string). Les helpers
 * `entryDefinition` / `entrySourceLabel` fournissent ces vues dérivées sans
 * réintroduire les champs supprimés.
 */

export type KnowledgeConfidence = 'indicatif' | 'concept' | 'à-vérifier'

export const KNOWLEDGE_CONFIDENCE_LEVELS: readonly KnowledgeConfidence[] = [
  'indicatif',
  'concept',
  'à-vérifier',
] as const

/** Types d'entrée reconnus par la base de connaissance. */
export type KnowledgeEntryType =
  | 'word'
  | 'concept'
  | 'material'
  | 'construction_system'
  | 'person'
  | 'building'
  | 'date'
  | 'place'
  | 'norm'
  | 'formula'
  | 'method'
  | 'style'
  | 'tool'

export const KNOWLEDGE_ENTRY_TYPES: readonly KnowledgeEntryType[] = [
  'word',
  'concept',
  'material',
  'construction_system',
  'person',
  'building',
  'date',
  'place',
  'norm',
  'formula',
  'method',
  'style',
  'tool',
] as const

/** Langue d'une entrée. */
export type KnowledgeLanguage = 'fr' | 'en'

/** Type de provenance d'une source. */
export type KnowledgeSourceType =
  | 'internal'
  | 'course'
  | 'standard'
  | 'web'
  | 'book'
  | 'user'

/** Source / citation d'une entrée. `label` est obligatoire et non vide. */
export interface KnowledgeSource {
  label: string
  type: KnowledgeSourceType
  note?: string
  url?: string
}

/** Entrée de connaissance — schéma canonique. */
export interface KnowledgeEntry {
  /** Identifiant stable, unique dans la base. */
  id: string
  /** Slug normalisé (clé d'URL / lookup). */
  slug: string
  /** Terme ou intitulé de l'entrée. */
  term: string
  /** Langue de l'entrée. */
  language: KnowledgeLanguage
  /** Type d'entrée. */
  type: KnowledgeEntryType
  /** Domaine de connaissance (ex. « architecture »). */
  domain: string
  /** Sous-domaine optionnel. */
  subdomain?: string
  /** Définition courte (résumé). */
  shortDefinition: string
  /** Définition longue (développée). */
  longDefinition: string
  /** Exemples d'usage. */
  examples: string[]
  /** Synonymes (indexés). */
  synonyms: string[]
  /** Termes liés (slugs ou libellés). */
  relatedTerms: string[]
  /** Étiquettes (catégorie, mots-clés indexés…). */
  tags: string[]
  /** Source(s) — au moins une, avec un libellé non vide. */
  sources: KnowledgeSource[]
  /** Niveau de confiance obligatoire. */
  confidence: KnowledgeConfidence
  /** Date de création (ISO). */
  createdAt: string
  /** Date de mise à jour (ISO). */
  updatedAt: string
  /** Ordre d'affichage optionnel. */
  order?: number
}

/** Libellés humains des niveaux de confiance. */
export const KNOWLEDGE_CONFIDENCE_LABEL: Record<KnowledgeConfidence, string> = {
  indicatif: 'Indicatif',
  concept: 'Concept',
  'à-vérifier': 'À vérifier',
}

/** Vrai si la valeur est un niveau de confiance reconnu. */
export function isKnowledgeConfidence(value: unknown): value is KnowledgeConfidence {
  return (
    typeof value === 'string'
    && (KNOWLEDGE_CONFIDENCE_LEVELS as readonly string[]).includes(value)
  )
}

/** Vrai si la valeur est un type d'entrée reconnu. */
export function isKnowledgeEntryType(value: unknown): value is KnowledgeEntryType {
  return (
    typeof value === 'string'
    && (KNOWLEDGE_ENTRY_TYPES as readonly string[]).includes(value)
  )
}

/**
 * Vrai si `sources` contient au moins une source dont le `label` est non vide.
 * C'est la garantie anti-hallucination : une entrée doit toujours citer une
 * provenance exploitable.
 */
export function hasUsableSource(sources: unknown): sources is KnowledgeSource[] {
  return (
    Array.isArray(sources)
    && sources.some(
      (s) =>
        s != null
        && typeof (s as KnowledgeSource).label === 'string'
        && (s as KnowledgeSource).label.trim() !== '',
    )
  )
}

/**
 * Valide une entrée de connaissance.
 *
 * REQUIS : `id`, `slug`, `term`, `type`, `domain`, `shortDefinition`,
 * `confidence`, ET au moins une `source` avec un libellé non vide. Une entrée
 * sans provenance fiable OU sans confiance valide est rejetée (anti-
 * hallucination). Retourne la liste des erreurs (vide = valide).
 */
export function validateKnowledgeEntry(entry: Partial<KnowledgeEntry>): string[] {
  const errors: string[] = []
  if (typeof entry.id !== 'string' || entry.id.trim() === '') errors.push('id manquant')
  if (typeof entry.slug !== 'string' || entry.slug.trim() === '') errors.push('slug manquant')
  if (typeof entry.term !== 'string' || entry.term.trim() === '') errors.push('term manquant')
  if (!isKnowledgeEntryType(entry.type)) errors.push('type invalide ou manquant')
  if (typeof entry.domain !== 'string' || entry.domain.trim() === '') errors.push('domain manquant')
  if (typeof entry.shortDefinition !== 'string' || entry.shortDefinition.trim() === '') {
    errors.push('shortDefinition manquante')
  }
  if (!hasUsableSource(entry.sources)) {
    errors.push('source obligatoire manquante (≥ 1 source.label non vide)')
  }
  if (!isKnowledgeConfidence(entry.confidence)) {
    errors.push('confidence obligatoire invalide ou manquante')
  }
  return errors
}

/** Vrai si l'entrée est complète et valide (source + confidence inclus). */
export function isValidKnowledgeEntry(entry: Partial<KnowledgeEntry>): entry is KnowledgeEntry {
  return validateKnowledgeEntry(entry).length === 0
}

/**
 * Normalise une entrée brute : remplit des valeurs par défaut sûres pour les
 * champs optionnels (`examples`/`synonyms`/`relatedTerms`/`tags` = [],
 * `language` = 'fr'), dérive `slug` depuis `id` si absent, et harmonise les
 * dates. NE fabrique JAMAIS de définition ni de source : si la source ou la
 * définition manque, l'entrée restera invalide (à drop par le loader).
 */
export function normalizeKnowledgeEntry(raw: Partial<KnowledgeEntry>): KnowledgeEntry {
  const longDefinition =
    typeof raw.longDefinition === 'string' && raw.longDefinition.trim() !== ''
      ? raw.longDefinition
      : (raw.shortDefinition ?? '')
  return {
    id: raw.id ?? '',
    slug: raw.slug ?? raw.id ?? '',
    term: raw.term ?? '',
    language: raw.language ?? 'fr',
    type: raw.type as KnowledgeEntryType,
    domain: raw.domain ?? '',
    ...(raw.subdomain !== undefined ? { subdomain: raw.subdomain } : {}),
    shortDefinition: raw.shortDefinition ?? '',
    longDefinition,
    examples: Array.isArray(raw.examples) ? raw.examples : [],
    synonyms: Array.isArray(raw.synonyms) ? raw.synonyms : [],
    relatedTerms: Array.isArray(raw.relatedTerms) ? raw.relatedTerms : [],
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    sources: Array.isArray(raw.sources) ? raw.sources : [],
    confidence: raw.confidence as KnowledgeConfidence,
    createdAt: raw.createdAt ?? '',
    updatedAt: raw.updatedAt ?? raw.createdAt ?? '',
    ...(raw.order !== undefined ? { order: raw.order } : {}),
  }
}

/**
 * Garde-fou de construction : crée une entrée en lançant une erreur si elle est
 * invalide (source ou confidence manquante incluse). À utiliser par les
 * providers pour garantir qu'aucune entrée sans provenance n'entre dans la base.
 */
export function makeKnowledgeEntry(entry: Partial<KnowledgeEntry>): KnowledgeEntry {
  const normalized = normalizeKnowledgeEntry(entry)
  const errors = validateKnowledgeEntry(normalized)
  if (errors.length > 0) {
    throw new Error(`KnowledgeEntry invalide : ${errors.join(', ')}`)
  }
  return normalized
}

// ─── Accesseurs de compatibilité (vues dérivées, lecture seule) ──────────────

/**
 * Vue « définition » legacy : `longDefinition` si présente, sinon
 * `shortDefinition`. Remplace l'ancien champ `entry.definition`.
 */
export function entryDefinition(entry: Pick<KnowledgeEntry, 'longDefinition' | 'shortDefinition'>): string {
  const long = entry.longDefinition?.trim()
  if (long) return entry.longDefinition
  return entry.shortDefinition ?? ''
}

/**
 * Vue « source » legacy : libellé de la première source. Remplace l'ancien
 * champ `entry.source` (string). Renvoie '' si aucune source (ne devrait pas
 * arriver pour une entrée valide).
 */
export function entrySourceLabel(entry: Pick<KnowledgeEntry, 'sources'>): string {
  return entry.sources?.[0]?.label ?? ''
}
