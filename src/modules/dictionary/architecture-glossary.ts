/**
 * architecture-glossary — base intégrée du Dictionnaire V2.
 *
 * Glossaire français d'architecture / construction (terminologie usuelle au
 * Québec et au Canada), consultable hors ligne sans aucun provider IA.
 * Fournit aussi `searchGlossary(query)` : recherche normalisée (accents,
 * casse) sur le terme, les synonymes et le contenu des définitions.
 */

export interface GlossaryEntry {
  term: string
  definition: string
  synonyms: string[]
  antonyms?: string[]
  example?: string
  category: string
}

export const GLOSSARY_CATEGORIES = [
  'Structure',
  'Fondations',
  'Charpente',
  'Enveloppe',
  'Ouvertures',
  'Escaliers',
  'Sécurité',
  'Dessin',
  'Aménagement',
] as const

export const ARCHITECTURE_GLOSSARY: GlossaryEntry[] = [
  // ── Structure ───────────────────────────────────────────────────────────────
  {
    term: 'poutre',
    definition:
      'Élément structural horizontal qui reprend les charges des planchers, solives ou toitures et les transmet aux poteaux ou aux murs porteurs. Elle travaille principalement en flexion.',
    synonyms: ['sommier', 'poutre maîtresse'],
    example: 'Une poutre en lamellé-collé franchit la portée de 8 m du séjour.',
    category: 'Structure',
  },
  {
    term: 'poteau',
    definition:
      'Élément structural vertical qui transmet les charges des poutres et des planchers vers les fondations. Il travaille principalement en compression.',
    synonyms: ['colonne', 'pilier'],
    example: 'Les poteaux d’acier HSS sont disposés selon une trame de 6 m.',
    category: 'Structure',
  },
  {
    term: 'dalle',
    definition:
      'Élément structural plan et horizontal, généralement en béton armé, formant un plancher ou une assise. Une dalle sur sol repose directement sur le terrain compacté.',
    synonyms: ['dalle de béton', 'dalle sur sol'],
    example: 'La dalle sur sol de 100 mm est coulée sur un isolant rigide et un pare-vapeur.',
    category: 'Structure',
  },
  {
    term: 'solive',
    definition:
      'Pièce de structure horizontale, répétitive et de faible section, qui supporte un plancher ou un plafond et reporte ses charges sur les poutres ou les murs porteurs.',
    synonyms: ['solive de plancher', 'poutrelle de bois'],
    example: 'Solives ajourées à 400 mm c/c sous le plancher de l’étage.',
    category: 'Structure',
  },
  {
    term: 'linteau',
    definition:
      'Élément structural placé au-dessus d’une ouverture (porte, fenêtre) qui reporte les charges du mur de part et d’autre de la baie.',
    synonyms: ['poitrail'],
    example: 'Un linteau en acier en L soutient la maçonnerie au-dessus de la fenêtre.',
    category: 'Structure',
  },
  {
    term: 'chevêtre',
    definition:
      'Pièce de structure placée perpendiculairement aux solives ou aux chevrons pour encadrer une trémie (escalier, cheminée, puits de lumière) et reprendre les pièces interrompues.',
    synonyms: ['enchevêtrure'],
    example: 'Un chevêtre double encadre la trémie de l’escalier.',
    category: 'Structure',
  },
  {
    term: 'contreventement',
    definition:
      'Dispositif structural (croix, diagonales, voiles, panneaux cloués) qui assure la stabilité d’un bâtiment face aux charges latérales comme le vent et les séismes.',
    synonyms: ['croix de Saint-André', 'palée de stabilité'],
    example: 'Les panneaux OSB cloués servent de contreventement aux murs à ossature de bois.',
    category: 'Structure',
  },
  {
    term: 'mur porteur',
    definition:
      'Mur qui supporte des charges autres que son poids propre : planchers, toiture, étages supérieurs. Sa suppression ou son percement exige une reprise structurale.',
    synonyms: ['mur de refend', 'mur structural'],
    antonyms: ['cloison'],
    example: 'Le mur central du rez-de-chaussée est porteur : prévoir une poutre avant de l’ouvrir.',
    category: 'Structure',
  },
  {
    term: 'porte-à-faux',
    definition:
      'Partie d’un ouvrage (balcon, plancher, toit) en saillie au-delà de son appui, sans support à son extrémité libre. L’élément travaille en console.',
    synonyms: ['encorbellement', 'console'],
    example: 'Le balcon en porte-à-faux s’avance de 1,5 m sans poteau.',
    category: 'Structure',
  },
  {
    term: 'bois lamellé-croisé',
    definition:
      'Panneau structural massif composé de planches de bois contrecollées en couches croisées à 90°. Utilisé pour murs, planchers et toits, il permet des bâtiments en bois de grande hauteur.',
    synonyms: ['CLT', 'lamellé-croisé'],
    example: 'Les planchers en CLT de 175 mm franchissent les 6 m entre refends.',
    category: 'Structure',
  },
  {
    term: 'trémie',
    definition:
      'Ouverture ménagée dans un plancher ou un toit pour le passage d’un escalier, d’un ascenseur, d’une cheminée ou d’un puits de lumière. Elle est encadrée par des chevêtres.',
    synonyms: ['ouverture de plancher', 'réservation'],
    example: 'La trémie d’escalier mesure 1 m sur 3 m.',
    category: 'Structure',
  },
  // ── Fondations ──────────────────────────────────────────────────────────────
  {
    term: 'fondation',
    definition:
      'Partie de la construction qui transmet l’ensemble des charges du bâtiment au sol porteur. Au Canada, elle descend sous la profondeur de gel pour éviter les soulèvements.',
    synonyms: ['infrastructure', 'assise'],
    example: 'Fondation en béton coulé descendue à 1,4 m sous le niveau du sol fini.',
    category: 'Fondations',
  },
  {
    term: 'semelle',
    definition:
      'Élargissement en béton à la base d’un mur de fondation ou d’un poteau, qui répartit les charges sur une plus grande surface de sol pour limiter le tassement.',
    synonyms: ['semelle de fondation', 'empattement'],
    example: 'Semelle filante de 600 × 200 mm sous le mur de fondation.',
    category: 'Fondations',
  },
  {
    term: 'vide sanitaire',
    definition:
      'Espace non habitable, de faible hauteur, ménagé entre le sol et le premier plancher d’un bâtiment sans sous-sol. Il protège de l’humidité du sol et donne accès aux installations.',
    synonyms: ['vide technique'],
    example: 'Le chalet repose sur un vide sanitaire ventilé de 800 mm.',
    category: 'Fondations',
  },
  {
    term: 'longrine',
    definition:
      'Poutre de fondation horizontale, généralement en béton armé, qui relie des appuis ponctuels (pieux, semelles isolées) et supporte les murs au-dessus.',
    synonyms: ['poutre de fondation'],
    example: 'Des longrines relient les pieux vissés sous le bâtiment.',
    category: 'Fondations',
  },
  // ── Charpente ───────────────────────────────────────────────────────────────
  {
    term: 'charpente',
    definition:
      'Ossature porteuse, en bois, en acier ou en béton, qui supporte la toiture ou l’ensemble d’un bâtiment. La charpente de toit traditionnelle se compose de fermes, pannes et chevrons.',
    synonyms: ['ossature de toit', 'structure de toiture'],
    example: 'La charpente en fermes préfabriquées a été levée en une journée.',
    category: 'Charpente',
  },
  {
    term: 'ferme',
    definition:
      'Assemblage structural triangulé (membrures et diagonales) qui supporte la toiture et franchit la portée entre les murs porteurs sans appui intermédiaire.',
    synonyms: ['ferme de toit', 'treillis'],
    example: 'Fermes préfabriquées à 600 mm c/c sur l’ensemble du garage.',
    category: 'Charpente',
  },
  {
    term: 'panne',
    definition:
      'Pièce de charpente horizontale, posée sur les fermes ou les murs, qui supporte les chevrons ou directement le platelage de toit. La panne faîtière occupe le sommet du comble.',
    synonyms: ['filière', 'panne faîtière'],
    example: 'Les pannes en C d’acier relient les fermes du bâtiment agricole.',
    category: 'Charpente',
  },
  {
    term: 'chevron',
    definition:
      'Pièce de charpente inclinée suivant la pente du toit, qui s’appuie sur les pannes ou les sablières et reçoit le support de couverture (voligeage, contreplaqué).',
    synonyms: ['pièce de versant'],
    example: 'Chevrons de 38 × 235 mm à 400 mm c/c pour le toit cathédrale.',
    category: 'Charpente',
  },
  {
    term: 'sablière',
    definition:
      'Pièce de bois horizontale posée en tête de mur, sur laquelle s’appuient les chevrons ou les fermes de toit. Dans l’ossature légère, la lisse haute joue un rôle équivalent.',
    synonyms: ['panne sablière', 'lisse haute'],
    example: 'Les fermes sont clouées à la sablière avec des ancrages anti-soulèvement.',
    category: 'Charpente',
  },
  {
    term: 'faîtage',
    definition:
      'Ligne de rencontre la plus élevée de deux versants d’une toiture. Désigne aussi les pièces (panne faîtière, faîtières de couverture) qui occupent cette arête.',
    synonyms: ['faîte', 'arête de toit'],
    example: 'Un évent de faîtage assure la ventilation continue de l’entretoit.',
    category: 'Charpente',
  },
  {
    term: 'lisse',
    definition:
      'Pièce de bois horizontale d’un mur à ossature légère : la lisse basse (ou sole) est fixée au plancher, la lisse haute couronne les montants et reçoit la structure supérieure.',
    synonyms: ['lisse basse', 'sole'],
    example: 'La lisse basse en bois traité est ancrée à la dalle avec des boulons.',
    category: 'Charpente',
  },
  // ── Enveloppe ───────────────────────────────────────────────────────────────
  {
    term: 'pare-air',
    definition:
      'Matériau ou système continu de l’enveloppe qui limite les fuites d’air entre l’intérieur et l’extérieur. Son étanchéité est essentielle à la performance énergétique et à la durabilité.',
    synonyms: ['membrane pare-air', 'système d’étanchéité à l’air'],
    example: 'La membrane pare-air est scellée au ruban à chaque jonction de panneaux.',
    category: 'Enveloppe',
  },
  {
    term: 'pare-vapeur',
    definition:
      'Membrane qui limite la diffusion de la vapeur d’eau à travers les parois pour éviter la condensation dans l’isolant. En climat froid, il se pose du côté chaud de l’isolation.',
    synonyms: ['frein-vapeur', 'polyéthylène 6 mil'],
    example: 'Pare-vapeur en polyéthylène posé derrière le gypse des murs extérieurs.',
    category: 'Enveloppe',
  },
  {
    term: 'isolant',
    definition:
      'Matériau à faible conductivité thermique (laine minérale, cellulose, polystyrène, polyuréthane) placé dans l’enveloppe pour réduire les pertes de chaleur. Sa performance s’exprime en valeur R (RSI).',
    synonyms: ['isolation', 'matériau isolant'],
    example: 'Isolant en laine de roche R-24 dans les murs, R-60 soufflé dans l’entretoit.',
    category: 'Enveloppe',
  },
  {
    term: 'pont thermique',
    definition:
      'Zone localisée de l’enveloppe où la résistance thermique est fortement réduite (ossature, balcon traversant, fondation), causant pertes de chaleur et risques de condensation.',
    synonyms: ['rupture d’isolation', 'point froid'],
    example: 'Un isolant continu extérieur coupe les ponts thermiques des montants.',
    category: 'Enveloppe',
  },
  {
    term: 'membrane',
    definition:
      'Feuille mince, souple ou liquide, assurant une fonction d’étanchéité à l’eau, à l’air ou à la vapeur dans l’enveloppe (toiture, fondation, mur). Elle se pose en continuité avec recouvrements scellés.',
    synonyms: ['membrane d’étanchéité'],
    example: 'Membrane élastomère bicouche soudée sur le toit plat.',
    category: 'Enveloppe',
  },
  {
    term: 'solin',
    definition:
      'Pièce, souvent métallique ou membranée, qui assure l’étanchéité aux jonctions et points singuliers de l’enveloppe : tête de fenêtre, base de mur, cheminée, rencontre toit-mur.',
    synonyms: ['bavette', 'larmier'],
    example: 'Un solin en aluminium dévie l’eau au-dessus de chaque fenêtre.',
    category: 'Enveloppe',
  },
  {
    term: 'parapet',
    definition:
      'Prolongement vertical d’un mur extérieur au-dessus du niveau d’une toiture plate ou d’une terrasse. Il protège la rive du toit et sert d’appui aux membranes et aux garde-corps.',
    synonyms: ['acrotère (couronnement)'],
    example: 'Le parapet de 900 mm ceinture la toiture-terrasse.',
    category: 'Enveloppe',
  },
  {
    term: 'acrotère',
    definition:
      'Couronnement maçonné ou préfabriqué d’un parapet en rive de toiture plate, sur lequel sont relevées et protégées les membranes d’étanchéité.',
    synonyms: ['couronnement de parapet'],
    example: 'La membrane est relevée de 200 mm contre l’acrotère puis chapeautée d’un solin.',
    category: 'Enveloppe',
  },
  {
    term: 'mur-rideau',
    definition:
      'Façade légère non porteuse, généralement en aluminium et verre, suspendue ou fixée devant l’ossature du bâtiment, dont elle ne reprend que son poids propre et les charges de vent.',
    synonyms: ['façade-rideau', 'curtain wall'],
    example: 'Le hall d’entrée est vitré par un mur-rideau à meneaux apparents.',
    category: 'Enveloppe',
  },
  // ── Ouvertures ──────────────────────────────────────────────────────────────
  {
    term: 'allège',
    definition:
      'Partie de mur comprise entre le plancher et l’appui d’une fenêtre. Sa hauteur conditionne la protection contre les chutes et peut exiger un garde-corps.',
    synonyms: ['mur d’allège'],
    example: 'Allège de 450 mm : un garde-corps intérieur est requis devant la fenêtre.',
    category: 'Ouvertures',
  },
  {
    term: 'meneau',
    definition:
      'Montant vertical qui divise une baie, une fenêtre ou un mur-rideau en plusieurs panneaux vitrés. Son équivalent horizontal est la traverse.',
    synonyms: ['montant de baie'],
    example: 'Les meneaux d’aluminium du mur-rideau sont espacés de 1,5 m.',
    category: 'Ouvertures',
  },
  // ── Escaliers ───────────────────────────────────────────────────────────────
  {
    term: 'volée',
    definition:
      'Suite ininterrompue de marches comprise entre deux paliers. Le Code limite la hauteur d’une volée et le nombre de marches consécutives.',
    synonyms: ['volée d’escalier'],
    example: 'L’escalier comprend deux volées de huit marches séparées par un palier.',
    category: 'Escaliers',
  },
  {
    term: 'palier',
    definition:
      'Plate-forme horizontale située au départ, à l’arrivée ou entre les volées d’un escalier. Il permet le repos et les changements de direction.',
    synonyms: ['repos', 'palier intermédiaire'],
    example: 'Un palier de 900 mm de profondeur sépare les deux volées.',
    category: 'Escaliers',
  },
  {
    term: 'limon',
    definition:
      'Pièce inclinée d’un escalier qui supporte les marches et les contremarches. Le limon à crémaillère est découpé en redans qui reçoivent chaque marche.',
    synonyms: ['crémaillère'],
    example: 'Escalier en chêne à limon central en acier.',
    category: 'Escaliers',
  },
  {
    term: 'giron',
    definition:
      'Distance horizontale entre deux nez de marche consécutifs, mesurée à la ligne de foulée. Avec la hauteur de marche, il détermine le confort et la conformité d’un escalier.',
    synonyms: ['profondeur de marche'],
    example: 'Giron de 255 mm et contremarche de 190 mm pour l’escalier privé.',
    category: 'Escaliers',
  },
  {
    term: 'contremarche',
    definition:
      'Face verticale d’une marche, comprise entre deux girons. Elle peut être pleine ou ajourée, sa hauteur étant limitée par le Code selon l’usage de l’escalier.',
    synonyms: ['hauteur de marche'],
    example: 'Contremarches pleines exigées pour l’escalier d’issue.',
    category: 'Escaliers',
  },
  {
    term: 'échiffre',
    definition:
      'Mur, ou limon plein, qui supporte un escalier le long de sa rampe. On parle de mur d’échiffre lorsque la volée s’appuie sur une paroi maçonnée.',
    synonyms: ['mur d’échiffre'],
    example: 'La volée de béton prend appui sur le mur d’échiffre du sous-sol.',
    category: 'Escaliers',
  },
  // ── Sécurité ────────────────────────────────────────────────────────────────
  {
    term: 'accessibilité',
    definition:
      'Qualité d’un bâtiment ou d’un parcours conçu pour être utilisable par tous, y compris les personnes ayant une limitation fonctionnelle : parcours sans obstacles, largeurs de passage, rampes, signalisation.',
    synonyms: ['conception sans obstacles', 'conception universelle'],
    example: 'Le parcours d’accessibilité relie le stationnement à l’entrée principale sans marche.',
    category: 'Sécurité',
  },
  {
    term: 'résistance au feu',
    definition:
      'Durée, exprimée en minutes ou en heures, pendant laquelle un élément de construction conserve ses fonctions de séparation et de portance lors d’un incendie normalisé. Le Code prescrit un degré de résistance au feu (DRF) selon l’usage.',
    synonyms: ['degré de résistance au feu', 'DRF'],
    example: 'Le mur mitoyen exige une résistance au feu de 1 h.',
    category: 'Sécurité',
  },
  {
    term: 'issue',
    definition:
      'Partie d’un moyen d’évacuation, distincte de l’aire de plancher qu’elle dessert, qui conduit les occupants vers un lieu sûr extérieur : escalier d’issue, porte donnant sur l’extérieur, passage protégé.',
    synonyms: ['sortie de secours', 'issue de secours'],
    example: 'L’étage est desservi par deux issues éloignées l’une de l’autre.',
    category: 'Sécurité',
  },
  {
    term: 'garde-corps',
    definition:
      'Barrière de protection installée en bordure d’un vide (balcon, mezzanine, escalier, fenêtre basse) pour prévenir les chutes. Sa hauteur et la dimension de ses ouvertures sont réglementées.',
    synonyms: ['garde-fou', 'balustrade'],
    example: 'Garde-corps de 1 070 mm en bordure de la terrasse au toit.',
    category: 'Sécurité',
  },
  {
    term: 'main courante',
    definition:
      'Élément continu de préhension fixé le long d’un escalier ou d’une rampe, à hauteur réglementaire, pour guider et soutenir les usagers.',
    synonyms: ['rampe (usage courant)'],
    example: 'Main courante continue des deux côtés de l’escalier commun.',
    category: 'Sécurité',
  },
  // ── Dessin ──────────────────────────────────────────────────────────────────
  {
    term: 'coupe',
    definition:
      'Représentation d’un bâtiment sectionné par un plan vertical fictif, montrant les hauteurs, les épaisseurs de planchers et la composition des parois.',
    synonyms: ['section', 'coupe transversale'],
    example: 'La coupe A-A traverse la cage d’escalier et montre les niveaux.',
    category: 'Dessin',
  },
  {
    term: 'élévation',
    definition:
      'Projection orthogonale verticale d’une façade d’un bâtiment, sans déformation de perspective, montrant les ouvertures, matériaux et hauteurs apparentes.',
    synonyms: ['façade (dessin)', 'vue de façade'],
    example: 'L’élévation nord indique le parement de brique et les niveaux de plancher.',
    category: 'Dessin',
  },
  // ── Aménagement ─────────────────────────────────────────────────────────────
  {
    term: 'cloison',
    definition:
      'Paroi verticale légère et non porteuse qui divise l’espace intérieur d’un bâtiment. Elle peut être déplacée sans affecter la structure.',
    synonyms: ['mur de séparation', 'paroi de distribution'],
    antonyms: ['mur porteur'],
    example: 'Une cloison en gypse sur ossature métallique sépare les deux bureaux.',
    category: 'Aménagement',
  },
  {
    term: 'mezzanine',
    definition:
      'Plancher intermédiaire partiel, ouvert sur l’étage qu’il surplombe, aménagé dans un volume de grande hauteur. Sa superficie est limitée par le Code pour ne pas constituer un étage.',
    synonyms: ['demi-étage'],
    example: 'Une mezzanine de bureau surplombe l’atelier à double hauteur.',
    category: 'Aménagement',
  },
  {
    term: 'panneau de gypse',
    definition:
      'Panneau de plâtre pris entre deux cartons, vissé sur ossature pour former cloisons et plafonds. Les panneaux de type X offrent une résistance au feu accrue.',
    synonyms: ['gypse', 'plaque de plâtre', 'placoplâtre'],
    example: 'Deux couches de gypse type X procurent la séparation coupe-feu exigée.',
    category: 'Aménagement',
  },
]

