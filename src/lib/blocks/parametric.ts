/**
 * Blocs paramétriques légers : génèrent un DrawingBlock à partir de quelques
 * dimensions saisies, dans l'unité courante. Pas un moteur CAD — juste de
 * quoi produire rectangle, porte, fenêtre, profil et axe à la bonne taille.
 *
 * Le bloc généré est inséré comme les autres (rasterisé → ImageElement).
 */
import type { DrawingBlock, DrawingBlockUnitSystem } from './types'

export type ParametricKind = 'rectangle' | 'door' | 'window' | 'beam' | 'grid'

export interface ParametricFieldDef {
  id: string
  label: string
  /** Valeur par défaut dans l'unité courante. */
  default: number
  min: number
  max: number
}

export interface ParametricDef {
  kind: ParametricKind
  name: string
  /** Champs numériques (dimensions) — l'unité s'affiche selon le système. */
  fields: ParametricFieldDef[]
  /** Champ texte optionnel (ex. label d'axe). */
  textField?: { id: string; label: string; default: string }
}

/** Définitions des blocs paramétriques disponibles. */
export const PARAMETRIC_DEFS: ParametricDef[] = [
  {
    kind: 'rectangle', name: 'Rectangle',
    fields: [
      { id: 'w', label: 'Largeur', default: 1000, min: 10, max: 20000 },
      { id: 'h', label: 'Hauteur', default: 600, min: 10, max: 20000 },
    ],
  },
  {
    kind: 'door', name: 'Porte',
    fields: [{ id: 'w', label: 'Largeur', default: 900, min: 400, max: 3000 }],
  },
  {
    kind: 'window', name: 'Fenêtre',
    fields: [{ id: 'w', label: 'Largeur', default: 1200, min: 300, max: 6000 }],
  },
  {
    kind: 'beam', name: 'Profil / poutre',
    fields: [
      { id: 'w', label: 'Largeur', default: 150, min: 20, max: 1000 },
      { id: 'h', label: 'Hauteur', default: 300, min: 20, max: 2000 },
    ],
  },
  {
    kind: 'grid', name: 'Axe / trame',
    fields: [],
    textField: { id: 'label', label: 'Repère', default: 'A' },
  },
]

/** Échelle dimension → pixels canvas, bornée pour rester insérable. */
function dimToPx(value: number, unit: DrawingBlockUnitSystem): number {
  // métrique : mm ; impérial : on saisit en pouces. Facteurs choisis pour
  // que les tailles usuelles tombent dans ~40–200 px.
  const raw = unit === 'metric' ? value * 0.08 : value * 2
  return Math.max(20, Math.min(240, Math.round(raw)))
}

function fmtDim(value: number, unit: DrawingBlockUnitSystem): string {
  return unit === 'metric' ? `${value} mm` : `${value}″`
}

/** Échappe le texte pour insertion sûre dans le SVG. */
function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Construit un DrawingBlock paramétrique. `values` contient les champs
 * numériques ; `text` le champ texte éventuel. Toujours valide (valeurs
 * bornées). L'id est stable par kind (param-<kind>) pour récents/insertion.
 */
export function buildParametricBlock(
  def: ParametricDef,
  unit: DrawingBlockUnitSystem,
  values: Record<string, number>,
  text = '',
): DrawingBlock {
  const get = (id: string, fallback: number) => {
    const f = def.fields.find((x) => x.id === id)
    const v = values[id]
    if (!f) return fallback
    if (!Number.isFinite(v)) return f.default
    return Math.max(f.min, Math.min(f.max, v))
  }

  const base = {
    id: `param-${def.kind}`,
    category: (def.kind === 'door' || def.kind === 'window'
      ? 'doors-windows'
      : def.kind === 'beam'
        ? 'steel'
        : def.kind === 'grid'
          ? 'symbols'
          : 'annotations') as DrawingBlock['category'],
    unitSystem: unit,
    tags: ['paramétrique', def.kind, def.name.toLowerCase()],
  }

  switch (def.kind) {
    case 'rectangle': {
      const w = get('w', 1000)
      const h = get('h', 600)
      const pw = dimToPx(w, unit)
      const ph = dimToPx(h, unit)
      return {
        ...base,
        name: `Rectangle ${w}×${h}`,
        scaleLabel: `${fmtDim(w, unit)} × ${fmtDim(h, unit)}`,
        defaultWidth: pw, defaultHeight: ph,
        svgBody: `<rect x="3" y="3" width="${pw - 6}" height="${ph - 6}"/>`,
      }
    }
    case 'door': {
      const w = get('w', 900)
      const s = dimToPx(w, unit)
      return {
        ...base,
        name: `Porte ${w}`,
        scaleLabel: fmtDim(w, unit),
        defaultWidth: s, defaultHeight: s,
        svgBody:
          `<path d="M6 ${s - 8} V6" stroke-width="3"/><path d="M6 6 H${s - 8}"/>` +
          `<path d="M${s - 8} 6 A${s - 14} ${s - 14} 0 0 1 6 ${s - 8}" stroke-dasharray="4 4"/>`,
      }
    }
    case 'window': {
      const w = get('w', 1200)
      const pw = dimToPx(w, unit)
      const ph = 28
      return {
        ...base,
        name: `Fenêtre ${w}`,
        scaleLabel: fmtDim(w, unit),
        defaultWidth: pw, defaultHeight: ph,
        svgBody: `<rect x="3" y="6" width="${pw - 6}" height="16"/><path d="M3 14 H${pw - 3} M${pw / 2} 6 V22"/>`,
      }
    }
    case 'beam': {
      const w = get('w', 150)
      const h = get('h', 300)
      const pw = dimToPx(w, unit)
      const ph = dimToPx(h, unit)
      return {
        ...base,
        name: `Profil ${w}×${h}`,
        scaleLabel: `${fmtDim(w, unit)} × ${fmtDim(h, unit)}`,
        defaultWidth: pw, defaultHeight: ph,
        svgBody: `<path d="M4 6 H${pw - 4} M4 ${ph - 6} H${pw - 4} M${pw / 2} 6 V${ph - 6}" stroke-width="3"/>`,
      }
    }
    case 'grid': {
      const label = (text || 'A').slice(0, 3)
      return {
        ...base,
        name: `Axe ${label}`,
        scaleLabel: label,
        defaultWidth: 44, defaultHeight: 60,
        svgBody:
          `<circle cx="22" cy="16" r="13"/>` +
          `<text x="22" y="21" font-size="13" text-anchor="middle" stroke="none" fill="#1f2937">${esc(label)}</text>` +
          `<path d="M22 29 V58" stroke-dasharray="5 4"/>`,
      }
    }
  }
}
