/**
 * Synonymes FR ↔ EN pour la recherche de blocs.
 *
 * Permet à « toilet » de trouver le WC, « beam » de trouver une poutre,
 * « acier » de trouver steel, etc. La recherche étend chaque terme de la
 * requête avec ses synonymes connus (bidirectionnel).
 */

/** Groupes de synonymes (toutes les formes d'un même concept). */
const SYNONYM_GROUPS: string[][] = [
  ['wc', 'toilet', 'toilette', 'cuvette'],
  ['poutre', 'beam', 'poutrelle'],
  ['poteau', 'colonne', 'column', 'post'],
  ['acier', 'steel'],
  ['bois', 'wood', 'lumber', 'timber'],
  ['beton', 'concrete'],
  ['maconnerie', 'masonry'],
  ['porte', 'door'],
  ['fenetre', 'window', 'baie'],
  ['mur', 'wall', 'voile', 'cloison', 'partition'],
  ['dalle', 'slab'],
  ['semelle', 'footing', 'pad', 'foundation', 'fondation'],
  ['escalier', 'stair', 'stairs'],
  ['lavabo', 'sink', 'lavatory', 'vasque'],
  ['evier', 'sink', 'kitchen'],
  ['douche', 'shower'],
  ['baignoire', 'bath', 'tub', 'bain'],
  ['prise', 'outlet', 'receptacle'],
  ['interrupteur', 'switch'],
  ['luminaire', 'light', 'fixture', 'plafonnier'],
  ['panneau', 'panel', 'board'],
  ['conduit', 'duct', 'gaine'],
  ['grille', 'grille', 'diffuser', 'diffuseur', 'bouche'],
  ['table', 'table'],
  ['chaise', 'chair'],
  ['bureau', 'desk'],
  ['lit', 'bed'],
  ['canape', 'sofa', 'couch'],
  ['armoire', 'wardrobe', 'placard', 'closet'],
  ['comptoir', 'counter', 'countertop'],
  ['cornière', 'corniere', 'angle'],
  ['tube', 'hss', 'tube'],
  ['plaque', 'plate'],
  ['nord', 'north'],
  ['coupe', 'section', 'cut'],
  ['niveau', 'level', 'elevation', 'altitude'],
  ['axe', 'grid', 'trame', 'file'],
  ['cote', 'dimension'],
  ['arbre', 'tree'],
  ['stationnement', 'parking', 'stall'],
  ['ferme', 'truss'],
  ['treillis', 'mesh', 'rebar', 'armature'],
  ['accessible', 'accessible', 'pmr', 'ada', 'ua'],
]

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

// Index inverse terme normalisé → ensemble des synonymes normalisés.
const SYNONYM_INDEX = new Map<string, Set<string>>()
for (const group of SYNONYM_GROUPS) {
  const norm = group.map(normalize)
  for (const term of norm) {
    const set = SYNONYM_INDEX.get(term) ?? new Set<string>()
    for (const other of norm) set.add(other)
    SYNONYM_INDEX.set(term, set)
  }
}

/**
 * Étend une requête avec les synonymes de ses termes.
 * Retourne la liste des termes (normalisés, dédupliqués) à chercher.
 */
export function expandQueryTerms(query: string): string[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean)
  const out = new Set<string>()
  for (const term of terms) {
    out.add(term)
    const syn = SYNONYM_INDEX.get(term)
    if (syn) for (const s of syn) out.add(s)
  }
  return [...out]
}
