/**
 * LocalProvider — fallback local pur, sans réseau.
 *
 * Réutilise les primitives existantes de src/lib/ai-local.ts
 * (résumé extractif, mots-clés, reformulation, question/réponse par
 * scoring de phrases) — sans modifier src/lib/ai-service.ts.
 *
 * Toujours configuré, `fromCloud: false`, jamais d'erreur.
 */
import {
  answerQuestion,
  extractKeywords,
  reformulate,
  summarizeText,
} from '../../../lib/ai-local'
import { knowledgeAnswer } from '../knowledge-bridge'
import {
  FORMAI_EMPTY_FALLBACK,
  FORMAI_LOCAL_LIMITS,
  FORMAI_NO_KNOWLEDGE,
} from '../../../lib/forma-messages'
import type {
  AIProviderAdapter,
  AssistantSource,
  ProviderChatRequest,
  ProviderChatResult,
} from '../types'

/** Message par défaut quand aucune heuristique locale ne produit de texte. */
const EMPTY_FALLBACK = FORMAI_EMPTY_FALLBACK

/**
 * Produit une réponse locale en détectant l'intention du dernier message
 * utilisateur (résumé, mots-clés, reformulation…), sinon en cherchant les
 * phrases les plus pertinentes dans la conversation (extractif).
 */
/** Message expliquant les limites du mode local (pas de génération). */
const LOCAL_LIMITS_MESSAGE = FORMAI_LOCAL_LIMITS

/** No-result honnête après échec de l'extraction ET de la base Knowledge (réexport compat). */
export const NO_KNOWLEDGE_MESSAGE = FORMAI_NO_KNOWLEDGE

/** Vrai si le message demande une opération de texte (résumé, mots-clés, reformulation). */
function isTextOperation(text: string): boolean {
  return /r[ée]sum|synth[èe]s|mots[- ]?cl[ée]s|keywords?|raccourci|plus court|reformul|ton formel|plus formel/.test(
    text.toLowerCase(),
  )
}

/**
 * Retire l'instruction de tête (« Résume ce texte : … ») pour ne traiter
 * que le contenu réel à analyser.
 */
function stripInstruction(text: string): string {
  const colonIdx = text.search(/[:\n]/)
  if (colonIdx > 0 && colonIdx < 80) {
    const rest = text.slice(colonIdx + 1).trim()
    if (rest.length > 40) return rest
  }
  return text
}

function localAnswer(request: ProviderChatRequest): string {
  const lastUser =
    [...request.messages].reverse().find((m) => m.role === 'user')?.content ?? ''
  // Contexte = tout le contenu non-système de la conversation.
  const context = request.messages
    .filter((m) => m.role !== 'system')
    .map((m) => m.content)
    .join('\n')

  const intent = lastUser.toLowerCase()
  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()
  const payload = stripInstruction(lastUser)

  let answer: string
  if (/r[ée]sum|synth[èe]s/.test(intent)) {
    answer = summarizeText(payload, 2)
  } else if (/mots[- ]?cl[ée]s|keywords?/.test(intent)) {
    const keywords = extractKeywords(payload !== lastUser ? payload : context)
    answer = keywords.length > 0 ? `Mots-clés : ${keywords.join(', ')}` : ''
  } else if (/raccourci|plus court/.test(intent)) {
    answer = reformulate(payload, 'shorter')
  } else if (/reformul|ton formel|plus formel/.test(intent)) {
    answer = reformulate(payload, 'formal')
  } else {
    // Question / chat générique : extraction des phrases les plus pertinentes
    // de la conversation — présentée comme telle, jamais comme une réponse
    // générée (le mode local ne « sait » rien).
    const excerpt = answerQuestion(context, lastUser)
    if (
      excerpt.trim() !== ''
      && normalize(excerpt) !== normalize(lastUser)
      && excerpt.length > 30
    ) {
      answer =
        `Extrait pertinent de la conversation :\n« ${excerpt.trim()} »\n\n`
        + '(Mode local — analyse extractive. Pour une réponse de connaissance '
        + 'générale, configurez un fournisseur dans Paramètres › IA.)'
    } else {
      answer = ''
    }
  }

  // Garde anti-écho : si le résultat ne fait que répéter la question ou le
  // texte fourni, expliquer honnêtement les limites du mode local.
  if (
    answer.trim() === ''
    || normalize(answer) === normalize(lastUser)
    || normalize(answer) === normalize(payload)
  ) {
    // Pour un résumé d'un texte déjà court, répéter est acceptable ;
    // dans tous les autres cas on renvoie '' (le caller décide : Knowledge ou message).
    if (/r[ée]sum|synth[èe]s/.test(intent) && payload !== lastUser && answer.trim() !== '') {
      return `Texte déjà concis — phrase clé : ${summarizeText(payload, 1)}`
    }
    return ''
  }
  return answer
}

