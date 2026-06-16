/**
 * Annotations de dessin (Pack B2 — annotations simples).
 *
 * Même approche éprouvée que les cotes B1 (`src/lib/dimensions/dimensions.ts`) :
 * des fonctions PURES calculent la géométrie, produisent un corps SVG, puis
 * l'annotation est convertie en `DrawingBlock` (`annotationToBlock`) inséré via
 * le pipeline bloc existant (`blockToSvg` → raster → asset Dexie → ImageElement).
 * Elle hérite ainsi du rendu, de la sélection, du déplacement, de la
 * sauvegarde/reload et de l'export — SANS modifier le canvas.
 *
 * Trois types V1 : étiquette texte simple, callout encadré, et note avec ligne
 * de rappel (leader) + flèche.
 */
import type { DrawingBlock } from '../blocks/types'

export type AnnotationType = 'label' | 'callout' | 'leader'

export const ANNOTATION_TYPE_LABELS: Record<AnnotationType, string> = {
  label: 'Étiquette',
  callout: 'Callout encadré',
  leader: 'Note avec rappel',
}

/** Direction de la ligne de rappel pour le type « leader ». */
export type LeaderDirection = 'left' | 'right' | 'up' | 'down'

export const LEADER_DIRECTION_LABELS: Record<LeaderDirection, string> = {
  left: 'Gauche',
  right: 'Droite',
  up: 'Haut',
  down: 'Bas',
}

export interface AnnotationStyle {
  /** Taille de police (px). */
  fontSize: number
  /** Couleur (currentColor pour s'adapter au thème). */
  color: string
}

export const DEFAULT_ANNOTATION_STYLE: AnnotationStyle = { fontSize: 13, color: 'currentColor' }

export interface Annotation {
  id: string
  type: AnnotationType
  /** Texte affiché (peut contenir plusieurs lignes via \n). */
  text: string
  /** Longueur de la ligne de rappel en px (type « leader » uniquement). */
  leaderLength: number
  /** Direction de la ligne de rappel (type « leader » uniquement). */
  leaderDirection: LeaderDirection
  style: AnnotationStyle
  createdAt: number
  updatedAt: number
}

// ─── Fonctions pures ─────────────────────────────────────────────────────────

function round(n: number, d = 2): number {
  const f = 10 ** d
  return Math.round(n * f) / f
}

/** Découpe le texte en lignes (gère \n et \r\n) ; vide → une ligne vide. */
export function textLines(text: string): string[] {
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  return lines.length ? lines : ['']
}

/**
 * Largeur approximative d'une chaîne en px pour une police donnée. Heuristique
 * monospace-ish (0.6 × fontSize par caractère) — suffisante pour dimensionner la
 * boîte de l'annotation sans mesurer le DOM (rendu pur/testable).
 */
export function approxTextWidth(text: string, fontSize: number): number {
  const longest = textLines(text).reduce((m, l) => Math.max(m, l.length), 0)
  return Math.ceil(longest * fontSize * 0.6)
}

export interface CreateAnnotationInput {
  id?: string
  type: AnnotationType
  text: string
  leaderLength?: number
  leaderDirection?: LeaderDirection
  style?: Partial<AnnotationStyle>
  now?: number
}

/** Construit une annotation à partir d'entrées simples (texte + type + style). */
export function createAnnotation(input: CreateAnnotationInput): Annotation {
  const now = input.now ?? Date.now()
  const rawSize = input.style?.fontSize
  const fontSize = Number.isFinite(rawSize) && (rawSize as number) > 0 ? (rawSize as number) : DEFAULT_ANNOTATION_STYLE.fontSize
  const rawLeader = input.leaderLength
  const leaderLength = Number.isFinite(rawLeader) && (rawLeader as number) > 0 ? (rawLeader as number) : 48
  const text = typeof input.text === 'string' ? input.text : ''
  return {
    id: input.id ?? `ann-${now}`,
    type: input.type,
    text,
    leaderLength: round(leaderLength),
    leaderDirection: input.leaderDirection ?? 'left',
    style: { ...DEFAULT_ANNOTATION_STYLE, ...input.style, fontSize },
    createdAt: now,
    updatedAt: now,
  }
}

// ─── Rendu SVG ───────────────────────────────────────────────────────────────

/** Échappe le texte pour une insertion sûre dans le SVG. */
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Bloc <text> multi-lignes ancré en (x, y), première ligne sur la baseline y. */
function textTspans(text: string, x: number, y: number, fontSize: number, anchor: 'start' | 'middle'): string {
  const lines = textLines(text)
  const lineHeight = round(fontSize * 1.3)
  const tspans = lines
    .map((l, i) => `<tspan x="${round(x)}" dy="${i === 0 ? 0 : lineHeight}">${esc(l)}</tspan>`)
    .join('')
  return (
    `<text x="${round(x)}" y="${round(y)}" font-size="${fontSize}" text-anchor="${anchor}" ` +
    `fill="currentColor" stroke="none">${tspans}</text>`
  )
}

export interface AnnotationSvg {
  svgBody: string
  width: number
  height: number
}

/**
 * Rend une annotation en corps SVG + dimensions du viewBox. La géométrie est
 * calculée de façon déterministe (largeur approximée du texte), avec marges
 * pour la lisibilité (texte, cadre, ligne de rappel).
 */
