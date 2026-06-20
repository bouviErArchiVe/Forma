/**
 * Knowledge Core — providers locaux extractifs.
 *
 * Un `KnowledgeProvider` fournit des `KnowledgeEntry` à partir d'une source
 * **purement locale** : aucun appel réseau, aucune invention. Quand un terme
 * est inconnu, le provider l'admet honnêtement (`lookup` → undefined) plutôt
 * que de fabriquer une définition.
 *
 * Le provider de référence (`architectureGlossaryProvider`) adapte le
 * glossaire existant du module Dictionnaire en `KnowledgeEntry` (schéma
 * canonique), en lecture seule, sans modifier son comportement.
 */
import {
  ARCHITECTURE_GLOSSARY,
  normalizeQuery,
  type GlossaryEntry,
} from '../../modules/dictionary/architecture-glossary'
import {
  entryDefinition,
  makeKnowledgeEntry,
  type KnowledgeEntry,
} from './model'
import { parseSearchIntent } from './search-intent'

export interface KnowledgeProvider {
  /** Identifiant du provider. */
  id: string
  /** Domaine couvert. */
  domain: string
  /** Toutes les entrées (extractives, source + confidence garanties). */
  all(): KnowledgeEntry[]
  /** Consultation directe d'un terme. `undefined` si inconnu (honnête). */
  lookup(term: string): KnowledgeEntry | undefined
  /** Recherche large, triée par pertinence. Requête vide → []. */
  search(query: string): KnowledgeEntry[]
}

const ARCH_DOMAIN = 'architecture'
const ARCH_SOURCE_LABEL = 'Base intégrée — Glossaire d’architecture Forma'

