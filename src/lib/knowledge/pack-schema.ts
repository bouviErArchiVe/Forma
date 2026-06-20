/**
 * Validation STRICTE des packs Knowledge (Sprint #9).
 *
 * Plus sévère que `validateKnowledgeEntry` (loader, tolérant) : un pack qui
 * doit ENTRER dans la base est vérifié champ par champ avant toute promotion.
 * Aucune entrée fabriquée : source + confidence restent obligatoires, et les
 * champs mal typés/mal formés sont signalés (erreur = bloquant, warning =
 * tolérable). Pur, sans réseau, sans Dexie.
 */
import {
  isKnowledgeConfidence,
  isKnowledgeEntryType,
  isKnowledgeProvenance,
  type KnowledgeEntry,
} from './model'

export type IssueSeverity = 'error' | 'warning'

export interface PackIssue {
  field: string
  message: string
  severity: IssueSeverity
}

export interface PackEntryResult {
  index: number
  id: string
  errors: PackIssue[]
  warnings: PackIssue[]
  ok: boolean
}

export interface PackValidationReport {
  total: number
  okCount: number
  errorCount: number
  warningCount: number
  results: PackEntryResult[]
  /** ids apparaissant plus d'une fois dans le pack. */
  duplicateIds: string[]
  /** slugs apparaissant plus d'une fois dans le pack. */
  duplicateSlugs: string[]
  ok: boolean
}

const SOURCE_TYPES = new Set(['internal', 'course', 'standard', 'web', 'book', 'user'])
const LANGUAGES = new Set(['fr', 'en'])
/** Slug bien formé : minuscules ASCII, chiffres et tirets (kebab-case). */
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim() !== ''
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string')
}

/** Valide une entrée brute de pack. Retourne erreurs + warnings. */
export function validatePackEntry(raw: unknown, index: number): PackEntryResult {
  const errors: PackIssue[] = []
  const warnings: PackIssue[] = []
  const e = (field: string, message: string) => errors.push({ field, message, severity: 'error' })
  const w = (field: string, message: string) => warnings.push({ field, message, severity: 'warning' })

  const entry = (raw ?? {}) as Partial<KnowledgeEntry> & Record<string, unknown>
  const id = typeof entry.id === 'string' ? entry.id : ''

  if (!isNonEmptyString(entry.id)) e('id', 'id manquant ou vide')
  if (!isNonEmptyString(entry.slug)) e('slug', 'slug manquant ou vide')
  else if (!SLUG_RE.test(entry.slug)) e('slug', `slug mal formé (kebab-case attendu) : "${entry.slug}"`)
  if (!isNonEmptyString(entry.term)) e('term', 'term manquant ou vide')
  if (!isKnowledgeEntryType(entry.type)) e('type', `type invalide ou manquant : "${String(entry.type)}"`)
  if (!isNonEmptyString(entry.domain)) e('domain', 'domain manquant ou vide')
  if (!isNonEmptyString(entry.shortDefinition)) e('shortDefinition', 'shortDefinition manquante ou vide')
  if (!isKnowledgeConfidence(entry.confidence)) e('confidence', `confidence invalide ou manquante : "${String(entry.confidence)}"`)

  if (entry.language !== undefined && !LANGUAGES.has(entry.language as string)) {
    e('language', `language invalide : "${String(entry.language)}"`)
  } else if (entry.language === undefined) {
    w('language', 'language absente (défaut "fr" appliqué à la normalisation)')
  }

  // Sources : ≥ 1, chacune avec label non vide et type légal.
  if (!Array.isArray(entry.sources) || entry.sources.length === 0) {
    e('sources', 'sources obligatoire (≥ 1 source)')
  } else {
    let hasUsable = false
    entry.sources.forEach((s, i) => {
      const src = (s ?? {}) as unknown as Record<string, unknown>
      if (!isNonEmptyString(src.label)) e(`sources[${i}].label`, 'label de source manquant ou vide')
      else hasUsable = true
      if (!SOURCE_TYPES.has(src.type as string)) e(`sources[${i}].type`, `type de source invalide : "${String(src.type)}"`)
      if (src.url !== undefined && typeof src.url !== 'string') e(`sources[${i}].url`, 'url doit être une chaîne')
    })
    if (!hasUsable) e('sources', 'aucune source avec un label exploitable')
  }

  // Tableaux optionnels : doivent être des tableaux de chaînes s'ils existent.
  for (const key of ['examples', 'synonyms', 'relatedTerms', 'tags'] as const) {
    if (entry[key] !== undefined && !isStringArray(entry[key])) {
      e(key, `${key} doit être un tableau de chaînes`)
    }
  }

  // Provenance optionnelle : si présente, doit être légale.
  if (entry.provenance !== undefined && !isKnowledgeProvenance(entry.provenance)) {
    e('provenance', `provenance invalide : "${String(entry.provenance)}"`)
  }

  // Dates : warning seulement (le loader les tolère).
  if (!isNonEmptyString(entry.createdAt)) w('createdAt', 'createdAt absente')
  if (!isNonEmptyString(entry.longDefinition)) w('longDefinition', 'longDefinition absente (shortDefinition réutilisée)')

  return { index, id, errors, warnings, ok: errors.length === 0 }
}

/** Valide un pack entier et agrège un rapport (incl. collisions id/slug internes). */
export function validatePack(rawEntries: readonly unknown[]): PackValidationReport {
  const results = rawEntries.map((raw, i) => validatePackEntry(raw, i))

  const idCounts = new Map<string, number>()
  const slugCounts = new Map<string, number>()
  for (const raw of rawEntries) {
    const e = (raw ?? {}) as Record<string, unknown>
    if (isNonEmptyString(e.id)) idCounts.set(e.id, (idCounts.get(e.id) ?? 0) + 1)
    if (isNonEmptyString(e.slug)) slugCounts.set(e.slug, (slugCounts.get(e.slug) ?? 0) + 1)
  }
  const duplicateIds = [...idCounts.entries()].filter(([, n]) => n > 1).map(([k]) => k)
  const duplicateSlugs = [...slugCounts.entries()].filter(([, n]) => n > 1).map(([k]) => k)

  const okCount = results.filter((r) => r.ok).length
  const errorCount = results.reduce((n, r) => n + r.errors.length, 0)
  const warningCount = results.reduce((n, r) => n + r.warnings.length, 0)

  return {
    total: rawEntries.length,
    okCount,
    errorCount,
    warningCount,
    results,
    duplicateIds,
    duplicateSlugs,
    ok: errorCount === 0 && duplicateIds.length === 0 && duplicateSlugs.length === 0,
  }
}
