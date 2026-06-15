/**
 * Bibliothèque de légendes architecture (V1).
 *
 * Une légende est un petit tableau vectoriel (titre + lignes « échantillon +
 * libellé ») insérable dans un dessin via le pipeline bloc existant, comme les
 * hachures/symboles/détails. V1 = légendes représentatives ; la génération
 * automatique à partir des ressources utilisées dans un carnet viendra ensuite.
 */
import { buildSearchText, type GraphicResource } from './resourceTypes'
import { resourceToBlock } from './resourceToBlock'
import type { DrawingBlock } from '../blocks/types'

export type LegendCategory = 'materiaux' | 'hachures' | 'symboles' | 'details' | 'annotations'

export const LEGEND_CATEGORY_LABELS: Record<LegendCategory, string> = {
  materiaux: 'Matériaux',
  hachures: 'Hachures',
  symboles: 'Symboles',
  details: 'Détails',
  annotations: 'Annotations',
}

export interface Legend {
  id: string
  name: string
  category: LegendCategory
  description: string
  tags: string[]
  svg: string
  width: number
  height: number
}

export const LEGEND_DISCLAIMER =
  'Légende type indicative — adapter les entrées et la convention graphique au projet et au bureau.'

const W = 220
const H = 150

/** Cadre + titre + séparateur commun aux légendes. */
function frame(title: string): string {
  return (
    `<rect x="4" y="4" width="${W - 8}" height="${H - 8}" rx="6"/>` +
    `<text x="14" y="24" font-size="12" fill="currentColor" stroke="none">${title}</text>` +
    `<path d="M12 32 H${W - 12}"/>`
  )
}

/** Ligne de légende : échantillon (24×16) + libellé. */
function row(y: number, sample: string, label: string): string {
  return (
    `<rect x="14" y="${y}" width="24" height="16"/>` +
    sample +
    `<text x="48" y="${y + 12}" font-size="11" fill="currentColor" stroke="none">${label}</text>`
  )
}

