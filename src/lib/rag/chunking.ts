/**
 * RAG — découpage des documents en chunks indexables.
 *
 * Stratégie : découpage par paragraphes, puis par phrases si un paragraphe
 * dépasse la taille cible, puis par groupes de mots en dernier recours.
 * On ne coupe JAMAIS au milieu d'un mot. Un chevauchement (overlap) est
 * appliqué entre chunks consécutifs pour préserver le contexte aux frontières.
 */

import { createId } from '../id'
import type { KnowledgeChunk, Source } from './types'

export interface ChunkOptions {
  /** Taille cible maximale d'un chunk en caractères (défaut : 800). */
  maxChars?: number
  /** Chevauchement entre chunks consécutifs en caractères (défaut : 100). */
  overlap?: number
}

const DEFAULT_MAX_CHARS = 800
const DEFAULT_OVERLAP = 100

/** Unité de texte à assembler, avec le séparateur à utiliser devant elle. */
interface TextUnit {
  text: string
  /** Séparateur inséré avant l'unité quand le chunk courant n'est pas vide. */
  sep: string
}

/** Découpe un texte en paragraphes (séparés par une ou plusieurs lignes vides). */
function splitIntoParagraphs(content: string): string[] {
  return content
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
}

/**
 * Découpe un paragraphe en phrases. Heuristique simple : on coupe après
 * une ponctuation finale (. ! ? …) suivie d'un espace.
 */
function splitIntoSentences(paragraph: string): string[] {
  return paragraph
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

/**
 * Découpe un texte trop long en groupes de mots ne dépassant pas maxChars.
 * Aucune coupe au milieu d'un mot : un mot isolé plus long que maxChars
 * est conservé tel quel (cas pathologique, ex. URL très longue).
 */
function splitByWords(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/).filter((w) => w.length > 0)
  const groups: string[] = []
  let current = ''
  for (const word of words) {
    if (current.length === 0) {
      current = word
    } else if (current.length + 1 + word.length <= maxChars) {
      current = `${current} ${word}`
    } else {
      groups.push(current)
      current = word
    }
  }
  if (current.length > 0) groups.push(current)
  return groups
}

/**
 * Extrait la fin d'un chunk pour servir de chevauchement, sans jamais couper
 * un mot : si la coupe tombe au milieu d'un mot, on avance jusqu'au mot suivant.
 * Retourne '' si aucun chevauchement propre n'est possible.
 */
function wordSafeTail(text: string, overlap: number): string {
  if (overlap <= 0) return ''
  if (text.length <= overlap) return text
  let slice = text.slice(text.length - overlap)
  const boundary = text.charAt(text.length - overlap - 1)
  if (!/\s/.test(boundary)) {
    // La coupe tombe au milieu d'un mot : on saute le fragment de mot.
    const firstSpace = slice.search(/\s/)
    if (firstSpace === -1) return ''
    slice = slice.slice(firstSpace + 1)
  }
  return slice.trimStart()
}

/**
 * Découpe le contenu d'un document en chunks séquentiels.
 *
 * - Taille cible ~800 caractères (un chunk peut légèrement dépasser à cause
 *   du chevauchement : borne max ≈ maxChars + overlap).
 * - Chevauchement ~100 caractères entre chunks consécutifs.
 * - Jamais de coupe au milieu d'un mot.
 * - Contenu vide ou blanc → tableau vide.
 */
export function createChunks(
  docId: string,
  content: string,
  opts?: ChunkOptions,
): KnowledgeChunk[] {
  const maxChars = Math.max(1, opts?.maxChars ?? DEFAULT_MAX_CHARS)
  // Le chevauchement est borné pour rester strictement inférieur à maxChars.
  const overlap = Math.min(Math.max(0, opts?.overlap ?? DEFAULT_OVERLAP), maxChars - 1)

  if (content.trim().length === 0) return []

  // 1. Constitution des unités : paragraphes entiers s'ils tiennent dans la
  //    taille cible, sinon phrases, sinon groupes de mots.
  const units: TextUnit[] = []
  for (const paragraph of splitIntoParagraphs(content)) {
    if (paragraph.length <= maxChars) {
      units.push({ text: paragraph, sep: '\n\n' })
      continue
    }
    for (const sentence of splitIntoSentences(paragraph)) {
      if (sentence.length <= maxChars) {
        units.push({ text: sentence, sep: ' ' })
      } else {
        for (const group of splitByWords(sentence, maxChars)) {
          units.push({ text: group, sep: ' ' })
        }
      }
    }
  }

  // 2. Assemblage glouton des unités en chunks, avec chevauchement.
  const texts: string[] = []
  let current = ''
  for (const unit of units) {
    if (current.length === 0) {
      current = unit.text
      continue
    }
    if (current.length + unit.sep.length + unit.text.length <= maxChars) {
      current = current + unit.sep + unit.text
    } else {
      texts.push(current)
      const tail = wordSafeTail(current, overlap)
      current = tail.length > 0 ? `${tail} ${unit.text}` : unit.text
    }
  }
  if (current.length > 0) texts.push(current)

  // 3. Matérialisation des chunks avec index séquentiel.
  return texts.map((text, index) => ({
    id: createId(),
    docId,
    index,
    text,
  }))
}

// ─── Stopwords pour la détection de langue ──────────────────────────────────

const FR_STOPWORDS = new Set([
  'le', 'la', 'les', 'de', 'des', 'du', 'un', 'une', 'et', 'est', 'dans',
  'pour', 'que', 'qui', 'avec', 'sur', 'pas', 'ce', 'cette', 'aux', 'au',
  'par', 'plus', 'sont', 'être', 'comme', 'mais', 'ou', 'donc', 'si',
])

const EN_STOPWORDS = new Set([
  'the', 'of', 'and', 'to', 'in', 'is', 'that', 'for', 'with', 'on', 'as',
  'are', 'this', 'it', 'be', 'at', 'by', 'from', 'or', 'an', 'was', 'but',
  'not', 'have', 'has', 'they', 'which',
])

/**
 * Extrait des métadonnées simples d'un contenu :
 * - wordCount : nombre de mots ;
 * - language : langue probable ('fr' ou 'en', heuristique par stopwords —
 *   en cas d'égalité on retient 'fr', langue principale de l'application) ;
 * - title : premier titre markdown (`# …`) ou première phrase ;
 * - sourceType : type de la source.
 */
export function extractMetadata(content: string, source: Source): Record<string, string> {
  const trimmed = content.trim()
  const words = trimmed.length > 0 ? trimmed.split(/\s+/) : []

  // Détection de langue par comptage de stopwords.
  let frScore = 0
  let enScore = 0
  for (const word of words) {
    const lower = word.toLowerCase().replace(/[^a-zà-ÿ]/g, '')
    if (FR_STOPWORDS.has(lower)) frScore++
    if (EN_STOPWORDS.has(lower)) enScore++
  }
  const language = enScore > frScore ? 'en' : 'fr'

  // Titre : première ligne markdown `#`, sinon première phrase, sinon label source.
  let title = ''
  const headingMatch = trimmed.match(/^#{1,6}\s+(.+)$/m)
  if (headingMatch?.[1]) {
    title = headingMatch[1].trim()
  } else if (trimmed.length > 0) {
    const firstSentence = splitIntoSentences(trimmed.split('\n')[0] ?? '')[0] ?? ''
    title = firstSentence.slice(0, 120).trim()
  }
  if (title.length === 0) title = source.label

  return {
    wordCount: String(words.length),
    language,
    title,
    sourceType: source.type,
  }
}