/** Slug normalisé (a-z0-9 + tirets) pour un terme. */
function termSlug(term: string): string {
  return normalizeQuery(term).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

/** Slug stable pour l'`id` d'une entrée (domaine:terme normalisé). */
function entryId(domain: string, term: string): string {
  return `${domain}:${termSlug(term)}`
}

const GLOSSARY_TIMESTAMP = '2026-06-20'

/**
 * Adapte une `GlossaryEntry` du Dictionnaire en `KnowledgeEntry` (schéma
 * canonique). Source et confiance sont systématiquement attribuées (jamais
 * inventées) : une définition de terminologie usuelle relève de la confiance
 * « indicatif ».
 */
export function glossaryEntryToKnowledge(entry: GlossaryEntry): KnowledgeEntry {
  const tags = [entry.category, ...entry.synonyms].filter((t) => t.trim() !== '')
  return makeKnowledgeEntry({
    id: entryId(ARCH_DOMAIN, entry.term),
    slug: termSlug(entry.term),
    term: entry.term,
    language: 'fr',
    type: 'concept',
    domain: ARCH_DOMAIN,
    subdomain: entry.category,
    shortDefinition: entry.definition,
    longDefinition: entry.definition,
    examples: entry.example ? [entry.example] : [],
    synonyms: entry.synonyms,
    relatedTerms: [],
    tags,
    sources: [{ label: ARCH_SOURCE_LABEL, type: 'internal' }],
    confidence: 'indicatif',
    createdAt: GLOSSARY_TIMESTAMP,
    updatedAt: GLOSSARY_TIMESTAMP,
  })
}

/** Entrées de connaissance dérivées du glossaire (calcul mémoïsé). */
let cachedArchEntries: KnowledgeEntry[] | null = null
function architectureEntries(): KnowledgeEntry[] {
  if (cachedArchEntries === null) {
    cachedArchEntries = ARCHITECTURE_GLOSSARY.map(glossaryEntryToKnowledge)
  }
  return cachedArchEntries
}

/** Provider de référence : glossaire d'architecture (lecture seule). */
export const architectureGlossaryProvider: KnowledgeProvider = {
  id: 'architecture-glossary',
  domain: ARCH_DOMAIN,
  all() {
    return architectureEntries()
  },
  lookup(term: string) {
    const q = normalizeQuery(term)
    if (q === '') return undefined
    return architectureEntries().find(
      (e) => normalizeQuery(e.term) === q,
    )
  },
  search(query: string) {
    return scoreEntries(architectureEntries(), query)
  },
}

/**
 * Scoring de pertinence local et extractif sur un ensemble d'entrées.
 * terme exact > préfixe > inclus > tag/synonyme > définition. Requête vide → [].
 */
export function scoreEntries(entries: KnowledgeEntry[], query: string): KnowledgeEntry[] {
  const intent = parseSearchIntent(query)
  if (intent.kind === 'empty') return []
  const q = intent.normalized

  const scored: { entry: KnowledgeEntry; score: number }[] = []
  for (const entry of entries) {
    const term = normalizeQuery(entry.term)
    let score = 0
    if (term === q) score = 5
    else if (term.startsWith(q)) score = 4
    else if (term.includes(q)) score = 3
    else if (entry.synonyms.some((s) => normalizeQuery(s).includes(q))) score = 2
    else if (entry.tags.some((t) => normalizeQuery(t).includes(q))) score = 2
    else if (normalizeQuery(entryDefinition(entry)).includes(q)) score = 1
    if (score > 0) scored.push({ entry, score })
  }

  return scored
    .sort((a, b) => b.score - a.score || a.entry.term.localeCompare(b.entry.term, 'fr'))
    .map((s) => s.entry)
}

/** Registre par défaut des providers de connaissance. */
export const KNOWLEDGE_PROVIDERS: readonly KnowledgeProvider[] = [
  architectureGlossaryProvider,
]

/**
 * Consultation directe à travers tous les providers. Retourne `undefined`
 * si le terme est inconnu partout — la base reste honnête et n'invente rien.
 */
export function lookupKnowledge(
  term: string,
  providers: readonly KnowledgeProvider[] = KNOWLEDGE_PROVIDERS,
): KnowledgeEntry | undefined {
  for (const provider of providers) {
    const hit = provider.lookup(term)
    if (hit) return hit
  }
  return undefined
}

/** Recherche large à travers tous les providers, dédupliquée par `id`. */
export function searchKnowledge(
  query: string,
  providers: readonly KnowledgeProvider[] = KNOWLEDGE_PROVIDERS,
): KnowledgeEntry[] {
  const seen = new Set<string>()
  const out: KnowledgeEntry[] = []
  for (const provider of providers) {
    for (const entry of provider.search(query)) {
      if (seen.has(entry.id)) continue
      seen.add(entry.id)
      out.push(entry)
    }
  }
  return out
}

/** Toutes les entrées disponibles, tous providers confondus (dédupliquées). */
export function allKnowledge(
  providers: readonly KnowledgeProvider[] = KNOWLEDGE_PROVIDERS,
): KnowledgeEntry[] {
  const seen = new Set<string>()
  const out: KnowledgeEntry[] = []
  for (const provider of providers) {
    for (const entry of provider.all()) {
      if (seen.has(entry.id)) continue
      seen.add(entry.id)
      out.push(entry)
    }
  }
  return out
}

/**
 * Résultat honnête d'une demande de connaissance : soit une entrée sourcée,
 * soit une absence explicite (`found: false`). Pour les consommateurs (C/D)
 * qui doivent afficher « inconnu » plutôt qu'une réponse fabriquée.
 */
export type KnowledgeAnswer =
  | { found: true; entry: KnowledgeEntry }
  | { found: false; term: string; reason: 'unknown' }

/** Consultation honnête : jamais d'invention, l'inconnu est signalé. */
export function answerKnowledge(
  term: string,
  providers: readonly KnowledgeProvider[] = KNOWLEDGE_PROVIDERS,
): KnowledgeAnswer {
  const entry = lookupKnowledge(term, providers)
  if (entry) return { found: true, entry }
  return { found: false, term, reason: 'unknown' }
}
