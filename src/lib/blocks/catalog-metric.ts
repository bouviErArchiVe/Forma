/**
 * Catalogue de blocs — système métrique.
 *
 * Symboles techniques schématiques (pas des détails normatifs exhaustifs).
 * Géométrie en coordonnées SVG dans le viewBox de chaque bloc. Base riche
 * mais raisonnable ; architecture extensible (ajouter une entrée suffit).
 */
import type { DrawingBlock } from './types'

export const METRIC_BLOCKS: DrawingBlock[] = [
  // ── Acier ────────────────────────────────────────────────────────────────
  {
    id: 'm-steel-w', name: 'Profilé W (poutre I)', category: 'steel', unitSystem: 'metric',
    tags: ['acier', 'poutre', 'i', 'w', 'profilé'], scaleLabel: 'W360',
    defaultWidth: 80, defaultHeight: 96, description: 'Profilé en I (poutre/colonne acier).',
    svgBody: '<path d="M14 10 H66 M14 86 H66 M40 10 V86" stroke-width="3"/>',
  },
  {
    id: 'm-steel-hss-rect', name: 'HSS rectangulaire', category: 'steel', unitSystem: 'metric',
    tags: ['acier', 'hss', 'tube', 'rectangulaire'], scaleLabel: 'HSS 100×50',
    defaultWidth: 90, defaultHeight: 60, description: 'Profilé tubulaire creux rectangulaire.',
    svgBody: '<rect x="8" y="8" width="74" height="44" rx="3"/><rect x="15" y="15" width="60" height="30" rx="2"/>',
  },
  {
    id: 'm-steel-hss-round', name: 'HSS circulaire', category: 'steel', unitSystem: 'metric',
    tags: ['acier', 'hss', 'tube', 'rond', 'circulaire'], scaleLabel: 'Ø 114',
    defaultWidth: 70, defaultHeight: 70, description: 'Profilé tubulaire creux circulaire.',
    svgBody: '<circle cx="35" cy="35" r="28"/><circle cx="35" cy="35" r="21"/>',
  },
  {
    id: 'm-steel-angle', name: 'Cornière (L)', category: 'steel', unitSystem: 'metric',
    tags: ['acier', 'cornière', 'angle', 'l'], scaleLabel: 'L 75×75',
    defaultWidth: 70, defaultHeight: 70, description: 'Cornière à ailes égales.',
    svgBody: '<path d="M14 10 V60 H62 V52 H22 V10 Z"/>',
  },
  {
    id: 'm-steel-channel', name: 'Profilé U (C)', category: 'steel', unitSystem: 'metric',
    tags: ['acier', 'u', 'c', 'channel'], scaleLabel: 'C 150',
    defaultWidth: 60, defaultHeight: 90, description: 'Profilé en U.',
    svgBody: '<path d="M44 10 H16 V80 H44 M16 45 H40"/>',
  },
  {
    id: 'm-steel-plate', name: 'Plaque acier', category: 'steel', unitSystem: 'metric',
    tags: ['acier', 'plaque', 'platine'], scaleLabel: 'PL 200×10',
    defaultWidth: 110, defaultHeight: 36, description: 'Plaque / platine acier.',
    svgBody: '<rect x="6" y="8" width="98" height="20"/><circle cx="22" cy="18" r="2.5"/><circle cx="88" cy="18" r="2.5"/>',
  },

  // ── Bois ─────────────────────────────────────────────────────────────────
  {
    id: 'm-wood-stud', name: 'Montant 38×89', category: 'wood', unitSystem: 'metric',
    tags: ['bois', 'montant', 'ossature', '38x89'], scaleLabel: '38×89',
    defaultWidth: 40, defaultHeight: 90, description: 'Montant d’ossature bois.',
    svgBody: '<rect x="8" y="8" width="24" height="74"/><path d="M8 8 L32 82 M32 8 L8 82" stroke-width="1"/>',
  },
  {
    id: 'm-wood-joist', name: 'Solive', category: 'wood', unitSystem: 'metric',
    tags: ['bois', 'solive', 'plancher'], scaleLabel: '38×235',
    defaultWidth: 40, defaultHeight: 120, description: 'Solive de plancher.',
    svgBody: '<rect x="10" y="6" width="20" height="108"/>',
  },
  {
    id: 'm-wood-beam', name: 'Poutre bois', category: 'wood', unitSystem: 'metric',
    tags: ['bois', 'poutre', 'lvl', 'glulam'], scaleLabel: '130×300',
    defaultWidth: 60, defaultHeight: 120, description: 'Poutre bois (LVL / lamellé-collé).',
    svgBody: '<rect x="10" y="8" width="40" height="104"/><path d="M10 32 H50 M10 56 H50 M10 80 H50" stroke-width="1"/>',
  },
  {
    id: 'm-wood-panel', name: 'Panneau / contreplaqué', category: 'wood', unitSystem: 'metric',
    tags: ['bois', 'panneau', 'contreplaqué', 'osb', 'clt'], scaleLabel: '1220×2440',
    defaultWidth: 110, defaultHeight: 70, description: 'Panneau dérivé du bois.',
    svgBody: '<rect x="8" y="8" width="94" height="54"/><path d="M8 20 H102 M8 32 H102 M8 44 H102" stroke-width="1"/>',
  },

  // ── Béton ────────────────────────────────────────────────────────────────
  {
    id: 'm-concrete-slab', name: 'Dalle béton', category: 'concrete', unitSystem: 'metric',
    tags: ['béton', 'dalle', 'plancher'], scaleLabel: 'ép. 200',
    defaultWidth: 130, defaultHeight: 36, description: 'Dalle de béton (coupe).',
    svgBody: '<rect x="6" y="8" width="118" height="20"/><circle cx="20" cy="18" r="1.6"/><circle cx="40" cy="18" r="1.6"/><circle cx="60" cy="18" r="1.6"/><circle cx="80" cy="18" r="1.6"/><circle cx="100" cy="18" r="1.6"/>',
  },
  {
    id: 'm-concrete-footing', name: 'Semelle filante', category: 'concrete', unitSystem: 'metric',
    tags: ['béton', 'semelle', 'fondation'], scaleLabel: '600×300',
    defaultWidth: 110, defaultHeight: 90, description: 'Semelle filante (coupe).',
    svgBody: '<path d="M44 8 H66 V52 H104 V82 H6 V52 H44 Z"/>',
  },
  {
    id: 'm-concrete-column', name: 'Poteau béton', category: 'concrete', unitSystem: 'metric',
    tags: ['béton', 'poteau', 'colonne'], scaleLabel: '400×400',
    defaultWidth: 70, defaultHeight: 70, description: 'Poteau béton avec armatures (coupe).',
    svgBody: '<rect x="10" y="10" width="50" height="50" rx="2"/><circle cx="20" cy="20" r="2.5"/><circle cx="50" cy="20" r="2.5"/><circle cx="20" cy="50" r="2.5"/><circle cx="50" cy="50" r="2.5"/>',
  },
  {
    id: 'm-concrete-wall', name: 'Mur béton', category: 'concrete', unitSystem: 'metric',
    tags: ['béton', 'mur', 'voile'], scaleLabel: 'ép. 200',
    defaultWidth: 40, defaultHeight: 120, description: 'Voile / mur béton (coupe).',
    svgBody: '<rect x="12" y="8" width="16" height="104"/><path d="M20 8 V112" stroke-width="1" stroke-dasharray="4 4"/>',
  },

  // ── Maçonnerie ─────────────────────────────────────────────────────────────
  {
    id: 'm-cmu', name: 'Bloc de béton (CMU)', category: 'masonry', unitSystem: 'metric',
    tags: ['maçonnerie', 'bloc', 'cmu', 'parpaing'], scaleLabel: '190×190×390',
    defaultWidth: 110, defaultHeight: 56, description: 'Bloc de béton creux.',
    svgBody: '<rect x="6" y="8" width="98" height="40"/><rect x="16" y="16" width="32" height="24"/><rect x="62" y="16" width="32" height="24"/>',
  },
  {
    id: 'm-brick', name: 'Brique', category: 'masonry', unitSystem: 'metric',
    tags: ['maçonnerie', 'brique'], scaleLabel: '57×90×190',
    defaultWidth: 100, defaultHeight: 36, description: 'Brique de parement.',
    svgBody: '<rect x="6" y="8" width="88" height="20"/><path d="M40 8 V28 M67 8 V28" stroke-width="1"/>',
  },
  {
    id: 'm-masonry-wall', name: 'Mur de maçonnerie', category: 'masonry', unitSystem: 'metric',
    tags: ['maçonnerie', 'mur', 'hachure'], scaleLabel: 'ép. 200',
    defaultWidth: 44, defaultHeight: 120, description: 'Mur maçonné (hachure diagonale).',
    svgBody: '<rect x="12" y="8" width="20" height="104"/><path d="M12 24 L32 8 M12 44 L32 28 M12 64 L32 48 M12 84 L32 68 M12 104 L32 88" stroke-width="1"/>',
  },

  // ── Portes / fenêtres ───────────────────────────────────────────────────────
  {
    id: 'm-door-single', name: 'Porte simple', category: 'doors-windows', unitSystem: 'metric',
    tags: ['porte', 'simple', 'battant'], scaleLabel: '900',
    defaultWidth: 90, defaultHeight: 90, description: 'Porte battante simple (plan).',
    svgBody: '<path d="M12 82 V12" stroke-width="3"/><path d="M12 12 H78" /><path d="M78 12 A66 66 0 0 1 12 78" stroke-dasharray="4 4"/>',
  },
  {
    id: 'm-door-double', name: 'Porte double', category: 'doors-windows', unitSystem: 'metric',
    tags: ['porte', 'double'], scaleLabel: '1800',
    defaultWidth: 120, defaultHeight: 70, description: 'Porte double (plan).',
    svgBody: '<path d="M10 60 V18 M110 60 V18" stroke-width="3"/><path d="M10 18 A42 42 0 0 1 52 60" stroke-dasharray="4 4"/><path d="M110 18 A42 42 0 0 0 68 60" stroke-dasharray="4 4"/>',
  },
  {
    id: 'm-door-sliding', name: 'Porte coulissante', category: 'doors-windows', unitSystem: 'metric',
    tags: ['porte', 'coulissante'], scaleLabel: '1500',
    defaultWidth: 120, defaultHeight: 40, description: 'Porte coulissante (plan).',
    svgBody: '<path d="M8 14 H112 M8 26 H112" /><rect x="14" y="10" width="50" height="8"/><rect x="56" y="22" width="50" height="8"/>',
  },
  {
    id: 'm-window', name: 'Fenêtre', category: 'doors-windows', unitSystem: 'metric',
    tags: ['fenêtre', 'window'], scaleLabel: '1200',
    defaultWidth: 110, defaultHeight: 30, description: 'Fenêtre (plan, coupe de mur).',
    svgBody: '<rect x="6" y="6" width="98" height="18"/><path d="M6 15 H104" /><path d="M55 6 V24"/>',
  },
  {
    id: 'm-bay', name: 'Baie vitrée', category: 'doors-windows', unitSystem: 'metric',
    tags: ['baie', 'vitrée', 'ouverture'], scaleLabel: '2400',
    defaultWidth: 130, defaultHeight: 30, description: 'Grande baie (plan).',
    svgBody: '<rect x="6" y="8" width="118" height="14"/><path d="M38 8 V22 M71 8 V22 M104 8 V22"/>',
  },

  // ── Escaliers ──────────────────────────────────────────────────────────────
  {
    id: 'm-stair-straight', name: 'Escalier droit', category: 'stairs', unitSystem: 'metric',
    tags: ['escalier', 'droit', 'montée'], scaleLabel: '',
    defaultWidth: 70, defaultHeight: 120, description: 'Escalier droit (plan) avec flèche de montée.',
    svgBody: '<rect x="14" y="8" width="42" height="104"/><path d="M14 24 H56 M14 40 H56 M14 56 H56 M14 72 H56 M14 88 H56"/><path d="M35 100 V20 M30 28 L35 18 L40 28" stroke-width="2"/>',
  },
  {
    id: 'm-stair-quarter', name: 'Escalier quart tournant', category: 'stairs', unitSystem: 'metric',
    tags: ['escalier', 'quart', 'tournant'], scaleLabel: '',
    defaultWidth: 100, defaultHeight: 100, description: 'Escalier quart tournant (plan).',
    svgBody: '<path d="M10 90 H90 V10" /><path d="M26 90 V58 M42 90 V58 M58 90 V42 M90 58 H58 M90 42 H42 M90 26 H26" /><path d="M18 80 L18 30 L74 30 M22 38 L18 28 L14 38" stroke-width="2"/>',
  },
  {
    id: 'm-up-arrow', name: 'Flèche montée', category: 'stairs', unitSystem: 'metric',
    tags: ['flèche', 'montée', 'up'], scaleLabel: 'UP',
    defaultWidth: 30, defaultHeight: 90, description: 'Flèche de montée.',
    svgBody: '<path d="M15 84 V14 M7 26 L15 10 L23 26" stroke-width="2.5"/>',
  },
  {
    id: 'm-guardrail', name: 'Garde-corps', category: 'stairs', unitSystem: 'metric',
    tags: ['garde-corps', 'rampe', 'barreaux'], scaleLabel: 'h 1070',
    defaultWidth: 120, defaultHeight: 60, description: 'Garde-corps à barreaux (élévation).',
    svgBody: '<path d="M6 12 H114 M6 50 H114" stroke-width="2.5"/><path d="M20 12 V50 M40 12 V50 M60 12 V50 M80 12 V50 M100 12 V50"/>',
  },

  // ── Mobilier ──────────────────────────────────────────────────────────────
  {
    id: 'm-table', name: 'Table', category: 'furniture', unitSystem: 'metric',
    tags: ['mobilier', 'table'], scaleLabel: '1600×800',
    defaultWidth: 120, defaultHeight: 70, description: 'Table (plan).',
    svgBody: '<rect x="8" y="10" width="104" height="50" rx="3"/>',
  },
  {
    id: 'm-chair', name: 'Chaise', category: 'furniture', unitSystem: 'metric',
    tags: ['mobilier', 'chaise'], scaleLabel: '450×450',
    defaultWidth: 50, defaultHeight: 54, description: 'Chaise (plan).',
    svgBody: '<rect x="10" y="14" width="30" height="30" rx="3"/><path d="M10 14 H40 V10 H10 Z"/>',
  },
  {
    id: 'm-desk', name: 'Bureau', category: 'furniture', unitSystem: 'metric',
    tags: ['mobilier', 'bureau'], scaleLabel: '1400×700',
    defaultWidth: 120, defaultHeight: 64, description: 'Bureau (plan).',
    svgBody: '<rect x="8" y="10" width="104" height="44" rx="2"/><rect x="80" y="14" width="28" height="36"/>',
  },
  {
    id: 'm-bed', name: 'Lit double', category: 'furniture', unitSystem: 'metric',
    tags: ['mobilier', 'lit'], scaleLabel: '1600×2000',
    defaultWidth: 90, defaultHeight: 120, description: 'Lit double (plan).',
    svgBody: '<rect x="10" y="10" width="70" height="100" rx="4"/><path d="M10 38 H80"/><rect x="18" y="16" width="24" height="16" rx="2"/><rect x="48" y="16" width="24" height="16" rx="2"/>',
  },
  {
    id: 'm-sofa', name: 'Canapé', category: 'furniture', unitSystem: 'metric',
    tags: ['mobilier', 'canapé', 'sofa'], scaleLabel: '2000×900',
    defaultWidth: 120, defaultHeight: 60, description: 'Canapé (plan).',
    svgBody: '<rect x="8" y="14" width="104" height="40" rx="6"/><path d="M8 24 H112"/><path d="M30 24 V54 M86 24 V54"/>',
  },
  {
    id: 'm-wardrobe', name: 'Armoire', category: 'furniture', unitSystem: 'metric',
    tags: ['mobilier', 'armoire', 'placard'], scaleLabel: '1200×600',
    defaultWidth: 110, defaultHeight: 50, description: 'Armoire (plan).',
    svgBody: '<rect x="8" y="10" width="94" height="34"/><path d="M55 10 V44 M30 27 L36 22 M80 27 L74 22"/>',
  },

  // ── Sanitaire ────────────────────────────────────────────────────────────
  {
    id: 'm-wc', name: 'WC', category: 'sanitary', unitSystem: 'metric',
    tags: ['sanitaire', 'wc', 'toilette'], scaleLabel: '',
    defaultWidth: 50, defaultHeight: 70, description: 'Cuvette WC (plan).',
    svgBody: '<rect x="14" y="6" width="22" height="14" rx="2"/><ellipse cx="25" cy="44" rx="17" ry="22"/>',
  },
  {
    id: 'm-sink', name: 'Lavabo', category: 'sanitary', unitSystem: 'metric',
    tags: ['sanitaire', 'lavabo', 'vasque'], scaleLabel: '',
    defaultWidth: 60, defaultHeight: 50, description: 'Lavabo (plan).',
    svgBody: '<rect x="8" y="8" width="44" height="36" rx="4"/><ellipse cx="30" cy="28" rx="14" ry="10"/><circle cx="30" cy="13" r="2"/>',
  },
  {
    id: 'm-shower', name: 'Douche', category: 'sanitary', unitSystem: 'metric',
    tags: ['sanitaire', 'douche'], scaleLabel: '900×900',
    defaultWidth: 70, defaultHeight: 70, description: 'Receveur de douche (plan).',
    svgBody: '<rect x="8" y="8" width="54" height="54"/><path d="M8 8 L62 62"/><circle cx="50" cy="20" r="3"/>',
  },
  {
    id: 'm-bath', name: 'Baignoire', category: 'sanitary', unitSystem: 'metric',
    tags: ['sanitaire', 'baignoire', 'bain'], scaleLabel: '1700×750',
    defaultWidth: 120, defaultHeight: 56, description: 'Baignoire (plan).',
    svgBody: '<rect x="6" y="8" width="108" height="40" rx="8"/><rect x="14" y="14" width="84" height="28" rx="6"/><circle cx="92" cy="28" r="2.5"/>',
  },
  {
    id: 'm-kitchen-sink', name: 'Évier', category: 'sanitary', unitSystem: 'metric',
    tags: ['sanitaire', 'évier', 'cuisine'], scaleLabel: '',
    defaultWidth: 90, defaultHeight: 56, description: 'Évier double bac (plan).',
    svgBody: '<rect x="8" y="8" width="74" height="40" rx="3"/><rect x="14" y="14" width="28" height="28" rx="2"/><rect x="48" y="14" width="28" height="28" rx="2"/>',
  },

  // ── Électrique ──────────────────────────────────────────────────────────────
  {
    id: 'm-outlet', name: 'Prise', category: 'electrical', unitSystem: 'metric',
    tags: ['électrique', 'prise'], scaleLabel: '',
    defaultWidth: 44, defaultHeight: 44, description: 'Prise de courant.',
    svgBody: '<circle cx="22" cy="22" r="16"/><path d="M22 6 V14"/><circle cx="17" cy="24" r="2"/><circle cx="27" cy="24" r="2"/>',
  },
  {
    id: 'm-switch', name: 'Interrupteur', category: 'electrical', unitSystem: 'metric',
    tags: ['électrique', 'interrupteur'], scaleLabel: '',
    defaultWidth: 44, defaultHeight: 44, description: 'Interrupteur.',
    svgBody: '<circle cx="22" cy="22" r="16"/><path d="M22 22 L33 11"/><text x="6" y="40" font-size="10" stroke="none" fill="#1f2937">S</text>',
  },
  {
    id: 'm-light', name: 'Luminaire', category: 'electrical', unitSystem: 'metric',
    tags: ['électrique', 'luminaire', 'plafonnier'], scaleLabel: '',
    defaultWidth: 44, defaultHeight: 44, description: 'Point lumineux.',
    svgBody: '<circle cx="22" cy="22" r="14"/><path d="M12 12 L32 32 M32 12 L12 32"/>',
  },
  {
    id: 'm-panel', name: 'Panneau électrique', category: 'electrical', unitSystem: 'metric',
    tags: ['électrique', 'panneau', 'tableau'], scaleLabel: '',
    defaultWidth: 50, defaultHeight: 70, description: 'Panneau / tableau électrique.',
    svgBody: '<rect x="10" y="8" width="30" height="54"/><path d="M10 22 H40 M10 36 H40 M10 50 H40"/>',
  },

  // ── Plomberie ────────────────────────────────────────────────────────────
  {
    id: 'm-pipe', name: 'Conduite', category: 'plumbing', unitSystem: 'metric',
    tags: ['plomberie', 'conduite', 'tuyau'], scaleLabel: 'Ø 50',
    defaultWidth: 120, defaultHeight: 24, description: 'Conduite (plan).',
    svgBody: '<path d="M6 8 H114 M6 16 H114"/>',
  },
  {
    id: 'm-floor-drain', name: 'Avaloir de sol', category: 'plumbing', unitSystem: 'metric',
    tags: ['plomberie', 'drain', 'avaloir'], scaleLabel: '',
    defaultWidth: 44, defaultHeight: 44, description: 'Avaloir / drain de sol.',
    svgBody: '<rect x="8" y="8" width="28" height="28"/><path d="M8 8 L36 36 M36 8 L8 36"/>',
  },
  {
    id: 'm-water-heater', name: 'Chauffe-eau', category: 'plumbing', unitSystem: 'metric',
    tags: ['plomberie', 'chauffe-eau', 'ballon'], scaleLabel: '',
    defaultWidth: 56, defaultHeight: 56, description: 'Chauffe-eau (plan).',
    svgBody: '<circle cx="28" cy="28" r="22"/><text x="20" y="33" font-size="12" stroke="none" fill="#1f2937">CE</text>',
  },

  // ── CVC / HVAC ───────────────────────────────────────────────────────────
  {
    id: 'm-duct', name: 'Conduit (gaine)', category: 'hvac', unitSystem: 'metric',
    tags: ['hvac', 'cvc', 'conduit', 'gaine'], scaleLabel: '300×200',
    defaultWidth: 120, defaultHeight: 44, description: 'Conduit de ventilation.',
    svgBody: '<rect x="6" y="8" width="108" height="28"/><path d="M6 8 L114 36" stroke-width="1"/>',
  },
  {
    id: 'm-grille', name: 'Grille de ventilation', category: 'hvac', unitSystem: 'metric',
    tags: ['hvac', 'cvc', 'grille', 'bouche'], scaleLabel: '',
    defaultWidth: 56, defaultHeight: 56, description: 'Grille / diffuseur.',
    svgBody: '<rect x="8" y="8" width="40" height="40"/><path d="M8 18 H48 M8 28 H48 M8 38 H48"/>',
  },
  {
    id: 'm-ahu', name: 'Appareil mécanique', category: 'hvac', unitSystem: 'metric',
    tags: ['hvac', 'cvc', 'unité', 'cta'], scaleLabel: '',
    defaultWidth: 100, defaultHeight: 64, description: 'Unité de traitement d’air.',
    svgBody: '<rect x="8" y="8" width="84" height="48" rx="2"/><circle cx="32" cy="32" r="14"/><path d="M32 18 V46 M18 32 H46"/>',
  },

  // ── Symboles ──────────────────────────────────────────────────────────────
  {
    id: 'm-north', name: 'Nord', category: 'symbols', unitSystem: 'metric',
    tags: ['symbole', 'nord', 'orientation'], scaleLabel: 'N',
    defaultWidth: 50, defaultHeight: 64, description: 'Flèche du nord.',
    svgBody: '<path d="M25 8 L33 44 L25 36 L17 44 Z" fill="#1f2937"/><text x="20" y="60" font-size="12" stroke="none" fill="#1f2937">N</text>',
  },
  {
    id: 'm-section', name: 'Repère de coupe', category: 'symbols', unitSystem: 'metric',
    tags: ['symbole', 'coupe', 'section'], scaleLabel: 'A',
    defaultWidth: 60, defaultHeight: 40, description: 'Repère de coupe.',
    svgBody: '<circle cx="16" cy="20" r="12"/><text x="11" y="25" font-size="13" stroke="none" fill="#1f2937">A</text><path d="M28 20 H52 M44 14 L52 20 L44 26" stroke-width="2"/>',
  },
  {
    id: 'm-elevation', name: 'Repère d’élévation', category: 'symbols', unitSystem: 'metric',
    tags: ['symbole', 'élévation'], scaleLabel: '',
    defaultWidth: 44, defaultHeight: 44, description: 'Repère d’élévation intérieure.',
    svgBody: '<path d="M22 6 L38 22 L22 38 L6 22 Z"/><path d="M22 22 L30 14 L36 20" stroke-width="1.5"/>',
  },
  {
    id: 'm-level', name: 'Niveau', category: 'symbols', unitSystem: 'metric',
    tags: ['symbole', 'niveau', 'altitude'], scaleLabel: '± 0.00',
    defaultWidth: 70, defaultHeight: 36, description: 'Repère de niveau.',
    svgBody: '<path d="M10 22 L18 30 L26 22 Z" fill="#1f2937"/><path d="M18 30 V8 M28 12 H62"/>',
  },
  {
    id: 'm-grid-axis', name: 'Axe (file)', category: 'symbols', unitSystem: 'metric',
    tags: ['symbole', 'axe', 'file', 'trame'], scaleLabel: '1',
    defaultWidth: 44, defaultHeight: 60, description: 'Repère d’axe / file de trame.',
    svgBody: '<circle cx="22" cy="16" r="13"/><text x="17" y="21" font-size="13" stroke="none" fill="#1f2937">1</text><path d="M22 29 V58" stroke-dasharray="5 4"/>',
  },
  {
    id: 'm-callout', name: 'Repère / bulle', category: 'symbols', unitSystem: 'metric',
    tags: ['symbole', 'repère', 'détail', 'bulle'], scaleLabel: '',
    defaultWidth: 50, defaultHeight: 50, description: 'Bulle de repère de détail.',
    svgBody: '<circle cx="25" cy="25" r="18"/><path d="M7 25 H43"/>',
  },

  // ── Annotations ──────────────────────────────────────────────────────────
  {
    id: 'm-dim-line', name: 'Cote', category: 'annotations', unitSystem: 'metric',
    tags: ['annotation', 'cote', 'dimension'], scaleLabel: '',
    defaultWidth: 120, defaultHeight: 30, description: 'Ligne de cote.',
    svgBody: '<path d="M10 15 H110 M10 8 V22 M110 8 V22 M6 11 L14 19 M106 11 L114 19" stroke-width="1.5"/>',
  },
  {
    id: 'm-leader', name: 'Ligne de renvoi', category: 'annotations', unitSystem: 'metric',
    tags: ['annotation', 'renvoi', 'leader'], scaleLabel: '',
    defaultWidth: 90, defaultHeight: 50, description: 'Ligne de renvoi (annotation).',
    svgBody: '<path d="M8 42 L40 14 H82" /><path d="M8 42 L16 36 M8 42 L14 46" stroke-width="1.5"/>',
  },

  // ── Site ───────────────────────────────────────────────────────────────────
  {
    id: 'm-site-tree', name: 'Arbre', category: 'site', unitSystem: 'metric',
    tags: ['site', 'arbre', 'végétation'], scaleLabel: '',
    defaultWidth: 60, defaultHeight: 60, description: 'Arbre (plan).',
    svgBody: '<circle cx="30" cy="30" r="24" stroke-dasharray="3 3"/><circle cx="30" cy="30" r="3" fill="#1f2937"/>',
  },
  {
    id: 'm-site-parking', name: 'Place de stationnement', category: 'site', unitSystem: 'metric',
    tags: ['site', 'stationnement', 'parking'], scaleLabel: '2600×5500',
    defaultWidth: 50, defaultHeight: 110, description: 'Place de stationnement.',
    svgBody: '<rect x="10" y="6" width="30" height="98"/>',
  },

  // ── Paysage ────────────────────────────────────────────────────────────────
  {
    id: 'm-shrub', name: 'Arbuste', category: 'landscape', unitSystem: 'metric',
    tags: ['paysage', 'arbuste', 'massif'], scaleLabel: '',
    defaultWidth: 56, defaultHeight: 56, description: 'Arbuste / massif (plan).',
    svgBody: '<path d="M28 8 a10 10 0 0 1 14 10 a10 10 0 0 1 6 18 a10 10 0 0 1 -16 10 a10 10 0 0 1 -16 -10 a10 10 0 0 1 6 -18 a10 10 0 0 1 12 -10 Z"/>',
  },
  {
    id: 'm-grass', name: 'Surface engazonnée', category: 'landscape', unitSystem: 'metric',
    tags: ['paysage', 'gazon', 'pelouse'], scaleLabel: '',
    defaultWidth: 80, defaultHeight: 40, description: 'Zone engazonnée (symbole).',
    svgBody: '<path d="M14 32 V20 M20 32 V16 M26 32 V20 M40 32 V16 M46 32 V22 M52 32 V16 M64 32 V20 M70 32 V16" stroke-width="1.5"/>',
  },
]
