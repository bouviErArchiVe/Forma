/**
 * Cotes techniques (Pack B1 — fondation).
 *
 * Approche la moins risquée : une cote est calculée par des fonctions PURES
 * puis rendue en SVG, et insérée comme un bloc (`dimensionToBlock` →
 * raster → asset Dexie → ImageElement). Elle hérite ainsi du rendu, de la
 * sélection, du déplacement, de la sauvegarde/reload et de l'export — SANS
 * modifier le canvas. Une future itération pourra rendre les cotes « vivantes ».
 */
import type { DrawingBlock } from '../blocks/types'

export type DimensionType = 'horizontal' | 'vertical' | 'aligned'
export type DimensionUnit = 'mm' | 'cm' | 'm' | 'in' | 'ft'

export const DIMENSION_TYPE_LABELS: Record<DimensionType, string> = {
  horizontal: 'Cote horizontale',
  vertical: 'Cote verticale',
  aligned: 'Cote alignée',
}

export const DIMENSION_UNIT_LABELS: Record<DimensionUnit, string> = {
  mm: 'mm', cm: 'cm', m: 'm', in: 'po', ft: 'pi',
}

export interface Point {
  x: number
  y: number
}

export interface DimensionStyle {
  /** Embouts : flèches ou ticks obliques. */
  ends: 'arrows' | 'ticks'
  /** Couleur (currentColor pour s'adapter au thème). */
  color: string
}

export const DEFAULT_DIMENSION_STYLE: DimensionStyle = { ends: 'arrows', color: 'currentColor' }

export interface Dimension {
  id: string
  type: DimensionType
  start: Point
  end: Point
  /** Libellé affiché (généré si absent). */
  text: string
  unit: DimensionUnit
  /** Unités réelles par pixel canvas (conversion px → réel). */
  scale: number
  /** Longueur mesurée en pixels (entre start et end). */
  measuredLength: number
  /** Longueur réelle affichée (measuredLength × scale, dans `unit`). */
  displayLength: number
  style: DimensionStyle
  createdAt: number
  updatedAt: number
}

// ─── Fonctions pures ─────────────────────────────────────────────────────────

/** Distance euclidienne entre deux points (px). */
export function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

/** Conversion px → unité réelle via l'échelle (réel/px). */
export function pxToReal(px: number, scale: number): number {
  return px * scale
}

/** Angle (radians) du segment a→b. */
export function angleOf(a: Point, b: Point): number {
  return Math.atan2(b.y - a.y, b.x - a.x)
}

/** Milieu d'un segment. */
export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

function round(n: number, d = 2): number {
  const f = 10 ** d
  return Math.round(n * f) / f
}

/**
 * Formate une longueur réelle dans l'unité donnée. Métrique : décimales
 * adaptées (mm entier, cm/m à 2 décimales). Impérial : pouces/pieds simples.
 */
export function formatLength(value: number, unit: DimensionUnit): string {
  if (!Number.isFinite(value)) return '—'
  switch (unit) {
    case 'mm':
      return `${Math.round(value)} mm`
    case 'cm':
      return `${round(value, 1)} cm`
    case 'm':
      return `${round(value, 2)} m`
    case 'in':
      return `${round(value, 2)}″`
    case 'ft': {
      const ft = Math.floor(value)
      const inch = Math.round((value - ft) * 12)
      return inch === 0 ? `${ft}′` : `${ft}′ ${inch}″`
    }
  }
}

export interface CreateDimensionInput {
  id?: string
  type: DimensionType
  /** Longueur à l'écran (px) entre les deux extrémités. */
  lengthPx: number
  /** Angle en degrés pour le type « aligned » (0 = horizontal). */
  angleDeg?: number
  unit: DimensionUnit
  /** Unités réelles par pixel (réel/px). 1 par défaut. */
  scale?: number
  /** Libellé personnalisé (sinon généré depuis la longueur réelle). */
  text?: string
  style?: Partial<DimensionStyle>
  now?: number
}

