/**
 * RAG FormAI sur le pack PDF (Part 10) — récupération SÛRE de chunks sourcés.
 *
 * Règles de sécurité (formai_rag_safety_rules.json) :
 *  - `clean` d'abord, puis `review` (avec avertissement) ;
 *  - `quarantine` JAMAIS par défaut ;
 *  - tout sujet normatif/technique force l'avertissement officiel ;
 *  - réponse = EXTRAITS sourcés (document + page), jamais inventés ;
 *  - aucune source pertinente → on le dit honnêtement (no-result).
 */
import { db } from '../../db'
import { ensureKnowledgePackImported } from './import'
import { isNormativeText, REVIEW_WARNING } from './validate'
import type { PackRagChunk } from './types'

const COMBINING = /[̀-ͯ]/g

function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(COMBINING, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
}
function tokens(s: string): string[] {
  return norm(s).split(' ').filter((t) => t.length > 2)
}

let cache: PackRagChunk[] | null = null
export function __resetRagCache(): void { cache = null }

async function allChunks(): Promise<PackRagChunk[]> {
  if (cache) return cache
  await ensureKnowledgePackImported()
  cache = await db.formaRagChunks.toArray()
  return cache
}

export interface RagCitation { document: string; page?: number; section?: string }

export interface RagResult {
  found: boolean
  /** Réponse composée d'EXTRAITS sourcés (jamais inventée). */
  answer: string
  chunks: PackRagChunk[]
  citations: RagCitation[]
  usedReview: boolean
  /** Avertissement officiel si review/normatif. */
  warning?: string
}

/** Score d'un chunk pour la requête : recouvrement de tokens + bonus clean. */
function scoreChunk(c: PackRagChunk, qTokens: string[]): number {
  if (qTokens.length === 0) return 0
  const hay = norm(`${c.section ?? ''} ${c.content} ${(c.tags ?? []).join(' ')}`)
  let hitTokens = 0
  for (const t of new Set(qTokens)) if (hay.includes(t)) hitTokens++
  if (hitTokens === 0) return 0
  const coverage = hitTokens / new Set(qTokens).size
  const gateBonus = c.importGate === 'clean' ? 0.25 : 0
  const usefulness = Math.min(0.2, (c.formaUsefulnessScore ?? 0) / 500)
  return coverage + gateBonus + usefulness
}

export interface RetrieveOptions { limit?: number; includeReview?: boolean }

/** Récupère les chunks les plus pertinents : clean d'abord, review ensuite, jamais quarantine. */
export async function retrievePackChunks(query: string, opts: RetrieveOptions = {}): Promise<PackRagChunk[]> {
  const all = await allChunks()
  const qTokens = tokens(query)
  if (qTokens.length === 0) return []
  const limit = opts.limit ?? 4
  const includeReview = opts.includeReview ?? true

  const scored = all
    .filter((c) => c.importGate !== 'quarantine')
    .map((c) => ({ c, s: scoreChunk(c, qTokens) }))
    .filter((x) => x.s > 0.15)
    .sort((a, b) => b.s - a.s)

  // Doctrine RAG : on cherche d'abord dans `clean`. On ne descend dans `review`
  // (avec avertissement) QUE si aucune source clean ne répond — pour ne pas
  // polluer une réponse fiable avec du contenu à vérifier.
  const clean = scored.filter((x) => x.c.importGate === 'clean')
  if (clean.length > 0) return clean.slice(0, limit).map((x) => x.c)
  if (includeReview) return scored.filter((x) => x.c.importGate === 'review').slice(0, limit).map((x) => x.c)
  return []
}

function citationOf(c: PackRagChunk): RagCitation {
  return {
    document: c.document_name ?? c.source?.document ?? '',
    page: c.page_start ?? c.source?.page_start,
    section: c.section ?? c.source?.section,
  }
}
function citationLabel(cit: RagCitation): string {
  if (!cit.document) return ''
  return cit.page !== undefined ? `${cit.document} · p. ${cit.page}` : cit.document
}

/**
 * Compose une réponse RAG ANCRÉE à partir du pack. `found:false` si rien de
 * pertinent (le mode local enchaînera son message honnête). Avertissement
 * officiel si un chunk review est utilisé OU si la question est normative.
 */
export async function ragAnswer(query: string): Promise<RagResult> {
  const chunks = await retrievePackChunks(query, { limit: 3 })
  if (chunks.length === 0) {
    return { found: false, answer: '', chunks: [], citations: [], usedReview: false }
  }
  const citations = chunks.map(citationOf)
  const usedReview = chunks.some((c) => c.importGate === 'review')
  const warn = usedReview || isNormativeText(query)

  const top = chunks[0]
  const excerpt = (top.content ?? '').trim().slice(0, 600)
  const lines: string[] = []
  lines.push(excerpt)
  lines.push(`Source : ${citationLabel(citations[0])}`)
  if (chunks.length > 1) {
    const others = citations.slice(1).map(citationLabel).filter(Boolean)
    if (others.length) lines.push(`Autres sources : ${others.join(' ; ')}`)
  }
  if (warn) lines.push(`⚠ ${REVIEW_WARNING}`)
  lines.push('(Mode local — extrait sourcé du pack documentaire Forma, pas une IA générative.)')

  return {
    found: true,
    answer: lines.join('\n\n'),
    chunks,
    citations,
    usedReview,
    ...(warn ? { warning: REVIEW_WARNING } : {}),
  }
}
