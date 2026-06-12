/**
 * formulas-data — bibliothèque de formules professionnelles Formula V2.
 *
 * 32 formules réparties en 8 catégories (escaliers, surfaces, volumes,
 * pentes, échelles, structure, conversions, mathématiques). Unités SI.
 * Chaque `compute` est une fonction pure ; un résultat invalide (entrée
 * hors domaine) retourne NaN — l'UI affiche alors un message d'erreur.
 */

export interface FormulaVariable {
  id: string
  label: string
  unit: string
}

export interface FormulaDef {
  id: string
  category: string
  name: string
  description: string
  variables: FormulaVariable[]
  resultUnit: string
  example: string
  compute: (values: Record<string, number>) => number | { value: number; note?: string }
}

const round = (n: number, decimals = 1): number => {
  const f = 10 ** decimals
  return Math.round(n * f) / f
}

export const FORMULAS: FormulaDef[] = [
  // ─── Escaliers ──────────────────────────────────────────────────────────────
  {
    id: 'esc-blondel',
    category: 'Escaliers',
    name: 'Pas de Blondel (2h + g)',
    description: 'Vérifie le confort d’un escalier : deux hauteurs de marche plus un giron doivent donner entre 590 et 660 mm.',
    variables: [
      { id: 'h', label: 'Hauteur de marche', unit: 'mm' },
      { id: 'g', label: 'Giron', unit: 'mm' },
    ],
    resultUnit: 'mm',
    example: 'Ex. : h=178 mm, g=280 mm → 636 mm (confortable)',
    compute: ({ h, g }) => {
      const v = 2 * h + g
      return {
        value: v,
        note: v >= 590 && v <= 660 ? 'Confortable (plage 590–660 mm)' : 'Hors plage de confort (590–660 mm)',
      }
    },
  },
  {
    id: 'esc-nb-marches',
    category: 'Escaliers',
    name: 'Nombre de contremarches',
    description: 'Divise la hauteur d’étage par la hauteur de marche visée, arrondit au plus proche, puis recalcule la hauteur réelle.',
    variables: [
      { id: 'H', label: 'Hauteur totale à franchir', unit: 'mm' },
      { id: 'hc', label: 'Hauteur de marche visée', unit: 'mm' },
    ],
    resultUnit: 'marches',
    example: 'Ex. : H=2850 mm, visée 180 mm → 16 marches (hauteur réelle 178,1 mm)',
    compute: ({ H, hc }) => {
      if (hc <= 0 || H <= 0) return NaN
      const n = Math.max(1, Math.round(H / hc))
      return { value: n, note: `Hauteur de marche réelle : ${round(H / n, 1)} mm` }
    },
  },
  {
    id: 'esc-hauteur-reelle',
    category: 'Escaliers',
    name: 'Hauteur de marche réelle',
    description: 'Hauteur exacte de chaque contremarche : hauteur totale divisée par le nombre de contremarches.',
    variables: [
      { id: 'H', label: 'Hauteur totale à franchir', unit: 'mm' },
      { id: 'n', label: 'Nombre de contremarches', unit: 'marches' },
    ],
    resultUnit: 'mm',
    example: 'Ex. : H=2850 mm, 16 marches → 178,1 mm',
    compute: ({ H, n }) => (n > 0 ? H / n : NaN),
  },
  {
    id: 'esc-giron-blondel',
    category: 'Escaliers',
    name: 'Giron depuis Blondel',
    description: 'Déduit le giron à partir de la valeur de Blondel visée : g = B − 2h.',
    variables: [
      { id: 'B', label: 'Valeur de Blondel visée', unit: 'mm' },
      { id: 'h', label: 'Hauteur de marche', unit: 'mm' },
    ],
    resultUnit: 'mm',
    example: 'Ex. : B=630 mm, h=178 mm → giron 274 mm',
    compute: ({ B, h }) => B - 2 * h,
  },

  // ─── Surfaces ───────────────────────────────────────────────────────────────
  {
    id: 'surf-rectangle',
    category: 'Surfaces',
    name: 'Surface d’un rectangle',
    description: 'Aire d’un rectangle : longueur multipliée par largeur.',
    variables: [
      { id: 'L', label: 'Longueur', unit: 'm' },
      { id: 'l', label: 'Largeur', unit: 'm' },
    ],
    resultUnit: 'm²',
    example: 'Ex. : L=4 m, l=3 m → 12 m²',
    compute: ({ L, l }) => L * l,
  },
  {
    id: 'surf-triangle',
    category: 'Surfaces',
    name: 'Surface d’un triangle',
    description: 'Aire d’un triangle : base multipliée par hauteur, divisée par deux.',
    variables: [
      { id: 'b', label: 'Base', unit: 'm' },
      { id: 'h', label: 'Hauteur', unit: 'm' },
    ],
    resultUnit: 'm²',
    example: 'Ex. : b=6 m, h=4 m → 12 m²',
    compute: ({ b, h }) => (b * h) / 2,
  },
  {
    id: 'surf-cercle',
    category: 'Surfaces',
    name: 'Surface d’un cercle',
    description: 'Aire d’un cercle à partir de son rayon : π × r².',
    variables: [{ id: 'r', label: 'Rayon', unit: 'm' }],
    resultUnit: 'm²',
    example: 'Ex. : r=2 m → 12,57 m²',
    compute: ({ r }) => Math.PI * r * r,
  },
  {
    id: 'surf-trapeze',
    category: 'Surfaces',
    name: 'Surface d’un trapèze',
    description: 'Aire d’un trapèze : moyenne des deux bases multipliée par la hauteur.',
    variables: [
      { id: 'B', label: 'Grande base', unit: 'm' },
      { id: 'b', label: 'Petite base', unit: 'm' },
      { id: 'h', label: 'Hauteur', unit: 'm' },
    ],
    resultUnit: 'm²',
    example: 'Ex. : B=5 m, b=3 m, h=2 m → 8 m²',
    compute: ({ B, b, h }) => ((B + b) / 2) * h,
  },

  // ─── Volumes ────────────────────────────────────────────────────────────────
  {
    id: 'vol-prisme',
    category: 'Volumes',
    name: 'Volume d’un prisme / cube',
    description: 'Volume d’un prisme rectangulaire : longueur × largeur × hauteur.',
    variables: [
      { id: 'L', label: 'Longueur', unit: 'm' },
      { id: 'l', label: 'Largeur', unit: 'm' },
      { id: 'h', label: 'Hauteur', unit: 'm' },
    ],
    resultUnit: 'm³',
    example: 'Ex. : 2 × 1,5 × 1 m → 3 m³',
    compute: ({ L, l, h }) => L * l * h,
  },
  {
    id: 'vol-cylindre',
    category: 'Volumes',
    name: 'Volume d’un cylindre',
    description: 'Volume d’un cylindre : π × r² × hauteur (sonotube, pilier…).',
    variables: [
      { id: 'r', label: 'Rayon', unit: 'm' },
      { id: 'h', label: 'Hauteur', unit: 'm' },
    ],
    resultUnit: 'm³',
    example: 'Ex. : r=0,15 m, h=1,2 m → 0,085 m³',
    compute: ({ r, h }) => Math.PI * r * r * h,
  },
  {
    id: 'vol-dalle',
    category: 'Volumes',
    name: 'Béton — dalle',
    description: 'Volume de béton d’une dalle : longueur × largeur × épaisseur (épaisseur en cm).',
    variables: [
      { id: 'L', label: 'Longueur', unit: 'm' },
      { id: 'l', label: 'Largeur', unit: 'm' },
      { id: 'ep', label: 'Épaisseur', unit: 'cm' },
    ],
    resultUnit: 'm³',
    example: 'Ex. : 6 × 4 m, ép. 10 cm → 2,4 m³ (2,64 m³ avec perte)',
    compute: ({ L, l, ep }) => {
      const v = L * l * (ep / 100)
      return { value: v, note: `Avec 10 % de perte : ${round(v * 1.1, 3)} m³` }
    },
  },
  {
    id: 'vol-semelle',
    category: 'Volumes',
    name: 'Béton — semelle',
    description: 'Volume de béton d’une semelle filante : longueur × largeur × hauteur (section en cm).',
    variables: [
      { id: 'L', label: 'Longueur', unit: 'm' },
      { id: 'l', label: 'Largeur', unit: 'cm' },
      { id: 'h', label: 'Hauteur', unit: 'cm' },
    ],
    resultUnit: 'm³',
    example: 'Ex. : L=12 m, 60 × 25 cm → 1,8 m³',
    compute: ({ L, l, h }) => {
      const v = L * (l / 100) * (h / 100)
      return { value: v, note: `Avec 10 % de perte : ${round(v * 1.1, 3)} m³` }
    },
  },

  // ─── Pentes ─────────────────────────────────────────────────────────────────
  {
    id: 'pente-pourcent',
    category: 'Pentes',
    name: 'Pente en pourcentage',
    description: 'Pente en % : dénivelé divisé par la longueur horizontale, multiplié par 100.',
    variables: [
      { id: 'h', label: 'Dénivelé', unit: 'm' },
      { id: 'L', label: 'Longueur horizontale', unit: 'm' },
    ],
    resultUnit: '%',
    example: 'Ex. : h=1 m sur L=1 m → 100 % (45°)',
    compute: ({ h, L }) => (L !== 0 ? (h / L) * 100 : NaN),
  },
  {
    id: 'pente-degres',
    category: 'Pentes',
    name: 'Pente en degrés',
    description: 'Angle de la pente en degrés : arc tangente du dénivelé sur la longueur horizontale.',
    variables: [
      { id: 'h', label: 'Dénivelé', unit: 'm' },
      { id: 'L', label: 'Longueur horizontale', unit: 'm' },
    ],
    resultUnit: '°',
    example: 'Ex. : h=1 m sur L=1 m → 45°',
    compute: ({ h, L }) => (L !== 0 ? Math.atan(h / L) * (180 / Math.PI) : NaN),
  },
  {
    id: 'pente-hauteur',
    category: 'Pentes',
    name: 'Dénivelé depuis pente et longueur',
    description: 'Hauteur gagnée sur une longueur horizontale donnée à une pente donnée : L × pente / 100.',
    variables: [
      { id: 'p', label: 'Pente', unit: '%' },
      { id: 'L', label: 'Longueur horizontale', unit: 'm' },
    ],
    resultUnit: 'm',
    example: 'Ex. : pente 10 % sur 50 m → 5 m de dénivelé',
    compute: ({ p, L }) => (p / 100) * L,
  },
  {
    id: 'pente-toiture',
    category: 'Pentes',
    name: 'Pente de toiture (x:12)',
    description: 'Pente de toit en ratio nord-américain : élévation rapportée à 12 unités de course horizontale.',
    variables: [
      { id: 'h', label: 'Élévation', unit: 'mm' },
      { id: 'L', label: 'Course horizontale', unit: 'mm' },
    ],
    resultUnit: ':12',
    example: 'Ex. : 500 mm d’élévation sur 1000 mm → pente 6:12 (50 %)',
    compute: ({ h, L }) => {
      if (L === 0) return NaN
      const x = (h / L) * 12
      return { value: x, note: `Pente ${round(x, 1)}:12, soit ${round((h / L) * 100, 1)} %` }
    },
  },

  // ─── Échelles ───────────────────────────────────────────────────────────────
  {
    id: 'ech-reel-plan',
    category: 'Échelles',
    name: 'Réel → plan',
    description: 'Longueur à dessiner sur le plan pour une longueur réelle à l’échelle 1:d (1:20, 1:50, 1:100 ou libre).',
    variables: [
      { id: 'Lr', label: 'Longueur réelle', unit: 'm' },
      { id: 'd', label: 'Échelle 1:d', unit: '' },
    ],
    resultUnit: 'cm',
    example: 'Ex. : 4,5 m à l’échelle 1:50 → 9 cm sur le plan',
    compute: ({ Lr, d }) => (d > 0 ? (Lr * 100) / d : NaN),
  },
  {
    id: 'ech-plan-reel',
    category: 'Échelles',
    name: 'Plan → réel',
    description: 'Longueur réelle correspondant à une mesure relevée sur un plan à l’échelle 1:d.',
    variables: [
      { id: 'Lp', label: 'Mesure sur le plan', unit: 'cm' },
      { id: 'd', label: 'Échelle 1:d', unit: '' },
    ],
    resultUnit: 'm',
    example: 'Ex. : 9 cm sur un plan 1:50 → 4,5 m réels',
    compute: ({ Lp, d }) => (d > 0 ? (Lp * d) / 100 : NaN),
  },

  // ─── Structure ──────────────────────────────────────────────────────────────
  {
    id: 'str-charge-totale',
    category: 'Structure',
    name: 'Charge totale (w × L)',
    description: 'Charge totale d’une charge uniformément répartie sur une poutre : w × L.',
    variables: [
      { id: 'w', label: 'Charge répartie', unit: 'kN/m' },
      { id: 'L', label: 'Portée', unit: 'm' },
    ],
    resultUnit: 'kN',
    example: 'Ex. : w=5 kN/m sur L=4 m → 20 kN',
    compute: ({ w, L }) => w * L,
  },
  {
    id: 'str-reaction',
    category: 'Structure',
    name: 'Réaction d’appui (wL/2)',
    description: 'Réaction à chaque appui d’une poutre simple sous charge répartie : wL / 2.',
    variables: [
      { id: 'w', label: 'Charge répartie', unit: 'kN/m' },
      { id: 'L', label: 'Portée', unit: 'm' },
    ],
    resultUnit: 'kN',
    example: 'Ex. : w=5 kN/m, L=4 m → 10 kN par appui',
    compute: ({ w, L }) => (w * L) / 2,
  },
  {
    id: 'str-moment-reparti',
    category: 'Structure',
    name: 'Moment max — charge répartie (wL²/8)',
    description: 'Moment fléchissant maximal en travée d’une poutre simple sous charge répartie : wL² / 8.',
    variables: [
      { id: 'w', label: 'Charge répartie', unit: 'kN/m' },
      { id: 'L', label: 'Portée', unit: 'm' },
    ],
    resultUnit: 'kN·m',
    example: 'Ex. : w=5 kN/m, L=4 m → 10 kN·m',
    compute: ({ w, L }) => (w * L * L) / 8,
  },
  {
    id: 'str-moment-ponctuel',
    category: 'Structure',
    name: 'Moment max — charge ponctuelle (PL/4)',
    description: 'Moment fléchissant maximal d’une charge ponctuelle centrée sur une poutre simple : PL / 4.',
    variables: [
      { id: 'P', label: 'Charge ponctuelle', unit: 'kN' },
      { id: 'L', label: 'Portée', unit: 'm' },
    ],
    resultUnit: 'kN·m',
    example: 'Ex. : P=10 kN, L=4 m → 10 kN·m',
    compute: ({ P, L }) => (P * L) / 4,
  },

  // ─── Conversions ────────────────────────────────────────────────────────────
  {
    id: 'conv-mm-m',
    category: 'Conversions',
    name: 'Millimètres → mètres',
    description: 'Convertit des millimètres en mètres (÷ 1000).',
    variables: [{ id: 'x', label: 'Valeur', unit: 'mm' }],
    resultUnit: 'm',
    example: 'Ex. : 2850 mm → 2,85 m',
    compute: ({ x }) => ({ value: x / 1000, note: 'Inverse : 1 m = 1000 mm' }),
  },
  {
    id: 'conv-pouces-cm',
    category: 'Conversions',
    name: 'Pouces → centimètres',
    description: 'Convertit des pouces en centimètres (× 2,54).',
    variables: [{ id: 'x', label: 'Valeur', unit: 'po' }],
    resultUnit: 'cm',
    example: 'Ex. : 10 po → 25,4 cm',
    compute: ({ x }) => ({ value: x * 2.54, note: 'Inverse : 1 cm ≈ 0,3937 po' }),
  },
  {
    id: 'conv-pieds-m',
    category: 'Conversions',
    name: 'Pieds → mètres',
    description: 'Convertit des pieds en mètres (× 0,3048).',
    variables: [{ id: 'x', label: 'Valeur', unit: 'pi' }],
    resultUnit: 'm',
    example: 'Ex. : 8 pi → 2,438 m',
    compute: ({ x }) => ({ value: x * 0.3048, note: 'Inverse : 1 m ≈ 3,2808 pi' }),
  },
  {
    id: 'conv-m2-pi2',
    category: 'Conversions',
    name: 'Mètres carrés → pieds carrés',
    description: 'Convertit des mètres carrés en pieds carrés (× 10,7639).',
    variables: [{ id: 'x', label: 'Valeur', unit: 'm²' }],
    resultUnit: 'pi²',
    example: 'Ex. : 100 m² → 1076,4 pi²',
    compute: ({ x }) => ({ value: x / 0.09290304, note: 'Inverse : 1 pi² = 0,0929 m²' }),
  },
  {
    id: 'conv-m3-pi3',
    category: 'Conversions',
    name: 'Mètres cubes → pieds cubes',
    description: 'Convertit des mètres cubes en pieds cubes (× 35,3147).',
    variables: [{ id: 'x', label: 'Valeur', unit: 'm³' }],
    resultUnit: 'pi³',
    example: 'Ex. : 2 m³ → 70,6 pi³',
    compute: ({ x }) => ({ value: x / 0.028316846592, note: 'Inverse : 1 pi³ ≈ 0,0283 m³' }),
  },
  {
    id: 'conv-litres-m3',
    category: 'Conversions',
    name: 'Litres → mètres cubes',
    description: 'Convertit des litres en mètres cubes (÷ 1000).',
    variables: [{ id: 'x', label: 'Valeur', unit: 'L' }],
    resultUnit: 'm³',
    example: 'Ex. : 2640 L → 2,64 m³',
    compute: ({ x }) => ({ value: x / 1000, note: 'Inverse : 1 m³ = 1000 L' }),
  },
  {
    id: 'conv-kg-livres',
    category: 'Conversions',
    name: 'Kilogrammes → livres',
    description: 'Convertit des kilogrammes en livres (× 2,2046).',
    variables: [{ id: 'x', label: 'Valeur', unit: 'kg' }],
    resultUnit: 'lb',
    example: 'Ex. : 25 kg → 55,1 lb',
    compute: ({ x }) => ({ value: x / 0.45359237, note: 'Inverse : 1 lb = 0,4536 kg' }),
  },

  // ─── Mathématiques ──────────────────────────────────────────────────────────
  {
    id: 'math-pourcentage',
    category: 'Mathématiques',
    name: 'Pourcentage d’une valeur',
    description: 'Calcule p % d’une valeur : valeur × p / 100.',
    variables: [
      { id: 'p', label: 'Pourcentage', unit: '%' },
      { id: 'v', label: 'Valeur', unit: '' },
    ],
    resultUnit: '',
    example: 'Ex. : 15 % de 240 → 36',
    compute: ({ p, v }) => (p / 100) * v,
  },
  {
    id: 'math-regle-trois',
    category: 'Mathématiques',
    name: 'Règle de trois',
    description: 'Proportionnalité : si a donne b, alors c donne x = b × c / a.',
    variables: [
      { id: 'a', label: 'a (référence)', unit: '' },
      { id: 'b', label: 'b (résultat pour a)', unit: '' },
      { id: 'c', label: 'c (nouvelle valeur)', unit: '' },
    ],
    resultUnit: '',
    example: 'Ex. : 3 sacs pour 12 m² ; pour 20 m² → 5 sacs',
    compute: ({ a, b, c }) => (a !== 0 ? (b * c) / a : NaN),
  },
  {
    id: 'math-hypotenuse',
    category: 'Mathématiques',
    name: 'Hypoténuse (Pythagore)',
    description: 'Longueur de l’hypoténuse d’un triangle rectangle : √(a² + b²).',
    variables: [
      { id: 'a', label: 'Côté a', unit: 'm' },
      { id: 'b', label: 'Côté b', unit: 'm' },
    ],
    resultUnit: 'm',
    example: 'Ex. : a=3 m, b=4 m → 5 m (équerre 3-4-5)',
    compute: ({ a, b }) => Math.hypot(a, b),
  },
]

/** Catégories dans l'ordre de déclaration (sans doublons). */
export const FORMULA_CATEGORIES: string[] = [...new Set(FORMULAS.map((f) => f.category))]

const BY_ID = new Map(FORMULAS.map((f) => [f.id, f]))

export function getFormula(id: string): FormulaDef | undefined {
  return BY_ID.get(id)
}

/** Recherche insensible à la casse/aux accents sur nom + description. */
export function searchFormulas(query: string): FormulaDef[] {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
  const q = normalize(query.trim())
  if (!q) return FORMULAS
  return FORMULAS.filter(
    (f) => normalize(f.name).includes(q) || normalize(f.description).includes(q) || normalize(f.category).includes(q),
  )
}
