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

/**
 * Champ personnalisé V2 (additif) : libellé + valeur libres rendus en bas du
 * cartouche, sous le bandeau principal. Permet d'ajouter Dessinateur, Phase,
 * Maître d'ouvrage, etc. sans figer le modèle.
 */
export interface TitleBlockCustomField {
  label: string
  value: string
}

/**
 * Ligne de révision V2 (additif) : suivi des indices de révision d'une planche
 * (indice, date, description). Rendue sur une ligne dédiée si présente.
 */
export interface TitleBlockRevision {
  /** Indice de révision (ex. « A », « 01 »). */
  indice: string
  /** Date de la révision (texte libre). */
  date: string
  /** Description courte de la modification. */
  description: string
}

/** Nombre maximal de champs personnalisés rendus (garde-fou de mise en page). */
export const MAX_CUSTOM_FIELDS = 4
/** Nombre maximal de lignes de révision rendues. */
export const MAX_REVISIONS = 4

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
  /** Champs personnalisés additionnels (V2). Vide par défaut. */
  customFields: TitleBlockCustomField[]
  /** Réserver une zone logo en tête de cartouche (V2). */
  logo: boolean
  /** Lignes de révision (V2). Vide par défaut. */
  revisions: TitleBlockRevision[]
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
  /** Champs personnalisés (V2). Les lignes entièrement vides sont ignorées. */
  customFields?: TitleBlockCustomField[]
  /** Réserver une zone logo (V2). */
  logo?: boolean
  /** Lignes de révision (V2). Les lignes entièrement vides sont ignorées. */
  revisions?: TitleBlockRevision[]
  now?: number
}

/**
 * Normalise des champs personnalisés : trim, suppression des lignes vides
 * (libellé ET valeur vides), plafonnement à `MAX_CUSTOM_FIELDS`.
 */
function normalizeCustomFields(fields: TitleBlockCustomField[] | undefined): TitleBlockCustomField[] {
  if (!Array.isArray(fields)) return []
  return fields
    .map((f) => ({ label: (f?.label ?? '').trim(), value: (f?.value ?? '').trim() }))
    .filter((f) => f.label !== '' || f.value !== '')
    .slice(0, MAX_CUSTOM_FIELDS)
}

/**
 * Normalise des lignes de révision : trim, suppression des lignes entièrement
 * vides, plafonnement à `MAX_REVISIONS`.
 */
