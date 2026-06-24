/**
 * Coordination inter-sources (Sprint #23).
 *
 * Déduplique, ordonne et borne les `AssistantSource` issues des seeds Knowledge
 * ET du pack RAG, pour des chips propres et un contexte cohérent. PURE et
 * DÉTERMINISTE — aucune déduction floue, jamais agressive.
 *
 * Ordre de priorité (conservateur) :
 *  1. pack `clean` précis (document + page) ;
 *  2. fiche seed (terme, lien /dictionary) ;
 *  3. pack `review` (porteur d'avertissement) ;
 *  4. autres sources secondaires.
 *
 * Garanties : ne promeut jamais review en clean ; quarantine absente en amont
 * (gate ∈ {clean, review}) ; ne supprime jamais TOUTES les sources ; conserve la
 * fiche seed si elle porte un slug utile (navigation) même en présence d'un pack.
 */
import type { AssistantSource } from './types'

/** Plafond de chips affichées. */
export const MAX_SOURCE_CHIPS = 5

const COMBINING = /[̀-ͯ]/g

/** Normalise un libellé (minuscule, sans accents, espaces compactés). */
export function normalizeLabel(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(COMBINING, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

/** Rang de priorité d'une source (plus petit = plus prioritaire). */
export function sourceRank(s: AssistantSource): number {
  if (s.kind === 'pack' && s.gate === 'clean' && s.document && s.page !== undefined) return 0
  if (s.kind === 'seed') return 1
  if (s.kind === 'pack' && s.gate === 'review') return 2
  return 3
}

/** Clé d'unicité exacte d'une source. */
function exactKey(s: AssistantSource): string {
  return [s.kind, s.slug ?? '', s.document ?? '', s.page ?? '', normalizeLabel(s.label ?? ''), s.gate ?? ''].join('|')
}

/**
 * Coordonne une liste de sources : dédup exacte + dédup inter-sources
 * conservatrice + ranking stable + plafond. Renvoie une nouvelle liste.
 */
export function coordinateSources(sources: readonly AssistantSource[], max = MAX_SOURCE_CHIPS): AssistantSource[] {
  // 1) Tri stable par priorité (préserve l'ordre d'entrée à rang égal).
  const ordered = sources.map((s, i) => ({ s, i })).sort((a, b) => sourceRank(a.s) - sourceRank(b.s) || a.i - b.i).map((x) => x.s)

  // 2) Dédup exacte.
  const exactSeen = new Set<string>()
  const deduped: AssistantSource[] = []
  for (const s of ordered) {
    const k = exactKey(s)
    if (exactSeen.has(k)) continue
    exactSeen.add(k)
    deduped.push(s)
  }

  // 3) Dédup inter-sources CONSERVATRICE : si un pack `clean` précis et une fiche
  //    seed désignent la MÊME notion (libellé normalisé identique), on garde le
  //    pack (plus vérifiable) — SAUF si le seed porte un slug (valeur de
  //    navigation), auquel cas on garde les deux.
  const packCleanLabels = new Set(
    deduped.filter((s) => s.kind === 'pack' && s.gate === 'clean' && s.document && s.page !== undefined)
      .map((s) => normalizeLabel(s.label)),
  )
  const result = deduped.filter((s) => {
    if (s.kind === 'seed' && !s.slug && packCleanLabels.has(normalizeLabel(s.label))) return false
    return true
  })

  // 4) Garde-fou : ne jamais tout supprimer (rare — dédup inter-sources seule
  //    pourrait vider la liste si tout collisionne). Sinon, plafonner.
  const final = result.length > 0 ? result : deduped
  return final.slice(0, max)
}
