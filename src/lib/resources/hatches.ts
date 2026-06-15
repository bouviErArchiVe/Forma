/**
 * Bibliothèque de hachures techniques (Pack A — A5).
 *
 * Chaque hachure est un échantillon (« swatch ») vectoriel de 80×80, dessiné
 * en géométrie explicite (traits + points) — comme les détails constructifs —
 * afin de traverser sans risque le pipeline bloc existant
 * (`SVG → raster HD → asset Dexie → ImageElement`). Aucune modification du
 * canvas n'est nécessaire.
 *
 * Insérables dans un dessin (bibliothèque de blocs, onglet « Hachures ») et
 * consultables dans Ressources. Pensées pour les détails et, à terme, les
 * légendes.
 */
import type { DrawingBlock } from '../blocks/types'
import { buildSearchText, type GraphicResource } from './resourceTypes'
import { resourceToBlock } from './resourceToBlock'

export type HatchCategory =
  | 'mineral'
  | 'maconnerie'
  | 'bois'
  | 'metal'
  | 'isolation'
  | 'sol'
  | 'etancheite'
  | 'finition'
  | 'fluide'

export const HATCH_CATEGORY_LABELS: Record<HatchCategory, string> = {
  mineral: 'Minéral / Béton',
  maconnerie: 'Maçonnerie',
  bois: 'Bois',
  metal: 'Métal',
  isolation: 'Isolation',
  sol: 'Sol / Terrain',
  etancheite: 'Étanchéité',
  finition: 'Finition',
  fluide: 'Fluide',
}

export interface Hatch {
  id: string
  name: string
  category: HatchCategory
  description: string
  tags: string[]
  /** Taille du swatch (viewBox carré). */
  size: number
  /** Corps SVG du swatch (géométrie explicite, sans balise <svg>). */
  svgBody: string
}

export const HATCH_DISCLAIMER =
  'Motif schématique indicatif — la convention graphique peut varier selon le bureau, la norme et l’échelle.'

const S = 80

// Jeux de traits diagonaux réutilisés (slope -1 « / » et +1 « \ »).
const DIAG_FWD = // « / » espacés ~20
  '<path d="M0 20 L20 0 M0 40 L40 0 M0 60 L60 0 M0 80 L80 0 M20 80 L80 20 M40 80 L80 40 M60 80 L80 60" stroke-width="1.2"/>'
const DIAG_BWD = // « \ » espacés ~20
  '<path d="M0 60 L20 80 M0 40 L40 80 M0 20 L60 80 M0 0 L80 80 M20 0 L80 60 M40 0 L80 40 M60 0 L80 20" stroke-width="1.2"/>'

