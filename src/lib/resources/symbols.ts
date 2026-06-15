/**
 * Bibliothèque de symboles techniques (Pack A — A4).
 *
 * Chaque symbole est un dessin vectoriel dans un viewBox carré (64×64),
 * en géométrie explicite — comme les détails et les hachures — afin de
 * traverser sans risque le pipeline bloc existant
 * (`SVG → blockToSvg → raster HD → asset Dexie → ImageElement`). Aucune
 * modification du canvas n'est nécessaire.
 *
 * Insérables dans un dessin (bibliothèque de blocs, onglet « Symboles ») et
 * consultables dans Ressources. Catégories : architecture, structure,
 * mécanique/plomberie, électricité, annotation/chantier.
 */
import type { DrawingBlock } from '../blocks/types'
import { buildSearchText, type GraphicResource } from './resourceTypes'
import { resourceToBlock } from './resourceToBlock'

export type SymbolCategory =
  | 'architecture'
  | 'structure'
  | 'mecanique'
  | 'electricite'
  | 'annotation'

export const SYMBOL_CATEGORY_LABELS: Record<SymbolCategory, string> = {
  architecture: 'Architecture',
  structure: 'Structure',
  mecanique: 'Mécanique / Plomberie',
  electricite: 'Électricité',
  annotation: 'Annotation / Chantier',
}

export interface TechnicalSymbol {
  id: string
  name: string
  category: SymbolCategory
  description: string
  tags: string[]
  /** Corps SVG (géométrie, sans balise <svg>) dessiné dans `viewBox`. */
  svg: string
  /** viewBox du dessin (carré : « 0 0 64 64 »). */
  viewBox: string
  /** Taille d'insertion par défaut (px canvas). */
  defaultSize: number
  /** Épaisseur de trait indicative (le pipeline applique 2 par défaut). */
  strokeWidth?: number
}

export const SYMBOL_DISCLAIMER =
  'Symbole schématique indicatif — la convention graphique peut varier selon le bureau, la discipline et la norme.'

const VB = '0 0 64 64'
const SZ = 64

function sym(
  id: string,
  category: SymbolCategory,
  name: string,
  description: string,
  tags: string[],
  svg: string,
): TechnicalSymbol {
  return { id, name, category, description, tags, svg, viewBox: VB, defaultSize: SZ }
}

