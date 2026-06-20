/**
 * Upgrade pipeline — application contrôlée d'un « upgrade pack » (Sprint #10).
 *
 * Un upgrade pack PATCHE des entrées EXISTANTES (par `id`) pour les enrichir
 * (définition longue réelle, exemples, synonymes, termes liés, tags, sources,
 * confidence). Distinct de `importPack` (qui AJOUTE des entrées nouvelles).
 *
 * Garanties : pur (renvoie une nouvelle base, n'écrit rien), ne change PAS la
 * structure (id/slug/term/type/domain non patchables ici — la résolution de
 * doublons gère les slugs), valide le résultat fusionné en STRICT (un patch qui
 * casserait une entrée est ignoré, jamais appliqué), et mesure la qualité
 * avant/après pour prouver weak/review → ok.
 */
import {
  normalizeKnowledgeEntry,
  type KnowledgeConfidence,
  type KnowledgeEntry,
  type KnowledgeProvenance,
  type KnowledgeSource,
} from './model'
import { validatePackEntry, type PackIssue } from './pack-schema'
import { scoreQuality, type QualityStatus } from './quality'

/** Champs enrichissables d'une entrée (contenu, pas structure). */
export interface UpgradePatch {
  id: string
  shortDefinition?: string
  longDefinition?: string
  examples?: string[]
  synonyms?: string[]
  relatedTerms?: string[]
  tags?: string[]
  sources?: KnowledgeSource[]
  confidence?: KnowledgeConfidence
  provenance?: KnowledgeProvenance
  subdomain?: string
}

const PATCHABLE: readonly (keyof UpgradePatch)[] = [
  'shortDefinition', 'longDefinition', 'examples', 'synonyms', 'relatedTerms',
  'tags', 'sources', 'confidence', 'provenance', 'subdomain',
]

export interface UpgradeChange {
  id: string
  fromStatus: QualityStatus
  toStatus: QualityStatus
  fromScore: number
  toScore: number
}

export interface UpgradeReport {
  /** Nouvelle base (même ordre), patchs appliqués. */
  base: KnowledgeEntry[]
  applied: string[]
  /** Patchs dont l'`id` est absent de la base. */
  unknownIds: string[]
  /** Patchs ignorés car le résultat fusionné est invalide (strict). */
  invalid: { id: string; errors: PackIssue[] }[]
  changes: UpgradeChange[]
  /** Nombre d'entrées passées à 'ok' (depuis weak/review). */
  improvedToOk: number
  summaryBefore: Record<QualityStatus, number>
  summaryAfter: Record<QualityStatus, number>
}

/** Fusionne un patch (champs définis seulement) sur une entrée de base. */
export function mergePatch(base: KnowledgeEntry, patch: UpgradePatch, now?: string): KnowledgeEntry {
  const next: Record<string, unknown> = { ...base }
  for (const k of PATCHABLE) {
    if (patch[k] !== undefined) next[k] = patch[k]
  }
  next.updatedAt = now ?? base.updatedAt
  return next as unknown as KnowledgeEntry
}

function emptyStatus(): Record<QualityStatus, number> {
  return { ok: 0, weak: 0, review: 0 }
}

/**
 * Applique un upgrade pack à une base. Ne mute pas l'entrée d'origine ; renvoie
 * une nouvelle base + un rapport avant/après. Les patchs invalides ou d'`id`
 * inconnu sont signalés et NON appliqués.
 */
export function applyUpgradePack(
  base: readonly KnowledgeEntry[],
  patches: readonly UpgradePatch[],
  options: { now?: string } = {},
): UpgradeReport {
  const next = new Map(base.map((e) => [e.id, e]))
  const summaryBefore = emptyStatus()
  for (const e of base) summaryBefore[scoreQuality(e).status]++

  const applied: string[] = []
  const unknownIds: string[] = []
  const invalid: { id: string; errors: PackIssue[] }[] = []
  const changes: UpgradeChange[] = []

  for (const patch of patches) {
    const cur = next.get(patch.id)
    if (!cur) { unknownIds.push(patch.id); continue }
    const merged = normalizeKnowledgeEntry(mergePatch(cur, patch, options.now))
    const errors = validatePackEntry(merged, 0).errors
    if (errors.length > 0) { invalid.push({ id: patch.id, errors }); continue }
    const q0 = scoreQuality(cur)
    const q1 = scoreQuality(merged)
    next.set(patch.id, merged)
    applied.push(patch.id)
    changes.push({ id: patch.id, fromStatus: q0.status, toStatus: q1.status, fromScore: q0.score, toScore: q1.score })
  }

  const newBase = base.map((e) => next.get(e.id) as KnowledgeEntry)
  const summaryAfter = emptyStatus()
  for (const e of newBase) summaryAfter[scoreQuality(e).status]++

  const improvedToOk = changes.filter((c) => c.toStatus === 'ok' && c.fromStatus !== 'ok').length

  return { base: newBase, applied, unknownIds, invalid, changes, improvedToOk, summaryBefore, summaryAfter }
}
