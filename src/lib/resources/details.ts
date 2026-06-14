/**
 * Bibliothèque de détails constructifs (V1).
 *
 * Différent des blocs (petits symboles) : ce sont des assemblages techniques
 * schématiques (coupes types). Chaque détail a un SVG simple, des notes et un
 * avertissement indicatif. Insérable dans un dessin via le pipeline blocs
 * (SVG → raster → ImageElement) en réutilisant DrawingBlock.
 */
import type { DrawingBlock } from '../blocks/types'

export type DetailCategory =
  | 'murs'
  | 'toitures'
  | 'fondations'
  | 'planchers'
  | 'escaliers'
  | 'portes-fenetres'
  | 'enveloppe'
  | 'isolation'
  | 'structure-bois'
  | 'structure-acier'
  | 'beton'
  | 'drainage'

export const DETAIL_CATEGORY_LABELS: Record<DetailCategory, string> = {
  murs: 'Murs',
  toitures: 'Toitures',
  fondations: 'Fondations',
  planchers: 'Planchers',
  escaliers: 'Escaliers',
  'portes-fenetres': 'Portes / Fenêtres',
  enveloppe: 'Enveloppe',
  isolation: 'Isolation',
  'structure-bois': 'Structure bois',
  'structure-acier': 'Structure acier',
  beton: 'Béton',
  drainage: 'Drainage',
}

export interface ConstructionDetail {
  id: string
  name: string
  category: DetailCategory
  description: string
  tags: string[]
  /** Notes techniques (points de vigilance). */
  notes: string
  /** Dimensions du viewBox / d'insertion. */
  width: number
  height: number
  svgBody: string
}

export const DETAIL_DISCLAIMER =
  'Détail schématique indicatif — à adapter au projet, au climat et au code applicable. Ne dispense pas d’une conception par un professionnel.'