export const localProvider: AIProviderAdapter = {
  id: 'local',
  label: 'Local (sans cloud)',

  isConfigured(): boolean {
    return true
  },

  async chat(request: ProviderChatRequest): Promise<ProviderChatResult> {
    const done = (text: string, sources?: AssistantSource[]): ProviderChatResult => ({
      text, providerId: 'local', fromCloud: false,
      ...(sources && sources.length > 0 ? { sources } : {}),
    })

    // 1) Heuristiques locales (résumé, mots-clés, reformulation, extractif).
    const heuristic = localAnswer(request).trim()
    if (heuristic !== '') return done(heuristic)

    const lastUser = [...request.messages].reverse().find((m) => m.role === 'user')?.content ?? ''

    // 2) Pour une opération de texte sans contenu exploitable : message d'aide.
    if (isTextOperation(lastUser)) return done(LOCAL_LIMITS_MESSAGE)

    // 3) Question de connaissance : consulter la base Knowledge LOCALE (seeds #11)
    //    avant d'abandonner. Réponse ancrée (source + confiance + lien) ou null.
    try {
      const kb = await knowledgeAnswer(lastUser)
      if (kb) {
        return done(kb.text, [
          { kind: 'seed', label: kb.term, slug: kb.slug, toVerify: kb.confidence === 'à-vérifier' },
        ])
      }
    } catch {
      // Base indisponible : on retombe sur le pont suivant ci-dessous.
    }

    // 4) RAG pack documentaire PDF (Part 10) : extraits sourcés (document + page),
    //    clean > review (avec avertissement), quarantine jamais. Import paresseux.
    try {
      const { ragAnswer } = await import('../../knowledge-pack/rag')
      const rag = await ragAnswer(lastUser)
      if (rag.found) return done(rag.answer, packSources(rag.chunks, !!rag.warning))
    } catch {
      // Pack indisponible : on retombe sur le message honnête ci-dessous.
    }

    // 5) Rien trouvé nulle part : no-result honnête (jamais d'invention).
    return done(lastUser.trim() !== '' ? NO_KNOWLEDGE_MESSAGE : EMPTY_FALLBACK)
  },
}

/**
 * Mappe les chunks pack utilisés en sources structurées (dédoublonnées par
 * document+page). Le gate n'est jamais 'quarantine' (exclu en amont par le RAG).
 */
function packSources(chunks: ReadonlyArray<PackRagChunkLike>, warn: boolean): AssistantSource[] {
  const out: AssistantSource[] = []
  const seen = new Set<string>()
  for (const c of chunks) {
    const document = c.document_name ?? c.source?.document ?? ''
    const page = c.page_start ?? c.source?.page_start
    const key = `${document}|${page ?? ''}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({
      kind: 'pack',
      label: document || 'Document Forma',
      ...(document ? { document } : {}),
      ...(page !== undefined ? { page } : {}),
      gate: c.importGate === 'review' ? 'review' : 'clean',
      toVerify: c.importGate === 'review' || warn,
    })
  }
  return out
}

/** Forme minimale d'un chunk pack utilisée pour bâtir les sources (sans importer le type complet). */
interface PackRagChunkLike {
  document_name?: string
  page_start?: number
  importGate?: string
  source?: { document?: string; page_start?: number }
}