/** Construit une cote à partir d'entrées simples (longueur + type + unité + échelle). */
export function createDimension(input: CreateDimensionInput): Dimension {
  const now = input.now ?? Date.now()
  const lengthPx = Number.isFinite(input.lengthPx) && input.lengthPx > 0 ? input.lengthPx : 0
  const scale = Number.isFinite(input.scale) && (input.scale as number) > 0 ? (input.scale as number) : 1
  const angle =
    input.type === 'vertical' ? 90 : input.type === 'horizontal' ? 0 : (input.angleDeg ?? 0)
  const rad = (angle * Math.PI) / 180
  const start: Point = { x: 0, y: 0 }
  const end: Point = { x: round(lengthPx * Math.cos(rad)), y: round(lengthPx * Math.sin(rad)) }
  const measuredLength = distance(start, end)
  const displayLength = pxToReal(measuredLength, scale)
  const text = input.text && input.text.trim() !== '' ? input.text.trim() : formatLength(displayLength, input.unit)
  return {
    id: input.id ?? `dim-${now}`,
    type: input.type,
    start,
    end,
    text,
    unit: input.unit,
    scale,
    measuredLength: round(measuredLength),
    displayLength: round(displayLength),
    style: { ...DEFAULT_DIMENSION_STYLE, ...input.style },
    createdAt: now,
    updatedAt: now,
  }
}

// ─── Rendu SVG ───────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Embout de cote (flèche ou tick) au point p, orienté selon l'angle `a` (rad). */
function endMark(p: Point, a: number, kind: DimensionStyle['ends']): string {
  if (kind === 'ticks') {
    // Tick oblique à 45° par rapport à la ligne.
    const t = a + Math.PI / 4
    const dx = 5 * Math.cos(t)
    const dy = 5 * Math.sin(t)
    return `<path d="M${round(p.x - dx)} ${round(p.y - dy)} L${round(p.x + dx)} ${round(p.y + dy)}" stroke-width="1.4"/>`
  }
  // Flèche pleine pointant vers l'extérieur (direction a).
  const len = 7
  const spread = 0.35
  const x1 = p.x - len * Math.cos(a - spread)
  const y1 = p.y - len * Math.sin(a - spread)
  const x2 = p.x - len * Math.cos(a + spread)
  const y2 = p.y - len * Math.sin(a + spread)
  return `<path d="M${round(p.x)} ${round(p.y)} L${round(x1)} ${round(y1)} L${round(x2)} ${round(y2)} Z" fill="currentColor" stroke="none"/>`
}

export interface DimensionSvg {
  svgBody: string
  width: number
  height: number
}

/**
 * Rend une cote en corps SVG + dimensions du viewBox. La géométrie est
 * translatée dans une boîte avec marge (texte + embouts lisibles).
 */
export function buildDimensionSvg(dim: Dimension): DimensionSvg {
  const pad = 22
  const minX = Math.min(dim.start.x, dim.end.x)
  const minY = Math.min(dim.start.y, dim.end.y)
  const spanX = Math.abs(dim.end.x - dim.start.x)
  const spanY = Math.abs(dim.end.y - dim.start.y)
  const width = Math.max(48, spanX + pad * 2)
  const height = Math.max(40, spanY + pad * 2)

  // Translation des points dans la boîte.
  const a: Point = { x: dim.start.x - minX + pad, y: dim.start.y - minY + pad }
  const b: Point = { x: dim.end.x - minX + pad, y: dim.end.y - minY + pad }
  const ang = angleOf(a, b)
  const mid = midpoint(a, b)

  // Décalage perpendiculaire du texte (au-dessus de la ligne).
  const off = 9
  const tx = mid.x - off * Math.sin(ang) * -1
  const ty = mid.y + off * Math.cos(ang) * -1

  const line = `<path d="M${round(a.x)} ${round(a.y)} L${round(b.x)} ${round(b.y)}" stroke-width="1.4"/>`
  const marks = endMark(a, ang + Math.PI, dim.style.ends) + endMark(b, ang, dim.style.ends)
  const label =
    `<text x="${round(tx)}" y="${round(ty)}" font-size="11" text-anchor="middle" ` +
    `dominant-baseline="middle" fill="currentColor" stroke="none">${esc(dim.text)}</text>`

  return { svgBody: line + marks + label, width: Math.round(width), height: Math.round(height) }
}

/** Convertit une cote en DrawingBlock insérable (pipeline bloc existant). */
export function dimensionToBlock(dim: Dimension): DrawingBlock {
  const { svgBody, width, height } = buildDimensionSvg(dim)
  return {
    id: `dimension-${dim.id}`,
    name: `${DIMENSION_TYPE_LABELS[dim.type]} ${dim.text}`,
    category: 'annotations',
    unitSystem: 'metric',
    tags: ['cote', 'dimension', dim.type, dim.unit],
    description: `${DIMENSION_TYPE_LABELS[dim.type]} — ${dim.text}`,
    defaultWidth: width,
    defaultHeight: height,
    svgBody,
  }
}