export const CONSTRUCTION_DETAILS: ConstructionDetail[] = [
  {
    id: 'd-wall-wood', name: 'Mur à ossature bois', category: 'murs',
    description: 'Coupe type d’un mur extérieur à ossature bois isolé.',
    tags: ['mur', 'ossature', 'bois', 'isolation', 'pare-air'],
    notes: 'De l’extérieur : revêtement, lame d’air, pare-intempérie, panneau, montants + isolant, pare-vapeur (côté chaud), gypse. Continuité du pare-air essentielle.',
    width: 160, height: 120,
    svgBody: '<rect x="20" y="10" width="10" height="100"/><rect x="30" y="10" width="8" height="100"/><rect x="38" y="10" width="40" height="100" stroke-dasharray="3 3"/><rect x="78" y="10" width="8" height="100"/><rect x="86" y="10" width="6" height="100"/><path d="M30 10 V110 M92 10 V110" stroke-width="1"/><text x="40" y="60" font-size="8" stroke="none" fill="#1f2937">isolant</text>',
  },
  {
    id: 'd-wall-cmu', name: 'Mur de blocs (CMU)', category: 'murs',
    description: 'Mur porteur en blocs de béton avec isolation et finition.',
    tags: ['mur', 'cmu', 'bloc', 'maçonnerie', 'porteur'],
    notes: 'Bloc structural, isolant rigide côté intérieur ou extérieur selon stratégie, pare-air continu. Armature dans les alvéoles selon calcul.',
    width: 160, height: 120,
    svgBody: '<rect x="30" y="10" width="40" height="100"/><rect x="38" y="20" width="10" height="20"/><rect x="52" y="20" width="10" height="20"/><rect x="38" y="50" width="10" height="20"/><rect x="52" y="50" width="10" height="20"/><rect x="38" y="80" width="10" height="20"/><rect x="52" y="80" width="10" height="20"/><rect x="70" y="10" width="14" height="100" stroke-dasharray="3 3"/>',
  },
  {
    id: 'd-roof-flat', name: 'Toiture plate', category: 'toitures',
    description: 'Coupe type d’une toiture plate avec membrane et pente de drainage.',
    tags: ['toiture', 'plate', 'membrane', 'drainage', 'pente'],
    notes: 'Pente minimale vers les drains, membrane d’étanchéité, isolant, pare-vapeur, support structural. Relevés aux parapets.',
    width: 180, height: 90,
    svgBody: '<path d="M10 30 L170 40" stroke-width="2"/><path d="M10 38 L170 48"/><rect x="10" y="48" width="160" height="14" stroke-dasharray="3 3"/><path d="M10 62 H170" stroke-width="2"/><path d="M150 20 V30 M155 20 V30" /><text x="40" y="58" font-size="8" stroke="none" fill="#1f2937">isolant</text>',
  },
  {
    id: 'd-roof-pitched', name: 'Toiture en pente', category: 'toitures',
    description: 'Coupe d’une toiture en pente ventilée (combles).',
    tags: ['toiture', 'pente', 'comble', 'ventilation', 'chevron'],
    notes: 'Ventilation des combles (entrées en soffite, sorties en faîte), pare-vapeur au plafond, isolant en comble. Couverture sur support ventilé.',
    width: 180, height: 110,
    svgBody: '<path d="M20 90 L90 20 L160 90" stroke-width="2"/><path d="M28 90 L90 28 L152 90"/><path d="M20 95 H160" stroke-width="2"/><path d="M40 90 V95 M140 90 V95"/><text x="70" y="80" font-size="8" stroke="none" fill="#1f2937">comble</text>',
  },
  {
    id: 'd-foundation-strip', name: 'Fondation — semelle filante', category: 'fondations',
    description: 'Semelle filante avec mur de fondation et drain.',
    tags: ['fondation', 'semelle', 'mur', 'drain', 'béton'],
    notes: 'Semelle sous le gel, mur de fondation, imperméabilisation et isolant côté extérieur, drain de fondation au pied avec membrane et gravier.',
    width: 150, height: 140,
    svgBody: '<rect x="60" y="10" width="20" height="90"/><path d="M40 100 H100 V125 H30 V100 Z"/><circle cx="38" cy="112" r="5"/><path d="M30 100 L20 100" stroke-dasharray="2 2"/><text x="40" y="118" font-size="7" stroke="none" fill="#1f2937">drain</text>',
  },
  {
    id: 'd-slab-grade', name: 'Dalle sur sol', category: 'planchers',
    description: 'Dalle sur sol avec isolant et pare-vapeur.',
    tags: ['dalle', 'sur sol', 'plancher', 'isolant', 'hérisson'],
    notes: 'Dalle de béton sur pare-vapeur et isolant, sur lit granulaire compacté. Isolant périphérique pour rompre le pont thermique au pourtour.',
    width: 180, height: 80,
    svgBody: '<rect x="10" y="20" width="160" height="16"/><path d="M10 38 H170" stroke-width="2"/><path d="M10 44 H170" stroke-dasharray="2 2"/><path d="M14 52 l4 4 m10 -4 l4 4 m10 -4 l4 4 m10 -4 l4 4 m10 -4 l4 4 m10 -4 l4 4 m10 -4 l4 4 m10 -4 l4 4 m10 -4 l4 4" stroke-width="1"/>',
  },
  {
    id: 'd-floor-joist', name: 'Plancher à solives bois', category: 'planchers',
    description: 'Plancher à solives avec sous-plancher et finition.',
    tags: ['plancher', 'solive', 'bois', 'sous-plancher'],
    notes: 'Solives à entraxe régulier, contreventement/épontes, sous-plancher collé-vissé, espace de service en dessous. Vérifier la flèche et les portées.',
    width: 180, height: 90,
    svgBody: '<path d="M10 20 H170 M10 26 H170" stroke-width="2"/><rect x="24" y="26" width="14" height="44"/><rect x="64" y="26" width="14" height="44"/><rect x="104" y="26" width="14" height="44"/><rect x="144" y="26" width="14" height="44"/>',
  },
  {
    id: 'd-stair-section', name: 'Escalier — coupe', category: 'escaliers',
    description: 'Coupe d’un escalier (limon, marches, contremarches).',
    tags: ['escalier', 'coupe', 'limon', 'marche', 'contremarche'],
    notes: 'Limon porteur, marches et contremarches, hauteur et giron constants (Blondel), échappée suffisante, garde-corps/main courante conformes.',
    width: 160, height: 130,
    svgBody: '<path d="M20 110 V90 H45 V70 H70 V50 H95 V30 H120 V10" stroke-width="2"/><path d="M20 120 L120 20" stroke-dasharray="4 4"/><text x="50" y="100" font-size="8" stroke="none" fill="#1f2937">limon</text>',
  },
  {
    id: 'd-window-jamb', name: 'Fenêtre — jambage', category: 'portes-fenetres',
    description: 'Détail de jambage de fenêtre (étanchéité et appui).',
    tags: ['fenêtre', 'jambage', 'étanchéité', 'appui', 'solin'],
    notes: 'Membrane d’étanchéité retournée dans l’ouverture, fond de joint et scellant, appui en pente avec larmier, continuité du pare-air autour du cadre.',
    width: 140, height: 120,
    svgBody: '<rect x="30" y="10" width="14" height="100" stroke-dasharray="3 3"/><rect x="44" y="10" width="6" height="100"/><rect x="50" y="20" width="60" height="80"/><path d="M50 100 H110 L116 106 H50 Z"/><text x="62" y="60" font-size="8" stroke="none" fill="#1f2937">vitrage</text>',
  },
  {
    id: 'd-parapet', name: 'Parapet de toiture', category: 'enveloppe',
    description: 'Relevé de membrane au parapet avec couronnement.',
    tags: ['parapet', 'membrane', 'relevé', 'couronnement', 'solin'],
    notes: 'Relevé de membrane sur la hauteur du parapet, contre-solin et couronnement métallique en pente vers l’intérieur, continuité du pare-air mur-toit.',
    width: 130, height: 130,
    svgBody: '<rect x="40" y="20" width="20" height="100"/><path d="M40 120 H110 M40 114 H110" stroke-width="2"/><path d="M40 20 L60 20 L60 60" stroke-width="2"/><path d="M34 16 H66 L62 24 H38 Z"/><text x="70" y="100" font-size="8" stroke="none" fill="#1f2937">toit</text>',
  },
  {
    id: 'd-insulation-continuous', name: 'Isolation extérieure continue', category: 'isolation',
    description: 'Isolant rigide continu sur mur pour réduire les ponts thermiques.',
    tags: ['isolation', 'continue', 'pont thermique', 'isolant rigide'],
    notes: 'Isolant rigide continu côté extérieur, fixations à rupture de pont thermique, pare-air sous l’isolant, revêtement sur fourrures ventilées.',
    width: 160, height: 110,
    svgBody: '<rect x="30" y="10" width="30" height="90"/><rect x="60" y="10" width="16" height="90" stroke-dasharray="3 3"/><path d="M60 10 V100" stroke-width="2"/><rect x="84" y="10" width="6" height="90"/><path d="M60 30 H90 M60 60 H90 M60 90 H90" stroke-width="1"/>',
  },
  {
    id: 'd-wood-beam-column', name: 'Assemblage poutre-poteau bois', category: 'structure-bois',
    description: 'Connexion poutre sur poteau bois avec ferrure.',
    tags: ['bois', 'poutre', 'poteau', 'assemblage', 'ferrure'],
    notes: 'Ferrure métallique (étrier ou platine) entre poutre et poteau, boulons selon calcul, jeu pour le retrait du bois. Protection contre l’humidité.',
    width: 130, height: 130,
    svgBody: '<rect x="55" y="60" width="20" height="60"/><rect x="20" y="40" width="90" height="20"/><rect x="50" y="55" width="30" height="10"/><circle cx="60" cy="60" r="2"/><circle cx="70" cy="60" r="2"/>',
  },
  {
    id: 'd-steel-base', name: 'Base de colonne acier', category: 'structure-acier',
    description: 'Plaque de base de colonne acier ancrée au béton.',
    tags: ['acier', 'colonne', 'plaque de base', 'ancrage', 'béton'],
    notes: 'Plaque de base soudée, boulons d’ancrage dans le béton, mortier de calage sans retrait, gousset si requis. Vérifier l’effort et le poinçonnement.',
    width: 130, height: 120,
    svgBody: '<path d="M55 10 H65 M55 80 H65 M60 10 V80" stroke-width="3"/><rect x="35" y="80" width="50" height="8"/><rect x="30" y="88" width="60" height="24" stroke-dasharray="3 3"/><path d="M40 88 V104 M80 88 V104"/>',
  },
  {
    id: 'd-concrete-wall-footing', name: 'Mur béton sur semelle', category: 'beton',
    description: 'Mur de béton armé sur semelle avec armatures.',
    tags: ['béton', 'mur', 'semelle', 'armature', 'fondation'],
    notes: 'Armatures verticales en attente depuis la semelle, recouvrement suffisant, enrobage selon exposition. Reprise de bétonnage avec clé/rugosité.',
    width: 140, height: 140,
    svgBody: '<rect x="58" y="10" width="24" height="90"/><path d="M40 100 H100 V128 H30 V100 Z"/><path d="M64 14 V124 M76 14 V124" stroke-dasharray="3 3"/><path d="M36 120 H94" stroke-dasharray="3 3"/>',
  },
  {
    id: 'd-foundation-drain', name: 'Drain de fondation', category: 'drainage',
    description: 'Drain français au pied de la fondation.',
    tags: ['drainage', 'drain', 'fondation', 'gravier', 'membrane'],
    notes: 'Drain perforé enrobé de gravier propre et de géotextile, pente vers l’exutoire, membrane de drainage sur le mur. Évacuation hors zone de gel.',
    width: 150, height: 120,
    svgBody: '<rect x="60" y="10" width="20" height="80"/><path d="M40 90 H100 V110 H30 V90 Z"/><circle cx="40" cy="100" r="6"/><circle cx="40" cy="100" r="2"/><path d="M30 90 Q24 100 30 110" stroke-dasharray="2 2"/>',
  },
]

