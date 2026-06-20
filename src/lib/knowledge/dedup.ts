/**
 * Détection de doublons et quasi-doublons Knowledge (Sprint #9).
 *
 * Exact : même `slug`, même `id`, ou même `term` normalisé.
 * Quasi  : `term` normalisé d'une entrée ⊆ synonymes d'une autre, ou forte
 *          similarité (Jaccard de tokens ≥ seuil) entre termes du MÊME domaine
 *          (bucketing pour rester O(n) en pratique).
 *
 * Pur, sans réseau. On RAPPORTE seulement : aucune entrée n'est supprimée.
 */
import { type KnowledgeEntry } from './model'

export type DuplicateReason = 'same-id' | 'same-slug' | 'same-term' | 'synonym-match' | 'similar-term'

export interface DuplicatePair {
  reason: DuplicateReason
  a: string // id de l'entrée A
  b: string // id de l'entrée B
  detail: string
  similarity?: number
}

export interface DedupReport {
  exact: DuplicatePair[]
  near: DuplicatePair[]
  /** Nombre d'entrées impliquées dans au moins un doublon. */
  involved: number
}

const COMBINING = /[̀-ͯ]/g

export function normTerm(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(COMBINING, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokens(value: string): Set<string> {
  return new Set(normTerm(value).split(' ').filter((t) => t.length > 1))
}

/** Similarité de Jaccard entre deux ensembles de tokens. */
export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let inter = 0
  for (const t of a) if (b.has(t)) inter++
  return inter / (a.size + b.size - inter)
}

export interface DedupOptions {
  /** Seuil de similarité Jaccard pour un quasi-doublon (défaut 0.8). */
  similarityThreshold?: number
}

/** Analyse une liste d'entrées et renvoie les doublons exacts + quasi-doublons. */
export function findDuplicates(
  entries: readonly KnowledgeEntry[],
  options: DedupOptions = {},
): DedupReport {
  const threshold = options.similarityThreshold ?? 0.8
  const exact: DuplicatePair[] = []
  const near: DuplicatePair[] = []
  const involved = new Set<string>()
  const mark = (a: string, b: string) => {
    involved.add(a)
    involved.add(b)
  }

  // ── Exact : id / slug / term normalisé ──────────────────────────────────
  const byId = new Map<string, KnowledgeEntry>()
  const bySlug = new Map<string, KnowledgeEntry>()
  const byTerm = new Map<string, KnowledgeEntry>()
  for (const e of entries) {
    const prevId = byId.get(e.id)
    if (prevId) { exact.push({ reason: 'same-id', a: prevId.id, b: e.id, detail: e.id }); mark(prevId.id, e.id) }
    else byId.set(e.id, e)

    const prevSlug = bySlug.get(e.slug)
    if (prevSlug) { exact.push({ reason: 'same-slug', a: prevSlug.id, b: e.id, detail: e.slug }); mark(prevSlug.id, e.id) }
    else bySlug.set(e.slug, e)

    const nt = normTerm(e.term)
    const prevTerm = byTerm.get(nt)
    if (prevTerm) { exact.push({ reason: 'same-term', a: prevTerm.id, b: e.id, detail: e.term }); mark(prevTerm.id, e.id) }
    else byTerm.set(nt, e)
  }

  // ── Quasi : synonyme croisé + similarité dans le même domaine ───────────
  // Bucket par domaine pour borner les comparaisons O(n²) au sein d'un domaine.
  const buckets = new Map<string, KnowledgeEntry[]>()
  for (const e of entries) {
    const k = normTerm(e.domain)
    const list = buckets.get(k)
    if (list) list.push(e)
    else buckets.set(k, [e])
  }

  for (const list of buckets.values()) {
    const toks = list.map((e) => tokens(e.term))
    for (let i = 0; i < list.length; i++) {
      const a = list[i]
      const aTermNorm = normTerm(a.term)
      const aSyn = new Set(a.synonyms.map(normTerm))
      for (let j = i + 1; j < list.length; j++) {
        const b = list[j]
        if (a.id === b.id) continue
        const bTermNorm = normTerm(b.term)
        if (aTermNorm === bTermNorm) continue // déjà couvert par same-term

        // Synonyme croisé : le terme de l'un figure dans les synonymes de l'autre.
        const bSyn = new Set(b.synonyms.map(normTerm))
        if (aSyn.has(bTermNorm) || bSyn.has(aTermNorm)) {
          near.push({ reason: 'synonym-match', a: a.id, b: b.id, detail: `${a.term} ↔ ${b.term}` })
          mark(a.id, b.id)
          continue
        }

        // Similarité de tokens.
        const sim = jaccard(toks[i], toks[j])
        if (sim >= threshold) {
          near.push({ reason: 'similar-term', a: a.id, b: b.id, detail: `${a.term} ~ ${b.term}`, similarity: Math.round(sim * 100) / 100 })
          mark(a.id, b.id)
        }
      }
    }
  }

  return { exact, near, involved: involved.size }
}