export const HATCHES: Hatch[] = [
  // ─── Minéral / Béton ─────────────────────────────────────────────────────────
  {
    id: 'h-beton', name: 'Béton', category: 'mineral',
    description: 'Béton non armé — semis de points et de petits triangles.',
    tags: ['béton', 'concrete', 'minéral', 'points'],
    size: S,
    svgBody:
      '<g fill="currentColor" stroke="none">' +
      '<circle cx="16" cy="20" r="1.6"/><circle cx="46" cy="14" r="1.6"/><circle cx="66" cy="34" r="1.6"/>' +
      '<circle cx="26" cy="52" r="1.6"/><circle cx="58" cy="62" r="1.6"/><circle cx="14" cy="70" r="1.6"/>' +
      '<path d="M34 30 l5 9 l-10 0 Z"/><path d="M60 50 l4.5 8 l-9 0 Z"/><path d="M20 36 l4 7 l-8 0 Z"/>' +
      '<path d="M44 66 l4.5 8 l-9 0 Z"/></g>',
  },
  {
    id: 'h-beton-arme', name: 'Béton armé', category: 'mineral',
    description: 'Béton armé — semis béton avec hachure diagonale d’armature.',
    tags: ['béton armé', 'reinforced', 'armature', 'structure'],
    size: S,
    svgBody:
      DIAG_FWD +
      '<g fill="currentColor" stroke="none"><circle cx="24" cy="28" r="1.5"/><circle cx="54" cy="22" r="1.5"/>' +
      '<circle cx="38" cy="54" r="1.5"/><circle cx="64" cy="58" r="1.5"/><circle cx="16" cy="60" r="1.5"/></g>',
  },
  {
    id: 'h-pierre', name: 'Pierre naturelle', category: 'mineral',
    description: 'Pierre — polygones irréguliers (appareil de moellons).',
    tags: ['pierre', 'stone', 'moellon', 'naturel'],
    size: S,
    svgBody:
      '<path d="M4 6 L30 4 L40 22 L22 34 L4 26 Z" stroke-width="1.2"/>' +
      '<path d="M40 22 L62 10 L76 26 L58 40 L40 34 Z" stroke-width="1.2"/>' +
      '<path d="M4 26 L22 34 L26 58 L8 72 L2 48 Z" stroke-width="1.2"/>' +
      '<path d="M26 58 L48 44 L70 52 L60 74 L34 76 Z" stroke-width="1.2"/>' +
      '<path d="M58 40 L76 26 L78 52 L70 52 Z" stroke-width="1.2"/>',
  },

  // ─── Maçonnerie ──────────────────────────────────────────────────────────────
  {
    id: 'h-brique', name: 'Brique', category: 'maconnerie',
    description: 'Brique — appareil à coupe (running bond), joints décalés.',
    tags: ['brique', 'brick', 'appareil', 'maçonnerie'],
    size: S,
    svgBody:
      '<path d="M0 20 H80 M0 40 H80 M0 60 H80" stroke-width="1.2"/>' +
      '<path d="M20 0 V20 M40 0 V20 M60 0 V20" stroke-width="1.2"/>' +
      '<path d="M10 20 V40 M30 20 V40 M50 20 V40 M70 20 V40" stroke-width="1.2"/>' +
      '<path d="M20 40 V60 M40 40 V60 M60 40 V60" stroke-width="1.2"/>' +
      '<path d="M10 60 V80 M30 60 V80 M50 60 V80 M70 60 V80" stroke-width="1.2"/>',
  },
  {
    id: 'h-maconnerie', name: 'Maçonnerie (générique)', category: 'maconnerie',
    description: 'Maçonnerie générique — double hachure croisée à 45°.',
    tags: ['maçonnerie', 'masonry', 'croisé', 'crosshatch'],
    size: S,
    svgBody: DIAG_FWD + DIAG_BWD,
  },

  // ─── Bois ────────────────────────────────────────────────────────────────────
  {
    id: 'h-bois', name: 'Bois (fil)', category: 'bois',
    description: 'Bois en coupe longitudinale — veines (fil du bois).',
    tags: ['bois', 'wood', 'veine', 'fil', 'grain'],
    size: S,
    svgBody:
      '<path d="M0 14 q20 -8 40 0 t40 0" stroke-width="1.2"/>' +
      '<path d="M0 30 q20 8 40 0 t40 0" stroke-width="1.2"/>' +
      '<path d="M0 46 q20 -8 40 0 t40 0" stroke-width="1.2"/>' +
      '<path d="M0 62 q20 8 40 0 t40 0" stroke-width="1.2"/>' +
      '<path d="M0 76 q20 -6 40 0 t40 0" stroke-width="1.2"/>',
  },

  // ─── Métal ───────────────────────────────────────────────────────────────────
  {
    id: 'h-acier', name: 'Acier / Métal', category: 'metal',
    description: 'Acier en coupe — hachure diagonale fine à 45°.',
    tags: ['acier', 'steel', 'métal', 'diagonale'],
    size: S,
    svgBody: DIAG_FWD,
  },

  // ─── Isolation ───────────────────────────────────────────────────────────────
  {
    id: 'h-isolation', name: 'Isolant (matelas)', category: 'isolation',
    description: 'Isolation souple — motif ondulé de matelas (batt).',
    tags: ['isolation', 'isolant', 'laine', 'batt', 'matelas'],
    size: S,
    svgBody:
      '<path d="M2 18 q10 -14 20 0 t20 0 t20 0 t16 0" stroke-width="1.3"/>' +
      '<path d="M2 38 q10 -14 20 0 t20 0 t20 0 t16 0" stroke-width="1.3"/>' +
      '<path d="M2 58 q10 -14 20 0 t20 0 t20 0 t16 0" stroke-width="1.3"/>' +
      '<path d="M2 74 q10 -12 20 0 t20 0 t20 0 t16 0" stroke-width="1.3"/>',
  },

  // ─── Sol / Terrain ───────────────────────────────────────────────────────────
  {
    id: 'h-terre', name: 'Terre / Sol naturel', category: 'sol',
    description: 'Terrain naturel — lignes de sol avec ticks diagonaux.',
    tags: ['terre', 'sol', 'terrain', 'earth', 'remblai'],
    size: S,
    svgBody:
      '<path d="M0 22 H80 M0 48 H80 M0 74 H80" stroke-width="1.3"/>' +
      '<path d="M10 22 l-6 8 M30 22 l-6 8 M50 22 l-6 8 M70 22 l-6 8" stroke-width="1"/>' +
      '<path d="M20 48 l-6 8 M40 48 l-6 8 M60 48 l-6 8 M80 48 l-6 8" stroke-width="1"/>' +
      '<path d="M10 74 l-6 6 M30 74 l-6 6 M50 74 l-6 6 M70 74 l-6 6" stroke-width="1"/>',
  },
  {
    id: 'h-gravier', name: 'Gravier', category: 'sol',
    description: 'Gravier / granulat — galets de tailles variées.',
    tags: ['gravier', 'gravel', 'granulat', 'drainant'],
    size: S,
    svgBody:
      '<g stroke-width="1.2">' +
      '<circle cx="16" cy="18" r="6"/><circle cx="40" cy="14" r="4"/><circle cx="62" cy="22" r="7"/>' +
      '<circle cx="26" cy="40" r="5"/><circle cx="52" cy="44" r="4"/><circle cx="72" cy="50" r="5"/>' +
      '<circle cx="14" cy="60" r="6"/><circle cx="38" cy="64" r="7"/><circle cx="62" cy="70" r="4"/></g>',
  },
  {
    id: 'h-sable', name: 'Sable', category: 'sol',
    description: 'Sable — semis dense de points fins.',
    tags: ['sable', 'sand', 'lit de pose', 'fin'],
    size: S,
    svgBody:
      '<g fill="currentColor" stroke="none">' +
      '<circle cx="10" cy="12" r="1.1"/><circle cx="26" cy="8" r="1.1"/><circle cx="44" cy="14" r="1.1"/><circle cx="60" cy="9" r="1.1"/><circle cx="72" cy="18" r="1.1"/>' +
      '<circle cx="16" cy="26" r="1.1"/><circle cx="34" cy="30" r="1.1"/><circle cx="52" cy="24" r="1.1"/><circle cx="68" cy="32" r="1.1"/>' +
      '<circle cx="8" cy="42" r="1.1"/><circle cx="24" cy="46" r="1.1"/><circle cx="42" cy="40" r="1.1"/><circle cx="58" cy="46" r="1.1"/><circle cx="74" cy="44" r="1.1"/>' +
      '<circle cx="14" cy="60" r="1.1"/><circle cx="32" cy="64" r="1.1"/><circle cx="50" cy="58" r="1.1"/><circle cx="66" cy="62" r="1.1"/>' +
      '<circle cx="22" cy="74" r="1.1"/><circle cx="40" cy="72" r="1.1"/><circle cx="60" cy="76" r="1.1"/></g>',
  },

  // ─── Étanchéité ──────────────────────────────────────────────────────────────
  {
    id: 'h-membrane', name: 'Membrane', category: 'etancheite',
    description: 'Membrane d’étanchéité — bande continue épaisse.',
    tags: ['membrane', 'étanchéité', 'pare-air', 'pare-vapeur'],
    size: S,
    svgBody:
      '<path d="M0 30 H80" stroke-width="5"/>' +
      '<path d="M0 50 H80" stroke-width="1"/>',
  },

  // ─── Finition ────────────────────────────────────────────────────────────────
  {
    id: 'h-gypse', name: 'Gypse / Plâtre', category: 'finition',
    description: 'Plaque de plâtre — semis régulier de points fins.',
    tags: ['gypse', 'plâtre', 'placoplâtre', 'finition'],
    size: S,
    svgBody:
      '<g fill="currentColor" stroke="none">' +
      '<circle cx="13" cy="13" r="1"/><circle cx="33" cy="13" r="1"/><circle cx="53" cy="13" r="1"/><circle cx="73" cy="13" r="1"/>' +
      '<circle cx="23" cy="33" r="1"/><circle cx="43" cy="33" r="1"/><circle cx="63" cy="33" r="1"/><circle cx="3" cy="33" r="1"/>' +
      '<circle cx="13" cy="53" r="1"/><circle cx="33" cy="53" r="1"/><circle cx="53" cy="53" r="1"/><circle cx="73" cy="53" r="1"/>' +
      '<circle cx="23" cy="73" r="1"/><circle cx="43" cy="73" r="1"/><circle cx="63" cy="73" r="1"/><circle cx="3" cy="73" r="1"/></g>',
  },
  {
    id: 'h-verre', name: 'Verre', category: 'finition',
    description: 'Verre — fines diagonales rapprochées « \\ ».',
    tags: ['verre', 'glass', 'vitrage', 'translucide'],
    size: S,
    svgBody:
      '<path d="M0 50 L30 80 M0 30 L50 80 M0 10 L70 80 M10 0 L80 70 M30 0 L80 50 M50 0 L80 30 M70 0 L80 10" stroke-width="0.7"/>',
  },

  // ─── Fluide ──────────────────────────────────────────────────────────────────
  {
    id: 'h-eau', name: 'Eau', category: 'fluide',
    description: 'Eau / liquide — lignes d’onde horizontales.',
    tags: ['eau', 'water', 'liquide', 'nappe'],
    size: S,
    svgBody:
      '<path d="M2 22 q10 -8 20 0 t20 0 t20 0 t16 0" stroke-width="1.2"/>' +
      '<path d="M2 42 q10 -8 20 0 t20 0 t20 0 t16 0" stroke-width="1.2"/>' +
      '<path d="M2 62 q10 -8 20 0 t20 0 t20 0 t16 0" stroke-width="1.2"/>',
  },
]

