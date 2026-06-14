/**
 * Bibliothèque de matériaux (Pack A — A2).
 *
 * Fiches synthétiques de matériaux de construction : propriétés indicatives
 * (ordres de grandeur), avantages, inconvénients, applications et notes.
 *
 * AVERTISSEMENT : valeurs indicatives à vérifier selon le produit, la fiche
 * technique du fabricant et la norme/édition applicable. Ne remplace pas une
 * conception par un professionnel.
 */

export type MaterialCategory =
  | 'bois'
  | 'acier'
  | 'beton'
  | 'maconnerie'
  | 'isolation'
  | 'membranes'
  | 'revetements'
  | 'toitures'
  | 'portes'
  | 'fenetres'
  | 'produits-techniques'

export const MATERIAL_CATEGORY_LABELS: Record<MaterialCategory, string> = {
  bois: 'Bois',
  acier: 'Acier',
  beton: 'Béton',
  maconnerie: 'Maçonnerie',
  isolation: 'Isolation',
  membranes: 'Membranes',
  revetements: 'Revêtements',
  toitures: 'Toitures',
  portes: 'Portes',
  fenetres: 'Fenêtres',
  'produits-techniques': 'Produits techniques',
}

export interface MaterialProperty {
  label: string
  value: string
}

export interface Material {
  id: string
  name: string
  category: MaterialCategory
  description: string
  /** Propriétés indicatives (ordres de grandeur). */
  properties: MaterialProperty[]
  advantages: string[]
  disadvantages: string[]
  applications: string[]
  notes: string
  keywords: string[]
}

export const MATERIAL_DISCLAIMER =
  'Valeurs indicatives (ordres de grandeur) — à vérifier selon le produit, la fiche technique du fabricant et la norme applicable.'

