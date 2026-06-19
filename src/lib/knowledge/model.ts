/**
 * Knowledge Core — modèle de base.
 *
 * Définit `KnowledgeEntry`, l'unité de connaissance partagée entre les lanes
 * Study (C) et FormAI (D). Chaque entrée DOIT porter une `source` et un niveau
 * de `confidence` : la base est **extractive** (jamais inventée). Aucune entrée
 * sans source ni confiance n'est valide.
 *
 * Conventions :
 *  - `source`     : citation libre (ouvrage, glossaire, code, « base intégrée »).
 *  - `confidence` : honnêteté sur la fiabilité de l'entrée.
 *      • 'indicatif'  → définition usuelle, terminologie courante.
 *      • 'concept'    → notion explicative, non normative.
 *      • 'à-vérifier' → à confirmer auprès d'une source faisant autorité.
 */

export type KnowledgeConfidence = 'indicatif' | 'concept' | 'à-vérifier'

export const KNOWLEDGE_CONFIDENCE_LEVELS: readonly KnowledgeConfidence[] = [
  'indicatif',
  'concept',
  'à-vérifier',
] as const

export interface KnowledgeEntry {
  /** Identifiant stable, unique dans la base (slug ou clé domaine:terme). */
  id: string
  /** Terme ou intitulé de l'entrée. */
  term: string
  /** Domaine de connaissance (ex. « architecture », « construction »). */
  domain: string
  /** Définition extractive — jamais inventée. */
  definition: string
  /** Source / citation obligatoire (provenance de la définition). */
  source: string
  /** Niveau de confiance obligatoire. */
  confidence: KnowledgeConfidence
  /** Étiquettes optionnelles (catégorie, synonymes indexés…). */
  tags?: string[]
  /** Identifiants (`id`) d'entrées liées. */
  related?: string[]
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

/**
 * Valide une entrée de connaissance. `source` et `confidence` sont
 * **obligatoires et non vides** : une entrée sans provenance fiable est
 * rejetée (politique anti-hallucination). Retourne la liste des erreurs
 * (vide = valide).
 */
export function validateKnowledgeEntry(entry: Partial<KnowledgeEntry>): string[] {
  const errors: string[] = []
  if (typeof entry.id !== 'string' || entry.id.trim() === '') errors.push('id manquant')
  if (typeof entry.term !== 'string' || entry.term.trim() === '') errors.push('term manquant')
  if (typeof entry.domain !== 'string' || entry.domain.trim() === '') errors.push('domain manquant')
  if (typeof entry.definition !== 'string' || entry.definition.trim() === '') {
    errors.push('definition manquante')
  }
  if (typeof entry.source !== 'string' || entry.source.trim() === '') {
    errors.push('source obligatoire manquante')
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
 * Garde-fou de construction : crée une entrée en lançant une erreur si
 * `source` ou `confidence` manque. À utiliser par les providers pour garantir
 * qu'aucune entrée sans provenance n'entre dans la base.
 */
export function makeKnowledgeEntry(entry: KnowledgeEntry): KnowledgeEntry {
  const errors = validateKnowledgeEntry(entry)
  if (errors.length > 0) {
    throw new Error(`KnowledgeEntry invalide : ${errors.join(', ')}`)
  }
  return entry
}