export const SYMBOLS: TechnicalSymbol[] = [
  // ─── Architecture ────────────────────────────────────────────────────────────
  sym('sym-nord', 'architecture', 'Flèche Nord', 'Indique l’orientation (nord) du plan.', ['nord', 'north', 'orientation', 'boussole'],
    '<path d="M32 54 V14" stroke-width="2"/><path d="M32 10 l7 14 l-7 -5 l-7 5 Z" fill="currentColor" stroke="none"/><text x="32" y="62" font-size="11" text-anchor="middle" fill="currentColor" stroke="none">N</text>'),
  sym('sym-coupe', 'architecture', 'Repère de coupe', 'Marque une ligne de coupe et la direction de vue.', ['coupe', 'section', 'repère'],
    '<circle cx="20" cy="20" r="11" stroke-width="2"/><text x="20" y="24" font-size="11" text-anchor="middle" fill="currentColor" stroke="none">A</text><path d="M20 31 V52 H44" stroke-width="2"/><path d="M44 52 l-12 -5 v10 Z" fill="currentColor" stroke="none"/>'),
  sym('sym-elevation', 'architecture', 'Repère d’élévation', 'Marque une élévation et sa direction de vue.', ['élévation', 'elevation', 'repère', 'vue'],
    '<path d="M32 14 a14 14 0 0 1 0 28 a14 14 0 0 1 0 -28 Z" fill="currentColor" stroke="none" opacity="0.18"/><circle cx="32" cy="28" r="14" stroke-width="2"/><path d="M18 28 H46" stroke-width="1.5"/><path d="M32 50 l-7 -10 h14 Z" fill="currentColor" stroke="none"/><text x="32" y="25" font-size="9" text-anchor="middle" fill="currentColor" stroke="none">1</text>'),
  sym('sym-detail', 'architecture', 'Repère de détail', 'Encercle une zone agrandie en détail.', ['détail', 'detail', 'agrandissement', 'bulle'],
    '<circle cx="34" cy="30" r="14" stroke-width="2" stroke-dasharray="3 3"/><text x="34" y="34" font-size="12" text-anchor="middle" fill="currentColor" stroke="none">1</text><path d="M20 44 L8 56" stroke-width="1.5"/>'),
  sym('sym-niveau', 'architecture', 'Niveau (datum)', 'Repère de niveau / ligne de référence altimétrique.', ['niveau', 'datum', 'altitude', 'référence'],
    '<path d="M8 30 H56" stroke-width="2"/><path d="M32 30 l-8 12 h16 Z" stroke-width="1.5"/><path d="M32 30 l-8 12 h8 Z" fill="currentColor" stroke="none"/><text x="32" y="20" font-size="9" text-anchor="middle" fill="currentColor" stroke="none">0.00</text>'),
  sym('sym-axe', 'architecture', 'Axe / Repère de grille', 'Bulle d’axe structural avec ligne d’axe.', ['axe', 'grille', 'grid', 'trame', 'repère'],
    '<path d="M32 6 V20 M32 44 V58" stroke-width="1.2" stroke-dasharray="6 3 1 3"/><circle cx="32" cy="32" r="12" stroke-width="2"/><text x="32" y="36" font-size="12" text-anchor="middle" fill="currentColor" stroke="none">A</text>'),
  sym('sym-grille', 'architecture', 'Grille structurale', 'Trame d’axes (grille de poteaux).', ['grille', 'grid', 'trame', 'axes'],
    '<path d="M16 8 V56 M32 8 V56 M48 8 V56 M8 16 H56 M8 32 H56 M8 48 H56" stroke-width="1.2"/>'),
  sym('sym-cote-niveau', 'architecture', 'Cote de niveau', 'Cote ponctuelle d’altitude (spot level).', ['cote', 'niveau', 'spot', 'altitude'],
    '<path d="M32 40 l-7 -10 h14 Z" stroke-width="1.5"/><path d="M32 40 l-7 -10 h7 Z" fill="currentColor" stroke="none"/><path d="M25 22 H47" stroke-width="1.5"/><text x="36" y="19" font-size="9" text-anchor="middle" fill="currentColor" stroke="none">+2.40</text>'),
  sym('sym-porte', 'architecture', 'Porte (plan)', 'Symbole de porte avec débattement.', ['porte', 'door', 'plan', 'battant'],
    '<path d="M16 48 V20" stroke-width="2"/><path d="M16 20 H44" stroke-width="2"/><path d="M16 48 A28 28 0 0 0 44 20" stroke-width="1.3"/>'),
  sym('sym-fenetre', 'architecture', 'Fenêtre (plan)', 'Symbole de fenêtre dans un mur.', ['fenêtre', 'window', 'plan', 'baie'],
    '<rect x="10" y="26" width="44" height="12" stroke-width="1.6"/><path d="M10 32 H54" stroke-width="1.2"/>'),
  sym('sym-mur-existant', 'architecture', 'Mur existant', 'Mur conservé (existant) — hachure légère.', ['mur', 'existant', 'conservé', 'existing'],
    '<rect x="10" y="24" width="44" height="16" stroke-width="1.6"/><path d="M14 40 L22 24 M22 40 L30 24 M30 40 L38 24 M38 40 L46 24 M46 40 L54 24" stroke-width="0.8"/>'),
  sym('sym-mur-demoli', 'architecture', 'Mur démoli', 'Mur à démolir — contour pointillé.', ['mur', 'démoli', 'démolition', 'demo'],
    '<rect x="10" y="24" width="44" height="16" stroke-width="1.6" stroke-dasharray="4 3"/><path d="M14 24 L54 40 M54 24 L14 40" stroke-width="1" stroke-dasharray="4 3"/>'),
  sym('sym-mur-nouveau', 'architecture', 'Mur nouveau', 'Mur à construire (nouveau) — plein.', ['mur', 'nouveau', 'construire', 'new'],
    '<rect x="10" y="24" width="44" height="16" fill="currentColor" stroke="none"/>'),

  // ─── Structure ───────────────────────────────────────────────────────────────
  sym('sym-poteau-acier', 'structure', 'Poteau acier (H)', 'Section de poteau acier en H/I.', ['poteau', 'acier', 'colonne', 'profilé', 'h'],
    '<path d="M20 16 H44 M20 48 H44 M32 16 V48" stroke-width="3"/>'),
  sym('sym-poteau-beton', 'structure', 'Poteau béton', 'Section de poteau béton armé.', ['poteau', 'béton', 'colonne', 'armé'],
    '<rect x="16" y="16" width="32" height="32" stroke-width="2"/><circle cx="22" cy="22" r="2" fill="currentColor" stroke="none"/><circle cx="42" cy="22" r="2" fill="currentColor" stroke="none"/><circle cx="22" cy="42" r="2" fill="currentColor" stroke="none"/><circle cx="42" cy="42" r="2" fill="currentColor" stroke="none"/>'),
  sym('sym-poutre-acier', 'structure', 'Poutre acier (I)', 'Profilé de poutre acier en I (élévation).', ['poutre', 'acier', 'profilé', 'i', 'w'],
    '<path d="M12 20 H52 M12 44 H52 M32 20 V44" stroke-width="3"/>'),
  sym('sym-poutre-bois', 'structure', 'Poutre bois', 'Section de poutre en bois (diagonale).', ['poutre', 'bois', 'madrier', 'wood'],
    '<rect x="14" y="22" width="36" height="20" stroke-width="2"/><path d="M14 42 L50 22" stroke-width="1.3"/>'),
  sym('sym-dalle-beton', 'structure', 'Dalle béton', 'Coupe de dalle de béton.', ['dalle', 'béton', 'plancher', 'slab'],
    '<rect x="8" y="26" width="48" height="14" stroke-width="2"/><g fill="currentColor" stroke="none"><circle cx="16" cy="33" r="1.4"/><circle cx="28" cy="31" r="1.4"/><circle cx="40" cy="35" r="1.4"/><circle cx="48" cy="32" r="1.4"/></g>'),
  sym('sym-appui', 'structure', 'Appui (articulé)', 'Appui simple / articulé sur sol.', ['appui', 'support', 'articulé', 'pin'],
    '<path d="M32 16 L20 40 H44 Z" stroke-width="2"/><path d="M14 40 H50" stroke-width="2"/><path d="M16 40 l-4 6 M24 40 l-4 6 M32 40 l-4 6 M40 40 l-4 6 M48 40 l-4 6" stroke-width="1"/>'),
  sym('sym-ancrage', 'structure', 'Ancrage', 'Tige d’ancrage avec plaque et crochet.', ['ancrage', 'anchor', 'tige', 'boulon'],
    '<path d="M24 14 H40" stroke-width="3"/><path d="M32 14 V44 a6 6 0 0 1 -12 0" stroke-width="2"/>'),
  sym('sym-contreventement', 'structure', 'Contreventement', 'Palée de contreventement (croix de Saint-André).', ['contreventement', 'bracing', 'croix', 'stabilité'],
    '<rect x="14" y="14" width="36" height="36" stroke-width="1.6"/><path d="M14 14 L50 50 M50 14 L14 50" stroke-width="2"/>'),

  // ─── Mécanique / Plomberie ───────────────────────────────────────────────────
  sym('sym-eau', 'mecanique', 'Alimentation eau', 'Conduite d’alimentation en eau.', ['eau', 'alimentation', 'plomberie', 'supply'],
    '<path d="M8 32 H56" stroke-width="2"/><circle cx="32" cy="32" r="7" stroke-width="2"/><path d="M28 32 H36 M32 28 V36" stroke-width="1.6"/>'),
  sym('sym-evacuation', 'mecanique', 'Évacuation (siphon)', 'Conduite d’évacuation avec siphon (P-trap).', ['évacuation', 'drain', 'siphon', 'waste'],
    '<path d="M28 10 V34 a8 8 0 0 0 16 0 V22" stroke-width="2"/><path d="M44 22 l-4 6 m4 -6 l4 6" stroke-width="1.6"/>'),
  sym('sym-ventilation', 'mecanique', 'Ventilation', 'Ventilateur / extraction d’air.', ['ventilation', 'air', 'fan', 'cvc', 'hvac'],
    '<circle cx="32" cy="32" r="18" stroke-width="1.6"/><path d="M32 32 q-2 -14 -12 -10 q10 -2 12 10 M32 32 q14 -2 10 -12 q2 10 -10 12 M32 32 q2 14 12 10 q-10 2 -12 -10" fill="currentColor" stroke="none"/>'),
  sym('sym-grille-vent', 'mecanique', 'Grille de ventilation', 'Grille / diffuseur d’air à lames.', ['grille', 'ventilation', 'diffuseur', 'louvre'],
    '<rect x="12" y="16" width="40" height="32" stroke-width="1.6"/><path d="M12 24 H52 M12 32 H52 M12 40 H52" stroke-width="1.3"/>'),
  sym('sym-drain', 'mecanique', 'Drain', 'Avaloir / drain de sol.', ['drain', 'avaloir', 'sol', 'évacuation'],
    '<rect x="16" y="16" width="32" height="32" stroke-width="1.6"/><circle cx="32" cy="32" r="4" stroke-width="1.4"/><path d="M16 16 L48 48 M48 16 L16 48" stroke-width="1.1"/>'),
  sym('sym-equip-meca', 'mecanique', 'Équipement mécanique', 'Équipement mécanique générique (repère).', ['équipement', 'mécanique', 'unité', 'hvac'],
    '<rect x="14" y="18" width="36" height="28" stroke-width="1.8"/><text x="32" y="38" font-size="14" text-anchor="middle" fill="currentColor" stroke="none">M</text>'),

  // ─── Électricité ─────────────────────────────────────────────────────────────
  sym('sym-prise', 'electricite', 'Prise de courant', 'Prise / réceptacle électrique.', ['prise', 'réceptacle', 'outlet', 'courant'],
    '<circle cx="32" cy="32" r="14" stroke-width="1.8"/><path d="M18 32 H46" stroke-width="1.6"/><path d="M26 32 V40 M38 32 V40" stroke-width="1.6"/>'),
  sym('sym-interrupteur', 'electricite', 'Interrupteur', 'Interrupteur d’éclairage.', ['interrupteur', 'switch', 'éclairage'],
    '<circle cx="24" cy="40" r="3" fill="currentColor" stroke="none"/><path d="M24 40 L42 22" stroke-width="2"/><text x="44" y="50" font-size="12" text-anchor="middle" fill="currentColor" stroke="none">S</text>'),
  sym('sym-lum-plafond', 'electricite', 'Luminaire plafond', 'Luminaire fixé au plafond.', ['luminaire', 'plafond', 'éclairage', 'light'],
    '<circle cx="32" cy="32" r="14" stroke-width="1.8"/><path d="M22 22 L42 42 M42 22 L22 42" stroke-width="1.6"/>'),
  sym('sym-lum-mural', 'electricite', 'Luminaire mural', 'Applique murale.', ['luminaire', 'mural', 'applique', 'wall'],
    '<path d="M14 14 V50" stroke-width="2"/><path d="M14 14 l6 6 M14 22 l6 6 M14 30 l6 6 M14 38 l6 6" stroke-width="1"/><circle cx="36" cy="32" r="11" stroke-width="1.8"/><path d="M14 32 H25" stroke-width="1.6"/>'),
  sym('sym-panneau', 'electricite', 'Panneau électrique', 'Tableau / panneau de distribution.', ['panneau', 'tableau', 'distribution', 'électrique'],
    '<rect x="16" y="12" width="32" height="40" stroke-width="1.8"/><path d="M34 20 L26 34 H34 L26 46" stroke-width="2" fill="none"/>'),
  sym('sym-detecteur', 'electricite', 'Détecteur de fumée', 'Avertisseur / détecteur de fumée.', ['détecteur', 'fumée', 'alarme', 'smoke'],
    '<circle cx="32" cy="32" r="15" stroke-width="1.8"/><text x="32" y="37" font-size="11" text-anchor="middle" fill="currentColor" stroke="none">SD</text>'),
  sym('sym-sortie', 'electricite', 'Sortie d’urgence', 'Issue / sortie de secours.', ['sortie', 'urgence', 'issue', 'exit', 'secours'],
    '<rect x="12" y="14" width="18" height="36" stroke-width="1.8"/><path d="M30 32 H52" stroke-width="2.4"/><path d="M52 32 l-10 -7 v14 Z" fill="currentColor" stroke="none"/>'),

  // ─── Annotation / Chantier ───────────────────────────────────────────────────
  sym('sym-nuage-revision', 'annotation', 'Nuage de révision', 'Encadre une modification (révision).', ['révision', 'nuage', 'cloud', 'modification'],
    '<path d="M16 30 a7 7 0 0 1 7 -8 a8 8 0 0 1 14 -2 a7 7 0 0 1 11 6 a6 6 0 0 1 -2 12 a7 7 0 0 1 -12 4 a8 8 0 0 1 -14 -2 a7 7 0 0 1 -2 -10 Z" stroke-width="1.6" fill="none"/>'),
  sym('sym-triangle-revision', 'annotation', 'Triangle de révision', 'Numéro de révision (delta).', ['révision', 'triangle', 'delta', 'indice'],
    '<path d="M32 14 L50 46 H14 Z" stroke-width="1.8"/><text x="32" y="42" font-size="13" text-anchor="middle" fill="currentColor" stroke="none">1</text>'),
  sym('sym-point-critique', 'annotation', 'Point critique', 'Marque un point critique à surveiller.', ['critique', 'point', 'attention', 'hotspot'],
    '<path d="M32 12 L52 32 L32 52 L12 32 Z" fill="currentColor" stroke="none"/><path d="M32 22 V36" stroke="#fff" stroke-width="3"/><circle cx="32" cy="43" r="2" fill="#fff" stroke="none"/>'),
  sym('sym-note-chantier', 'annotation', 'Note chantier', 'Note / observation de chantier.', ['note', 'chantier', 'observation', 'site'],
    '<path d="M18 12 H40 L48 20 V52 H18 Z" stroke-width="1.6"/><path d="M40 12 V20 H48" stroke-width="1.4"/><path d="M24 28 H42 M24 34 H42 M24 40 H36" stroke-width="1.2"/>'),
  sym('sym-avertissement', 'annotation', 'Avertissement', 'Mise en garde / danger.', ['avertissement', 'danger', 'warning', 'attention'],
    '<path d="M32 12 L52 48 H12 Z" stroke-width="1.8"/><path d="M32 26 V38" stroke-width="3"/><circle cx="32" cy="44" r="2" fill="currentColor" stroke="none"/>'),
  sym('sym-validation', 'annotation', 'Validation', 'Élément vérifié / approuvé.', ['validation', 'ok', 'approuvé', 'check', 'conforme'],
    '<circle cx="32" cy="32" r="18" stroke-width="1.8"/><path d="M22 33 L29 40 L43 24" stroke-width="3" fill="none"/>'),
  sym('sym-a-verifier', 'annotation', 'À vérifier', 'Point à confirmer / vérifier.', ['à vérifier', 'question', 'incertain', 'todo'],
    '<circle cx="32" cy="32" r="18" stroke-width="1.8"/><text x="32" y="40" font-size="22" text-anchor="middle" fill="currentColor" stroke="none">?</text>'),
]