const DETAIL_BY_ID = new Map(CONSTRUCTION_DETAILS.map((d) => [d.id, d]))

export function getDetail(id: string): ConstructionDetail | undefined {
  return DETAIL_BY_ID.get(id)
}

export function detailCategories(): DetailCategory[] {
  const seen = new Set<DetailCategory>()
  for (const d of CONSTRUCTION_DETAILS) seen.add(d.category)
  return [...seen]
}

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

export function searchDetails(query: string, category?: DetailCategory | 'all'): ConstructionDetail[] {
  let list = CONSTRUCTION_DETAILS
  if (category && category !== 'all') list = list.filter((d) => d.category === category)
  const q = normalize(query)
  if (q === '') return list
  return list.filter((d) => {
    const hay = normalize([d.name, d.description, d.notes, d.tags.join(' '), d.category].join(' '))
    return hay.includes(q)
  })
}

/** Résout un détail-bloc par id `detail-<detailId>` (insertion canvas). */
export function resolveDetailBlock(blockId: string): DrawingBlock | undefined {
  if (!blockId.startsWith('detail-')) return undefined
  const detail = getDetail(blockId.slice('detail-'.length))
  return detail ? detailToBlock(detail) : undefined
}

/** Convertit un détail en DrawingBlock pour l'insertion dans un dessin. */
export function detailToBlock(detail: ConstructionDetail): DrawingBlock {
  return {
    id: `detail-${detail.id}`,
    name: detail.name,
    category: 'annotations',
    unitSystem: 'metric',
    tags: ['détail', ...detail.tags],
    description: detail.description,
    defaultWidth: detail.width,
    defaultHeight: detail.height,
    svgBody: detail.svgBody,
  }
}
