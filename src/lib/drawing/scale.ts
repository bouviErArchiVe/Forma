/**
 * Échelles dynamiques (Pack B4 — fondation V1).
 *
 * Modèle PUR d'échelle/profil de dessin + helpers de conversion page↔réel.
 * Objectif : une seule source de vérité, typée et testée, pour convertir des
 * pixels canvas (« page ») en unités réelles et inversement — réutilisable par
 * les cotes (`src/lib/dimensions`) et toute future fonction métrique.
 *
 * Deux façons d'exprimer une échelle :
 *  1. Ratio architectural (1:N) — ex. 1:50, 1:100. À cette échelle, 1 unité
 *     dessinée sur le plan représente N unités réelles dans la MÊME unité.
 *  2. Densité directe — « 1 px = K unités réelles » (réel par pixel), ce que le
 *     modèle de cotes existant utilise déjà (`scale` = réel/px).
 *
 * Tout est ramené à un facteur canonique `realPerPx` (unités réelles par pixel
 * canvas), ce qui rend les conversions triviales et réversibles.
 */

/** Unités réelles supportées (alignées sur les cotes). */
export type ScaleUnit = 'mm' | 'cm' | 'm' | 'in' | 'ft'

export const SCALE_UNIT_LABELS: Record<ScaleUnit, string> = {
  mm: 'mm',
  cm: 'cm',
  m: 'm',
  in: 'po',
  ft: 'pi',
}

/**
 * Facteur de conversion d'une unité vers le millimètre (unité de base interne).
 * Permet d'exprimer une échitecture 1:N indépendamment de l'unité affichée.
 */
const UNIT_TO_MM: Record<ScaleUnit, number> = {
  mm: 1,
  cm: 10,
  m: 1000,
  in: 25.4,
  ft: 304.8,
}

/** Convertit une longueur d'une unité réelle vers une autre. */
export function convertUnit(value: number, from: ScaleUnit, to: ScaleUnit): number {
  if (!Number.isFinite(value)) return NaN
  if (from === to) return value
  return (value * UNIT_TO_MM[from]) / UNIT_TO_MM[to]
}

/**
 * Profil d'échelle d'un dessin. Forme canonique stockable/sérialisable.
 *
 * Invariant : `realPerPx > 0` (unités `unit` par pixel canvas). Toujours
 * construire via `scaleFromRatio` / `scaleFromRealPerPx` pour garantir des
 * valeurs sûres (jamais 0, NaN ou négatif).
 */
export interface ScaleProfile {
  /** Unité réelle de référence du profil. */
  unit: ScaleUnit
  /** Facteur canonique : unités réelles (`unit`) par pixel canvas. > 0. */
  realPerPx: number
  /**
   * Dénominateur du ratio architectural 1:N quand l'échelle a été définie ainsi
   * (ex. 50 pour 1:50). `undefined` pour une échelle par densité directe.
   * Purement informatif : `realPerPx` reste la source de vérité.
   */
  ratio?: number
  /** Libellé court lisible (« 1:50 », « 1 px = 10 mm »). */
  label: string
}

/** Garde un nombre fini strictement positif, sinon `fallback`. */
function positiveOr(n: number | undefined, fallback: number): number {
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : fallback
}

/** Profil identité : 1 px = 1 unité (réel/px = 1). Échelle « brute ». */
export function identityScale(unit: ScaleUnit = 'mm'): ScaleProfile {
  return scaleFromRealPerPx(1, unit)
}

/**
 * Construit un profil à partir d'une densité directe (réel par pixel), comme le
 * champ `scale` du modèle de cotes. `realPerPx ≤ 0` ou non fini → 1.
 */
export function scaleFromRealPerPx(realPerPx: number, unit: ScaleUnit): ScaleProfile {
  const value = positiveOr(realPerPx, 1)
  return {
    unit,
    realPerPx: value,
    label: `1 px = ${roundNice(value)} ${SCALE_UNIT_LABELS[unit]}`,
  }
}

/**
 * Construit un profil à partir d'un ratio architectural 1:N.
 *
 * @param ratio        Dénominateur N (1:N). Doit être > 0 ; sinon ramené à 1.
 * @param unit         Unité réelle affichée.
 * @param pxPerDrawnUnit Nombre de pixels canvas représentant 1 `unit` à l'écran
 *                       (densité d'affichage du plan). Par défaut 1 (1 px = 1
 *                       unité dessinée). À 1:N, `realPerPx = N / pxPerDrawnUnit`.
 */
