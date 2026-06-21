/**
 * Grounding Knowledge pour les providers GÉNÉRATIFS (Sprint #12).
 *
 * Construit un bloc de contexte système à partir de la fiche Knowledge la plus
 * pertinente pour la question, avec une consigne ANTI-HALLUCINATION : le modèle
 * (LM Studio/Ollama, ou cloud) doit répondre à partir de la fiche, citer le
 * terme + sa source + son niveau de confiance, et signaler « à vérifier » le cas
 * échéant. Le lien `/dictionary?slug=…` est fourni.
 *
 * Si aucune fiche pertinente : `null` → on n'injecte RIEN, le modèle répond de
 * ses connaissances générales mais SANS prétendre citer Forma (cf. consigne
 * d'absence). Réutilise le finder du pont #11 (`findRelevantEntry`) et le rendu
 * sourcé de #6 (`renderEntryBlock`). Import dynamique des seeds.
 */
import { renderEntryBlock, confidenceLabel } from '../../lib/ai/knowledge-actions'
import { findRelevantEntry } from './knowledge-bridge'

export interface KnowledgeGrounding {
  /** Bloc à injecter dans le prompt système. */
  block: string
  slug: string
  term: string
  toVerify: boolean
}

/**
 * Produit le bloc de grounding pour une question, ou `null` si aucune fiche
 * fiable. À injecter dans le prompt système des providers génératifs.
 */
export async function buildKnowledgeGrounding(question: string): Promise<KnowledgeGrounding | null> {
  const entry = await findRelevantEntry(question)
  if (!entry) return null

  const toVerify = entry.confidence === 'à-vérifier'
  const lines = [
    'CONTEXTE KNOWLEDGE FORMA — fiche locale pertinente (à utiliser comme source) :',
    renderEntryBlock(entry),
    '',
    'CONSIGNES :',
    `- Réponds à la question en t'appuyant sur cette fiche « ${entry.term} ».`,
    `- Cite explicitement la source (« ${entry.sources[0]?.label ?? 'base Forma'} ») et le niveau de confiance (${confidenceLabel(entry)}).`,
    "- N'invente AUCUNE norme, article, chiffre ou date qui ne figure pas dans la fiche.",
    toVerify
      ? '- Cette fiche est marquée « à vérifier » : préviens clairement que l\'information doit être confirmée auprès d\'une source officielle.'
      : '- Reste prudent : ne présente pas une indication comme une certitude normative.',
    `- Termine ta réponse par le lien de la fiche : /dictionary?slug=${entry.slug}`,
  ]

  return { block: lines.join('\n'), slug: entry.slug, term: entry.term, toVerify }
}
