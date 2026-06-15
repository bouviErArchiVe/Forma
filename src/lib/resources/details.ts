/**
 * Bibliothèque de détails constructifs (V1).
 *
 * Différent des blocs (petits symboles) : ce sont des assemblages techniques
 * schématiques (coupes types). Chaque détail a un SVG simple, des notes et un
 * avertissement indicatif. Insérable dans un dessin via le pipeline blocs
 * (SVG → raster → ImageElement) en réutilisant DrawingBlock.
 */
import type { DrawingBlock } from '../blocks/types'
import { buildSearchText, type GraphicResource } from './resourceTypes'
import { resourceToBlock } from './resourceToBlock'

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
  | 'coupe-type'

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
  'coupe-type': 'Coupes types',
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

  // ─── Fondations (V2) ─────────────────────────────────────────────────────────
  {
    id: 'd-found-isolee', name: 'Semelle isolée (sous poteau)', category: 'fondations',
    description: 'Semelle ponctuelle reportant la charge d’un poteau au sol.',
    tags: ['fondation', 'semelle isolée', 'poteau', 'charge ponctuelle', 'béton'],
    notes: 'Dimensionner la semelle selon la charge et la capacité portante du sol ; armature en nappe inférieure et profondeur hors gel.',
    width: 150, height: 130,
    svgBody: '<rect x="66" y="10" width="18" height="70"/><rect x="40" y="80" width="70" height="22"/><path d="M44 96 H106" stroke-dasharray="3 3"/><path d="M30 102 H120" stroke-width="2"/>',
  },
  {
    id: 'd-found-radier', name: 'Radier (dalle de fondation)', category: 'fondations',
    description: 'Dalle pleine répartissant les charges sur l’ensemble de l’emprise.',
    tags: ['fondation', 'radier', 'dalle', 'sol portant', 'isolant'],
    notes: 'Utile sur sol de faible portance ; isolant sous radier et coupure de capillarité. Épaisseur et armature selon calcul.',
    width: 180, height: 90,
    svgBody: '<rect x="20" y="30" width="140" height="26"/><path d="M24 50 H156" stroke-dasharray="3 3"/><rect x="20" y="56" width="140" height="8" stroke-dasharray="2 2"/><path d="M20 64 H160" stroke-width="2"/>',
  },
  {
    id: 'd-found-pieux', name: 'Fondation sur pieux', category: 'fondations',
    description: 'Charges reportées en profondeur par des pieux jusqu’à une couche résistante.',
    tags: ['fondation', 'pieux', 'profond', 'chevêtre', 'sol'],
    notes: 'Pieux (vissés, battus, forés) couronnés d’un chevêtre/longrine. Type et longueur selon étude géotechnique.',
    width: 160, height: 150,
    svgBody: '<rect x="30" y="20" width="100" height="16"/><rect x="44" y="36" width="14" height="90"/><rect x="102" y="36" width="14" height="90"/><path d="M30 128 H130" stroke-dasharray="4 4"/>',
  },
  {
    id: 'd-found-mur-isole', name: 'Mur de fondation isolé', category: 'fondations',
    description: 'Mur de fondation avec isolant continu (intérieur ou extérieur) et imperméabilisation.',
    tags: ['fondation', 'isolation', 'sous-sol', 'imperméabilisation', 'pont thermique'],
    notes: 'Isoler de préférence à l’extérieur pour rompre le pont thermique et garder le mur au chaud ; membrane et drainage au pied.',
    width: 150, height: 150,
    svgBody: '<rect x="60" y="10" width="22" height="110"/><rect x="50" y="10" width="10" height="110" stroke-dasharray="3 3"/><path d="M40 120 H100 V140 H30 V120 Z"/><path d="M50 10 V120" stroke-width="2"/>',
  },

  // ─── Murs (V2) ───────────────────────────────────────────────────────────────
  {
    id: 'd-wall-icf', name: 'Mur en coffrage isolant (ICF)', category: 'murs',
    description: 'Béton coulé entre deux panneaux d’isolant qui restent en place.',
    tags: ['mur', 'icf', 'coffrage isolant', 'béton', 'isolation'],
    notes: 'Isolation continue des deux côtés et masse thermique ; prévoir fixation des finitions et pare-feu intérieur (gypse).',
    width: 150, height: 120,
    svgBody: '<rect x="40" y="10" width="12" height="100" stroke-dasharray="3 3"/><rect x="52" y="10" width="26" height="100"/><rect x="78" y="10" width="12" height="100" stroke-dasharray="3 3"/><path d="M60 14 V106 M70 14 V106"/>',
  },
  {
    id: 'd-wall-steel-stud', name: 'Mur à ossature d’acier léger', category: 'murs',
    description: 'Montants d’acier galvanisé formé à froid, avec isolant et revêtement de gypse.',
    tags: ['mur', 'acier léger', 'montant', 'gypse', 'pont thermique'],
    notes: 'L’acier est conducteur : prévoir une isolation continue extérieure pour limiter le pont thermique des montants.',
    width: 160, height: 120,
    svgBody: '<path d="M30 10 h12 v100 h-12" /><path d="M78 10 h-12 v100 h12"/><rect x="42" y="10" width="24" height="100" stroke-dasharray="3 3"/><rect x="84" y="10" width="8" height="100"/>',
  },
  {
    id: 'd-wall-double-stud', name: 'Mur à double ossature (haute performance)', category: 'murs',
    description: 'Deux ossatures décalées créant une cavité épaisse fortement isolée.',
    tags: ['mur', 'double ossature', 'haute performance', 'isolation', 'pont thermique'],
    notes: 'Rompt le pont thermique des montants et permet de grandes épaisseurs d’isolant ; gérer la migration de vapeur.',
    width: 170, height: 120,
    svgBody: '<rect x="30" y="10" width="8" height="100"/><rect x="38" y="10" width="70" height="100" stroke-dasharray="3 3"/><rect x="108" y="10" width="8" height="100"/><path d="M70 10 V110"/>',
  },
  {
    id: 'd-wall-brick-veneer', name: 'Parement de brique sur ossature', category: 'murs',
    description: 'Placage de brique devant une lame d’air drainée et une ossature isolée.',
    tags: ['mur', 'brique', 'placage', 'lame d’air', 'chantepleure'],
    notes: 'Lame d’air drainée, solin de base et chantepleures, attaches d’ancrage ; pare-air continu derrière la cavité.',
    width: 170, height: 120,
    svgBody: '<rect x="30" y="10" width="8" height="100"/><rect x="38" y="10" width="30" height="100" stroke-dasharray="3 3"/><rect x="76" y="10" width="14" height="100"/><path d="M76 26 h14 M76 42 h14 M76 58 h14 M76 74 h14 M76 90 h14"/>',
  },
  {
    id: 'd-wall-rainscreen', name: 'Mur pare-pluie à claire-voie (rainscreen)', category: 'murs',
    description: 'Revêtement ventilé sur fourrures créant une lame d’air drainée et ventilée.',
    tags: ['mur', 'rainscreen', 'pare-pluie', 'lame d’air ventilée', 'fourrures'],
    notes: 'La cavité ventilée évacue l’eau et favorise le séchage ; entrées d’air haut et bas protégées des insectes.',
    width: 170, height: 120,
    svgBody: '<rect x="40" y="10" width="40" height="100" stroke-dasharray="3 3"/><rect x="86" y="10" width="6" height="100"/><rect x="98" y="10" width="8" height="100"/><path d="M92 14 V106" stroke-dasharray="2 2"/>',
  },

  // ─── Toitures (V2) ───────────────────────────────────────────────────────────
  {
    id: 'd-roof-warm', name: 'Toiture chaude (compacte)', category: 'toitures',
    description: 'Toit plat avec isolant continu au-dessus du support, sans cavité ventilée.',
    tags: ['toiture', 'chaude', 'compacte', 'membrane', 'isolant continu'],
    notes: 'Pare-vapeur sur le support, isolant continu puis membrane ; pas de ventilation requise mais ordre des couches critique.',
    width: 180, height: 90,
    svgBody: '<path d="M10 30 H170" stroke-width="2"/><rect x="10" y="32" width="160" height="16" stroke-dasharray="3 3"/><path d="M10 30 H170 M10 50 H170 M10 56 H170" stroke-width="2"/>',
  },
  {
    id: 'd-roof-cold-vented', name: 'Toiture froide ventilée', category: 'toitures',
    description: 'Combles ventilés avec isolant au plafond et lame d’air sous la couverture.',
    tags: ['toiture', 'froide', 'ventilée', 'comble', 'soffite'],
    notes: 'Entrées d’air en soffite, sorties au faîte ; pare-vapeur au plafond et déflecteurs pour garder la ventilation libre.',
    width: 180, height: 110,
    svgBody: '<path d="M20 90 L90 20 L160 90" stroke-width="2"/><path d="M30 84 L90 30 L150 84"/><path d="M20 95 H160" stroke-width="2"/><path d="M34 90 V95 M146 90 V95"/>',
  },
  {
    id: 'd-roof-eave', name: 'Débord de toit / soffite ventilé', category: 'toitures',
    description: 'Avant-toit avec soffite ventilé, fascia et larmier en rive.',
    tags: ['toiture', 'débord', 'soffite', 'fascia', 'larmier'],
    notes: 'Le soffite ventilé alimente les combles en air ; larmier et membrane de rive dirigent l’eau dans la gouttière.',
    width: 170, height: 120,
    svgBody: '<path d="M40 30 L150 60" stroke-width="2"/><path d="M40 60 H150 L150 70" /><path d="M40 30 V90" stroke-width="2"/><path d="M70 64 h40" stroke-dasharray="2 2"/>',
  },
  {
    id: 'd-roof-ridge-vent', name: 'Faîtage ventilé', category: 'toitures',
    description: 'Sortie d’air continue au faîte protégée par un closoir ventilé.',
    tags: ['toiture', 'faîtage', 'ventilation', 'closoir', 'comble'],
    notes: 'Fente d’aération au faîte couverte d’un aérateur ; équilibrer avec les entrées en soffite pour un flux continu.',
    width: 160, height: 110,
    svgBody: '<path d="M30 90 L80 30 L130 90" stroke-width="2"/><path d="M66 38 H94" /><path d="M70 30 h20 v-8 h-20 z"/><path d="M76 22 V14 M84 22 V14"/>',
  },
  {
    id: 'd-roof-valley', name: 'Noue de toiture', category: 'toitures',
    description: 'Intersection en creux de deux versants, drainée par une membrane/solin de noue.',
    tags: ['toiture', 'noue', 'solin', 'membrane', 'drainage'],
    notes: 'Membrane de protection élargie sous le solin de noue ; recouvrement des bardeaux et écoulement libre vers l’égout.',
    width: 160, height: 120,
    svgBody: '<path d="M20 20 L80 100 L140 20" stroke-width="2"/><path d="M80 100 L80 30" stroke-dasharray="4 4"/><path d="M50 60 L80 96 L110 60"/>',
  },

  // ─── Planchers (V2) ──────────────────────────────────────────────────────────
  {
    id: 'd-floor-i-joist', name: 'Plancher à poutrelles en I', category: 'planchers',
    description: 'Poutrelles d’ingénierie (membrures + âme OSB) supportant le sous-plancher.',
    tags: ['plancher', 'poutrelle en i', 'ewp', 'sous-plancher', 'âme osb'],
    notes: 'Respecter les zones et diamètres de perçage du fabricant ; appuis, raidisseurs et entremises selon les fiches techniques.',
    width: 180, height: 90,
    svgBody: '<path d="M10 20 H170 M10 26 H170" stroke-width="2"/><path d="M30 26 v44 M30 26 h-6 v8 h12 v-8 M30 70 h-6 v-8 h12 v8"/><path d="M90 26 v44 M90 26 h-6 v8 h12 v-8 M90 70 h-6 v-8 h12 v8"/><path d="M150 26 v44 M150 26 h-6 v8 h12 v-8 M150 70 h-6 v-8 h12 v8"/>',
  },
  {
    id: 'd-floor-steel-deck', name: 'Plancher béton sur tablier métallique', category: 'planchers',
    description: 'Dalle de béton coulée sur un tablier (deck) d’acier nervuré porté par des poutres.',
    tags: ['plancher', 'tablier métallique', 'deck', 'béton', 'composite'],
    notes: 'Action composite via connecteurs ; treillis/armature dans la dalle et épaisseur selon portée et résistance au feu.',
    width: 180, height: 90,
    svgBody: '<rect x="10" y="20" width="160" height="16"/><path d="M10 36 l10 8 l10 -8 l10 8 l10 -8 l10 8 l10 -8 l10 8 l10 -8 l10 8 l10 -8 l10 8 l10 -8 l10 8 l10 -8" /><path d="M10 30 H170" stroke-dasharray="2 2"/>',
  },
  {
    id: 'd-floor-radiant', name: 'Plancher chauffant (radiant)', category: 'planchers',
    description: 'Tubes de chauffage hydronique noyés dans une chape sur isolant.',
    tags: ['plancher', 'radiant', 'hydronique', 'chape', 'isolant'],
    notes: 'Isolant sous la chape pour diriger la chaleur vers le haut ; revêtement de sol compatible avec la température.',
    width: 180, height: 80,
    svgBody: '<rect x="10" y="20" width="160" height="18"/><circle cx="30" cy="29" r="4"/><circle cx="55" cy="29" r="4"/><circle cx="80" cy="29" r="4"/><circle cx="105" cy="29" r="4"/><circle cx="130" cy="29" r="4"/><circle cx="155" cy="29" r="4"/><rect x="10" y="38" width="160" height="8" stroke-dasharray="2 2"/><path d="M10 46 H170" stroke-width="2"/>',
  },
  {
    id: 'd-floor-crawlspace', name: 'Plancher sur vide sanitaire', category: 'planchers',
    description: 'Plancher au-dessus d’un vide sanitaire isolé et muni d’un pare-sol.',
    tags: ['plancher', 'vide sanitaire', 'pare-sol', 'isolation', 'humidité'],
    notes: 'Pare-sol continu sur le sol du vide et gestion de l’humidité ; isoler le périmètre ou le plancher selon la stratégie.',
    width: 180, height: 110,
    svgBody: '<path d="M10 20 H170 M10 26 H170" stroke-width="2"/><rect x="24" y="26" width="12" height="34"/><rect x="84" y="26" width="12" height="34"/><rect x="144" y="26" width="12" height="34"/><path d="M10 90 H170" stroke-dasharray="2 2"/>',
  },

  // ─── Escaliers (V2) ──────────────────────────────────────────────────────────
  {
    id: 'd-stair-concrete', name: 'Escalier en béton', category: 'escaliers',
    description: 'Volée de béton armé (paillasse) avec marches et contremarches coulées.',
    tags: ['escalier', 'béton', 'paillasse', 'armature', 'marche'],
    notes: 'Armature dans la paillasse et ancrage aux paliers ; giron et hauteur constants selon le code applicable.',
    width: 160, height: 130,
    svgBody: '<path d="M20 110 V92 H44 V74 H68 V56 H92 V38 H116 V20" stroke-width="2"/><path d="M20 118 L116 26" stroke-dasharray="4 4"/><path d="M32 110 L116 110" stroke-dasharray="2 2"/>',
  },
  {
    id: 'd-stair-guard', name: 'Garde-corps d’escalier (fixation)', category: 'escaliers',
    description: 'Poteau de garde-corps fixé en rive de limon ou de paillasse avec main courante.',
    tags: ['escalier', 'garde-corps', 'main courante', 'fixation', 'sécurité'],
    notes: 'Hauteur, résistance et limitation des ouvertures selon le code ; ancrage capable de reprendre les efforts horizontaux.',
    width: 150, height: 140,
    svgBody: '<path d="M30 120 L120 40" stroke-width="2"/><path d="M50 100 V40 M90 70 V20" /><path d="M44 46 L100 14" stroke-width="2"/><rect x="44" y="98" width="16" height="10"/>',
  },

  // ─── Portes / Fenêtres (V2) ──────────────────────────────────────────────────
  {
    id: 'd-window-sill', name: 'Appui de fenêtre (seuil)', category: 'portes-fenetres',
    description: 'Allège sous fenêtre avec appui en pente, larmier et membrane retournée.',
    tags: ['fenêtre', 'appui', 'seuil', 'larmier', 'membrane'],
    notes: 'Appui en pente vers l’extérieur avec larmier ; membrane d’allège retournée dans l’ouverture pour drainer l’eau.',
    width: 150, height: 120,
    svgBody: '<rect x="40" y="20" width="70" height="40"/><path d="M40 60 H110 L120 70 H34 Z"/><path d="M34 70 H120" stroke-width="2"/><rect x="40" y="78" width="60" height="34" stroke-dasharray="3 3"/>',
  },
  {
    id: 'd-window-head', name: 'Tête de fenêtre (linteau)', category: 'portes-fenetres',
    description: 'Linteau au-dessus de l’ouverture avec solin de tête et membrane.',
    tags: ['fenêtre', 'tête', 'linteau', 'solin', 'membrane'],
    notes: 'Le solin de tête dirige l’eau devant la fenêtre ; membrane intégrée au pare-air au-dessus de l’ouverture.',
    width: 150, height: 120,
    svgBody: '<rect x="40" y="60" width="70" height="40"/><rect x="40" y="40" width="70" height="16"/><path d="M40 40 H114 L120 34 H40 Z"/><path d="M40 56 H110" stroke-dasharray="2 2"/>',
  },
  {
    id: 'd-door-threshold', name: 'Seuil de porte extérieure', category: 'portes-fenetres',
    description: 'Seuil avec coupure thermique, coupe-froid et solin sous la porte.',
    tags: ['porte', 'seuil', 'coupe-froid', 'solin', 'accessibilité'],
    notes: 'Gérer la pluie battante (rupteur, larmier) et l’accessibilité (ressaut limité) ; membrane sous le seuil retournée.',
    width: 160, height: 110,
    svgBody: '<rect x="60" y="10" width="10" height="70"/><path d="M40 80 H120 L120 88 H40 Z"/><path d="M40 88 H120" stroke-width="2"/><path d="M44 80 H116" stroke-dasharray="2 2"/>',
  },
  {
    id: 'd-window-flashing', name: 'Membrane d’ouverture (rough opening)', category: 'portes-fenetres',
    description: 'Bavette et membranes d’étanchéité de l’ouverture avant pose de la fenêtre.',
    tags: ['fenêtre', 'membrane', 'ouverture', 'bavette', 'pare-air'],
    notes: 'Séquence de pose : bavette d’appui d’abord, puis jambages, puis tête ; raccord au pare-air pour la continuité.',
    width: 150, height: 130,
    svgBody: '<rect x="40" y="30" width="70" height="70" stroke-dasharray="3 3"/><path d="M34 100 H116 L116 108 H34 Z"/><path d="M40 30 V100 M110 30 V100" stroke-width="2"/><path d="M40 30 H110" stroke-width="2"/>',
  },

  // ─── Enveloppe (V2) ──────────────────────────────────────────────────────────
  {
    id: 'd-env-wall-roof', name: 'Jonction mur–toiture (continuité pare-air)', category: 'enveloppe',
    description: 'Raccord du plan d’air du mur à celui de la toiture au niveau de la sablière.',
    tags: ['enveloppe', 'jonction', 'pare-air', 'continuité', 'sablière'],
    notes: 'La continuité du pare-air mur→toit est critique ; membrane de transition pontant la sablière et le plafond.',
    width: 160, height: 130,
    svgBody: '<rect x="40" y="40" width="14" height="80"/><path d="M30 40 L80 14 L130 40" stroke-width="2"/><path d="M40 40 H54" stroke-width="2"/><path d="M47 40 Q47 30 60 30" stroke-dasharray="3 3"/>',
  },
  {
    id: 'd-env-wall-found', name: 'Jonction mur–fondation', category: 'enveloppe',
    description: 'Raccord du mur hors-sol à la fondation : lisse basse, scellement et pare-air.',
    tags: ['enveloppe', 'jonction', 'lisse basse', 'pare-air', 'fondation'],
    notes: 'Joint d’étanchéité sous la lisse basse et continuité du pare-air mur→fondation ; rupture de capillarité requise.',
    width: 150, height: 140,
    svgBody: '<rect x="50" y="20" width="40" height="60" stroke-dasharray="3 3"/><path d="M44 80 H96"/><rect x="40" y="84" width="60" height="40"/><path d="M44 80 Q44 90 56 90" stroke-dasharray="2 2"/>',
  },
  {
    id: 'd-env-balcony', name: 'Balcon — rupture de pont thermique', category: 'enveloppe',
    description: 'Dalle de balcon raccordée à la structure avec rupteur thermique.',
    tags: ['enveloppe', 'balcon', 'pont thermique', 'rupteur', 'isolation'],
    notes: 'Une dalle traversante crée un pont thermique majeur ; rupteur structural isolant ou structure désolidarisée.',
    width: 170, height: 110,
    svgBody: '<rect x="20" y="40" width="60" height="14" stroke-dasharray="2 2"/><rect x="80" y="40" width="6" height="14"/><rect x="86" y="40" width="70" height="14"/><rect x="78" y="10" width="8" height="90"/>',
  },
  {
    id: 'd-env-expansion', name: 'Joint de dilatation', category: 'enveloppe',
    description: 'Joint permettant les mouvements différentiels entre deux parties de bâtiment.',
    tags: ['enveloppe', 'joint de dilatation', 'mouvement', 'couvre-joint', 'étanchéité'],
    notes: 'Le joint traverse toutes les couches ; couvre-joint souple étanche à l’air et à l’eau accommodant le mouvement.',
    width: 160, height: 110,
    svgBody: '<rect x="20" y="30" width="50" height="60"/><rect x="90" y="30" width="50" height="60"/><path d="M70 36 Q80 50 70 64 Q60 78 70 84" /><path d="M90 36 Q80 50 90 64 Q100 78 90 84"/>',
  },

  // ─── Isolation (V2) ──────────────────────────────────────────────────────────
  {
    id: 'd-iso-subslab', name: 'Isolation sous dalle', category: 'isolation',
    description: 'Isolant rigide sous la dalle sur sol avec pare-vapeur et isolant périphérique.',
    tags: ['isolation', 'sous-dalle', 'pare-vapeur', 'rigide', 'périphérique'],
    notes: 'Isolant porteur sous la dalle et au pourtour pour rompre le pont thermique ; pare-vapeur sous la dalle.',
    width: 180, height: 90,
    svgBody: '<rect x="10" y="20" width="160" height="16"/><path d="M10 38 H170" stroke-dasharray="2 2"/><rect x="10" y="40" width="160" height="10" stroke-dasharray="3 3"/><rect x="10" y="20" width="8" height="40" stroke-dasharray="3 3"/><path d="M10 50 H170" stroke-width="2"/>',
  },
  {
    id: 'd-iso-thermal-break', name: 'Rupture de pont thermique (linteau)', category: 'isolation',
    description: 'Linteau isolé pour éviter un pont thermique au-dessus des ouvertures.',
    tags: ['isolation', 'pont thermique', 'linteau', 'ouverture', 'continuité'],
    notes: 'Conserver l’isolant continu devant le linteau ; éviter les éléments structuraux traversant l’isolation sans rupteur.',
    width: 160, height: 110,
    svgBody: '<rect x="40" y="30" width="80" height="18"/><rect x="40" y="22" width="80" height="8" stroke-dasharray="3 3"/><rect x="40" y="56" width="80" height="44" stroke-dasharray="2 2"/><path d="M40 48 H120" stroke-width="2"/>',
  },

  // ─── Structure bois (V2) ─────────────────────────────────────────────────────
  {
    id: 'd-wood-joist-beam', name: 'Assemblage solive sur poutre (étrier)', category: 'structure-bois',
    description: 'Solive suspendue à une poutre par un étrier métallique cloué.',
    tags: ['bois', 'solive', 'poutre', 'étrier', 'assemblage'],
    notes: 'Étrier adapté à la dimension de la solive et cloué selon les prescriptions ; appui et alignement des dessus.',
    width: 150, height: 120,
    svgBody: '<rect x="20" y="20" width="24" height="90"/><rect x="44" y="40" width="86" height="20"/><path d="M44 40 v24 h6 v-24 M124 40 v24 h6 v-24" /><circle cx="50" cy="50" r="1.5"/><circle cx="124" cy="50" r="1.5"/>',
  },
  {
    id: 'd-wood-shearwall', name: 'Mur de refend cloué (contreventement)', category: 'structure-bois',
    description: 'Voile de contreventement : panneau cloué sur l’ossature reprenant les efforts latéraux.',
    tags: ['bois', 'refend', 'contreventement', 'panneau', 'ancrage'],
    notes: 'Schéma de clouage du panneau, ancrages anti-soulèvement (hold-down) et continuité jusqu’à la fondation.',
    width: 160, height: 120,
    svgBody: '<rect x="30" y="10" width="100" height="100"/><path d="M50 10 V110 M70 10 V110 M90 10 V110 M110 10 V110" stroke-dasharray="2 2"/><path d="M30 110 L130 10" /><rect x="30" y="100" width="10" height="14"/>',
  },

  // ─── Structure acier (V2) ────────────────────────────────────────────────────
  {
    id: 'd-steel-beam-col', name: 'Assemblage poutre–colonne (boulonné)', category: 'structure-acier',
    description: 'Poutre raccordée à une colonne par une cornière/plaque boulonnée.',
    tags: ['acier', 'poutre', 'colonne', 'boulonné', 'cornière'],
    notes: 'Type d’assemblage (articulé/rigide) selon le calcul ; nombre et disposition des boulons, jeux de montage.',
    width: 150, height: 130,
    svgBody: '<path d="M40 10 V120 M34 10 H46 M34 120 H46" stroke-width="3"/><rect x="46" y="55" width="70" height="14"/><rect x="46" y="50" width="10" height="24"/><circle cx="51" cy="58" r="1.6"/><circle cx="51" cy="66" r="1.6"/>',
  },
  {
    id: 'd-steel-brace', name: 'Contreventement (croix de Saint-André)', category: 'structure-acier',
    description: 'Diagonales en croix reprenant les efforts latéraux dans une travée d’acier.',
    tags: ['acier', 'contreventement', 'diagonale', 'gousset', 'latéral'],
    notes: 'Diagonales raccordées par goussets aux nœuds ; vérifier traction/compression et le flambement des barres.',
    width: 150, height: 130,
    svgBody: '<rect x="30" y="20" width="90" height="90" fill="none"/><path d="M30 20 L120 110 M120 20 L30 110" stroke-width="2"/><path d="M30 20 l16 16 M120 110 l-16 -16" />',
  },

  // ─── Béton (V2) ──────────────────────────────────────────────────────────────
  {
    id: 'd-concrete-joint', name: 'Joint de construction (dalle)', category: 'beton',
    description: 'Reprise de bétonnage entre deux coulées avec clé de cisaillement et armature.',
    tags: ['béton', 'joint de construction', 'reprise', 'clé', 'armature'],
    notes: 'Surface rugueuse/clé pour transférer le cisaillement et armature de continuité ; nettoyer avant la reprise.',
    width: 180, height: 80,
    svgBody: '<rect x="10" y="30" width="80" height="24"/><rect x="90" y="30" width="80" height="24"/><path d="M90 30 v8 h-6 v8 h6 v8" /><path d="M70 42 H110" stroke-dasharray="3 3"/>',
  },
  {
    id: 'd-concrete-corner', name: 'Armature d’angle (mur)', category: 'beton',
    description: 'Détail de ferraillage à l’angle de deux murs/dalles en béton armé.',
    tags: ['béton', 'armature', 'angle', 'recouvrement', 'crochet'],
    notes: 'Barres en L avec recouvrement et crochets pour assurer la continuité des efforts dans le coin ; respecter l’enrobage.',
    width: 140, height: 130,
    svgBody: '<path d="M40 10 H100 V124" stroke-width="6" fill="none"/><path d="M52 18 H92 V112" stroke-dasharray="3 3"/><path d="M60 26 H84 V104" stroke-dasharray="3 3"/>',
  },

  // ─── Drainage (V2) ───────────────────────────────────────────────────────────
  {
    id: 'd-drain-dimple', name: 'Membrane de drainage alvéolée', category: 'drainage',
    description: 'Membrane à plots créant une lame de drainage contre le mur de fondation.',
    tags: ['drainage', 'membrane alvéolée', 'fondation', 'lame d’air', 'humidité'],
    notes: 'Plots tournés vers le mur créant un vide drainant vers le drain ; profilé de tête pour éviter l’entrée de débris.',
    width: 140, height: 140,
    svgBody: '<rect x="50" y="10" width="20" height="110"/><path d="M74 14 v100" /><circle cx="80" cy="24" r="3"/><circle cx="80" cy="40" r="3"/><circle cx="80" cy="56" r="3"/><circle cx="80" cy="72" r="3"/><circle cx="80" cy="88" r="3"/><circle cx="80" cy="104" r="3"/><circle cx="40" cy="116" r="5"/>',
  },
  {
    id: 'd-drain-grade', name: 'Pente de terrain (éloignement de l’eau)', category: 'drainage',
    description: 'Profil de terrain en pente descendante éloignant l’eau de surface de la fondation.',
    tags: ['drainage', 'pente', 'terrain', 'surface', 'fondation'],
    notes: 'Pente minimale du sol fini sur les premiers mètres pour éloigner l’eau ; éviter l’accumulation contre le mur.',
    width: 180, height: 110,
    svgBody: '<rect x="20" y="20" width="24" height="80"/><path d="M44 40 L150 70" stroke-width="2"/><path d="M120 58 l10 4 l-2 -10" /><path d="M44 100 H160" stroke-dasharray="2 2"/>',
  },

  // ─── Coupes types ────────────────────────────────────────────────────────────
  {
    id: 'd-section-wall', name: 'Coupe type — mur extérieur (fondation → toit)', category: 'coupe-type',
    description: 'Coupe schématique d’un mur extérieur, de la semelle au débord de toit.',
    tags: ['coupe type', 'mur extérieur', 'fondation', 'toiture', 'enveloppe'],
    notes: 'Vue d’ensemble pour situer les couches et les jonctions critiques ; à détailler par assemblage selon le projet.',
    width: 150, height: 200,
    svgBody: '<path d="M30 30 L75 10 L120 30" stroke-width="2"/><rect x="55" y="30" width="40" height="120" stroke-dasharray="3 3"/><path d="M55 30 V150 M95 30 V150"/><path d="M40 150 H110 V185 H30 V150 Z"/><path d="M30 185 H120" stroke-width="2"/>',
  },
  {
    id: 'd-section-floor', name: 'Coupe type — plancher intermédiaire', category: 'coupe-type',
    description: 'Coupe schématique d’un plancher entre deux niveaux avec mur porteur.',
    tags: ['coupe type', 'plancher', 'intermédiaire', 'solive', 'mur'],
    notes: 'Situe le solivage, le sous-plancher, la rive et la continuité du mur ; à compléter par les détails d’appui.',
    width: 170, height: 150,
    svgBody: '<rect x="30" y="10" width="14" height="50"/><rect x="30" y="90" width="14" height="50"/><path d="M30 60 H160 M30 66 H160" stroke-width="2"/><rect x="60" y="66" width="12" height="24"/><rect x="110" y="66" width="12" height="24"/><rect x="44" y="66" width="10" height="24"/>',
  },
  {
    id: 'd-section-basement', name: 'Coupe type — mur de sous-sol', category: 'coupe-type',
    description: 'Coupe schématique d’un mur de sous-sol isolé, drainé et raccordé à la dalle.',
    tags: ['coupe type', 'sous-sol', 'fondation', 'isolation', 'drainage'],
    notes: 'Réunit imperméabilisation, isolation, dalle sur isolant et drain ; à détailler selon nappe et climat.',
    width: 150, height: 190,
    svgBody: '<rect x="60" y="20" width="22" height="120"/><rect x="50" y="20" width="10" height="120" stroke-dasharray="3 3"/><path d="M40 140 H110 V175 H30 V140 Z"/><path d="M82 140 H120 M82 146 H120" stroke-width="2"/><circle cx="38" cy="150" r="5"/>',
  },

  // ─── Boost A3 (V2 — expansion) ───────────────────────────────────────────────
  {
    id: 'd-wall-clt', name: 'Mur en bois massif (CLT)', category: 'structure-bois',
    description: 'Panneau de bois lamellé-croisé (CLT) isolé par l’extérieur.',
    tags: ['clt', 'bois massif', 'lamellé-croisé', 'mur', 'isolation extérieure'],
    notes: 'Le panneau CLT est structural et étanche à l’air ; isolation continue extérieure et pare-intempérie, gestion de l’humidité du bois.',
    width: 160, height: 120,
    svgBody: '<rect x="30" y="10" width="22" height="100"/><path d="M30 30 H52 M30 50 H52 M30 70 H52 M30 90 H52" stroke-width="1"/><rect x="52" y="10" width="22" height="100" stroke-dasharray="3 3"/><rect x="80" y="10" width="8" height="100"/>',
  },
  {
    id: 'd-roof-parapet-coping', name: 'Parapet avec couronnement', category: 'toitures',
    description: 'Relevé d’étanchéité au parapet et couronnement métallique en pente.',
    tags: ['parapet', 'couronnement', 'toiture', 'relevé', 'solin'],
    notes: 'Relevé sur la hauteur du parapet, contre-solin et couronnement en pente vers l’intérieur ; continuité du pare-air.',
    width: 150, height: 140,
    svgBody: '<rect x="40" y="30" width="22" height="100"/><path d="M40 130 H120 M40 124 H120" stroke-width="2"/><path d="M40 30 L62 30 L62 70" stroke-width="2"/><path d="M34 24 H68 L62 34 H40 Z"/>',
  },
  {
    id: 'd-roof-eave-vent', name: 'Débord de toit ventilé (soffite)', category: 'toitures',
    description: 'Entrée d’air en soffite ventilé au débord de toiture.',
    tags: ['débord', 'soffite', 'ventilation', 'comble', 'avant-toit'],
    notes: 'Le soffite ventilé alimente la ventilation des combles ; déflecteur pour préserver le passage d’air au-dessus de l’isolant.',
    width: 170, height: 110,
    svgBody: '<path d="M20 40 L110 40 L150 70" stroke-width="2"/><path d="M20 50 L110 50" /><path d="M110 50 V80 H150" stroke-width="2"/><path d="M118 66 h26 M118 72 h26" stroke-width="1"/>',
  },
  {
    id: 'd-floor-balcony', name: 'Balcon — rupture de pont thermique', category: 'planchers',
    description: 'Liaison de balcon avec rupteur de pont thermique.',
    tags: ['balcon', 'pont thermique', 'rupteur', 'plancher', 'porte-à-faux'],
    notes: 'Le rupteur limite la déperdition et le risque de condensation à la jonction dalle/balcon ; étanchéité et pente d’évacuation.',
    width: 180, height: 110,
    svgBody: '<rect x="20" y="40" width="60" height="16"/><rect x="80" y="42" width="10" height="12" fill="currentColor" stroke="none" opacity="0.3"/><rect x="90" y="40" width="70" height="16"/><path d="M90 56 L160 60" /><path d="M20 40 V20" stroke-dasharray="3 3"/>',
  },
  {
    id: 'd-found-pile-cap', name: 'Semelle sur pieux (chevêtre)', category: 'fondations',
    description: 'Chevêtre (pile cap) reliant une colonne à un groupe de pieux.',
    tags: ['pieux', 'chevêtre', 'pile cap', 'fondation profonde'],
    notes: 'Le chevêtre répartit la charge de la colonne sur les pieux ; armatures et enrobage selon calcul, pieux sous niveau porteur.',
    width: 160, height: 150,
    svgBody: '<rect x="66" y="10" width="20" height="40"/><path d="M40 50 H110 V80 H40 Z"/><rect x="48" y="80" width="14" height="55"/><rect x="88" y="80" width="14" height="55"/>',
  },
  {
    id: 'd-found-frost-wall', name: 'Mur de gel (hors-gel)', category: 'fondations',
    description: 'Mur de fondation descendu sous la profondeur de gel.',
    tags: ['gel', 'hors-gel', 'fondation', 'semelle', 'profondeur'],
    notes: 'La semelle doit reposer sous la profondeur de gel locale (à vérifier) ; isolant horizontal possible pour réduire la profondeur.',
    width: 150, height: 170,
    svgBody: '<rect x="60" y="10" width="20" height="110"/><path d="M40 120 H100 V150 H30 V120 Z"/><path d="M20 70 H130" stroke-dasharray="6 4" stroke-width="1"/><text x="120" y="66" font-size="8" stroke="none" fill="#1f2937">gel</text>',
  },
  {
    id: 'd-slab-control-joint', name: 'Joint de contrôle de dalle', category: 'beton',
    description: 'Joint de retrait scié dans une dalle sur sol.',
    tags: ['joint', 'contrôle', 'retrait', 'dalle', 'fissuration'],
    notes: 'Le joint scié induit la fissuration de retrait à un emplacement maîtrisé ; profondeur ≈ 1/4 de l’épaisseur, espacement régulier.',
    width: 180, height: 80,
    svgBody: '<rect x="10" y="24" width="160" height="22"/><path d="M90 24 V36" stroke-width="2"/><path d="M10 46 H170" stroke-dasharray="2 2"/>',
  },
  {
    id: 'd-expansion-joint', name: 'Joint de dilatation', category: 'enveloppe',
    description: 'Joint de dilatation entre deux parties de bâtiment.',
    tags: ['dilatation', 'joint', 'mouvement', 'enveloppe'],
    notes: 'Le joint absorbe les mouvements thermiques/structuraux ; couvre-joint souple et étanche continu sur toute l’enveloppe.',
    width: 160, height: 120,
    svgBody: '<rect x="20" y="20" width="50" height="80"/><rect x="90" y="20" width="50" height="80"/><path d="M70 30 q10 10 0 20 q-10 10 0 20 q10 10 0 20" stroke-width="1.5"/><path d="M90 30 q-10 10 0 20 q10 10 0 20 q-10 10 0 20" stroke-width="1.5"/>',
  },
  {
    id: 'd-skylight', name: 'Puits de lumière (lanterneau)', category: 'toitures',
    description: 'Lanterneau sur toiture avec relevé d’étanchéité et solin.',
    tags: ['puits de lumière', 'lanterneau', 'skylight', 'toiture', 'solin'],
    notes: 'Relevé surélevé (curb) avec membrane retournée et contre-solin ; gestion de la condensation et continuité de l’isolation au pourtour.',
    width: 170, height: 110,
    svgBody: '<path d="M20 70 H150" stroke-width="2"/><rect x="60" y="40" width="50" height="30"/><path d="M60 40 L72 24 H98 L110 40" stroke-width="1.5"/><path d="M54 70 V58 H60 M110 58 H116 V70" stroke-width="2"/>',
  },
  {
    id: 'd-section-ramp', name: 'Coupe type — rampe d’accès', category: 'coupe-type',
    description: 'Coupe schématique d’une rampe d’accès avec palier et garde-corps.',
    tags: ['rampe', 'accès', 'accessibilité', 'palier', 'coupe type'],
    notes: 'Pente et paliers selon le code (à vérifier), bordures de protection et mains courantes continues ; surface antidérapante et drainage.',
    width: 180, height: 120,
    svgBody: '<path d="M20 100 L120 50 H160" stroke-width="2"/><path d="M20 100 H160" /><path d="M40 86 V70 M70 71 V55 M100 56 V40" stroke-width="1"/><path d="M120 50 V36 H160 V50" stroke-dasharray="3 3"/>',
  },
  {
    id: 'd-stair-landing', name: 'Palier d’escalier', category: 'escaliers',
    description: 'Palier intermédiaire entre deux volées d’escalier.',
    tags: ['escalier', 'palier', 'volée', 'repos'],
    notes: 'Palier de repos dimensionné selon l’usage (à vérifier) ; continuité de la main courante et échappée maintenue.',
    width: 170, height: 130,
    svgBody: '<path d="M20 110 V92 H40 V74 H60 V56 H100" stroke-width="2"/><path d="M100 56 H140 V40" stroke-width="2"/><path d="M100 56 V110 H140" stroke-dasharray="3 3"/>',
  },
  {
    id: 'd-guardrail-anchor', name: 'Ancrage de garde-corps', category: 'structure-acier',
    description: 'Fixation de poteau de garde-corps en rive de dalle.',
    tags: ['garde-corps', 'ancrage', 'poteau', 'dalle', 'platine'],
    notes: 'Platine et ancrages dimensionnés pour la charge horizontale (à vérifier) ; étanchéité au droit des fixations en rive.',
    width: 130, height: 150,
    svgBody: '<path d="M60 10 V100" stroke-width="3"/><rect x="44" y="100" width="32" height="8"/><rect x="20" y="108" width="90" height="30" stroke-dasharray="3 3"/><path d="M50 108 V128 M70 108 V128"/>',
  },
  {
    id: 'd-steel-beam-column', name: 'Assemblage poutre-colonne acier', category: 'structure-acier',
    description: 'Connexion boulonnée poutre sur colonne acier.',
    tags: ['acier', 'poutre', 'colonne', 'assemblage', 'boulons'],
    notes: 'Cornières/plaque et boulons selon calcul (CSA S16) ; vérifier cisaillement, pression diamétrale et soudures éventuelles.',
    width: 140, height: 140,
    svgBody: '<path d="M60 10 H70 M60 130 H70 M65 10 V130" stroke-width="3"/><path d="M65 60 H120 M65 80 H120 M92 60 V80" stroke-width="3"/><circle cx="74" cy="66" r="2"/><circle cx="74" cy="74" r="2"/>',
  },
  {
    id: 'd-wood-floor-rim', name: 'Solive de rive (plancher bois)', category: 'structure-bois',
    description: 'Solive de rive et fourrure au pourtour d’un plancher bois.',
    tags: ['plancher', 'bois', 'solive de rive', 'rive', 'pont thermique'],
    notes: 'Isoler et rendre étanche à l’air la solive de rive (point faible thermique) ; appui et continuité du pare-air à soigner.',
    width: 170, height: 120,
    svgBody: '<path d="M20 30 H160 M20 36 H160" stroke-width="2"/><rect x="24" y="36" width="12" height="50"/><rect x="60" y="36" width="12" height="50"/><rect x="100" y="36" width="12" height="50"/><rect x="36" y="40" width="20" height="42" stroke-dasharray="3 3"/>',
  },
  {
    id: 'd-green-roof', name: 'Toiture végétalisée (extensive)', category: 'toitures',
    description: 'Complexe de toiture végétalisée extensive sur membrane.',
    tags: ['toiture', 'végétalisée', 'verte', 'drainage', 'anti-racines'],
    notes: 'Membrane anti-racines, couche drainante, substrat et végétaux ; vérifier la surcharge structurale saturée et l’accès d’entretien.',
    width: 180, height: 100,
    svgBody: '<path d="M10 40 H170" stroke-width="2"/><path d="M10 48 H170" /><path d="M10 56 H170" stroke-dasharray="2 2"/><path d="M20 40 q4 -8 8 0 M40 40 q4 -8 8 0 M60 40 q4 -8 8 0 M80 40 q4 -8 8 0 M100 40 q4 -8 8 0 M120 40 q4 -8 8 0 M140 40 q4 -8 8 0" stroke-width="1"/>',
  },
  {
    id: 'd-french-drain', name: 'Drain français (talus)', category: 'drainage',
    description: 'Tranchée drainante avec drain perforé et géotextile.',
    tags: ['drain', 'français', 'géotextile', 'gravier', 'talus'],
    notes: 'Drain perforé enrobé de gravier propre et de géotextile, pente vers l’exutoire ; séparer les fines pour éviter le colmatage.',
    width: 150, height: 130,
    svgBody: '<path d="M30 30 L120 30 L120 90 L30 110 Z" stroke-dasharray="3 3"/><circle cx="75" cy="80" r="10"/><circle cx="75" cy="80" r="3"/><path d="M40 100 Q60 96 80 100 T120 100" stroke-width="1"/>',
  },
  {
    id: 'd-curtain-wall', name: 'Mur-rideau (coupe)', category: 'enveloppe',
    description: 'Coupe d’un mur-rideau aluminium à rupture de pont thermique.',
    tags: ['mur-rideau', 'curtain wall', 'aluminium', 'vitrage', 'enveloppe'],
    notes: 'Meneaux à rupture de pont thermique, vitrage isolant et drainage des meneaux ; étanchéité à l’air et continuité aux nez de dalle.',
    width: 130, height: 150,
    svgBody: '<rect x="50" y="10" width="14" height="130"/><path d="M57 10 V140" stroke-dasharray="2 4"/><rect x="64" y="20" width="40" height="40"/><rect x="64" y="80" width="40" height="40"/><path d="M40 66 H64 M40 74 H64" stroke-width="2"/>',
  },
  {
    id: 'd-slab-edge-insul', name: 'Rive de dalle isolée', category: 'isolation',
    description: 'Isolation de rive de dalle sur sol contre le pont thermique.',
    tags: ['dalle', 'rive', 'isolation', 'pont thermique', 'périphérie'],
    notes: 'Isolant vertical en rive de dalle pour rompre le pont thermique périphérique ; protéger l’isolant exposé hors sol.',
    width: 160, height: 100,
    svgBody: '<rect x="40" y="30" width="110" height="18"/><rect x="30" y="30" width="10" height="40" stroke-dasharray="3 3"/><path d="M40 48 H150" stroke-width="2"/><path d="M30 70 H150" stroke-dasharray="2 2"/>',
  },
  {
    id: 'd-concrete-cold-joint', name: 'Reprise de bétonnage', category: 'beton',
    description: 'Joint de reprise entre deux coulées de béton.',
    tags: ['béton', 'reprise', 'joint', 'clé', 'bétonnage'],
    notes: 'Surface rugueuse/propre et clé de cisaillement à la reprise ; armatures en attente pour assurer la continuité.',
    width: 140, height: 150,
    svgBody: '<rect x="50" y="20" width="40" height="120"/><path d="M50 80 H90" stroke-width="2"/><path d="M64 76 v8 h12 v-8" /><path d="M70 60 V100" stroke-dasharray="3 3"/>',
  },
  {
    id: 'd-air-barrier-junction', name: 'Continuité du pare-air (jonction)', category: 'enveloppe',
    description: 'Continuité du pare-air à la jonction mur / toiture.',
    tags: ['pare-air', 'continuité', 'jonction', 'enveloppe', 'étanchéité'],
    notes: 'Le pare-air doit être continu et raccordé aux jonctions (mur-toit, mur-fondation, ouvertures) ; membrane de transition rubannée.',
    width: 160, height: 140,
    svgBody: '<path d="M40 20 L140 20" stroke-width="2"/><path d="M40 130 V40 H120" stroke-width="2"/><path d="M40 40 Q44 28 56 24 L140 24" stroke-width="2" stroke-dasharray="4 2"/><circle cx="50" cy="34" r="2" fill="currentColor" stroke="none"/>',
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

/** Adapte un détail vers la forme commune `GraphicResource` (Resource Factory). */
export function detailToResource(detail: ConstructionDetail): GraphicResource {
  return {
    id: detail.id,
    type: 'detail',
    name: detail.name,
    category: detail.category,
    categoryLabel: DETAIL_CATEGORY_LABELS[detail.category],
    description: detail.description,
    tags: detail.tags,
    svg: detail.svgBody,
    viewBox: `0 0 ${detail.width} ${detail.height}`,
    defaultWidth: detail.width,
    defaultHeight: detail.height,
    searchText: buildSearchText([detail.name, detail.description, detail.notes, detail.tags, detail.category, DETAIL_CATEGORY_LABELS[detail.category]]),
    insertable: true,
    disclaimer: DETAIL_DISCLAIMER,
    sourceType: 'svg-block',
    blockCategory: 'annotations',
    blockTagPrefix: 'détail',
  }
}

/** Convertit un détail en DrawingBlock pour l'insertion dans un dessin. */
export function detailToBlock(detail: ConstructionDetail): DrawingBlock {
  return resourceToBlock(detailToResource(detail))
}