// ─── Recherche ────────────────────────────────────────────────────────────────

/** Normalise pour la recherche : minuscules + suppression des accents. */
export function normalizeQuery(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, "'")
    .trim()
}

/**
 * Recherche instantanée dans le glossaire : terme, synonymes, puis contenu
 * de définition / exemple. Résultats triés par pertinence (terme > synonyme
 * > définition), insensible à la casse et aux accents. Requête vide → [].
 */
export function searchGlossary(query: string): GlossaryEntry[] {
  const q = normalizeQuery(query)
  if (q === '') return []

  const scored: { entry: GlossaryEntry; score: number }[] = []
  for (const entry of ARCHITECTURE_GLOSSARY) {
    const term = normalizeQuery(entry.term)
    let score = 0
    if (term === q) score = 5
    else if (term.startsWith(q)) score = 4
    else if (term.includes(q)) score = 3
    else if (entry.synonyms.some((s) => normalizeQuery(s).includes(q))) score = 2
    else if (
      normalizeQuery(entry.definition).includes(q)
      || (entry.example !== undefined && normalizeQuery(entry.example).includes(q))
    ) {
      score = 1
    }
    if (score > 0) scored.push({ entry, score })
  }

  return scored
    .sort((a, b) => b.score - a.score || a.entry.term.localeCompare(b.entry.term, 'fr'))
    .map((s) => s.entry)
}

/** Entrées groupées par catégorie (ordre de GLOSSARY_CATEGORIES). */
export function glossaryByCategory(): { category: string; entries: GlossaryEntry[] }[] {
  return GLOSSARY_CATEGORIES.map((category) => ({
    category,
    entries: ARCHITECTURE_GLOSSARY
      .filter((e) => e.category === category)
      .sort((a, b) => a.term.localeCompare(b.term, 'fr')),
  })).filter((g) => g.entries.length > 0)
}

/** Recherche d'une entrée par terme exact (insensible casse/accents). */
export function getGlossaryEntry(term: string): GlossaryEntry | undefined {
  const q = normalizeQuery(term)
  return ARCHITECTURE_GLOSSARY.find((e) => normalizeQuery(e.term) === q)
}