export function scaleFromRatio(
  ratio: number,
  unit: ScaleUnit,
  pxPerDrawnUnit = 1,
): ScaleProfile {
  const n = positiveOr(ratio, 1)
  const density = positiveOr(pxPerDrawnUnit, 1)
  return {
    unit,
    realPerPx: n / density,
    ratio: n,
    label: `1:${roundNice(n)}`,
  }
}

/** Arrondi « propre » pour les libellés (jusqu'à 4 décimales, sans zéros). */
function roundNice(n: number): number {
  return Math.round(n * 1e4) / 1e4
}

/**
 * Libellé court et propre de la densité d'un profil pour l'UI (B4 polish).
 * Évite d'afficher des flottants à rallonge (« 0.0010000001 ») : arrondi propre
 * + unité. Ex. `« 0.001 mm/px »`.
 */
export function formatRealPerPx(profile: ScaleProfile): string {
  return `${roundNice(profile.realPerPx)} ${SCALE_UNIT_LABELS[profile.unit]}/px`
}

// ─── Conversions page ↔ réel ─────────────────────────────────────────────────

/** Pixels canvas → longueur réelle (dans l'unité du profil). */
export function pageToReal(px: number, profile: ScaleProfile): number {
  if (!Number.isFinite(px)) return NaN
  return px * profile.realPerPx
}

/** Longueur réelle (unité du profil) → pixels canvas. */
export function realToPage(real: number, profile: ScaleProfile): number {
  if (!Number.isFinite(real)) return NaN
  return real / profile.realPerPx
}

/**
 * Pixels canvas → longueur réelle exprimée dans une unité cible arbitraire.
 * Pratique pour afficher en m une mesure prise sur un plan paramétré en mm.
 */
export function pageToRealInUnit(px: number, profile: ScaleProfile, target: ScaleUnit): number {
  return convertUnit(pageToReal(px, profile), profile.unit, target)
}

/** Longueur réelle (unité `source`) → pixels canvas via le profil. */
export function realInUnitToPage(real: number, source: ScaleUnit, profile: ScaleProfile): number {
  return realToPage(convertUnit(real, source, profile.unit), profile)
}

// ─── Presets d'échelles courantes (architecture / dessin technique) ──────────

/** Échelles architecturales usuelles (dénominateurs 1:N). */
export const COMMON_RATIO_DENOMINATORS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000] as const

/**
 * Presets prêts à l'emploi en mètres (cas le plus fréquent en plan archi).
 * Chaque preset suppose `pxPerDrawnUnit = 1` (densité d'affichage neutre).
 */
export function commonScalePresets(unit: ScaleUnit = 'm'): ScaleProfile[] {
  return COMMON_RATIO_DENOMINATORS.map((n) => scaleFromRatio(n, unit))
}

// ─── Mapping UI (B4) : deux modes de saisie → ScaleProfile ───────────────────

/**
 * Mode de saisie d'échelle exposé dans l'UI (DimensionDialog) :
 *  - `ratio`    : ratio architectural 1:N (sélecteur de preset).
 *  - `realPerPx`: densité directe « 1 px = K unités » (champ libre, modèle cote).
 */
export type ScaleInputMode = 'ratio' | 'realPerPx'

export interface ScaleInput {
  mode: ScaleInputMode
  /** Dénominateur 1:N (mode `ratio`). */
  ratio?: number | string
  /** Réel par pixel (mode `realPerPx`). */
  realPerPx?: number | string
  /** Unité réelle de référence. */
  unit: ScaleUnit
}

/** Parse une valeur numérique tolérante (virgule décimale, chaîne). */
function toNumber(v: number | string | undefined): number {
  if (typeof v === 'number') return v
  if (typeof v === 'string') return Number(v.replace(',', '.'))
  return NaN
}

/**
 * Construit un `ScaleProfile` à partir des entrées UI, quel que soit le mode.
 * Source de vérité unique pour le DimensionDialog : le `realPerPx` du profil
 * retourné est directement utilisable comme champ `scale` (réel/px) d'une cote.
 * Entrées invalides → repli sûr (realPerPx = 1) via les helpers existants.
 */
export function scaleFromInput(input: ScaleInput): ScaleProfile {
  if (input.mode === 'ratio') {
    return scaleFromRatio(toNumber(input.ratio), input.unit)
  }
  return scaleFromRealPerPx(toNumber(input.realPerPx), input.unit)
}
