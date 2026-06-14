/**
 * Générateurs d'étude — quiz, révision, checklist, tâche-depuis-note.
 *
 * Chaque générateur a une version LOCALE déterministe (extractive, honnête,
 * sans réseau) et accepte un enrichissement cloud quand un provider est
 * configuré. Aucune donnée inventée : le local s'appuie sur le texte fourni.
 */
import { extractKeywords, summarizeText } from './ai-local'
import { createId } from './id'
import type { QuizQuestion } from '../types'

// ─── Découpage en phrases ──────────────────────────────────────────────────────

export function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20)
}

// ─── Quiz local ────────────────────────────────────────────────────────────────

/**
 * Génère un quiz local à partir d'un texte : vrai/faux (phrases, certaines
 * altérées en « faux ») et réponses courtes (compléter un terme clé). Sans
 * texte exploitable, retourne []. `count` borne le nombre de questions.
 */
export function generateQuizLocal(text: string, count = 6): QuizQuestion[] {
  const sentences = splitSentences(text)
  if (sentences.length === 0) return []
  const keywords = extractKeywords(text, 12)
  const questions: QuizQuestion[] = []

  // Vrai/Faux : phrases telles quelles (vrai) ; une sur deux « altérée » (faux)
  // en remplaçant un mot-clé par un autre du texte (négation simple sinon).
  sentences.slice(0, Math.ceil(count / 2)).forEach((s, i) => {
    const makeFalse = i % 2 === 1 && keywords.length >= 2
    let statement = s
    let answer: 'vrai' | 'faux' = 'vrai'
    if (makeFalse) {
      const present = keywords.find((k) => s.toLowerCase().includes(k.toLowerCase()))
      const replacement = keywords.find((k) => k !== present)
      if (present && replacement) {
        statement = s.replace(new RegExp(present, 'i'), replacement)
        answer = 'faux'
      }
    }
    questions.push({ id: createId(), type: 'truefalse', question: statement, answer })
  })

  // Réponses courtes : « Quel terme complète : … ___ … ? » à partir d'un mot-clé.
  for (const s of sentences) {
    if (questions.length >= count) break
    const kw = keywords.find((k) => s.toLowerCase().includes(k.toLowerCase()))
    if (!kw) continue
    const blanked = s.replace(new RegExp(kw, 'i'), '_____')
    if (blanked === s) continue
    questions.push({ id: createId(), type: 'short', question: `Complétez : « ${blanked} »`, answer: kw })
  }

  return questions.slice(0, count)
}

// ─── Révision locale ───────────────────────────────────────────────────────────

export interface RevisionResult {
  summary: string
  concepts: string[]
  points: string[]
}

/** Prépare une révision locale : résumé extractif + concepts + points clés. */
export function prepareRevisionLocal(text: string): RevisionResult {
  const sentences = splitSentences(text)
  return {
    summary: sentences.length > 0 ? summarizeText(text, 4) : '',
    concepts: extractKeywords(text, 8),
    points: sentences.slice(0, 5),
  }
}

// ─── Checklist locale ──────────────────────────────────────────────────────────

/**
 * Génère une checklist de projet à partir de signaux : nombre de documents,
 * tâches en cours, présence d'événements. Étapes génériques + manques détectés.
 */
export function generateChecklistLocal(ctx: {
  documentCount: number
  taskTitles: string[]
  hasEvents: boolean
}): string[] {
  const items: string[] = []
  items.push('Définir l’objectif et la portée du projet')
  items.push(ctx.documentCount > 0 ? `Organiser les ${ctx.documentCount} document(s) du projet` : '⚠ Ajouter des documents au projet')
  items.push(ctx.taskTitles.length > 0 ? `Avancer les tâches (${ctx.taskTitles.length})` : '⚠ Définir les premières tâches')
  items.push(ctx.hasEvents ? 'Vérifier les échéances au calendrier' : '⚠ Planifier les jalons au calendrier')
  items.push('Relire et vérifier la cohérence d’ensemble')
  items.push('Préparer le livrable final')
  return items
}

// ─── Tâche depuis note ─────────────────────────────────────────────────────────

const FR_WEEKDAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}
function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}
function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12)
}

export interface TaskSuggestion {
  title: string
  dueDate?: string
  priority: 'low' | 'medium' | 'high'
}

/**
 * Déduit une tâche d'une note en langage naturel (« remettre le rapport
 * lundi », « examen urgent vendredi »). Détecte échéance (jour de semaine,
 * demain/aujourd'hui) et priorité (urgent/important → haute). `today` injecté.
 */
export function taskFromNote(note: string, today: string): TaskSuggestion | null {
  const raw = note.trim()
  if (raw === '') return null
  const norm = raw.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

  let dueDate: string | undefined
  let title = raw

  const strip = (re: RegExp) => { title = title.replace(re, ' ').replace(/\s{2,}/g, ' ').trim() }

  if (/\baujourd'?hui\b/.test(norm)) { dueDate = today; strip(/\baujourd'?hui\b/gi) }
  else if (/\bdemain\b/.test(norm)) { dueDate = toISO(new Date(parseISO(today).getTime() + 86_400_000)); strip(/\bdemain\b/gi) }
  else {
    for (let i = 0; i < FR_WEEKDAYS.length; i++) {
      const day = FR_WEEKDAYS[i].normalize('NFD').replace(/[̀-ͯ]/g, '')
      if (new RegExp(`\\b${day}\\b`).test(norm)) {
        const base = parseISO(today)
        let delta = (i - base.getDay() + 7) % 7
        if (delta === 0) delta = 7 // « lundi » = prochain lundi
        dueDate = toISO(new Date(base.getTime() + delta * 86_400_000))
        strip(new RegExp(`\\b${FR_WEEKDAYS[i]}\\b`, 'gi'))
        break
      }
    }
  }

  const priority: TaskSuggestion['priority'] =
    /\burgent|important|priorit/.test(norm) ? 'high' : 'medium'
  strip(/\b(urgent|important)\b/gi)

  // Verbe d'action en tête conservé ; nettoyage des mots de liaison résiduels.
  title = title.replace(/^[,;:\-–\s]+|[,;:\-–\s]+$/g, '').trim()
  if (title === '') title = 'Nouvelle tâche'
  else title = title.charAt(0).toUpperCase() + title.slice(1)

  return { title, ...(dueDate ? { dueDate } : {}), priority }
}
