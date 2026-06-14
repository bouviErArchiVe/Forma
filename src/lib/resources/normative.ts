/**
 * Bibliothèque normative locale (V1) — fiches synthétiques d'aide.
 *
 * AVERTISSEMENT : ces fiches ne remplacent PAS les textes officiels. Elles
 * résument des concepts pour orienter la recherche ; chaque fiche rappelle
 * « à vérifier dans le texte officiel ». Aucun numéro d'article inventé.
 */

export type NormativeCategory =
  | 'cnb'
  | 'ccq'
  | 'rbq'
  | 'csa'
  | 'nfpa'
  | 'accessibilite'
  | 'incendie'
  | 'issues'
  | 'escaliers'
  | 'garde-corps'
  | 'portes'
  | 'stationnement'
  | 'structure'
  | 'enveloppe'
  | 'materiaux'

export const NORMATIVE_CATEGORY_LABELS: Record<NormativeCategory, string> = {
  cnb: 'CNB',
  ccq: 'CCQ',
  rbq: 'RBQ',
  csa: 'CSA',
  nfpa: 'NFPA',
  accessibilite: 'Accessibilité',
  incendie: 'Sécurité incendie',
  issues: 'Issues',
  escaliers: 'Escaliers',
  'garde-corps': 'Garde-corps',
  portes: 'Portes',
  stationnement: 'Stationnement',
  structure: 'Structure',
  enveloppe: 'Enveloppe',
  materiaux: 'Matériaux',
}

export type Confidence = 'indicatif' | 'concept' | 'a-verifier'

export interface NormativeSheet {
  id: string
  title: string
  category: NormativeCategory
  summary: string
  keywords: string[]
  /** Juridiction (ex. Canada, Québec) si pertinent. */
  jurisdiction?: string
  /** Année/édition si connue, sinon « à vérifier ». */
  edition?: string
  confidence: Confidence
  /** Source officielle ou placeholder. */
  source?: string
}

/** Rappel affiché systématiquement avec chaque fiche. */
export const NORMATIVE_DISCLAIMER =
  'Fiche synthétique indicative — à vérifier dans le texte officiel en vigueur pour la juridiction et l’édition applicables.'