export function buildAnnotationSvg(ann: Annotation): AnnotationSvg {
  const fs = ann.style.fontSize
  const lines = textLines(ann.text)
  const lineHeight = round(fs * 1.3)
  const textW = Math.max(approxTextWidth(ann.text, fs), fs * 2)
  const textH = lines.length * lineHeight

  if (ann.type === 'label') {
    // Texte nu, sans cadre. Boîte ajustée avec une petite marge.
    const pad = 6
    const width = Math.max(24, textW + pad * 2)
    const height = Math.max(fs + pad * 2, textH + pad * 2)
    const baseline = pad + fs
    const body = textTspans(ann.text, pad, baseline, fs, 'start')
    return { svgBody: body, width: Math.round(width), height: Math.round(height) }
  }

  if (ann.type === 'callout') {
    // Texte dans un rectangle arrondi.
    const padX = 10
    const padY = 8
    const boxW = Math.max(40, textW + padX * 2)
    const boxH = Math.max(fs + padY * 2, textH + padY * 2)
    const stroke = 1.4
    const width = boxW + stroke * 2
    const height = boxH + stroke * 2
    const x = stroke
    const y = stroke
    const rect =
      `<rect x="${round(x)}" y="${round(y)}" width="${round(boxW)}" height="${round(boxH)}" ` +
      `rx="6" ry="6" fill="none" stroke="currentColor" stroke-width="${stroke}"/>`
    const baseline = y + padY + fs
    const body = textTspans(ann.text, x + padX, baseline, fs, 'start')
    return { svgBody: rect + body, width: Math.round(width), height: Math.round(height) }
  }

  // type === 'leader' : ligne de rappel + flèche pointant vers la cible, texte
  // encadré à l'autre extrémité.
  const padX = 9
  const padY = 7
  const boxW = Math.max(40, textW + padX * 2)
  const boxH = Math.max(fs + padY * 2, textH + padY * 2)
  const leader = ann.leaderLength
  const margin = 12 // place pour la flèche

  const horizontal = ann.leaderDirection === 'left' || ann.leaderDirection === 'right'
  const width = Math.round(boxW + (horizontal ? leader + margin : margin * 2) + 4)
  const height = Math.round(boxH + (horizontal ? margin * 2 : leader + margin) + 4)

  // Position de la boîte + point de départ/fin de la ligne selon la direction.
  let boxX = 0
  let boxY = 0
  let lineStart = { x: 0, y: 0 } // accroché au bord de la boîte
  let target = { x: 0, y: 0 } // pointe de la flèche
  switch (ann.leaderDirection) {
    case 'left':
      // boîte à droite, cible à gauche
      boxX = leader + margin
      boxY = margin
      lineStart = { x: boxX, y: boxY + boxH / 2 }
      target = { x: margin, y: boxY + boxH / 2 }
      break
    case 'right':
      boxX = margin
      boxY = margin
      lineStart = { x: boxX + boxW, y: boxY + boxH / 2 }
      target = { x: boxX + boxW + leader, y: boxY + boxH / 2 }
      break
    case 'up':
      boxX = margin
      boxY = leader + margin
      lineStart = { x: boxX + boxW / 2, y: boxY }
      target = { x: boxX + boxW / 2, y: margin }
      break
    case 'down':
      boxX = margin
      boxY = margin
      lineStart = { x: boxX + boxW / 2, y: boxY + boxH }
      target = { x: boxX + boxW / 2, y: boxY + boxH + leader }
      break
  }

  const rect =
    `<rect x="${round(boxX)}" y="${round(boxY)}" width="${round(boxW)}" height="${round(boxH)}" ` +
    `rx="6" ry="6" fill="none" stroke="currentColor" stroke-width="1.4"/>`
  const line = `<path d="M${round(lineStart.x)} ${round(lineStart.y)} L${round(target.x)} ${round(target.y)}" stroke="currentColor" stroke-width="1.4" fill="none"/>`
  // Flèche pleine au point cible, orientée le long de la ligne.
  const ang = Math.atan2(target.y - lineStart.y, target.x - lineStart.x)
  const len = 8
  const spread = 0.4
  const ax1 = target.x - len * Math.cos(ang - spread)
  const ay1 = target.y - len * Math.sin(ang - spread)
  const ax2 = target.x - len * Math.cos(ang + spread)
  const ay2 = target.y - len * Math.sin(ang + spread)
  const arrow = `<path d="M${round(target.x)} ${round(target.y)} L${round(ax1)} ${round(ay1)} L${round(ax2)} ${round(ay2)} Z" fill="currentColor" stroke="none"/>`
  const baseline = boxY + padY + fs
  const body = textTspans(ann.text, boxX + padX, baseline, fs, 'start')

  return { svgBody: rect + line + arrow + body, width, height }
}

/** Libellé court pour le nom du bloc (première ligne, tronquée). */
function shortLabel(text: string): string {
  const first = textLines(text)[0]?.trim() ?? ''
  if (first === '') return 'annotation'
  return first.length > 24 ? `${first.slice(0, 24)}…` : first
}

/** Convertit une annotation en DrawingBlock insérable (pipeline bloc existant). */
export function annotationToBlock(ann: Annotation): DrawingBlock {
  const { svgBody, width, height } = buildAnnotationSvg(ann)
  const label = shortLabel(ann.text)
  return {
    id: `annotation-${ann.id}`,
    name: `${ANNOTATION_TYPE_LABELS[ann.type]} — ${label}`,
    category: 'annotations',
    unitSystem: 'metric',
    tags: ['annotation', 'note', ann.type, label],
    description: `${ANNOTATION_TYPE_LABELS[ann.type]} : ${label}`,
    defaultWidth: width,
    defaultHeight: height,
    svgBody,
  }
}
