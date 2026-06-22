/**
 * Recherche écosystème (Search V3) : tâches, projets, fiches normatives,
 * détails constructifs, quiz, checklists et sessions académiques. Complète la
 * recherche de documents/pages (global-search) avec les entités du workspace.
 */
import { db } from '../db'
import { searchNormative } from './resources/normative'
import { searchMaterials } from './resources/materials'
import { graphicResourceHits } from './resources/resourceFactory'
import { searchTemplates, TEMPLATE_CATEGORY_LABELS } from './resources/templates'
import { searchChecks, COMPLIANCE_CATEGORY_LABELS } from './compliance/checks'
import { sessionLabel, TERM_LABELS } from '../services/academic'

export type EcosystemHitKind =
  | 'task'
  | 'project'
  | 'norme'
  | 'detail'
  | 'material'
  | 'hatch'
  | 'symbol'
  | 'legend'
  | 'template'
  | 'compliance'
  | 'quiz'
  | 'checklist'
  | 'session'
  | 'flashcard'
  | 'exam'
  | 'knowledge'
  | 'docpack'

export interface EcosystemHit {
  kind: EcosystemHitKind
  id: string
  title: string
  subtitle: string
  /** Route de navigation. */
  to: string
}

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

/**
 * Nombre minimum de résultats « knowledge » (dictionnaire) garantis dans la
 * liste finale quand la base en renvoie : sans cette réservation, les fiches
 * étaient systématiquement repoussées hors du `limit` par les nombreux autres
 * résultats (tâches, normes, ressources…) sur les termes courants.
 */
export const KNOWLEDGE_MIN_SLOTS = 3

/**
 * Fusionne les autres résultats avec les fiches Knowledge en RÉSERVANT à ces
 * dernières quelques places dans la limite, **sans supprimer** les autres
 * résultats ni changer leur ordre relatif. Les places non utilisées par le
 * quota restent disponibles pour les autres résultats (puis le surplus).
 */
export function mergeWithKnowledgeQuota(
  other: readonly EcosystemHit[],
  knowledge: readonly EcosystemHit[],
  limit: number,
  minKnowledge: number = KNOWLEDGE_MIN_SLOTS,
): EcosystemHit[] {
  if (limit <= 0) return []
  if (knowledge.length === 0) return other.slice(0, limit)

  const reserved = Math.min(knowledge.length, minKnowledge, limit)
  const otherCount = Math.max(0, limit - reserved)
  const result: EcosystemHit[] = [...other.slice(0, otherCount), ...knowledge.slice(0, reserved)]

  // Comble la capacité restante (si peu d'« autres ») avec le surplus.
  if (result.length < limit) {
    const seen = new Set(result.map((h) => `${h.kind}:${h.id}`))
    const add = (h: EcosystemHit) => {
      const key = `${h.kind}:${h.id}`
      if (!seen.has(key) && result.length < limit) {
        seen.add(key)
        result.push(h)
      }
    }
    knowledge.forEach(add)
    other.forEach(add)
  }
  return result.slice(0, limit)
}

/**
 * Recherche dans les tâches, projets, fiches normatives et détails.
 * `limit` borne le nombre total de résultats.
 */