export const LEGENDS: Legend[] = [
  {
    id: 'leg-materiaux', name: 'Légende — Matériaux', category: 'materiaux',
    description: 'Tableau de légende des matériaux courants (béton, bois, acier, isolant).',
    tags: ['légende', 'matériaux', 'béton', 'bois', 'acier', 'isolant'],
    width: W, height: H,
    svg:
      frame('Légende — Matériaux') +
      row(42, '<g fill="currentColor" stroke="none"><circle cx="20" cy="48" r="1.2"/><circle cx="30" cy="52" r="1.2"/><circle cx="26" cy="46" r="1.2"/></g>', 'Béton') +
      row(68, '<path d="M14 84 L38 68" stroke-width="1"/>', 'Bois') +
      row(94, '<path d="M16 110 L26 94 M24 110 L34 94 M32 110 L38 102" stroke-width="1"/>', 'Acier') +
      row(120, '<path d="M14 128 q4 -6 8 0 t8 0 t8 0" stroke-width="1"/>', 'Isolant'),
  },
  {
    id: 'leg-hachures', name: 'Légende — Hachures', category: 'hachures',
    description: 'Tableau de légende des hachures (béton, terre, gravier, eau).',
    tags: ['légende', 'hachures', 'béton', 'terre', 'gravier', 'eau'],
    width: W, height: H,
    svg:
      frame('Légende — Hachures') +
      row(42, '<g fill="currentColor" stroke="none"><circle cx="20" cy="50" r="1.1"/><circle cx="30" cy="46" r="1.1"/></g><path d="M18 50 l4 4 m6 -2 l4 4" stroke-width="0.8"/>', 'Béton') +
      row(68, '<path d="M16 84 L24 68 M24 84 L32 68 M32 84 L38 72" stroke-width="0.8"/>', 'Terre') +
      row(94, '<g stroke-width="1"><circle cx="20" cy="102" r="3"/><circle cx="30" cy="104" r="2.4"/></g>', 'Gravier') +
      row(120, '<path d="M14 126 q4 -4 8 0 t8 0 t8 0 M14 132 q4 -4 8 0 t8 0 t8 0" stroke-width="0.9"/>', 'Eau'),
  },
  {
    id: 'leg-symboles', name: 'Légende — Symboles', category: 'symboles',
    description: 'Tableau de légende des symboles (nord, coupe, niveau).',
    tags: ['légende', 'symboles', 'nord', 'coupe', 'niveau'],
    width: W, height: H,
    svg:
      frame('Légende — Symboles') +
      row(42, '<path d="M26 56 V44" stroke-width="1.2"/><path d="M26 42 l3 6 l-3 -2 l-3 2 Z" fill="currentColor" stroke="none"/>', 'Flèche Nord') +
      row(68, '<circle cx="22" cy="76" r="6"/><text x="22" y="79" font-size="7" text-anchor="middle" fill="currentColor" stroke="none">A</text><path d="M28 76 H36" stroke-width="1"/>', 'Repère de coupe') +
      row(94, '<path d="M16 102 H36" stroke-width="1.2"/><path d="M26 102 l-4 6 h8 Z" fill="currentColor" stroke="none"/>', 'Niveau') +
      row(120, '<rect x="18" y="122" width="16" height="12"/><path d="M18 122 L34 134 M34 122 L18 134" stroke-width="0.8"/>', 'Luminaire'),
  },
  {
    id: 'leg-details', name: 'Légende — Détails', category: 'details',
    description: 'Tableau de légende des familles de détails constructifs.',
    tags: ['légende', 'détails', 'constructif', 'familles'],
    width: W, height: H,
    svg:
      frame('Légende — Détails') +
      row(42, '<rect x="18" y="44" width="16" height="12"/><path d="M18 50 H34" stroke-width="0.8"/>', 'Murs') +
      row(68, '<path d="M16 78 L26 68 L36 78" stroke-width="1.2"/>', 'Toitures') +
      row(94, '<path d="M16 100 H36 M16 104 H36" stroke-width="1.2"/>', 'Planchers') +
      row(120, '<path d="M20 134 H34 V124 H22 V134 Z" stroke-width="1"/>', 'Fondations'),
  },
  {
    id: 'leg-annotations', name: 'Légende — Annotations', category: 'annotations',
    description: 'Tableau de légende des annotations de chantier (révision, avertissement, validation).',
    tags: ['légende', 'annotations', 'révision', 'avertissement', 'validation'],
    width: W, height: H,
    svg:
      frame('Légende — Annotations') +
      row(42, '<path d="M26 44 L33 56 H19 Z" stroke-width="1"/><text x="26" y="54" font-size="7" text-anchor="middle" fill="currentColor" stroke="none">1</text>', 'Révision') +
      row(68, '<path d="M26 70 L33 82 H19 Z" stroke-width="1"/><path d="M26 74 V78" stroke-width="1.4"/><circle cx="26" cy="80" r="0.9" fill="currentColor" stroke="none"/>', 'Avertissement') +
      row(94, '<circle cx="26" cy="102" r="7"/><path d="M22 102 l3 3 l6 -6" stroke-width="1.4"/>', 'Validation') +
      row(120, '<circle cx="26" cy="128" r="7"/><text x="26" y="132" font-size="9" text-anchor="middle" fill="currentColor" stroke="none">?</text>', 'À vérifier'),
  },
]

const BY_ID = new Map(LEGENDS.map((l) => [l.id, l]))

export function getLegend(id: string): Legend | undefined {
  return BY_ID.get(id)
}

export function legendCategories(): LegendCategory[] {
  const seen = new Set<LegendCategory>()
  for (const l of LEGENDS) seen.add(l.category)
  return [...seen]
}

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

export function searchLegends(query: string, category?: LegendCategory | 'all'): Legend[] {
  let list = LEGENDS
  if (category && category !== 'all') list = list.filter((l) => l.category === category)
  const q = normalize(query)
  if (q === '') return list
  return list.filter((l) => {
    const hay = normalize([l.name, l.description, l.tags.join(' '), l.category, LEGEND_CATEGORY_LABELS[l.category]].join(' '))
    return hay.includes(q)
  })
}

/** Adapte une légende vers la forme commune `GraphicResource` (Resource Factory). */
export function legendToResource(legend: Legend): GraphicResource {
  return {
    id: legend.id,
    type: 'legend',
    name: legend.name,
    category: legend.category,
    categoryLabel: LEGEND_CATEGORY_LABELS[legend.category],
    description: legend.description,
    tags: legend.tags,
    svg: legend.svg,
    viewBox: `0 0 ${legend.width} ${legend.height}`,
    defaultWidth: legend.width,
    defaultHeight: legend.height,
    searchText: buildSearchText([legend.name, legend.description, legend.tags, legend.category, LEGEND_CATEGORY_LABELS[legend.category]]),
    insertable: true,
    disclaimer: LEGEND_DISCLAIMER,
    sourceType: 'svg-block',
    blockCategory: 'annotations',
    blockTagPrefix: 'légende',
  }
}