function normalizeRevisions(revisions: TitleBlockRevision[] | undefined): TitleBlockRevision[] {
  if (!Array.isArray(revisions)) return []
  return revisions
    .map((r) => ({
      indice: (r?.indice ?? '').trim(),
      date: (r?.date ?? '').trim(),
      description: (r?.description ?? '').trim(),
    }))
    .filter((r) => r.indice !== '' || r.date !== '' || r.description !== '')
    .slice(0, MAX_REVISIONS)
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
    customFields: normalizeCustomFields(input.customFields),
    logo: input.logo === true,
    revisions: normalizeRevisions(input.revisions),
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

/** Zone logo placeholder (V2) : cadre pointillé + libellé « LOGO ». */
function logoZone(x: number, y: number, w: number, h: number, labelSize: number): string {
  const box =
    `<rect x="${round(x)}" y="${round(y)}" width="${round(w)}" height="${round(h)}" ` +
    `fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="3 2" opacity="0.55"/>`
  const txt =
    `<text x="${round(x + w / 2)}" y="${round(y + h / 2 + labelSize * 0.35)}" font-size="${round(labelSize)}" ` +
    `text-anchor="middle" fill="currentColor" stroke="none" opacity="0.55">LOGO</text>`
  return box + txt
}

/**
 * Rend une ligne sous le bandeau principal : libellé à gauche, valeur à droite,
 * séparée par un trait fin. Utilisée pour les champs personnalisés.
 */
function row(x: number, y: number, w: number, h: number, label: string, value: string, labelSize: number, valueSize: number): string {
  const pad = round(h * 0.22)
  const labW = round(Math.min(w * 0.4, 90))
  const sep =
    `<path d="M${round(x + labW)} ${round(y)} L${round(x + labW)} ${round(y + h)}" stroke="currentColor" stroke-width="0.75" fill="none" opacity="0.5"/>`
  const lab =
    `<text x="${round(x + pad)}" y="${round(y + h / 2 + labelSize * 0.35)}" font-size="${round(labelSize)}" ` +
    `fill="currentColor" stroke="none" opacity="0.65">${esc(label || '—')}</text>`
  const val =
    `<text x="${round(x + labW + pad)}" y="${round(y + h / 2 + valueSize * 0.35)}" font-size="${round(valueSize)}" ` +
    `fill="currentColor" stroke="none">${esc(value || '—')}</text>`
  return sep + lab + val
}

/**
 * Rend une ligne de révision (V2) : trois colonnes (indice / date / desc.) sous
 * le bandeau. La colonne description occupe l'espace restant.
 */
function revisionRow(x: number, y: number, w: number, h: number, rev: TitleBlockRevision, valueSize: number): string {
  const pad = round(h * 0.22)
  const c0 = round(w * 0.14)
  const c1 = round(w * 0.34)
  const cuts = [c0, c1]
  const sep = cuts
    .map((cx) => `<path d="M${round(x + cx)} ${round(y)} L${round(x + cx)} ${round(y + h)}" stroke="currentColor" stroke-width="0.75" fill="none" opacity="0.5"/>`)
    .join('')
  const ty = round(y + h / 2 + valueSize * 0.35)
  const t = (cx: number, s: string) =>
    `<text x="${round(x + cx + pad)}" y="${ty}" font-size="${round(valueSize)}" fill="currentColor" stroke="none">${esc(s || '—')}</text>`
  return sep + t(0, rev.indice) + t(c0, rev.date) + t(c1, rev.description)
}

/**
 * Rend un cartouche en corps SVG + dimensions du viewBox. Bandeau horizontal :
 * grande cellule « Projet » à gauche, puis trois cellules (Date, Échelle,
 * Feuille). Le format n'est qu'un libellé indicatif (estampillé dans le coin).
 *
 * V2 (additif) : une zone logo optionnelle est réservée à gauche de la cellule
 * projet ; les champs personnalisés et les lignes de révision sont empilés
 * sous le bandeau principal (le cartouche grandit vers le bas en conséquence).
 */
export function buildTitleBlockSvg(tb: TitleBlock): TitleBlockSvg {
  const width = titleBlockWidthPx(tb.format)
  const bandH = Math.round(Math.max(48, width * 0.16))
  const stroke = 1.5
  const valueSize = round(Math.max(9, bandH * 0.26))
  const labelSize = round(Math.max(6.5, bandH * 0.16))

  // Lignes additionnelles (V2) empilées sous le bandeau principal.
  const customFields = tb.customFields ?? []
  const revisions = tb.revisions ?? []
  const extraRowH = round(Math.max(16, bandH * 0.42))
  const extraCount = customFields.length + revisions.length
  const height = round(bandH + extraCount * extraRowH)

  // Répartition des colonnes : projet (large) + 3 champs égaux.
  const fieldW = round(width * 0.18)
  const projetW = round(width - fieldW * 3)

  const cols = [
    { x: 0, label: TITLE_BLOCK_FIELD_LABELS.projet, value: tb.fields.projet },
    { x: projetW, label: TITLE_BLOCK_FIELD_LABELS.date, value: tb.fields.date },
    { x: projetW + fieldW, label: TITLE_BLOCK_FIELD_LABELS.echelle, value: tb.fields.echelle },
    { x: projetW + fieldW * 2, label: TITLE_BLOCK_FIELD_LABELS.feuille, value: tb.fields.feuille },
  ]

  // Cadre extérieur (englobe les lignes additionnelles).
  const frame =
    `<rect x="${round(stroke / 2)}" y="${round(stroke / 2)}" width="${round(width - stroke)}" ` +
    `height="${round(height - stroke)}" fill="none" stroke="currentColor" stroke-width="${stroke}"/>`

  // Séparateurs verticaux entre colonnes (bandeau principal uniquement).
  const dividers = cols
    .slice(1)
    .map((c) => `<path d="M${round(c.x)} ${round(stroke)} L${round(c.x)} ${round(bandH - stroke)}" stroke="currentColor" stroke-width="1" fill="none"/>`)
    .join('')

  // Zone logo optionnelle : réservée dans le coin bas-gauche de la cellule projet.
  let logo = ''
  if (tb.logo) {
    const lw = round(Math.min(projetW * 0.32, bandH * 0.85))
    const lh = round(bandH * 0.6)
    logo = logoZone(round(stroke + 2), round(bandH - lh - 2), lw, lh, round(labelSize))
  }

  const cells = cols
    .map((c) => cell(c.x, 0, bandH, c.label, c.value, labelSize, valueSize))
    .join('')

  // Estampille du format dans le coin supérieur droit du projet (discret).
  const stamp =
    `<text x="${round(projetW - 4)}" y="${round(labelSize + 4)}" font-size="${round(labelSize)}" ` +
    `text-anchor="end" fill="currentColor" stroke="none" opacity="0.5">${esc(tb.format)}</text>`

  // Lignes additionnelles empilées : champs personnalisés puis révisions.
  let cy = bandH
  const extraSep: string[] = []
  const extraContent: string[] = []
  for (const f of customFields) {
    extraSep.push(`<path d="M${round(stroke)} ${round(cy)} L${round(width - stroke)} ${round(cy)}" stroke="currentColor" stroke-width="1" fill="none"/>`)
    extraContent.push(row(0, cy, width, extraRowH, f.label, f.value, labelSize, valueSize))
    cy = round(cy + extraRowH)
  }
  for (const r of revisions) {
    extraSep.push(`<path d="M${round(stroke)} ${round(cy)} L${round(width - stroke)} ${round(cy)}" stroke="currentColor" stroke-width="1" fill="none"/>`)
    extraContent.push(revisionRow(0, cy, width, extraRowH, r, valueSize))
    cy = round(cy + extraRowH)
  }

  const svgBody = frame + dividers + logo + cells + stamp + extraSep.join('') + extraContent.join('')
  return { svgBody, width, height }
}

/** Convertit un cartouche en DrawingBlock insérable (pipeline bloc existant). */
export function titleBlockToBlock(tb: TitleBlock): DrawingBlock {
  const { svgBody, width, height } = buildTitleBlockSvg(tb)
  const name = tb.fields.projet.trim() || 'Cartouche'
  const revCount = (tb.revisions ?? []).length
  const tags = ['cartouche', 'title-block', tb.format, name]
  if (tb.logo) tags.push('logo')
  if (revCount > 0) tags.push('révision')
  const descParts = [`Cartouche ${tb.format} : ${name}`]
  if (tb.fields.echelle) descParts.push(tb.fields.echelle)
  if (revCount > 0) descParts.push(`rév. ${revCount}`)
  return {
    id: `titleblock-${tb.id}`,
    name: `Cartouche ${tb.format} — ${name}`,
    category: 'annotations',
    unitSystem: 'metric',
    tags,
    description: descParts.join(' · '),
    defaultWidth: width,
    defaultHeight: height,
    svgBody,
    scaleLabel: tb.format,
  }
}
