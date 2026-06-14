/**
 * Recherche écosystème (Search V2) : tâches, projets, fiches normatives et
 * détails constructifs. Complète la recherche de documents/pages
 * (global-search) avec les entités du workspace. Résultats unifiés et navigables.
 */
import { db } from '../db'
import { searchNormative } from './resources/normative'
import { searchDetails } from './resources/details'

export type EcosystemHitKind = 'task' | 'project' | 'norme' | 'detail'

export interface EcosystemHit {
  kind: EcosystemHitKind
  id: string
  title: string
  subtitle: string
  /** Route de navigation. */
  to: string
}

const KIND_ROUTE: Record<EcosystemHitKind, (id: string) => string> = {
  task: () => '/tasks',
  project: (id) => `/projects/${id}`,
  norme: () => '/resources',
  detail: () => '/resources',
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
        to: KIND_ROUTE.task(t.id),
      })
    }
  }

  // Projets (nom + description)
  const projects = await db.projects.filter((p) => !p.deletedAt).toArray()
  for (const p of projects) {
    const hay = normalize(`${p.name} ${p.description ?? ''}`)
    if (hay.includes(q)) {
      hits.push({ kind: 'project', id: p.id, title: p.name, subtitle: 'Projet', to: KIND_ROUTE.project(p.id) })
    }
  }

  // Fiches normatives (catalogue statique)
  for (const s of searchNormative(query)) {
    hits.push({ kind: 'norme', id: s.id, title: s.title, subtitle: `Norme · ${s.category.toUpperCase()}`, to: KIND_ROUTE.norme(s.id) })
  }

  // Détails constructifs (catalogue statique)
  for (const d of searchDetails(query)) {
    hits.push({ kind: 'detail', id: d.id, title: d.name, subtitle: 'Détail constructif', to: KIND_ROUTE.detail(d.id) })
  }

  return hits.slice(0, limit)
}