const BY_ID = new Map(HATCHES.map((h) => [h.id, h]))

export function getHatch(id: string): Hatch | undefined {
  return BY_ID.get(id)
}

export function hatchCategories(): HatchCategory[] {
  const seen = new Set<HatchCategory>()
  for (const h of HATCHES) seen.add(h.category)
  return [...seen]
}

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

/** Recherche dans nom, description, tags et catégorie. */
export function searchHatches(query: string, category?: HatchCategory | 'all'): Hatch[] {
  let list = HATCHES
  if (category && category !== 'all') list = list.filter((h) => h.category === category)
  const q = normalize(query)
  if (q === '') return list
  return list.filter((h) => {
    const hay = normalize([h.name, h.description, h.tags.join(' '), h.category, HATCH_CATEGORY_LABELS[h.category]].join(' '))
    return hay.includes(q)
  })
}

/** Résout une hachure-bloc par id `hatch-<hatchId>` (insertion canvas). */
export function resolveHatchBlock(blockId: string): DrawingBlock | undefined {
  if (!blockId.startsWith('hatch-')) return undefined
  const hatch = getHatch(blockId.slice('hatch-'.length))
  return hatch ? hatchToBlock(hatch) : undefined
}

/** Adapte une hachure vers la forme commune `GraphicResource` (Resource Factory). */
export function hatchToResource(hatch: Hatch): GraphicResource {
  return {
    id: hatch.id,
    type: 'hatch',
    name: hatch.name,
    category: hatch.category,
    categoryLabel: HATCH_CATEGORY_LABELS[hatch.category],
    description: hatch.description,
    tags: hatch.tags,
    svg: hatch.svgBody,
    viewBox: `0 0 ${hatch.size} ${hatch.size}`,
    defaultWidth: hatch.size,
    defaultHeight: hatch.size,
    searchText: buildSearchText([hatch.name, hatch.description, hatch.tags, hatch.category, HATCH_CATEGORY_LABELS[hatch.category]]),
    insertable: true,
    disclaimer: HATCH_DISCLAIMER,
    sourceType: 'svg-block',
    blockCategory: 'annotations',
    blockTagPrefix: 'hachure',
  }
}

/** Convertit une hachure en DrawingBlock pour l'insertion dans un dessin. */
export function hatchToBlock(hatch: Hatch): DrawingBlock {
  return resourceToBlock(hatchToResource(hatch))
}