export const MATERIALS: Material[] = [
  // ─── Bois ──────────────────────────────────────────────────────────────────
  {
    id: 'bois-spf', name: 'Bois de charpente SPF (Épinette-Pin-Sapin)', category: 'bois',
    description: 'Bois de construction résineux le plus courant en construction légère à ossature au Canada. Vendu en dimensions normalisées et classé visuellement ou par machine (MSR).',
    properties: [
      { label: 'Masse volumique', value: '≈ 400–450 kg/m³' },
      { label: 'Humidité (séché four)', value: '≈ 19 % max (S-DRY)' },
      { label: 'Classement', value: 'No 1/No 2, MSR' },
    ],
    advantages: ['Léger et facile à travailler', 'Renouvelable, faible énergie grise', 'Bon rapport résistance/poids', 'Disponible et économique'],
    disadvantages: ['Sensible à l’humidité et aux insectes', 'Combustible', 'Retrait/gauchissement au séchage', 'Variabilité naturelle'],
    applications: ['Ossature de murs', 'Solives et chevrons', 'Entremises et fourrures'],
    notes: 'Calcul des charpentes en bois selon CSA O86. Protéger de l’humidité et respecter les portées admissibles.',
    keywords: ['bois', 'spf', 'épinette', 'pin', 'sapin', 'ossature', 'charpente', 'résineux'],
  },
  {
    id: 'bois-glulam', name: 'Bois lamellé-collé (glulam)', category: 'bois',
    description: 'Lamelles de bois collées sous pression formant des poutres et poteaux de grande portée et de formes courbes possibles.',
    properties: [
      { label: 'Masse volumique', value: '≈ 480–550 kg/m³' },
      { label: 'Portées', value: 'grandes portées possibles' },
      { label: 'Aspect', value: 'apparent (architectural)' },
    ],
    advantages: ['Grandes portées sans appui', 'Stabilité dimensionnelle supérieure au bois massif', 'Esthétique apparente', 'Bon comportement au feu (carbonisation lente)'],
    disadvantages: ['Coût plus élevé', 'Fabrication en usine (délais)', 'Sensible à l’humidité prolongée', 'Manutention de gros éléments'],
    applications: ['Poutres et poteaux apparents', 'Toitures de grande portée', 'Structures de prestige (gymnases, halls)'],
    notes: 'Conception selon CSA O86. La carbonisation lente confère une résistance au feu calculable.',
    keywords: ['bois', 'lamellé-collé', 'glulam', 'poutre', 'poteau', 'grande portée'],
  },
  {
    id: 'bois-lvl', name: 'Lamibois (LVL)', category: 'bois',
    description: 'Bois d’ingénierie fait de placages collés à fil parallèle, offrant une résistance élevée et régulière pour poutres et linteaux.',
    properties: [
      { label: 'Masse volumique', value: '≈ 600–700 kg/m³' },
      { label: 'Régularité', value: 'très homogène' },
      { label: 'Format', value: 'poutres rectilignes' },
    ],
    advantages: ['Résistance élevée et constante', 'Peu de défauts (vs bois massif)', 'Sections élancées possibles', 'Stable dimensionnellement'],
    disadvantages: ['Plus cher que le bois massif', 'Doit rester sec', 'Coupe/perçage limités par le fabricant'],
    applications: ['Poutres et linteaux', 'Membrures de poutrelles', 'Sablières de grande portée'],
    notes: 'Suivre les valeurs et limites de perçage du fabricant. Produit d’ingénierie (EWP).',
    keywords: ['bois', 'lvl', 'lamibois', 'placage', 'poutre', 'linteau', 'ewp'],
  },
  {
    id: 'bois-osb', name: 'Panneau OSB', category: 'bois',
    description: 'Panneau de copeaux orientés collés, économique, utilisé comme support de revêtement et voile de contreventement.',
    properties: [
      { label: 'Masse volumique', value: '≈ 600–650 kg/m³' },
      { label: 'Épaisseurs', value: '≈ 9.5–18 mm' },
      { label: 'Classe', value: 'support / structural' },
    ],
    advantages: ['Économique', 'Bon contreventement', 'Grandes dimensions de panneau', 'Uniforme'],
    disadvantages: ['Gonfle sur les rives si mouillé', 'Moins beau qu’un contreplaqué', 'Tenue des fixations en rive moindre'],
    applications: ['Support de toiture et de mur', 'Sous-plancher', 'Âme de poutrelles en I'],
    notes: 'Protéger les rives de l’eau. Respecter l’espacement de dilatation et le sens de pose.',
    keywords: ['osb', 'panneau', 'copeaux', 'contreventement', 'support', 'sous-plancher'],
  },
  {
    id: 'bois-contreplaque', name: 'Contreplaqué', category: 'bois',
    description: 'Panneau de plis de placage croisés, robuste et stable, pour usages structuraux et de finition.',
    properties: [
      { label: 'Masse volumique', value: '≈ 500–600 kg/m³' },
      { label: 'Plis', value: 'croisés (impair)' },
      { label: 'Collage', value: 'intérieur / extérieur' },
    ],
    advantages: ['Très bonne tenue des fixations', 'Stable et résistant', 'Bon comportement à l’humidité (colle extérieure)', 'Finitions possibles'],
    disadvantages: ['Plus cher que l’OSB', 'Qualité variable selon essence/plis'],
    applications: ['Sous-plancher de qualité', 'Support de toiture', 'Coffrages, mobilier'],
    notes: 'Choisir le collage extérieur pour les usages exposés. Vérifier la qualité de face.',
    keywords: ['contreplaqué', 'plywood', 'placage', 'panneau', 'coffrage'],
  },

  // ─── Acier ─────────────────────────────────────────────────────────────────
  {
    id: 'acier-charpente', name: 'Acier de charpente', category: 'acier',
    description: 'Profilés laminés (poutres W, HSS, cornières) pour ossatures de bâtiment. Matériau ductile à haute résistance.',
    properties: [
      { label: 'Masse volumique', value: '≈ 7850 kg/m³' },
      { label: 'Limite élastique (typ.)', value: 'fy ≈ 350 MPa (350W)' },
      { label: 'Module', value: 'E ≈ 200 GPa' },
    ],
    advantages: ['Très haute résistance/poids', 'Ductile (bon en zone sismique)', 'Préfabrication, montage rapide', 'Recyclable', 'Grandes portées'],
    disadvantages: ['Perd sa résistance au feu (protection requise)', 'Corrosion si non protégé', 'Coût et fluctuation des prix', 'Ponts thermiques'],
    applications: ['Poutres et colonnes', 'Charpentes industrielles/commerciales', 'Mezzanines, structures lourdes'],
    notes: 'Calcul selon CSA S16. Prévoir protection incendie (ignifugeant, encoffrement) et antirouille.',
    keywords: ['acier', 'charpente', 'poutre', 'colonne', 'hss', 'profilé', 's16', 'structure'],
  },
  {
    id: 'acier-armature', name: 'Acier d’armature (barres)', category: 'acier',
    description: 'Barres crénelées noyées dans le béton pour reprendre les efforts de traction. Désignées par numéro de barre (ex. 10M, 15M).',
    properties: [
      { label: 'Limite élastique', value: 'fy ≈ 400 MPa (400W)' },
      { label: 'Désignation', value: '10M, 15M, 20M…' },
      { label: 'Enrobage', value: 'selon exposition' },
    ],
    advantages: ['Reprend la traction du béton', 'Bonne adhérence (crénelures)', 'Compatible thermiquement avec le béton', 'Économique'],
    disadvantages: ['Corrosion si enrobage insuffisant', 'Mise en place soignée requise', 'Recouvrements et ancrages à respecter'],
    applications: ['Dalles, poutres, murs en béton armé', 'Semelles et fondations', 'Poteaux'],
    notes: 'Respecter enrobage, recouvrements et ancrages (CSA A23.3/A23.1). Acier galvanisé/inox en milieu agressif.',
    keywords: ['acier', 'armature', 'barre', 'rebar', 'béton armé', '10m', '15m', 'traction'],
  },
  {
    id: 'acier-galvanise', name: 'Acier galvanisé', category: 'acier',
    description: 'Acier revêtu de zinc par galvanisation à chaud pour résister à la corrosion.',
    properties: [
      { label: 'Protection', value: 'revêtement de zinc' },
      { label: 'Durabilité', value: 'élevée en extérieur' },
      { label: 'Usage', value: 'connecteurs, solins, profilés' },
    ],
    advantages: ['Bonne résistance à la corrosion', 'Protection sacrificielle du zinc', 'Entretien réduit', 'Économique vs inox'],
    disadvantages: ['Couche de zinc altérable (coupe, soudure)', 'Aspect industriel', 'Réaction galvanique avec certains métaux'],
    applications: ['Connecteurs de charpente', 'Solins et fourrures', 'Tabliers métalliques, clôtures'],
    notes: 'Retoucher les zones coupées/soudées (peinture riche en zinc). Éviter contacts galvaniques incompatibles.',
    keywords: ['acier', 'galvanisé', 'zinc', 'corrosion', 'connecteur', 'solin'],
  },
  {
    id: 'acier-inox', name: 'Acier inoxydable', category: 'acier',
    description: 'Alliage de fer-chrome (et nickel) résistant à la corrosion, pour usages exposés ou agressifs.',
    properties: [
      { label: 'Chrome', value: '≥ 10.5 %' },
      { label: 'Familles', value: '304, 316…' },
      { label: 'Finitions', value: 'brossé, poli' },
    ],
    advantages: ['Excellente résistance à la corrosion', 'Durable et esthétique', 'Hygiénique', 'Entretien faible'],
    disadvantages: ['Coût élevé', 'Conductivité thermique faible', 'Dilatation thermique notable'],
    applications: ['Ancrages et fixations exposés', 'Garde-corps et mains courantes', 'Milieux humides/marins'],
    notes: 'Choisir la nuance selon l’agressivité (316 en milieu chloruré/marin). Éviter contamination ferreuse.',
    keywords: ['acier', 'inoxydable', 'inox', '304', '316', 'corrosion', 'garde-corps'],
  },

  // ─── Béton ─────────────────────────────────────────────────────────────────
  {
    id: 'beton-ordinaire', name: 'Béton (ordinaire)', category: 'beton',
    description: 'Mélange de ciment, granulats, eau et adjuvants. Excellente résistance en compression, faible en traction.',
    properties: [
      { label: 'Masse volumique', value: '≈ 2300–2400 kg/m³' },
      { label: 'Résistance (f’c)', value: '≈ 25–35 MPa courant' },
      { label: 'Rapport E/C', value: 'selon durabilité' },
    ],
    advantages: ['Haute résistance en compression', 'Moulable, monolithique', 'Durable et incombustible', 'Inertie thermique/acoustique'],
    disadvantages: ['Faible en traction (armature requise)', 'Lourd', 'Retrait et fissuration', 'Empreinte carbone du ciment'],
    applications: ['Fondations et dalles', 'Murs et planchers', 'Ouvrages de génie civil'],
    notes: 'Conception/exécution selon CSA A23.3 / A23.1. Cure adéquate et classe d’exposition appropriée.',
    keywords: ['béton', 'ciment', 'compression', 'f’c', 'dalle', 'fondation'],
  },
  {
    id: 'beton-arme', name: 'Béton armé', category: 'beton',
    description: 'Béton combiné à des armatures d’acier pour reprendre traction et flexion. Base de la majorité des structures en béton.',
    properties: [
      { label: 'Composants', value: 'béton + acier d’armature' },
      { label: 'Comportement', value: 'compression + traction' },
      { label: 'Enrobage', value: 'selon exposition/feu' },
    ],
    advantages: ['Reprend flexion et traction', 'Durable et résistant au feu', 'Polyvalent (formes variées)', 'Continuité structurale'],
    disadvantages: ['Mise en œuvre exigeante (coffrage, ferraillage)', 'Lourd', 'Réparations complexes', 'Corrosion des armatures si négligée'],
    applications: ['Dalles, poutres, colonnes', 'Murs de soutènement', 'Fondations profondes'],
    notes: 'Respecter enrobage et détails de ferraillage (CSA A23.3). La corrosion d’armature est le principal risque de durabilité.',
    keywords: ['béton', 'armé', 'armature', 'flexion', 'dalle', 'poutre', 'colonne'],
  },
  {
    id: 'beton-precontraint', name: 'Béton précontraint', category: 'beton',
    description: 'Béton dans lequel des câbles tendus introduisent une compression permanente, augmentant la portée et limitant la fissuration.',
    properties: [
      { label: 'Technique', value: 'pré-tension / post-tension' },
      { label: 'Portées', value: 'longues' },
      { label: 'Câbles', value: 'torons haute résistance' },
    ],
    advantages: ['Grandes portées et faibles flèches', 'Fissuration maîtrisée', 'Sections plus minces', 'Bon pour planchers/ponts'],
    disadvantages: ['Technicité élevée', 'Équipement spécialisé', 'Coût et contrôle qualité'],
    applications: ['Dalles de grande portée', 'Poutres préfabriquées', 'Ponts et stationnements étagés'],
    notes: 'Conception spécialisée ; protection des ancrages et des gaines contre la corrosion essentielle.',
    keywords: ['béton', 'précontraint', 'post-tension', 'toron', 'portée', 'pont'],
  },
  {
    id: 'beton-leger', name: 'Béton léger', category: 'beton',
    description: 'Béton à granulats légers ou cellulaire, réduisant le poids propre et améliorant l’isolation.',
    properties: [
      { label: 'Masse volumique', value: '≈ 1100–1900 kg/m³' },
      { label: 'Isolation', value: 'meilleure que béton normal' },
      { label: 'Résistance', value: 'plus faible' },
    ],
    advantages: ['Poids propre réduit', 'Meilleure isolation thermique', 'Charges de fondation moindres'],
    disadvantages: ['Résistance/module plus faibles', 'Coût des granulats', 'Absorption d’eau à surveiller'],
    applications: ['Chapes et planchers', 'Éléments préfabriqués', 'Remplissages allégés'],
    notes: 'Vérifier résistance et module pour le calcul ; tenir compte de l’absorption des granulats.',
    keywords: ['béton', 'léger', 'granulats légers', 'cellulaire', 'isolation', 'chape'],
  },

  // ─── Maçonnerie ──────────────────────────────────────────────────────────────
  {
    id: 'mac-cmu', name: 'Bloc de béton (CMU)', category: 'maconnerie',
    description: 'Bloc de béton creux modulaire pour murs porteurs ou de remplissage, armé dans les alvéoles au besoin.',
    properties: [
      { label: 'Format nominal', value: '≈ 190×190×390 mm' },
      { label: 'Alvéoles', value: 'armables / coulables' },
      { label: 'Pose', value: 'au mortier' },
    ],
    advantages: ['Résistant au feu et à la compression', 'Économique et durable', 'Bonne masse acoustique', 'Armable pour reprendre la flexion'],
    disadvantages: ['Lourd', 'Pont thermique (isolation séparée requise)', 'Main-d’œuvre qualifiée', 'Étanchéité à soigner'],
    applications: ['Murs porteurs et de refend', 'Murs de fondation', 'Cloisons coupe-feu'],
    notes: 'Conception de la maçonnerie selon CSA S304 ; armatures et chaînages selon calcul.',
    keywords: ['maçonnerie', 'cmu', 'bloc', 'béton', 'mur porteur', 'alvéole'],
  },
  {
    id: 'mac-brique', name: 'Brique d’argile', category: 'maconnerie',
    description: 'Brique cuite utilisée surtout en revêtement (placage) sur ossature, posée au mortier devant une lame d’air drainée.',
    properties: [
      { label: 'Masse volumique', value: '≈ 1800–2000 kg/m³' },
      { label: 'Absorption', value: 'variable selon cuisson' },
      { label: 'Pose', value: 'placage + lame d’air' },
    ],
    advantages: ['Très durable et esthétique', 'Résistant au feu et aux intempéries', 'Faible entretien', 'Couleur stable'],
    disadvantages: ['Lourd (appuis/linteaux requis)', 'Main-d’œuvre qualifiée', 'Efflorescence possible', 'Coût'],
    applications: ['Revêtement extérieur (placage)', 'Murs de prestige', 'Restauration patrimoniale'],
    notes: 'Prévoir lame d’air drainée, solins et chantepleures (weep holes), attaches et joints de mouvement.',
    keywords: ['maçonnerie', 'brique', 'argile', 'placage', 'revêtement', 'chantepleure'],
  },
  {
    id: 'mac-pierre', name: 'Pierre naturelle', category: 'maconnerie',
    description: 'Granit, calcaire ou grès en parement ou en éléments, pour durabilité et valeur architecturale.',
    properties: [
      { label: 'Masse volumique', value: '≈ 2200–2800 kg/m³' },
      { label: 'Types', value: 'granit, calcaire, grès' },
      { label: 'Finitions', value: 'brut, poli, flammé' },
    ],
    advantages: ['Très durable et noble', 'Résistant au feu et à l’usure', 'Unique (aspect naturel)'],
    disadvantages: ['Coût élevé', 'Très lourd', 'Pose spécialisée', 'Certaines pierres poreuses/sensibles'],
    applications: ['Parements et placages', 'Seuils, appuis, dallages', 'Éléments décoratifs'],
    notes: 'Choisir la pierre selon porosité/gélivité et l’exposition. Ancrages inox en milieu humide.',
    keywords: ['maçonnerie', 'pierre', 'granit', 'calcaire', 'grès', 'parement'],
  },

  // ─── Isolation ───────────────────────────────────────────────────────────────
  {
    id: 'iso-laine-minerale', name: 'Laine minérale', category: 'isolation',
    description: 'Isolant fibreux (laine de roche ou de verre) en matelas ou panneaux, incombustible et perméable à la vapeur.',
    properties: [
      { label: 'Valeur isolante', value: '≈ RSI 0.7/po (R≈3.7/po)' },
      { label: 'Réaction au feu', value: 'incombustible' },
      { label: 'Vapeur', value: 'perméable' },
    ],
    advantages: ['Incombustible (laine de roche)', 'Bon affaiblissement acoustique', 'Ne retient pas l’eau durablement', 'Économique'],
    disadvantages: ['Tassement possible en matelas', 'Irritant à la pose (EPI)', 'Sensible à l’humidité si mouillée longtemps'],
    applications: ['Murs à ossature', 'Plafonds et combles', 'Isolation acoustique de cloisons'],
    notes: 'La laine de roche convient aux pare-feu et hautes températures. Associer à un pare-air/vapeur continu.',
    keywords: ['isolation', 'laine', 'minérale', 'roche', 'verre', 'acoustique', 'incombustible'],
  },
  {
    id: 'iso-eps', name: 'Polystyrène expansé (EPS)', category: 'isolation',
    description: 'Mousse rigide de billes expansées, isolant économique pour sous-dalle et murs.',
    properties: [
      { label: 'Valeur isolante', value: '≈ R 3.6–4.2/po' },
      { label: 'Absorption d’eau', value: 'faible à modérée' },
      { label: 'Compression', value: 'grades variés' },
    ],
    advantages: ['Économique', 'Léger', 'Stable dans le temps (pas de gaz à fuir)', 'Grades porteurs disponibles'],
    disadvantages: ['Combustible (barrière thermique requise)', 'Moins résistant à l’humidité que le XPS', 'Sensible aux solvants/UV'],
    applications: ['Sous-dalle', 'ICF (coffrages isolants)', 'Isolation extérieure'],
    notes: 'Protéger du feu (gypse/barrière) et des UV. Vérifier le grade de compression sous charge.',
    keywords: ['isolation', 'eps', 'polystyrène', 'expansé', 'mousse', 'sous-dalle', 'icf'],
  },
  {
    id: 'iso-xps', name: 'Polystyrène extrudé (XPS)', category: 'isolation',
    description: 'Mousse rigide à cellules fermées, résistante à l’humidité, pour fondations et toitures inversées.',
    properties: [
      { label: 'Valeur isolante', value: '≈ R 5/po' },
      { label: 'Absorption d’eau', value: 'très faible' },
      { label: 'Cellules', value: 'fermées' },
    ],
    advantages: ['Très bonne tenue à l’humidité', 'Rigide et résistant en compression', 'Valeur R stable', 'Pose simple'],
    disadvantages: ['Combustible', 'Coût > EPS', 'Impact environnemental des agents gonflants', 'Sensible aux UV/solvants'],
    applications: ['Isolation de fondation (extérieur)', 'Sous-dalle humide', 'Toiture inversée (protégée)'],
    notes: 'Excellent côté extérieur de fondation. Protéger du feu et des UV ; vérifier la compatibilité des membranes.',
    keywords: ['isolation', 'xps', 'polystyrène', 'extrudé', 'fondation', 'humidité'],
  },
  {
    id: 'iso-pur-gicle', name: 'Polyuréthane giclé (mousse)', category: 'isolation',
    description: 'Mousse projetée (cellules fermées) qui isole et assure l’étanchéité à l’air en une seule application.',
    properties: [
      { label: 'Valeur isolante', value: '≈ R 5–6/po (cell. fermées)' },
      { label: 'Pare-air', value: 'oui (cell. fermées)' },
      { label: 'Application', value: 'projetée in situ' },
    ],
    advantages: ['Isole et scelle l’air en même temps', 'Épouse les formes complexes', 'Valeur R élevée par pouce', 'Pare-vapeur (forte épaisseur, cell. fermées)'],
    disadvantages: ['Coût élevé', 'Pose par applicateur certifié', 'Émissions à la pose (délai de réoccupation)', 'Difficile à retirer'],
    applications: ['Étanchéité à l’air de l’enveloppe', 'Solives de rive, vides sanitaires', 'Toitures et zones irrégulières'],
    notes: 'Respecter les épaisseurs par passe et la barrière thermique requise. Ventiler pendant/après application.',
    keywords: ['isolation', 'polyuréthane', 'mousse', 'giclé', 'pare-air', 'cellules fermées'],
  },
  {
    id: 'iso-cellulose', name: 'Cellulose', category: 'isolation',
    description: 'Isolant de fibres de papier recyclé traité ignifuge, soufflé en combles ou insufflé en murs.',
    properties: [
      { label: 'Valeur isolante', value: '≈ R 3.2–3.8/po' },
      { label: 'Contenu recyclé', value: 'élevé' },
      { label: 'Application', value: 'soufflée / insufflée' },
    ],
    advantages: ['Forte teneur recyclée (écologique)', 'Bonne performance en vrac (remplit les vides)', 'Traitée ignifuge (sels de bore)', 'Bonne masse acoustique'],
    disadvantages: ['Tassement possible (combles)', 'Sensible à l’humidité', 'Pose par soufflage (équipement)', 'Poussière à la mise en œuvre'],
    applications: ['Combles (soufflée)', 'Murs existants (insufflée)', 'Rénovation énergétique'],
    notes: 'Respecter la densité d’installation pour limiter le tassement ; protéger de l’eau et associer à un pare-air.',
    keywords: ['isolation', 'cellulose', 'recyclé', 'soufflée', 'comble', 'écologique'],
  },

  // ─── Membranes ───────────────────────────────────────────────────────────────
  {
    id: 'mem-pare-air', name: 'Pare-air / pare-intempérie', category: 'membranes',
    description: 'Membrane (souvent un « house wrap ») posée derrière le revêtement pour bloquer l’air et l’eau liquide tout en laissant passer la vapeur.',
    properties: [
      { label: 'Air', value: 'étanche' },
      { label: 'Eau liquide', value: 'résistante' },
      { label: 'Vapeur', value: 'perméable' },
    ],
    advantages: ['Réduit les infiltrations d’air (efficacité énergétique)', 'Draine l’eau derrière le revêtement', 'Laisse sécher la paroi (perméable à la vapeur)'],
    disadvantages: ['Continuité difficile (jonctions, percements)', 'Sensible aux UV (couvrir rapidement)', 'Performance liée à la qualité de pose'],
    applications: ['Derrière les revêtements extérieurs', 'Continuité du plan d’air de l’enveloppe', 'Jonctions murs/fenêtres'],
    notes: 'La continuité du plan d’air est essentielle : rubaner les joints, intégrer solins et membranes d’ouverture.',
    keywords: ['membrane', 'pare-air', 'pare-intempérie', 'house wrap', 'enveloppe', 'étanchéité'],
  },
  {
    id: 'mem-pare-vapeur', name: 'Pare-vapeur', category: 'membranes',
    description: 'Couche freinant la diffusion de la vapeur d’eau, placée côté chaud en climat froid pour éviter la condensation dans la paroi.',
    properties: [
      { label: 'Perméance', value: 'faible (selon type)' },
      { label: 'Position', value: 'côté chaud (climat froid)' },
      { label: 'Matériaux', value: 'polyéthylène, peinture pare-vapeur' },
    ],
    advantages: ['Limite la condensation interstitielle', 'Améliore la durabilité de la paroi', 'Économique (polyéthylène)'],
    disadvantages: ['Mauvaise position = piège à humidité', 'Continuité requise', 'Inadapté à certains assemblages séchant vers l’intérieur'],
    applications: ['Murs et plafonds isolés en climat froid', 'Sous les finitions intérieures'],
    notes: 'Position et perméance selon le climat et l’assemblage : éviter une double barrière qui empêche le séchage.',
    keywords: ['membrane', 'pare-vapeur', 'vapeur', 'condensation', 'polyéthylène', 'climat'],
  },
  {
    id: 'mem-elastomere', name: 'Membrane élastomère (toiture)', category: 'membranes',
    description: 'Membrane bitumineuse modifiée (SBS), posée en deux plis soudés, pour toitures plates.',
    properties: [
      { label: 'Type', value: 'bitume modifié SBS' },
      { label: 'Pose', value: 'soudée (2 plis)' },
      { label: 'Pente', value: 'toits plats/faibles pentes' },
    ],
    advantages: ['Très étanche et durable', 'Bonne résistance mécanique', 'Réparable localement', 'Éprouvée en climat froid'],
    disadvantages: ['Pose à la flamme (risque/feu)', 'Main-d’œuvre qualifiée', 'Poids et nombre de couches'],
    applications: ['Toitures plates', 'Terrasses', 'Relevés et parapets'],
    notes: 'Soigner les relevés, drains et joints. Respecter les pratiques de pose à chaud (sécurité incendie).',
    keywords: ['membrane', 'élastomère', 'sbs', 'bitume', 'toiture plate', 'étanchéité'],
  },
  {
    id: 'mem-fondation', name: 'Membrane d’étanchéité de fondation', category: 'membranes',
    description: 'Revêtement/membrane appliqué sur le mur de fondation enterré pour bloquer l’eau et l’humidité du sol.',
    properties: [
      { label: 'Position', value: 'face extérieure enterrée' },
      { label: 'Types', value: 'liquide, autocollante, alvéolée' },
      { label: 'Drainage', value: 'associé au drain de fondation' },
    ],
    advantages: ['Protège le sous-sol de l’humidité', 'Couplée à une membrane de drainage', 'Durable si protégée'],
    disadvantages: ['Pose soignée requise (continuité)', 'Vulnérable au remblayage (protection)', 'Réparation difficile une fois enterrée'],
    applications: ['Murs de fondation et sous-sols', 'Vides sanitaires', 'Murs de soutènement'],
    notes: 'Associer à un drain de fondation et à une membrane de drainage ; protéger avant remblai.',
    keywords: ['membrane', 'fondation', 'étanchéité', 'imperméabilisation', 'drainage', 'sous-sol'],
  },

  // ─── Revêtements ─────────────────────────────────────────────────────────────
  {
    id: 'rev-fibrociment', name: 'Revêtement de fibrociment', category: 'revetements',
    description: 'Planches ou panneaux de ciment renforcé de fibres, imitant le bois, durables et peu inflammables.',
    properties: [
      { label: 'Composition', value: 'ciment + fibres' },
      { label: 'Feu', value: 'incombustible/limité' },
      { label: 'Formats', value: 'planches, panneaux' },
    ],
    advantages: ['Durable et stable', 'Résistant au feu et aux insectes', 'Faible entretien', 'Aspect bois possible'],
    disadvantages: ['Lourd et cassant à la pose', 'Coupe poussiéreuse (silice, EPI)', 'Coût > vinyle'],
    applications: ['Revêtement extérieur résidentiel', 'Panneaux architecturaux', 'Zones exigeant la résistance au feu'],
    notes: 'Pose sur lame d’air ventilée recommandée ; respecter jeux et scellants. EPI pour la découpe.',
    keywords: ['revêtement', 'fibrociment', 'parement', 'planche', 'extérieur'],
  },
  {
    id: 'rev-metallique', name: 'Revêtement métallique', category: 'revetements',
    description: 'Panneaux ou cassettes d’acier/aluminium prélaqués pour façades, durables et au rendu contemporain.',
    properties: [
      { label: 'Métaux', value: 'acier prélaqué, aluminium' },
      { label: 'Finitions', value: 'lisse, ondulé, cassette' },
      { label: 'Durabilité', value: 'élevée' },
    ],
    advantages: ['Durable et léger (aluminium)', 'Faible entretien', 'Recyclable', 'Rendu architectural net'],
    disadvantages: ['Bosselable', 'Dilatation thermique (fixations adaptées)', 'Bruit de pluie possible', 'Coût selon finition'],
    applications: ['Façades commerciales/industrielles', 'Accents architecturaux', 'Toitures et murs'],
    notes: 'Prévoir lame d’air ventilée, fixations tenant compte de la dilatation et compatibilité galvanique.',
    keywords: ['revêtement', 'métallique', 'acier', 'aluminium', 'façade', 'cassette'],
  },
  {
    id: 'rev-bois', name: 'Bardage de bois', category: 'revetements',
    description: 'Planches de bois (cèdre, pin traité) en parement extérieur, chaleureux mais demandant de l’entretien.',
    properties: [
      { label: 'Essences', value: 'cèdre, pin, mélèze' },
      { label: 'Pose', value: 'claire-voie / à recouvrement' },
      { label: 'Finition', value: 'teinture/peinture' },
    ],
    advantages: ['Aspect naturel chaleureux', 'Renouvelable', 'Réparable planche par planche', 'Léger'],
    disadvantages: ['Entretien régulier (teinture)', 'Sensible à l’humidité/insectes', 'Combustible', 'Grisaillement si non traité'],
    applications: ['Revêtement résidentiel', 'Accents (claire-voie)', 'Contexte patrimonial/rural'],
    notes: 'Poser sur lame d’air ventilée ; traiter toutes les faces et protéger les abouts. Détails de drainage soignés.',
    keywords: ['revêtement', 'bardage', 'bois', 'cèdre', 'claire-voie', 'parement'],
  },
  {
    id: 'rev-stucco', name: 'Stucco / crépi', category: 'revetements',
    description: 'Enduit de mortier appliqué en couches sur treillis, formant un parement continu.',
    properties: [
      { label: 'Composition', value: 'mortier de ciment/chaux' },
      { label: 'Support', value: 'treillis sur lame d’air' },
      { label: 'Couches', value: 'gobetis, corps, finition' },
    ],
    advantages: ['Surface continue sans joints', 'Durable et résistant au feu', 'Formes et textures variées', 'Bonne tenue dans le temps'],
    disadvantages: ['Fissuration si support instable', 'Pose qualifiée et météo-dépendante', 'Réparations visibles', 'Étanchéité des percements à soigner'],
    applications: ['Façades résidentielles/commerciales', 'Architecture méditerranéenne/contemporaine'],
    notes: 'Système à drainage (lame d’air) recommandé en climat humide ; solins et joints de contrôle requis.',
    keywords: ['revêtement', 'stucco', 'crépi', 'enduit', 'mortier', 'façade'],
  },

  // ─── Toitures ────────────────────────────────────────────────────────────────
  {
    id: 'toit-bardeaux', name: 'Bardeaux d’asphalte', category: 'toitures',
    description: 'Couverture la plus répandue en résidentiel : bardeaux bitumineux sur sous-couche, pour toits en pente.',
    properties: [
      { label: 'Pente', value: 'toits en pente' },
      { label: 'Durée de vie', value: '≈ 20–30 ans (selon produit)' },
      { label: 'Pose', value: 'clouée sur support' },
    ],
    advantages: ['Économique', 'Pose simple et rapide', 'Large choix de couleurs', 'Réparable'],
    disadvantages: ['Durée de vie limitée', 'Sensible au vent/grêle', 'Sous-couche/ventilation essentielles', 'Combustible (classe à vérifier)'],
    applications: ['Toitures résidentielles en pente', 'Rénovation de couverture'],
    notes: 'Prévoir membrane de protection (avaloirs, noues, débords) et ventilation des combles adéquate.',
    keywords: ['toiture', 'bardeaux', 'asphalte', 'pente', 'couverture', 'résidentiel'],
  },
  {
    id: 'toit-metallique', name: 'Toiture métallique', category: 'toitures',
    description: 'Couverture en panneaux d’acier ou d’aluminium (à joint debout ou nervuré), très durable.',
    properties: [
      { label: 'Durée de vie', value: '≈ 40–70 ans' },
      { label: 'Systèmes', value: 'joint debout, nervuré' },
      { label: 'Poids', value: 'léger' },
    ],
    advantages: ['Très longue durée de vie', 'Léger et étanche', 'Évacue neige/eau', 'Recyclable', 'Performant en feu (classe selon assemblage)'],
    disadvantages: ['Coût initial élevé', 'Pose spécialisée', 'Dilatation thermique', 'Bruit/condensation à gérer'],
    applications: ['Toitures résidentielles et agricoles', 'Bâtiments commerciaux', 'Climats neigeux'],
    notes: 'Gérer la dilatation (fixations coulissantes), la condensation (sous-couche) et les arrêts de neige.',
    keywords: ['toiture', 'métallique', 'acier', 'joint debout', 'couverture', 'durable'],
  },
  {
    id: 'toit-tpo', name: 'Membrane de toiture TPO', category: 'toitures',
    description: 'Membrane monocouche thermoplastique (polyoléfine) à joints thermosoudés, pour toits plats commerciaux.',
    properties: [
      { label: 'Type', value: 'monocouche thermoplastique' },
      { label: 'Joints', value: 'thermosoudés' },
      { label: 'Couleur', value: 'souvent réfléchissante (blanc)' },
    ],
    advantages: ['Joints soudés fiables (pas de flamme)', 'Surface réfléchissante (gain thermique l’été)', 'Léger', 'Bon rapport coût/performance'],
    disadvantages: ['Qualité variable selon fabricant/épaisseur', 'Perforations possibles', 'Détails de relevés à soigner'],
    applications: ['Toitures plates commerciales/industrielles', 'Réfection de toits plats'],
    notes: 'Choisir l’épaisseur et le mode de fixation selon l’exposition au vent ; soigner relevés et drains.',
    keywords: ['toiture', 'tpo', 'membrane', 'monocouche', 'toit plat', 'thermoplastique'],
  },
  {
    id: 'toit-vegetalisee', name: 'Toiture végétalisée', category: 'toitures',
    description: 'Toiture plate recouverte d’un complexe de drainage, substrat et végétation, sur membrane anti-racines.',
    properties: [
      { label: 'Types', value: 'extensive / intensive' },
      { label: 'Charge', value: 'surcharge importante' },
      { label: 'Complexe', value: 'drainage + substrat + végétaux' },
    ],
    advantages: ['Gestion des eaux pluviales', 'Inertie thermique et îlot de chaleur réduit', 'Protège la membrane (UV)', 'Biodiversité/esthétique'],
    disadvantages: ['Surcharge structurale (calcul requis)', 'Entretien et irrigation', 'Coût et complexité', 'Étanchéité critique (anti-racines)'],
    applications: ['Toits plats accessibles ou écologiques', 'Bâtiments visant la certification', 'Milieu urbain dense'],
    notes: 'Vérifier la capacité structurale (saturée), la membrane anti-racines et l’accès pour l’entretien.',
    keywords: ['toiture', 'végétalisée', 'verte', 'extensive', 'intensive', 'eaux pluviales'],
  },

  // ─── Portes ──────────────────────────────────────────────────────────────────
  {
    id: 'porte-acier-isolee', name: 'Porte d’acier isolée', category: 'portes',
    description: 'Porte à âme isolante (mousse) et parements d’acier, courante pour les entrées extérieures.',
    properties: [
      { label: 'Âme', value: 'mousse isolante' },
      { label: 'Parement', value: 'acier' },
      { label: 'Isolation', value: 'bonne (vs bois plein)' },
    ],
    advantages: ['Bonne isolation et étanchéité', 'Robuste et sécuritaire', 'Entretien faible', 'Économique'],
    disadvantages: ['Bossellement difficile à réparer', 'Pont thermique aux rives', 'Corrosion si revêtement abîmé', 'Aspect moins noble'],
    applications: ['Portes d’entrée extérieures', 'Accès de service', 'Logements et commerces'],
    notes: 'Vérifier le coupe-froid, le seuil et l’ajustement du cadre. Pour les issues, respecter la quincaillerie réglementaire.',
    keywords: ['porte', 'acier', 'isolée', 'entrée', 'extérieure'],
  },
  {
    id: 'porte-bois', name: 'Porte en bois', category: 'portes',
    description: 'Porte intérieure ou extérieure en bois massif ou âme alvéolée/pleine, pour chaleur et finition.',
    properties: [
      { label: 'Types', value: 'âme creuse/pleine, massif' },
      { label: 'Usage', value: 'intérieur surtout' },
      { label: 'Finition', value: 'peinte/vernie' },
    ],
    advantages: ['Esthétique chaleureuse', 'Usinable et réparable', 'Bonne masse (âme pleine = acoustique)'],
    disadvantages: ['Sensible à l’humidité (gauchissement)', 'Entretien en extérieur', 'Combustible', 'Coût (bois massif)'],
    applications: ['Portes intérieures', 'Portes d’entrée de prestige (protégées)', 'Rénovation patrimoniale'],
    notes: 'En extérieur, protéger par un débord/auvent et finir toutes les faces. Pour coupe-feu, utiliser une porte homologuée.',
    keywords: ['porte', 'bois', 'intérieure', 'massif', 'alvéolée'],
  },
  {
    id: 'porte-coupe-feu', name: 'Porte coupe-feu', category: 'portes',
    description: 'Ensemble porte-cadre-quincaillerie homologué offrant un degré de résistance au feu pour les séparations.',
    properties: [
      { label: 'Degré', value: 'classé (ex. 20–90 min)' },
      { label: 'Ensemble', value: 'porte + cadre + quincaillerie' },
      { label: 'Ferme-porte', value: 'auto-fermant requis' },
    ],
    advantages: ['Compartimentage incendie', 'Ensemble homologué et étiqueté', 'Sécurité des issues'],
    disadvantages: ['Doit rester conforme (ne pas modifier)', 'Quincaillerie spécifique', 'Coût', 'Maintenance des ferme-portes'],
    applications: ['Séparations coupe-feu', 'Cages d’escalier et issues', 'Locaux techniques'],
    notes: 'Le degré et l’étiquette doivent correspondre à la séparation exigée ; conserver l’auto-fermeture et les joints intumescents.',
    keywords: ['porte', 'coupe-feu', 'résistance au feu', 'issue', 'compartimentage', 'homologuée'],
  },

  // ─── Fenêtres ────────────────────────────────────────────────────────────────
  {
    id: 'fen-igu', name: 'Vitrage isolant (IGU)', category: 'fenetres',
    description: 'Double ou triple vitrage scellé avec espace gazeux (argon) et couche Low-E pour réduire les pertes thermiques.',
    properties: [
      { label: 'Configurations', value: 'double / triple' },
      { label: 'Gaz', value: 'argon (souvent)' },
      { label: 'Couche', value: 'Low-E' },
    ],
    advantages: ['Réduit fortement les pertes thermiques', 'Améliore le confort (surface intérieure plus chaude)', 'Limite la condensation', 'Atténue le bruit'],
    disadvantages: ['Joint d’étanchéité périssable (embuage si défaillant)', 'Poids (triple)', 'Coût croissant avec la performance'],
    applications: ['Fenêtres et portes-fenêtres', 'Murs-rideaux', 'Rénovation énergétique'],
    notes: 'Choisir le coefficient (U) et le gain solaire (SHGC) selon l’orientation et le climat ; intercalaire « warm-edge » recommandé.',
    keywords: ['fenêtre', 'vitrage', 'igu', 'double', 'triple', 'low-e', 'argon'],
  },
  {
    id: 'fen-pvc', name: 'Fenêtre PVC', category: 'fenetres',
    description: 'Cadre de fenêtre en polychlorure de vinyle, économique et performant thermiquement.',
    properties: [
      { label: 'Cadre', value: 'PVC (multi-chambres)' },
      { label: 'Thermique', value: 'bon (cadre isolant)' },
      { label: 'Entretien', value: 'faible' },
    ],
    advantages: ['Bonne performance thermique', 'Entretien minimal', 'Économique', 'Bonne étanchéité'],
    disadvantages: ['Dilatation thermique (couleurs foncées)', 'Aspect moins noble', 'Recyclage limité', 'Tenue des grands formats'],
    applications: ['Fenêtres résidentielles', 'Rénovation', 'Logements multiples'],
    notes: 'Limiter les grands formats foncés (dilatation) ; vérifier le renforcement des cadres et la quincaillerie.',
    keywords: ['fenêtre', 'pvc', 'vinyle', 'cadre', 'résidentiel'],
  },
  {
    id: 'fen-aluminium', name: 'Fenêtre aluminium', category: 'fenetres',
    description: 'Cadre d’aluminium à rupture de pont thermique, robuste pour grands formats et usages commerciaux.',
    properties: [
      { label: 'Cadre', value: 'aluminium' },
      { label: 'Thermique', value: 'rupture de pont thermique requise' },
      { label: 'Formats', value: 'grands possibles' },
    ],
    advantages: ['Robuste et durable', 'Sections fines (grandes surfaces vitrées)', 'Stable dimensionnellement', 'Finitions anodisées/peintes'],
    disadvantages: ['Conducteur (pont thermique sans rupture)', 'Condensation possible', 'Coût', 'Sensibilité galvanique'],
    applications: ['Murs-rideaux et façades', 'Bâtiments commerciaux', 'Grandes baies'],
    notes: 'Exiger une rupture de pont thermique en climat froid ; vérifier les performances U et la gestion de la condensation.',
    keywords: ['fenêtre', 'aluminium', 'mur-rideau', 'rupture pont thermique', 'commercial'],
  },
  {
    id: 'fen-bois', name: 'Fenêtre bois (et bois-aluminium)', category: 'fenetres',
    description: 'Cadre bois (parfois capoté d’aluminium côté extérieur) alliant chaleur intérieure et durabilité extérieure.',
    properties: [
      { label: 'Cadre', value: 'bois (ext. capoté alu possible)' },
      { label: 'Thermique', value: 'bon (bois isolant)' },
      { label: 'Entretien', value: 'moyen (bois exposé)' },
    ],
    advantages: ['Chaleur et esthétique intérieure', 'Bon isolant naturel', 'Version capotée alu = faible entretien extérieur'],
    disadvantages: ['Entretien si bois exposé', 'Coût élevé', 'Sensible à l’humidité', 'Poids'],
    applications: ['Résidentiel haut de gamme', 'Patrimoine', 'Projets soignés'],
    notes: 'Le capotage aluminium protège l’extérieur ; soigner les solins d’appui et le calfeutrage périphérique.',
    keywords: ['fenêtre', 'bois', 'bois-aluminium', 'capoté', 'résidentiel'],
  },

  // ─── Produits techniques ───────────────────────────────────────────────────
  {
    id: 'pt-gypse', name: 'Plaque de plâtre (gypse)', category: 'produits-techniques',
    description: 'Panneau de plâtre entre deux cartons, finition intérieure standard ; versions type X (feu), hydrofuge, antibruit.',
    properties: [
      { label: 'Épaisseurs', value: '≈ 12.7 / 15.9 mm' },
      { label: 'Types', value: 'régulier, type X, hydrofuge' },
      { label: 'Feu', value: 'contribue aux ensembles cotés' },
    ],
    advantages: ['Économique et rapide à poser', 'Contribue à la résistance au feu (type X)', 'Finition lisse', 'Versions hydrofuge/antibruit'],
    disadvantages: ['Sensible à l’eau (régulier)', 'Fragile aux chocs', 'Poussière au ponçage', 'Reprise des joints visible si mal faite'],
    applications: ['Murs et plafonds intérieurs', 'Séparations coupe-feu (ensembles cotés)', 'Locaux humides (hydrofuge/cimentaire)'],
    notes: 'Utiliser le type approprié (type X pour le feu, cimentaire en zone mouillée). Respecter les ensembles cotés au feu.',
    keywords: ['gypse', 'plâtre', 'placoplâtre', 'type x', 'cloison', 'plafond', 'feu'],
  },
  {
    id: 'pt-scellant', name: 'Scellant / calfeutrant', category: 'produits-techniques',
    description: 'Produit d’étanchéité élastique (silicone, polyuréthane) pour joints de mouvement et percements.',
    properties: [
      { label: 'Familles', value: 'silicone, polyuréthane, hybride' },
      { label: 'Élasticité', value: 'mouvement admissible variable' },
      { label: 'Adhérence', value: 'selon support (apprêt)' },
    ],
    advantages: ['Étanche à l’air/eau aux joints', 'Élastique (suit les mouvements)', 'Large gamme de supports', 'Application simple'],
    disadvantages: ['Durée de vie limitée (à inspecter)', 'Adhérence sensible à la préparation', 'Compatibilité support/peinture à vérifier'],
    applications: ['Joints périmétriques de fenêtres/portes', 'Joints de dilatation', 'Étanchéité de pénétrations'],
    notes: 'Utiliser un fond de joint et respecter le ratio largeur/profondeur. Choisir un scellant compatible (peinture, support).',
    keywords: ['scellant', 'calfeutrant', 'silicone', 'polyuréthane', 'joint', 'étanchéité'],
  },
  {
    id: 'pt-solin', name: 'Solin métallique', category: 'produits-techniques',
    description: 'Pièce métallique façonnée (acier galvanisé, aluminium) dirigeant l’eau hors des jonctions vulnérables.',
    properties: [
      { label: 'Métaux', value: 'galvanisé, aluminium, cuivre' },
      { label: 'Rôle', value: 'gestion de l’eau aux jonctions' },
      { label: 'Façonnage', value: 'plié sur mesure' },
    ],
    advantages: ['Détourne l’eau efficacement', 'Durable', 'Façonnable sur mesure', 'Protège les jonctions critiques'],
    disadvantages: ['Mise en œuvre soignée requise', 'Dilatation et fixation à gérer', 'Compatibilité galvanique', 'Corrosion si mal choisi'],
    applications: ['Têtes/appuis de fenêtres et portes', 'Noues, larmiers, contre-solins', 'Parapets et pénétrations de toiture'],
    notes: 'Intégrer les solins par recouvrement (toujours « par-dessus » l’élément inférieur) et compatibles avec les membranes.',
    keywords: ['solin', 'flashing', 'métallique', 'larmier', 'jonction', 'eau'],
  },
  {
    id: 'pt-geotextile', name: 'Géotextile', category: 'produits-techniques',
    description: 'Textile perméable (tissé ou non-tissé) de séparation, filtration et drainage dans les ouvrages en sol.',
    properties: [
      { label: 'Types', value: 'tissé / non-tissé' },
      { label: 'Fonctions', value: 'séparation, filtration, drainage' },
      { label: 'Perméabilité', value: 'à l’eau, retient les fines' },
    ],
    advantages: ['Empêche le colmatage des drains', 'Sépare sol/granulat', 'Renforce et stabilise', 'Économique'],
    disadvantages: ['Sensible aux UV (couvrir)', 'Choix du grade selon fonction', 'Pose et recouvrements à respecter'],
    applications: ['Enrobage de drains de fondation', 'Sous les granulats (séparation)', 'Murs de soutènement, talus'],
    notes: 'Choisir le grade selon la fonction (filtration vs séparation) et respecter les recouvrements. Protéger des UV avant remblai.',
    keywords: ['géotextile', 'drainage', 'filtration', 'séparation', 'sol', 'drain'],
  },
]

const BY_ID = new Map(MATERIALS.map((m) => [m.id, m]))

export function getMaterial(id: string): Material | undefined {
  return BY_ID.get(id)
}

export function materialCategories(): MaterialCategory[] {
  const seen = new Set<MaterialCategory>()
  for (const m of MATERIALS) seen.add(m.category)
  return [...seen]
}

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

/** Recherche dans nom, description, mots-clés, applications et catégorie. */
export function searchMaterials(query: string, category?: MaterialCategory | 'all'): Material[] {
  let list = MATERIALS
  if (category && category !== 'all') list = list.filter((m) => m.category === category)
  const q = normalize(query)
  if (q === '') return list
  return list.filter((m) => {
    const hay = normalize(
      [m.name, m.description, m.keywords.join(' '), m.applications.join(' '), m.category].join(' '),
    )
    return hay.includes(q)
  })
}
