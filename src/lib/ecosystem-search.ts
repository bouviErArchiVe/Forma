/**
 * Recherche écosystème (Search V3) : tâches, projets, fiches normatives,
 * détails constructifs, quiz, checklists et sessions académiques. Complète la
 * recherche de documents/pages (global-search) avec les entités du workspace.
 */
import { db } from '../db'
import { searchNormative } from './resources/normative'
import { searchDetails } from './resources/details'
import { searchMaterials } from './resources/materials'
import { searchHatches } from './resources/hatches'
import { searchSymbols } from './resources/symbols'
import { searchLegends } from './resources/legends'
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

  // Détails constructifs (catalogue statique)
  for (const d of searchDetails(query)) {
    hits.push({ kind: 'detail', id: d.id, title: d.name, subtitle: 'Détail constructif', to: '/resources' })
  }

  // Matériaux (catalogue statique)
  for (const m of searchMaterials(query)) {
    hits.push({ kind: 'material', id: m.id, title: m.name, subtitle: 'Matériau', to: '/resources' })
  }

  // Hachures (catalogue statique)
  for (const h of searchHatches(query)) {
    hits.push({ kind: 'hatch', id: h.id, title: h.name, subtitle: 'Hachure', to: '/resources' })
  }

  // Symboles techniques (catalogue statique)
  for (const s of searchSymbols(query)) {
    hits.push({ kind: 'symbol', id: s.id, title: s.name, subtitle: 'Symbole', to: '/resources' })
  }

  // Légendes (catalogue statique)
  for (const l of searchLegends(query)) {
    hits.push({ kind: 'legend', id: l.id, title: l.name, subtitle: 'Légende', to: '/resources' })
  }

  // Templates architecture (catalogue statique)
  for (const t of searchTemplates(query)) {
    hits.push({ kind: 'template', id: t.id, title: t.name, subtitle: `Template · ${TEMPLATE_CATEGORY_LABELS[t.category]}`, to: '/resources' })
  }

  // Vérifications de conformité (catalogue statique)
  for (const c of searchChecks(query)) {
    hits.push({ kind: 'compliance', id: c.id, title: c.name, subtitle: `Conformité · ${COMPLIANCE_CATEGORY_LABELS[c.category]}`, to: '/compliance' })
  }

  return hits.slice(0, limit)
}
