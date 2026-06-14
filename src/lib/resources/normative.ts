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
  | 'energie'
  | 'securite-chantier'

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
  energie: 'Énergie',
  'securite-chantier': 'Sécurité chantier',
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

  // ─── CNB (V2) ────────────────────────────────────────────────────────────────
  {
    id: 'cnb-divisions', title: 'Structure du CNB (Divisions A, B, C)', category: 'cnb',
    summary: 'Le CNB est organisé en trois divisions : A (conformité, objectifs, énoncés fonctionnels), B (solutions acceptables, le cœur technique) et C (dispositions administratives). Comprendre cette structure aide à situer une exigence.',
    keywords: ['division', 'objectifs', 'solutions acceptables', 'structure', 'partie'],
    jurisdiction: 'Canada', edition: 'à vérifier', confidence: 'concept',
    source: 'Code national du bâtiment (texte officiel)',
  },
  {
    id: 'cnb-parties', title: 'Parties du CNB et champ d’application', category: 'cnb',
    summary: 'La Division B est découpée en parties (ex. sécurité incendie, conception structurale, plomberie, efficacité énergétique). Selon la taille et l’usage, un bâtiment relève de la partie 3 (grand/complexe) ou de la partie 9 (habitations et petits bâtiments).',
    keywords: ['partie 3', 'partie 9', 'champ d’application', 'habitation', 'petit bâtiment'],
    jurisdiction: 'Canada', edition: 'à vérifier', confidence: 'concept',
  },
  {
    id: 'cnb-extinction', title: 'Systèmes de gicleurs et exigences modulées', category: 'cnb',
    summary: 'La présence d’un système de gicleurs conforme modifie de nombreuses exigences (aires, hauteurs, séparations, distances de parcours). Le gicleur est souvent une condition pour des assouplissements ; sa conception suit une norme reconnue.',
    keywords: ['gicleurs', 'extinction', 'sprinkler', 'aire', 'assouplissement'],
    jurisdiction: 'Canada', edition: 'à vérifier', confidence: 'concept',
  },

  // ─── CCQ / RBQ (V2) ──────────────────────────────────────────────────────────
  {
    id: 'ccq-chapitres', title: 'CCQ — chapitres (Bâtiment, Plomberie…)', category: 'ccq',
    summary: 'Le Code de construction du Québec comporte plusieurs chapitres (dont Bâtiment qui adopte le CNB modifié, Plomberie, Électricité, Gaz, Efficacité énergétique). Identifier le bon chapitre est essentiel pour la discipline visée.',
    keywords: ['chapitre', 'bâtiment', 'plomberie', 'électricité', 'gaz'],
    jurisdiction: 'Québec', edition: 'à vérifier', confidence: 'concept',
  },
  {
    id: 'rbq-plans', title: 'RBQ — plans, devis et surveillance', category: 'rbq',
    summary: 'Certains travaux exigent des plans et devis signés par un professionnel et une surveillance. Les seuils dépendent de la nature et de l’ampleur du projet ; vérifier l’obligation de plans scellés et de surveillance.',
    keywords: ['plans', 'devis', 'professionnel', 'surveillance', 'sceau'],
    jurisdiction: 'Québec', edition: 'à vérifier', confidence: 'concept',
  },
  {
    id: 'rbq-garanties', title: 'RBQ — garantie des bâtiments résidentiels', category: 'rbq',
    summary: 'Les bâtiments résidentiels neufs admissibles sont couverts par un plan de garantie obligatoire encadrant les vices et malfaçons sur des périodes définies. Vérifier l’admissibilité et les couvertures applicables au projet.',
    keywords: ['garantie', 'résidentiel', 'malfaçon', 'vice', 'neuf'],
    jurisdiction: 'Québec', edition: 'à vérifier', confidence: 'concept',
  },

  // ─── CSA (V2) ────────────────────────────────────────────────────────────────
  {
    id: 'csa-s16', title: 'CSA S16 — calcul des charpentes d’acier', category: 'csa',
    summary: 'La norme CSA S16 régit la conception des structures en acier (résistances, stabilité, assemblages) selon le calcul aux états limites. Référencée par le code pour la charpente d’acier ; vérifier l’édition applicable.',
    keywords: ['csa', 's16', 'acier', 'charpente', 'états limites'],
    jurisdiction: 'Canada', edition: 'à vérifier', confidence: 'concept',
  },
  {
    id: 'csa-a233', title: 'CSA A23.3 / A23.1 — béton', category: 'csa',
    summary: 'CSA A23.3 couvre le calcul des structures en béton et A23.1/A23.2 les matériaux et l’exécution (classes d’exposition, enrobage, cure). Ensemble, elles encadrent la conception et la mise en œuvre du béton.',
    keywords: ['csa', 'a23.3', 'a23.1', 'béton', 'enrobage', 'exposition'],
    jurisdiction: 'Canada', edition: 'à vérifier', confidence: 'concept',
  },
  {
    id: 'csa-b651', title: 'CSA B651 — conception accessible', category: 'csa',
    summary: 'CSA B651 fournit des critères de conception sans obstacle (parcours, manœuvres, signalisation) souvent référencés en complément du code. Utile pour viser une accessibilité au-delà du minimum réglementaire.',
    keywords: ['csa', 'b651', 'accessibilité', 'sans obstacle', 'conception'],
    jurisdiction: 'Canada', edition: 'à vérifier', confidence: 'concept',
  },

  // ─── NFPA (V2) ───────────────────────────────────────────────────────────────
  {
    id: 'nfpa-13', title: 'NFPA 13 — gicleurs (référence)', category: 'nfpa',
    summary: 'NFPA 13 est une norme de référence pour la conception et l’installation des systèmes de gicleurs (densité, surface, classes de risque). Au Canada, la norme applicable est celle référencée par le code en vigueur — à vérifier.',
    keywords: ['nfpa 13', 'gicleurs', 'sprinkler', 'densité', 'risque'],
    jurisdiction: 'à vérifier', edition: 'à vérifier', confidence: 'concept',
  },
  {
    id: 'nfpa-72', title: 'NFPA 72 — alarme et détection (référence)', category: 'nfpa',
    summary: 'NFPA 72 est une norme de référence pour les systèmes d’alarme incendie et de détection (initiation, notification, surveillance). La norme réellement applicable est celle exigée par le code local — à vérifier.',
    keywords: ['nfpa 72', 'alarme', 'détection', 'notification', 'incendie'],
    jurisdiction: 'à vérifier', edition: 'à vérifier', confidence: 'concept',
  },

  // ─── Accessibilité (V2) ──────────────────────────────────────────────────────
  {
    id: 'accessibilite-toilettes', title: 'Salle de toilette accessible', category: 'accessibilite',
    summary: 'Une salle de toilette accessible offre une aire de manœuvre pour fauteuil, des barres d’appui, une cuvette et un lavabo à hauteurs adaptées, et une porte manœuvrable. Les dégagements précis sont fixés par le code/normes — à vérifier.',
    keywords: ['toilette', 'accessible', 'barre d’appui', 'manœuvre', 'fauteuil'],
    jurisdiction: 'à vérifier', edition: 'à vérifier', confidence: 'concept',
  },
  {
    id: 'accessibilite-rampe', title: 'Rampes accessibles — pente et paliers', category: 'accessibilite',
    summary: 'Une rampe accessible respecte une pente maximale, des paliers de repos à intervalles, une largeur libre, des bordures de protection et des mains courantes. Les valeurs limites dépendent du code/normes — à vérifier.',
    keywords: ['rampe', 'pente', 'palier', 'main courante', 'accessibilité'],
    jurisdiction: 'à vérifier', edition: 'à vérifier', confidence: 'indicatif',
  },

  // ─── Sécurité incendie (V2) ──────────────────────────────────────────────────
  {
    id: 'incendie-propagation', title: 'Indices de propagation de la flamme', category: 'incendie',
    summary: 'Les revêtements intérieurs de finition ont des indices de propagation de la flamme et parfois de pouvoir fumigène limités selon l’emplacement (issues, corridors, pièces). Choisir des matériaux classés en conséquence.',
    keywords: ['propagation', 'flamme', 'fumée', 'revêtement', 'finition'],
    jurisdiction: 'à vérifier', edition: 'à vérifier', confidence: 'concept',
  },
  {
    id: 'incendie-detection', title: 'Détection et alarme incendie', category: 'incendie',
    summary: 'Selon l’usage et la taille, un système d’alarme et de détection (détecteurs, avertisseurs, signalisation) est requis. Les avertisseurs de fumée résidentiels et les systèmes plus complets répondent à des exigences distinctes — à vérifier.',
    keywords: ['détection', 'alarme', 'avertisseur', 'fumée', 'signalisation'],
    jurisdiction: 'à vérifier', edition: 'à vérifier', confidence: 'concept',
  },
  {
    id: 'incendie-distance-limitative', title: 'Distance limitative et façade de rayonnement', category: 'incendie',
    summary: 'La distance limitative (par rapport aux limites de propriété) conditionne la proportion d’ouvertures permises et les exigences de protection de la façade pour limiter la propagation entre bâtiments. Le calcul dépend de l’aire de façade — à vérifier.',
    keywords: ['distance limitative', 'façade', 'rayonnement', 'ouvertures', 'propagation'],
    jurisdiction: 'à vérifier', edition: 'à vérifier', confidence: 'concept',
  },

  // ─── Issues (V2) ─────────────────────────────────────────────────────────────
  {
    id: 'issues-largeur', title: 'Largeur des moyens d’évacuation', category: 'issues',
    summary: 'La largeur des moyens d’évacuation (corridors, portes, escaliers d’issue) se calcule en fonction du nombre de personnes desservies. Les escaliers et les portes ont des largeurs minimales selon l’usage — à vérifier.',
    keywords: ['largeur', 'évacuation', 'corridor', 'escalier d’issue', 'occupants'],
    jurisdiction: 'à vérifier', edition: 'à vérifier', confidence: 'concept',
  },
  {
    id: 'issues-eclairage', title: 'Éclairage de sécurité et signalisation d’issue', category: 'issues',
    summary: 'Les moyens d’évacuation requièrent un éclairage de sécurité (alimentation de secours) et une signalisation d’issue lisible. Les durées d’autonomie et l’emplacement des enseignes sont réglementés — à vérifier.',
    keywords: ['éclairage de sécurité', 'signalisation', 'issue', 'secours', 'enseigne'],
    jurisdiction: 'à vérifier', edition: 'à vérifier', confidence: 'concept',
  },

  // ─── Escaliers / Garde-corps / Portes (V2) ───────────────────────────────────
  {
    id: 'escaliers-echappee', title: 'Escaliers — échappée et largeur', category: 'escaliers',
    summary: 'La hauteur d’échappée (dégagement vertical au-dessus du nez de marche) et la largeur libre de l’escalier ont des minimums selon l’usage. Les mains courantes et leur continuité sont également réglementées — à vérifier.',
    keywords: ['échappée', 'largeur', 'main courante', 'escalier', 'dégagement'],
    jurisdiction: 'à vérifier', edition: 'à vérifier', confidence: 'indicatif',
  },
  {
    id: 'garde-corps-charges', title: 'Garde-corps — charges de calcul', category: 'garde-corps',
    summary: 'Un garde-corps doit résister à des charges (horizontale linéaire en lisse, charge concentrée, et parfois charge sur le remplissage). Ces efforts servent à dimensionner les poteaux et leurs ancrages — valeurs à vérifier au code.',
    keywords: ['garde-corps', 'charge', 'lisse', 'ancrage', 'effort'],
    jurisdiction: 'à vérifier', edition: 'à vérifier', confidence: 'concept',
  },
  {
    id: 'portes-anti-panique', title: 'Portes d’issue — quincaillerie anti-panique', category: 'portes',
    summary: 'Certaines portes d’issue desservant un grand nombre de personnes exigent une quincaillerie anti-panique (barre) permettant l’ouverture sous simple poussée, sans clé ni connaissance particulière. Conditions selon l’usage et l’occupation — à vérifier.',
    keywords: ['anti-panique', 'barre', 'issue', 'ouverture', 'occupation'],
    jurisdiction: 'à vérifier', edition: 'à vérifier', confidence: 'concept',
  },

  // ─── Stationnement / Structure / Enveloppe (V2) ──────────────────────────────
  {
    id: 'stationnement-ventilation', title: 'Garages de stationnement — ventilation', category: 'stationnement',
    summary: 'Les garages de stationnement intérieurs requièrent une ventilation (souvent mécanique avec détection de CO) pour évacuer les gaz d’échappement, ainsi que des séparations coupe-feu avec les espaces occupés. Débits et détection à vérifier.',
    keywords: ['garage', 'ventilation', 'monoxyde', 'co', 'séparation'],
    jurisdiction: 'à vérifier', edition: 'à vérifier', confidence: 'concept',
  },
  {
    id: 'structure-fleches', title: 'États limites de service — flèches', category: 'structure',
    summary: 'Au-delà de la résistance (ELU), les éléments doivent respecter des limites de flèche et de vibration (ELS) pour le confort et l’intégrité des finitions. Les limites s’expriment souvent en fraction de la portée — à vérifier.',
    keywords: ['flèche', 'service', 'els', 'vibration', 'portée'],
    jurisdiction: 'à vérifier', edition: 'à vérifier', confidence: 'concept',
  },
  {
    id: 'enveloppe-etancheite-air', title: 'Étanchéité à l’air de l’enveloppe', category: 'enveloppe',
    summary: 'Un plan d’air continu et étanche réduit les infiltrations, la condensation et les pertes énergétiques. La continuité aux jonctions (murs, toit, fondation, ouvertures) et parfois un essai d’infiltrométrie sont visés — à vérifier.',
    keywords: ['étanchéité à l’air', 'pare-air', 'continuité', 'infiltrométrie', 'enveloppe'],
    jurisdiction: 'à vérifier', edition: 'à vérifier', confidence: 'concept',
  },

  // ─── Énergie (V2 — nouvelle catégorie) ───────────────────────────────────────
  {
    id: 'energie-cneb', title: 'Efficacité énergétique du bâtiment', category: 'energie',
    summary: 'Les exigences d’efficacité énergétique (isolation minimale de l’enveloppe, étanchéité à l’air, fenestration, équipements) visent à limiter la consommation. La conformité peut suivre une voie prescriptive ou de performance — à vérifier selon la juridiction.',
    keywords: ['énergie', 'efficacité', 'isolation', 'enveloppe', 'performance', 'prescriptif'],
    jurisdiction: 'à vérifier', edition: 'à vérifier', confidence: 'concept',
  },
  {
    id: 'energie-fenestration', title: 'Fenestration et performance thermique', category: 'energie',
    summary: 'La fenestration est encadrée par un coefficient de transmission thermique (U) maximal, parfois un gain solaire (SHGC), et un ratio de surface vitrée. Ces critères équilibrent éclairage naturel et pertes thermiques — valeurs à vérifier.',
    keywords: ['fenestration', 'transmission thermique', 'u', 'shgc', 'ratio vitré'],
    jurisdiction: 'à vérifier', edition: 'à vérifier', confidence: 'concept',
  },

  // ─── Sécurité chantier (V2 — nouvelle catégorie) ─────────────────────────────
  {
    id: 'chantier-chutes', title: 'Protection contre les chutes (chantier)', category: 'securite-chantier',
    summary: 'Sur les chantiers, la protection contre les chutes (garde-corps temporaires, systèmes d’arrêt de chute, filets) est exigée au-delà d’une certaine hauteur. Les obligations relèvent de la réglementation santé-sécurité au travail — à vérifier (ex. CNESST au Québec).',
    keywords: ['chantier', 'chute', 'harnais', 'garde-corps temporaire', 'cnesst', 'sst'],
    jurisdiction: 'à vérifier', edition: 'à vérifier', confidence: 'concept',
  },
  {
    id: 'chantier-excavation', title: 'Excavations et tranchées (chantier)', category: 'securite-chantier',
    summary: 'Les excavations et tranchées exigent une protection contre l’effondrement (talutage, étançonnement, caisson) selon la profondeur et le type de sol, ainsi que la gestion des accès et des charges en bordure. Obligations en santé-sécurité — à vérifier.',
    keywords: ['excavation', 'tranchée', 'étançonnement', 'talutage', 'effondrement', 'sst'],
    jurisdiction: 'à vérifier', edition: 'à vérifier', confidence: 'concept',
  },
  {
    id: 'chantier-echafaudage', title: 'Échafaudages (chantier)', category: 'securite-chantier',
    summary: 'Les échafaudages doivent être conçus, montés et inspectés selon des règles (capacité, stabilité, ancrages, garde-corps, accès). Le montage par des personnes compétentes et l’inspection avant usage relèvent de la santé-sécurité — à vérifier.',
    keywords: ['échafaudage', 'stabilité', 'ancrage', 'inspection', 'accès', 'sst'],
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
