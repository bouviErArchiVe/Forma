/**
 * Cartouches de dessin (Pack B3 — cartouches V1).
 *
 * Même approche éprouvée que les cotes B1 (`src/lib/dimensions/dimensions.ts`)
 * et les annotations B2 : des fonctions PURES produisent un corps SVG, puis le
 * cartouche est converti en `DrawingBlock` (`titleBlockToBlock`) inséré via le
 * pipeline bloc existant (`blockToSvg` → raster → asset Dexie → ImageElement).
 * Il hérite ainsi du rendu, de la sélection, du déplacement, de la
 * sauvegarde/reload et de l'export — SANS modifier le canvas.
 *
 * Un cartouche est un bandeau de titre placé en bas d'une planche, avec les
 * champs usuels (projet, date, échelle, feuille). Formats ISO A4→A0.
 */
import type { DrawingBlock } from '../blocks/types'

export type SheetFormat = 'A4' | 'A3' | 'A2' | 'A1' | 'A0'

export const SHEET_FORMATS: SheetFormat[] = ['A4', 'A3', 'A2', 'A1', 'A0']

/** Dimensions ISO 216 (mm), orientation paysage (largeur × hauteur). */
export const SHEET_SIZES_MM: Record<SheetFormat, { width: number; height: number }> = {
  A4: { width: 297, height: 210 },
  A3: { width: 420, height: 297 },
  A2: { width: 594, height: 420 },
  A1: { width: 841, height: 594 },
  A0: { width: 1189, height: 841 },
}

export interface TitleBlockFields {
  /** Nom du projet. */
  projet: string
  /** Date (texte libre, ex. 2026-06-15). */
  date: string
  /** Échelle (ex. 1:100). */
  echelle: string
  /** Repère de feuille (ex. A-01). */
  feuille: string
}

export const DEFAULT_TITLE_BLOCK_FIELDS: TitleBlockFields = {
  projet: 'Projet',
  date: '',
  echelle: '1:100',
  feuille: '',
}

export const TITLE_BLOCK_FIELD_LABELS: Record<keyof TitleBlockFields, string> = {
  projet: 'Projet',
  date: 'Date',
  echelle: 'Échelle',
  feuille: 'Feuille',
}

