/**
 * Rapport de qualité agrégé de la base Knowledge (Sprint #9).
 *
 * Compile, à partir d'une liste d'entrées : répartition par statut qualité,
 * domaine, type, confidence, provenance ; comptes de doublons ; échantillon
 * d'entrées faibles. Pur — alimente le script CLI `knowledge:quality`.
 */
import { entryProvenance, type KnowledgeEntry, type KnowledgeProvenance } from './model'
import { findDuplicates, type DedupOptions, type DedupReport } from './dedup'
import { scoreQuality, type QualityFlag, type QualityStatus } from './quality'

export interface WeakSample {
  id: string
  term: string
  domain: string
  type: string
  status: QualityStatus
  score: number
  flags: QualityFlag[]
}

export interface QualityReport {
  total: number
  byStatus: Record<QualityStatus, number>
  byFlag: Record<QualityFlag, number>
  byDomain: Record<string, { total: number; weak: number; review: number }>
  byType: Record<string, number>
  byConfidence: Record<string, number>
  byProvenance: Record<KnowledgeProvenance, number>
  averageScore: number
  duplicates: { exact: number; near: number; involved: number }
  dedup: DedupReport
  /** Entrées les plus faibles (score croissant), bornées par `weakSampleSize`. */
  weakSamples: WeakSample[]
}

export interface QualityReportOptions extends DedupOptions {
  /** Taille de l'échantillon d'entrées faibles (défaut 25). */
  weakSampleSize?: number
}

const EMPTY_STATUS = (): Record<QualityStatus, number> => ({ ok: 0, weak: 0, review: 0 })
const EMPTY_PROV = (): Record<KnowledgeProvenance, number> => ({
  forma: 0,
  external: 0,
  generated: 0,
  'à-vérifier': 0,
})

/** Construit le rapport de qualité complet de la base. */
export function buildQualityReport(
  entries: readonly KnowledgeEntry[],
  options: QualityReportOptions = {},
): QualityReport {
  const weakSampleSize = options.weakSampleSize ?? 25
  const byStatus = EMPTY_STATUS()
  const byFlag = {} as Record<QualityFlag, number>
  const byDomain: Record<string, { total: number; weak: number; review: number }> = {}
  const byType: Record<string, number> = {}
  const byConfidence: Record<string, number> = {}
  const byProvenance = EMPTY_PROV()
  let scoreSum = 0

  const scored: WeakSample[] = []

  for (const e of entries) {
    const q = scoreQuality(e)
    byStatus[q.status]++
    scoreSum += q.score
    for (const f of q.flags) byFlag[f] = (byFlag[f] ?? 0) + 1

    const dom = e.domain || '(sans domaine)'
    const d = byDomain[dom] ?? (byDomain[dom] = { total: 0, weak: 0, review: 0 })
    d.total++
    if (q.status === 'weak') d.weak++
    if (q.status === 'review') d.review++

    byType[e.type] = (byType[e.type] ?? 0) + 1
    byConfidence[e.confidence] = (byConfidence[e.confidence] ?? 0) + 1
    byProvenance[entryProvenance(e)]++

    scored.push({
      id: e.id,
      term: e.term,
      domain: dom,
      type: e.type,
      status: q.status,
      score: q.score,
      flags: q.flags,
    })
  }

  const dedup = findDuplicates(entries, options)
  const weakSamples = scored
    .filter((s) => s.status !== 'ok')
    .sort((a, b) => a.score - b.score)
    .slice(0, weakSampleSize)

  return {
    total: entries.length,
    byStatus,
    byFlag,
    byDomain,
    byType,
    byConfidence,
    byProvenance,
    averageScore: entries.length ? Math.round((scoreSum / entries.length) * 100) / 100 : 0,
    duplicates: { exact: dedup.exact.length, near: dedup.near.length, involved: dedup.involved },
    dedup,
    weakSamples,
  }
}
