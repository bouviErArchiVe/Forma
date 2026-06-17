/**
 * Légende de dessin (Pack B6 — légende V1).
 *
 * Même approche éprouvée que les cotes B1 (`src/lib/dimensions/dimensions.ts`),
 * les annotations B2 et les cartouches B3 : des fonctions PURES produisent un
 * corps SVG, puis la légende est convertie en `DrawingBlock` (`legendToBlock`)
 * inséré via le pipeline bloc existant (`blockToSvg` → raster → asset Dexie →
 * ImageElement). Elle hérite ainsi du rendu, de la sélection, du déplacement,
 * de la sauvegarde/reload et de l'export — SANS modifier le canvas.
 *
 * Une légende de dessin est un petit cartel : une ligne d'échelle (réutilise le
 * `ScaleProfile` de B4) suivie d'une liste de clés (pastille couleur + libellé).
 */
import type { DrawingBlock } from '../blocks/types'
import type { ScaleProfile } from './scale'

/** Une entrée de la clé : pastille colorée + libellé. */
export interface LegendKeyEntry {
  /** Libellé lisible (ex. « Mur porteur », « Cloison »). */
  label: string
  /** Couleur de la pastille (CSS). `currentColor` par défaut si vide. */
  color?: string
}

export interface Legend {
  id: string
  /** Titre du cartel (ex. « Légende »). */
  title: string
  /** Profil d'échelle à afficher (B4). `undefined` = pas de ligne d'échelle. */
  scale?: ScaleProfile
  /** Entrées de la clé (peut être vide). */
  entries: LegendKeyEntry[]
  createdAt: number
  updatedAt: number
}

// ─── Fonctions pures ─────────────────────────────────────────────────────────

function round(n: number, d = 2): number {
  const f = 10 ** d
  return Math.round(n * f) / f
}

/** Échappe le texte pour une insertion sûre dans le SVG. */
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Valide une couleur CSS simple (hex, rgb(), ou mot-clé). Sinon `currentColor`. */
function safeColor(c: string | undefined): string {
  if (!c) return 'currentColor'
  const t = c.trim()
  if (/^#[0-9a-fA-F]{3,8}$/.test(t)) return t
  if (/^rgba?\([\d.,\s%]+\)$/.test(t)) return t
  if (/^[a-zA-Z]+$/.test(t)) return t
  return 'currentColor'
}

export interface CreateLegendInput {
  id?: string
  title?: string
  scale?: ScaleProfile
  entries?: LegendKeyEntry[]
  now?: number
}

/** Construit une légende à partir d'entrées simples (titre + échelle + clés). */
export function createLegend(input: CreateLegendInput): Legend {
  const now = input.now ?? Date.now()
  const title = (input.title ?? 'Légende').trim() || 'Légende'
  const entries = (input.entries ?? [])
    .map((e) => ({ label: (e.label ?? '').trim(), color: e.color }))
    .filter((e) => e.label !== '')
  return {
    id: input.id ?? `legend-${now}`,
    title,
    scale: input.scale,
    entries,
    createdAt: now,
    updatedAt: now,
  }
}

export interface LegendSvg {
  svgBody: string
  width: number
  height: number
}

const LEGEND_WIDTH = 220
const PAD = 12
const TITLE_SIZE = 13
const ROW_SIZE = 11
const ROW_H = 20
const SWATCH = 11

/**
 * Rend une légende en corps SVG + dimensions du viewBox. Cadre extérieur, titre,
 * ligne d'échelle optionnelle (label du `ScaleProfile`), puis une ligne par clé
 * (pastille + libellé). Hauteur calculée pour contenir toutes les lignes.
 */
export function buildLegendSvg(legend: Legend): LegendSvg {
  const width = LEGEND_WIDTH
  const stroke = 1.5

  let y = PAD

  // Titre.
  const title =
    `<text x="${PAD}" y="${round(y + TITLE_SIZE)}" font-size="${TITLE_SIZE}" ` +
    `font-weight="600" fill="currentColor" stroke="none">${esc(legend.title)}</text>`
  y += TITLE_SIZE + 8

  // Ligne d'échelle (réutilise le label du ScaleProfile B4).
  let scaleLine = ''
  if (legend.scale) {
    scaleLine =
      `<text x="${PAD}" y="${round(y + ROW_SIZE)}" font-size="${ROW_SIZE}" ` +
      `fill="currentColor" stroke="none" opacity="0.7">${esc(`Échelle ${legend.scale.label}`)}</text>`
    y += ROW_H
  }

  // Entrées de la clé : pastille + libellé.
  const rows = legend.entries
    .map((e) => {
      const cy = round(y + ROW_H / 2)
      const swatch =
        `<rect x="${PAD}" y="${round(cy - SWATCH / 2)}" width="${SWATCH}" height="${SWATCH}" rx="2" ` +
        `fill="${safeColor(e.color)}" stroke="currentColor" stroke-width="1"/>`
      const label =
        `<text x="${PAD + SWATCH + 8}" y="${round(cy)}" font-size="${ROW_SIZE}" ` +
        `dominant-baseline="middle" fill="currentColor" stroke="none">${esc(e.label)}</text>`
      y += ROW_H
      return swatch + label
    })
    .join('')

  const height = Math.round(y + PAD)

  // Cadre extérieur (dessiné en dernier pour la dimension finale).
  const frame =
    `<rect x="${round(stroke / 2)}" y="${round(stroke / 2)}" width="${round(width - stroke)}" ` +
    `height="${round(height - stroke)}" fill="none" stroke="currentColor" stroke-width="${stroke}"/>`

  return { svgBody: frame + title + scaleLine + rows, width, height }
}

/** Convertit une légende en DrawingBlock insérable (pipeline bloc existant). */
export function legendToBlock(legend: Legend): DrawingBlock {
  const { svgBody, width, height } = buildLegendSvg(legend)
  return {
    id: `drawing-legend-${legend.id}`,
    name: `Légende — ${legend.title}`,
    category: 'annotations',
    unitSystem: 'metric',
    tags: ['légende', 'legend', 'dessin', ...(legend.scale ? ['échelle'] : [])],
    description: `Légende${legend.scale ? ` · ${legend.scale.label}` : ''} · ${legend.entries.length} clé(s)`,
    defaultWidth: width,
    defaultHeight: height,
    svgBody,
    scaleLabel: legend.scale?.label,
  }
}