export interface TitleBlock {
  id: string
  format: SheetFormat
  fields: TitleBlockFields
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

/**
 * Largeur du cartouche en px canvas pour un format donné. Proportionnelle à la
 * largeur de la feuille, bornée pour rester maniable sur le canvas Forma.
 */
export function titleBlockWidthPx(format: SheetFormat): number {
  const mm = SHEET_SIZES_MM[format].width
  // ~0.62 px/mm : A4 (297) ≈ 184, A0 (1189) ≈ 737. Borné [180, 740].
  return Math.round(Math.max(180, Math.min(740, mm * 0.62)))
}

export interface CreateTitleBlockInput {
  id?: string
  format: SheetFormat
  fields?: Partial<TitleBlockFields>
  now?: number
}

/** Construit un cartouche à partir d'entrées simples (format + champs). */
export function createTitleBlock(input: CreateTitleBlockInput): TitleBlock {
  const now = input.now ?? Date.now()
  const format: SheetFormat = SHEET_SIZES_MM[input.format] ? input.format : 'A4'
  const fields: TitleBlockFields = {
    projet: (input.fields?.projet ?? DEFAULT_TITLE_BLOCK_FIELDS.projet).trim() || DEFAULT_TITLE_BLOCK_FIELDS.projet,
    date: (input.fields?.date ?? DEFAULT_TITLE_BLOCK_FIELDS.date).trim(),
    echelle: (input.fields?.echelle ?? DEFAULT_TITLE_BLOCK_FIELDS.echelle).trim(),
    feuille: (input.fields?.feuille ?? DEFAULT_TITLE_BLOCK_FIELDS.feuille).trim(),
  }
  return {
    id: input.id ?? `tb-${now}`,
    format,
    fields,
    createdAt: now,
    updatedAt: now,
  }
}

// ─── Rendu SVG ───────────────────────────────────────────────────────────────

/** Cellule libellé + valeur dans le cartouche (cadre/colonnes gérés à part). */
function cell(
  x: number,
  y: number,
  h: number,
  label: string,
  value: string,
  labelSize: number,
  valueSize: number,
): string {
  const pad = round(h * 0.16)
  const lab =
    `<text x="${round(x + pad)}" y="${round(y + pad + labelSize)}" font-size="${round(labelSize)}" ` +
    `fill="currentColor" stroke="none" opacity="0.65">${esc(label)}</text>`
  const val =
    `<text x="${round(x + pad)}" y="${round(y + h - pad)}" font-size="${round(valueSize)}" ` +
    `fill="currentColor" stroke="none">${esc(value || '—')}</text>`
  return lab + val
}

export interface TitleBlockSvg {
  svgBody: string
  width: number
  height: number
}

/**
 * Rend un cartouche en corps SVG + dimensions du viewBox. Bandeau horizontal :
 * grande cellule « Projet » à gauche, puis trois cellules (Date, Échelle,
 * Feuille). Le format n'est qu'un libellé indicatif (estampillé dans le coin).
 */
export function buildTitleBlockSvg(tb: TitleBlock): TitleBlockSvg {
  const width = titleBlockWidthPx(tb.format)
  const height = Math.round(Math.max(48, width * 0.16))
  const stroke = 1.5
  const valueSize = round(Math.max(9, height * 0.26))
  const labelSize = round(Math.max(6.5, height * 0.16))

  // Répartition des colonnes : projet (large) + 3 champs égaux.
  const fieldW = round(width * 0.18)
  const projetW = round(width - fieldW * 3)

  const cols = [
    { x: 0, label: TITLE_BLOCK_FIELD_LABELS.projet, value: tb.fields.projet },
    { x: projetW, label: TITLE_BLOCK_FIELD_LABELS.date, value: tb.fields.date },
    { x: projetW + fieldW, label: TITLE_BLOCK_FIELD_LABELS.echelle, value: tb.fields.echelle },
    { x: projetW + fieldW * 2, label: TITLE_BLOCK_FIELD_LABELS.feuille, value: tb.fields.feuille },
  ]

  // Cadre extérieur.
  const frame =
    `<rect x="${round(stroke / 2)}" y="${round(stroke / 2)}" width="${round(width - stroke)}" ` +
    `height="${round(height - stroke)}" fill="none" stroke="currentColor" stroke-width="${stroke}"/>`

  // Séparateurs verticaux entre colonnes.
  const dividers = cols
    .slice(1)
    .map((c) => `<path d="M${round(c.x)} ${round(stroke)} L${round(c.x)} ${round(height - stroke)}" stroke="currentColor" stroke-width="1" fill="none"/>`)
    .join('')

  const cells = cols
    .map((c) => cell(c.x, 0, height, c.label, c.value, labelSize, valueSize))
    .join('')

  // Estampille du format dans le coin supérieur droit du projet (discret).
  const stamp =
    `<text x="${round(projetW - 4)}" y="${round(labelSize + 4)}" font-size="${round(labelSize)}" ` +
    `text-anchor="end" fill="currentColor" stroke="none" opacity="0.5">${esc(tb.format)}</text>`

  return { svgBody: frame + dividers + cells + stamp, width, height }
}

/** Convertit un cartouche en DrawingBlock insérable (pipeline bloc existant). */
export function titleBlockToBlock(tb: TitleBlock): DrawingBlock {
  const { svgBody, width, height } = buildTitleBlockSvg(tb)
  const name = tb.fields.projet.trim() || 'Cartouche'
  return {
    id: `titleblock-${tb.id}`,
    name: `Cartouche ${tb.format} — ${name}`,
    category: 'annotations',
    unitSystem: 'metric',
    tags: ['cartouche', 'title-block', tb.format, name],
    description: `Cartouche ${tb.format} : ${name}${tb.fields.echelle ? ` · ${tb.fields.echelle}` : ''}`,
    defaultWidth: width,
    defaultHeight: height,
    svgBody,
    scaleLabel: tb.format,
  }
}
