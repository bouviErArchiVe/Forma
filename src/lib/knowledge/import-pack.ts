/**
 * Pipeline d'import local de packs Knowledge (Sprint #9).
 *
 * Ingestion d'un pack JSON local → validation stricte → détection de doublons
 * vs la base existante → classification de provenance → mesure de qualité →
 * rapport (accepted / rejected / duplicates). PUR : ne modifie JAMAIS la base ;
 * les `accepted` sont des CANDIDATS à promouvoir manuellement. Aucune
 * suppression, aucune génération, aucun réseau, aucun Dexie.
 */
import {
  entryProvenance,
  normalizeKnowledgeEntry,
  type KnowledgeEntry,
  type KnowledgeProvenance,
} from './model'
import { validatePack, type PackIssue, type PackValidationReport } from './pack-schema'
import { findDuplicates, type DuplicateReason } from './dedup'
import { scoreQuality, type QualityResult, type QualityStatus } from './quality'

export interface ImportRejected {
  index: number
  id: string
  errors: PackIssue[]
}

export interface ImportDuplicate {
  id: string
  term: string
  reason: DuplicateReason
  against: string
  detail: string
}

export interface ImportAccepted {
  entry: KnowledgeEntry
  provenance: KnowledgeProvenance
  quality: QualityResult
}

export interface ImportReport {
  packTotal: number
  validation: PackValidationReport
  accepted: ImportAccepted[]
  rejected: ImportRejected[]
  duplicatesAgainstBase: ImportDuplicate[]
  summary: {
    accepted: number
    rejected: number
    duplicates: number
    weak: number
    byProvenance: Record<KnowledgeProvenance, number>
    byStatus: Record<QualityStatus, number>
  }
}

export interface ImportOptions {
  /** Provenance par défaut appliquée aux candidats sans `provenance` ET sans source typée. */
  defaultProvenance?: KnowledgeProvenance
  /** Seuil de similarité pour les quasi-doublons (défaut 0.85, prudent). */
  similarityThreshold?: number
}

/**
 * Importe un pack brut contre une base existante. Ne mute rien : renvoie un
 * rapport. Les entrées invalides sont `rejected`, celles qui collisionnent avec
 * la base sont `duplicatesAgainstBase`, le reste devient `accepted` (candidats).
 */
export function importPack(
  packRaw: readonly unknown[],
  existing: readonly KnowledgeEntry[],
  options: ImportOptions = {},
): ImportReport {
  const threshold = options.similarityThreshold ?? 0.85
  const validation = validatePack(packRaw)

  // 1) Séparer valides / rejetées.
  const rejected: ImportRejected[] = []
  const candidates: KnowledgeEntry[] = []
  validation.results.forEach((r) => {
    if (r.ok) candidates.push(normalizeKnowledgeEntry(packRaw[r.index] as Partial<KnowledgeEntry>))
    else rejected.push({ index: r.index, id: r.id, errors: r.errors })
  })

  // 2) Doublons des candidats CONTRE la base existante (exact + quasi).
  const existingIds = new Set(existing.map((e) => e.id))
  const candidateIds = new Set(candidates.map((c) => c.id))
  const combined = [...existing, ...candidates]
  const dd = findDuplicates(combined, { similarityThreshold: threshold })

  const dupByCandidate = new Map<string, ImportDuplicate>()
  for (const pair of [...dd.exact, ...dd.near]) {
    // On ne s'intéresse qu'aux paires candidat ↔ entrée existante.
    let candId: string | undefined
    let baseId: string | undefined
    if (candidateIds.has(pair.a) && existingIds.has(pair.b)) { candId = pair.a; baseId = pair.b }
    else if (candidateIds.has(pair.b) && existingIds.has(pair.a)) { candId = pair.b; baseId = pair.a }
    if (!candId || !baseId || dupByCandidate.has(candId)) continue
    const cand = candidates.find((c) => c.id === candId)
    dupByCandidate.set(candId, {
      id: candId,
      term: cand?.term ?? candId,
      reason: pair.reason,
      against: baseId,
      detail: pair.detail,
    })
  }

  // 3) Candidats acceptés = valides ET non-doublons de la base.
  const accepted: ImportAccepted[] = candidates
    .filter((c) => !dupByCandidate.has(c.id))
    .map((entry) => {
      const provenance = entryProvenance(entry) === 'à-vérifier' && options.defaultProvenance
        ? options.defaultProvenance
        : entryProvenance(entry)
      return { entry, provenance, quality: scoreQuality(entry) }
    })

  // 4) Synthèse.
  const byProvenance: Record<KnowledgeProvenance, number> = { forma: 0, external: 0, generated: 0, 'à-vérifier': 0 }
  const byStatus: Record<QualityStatus, number> = { ok: 0, weak: 0, review: 0 }
  let weak = 0
  for (const a of accepted) {
    byProvenance[a.provenance]++
    byStatus[a.quality.status]++
    if (a.quality.status !== 'ok') weak++
  }

  const duplicatesAgainstBase = [...dupByCandidate.values()]

  return {
    packTotal: packRaw.length,
    validation,
    accepted,
    rejected,
    duplicatesAgainstBase,
    summary: {
      accepted: accepted.length,
      rejected: rejected.length,
      duplicates: duplicatesAgainstBase.length,
      weak,
      byProvenance,
      byStatus,
    },
  }
}