export async function searchEcosystem(query: string, limit = 20): Promise<EcosystemHit[]> {
  const q = normalize(query)
  if (q.length < 2) return []
  const hits: EcosystemHit[] = []

  // Tâches (titre + description)
  const tasks = await db.tasks.filter((t) => !t.deletedAt).toArray()
  for (const t of tasks) {
    const hay = normalize(`${t.title} ${t.description ?? ''}`)
    if (hay.includes(q)) {
      hits.push({
        kind: 'task', id: t.id, title: t.title,
        subtitle: `Tâche · ${t.status === 'done' ? 'terminé' : t.status === 'doing' ? 'en cours' : 'à faire'}${t.dueDate ? ` · ${t.dueDate}` : ''}`,
        to: '/tasks',
      })
    }
  }

  // Projets (nom + description)
  const projects = await db.projects.filter((p) => !p.deletedAt).toArray()
  for (const p of projects) {
    const hay = normalize(`${p.name} ${p.description ?? ''}`)
    if (hay.includes(q)) {
      hits.push({ kind: 'project', id: p.id, title: p.name, subtitle: 'Projet', to: `/projects/${p.id}` })
    }
  }

  // Quiz (titre + questions) → matière liée si présente
  const quizzes = await db.quizzes.toArray()
  for (const quiz of quizzes) {
    const hay = normalize(`${quiz.title} ${quiz.questions.map((qq) => qq.question).join(' ')}`)
    if (hay.includes(q)) {
      hits.push({
        kind: 'quiz', id: quiz.id, title: quiz.title,
        subtitle: `Quiz · ${quiz.questions.length} question${quiz.questions.length !== 1 ? 's' : ''}`,
        to: quiz.subjectId ? `/subjects/${quiz.subjectId}` : '/formai',
      })
    }
  }

  // Checklists (titre + items) → projet lié si présent
  const checklists = await db.checklists.toArray()
  for (const c of checklists) {
    const hay = normalize(`${c.title} ${c.items.map((it) => it.text).join(' ')}`)
    if (hay.includes(q)) {
      const done = c.items.filter((it) => it.done).length
      hits.push({
        kind: 'checklist', id: c.id, title: c.title,
        subtitle: `Checklist · ${done}/${c.items.length}`,
        to: c.projectId ? `/projects/${c.projectId}` : '/projects',
      })
    }
  }

  // Flashcards (recto + verso + tags) → matière liée si présente
  const flashcards = await db.flashcards.toArray()
  for (const f of flashcards) {
    const hay = normalize(`${f.front} ${f.back} ${(f.tags ?? []).join(' ')}`)
    if (hay.includes(q)) {
      hits.push({
        kind: 'flashcard', id: f.id, title: f.front,
        subtitle: 'Flashcard',
        to: f.subjectId ? `/subjects/${f.subjectId}` : '/dashboard',
      })
    }
  }

  // Examens blancs (titre + énoncés) → matière liée si présente
  const exams = await db.exams.toArray()
  for (const ex of exams) {
    const hay = normalize(`${ex.title} ${ex.questions.map((qq) => qq.question).join(' ')}`)
    if (hay.includes(q)) {
      hits.push({
        kind: 'exam', id: ex.id, title: ex.title,
        subtitle: `Examen blanc · ${ex.questions.length} q.`,
        to: ex.subjectId ? `/subjects/${ex.subjectId}` : '/dashboard',
      })
    }
  }

  // Sessions académiques (terme + année)
  const sessions = await db.academicSessions.toArray()
  for (const s of sessions) {
    const hay = normalize(`${sessionLabel(s)} ${TERM_LABELS[s.term]} ${s.year} session academique`)
    if (hay.includes(q)) {
      hits.push({ kind: 'session', id: s.id, title: sessionLabel(s), subtitle: `Session · ${s.weeks} semaines`, to: '/dashboard' })
    }
  }

  // Fiches normatives (catalogue statique)
  for (const s of searchNormative(query)) {
    hits.push({ kind: 'norme', id: s.id, title: s.title, subtitle: `Norme · ${s.category.toUpperCase()}`, to: '/resources' })
  }

  // Ressources graphiques (hachures/symboles/détails/légendes) — source unifiée
  for (const h of graphicResourceHits(query)) {
    hits.push({ kind: h.kind, id: h.id, title: h.title, subtitle: h.subtitle, to: h.to })
  }

  // Matériaux (catalogue statique, hors ressources graphiques)
  for (const m of searchMaterials(query)) {
    hits.push({ kind: 'material', id: m.id, title: m.name, subtitle: 'Matériau', to: '/resources' })
  }

  // Templates architecture (catalogue statique)
  for (const t of searchTemplates(query)) {
    hits.push({ kind: 'template', id: t.id, title: t.name, subtitle: `Template · ${TEMPLATE_CATEGORY_LABELS[t.category]}`, to: '/resources' })
  }

  // Vérifications de conformité (catalogue statique)
  for (const c of searchChecks(query)) {
    hits.push({ kind: 'compliance', id: c.id, title: c.name, subtitle: `Conformité · ${COMPLIANCE_CATEGORY_LABELS[c.category]}`, to: '/compliance' })
  }

  // Base de connaissance (dictionnaire) — import dynamique : les ~920 seeds
  // restent hors du bundle principal (chargés à la demande, jamais en eager).
  // Collectées à part puis fusionnées avec un quota garanti (priorisation).
  const knowledgeHits: EcosystemHit[] = []
  try {
    const { searchKnowledgeBase } = await import('./knowledge')
    const known = await searchKnowledgeBase(query, { limit: 5 })
    for (const k of known) {
      knowledgeHits.push({
        kind: 'knowledge',
        id: k.entry.id,
        title: k.entry.term,
        subtitle: `Définition · ${k.entry.domain}`,
        to: `/dictionary?slug=${encodeURIComponent(k.entry.slug)}`,
      })
    }
  } catch (err) {
    console.warn('[Forma] Recherche dans la base de connaissance indisponible:', err)
  }

  // Pack documentaire PDF (Part 10) — UNIQUEMENT s'il est déjà importé en Dexie.
  // On ne déclenche jamais l'import (lourd) depuis la recherche globale.
  // quarantine exclu par défaut ; clean priorisé > review (warning) côté query.
  try {
    const { isPackImported } = await import('../services/knowledge-pack/import')
    if (await isPackImported()) {
      const { searchPackEntries, entrySourceLabel } = await import('../services/knowledge-pack/query')
      const res = await searchPackEntries({ text: query, limit: 5 })
      for (const e of res.items) {
        hits.push({
          kind: 'docpack',
          id: e.id,
          title: e.title,
          subtitle: `Document · ${entrySourceLabel(e)}${e.importGate === 'review' ? ' · À vérifier' : ''}`,
          to: `/dictionary?source=pack&q=${encodeURIComponent(query)}`,
        })
      }
    }
  } catch (err) {
    console.warn('[Forma] Recherche dans le pack documentaire indisponible:', err)
  }

  return mergeWithKnowledgeQuota(hits, knowledgeHits, limit)
}