const BY_ID = new Map(SYMBOLS.map((s) => [s.id, s]))

export function getSymbol(id: string): TechnicalSymbol | undefined {
  return BY_ID.get(id)
}

export function symbolCategories(): SymbolCategory[] {
  const seen = new Set<SymbolCategory>()
  for (const s of SYMBOLS) seen.add(s.category)
  return [...seen]
}

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

/** Recherche dans nom, description, tags et catégorie. */
export function searchSymbols(query: string, category?: SymbolCategory | 'all'): TechnicalSymbol[] {
  let list = SYMBOLS
  if (category && category !== 'all') list = list.filter((s) => s.category === category)
  const q = normalize(query)
  if (q === '') return list
  return list.filter((s) => {
    const hay = normalize([s.name, s.description, s.tags.join(' '), s.category, SYMBOL_CATEGORY_LABELS[s.category]].join(' '))
    return hay.includes(q)
  })
}

/** Résout un symbole-bloc par id `symbol-<symbolId>` (insertion canvas). */
export function resolveSymbolBlock(blockId: string): DrawingBlock | undefined {
  if (!blockId.startsWith('symbol-')) return undefined
  const s = getSymbol(blockId.slice('symbol-'.length))
  return s ? symbolToBlock(s) : undefined
}

/** Adapte un symbole vers la forme commune `GraphicResource` (Resource Factory). */
export function symbolToResource(symbol: TechnicalSymbol): GraphicResource {
  return {
    id: symbol.id,
    type: 'symbol',
    name: symbol.name,
    category: symbol.category,
    categoryLabel: SYMBOL_CATEGORY_LABELS[symbol.category],
    description: symbol.description,
    tags: symbol.tags,
    svg: symbol.svg,
    viewBox: symbol.viewBox,
    defaultWidth: symbol.defaultSize,
    defaultHeight: symbol.defaultSize,
    searchText: buildSearchText([symbol.name, symbol.description, symbol.tags, symbol.category, SYMBOL_CATEGORY_LABELS[symbol.category]]),
    insertable: true,
    disclaimer: SYMBOL_DISCLAIMER,
    sourceType: 'svg-block',
    blockCategory: 'symbols',
    blockTagPrefix: 'symbole',
  }
}

/** Convertit un symbole en DrawingBlock pour l'insertion dans un dessin. */
export function symbolToBlock(symbol: TechnicalSymbol): DrawingBlock {
  return resourceToBlock(symbolToResource(symbol))
}
