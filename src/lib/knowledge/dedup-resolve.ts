/**
 * Résolution EXPLICITE des doublons (Sprint #10).
 *
 * Applique un plan de résolution rédigé à la main (lane C) — JAMAIS de
 * suppression automatique. Deux actions :
 *  - `merge`        : fusionne des doublons VRAIS (même domaine/type/sens) ; les
 *                     `drop` sont retirés au profit de `keep` (décision humaine
 *                     tracée dans le plan, donc non « auto »).
 *  - `distinguish`  : pour des HOMOGRAPHES légitimes (même terme, domaines/types
 *                     différents) qui partagent un slug : on désambiguïse le slug
 *                     (et éventuellement term/subdomain) pour rétablir l'unicité.
 *
 * Pur : renvoie une nouvelle base + un rapport. N'écrit rien.
 */
import { type KnowledgeEntry } from './model'

export type DedupResolution =
  | { action: 'merge'; keep: string; drop: string[]; reason?: string }
  | { action: 'distinguish'; id: string; slug?: string; term?: string; subdomain?: string; reason?: string }

export interface DedupApplyReport {
  base: KnowledgeEntry[]
  merged: { kept: string; dropped: string[]; reason?: string }[]
  distinguished: { id: string; slug?: string; reason?: string }[]
  /** ids référencés par le plan mais absents de la base. */
  missing: string[]
}

/** Applique un plan de résolution de doublons à la base. */
export function applyDedupPlan(
  base: readonly KnowledgeEntry[],
  resolutions: readonly DedupResolution[],
): DedupApplyReport {
  const byId = new Map(base.map((e) => [e.id, e]))
  const dropped = new Set<string>()
  const merged: DedupApplyReport['merged'] = []
  const distinguished: DedupApplyReport['distinguished'] = []
  const missing: string[] = []

  for (const r of resolutions) {
    if (r.action === 'merge') {
      if (!byId.has(r.keep)) { missing.push(r.keep); continue }
      const realDrops: string[] = []
      for (const id of r.drop) {
        if (!byId.has(id)) { missing.push(id); continue }
        dropped.add(id)
        realDrops.push(id)
      }
      merged.push({ kept: r.keep, dropped: realDrops, reason: r.reason })
    } else {
      const e = byId.get(r.id)
      if (!e) { missing.push(r.id); continue }
      byId.set(r.id, {
        ...e,
        ...(r.slug ? { slug: r.slug } : {}),
        ...(r.term ? { term: r.term } : {}),
        ...(r.subdomain ? { subdomain: r.subdomain } : {}),
      })
      distinguished.push({ id: r.id, slug: r.slug, reason: r.reason })
    }
  }

  const newBase = base.filter((e) => !dropped.has(e.id)).map((e) => byId.get(e.id) as KnowledgeEntry)
  return { base: newBase, merged, distinguished, missing }
}
