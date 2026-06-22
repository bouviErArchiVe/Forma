/**
 * Requêtes sur le pack PDF importé en Dexie (Part 10) — Dictionary + Search.
 *
 * Garanties : `quarantine` exclu par défaut ; priorité `clean` > `review` puis
 * `formaUsefulnessScore`. Le lexique historique (Académie) est badgé
 * « historique » et passe APRÈS les sources techniques sur une requête technique.
 * Import paresseux garanti avant toute lecture.
 */
import { db } from '../../db'
import { ensureKnowledgePackImported } from './import'
import { entryDocument, entryPage } from './validate'
import type { ImportGate, PackKnowledgeEntry } from './types'

const GATE_RANK: Record<ImportGate, number> = { clean: 0, review: 1, quarantine: 2 }
const COMBINING = /[̀-ͯ]/g

function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(COMBINING, '').replace(/\s+/g, ' ').trim()
}

/** Vrai si l'entrée provient du lexique historique (Académie) → badge « historique ». */
export function isHistoricalEntry(e: Pick<PackKnowledgeEntry, 'tags' | 'sourceDocument' | 'source'>): boolean {
  const doc = norm(entryDocument(e) ?? '')
  const tags = (e.tags ?? []).map(norm)
  return (
    /academie|académie|1798|1835|lexique|historique/.test(doc)
    || tags.some((t) => t === 'academie' || t === 'académie' || t === 'historique' || t === 'lexique')
  )
}

export interface PackEntryBadges {
  gate: ImportGate
  /** review/quarantine → avertissement à afficher. */
  warn: boolean
  historical: boolean
}

export function entryBadges(e: PackKnowledgeEntry): PackEntryBadges {
  return { gate: e.importGate, warn: e.importGate !== 'clean', historical: isHistoricalEntry(e) }
}

export interface PackQuery {
  text?: string
  gate?: ImportGate
  document?: string
  tag?: string
  /** N'inclut quarantine que si explicitement demandé (admin/debug). */
  includeQuarantine?: boolean
  limit?: number
  offset?: number
}

let cache: PackKnowledgeEntry[] | null = null

/** Charge (une fois, mémoïsé) toutes les entrées du pack depuis Dexie. */
async function allEntries(): Promise<PackKnowledgeEntry[]> {
  if (cache) return cache
  await ensureKnowledgePackImported()
  cache = await db.formaKnowledgeEntries.toArray()
  return cache
}

/** Réinitialise le cache mémoire (tests / réimport). */
export function __resetPackQueryCache(): void {
  cache = null
}

/** Tri : clean avant review (avant quarantine), puis score d'utilité décroissant. */
function rank(a: PackKnowledgeEntry, b: PackKnowledgeEntry): number {
  const g = GATE_RANK[a.importGate] - GATE_RANK[b.importGate]
  if (g !== 0) return g
  return (b.formaUsefulnessScore ?? 0) - (a.formaUsefulnessScore ?? 0)
}

function matches(e: PackKnowledgeEntry, q: PackQuery, nq: string): boolean {
  if (!q.includeQuarantine && e.importGate === 'quarantine') return false
  if (q.gate && e.importGate !== q.gate) return false
  if (q.document && entryDocument(e) !== q.document) return false
  if (q.tag && !(e.tags ?? []).includes(q.tag)) return false
  if (nq !== '') {
    const hay = norm(`${e.title} ${e.summary ?? ''} ${(e.tags ?? []).join(' ')}`)
    if (!nq.split(' ').every((tok) => hay.includes(tok))) return false
  }
  return true
}

export interface PackQueryResult {
  items: PackKnowledgeEntry[]
  total: number
}

/** Recherche/parcours paginé des entrées du pack (quarantine exclu par défaut). */
export async function searchPackEntries(q: PackQuery = {}): Promise<PackQueryResult> {
  const all = await allEntries()
  const nq = norm(q.text ?? '')
  const filtered = all.filter((e) => matches(e, q, nq)).sort(rank)
  const offset = q.offset ?? 0
  const limit = q.limit ?? 30
  return { items: filtered.slice(offset, offset + limit), total: filtered.length }
}

/** Consultation directe d'une entrée par id. */
export async function getPackEntry(id: string): Promise<PackKnowledgeEntry | undefined> {
  await ensureKnowledgePackImported()
  return db.formaKnowledgeEntries.get(id)
}

/** Documents source distincts présents dans le pack (pour le filtre). */
export async function packDocuments(): Promise<string[]> {
  const all = await allEntries()
  const set = new Set<string>()
  for (const e of all) {
    if (e.importGate === 'quarantine') continue
    const d = entryDocument(e)
    if (d) set.add(d)
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'fr'))
}

/** Vue « source » lisible : document + page. */
export function entrySourceLabel(e: PackKnowledgeEntry): string {
  const doc = entryDocument(e)
  const page = entryPage(e)
  if (!doc) return ''
  return page !== undefined ? `${doc} · p. ${page}` : doc
}