export const NORMATIVE_SHEETS: NormativeSheet[] = [
  {
    id: 'cnb-usages', title: 'Classification des usages (CNB)', category: 'cnb',
    summary: 'Le CNB classe les bâtiments par usage principal (groupes A à F : réunion, soins/détention, habitation, affaires, commerce, industriel). Le groupe détermine de nombreuses exigences (issues, séparations, résistance au feu).',
    keywords: ['usage', 'groupe', 'classification', 'a b c d e f'],
    jurisdiction: 'Canada', edition: 'à vérifier', confidence: 'concept',
    source: 'Code national du bâtiment (texte officiel)',
  },
  {
    id: 'cnb-aire', title: 'Aire de bâtiment et constructions combustibles', category: 'cnb',
    summary: 'L’aire de bâtiment, la hauteur et le type de construction (combustible / incombustible) conditionnent les exigences structurales et de protection incendie. Les limites varient selon l’usage et la présence de gicleurs.',
    keywords: ['aire', 'hauteur', 'combustible', 'incombustible', 'gicleurs'],
    jurisdiction: 'Canada', edition: 'à vérifier', confidence: 'concept',
  },
  {
    id: 'ccq-base', title: 'Code de construction du Québec (CCQ)', category: 'ccq',
    summary: 'Le CCQ adopte le CNB avec des modifications propres au Québec. C’est le texte applicable pour la construction au Québec ; vérifier toujours les modifications québécoises plutôt que le CNB seul.',
    keywords: ['québec', 'ccq', 'modifications', 'adoption'],
    jurisdiction: 'Québec', edition: 'à vérifier', confidence: 'concept',
  },
  {
    id: 'rbq-licences', title: 'RBQ — licences et qualification', category: 'rbq',
    summary: 'La Régie du bâtiment du Québec encadre les licences d’entrepreneur, la qualification et certaines installations (gaz, électricité, équipements pétroliers). Vérifier les exigences de licence selon les travaux.',
    keywords: ['rbq', 'licence', 'entrepreneur', 'qualification'],
    jurisdiction: 'Québec', edition: 'à vérifier', confidence: 'concept',
  },
  {
    id: 'escaliers-blondel', title: 'Escaliers — confort et dimensions', category: 'escaliers',
    summary: 'Le confort d’un escalier suit la relation de Blondel (2h + g ≈ 600–640 mm). Les hauteurs de marche et girons minimaux/maximaux, ainsi que la largeur et l’échappée, sont fixés par le code selon l’usage. Vérifier les valeurs limites exactes.',
    keywords: ['escalier', 'blondel', 'marche', 'giron', 'contremarche', 'échappée'],
    jurisdiction: 'à vérifier', edition: 'à vérifier', confidence: 'indicatif',
  },
  {
    id: 'garde-corps-hauteur', title: 'Garde-corps — hauteur et ajourement', category: 'garde-corps',
    summary: 'Les garde-corps protègent contre les chutes : hauteur minimale et limitation des ouvertures (souvent ~100 mm pour empêcher le passage). Les valeurs dépendent de l’usage et de la hauteur de chute — à vérifier au code.',
    keywords: ['garde-corps', 'hauteur', 'ajourement', 'ouverture', 'chute', 'barreaux'],
    jurisdiction: 'à vérifier', edition: 'à vérifier', confidence: 'indicatif',
  },
  {
    id: 'issues-nombre', title: 'Issues — nombre et distances', category: 'issues',
    summary: 'Le nombre d’issues, leur largeur et les distances de parcours dépendent de l’usage, du nombre d’occupants et de l’aire. Les portes d’issue, le sens d’ouverture et la quincaillerie anti-panique sont réglementés.',
    keywords: ['issue', 'évacuation', 'sortie', 'distance', 'occupants', 'anti-panique'],
    jurisdiction: 'à vérifier', edition: 'à vérifier', confidence: 'concept',
  },
  {
    id: 'incendie-separation', title: 'Séparations coupe-feu', category: 'incendie',
    summary: 'Les séparations coupe-feu (degré de résistance au feu en heures) compartimentent le bâtiment pour limiter la propagation. Le degré requis dépend de l’usage, de l’aire et de la présence de gicleurs.',
    keywords: ['coupe-feu', 'séparation', 'résistance au feu', 'compartimentage', 'degré'],
    jurisdiction: 'à vérifier', edition: 'à vérifier', confidence: 'concept',
  },
  {
    id: 'accessibilite-parcours', title: 'Accessibilité — parcours sans obstacle', category: 'accessibilite',
    summary: 'Un parcours sans obstacle relie l’entrée accessible aux espaces requis : largeurs de passage, pentes de rampe, aires de manœuvre, signalisation. Les salles de toilette accessibles ont des dégagements et barres d’appui spécifiques.',
    keywords: ['accessibilité', 'sans obstacle', 'pmr', 'rampe', 'pente', 'barre d’appui'],
    jurisdiction: 'à vérifier', edition: 'à vérifier', confidence: 'concept',
  },
  {
    id: 'portes-degagement', title: 'Portes — largeur et dégagements', category: 'portes',
    summary: 'Les portes d’issue et accessibles ont une largeur libre minimale et des aires de dégagement de chaque côté pour la manœuvre. Le sens d’ouverture et l’effort d’ouverture sont également réglementés.',
    keywords: ['porte', 'largeur libre', 'dégagement', 'manœuvre', 'sens d’ouverture'],
    jurisdiction: 'à vérifier', edition: 'à vérifier', confidence: 'indicatif',
  },
  {
    id: 'stationnement-accessible', title: 'Stationnement accessible', category: 'stationnement',
    summary: 'Un nombre minimal de places de stationnement accessibles (avec allée de transfert) est exigé selon le total de places. Dimensions, signalisation et parcours vers l’entrée accessible sont normés.',
    keywords: ['stationnement', 'accessible', 'place', 'allée', 'transfert'],
    jurisdiction: 'à vérifier', edition: 'à vérifier', confidence: 'indicatif',
  },
  {
    id: 'structure-charges', title: 'Charges et combinaisons (structure)', category: 'structure',
    summary: 'Le dimensionnement structural combine charges permanentes, d’exploitation, de neige, de vent et sismiques selon des facteurs de combinaison (calcul aux états limites). Les charges de neige/vent/séisme dépendent de la localisation.',
    keywords: ['charge', 'combinaison', 'neige', 'vent', 'sismique', 'états limites'],
    jurisdiction: 'à vérifier', edition: 'à vérifier', confidence: 'concept',
  },
  {
    id: 'csa-bois', title: 'CSA O86 — calcul des charpentes en bois', category: 'csa',
    summary: 'La norme CSA O86 régit le calcul des structures en bois (résistances, durées de charge, assemblages). Référencée par le code pour la conception bois. Vérifier l’édition applicable.',
    keywords: ['csa', 'o86', 'bois', 'charpente', 'calcul'],
    jurisdiction: 'Canada', edition: 'à vérifier', confidence: 'concept',
  },
  {
    id: 'enveloppe-vapeur', title: 'Enveloppe — pare-air et pare-vapeur', category: 'enveloppe',
    summary: 'L’enveloppe gère l’eau, l’air, la vapeur et la chaleur. Le pare-air assure l’étanchéité, le pare-vapeur contrôle la diffusion ; leur position relative dépend du climat (côté chaud en climat froid). Continuité essentielle aux jonctions.',
    keywords: ['enveloppe', 'pare-air', 'pare-vapeur', 'isolation', 'continuité', 'climat'],
    jurisdiction: 'à vérifier', edition: 'à vérifier', confidence: 'concept',
  },
  {
    id: 'materiaux-resistance', title: 'Matériaux — résistance au feu', category: 'materiaux',
    summary: 'Les assemblages (murs, planchers) ont un degré de résistance au feu obtenu par essais ou calcul. Les revêtements intérieurs ont des indices de propagation de la flamme limités selon l’usage et l’emplacement.',
    keywords: ['matériaux', 'résistance au feu', 'propagation', 'flamme', 'revêtement'],
    jurisdiction: 'à vérifier', edition: 'à vérifier', confidence: 'concept',
  },
]

const BY_ID = new Map(NORMATIVE_SHEETS.map((s) => [s.id, s]))

export function getNormativeSheet(id: string): NormativeSheet | undefined {
  return BY_ID.get(id)
}

export function normativeCategories(): NormativeCategory[] {
  const seen = new Set<NormativeCategory>()
  for (const s of NORMATIVE_SHEETS) seen.add(s.category)
  return [...seen]
}

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

/** Recherche dans titre, résumé, mots-clés et catégorie. */
export function searchNormative(query: string, category?: NormativeCategory | 'all'): NormativeSheet[] {
  let list = NORMATIVE_SHEETS
  if (category && category !== 'all') list = list.filter((s) => s.category === category)
  const q = normalize(query)
  if (q === '') return list
  return list.filter((s) => {
    const hay = normalize([s.title, s.summary, s.keywords.join(' '), s.category, s.jurisdiction ?? ''].join(' '))
    return hay.includes(q)
  })
}
