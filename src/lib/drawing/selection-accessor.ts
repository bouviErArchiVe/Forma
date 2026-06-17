/**
 * Accesseur de sélection — LECTURE SEULE (Pack B, Sprint #2).
 *
 * Expose, sous une forme typée et stable, l'état de la sélection courante du
 * canvas (identifiants, types présents, comptes par type et bbox) SANS jamais
 * muter la page ni la sélection. C'est un petit helper PUR posé À CÔTÉ du
 * moteur de sélection (`src/lib/selection-engine`) : aucune modification de la
 * boucle de rendu, aucun effet de bord.
 *
 * Usage typique : un panneau d'inspection / la future barre d'échelle peut lire
 * « combien d'éléments, de quels types, dans quelle boîte » sans accéder aux
 * détails internes du canvas ni risquer d'altérer le dessin.
 */
import { getStrokeBounds } from '../stroke-render'
import type { Page, SelectableKind, SelectionItem } from '../../types'

/** Boîte englobante en coordonnées page (px). */
export interface SelectionBBox {
  x: number
  y: number
  w: number
  h: number
}

/**
 * Vue immuable de la sélection courante. Toutes les structures sont des copies :
 * les muter n'affecte ni la page ni la sélection source.
 */
export interface SelectionSnapshot {
  /** Vrai si rien n'est sélectionné. */
  empty: boolean
  /** Nombre total d'éléments sélectionnés (résolus dans la page). */
  count: number
  /** Identifiants sélectionnés, dédupliqués, dans l'ordre de la sélection. */
  ids: string[]
  /** Types présents dans la sélection (unique, ordre d'apparition). */
  kinds: SelectableKind[]
  /** Décompte par type (toutes les clés présentes, 0 si absent). */
  countByKind: Record<SelectableKind, number>
  /** Boîte englobante (coords page) ou `null` si vide / non résoluble. */
  bbox: SelectionBBox | null
}

const ALL_KINDS: SelectableKind[] = ['stroke', 'shape', 'text', 'image', 'sticker', 'tape']

function emptyCountByKind(): Record<SelectableKind, number> {
  return { stroke: 0, shape: 0, text: 0, image: 0, sticker: 0, tape: 0 }
}

/**
 * Boîte englobante (coords page) de la sélection résolue. Logique alignée sur
 * `selectionBounds` du moteur de sélection : traits via `getStrokeBounds`,
 * texte avec hauteur minimale 40, autres via leur rectangle. Pure, sans I/O ni
 * dépendance sur la boucle de rendu.
 */
function computeBBox(page: Page, selection: readonly SelectionItem[]): SelectionBBox | null {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  const mark = (x1: number, y1: number, x2: number, y2: number) => {
    minX = Math.min(minX, x1, x2)
    minY = Math.min(minY, y1, y2)
    maxX = Math.max(maxX, x1, x2)
    maxY = Math.max(maxY, y1, y2)
  }
  for (const s of selection) {
    if (s.kind === 'stroke') {
      const st = page.strokes.find((x) => x.id === s.id)
      if (st) {
        const b = getStrokeBounds(st)
        mark(b.minX, b.minY, b.maxX, b.maxY)
      }
    } else if (s.kind === 'shape') {
      const sh = page.shapes.find((x) => x.id === s.id)
      if (sh) mark(sh.x1, sh.y1, sh.x2, sh.y2)
    } else if (s.kind === 'text') {
      const t = page.texts.find((x) => x.id === s.id)
      if (t) mark(t.x, t.y, t.x + t.width, t.y + Math.max(t.height, 40))
    } else if (s.kind === 'image') {
      const i = page.images.find((x) => x.id === s.id)
      if (i) mark(i.x, i.y, i.x + i.width, i.y + i.height)
    } else if (s.kind === 'sticker') {
      const st = page.stickers.find((x) => x.id === s.id)
      if (st) mark(st.x, st.y, st.x + st.size, st.y + st.size)
    } else if (s.kind === 'tape') {
      const t = page.tapes.find((x) => x.id === s.id)
      if (t) mark(t.x, t.y, t.x + t.width, t.y + t.height)
    }
  }
  if (!Number.isFinite(minX)) return null
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
}

/**
 * Indique si un item de sélection référence un élément réellement présent dans
 * la page (sélection « résolue »). Lecture seule.
 */
function existsInPage(page: Page, item: SelectionItem): boolean {
  switch (item.kind) {
    case 'stroke':
      return page.strokes.some((s) => s.id === item.id)
    case 'shape':
      return page.shapes.some((s) => s.id === item.id)
    case 'text':
      return page.texts.some((t) => t.id === item.id)
    case 'image':
      return page.images.some((i) => i.id === item.id)
    case 'sticker':
      return page.stickers.some((s) => s.id === item.id)
    case 'tape':
      return page.tapes.some((t) => t.id === item.id)
    default:
      return false
  }
}

/**
 * Construit un instantané LECTURE SEULE de la sélection. Ne mute jamais `page`
 * ni `selection`. Les items qui ne correspondent à aucun élément de la page
 * sont ignorés (sélection résolue), ce qui rend l'accesseur robuste face à une
 * sélection obsolète.
 */
export function readSelection(page: Page, selection: readonly SelectionItem[]): SelectionSnapshot {
  const countByKind = emptyCountByKind()
  const ids: string[] = []
  const kinds: SelectableKind[] = []
  const seenKeys = new Set<string>()
  const seenKinds = new Set<SelectableKind>()
  const resolved: SelectionItem[] = []

  for (const item of selection) {
    const key = `${item.kind}:${item.id}`
    if (seenKeys.has(key)) continue
    if (!existsInPage(page, item)) continue
    seenKeys.add(key)
    resolved.push({ kind: item.kind, id: item.id })
    countByKind[item.kind] += 1
    ids.push(item.id)
    if (!seenKinds.has(item.kind)) {
      seenKinds.add(item.kind)
      kinds.push(item.kind)
    }
  }

  const count = resolved.length
  const bbox = count > 0 ? computeBBox(page, resolved) : null

  return {
    empty: count === 0,
    count,
    ids,
    kinds,
    countByKind,
    bbox,
  }
}

/**
 * Filtre les items d'une sélection par type — utilitaire de lecture pur.
 * Retourne une nouvelle liste ; n'altère pas l'entrée.
 */
export function selectionOfKind(
  selection: readonly SelectionItem[],
  kind: SelectableKind,
): SelectionItem[] {
  return selection.filter((s) => s.kind === kind).map((s) => ({ kind: s.kind, id: s.id }))
}

/** Vrai si la sélection ne contient que des éléments du type donné (et non vide). */
export function isHomogeneousSelection(
  page: Page,
  selection: readonly SelectionItem[],
  kind: SelectableKind,
): boolean {
  const snap = readSelection(page, selection)
  return snap.count > 0 && snap.kinds.length === 1 && snap.kinds[0] === kind
}

/** Liste de référence des types sélectionnables (lecture seule). */
export function selectableKinds(): SelectableKind[] {
  return [...ALL_KINDS]
}