/** Résout une légende-bloc par id `legend-<legendId>` (insertion canvas). */
export function resolveLegendBlock(blockId: string): DrawingBlock | undefined {
  if (!blockId.startsWith('legend-')) return undefined
  const legend = getLegend(blockId.slice('legend-'.length))
  return legend ? resourceToBlock(legendToResource(legend)) : undefined
}

// ─── Génération automatique de légende ──────────────────────────────────────

function round(n: number, d = 2): number {
  const f = 10 ** d
  return Math.round(n * f) / f
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Rend l'échantillon d'une ressource, mis à l'échelle dans une cellule carrée. */
function renderSwatch(resource: GraphicResource, x: number, y: number, cell: number): string {
  const parts = resource.viewBox.split(/\s+/).map(Number)
  const vw = parts[2] || resource.defaultWidth || cell
  const vh = parts[3] || resource.defaultHeight || cell
  const s = cell / Math.max(vw, vh)
  const ox = x + (cell - vw * s) / 2
  const oy = y + (cell - vh * s) / 2
  return `<g transform="translate(${round(ox)},${round(oy)}) scale(${round(s, 3)})">${resource.svg}</g>`
}

const GEN_W = 240
const GEN_TITLE_H = 34
const GEN_ROW_H = 24
const GEN_CELL = 18
const GEN_MAX_ROWS = 18

/**
 * Génère une légende `GraphicResource` à partir de ressources (typiquement
 * celles utilisées dans un carnet). Chaque ligne montre l'échantillon réel de
 * la ressource et son nom. Insérable via le pipeline bloc existant.
 */
export function generateUsageLegend(
  resources: GraphicResource[],
  opts: { title?: string } = {},
): GraphicResource {
  const title = opts.title ?? 'Légende — ressources utilisées'
  const rows = resources.slice(0, GEN_MAX_ROWS)
  const extra = resources.length - rows.length
  const bodyRows = rows.length + (extra > 0 ? 1 : 0)
  const height = GEN_TITLE_H + Math.max(1, bodyRows) * GEN_ROW_H + 8

  let body =
    `<rect x="4" y="4" width="${GEN_W - 8}" height="${height - 8}" rx="6"/>` +
    `<text x="14" y="24" font-size="12" fill="currentColor" stroke="none">${escapeXml(title)}</text>` +
    `<path d="M12 ${GEN_TITLE_H - 2} H${GEN_W - 12}"/>`

  if (rows.length === 0) {
    body += `<text x="14" y="${GEN_TITLE_H + 18}" font-size="11" fill="currentColor" stroke="none">Aucune ressource détectée sur cette page.</text>`
  } else {
    rows.forEach((r, i) => {
      const rowY = GEN_TITLE_H + i * GEN_ROW_H
      body += renderSwatch(r, 14, rowY + (GEN_ROW_H - GEN_CELL) / 2, GEN_CELL)
      body += `<text x="${14 + GEN_CELL + 8}" y="${rowY + GEN_ROW_H / 2 + 4}" font-size="11" fill="currentColor" stroke="none">${escapeXml(r.name)}</text>`
    })
    if (extra > 0) {
      const rowY = GEN_TITLE_H + rows.length * GEN_ROW_H
      body += `<text x="14" y="${rowY + GEN_ROW_H / 2 + 4}" font-size="10" fill="currentColor" stroke="none">+ ${extra} autre(s)…</text>`
    }
  }

  const typeTags = [...new Set(resources.map((r) => r.type))]
  return {
    id: `auto-${Date.now()}`,
    type: 'legend',
    name: title,
    category: 'generee',
    categoryLabel: 'Générée',
    description: `Légende générée à partir de ${resources.length} ressource(s) utilisée(s).`,
    tags: ['légende', 'générée', ...typeTags],
    svg: body,
    viewBox: `0 0 ${GEN_W} ${height}`,
    defaultWidth: GEN_W,
    defaultHeight: height,
    searchText: '',
    insertable: true,
    disclaimer: LEGEND_DISCLAIMER,
    sourceType: 'svg-block',
    blockCategory: 'annotations',
    blockTagPrefix: 'légende',
  }
}
