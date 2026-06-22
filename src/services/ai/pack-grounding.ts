/**
 * Grounding RAG pack PDF pour les providers GÉNÉRATIFS (Sprint #18).
 *
 * Injecte les meilleurs extraits du pack documentaire (Part 10) dans le prompt
 * système d'un modèle génératif (localmodel/cloud), afin qu'il puisse CITER les
 * documents PDF (document + page), pas seulement les seeds Knowledge.
 *
 * Doctrine de sécurité (formai_rag_safety_rules) — héritée de `retrievePackChunks` :
 *  - `clean` d'abord ; `review` UNIQUEMENT si aucun clean pertinent, avec
 *    avertissement obligatoire ; `quarantine` JAMAIS injectée ;
 *  - sujet normatif/technique → avertissement officiel imposé ;
 *  - extraits sourcés, jamais inventés ; prompt borné (peu de chunks, extraits courts).
 *
 * `null` si aucun extrait pertinent (le provider répond alors sans contexte pack,
 * et la chaîne extractive #11/#RAG reste le filet). Import paresseux du pack via
 * `retrievePackChunks` → `ensureKnowledgePackImported` (jamais bloquant).
 */
import { retrievePackChunks } from '../knowledge-pack/rag'
import { isNormativeText, REVIEW_WARNING } from '../knowledge-pack/validate'
import type { PackRagChunk } from '../knowledge-pack/types'

/** Nombre maximum d'extraits injectés (prompt borné). */
const MAX_CHUNKS = 3
/** Longueur maximale d'un extrait injecté. */
const EXCERPT_LEN = 500

export interface PackGroundingCitation {
  document: string
  page?: number
}

export interface PackGrounding {
  /** Bloc système à injecter dans le prompt génératif. */
  block: string
  citations: PackGroundingCitation[]
  /** true si au moins un extrait `review` a été utilisé. */
  usedReview: boolean
  /** true si un avertissement officiel doit accompagner la réponse. */
  warn: boolean
}

function citationOf(c: PackRagChunk): PackGroundingCitation {
  return {
    document: c.document_name ?? c.source?.document ?? '',
    page: c.page_start ?? c.source?.page_start,
  }
}

function citationLabel(cit: PackGroundingCitation): string {
  if (!cit.document) return 'source pack'
  return cit.page !== undefined ? `${cit.document} · p. ${cit.page}` : cit.document
}

/**
 * Construit le bloc de grounding RAG pack pour une question, ou `null` si rien
 * de pertinent. `retrievePackChunks` applique déjà clean→review→(jamais
 * quarantine) ; on n'injecte donc que des extraits sûrs.
 */
export async function buildPackGrounding(question: string): Promise<PackGrounding | null> {
  let chunks: PackRagChunk[]
  try {
    chunks = await retrievePackChunks(question, { limit: MAX_CHUNKS, includeReview: true })
  } catch {
    return null // pack indisponible : on ne bloque pas, le provider répond sans contexte pack.
  }
  if (chunks.length === 0) return null

  const citations = chunks.map(citationOf)
  const usedReview = chunks.some((c) => c.importGate === 'review')
  const warn = usedReview || isNormativeText(question)

  const lines: string[] = [
    'CONTEXTE DOCUMENTAIRE FORMA — extraits du pack PDF (à utiliser comme source) :',
  ]
  chunks.forEach((c, i) => {
    const label = citationLabel(citations[i])
    const excerpt = (c.content ?? '').trim().slice(0, EXCERPT_LEN)
    lines.push(`"""\n[${c.importGate}] ${label}\n${excerpt}\n"""`)
  })

  lines.push(
    '',
    'CONSIGNES :',
    "- Appuie-toi sur ces extraits (et la fiche Knowledge éventuelle ci-dessus) comme sources.",
    '- Cite le document ET la page pour chaque information tirée de ces extraits (ex. « ching 3e.pdf · p. 53 »).',
    "- N'invente AUCUNE norme, article, chiffre, dimension ni date absent de ces extraits.",
    warn
      ? `- Sujet normatif/technique ou source à vérifier : termine impérativement par « ${REVIEW_WARNING} »`
      : '- Ne présente pas une indication technique comme une certitude normative officielle.',
  )

  return { block: lines.join('\n'), citations, usedReview, warn }
}
