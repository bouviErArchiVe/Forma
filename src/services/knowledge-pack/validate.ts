/**
 * Validation & helpers du pack PDF (Part 10) — purs, sans réseau ni Dexie.
 *
 * Reflète `data/tests/knowledge_schema_tests.json` du pack : id obligatoire,
 * source obligatoire (document + page ou objet source), gate ∈ {clean, review,
 * quarantine}, page ≥ 1, chunk RAG avec contenu significatif. Sert au filtrage
 * défensif à l'import (on n'invente rien : un item invalide est écarté, pas
 * réparé) et aux tests.
 */
import {
  isImportGate,
  type PackKnowledgeEntry,
  type PackRagChunk,
} from './types'

/** Page source effective d'une entrée (sourcePage ou source.page_start). */
export function entryPage(e: Pick<PackKnowledgeEntry, 'sourcePage' | 'source'>): number | undefined {
  if (typeof e.sourcePage === 'number') return e.sourcePage
  return e.source?.page_start
}

/** Document source effectif d'une entrée. */
export function entryDocument(e: Pick<PackKnowledgeEntry, 'sourceDocument' | 'source'>): string | undefined {
  return e.sourceDocument ?? e.source?.document
}

/** Vrai si l'item porte une provenance exploitable (document + page ou objet source). */
export function hasUsableSource(item: {
  sourceDocument?: string
  document_name?: string
  source?: { document?: string; page_start?: number }
  sourcePage?: number
  page_start?: number
}): boolean {
  const doc = item.sourceDocument ?? item.document_name ?? item.source?.document
  return typeof doc === 'string' && doc.trim() !== ''
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim() !== ''
}

/** Valide une entrée de dictionnaire du pack. Retourne la liste des erreurs. */
export function validatePackEntry(e: Partial<PackKnowledgeEntry>): string[] {
  const errors: string[] = []
  if (!isNonEmptyString(e.id)) errors.push('id manquant')
  if (!isImportGate(e.importGate)) errors.push('importGate invalide')
  if (!hasUsableSource(e)) errors.push('source manquante (document)')
  const page = entryPage(e)
  if (page !== undefined && !(page >= 1)) errors.push('page < 1')
  return errors
}

/** Valide un chunk RAG du pack. Retourne la liste des erreurs. */
export function validatePackChunk(c: Partial<PackRagChunk>): string[] {
  const errors: string[] = []
  if (!isNonEmptyString(c.id)) errors.push('id manquant')
  if (!isImportGate(c.importGate)) errors.push('importGate invalide')
  if (!hasUsableSource(c)) errors.push('source manquante (document_name)')
  if (!isNonEmptyString(c.content) || c.content.trim().length <= 80) errors.push('content < 80')
  const page = c.page_start ?? c.source?.page_start
  if (page !== undefined && !(page >= 1)) errors.push('page < 1')
  return errors
}

export function isValidPackEntry(e: Partial<PackKnowledgeEntry>): e is PackKnowledgeEntry {
  return validatePackEntry(e).length === 0
}
export function isValidPackChunk(c: Partial<PackRagChunk>): c is PackRagChunk {
  return validatePackChunk(c).length === 0
}

/**
 * Détecte un sujet NORMATIF / réglementaire / technique sensible qui force le
 * mode review + avertissement (code, norme, conformité, dimensions, sécurité,
 * accessibilité, énergie, numérique). Casse/accents-insensible.
 */
const NORMATIVE_RE =
  /\b(norm|code|r[eè]glement|conform|s[eé]curit|accessibilit|incendie|coupe-feu|cnb|ccq|cneb|rbq|charge|portance|dimension|hauteur|largeur|profondeur|[ée]paisseur|coefficient|valeur\s*[ru]\b|r[eé]sistance|d[eé]gagement|garde-corps|[eé]vacuation|[eé]nerg)/i

export function isNormativeText(text: string): boolean {
  return NORMATIVE_RE.test(text.normalize('NFD').replace(/[̀-ͯ]/g, ''))
}

/** Vrai si l'entrée/chunk (tags + titre) relève d'un sujet normatif. */
export function isNormativeItem(item: { title?: string; section?: string; tags?: string[] }): boolean {
  const hay = [item.title ?? '', item.section ?? '', ...(item.tags ?? [])].join(' ')
  return isNormativeText(hay)
}

/** Avertissement officiel FormAI pour contenu review / normatif (texte exact imposé). */
export const REVIEW_WARNING =
  'Selon la source disponible dans Forma, cette information est à vérifier dans la version officielle/applicable avant usage réglementaire ou professionnel.'
