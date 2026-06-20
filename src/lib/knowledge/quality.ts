/**
 * Mesure de qualité d'une entrée Knowledge (Sprint #9).
 *
 * Calcule un `qualityScore` (0..1), un `qualityStatus` ('ok' | 'weak' |
 * 'review') et des `flags` traçables. Objectif : REPÉRER et MARQUER les entrées
 * faibles (notamment les définitions « gabarit » du seed pro) pour préparer leur
 * enrichissement — jamais les supprimer. Heuristique pure, locale, indicative.
 *
 * La qualité est distincte de la provenance et de la confidence ; elle ne
 * remplace pas le jugement humain. On ne fabrique aucun contenu.
 */
import { type KnowledgeEntry } from './model'

export type QualityStatus = 'ok' | 'weak' | 'review'

export type QualityFlag =
  | 'templated'
  | 'short-long-equal'
  | 'no-examples'
  | 'no-synonyms'
  | 'no-related'
  | 'low-confidence'
  | 'no-usable-source'

export interface QualityResult {
  score: number
  status: QualityStatus
  flags: QualityFlag[]
}

/**
 * Fragments de définitions « gabarit » du seed pro. Si la définition courte OU
 * longue contient l'un d'eux, l'entrée est marquée `templated` (placeholder à
 * enrichir). Liste extensible.
 */
export const TEMPLATE_SIGNATURES: readonly string[] = [
  'est une notion utilisée en',
  'est un concept lié à',
  'est un matériau ou produit de construction associé à',
  'est une personne associée à',
  'est un bâtiment, une typologie',
  'sert de repère de vocabulaire',
  'aide à analyser un projet, expliquer un choix technique',
  'est décrit dans la base forma comme une entrée de',
  "sert de point d'entrée pour relier une figure",
  "sert à relier un cas d'étude",
]

/** Pénalités par flag (soustraites de 1.0). */
const PENALTY: Record<QualityFlag, number> = {
  templated: 0.4,
  'short-long-equal': 0.15,
  'no-examples': 0.15,
  'no-synonyms': 0.1,
  'no-related': 0.1,
  'low-confidence': 0.15,
  'no-usable-source': 0.6,
}

function isTemplated(entry: KnowledgeEntry): boolean {
  const hay = `${entry.shortDefinition ?? ''}\n${entry.longDefinition ?? ''}`.toLowerCase()
  return TEMPLATE_SIGNATURES.some((sig) => hay.includes(sig))
}

/** Calcule la qualité d'une entrée (score + statut + flags). */
export function scoreQuality(entry: KnowledgeEntry): QualityResult {
  const flags: QualityFlag[] = []

  if (isTemplated(entry)) flags.push('templated')

  const short = (entry.shortDefinition ?? '').trim()
  const long = (entry.longDefinition ?? '').trim()
  if (long === '' || long === short || long.length < 40) flags.push('short-long-equal')

  if (!entry.examples || entry.examples.length === 0) flags.push('no-examples')
  if (!entry.synonyms || entry.synonyms.length === 0) flags.push('no-synonyms')
  if (!entry.relatedTerms || entry.relatedTerms.length === 0) flags.push('no-related')
  if (entry.confidence === 'à-vérifier') flags.push('low-confidence')
  if (!entry.sources?.some((s) => typeof s?.label === 'string' && s.label.trim() !== '')) {
    flags.push('no-usable-source')
  }

  const penalty = flags.reduce((sum, f) => sum + PENALTY[f], 0)
  const score = Math.max(0, Math.min(1, 1 - penalty))

  let status: QualityStatus = score >= 0.7 ? 'ok' : score >= 0.4 ? 'weak' : 'review'
  // Sans source exploitable → toujours 'review' (entrée non fiable, anti-hallucination).
  if (flags.includes('no-usable-source')) status = 'review'
  // 'à-vérifier' ne peut être 'ok' (honnêteté).
  else if (entry.confidence === 'à-vérifier' && status === 'ok') status = 'review'
  // Une entrée gabarit ne peut être 'ok' (toujours à enrichir).
  if (flags.includes('templated') && status === 'ok') status = 'weak'

  return { score: Math.round(score * 100) / 100, status, flags }
}
