/**
 * Catalogue de blocs — système impérial (pouces / pieds).
 *
 * Équivalents impériaux : bois dimensionnel (2x4…), profilés W/HSS,
 * CMU 8", portes 3'-0", appareils sanitaires, symboles électriques.
 * Mêmes catégories que le catalogue métrique ; labels impériaux.
 */
import type { DrawingBlock } from './types'

export const IMPERIAL_BLOCKS: DrawingBlock[] = [
  // ── Bois dimensionnel ──────────────────────────────────────────────────────
  {
    id: 'i-wood-2x4', name: 'Montant 2×4', category: 'wood', unitSystem: 'imperial',
    tags: ['wood', 'stud', '2x4', 'lumber'], scaleLabel: '2×4',
    defaultWidth: 38, defaultHeight: 90, description: 'Dimensional lumber 2×4 (1½″×3½″).',
    svgBody: '<rect x="8" y="8" width="22" height="74"/><path d="M8 8 L30 82 M30 8 L8 82" stroke-width="1"/>',
  },
  {
    id: 'i-wood-2x6', name: 'Montant 2×6', category: 'wood', unitSystem: 'imperial',
    tags: ['wood', 'stud', '2x6', 'lumber'], scaleLabel: '2×6',
    defaultWidth: 38, defaultHeight: 120, description: 'Dimensional lumber 2×6 (1½″×5½″).',
    svgBody: '<rect x="8" y="6" width="22" height="108"/><path d="M8 6 L30 114 M30 6 L8 114" stroke-width="1"/>',
  },
  {
    id: 'i-wood-2x8', name: 'Solive 2×8', category: 'wood', unitSystem: 'imperial',
    tags: ['wood', 'joist', '2x8', 'lumber'], scaleLabel: '2×8',
    defaultWidth: 34, defaultHeight: 120, description: 'Dimensional lumber 2×8 (1½″×7¼″).',
    svgBody: '<rect x="8" y="6" width="18" height="108"/>',
  },
  {
    id: 'i-wood-2x10', name: 'Solive 2×10', category: 'wood', unitSystem: 'imperial',
    tags: ['wood', 'joist', '2x10', 'lumber'], scaleLabel: '2×10',
    defaultWidth: 30, defaultHeight: 130, description: 'Dimensional lumber 2×10 (1½″×9¼″).',
    svgBody: '<rect x="8" y="6" width="16" height="118"/>',
  },
  {
    id: 'i-wood-4x4', name: 'Poteau 4×4', category: 'wood', unitSystem: 'imperial',
    tags: ['wood', 'post', '4x4', 'lumber'], scaleLabel: '4×4',
    defaultWidth: 70, defaultHeight: 70, description: 'Poteau bois 4×4 (3½″×3½″).',
    svgBody: '<rect x="10" y="10" width="50" height="50"/><path d="M10 10 L60 60 M60 10 L10 60" stroke-width="1"/>',
  },
  {
    id: 'i-wood-plywood', name: 'Plywood 4×8', category: 'wood', unitSystem: 'imperial',
    tags: ['wood', 'plywood', 'sheet', 'osb'], scaleLabel: "4'×8'",
    defaultWidth: 120, defaultHeight: 60, description: 'Panneau 4′×8′.',
    svgBody: '<rect x="8" y="8" width="104" height="44"/><path d="M8 22 H112 M8 36 H112" stroke-width="1"/>',
  },

  // ── Acier ────────────────────────────────────────────────────────────────
  {
    id: 'i-steel-wbeam', name: 'W-beam', category: 'steel', unitSystem: 'imperial',
    tags: ['steel', 'beam', 'w', 'wide flange'], scaleLabel: 'W12',
    defaultWidth: 80, defaultHeight: 96, description: 'Wide-flange steel beam (symbol).',
    svgBody: '<path d="M14 10 H66 M14 86 H66 M40 10 V86" stroke-width="3"/>',
  },
  {
    id: 'i-steel-hss', name: 'HSS tube', category: 'steel', unitSystem: 'imperial',
    tags: ['steel', 'hss', 'tube'], scaleLabel: 'HSS 4×2',
    defaultWidth: 90, defaultHeight: 60, description: 'Hollow structural section (symbol).',
    svgBody: '<rect x="8" y="8" width="74" height="44" rx="3"/><rect x="15" y="15" width="60" height="30" rx="2"/>',
  },
  {
    id: 'i-steel-pipe', name: 'Steel pipe', category: 'steel', unitSystem: 'imperial',
    tags: ['steel', 'pipe', 'round'], scaleLabel: 'Ø 4″',
    defaultWidth: 70, defaultHeight: 70, description: 'Round steel pipe column (symbol).',
    svgBody: '<circle cx="35" cy="35" r="28"/><circle cx="35" cy="35" r="21"/>',
  },
  {
    id: 'i-steel-angle', name: 'Angle (L)', category: 'steel', unitSystem: 'imperial',
    tags: ['steel', 'angle', 'l'], scaleLabel: 'L 3×3',
    defaultWidth: 70, defaultHeight: 70, description: 'Steel angle, equal legs.',
    svgBody: '<path d="M14 10 V60 H62 V52 H22 V10 Z"/>',
  },
  {
    id: 'i-steel-plate', name: 'Base plate', category: 'steel', unitSystem: 'imperial',
    tags: ['steel', 'plate', 'base'], scaleLabel: 'PL 8×⅜',
    defaultWidth: 110, defaultHeight: 36, description: 'Steel base plate.',
    svgBody: '<rect x="6" y="8" width="98" height="20"/><circle cx="22" cy="18" r="2.5"/><circle cx="88" cy="18" r="2.5"/>',
  },

  // ── Béton ────────────────────────────────────────────────────────────────
  {
    id: 'i-concrete-slab', name: 'Concrete slab', category: 'concrete', unitSystem: 'imperial',
    tags: ['concrete', 'slab'], scaleLabel: '8″',
    defaultWidth: 130, defaultHeight: 36, description: 'Concrete slab (section).',
    svgBody: '<rect x="6" y="8" width="118" height="20"/><circle cx="20" cy="18" r="1.6"/><circle cx="44" cy="18" r="1.6"/><circle cx="68" cy="18" r="1.6"/><circle cx="92" cy="18" r="1.6"/>',
  },
  {
    id: 'i-concrete-footing', name: 'Strip footing', category: 'concrete', unitSystem: 'imperial',
    tags: ['concrete', 'footing', 'foundation'], scaleLabel: "2'-0\"",
    defaultWidth: 110, defaultHeight: 90, description: 'Strip footing (section).',
    svgBody: '<path d="M44 8 H66 V52 H104 V82 H6 V52 H44 Z"/>',
  },
  {
    id: 'i-concrete-column', name: 'Concrete column', category: 'concrete', unitSystem: 'imperial',
    tags: ['concrete', 'column'], scaleLabel: '16″×16″',
    defaultWidth: 70, defaultHeight: 70, description: 'Concrete column with rebar (section).',
    svgBody: '<rect x="10" y="10" width="50" height="50" rx="2"/><circle cx="20" cy="20" r="2.5"/><circle cx="50" cy="20" r="2.5"/><circle cx="20" cy="50" r="2.5"/><circle cx="50" cy="50" r="2.5"/>',
  },

  // ── Maçonnerie ─────────────────────────────────────────────────────────────
  {
    id: 'i-cmu', name: 'CMU 8″', category: 'masonry', unitSystem: 'imperial',
    tags: ['masonry', 'cmu', 'block'], scaleLabel: '8×8×16',
    defaultWidth: 110, defaultHeight: 56, description: 'Concrete masonry unit, 8″.',
    svgBody: '<rect x="6" y="8" width="98" height="40"/><rect x="16" y="16" width="32" height="24"/><rect x="62" y="16" width="32" height="24"/>',
  },
  {
    id: 'i-brick', name: 'Brick', category: 'masonry', unitSystem: 'imperial',
    tags: ['masonry', 'brick'], scaleLabel: '⅜×2¼×7⅝',
    defaultWidth: 100, defaultHeight: 36, description: 'Modular clay brick.',
    svgBody: '<rect x="6" y="8" width="88" height="20"/><path d="M40 8 V28 M67 8 V28" stroke-width="1"/>',
  },

  // ── Portes / fenêtres ───────────────────────────────────────────────────────
  {
    id: 'i-door-30', name: "Door 3'-0\"", category: 'doors-windows', unitSystem: 'imperial',
    tags: ['door', 'single', "3'-0"], scaleLabel: "3'-0\"",
    defaultWidth: 90, defaultHeight: 90, description: "Single swing door 3'-0\" (plan).",
    svgBody: '<path d="M12 82 V12" stroke-width="3"/><path d="M12 12 H78"/><path d="M78 12 A66 66 0 0 1 12 78" stroke-dasharray="4 4"/>',
  },
  {
    id: 'i-door-double', name: "Double door 6'-0\"", category: 'doors-windows', unitSystem: 'imperial',
    tags: ['door', 'double'], scaleLabel: "6'-0\"",
    defaultWidth: 120, defaultHeight: 70, description: 'Double door (plan).',
    svgBody: '<path d="M10 60 V18 M110 60 V18" stroke-width="3"/><path d="M10 18 A42 42 0 0 1 52 60" stroke-dasharray="4 4"/><path d="M110 18 A42 42 0 0 0 68 60" stroke-dasharray="4 4"/>',
  },
  {
    id: 'i-window', name: 'Window', category: 'doors-windows', unitSystem: 'imperial',
    tags: ['window'], scaleLabel: "4'-0\"",
    defaultWidth: 110, defaultHeight: 30, description: 'Window in wall (plan).',
    svgBody: '<rect x="6" y="6" width="98" height="18"/><path d="M6 15 H104"/><path d="M55 6 V24"/>',
  },

  // ── Escaliers ──────────────────────────────────────────────────────────────
  {
    id: 'i-stair-straight', name: 'Straight stair', category: 'stairs', unitSystem: 'imperial',
    tags: ['stair', 'straight', 'up'], scaleLabel: '',
    defaultWidth: 70, defaultHeight: 120, description: 'Straight run stair (plan) with up arrow.',
    svgBody: '<rect x="14" y="8" width="42" height="104"/><path d="M14 24 H56 M14 40 H56 M14 56 H56 M14 72 H56 M14 88 H56"/><path d="M35 100 V20 M30 28 L35 18 L40 28" stroke-width="2"/>',
  },
  {
    id: 'i-guardrail', name: 'Guardrail', category: 'stairs', unitSystem: 'imperial',
    tags: ['guardrail', 'railing'], scaleLabel: '42″',
    defaultWidth: 120, defaultHeight: 60, description: 'Guardrail with balusters (elevation).',
    svgBody: '<path d="M6 12 H114 M6 50 H114" stroke-width="2.5"/><path d="M20 12 V50 M40 12 V50 M60 12 V50 M80 12 V50 M100 12 V50"/>',
  },

  // ── Mobilier ──────────────────────────────────────────────────────────────
  {
    id: 'i-table', name: 'Table', category: 'furniture', unitSystem: 'imperial',
    tags: ['furniture', 'table'], scaleLabel: "5'×3'",
    defaultWidth: 120, defaultHeight: 70, description: 'Table (plan).',
    svgBody: '<rect x="8" y="10" width="104" height="50" rx="3"/>',
  },
  {
    id: 'i-chair', name: 'Chair', category: 'furniture', unitSystem: 'imperial',
    tags: ['furniture', 'chair'], scaleLabel: '18″',
    defaultWidth: 50, defaultHeight: 54, description: 'Chair (plan).',
    svgBody: '<rect x="10" y="14" width="30" height="30" rx="3"/><path d="M10 14 H40 V10 H10 Z"/>',
  },
  {
    id: 'i-bed-queen', name: 'Queen bed', category: 'furniture', unitSystem: 'imperial',
    tags: ['furniture', 'bed', 'queen'], scaleLabel: '60″×80″',
    defaultWidth: 90, defaultHeight: 120, description: 'Queen bed (plan).',
    svgBody: '<rect x="10" y="10" width="70" height="100" rx="4"/><path d="M10 38 H80"/><rect x="18" y="16" width="24" height="16" rx="2"/><rect x="48" y="16" width="24" height="16" rx="2"/>',
  },
  {
    id: 'i-sofa', name: 'Sofa', category: 'furniture', unitSystem: 'imperial',
    tags: ['furniture', 'sofa', 'couch'], scaleLabel: "7'",
    defaultWidth: 120, defaultHeight: 60, description: 'Sofa (plan).',
    svgBody: '<rect x="8" y="14" width="104" height="40" rx="6"/><path d="M8 24 H112"/><path d="M30 24 V54 M86 24 V54"/>',
  },

  // ── Sanitaire ────────────────────────────────────────────────────────────
  {
    id: 'i-wc', name: 'Toilet', category: 'sanitary', unitSystem: 'imperial',
    tags: ['sanitary', 'toilet', 'wc'], scaleLabel: '',
    defaultWidth: 50, defaultHeight: 70, description: 'Toilet / water closet (plan).',
    svgBody: '<rect x="14" y="6" width="22" height="14" rx="2"/><ellipse cx="25" cy="44" rx="17" ry="22"/>',
  },
  {
    id: 'i-lav', name: 'Lavatory', category: 'sanitary', unitSystem: 'imperial',
    tags: ['sanitary', 'lavatory', 'sink'], scaleLabel: '',
    defaultWidth: 60, defaultHeight: 50, description: 'Lavatory (plan).',
    svgBody: '<rect x="8" y="8" width="44" height="36" rx="4"/><ellipse cx="30" cy="28" rx="14" ry="10"/><circle cx="30" cy="13" r="2"/>',
  },
  {
    id: 'i-shower', name: 'Shower', category: 'sanitary', unitSystem: 'imperial',
    tags: ['sanitary', 'shower'], scaleLabel: '36″×36″',
    defaultWidth: 70, defaultHeight: 70, description: 'Shower pan (plan).',
    svgBody: '<rect x="8" y="8" width="54" height="54"/><path d="M8 8 L62 62"/><circle cx="50" cy="20" r="3"/>',
  },
  {
    id: 'i-tub', name: 'Bathtub', category: 'sanitary', unitSystem: 'imperial',
    tags: ['sanitary', 'tub', 'bath'], scaleLabel: "5'-0\"",
    defaultWidth: 120, defaultHeight: 56, description: 'Bathtub (plan).',
    svgBody: '<rect x="6" y="8" width="108" height="40" rx="8"/><rect x="14" y="14" width="84" height="28" rx="6"/><circle cx="92" cy="28" r="2.5"/>',
  },
  {
    id: 'i-kitchen-sink', name: 'Kitchen sink', category: 'sanitary', unitSystem: 'imperial',
    tags: ['sanitary', 'sink', 'kitchen'], scaleLabel: '',
    defaultWidth: 90, defaultHeight: 56, description: 'Double-bowl kitchen sink (plan).',
    svgBody: '<rect x="8" y="8" width="74" height="40" rx="3"/><rect x="14" y="14" width="28" height="28" rx="2"/><rect x="48" y="14" width="28" height="28" rx="2"/>',
  },

  // ── Électrique ──────────────────────────────────────────────────────────────
  {
    id: 'i-outlet', name: 'Duplex outlet', category: 'electrical', unitSystem: 'imperial',
    tags: ['electrical', 'outlet', 'receptacle'], scaleLabel: '',
    defaultWidth: 44, defaultHeight: 44, description: 'Duplex receptacle.',
    svgBody: '<circle cx="22" cy="22" r="16"/><path d="M22 6 V14"/><circle cx="17" cy="24" r="2"/><circle cx="27" cy="24" r="2"/>',
  },
  {
    id: 'i-switch', name: 'Switch', category: 'electrical', unitSystem: 'imperial',
    tags: ['electrical', 'switch'], scaleLabel: '',
    defaultWidth: 44, defaultHeight: 44, description: 'Single-pole switch.',
    svgBody: '<circle cx="22" cy="22" r="16"/><path d="M22 22 L33 11"/><text x="6" y="40" font-size="10" stroke="none" fill="#1f2937">S</text>',
  },
  {
    id: 'i-light', name: 'Light fixture', category: 'electrical', unitSystem: 'imperial',
    tags: ['electrical', 'light', 'fixture'], scaleLabel: '',
    defaultWidth: 44, defaultHeight: 44, description: 'Ceiling light fixture.',
    svgBody: '<circle cx="22" cy="22" r="14"/><path d="M12 12 L32 32 M32 12 L12 32"/>',
  },
  {
    id: 'i-panel', name: 'Electrical panel', category: 'electrical', unitSystem: 'imperial',
    tags: ['electrical', 'panel', 'panelboard'], scaleLabel: '',
    defaultWidth: 50, defaultHeight: 70, description: 'Electrical panelboard.',
    svgBody: '<rect x="10" y="8" width="30" height="54"/><path d="M10 22 H40 M10 36 H40 M10 50 H40"/>',
  },

  // ── Plomberie / HVAC ──────────────────────────────────────────────────────
  {
    id: 'i-pipe', name: 'Pipe', category: 'plumbing', unitSystem: 'imperial',
    tags: ['plumbing', 'pipe'], scaleLabel: 'Ø 2″',
    defaultWidth: 120, defaultHeight: 24, description: 'Pipe (plan).',
    svgBody: '<path d="M6 8 H114 M6 16 H114"/>',
  },
  {
    id: 'i-floor-drain', name: 'Floor drain', category: 'plumbing', unitSystem: 'imperial',
    tags: ['plumbing', 'drain'], scaleLabel: '',
    defaultWidth: 44, defaultHeight: 44, description: 'Floor drain.',
    svgBody: '<rect x="8" y="8" width="28" height="28"/><path d="M8 8 L36 36 M36 8 L8 36"/>',
  },
  {
    id: 'i-duct', name: 'Duct', category: 'hvac', unitSystem: 'imperial',
    tags: ['hvac', 'duct'], scaleLabel: '12″×8″',
    defaultWidth: 120, defaultHeight: 44, description: 'Supply / return duct.',
    svgBody: '<rect x="6" y="8" width="108" height="28"/><path d="M6 8 L114 36" stroke-width="1"/>',
  },
  {
    id: 'i-diffuser', name: 'Diffuser', category: 'hvac', unitSystem: 'imperial',
    tags: ['hvac', 'diffuser', 'grille'], scaleLabel: '',
    defaultWidth: 56, defaultHeight: 56, description: 'Air diffuser / grille.',
    svgBody: '<rect x="8" y="8" width="40" height="40"/><path d="M8 18 H48 M8 28 H48 M8 38 H48"/>',
  },

  // ── Symboles ──────────────────────────────────────────────────────────────
  {
    id: 'i-north', name: 'North arrow', category: 'symbols', unitSystem: 'imperial',
    tags: ['symbol', 'north', 'orientation'], scaleLabel: 'N',
    defaultWidth: 50, defaultHeight: 64, description: 'North arrow.',
    svgBody: '<path d="M25 8 L33 44 L25 36 L17 44 Z" fill="#1f2937"/><text x="20" y="60" font-size="12" stroke="none" fill="#1f2937">N</text>',
  },
  {
    id: 'i-section', name: 'Section marker', category: 'symbols', unitSystem: 'imperial',
    tags: ['symbol', 'section', 'cut'], scaleLabel: 'A',
    defaultWidth: 60, defaultHeight: 40, description: 'Section cut marker.',
    svgBody: '<circle cx="16" cy="20" r="12"/><text x="11" y="25" font-size="13" stroke="none" fill="#1f2937">A</text><path d="M28 20 H52 M44 14 L52 20 L44 26" stroke-width="2"/>',
  },
  {
    id: 'i-grid-axis', name: 'Grid bubble', category: 'symbols', unitSystem: 'imperial',
    tags: ['symbol', 'grid', 'axis'], scaleLabel: 'A',
    defaultWidth: 44, defaultHeight: 60, description: 'Grid line bubble.',
    svgBody: '<circle cx="22" cy="16" r="13"/><text x="16" y="21" font-size="13" stroke="none" fill="#1f2937">A</text><path d="M22 29 V58" stroke-dasharray="5 4"/>',
  },
  {
    id: 'i-level', name: 'Level marker', category: 'symbols', unitSystem: 'imperial',
    tags: ['symbol', 'level', 'elevation'], scaleLabel: "0'-0\"",
    defaultWidth: 70, defaultHeight: 36, description: 'Level / elevation marker.',
    svgBody: '<path d="M10 22 L18 30 L26 22 Z" fill="#1f2937"/><path d="M18 30 V8 M28 12 H62"/>',
  },

  // ── Annotations ──────────────────────────────────────────────────────────
  {
    id: 'i-dim-line', name: 'Dimension', category: 'annotations', unitSystem: 'imperial',
    tags: ['annotation', 'dimension'], scaleLabel: '',
    defaultWidth: 120, defaultHeight: 30, description: 'Dimension line.',
    svgBody: '<path d="M10 15 H110 M10 8 V22 M110 8 V22 M6 11 L14 19 M106 11 L114 19" stroke-width="1.5"/>',
  },
  {
    id: 'i-leader', name: 'Leader', category: 'annotations', unitSystem: 'imperial',
    tags: ['annotation', 'leader', 'note'], scaleLabel: '',
    defaultWidth: 90, defaultHeight: 50, description: 'Leader line (note).',
    svgBody: '<path d="M8 42 L40 14 H82"/><path d="M8 42 L16 36 M8 42 L14 46" stroke-width="1.5"/>',
  },

  // ── Site / paysage ───────────────────────────────────────────────────────
  {
    id: 'i-site-tree', name: 'Tree', category: 'site', unitSystem: 'imperial',
    tags: ['site', 'tree'], scaleLabel: '',
    defaultWidth: 60, defaultHeight: 60, description: 'Tree (plan).',
    svgBody: '<circle cx="30" cy="30" r="24" stroke-dasharray="3 3"/><circle cx="30" cy="30" r="3" fill="#1f2937"/>',
  },
  {
    id: 'i-parking', name: 'Parking stall', category: 'site', unitSystem: 'imperial',
    tags: ['site', 'parking'], scaleLabel: "9'×18'",
    defaultWidth: 50, defaultHeight: 110, description: 'Parking stall.',
    svgBody: '<rect x="10" y="6" width="30" height="98"/>',
  },
  {
    id: 'i-shrub', name: 'Shrub', category: 'landscape', unitSystem: 'imperial',
    tags: ['landscape', 'shrub'], scaleLabel: '',
    defaultWidth: 56, defaultHeight: 56, description: 'Shrub / planting (plan).',
    svgBody: '<path d="M28 8 a10 10 0 0 1 14 10 a10 10 0 0 1 6 18 a10 10 0 0 1 -16 10 a10 10 0 0 1 -16 -10 a10 10 0 0 1 6 -18 a10 10 0 0 1 12 -10 Z"/>',
  },
]
