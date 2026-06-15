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

  // ─── Structure (Pro — A7) ─────────────────────────────────────────────────────
  {
    id: 'str-module-section',
    category: 'Structure',
    name: 'Module de section rectangulaire (bh²/6)',
    description: 'Module de section élastique d’une section rectangulaire pleine : S = b·h² / 6 (axe fort, flexion selon h).',
    variables: [
      { id: 'b', label: 'Largeur de la section', unit: 'mm' },
      { id: 'h', label: 'Hauteur de la section', unit: 'mm' },
    ],
    resultUnit: 'mm³',
    example: 'Ex. : b=100 mm, h=200 mm → 666 667 mm³',
    compute: ({ b, h }) => (b > 0 && h > 0 ? (b * h * h) / 6 : NaN),
  },
  {
    id: 'str-inertie-rect',
    category: 'Structure',
    name: 'Moment d’inertie rectangulaire (bh³/12)',
    description: 'Moment d’inertie d’une section rectangulaire pleine par rapport à son axe fort : I = b·h³ / 12.',
    variables: [
      { id: 'b', label: 'Largeur de la section', unit: 'mm' },
      { id: 'h', label: 'Hauteur de la section', unit: 'mm' },
    ],
    resultUnit: 'mm⁴',
    example: 'Ex. : b=100 mm, h=200 mm → 66 666 667 mm⁴',
    compute: ({ b, h }) => (b > 0 && h > 0 ? (b * h * h * h) / 12 : NaN),
  },
  {
    id: 'str-contrainte-flexion',
    category: 'Structure',
    name: 'Contrainte de flexion (σ = M/S)',
    description: 'Contrainte de flexion maximale à partir du moment et du module de section : σ = M / S. Indicatif — à comparer à la résistance admissible du matériau.',
    variables: [
      { id: 'M', label: 'Moment fléchissant', unit: 'kN·m' },
      { id: 'S', label: 'Module de section', unit: 'mm³' },
    ],
    resultUnit: 'MPa',
    example: 'Ex. : M=10 kN·m, S=666 667 mm³ → 15 MPa',
    compute: ({ M, S }) => {
      if (S <= 0) return NaN
      const sigma = (M * 1e6) / S // kN·m → N·mm puis / mm³ = MPa
      return { value: sigma, note: 'Indicatif — comparer à la contrainte admissible du matériau (à vérifier au calcul/code).' }
    },
  },
  {
    id: 'str-fleche-repartie',
    category: 'Structure',
    name: 'Flèche — poutre simple (5wL⁴/384EI)',
    description: 'Flèche maximale au centre d’une poutre simplement appuyée sous charge répartie : δ = 5·w·L⁴ / (384·E·I). Indicatif.',
    variables: [
      { id: 'w', label: 'Charge répartie', unit: 'kN/m' },
      { id: 'L', label: 'Portée', unit: 'm' },
      { id: 'E', label: 'Module d’élasticité', unit: 'MPa' },
      { id: 'I', label: 'Moment d’inertie', unit: 'mm⁴' },
    ],
    resultUnit: 'mm',
    example: 'Ex. : w=5 kN/m, L=4 m, E=200 000 MPa, I=1e8 mm⁴ → 0,8 mm',
    compute: ({ w, L, E, I }) => {
      if (E <= 0 || I <= 0) return NaN
      const Lmm = L * 1000
      // w en kN/m ≡ N/mm ; E en N/mm² ; I en mm⁴ → δ en mm
      const delta = (5 * w * Lmm * Lmm * Lmm * Lmm) / (384 * E * I)
      return { value: delta, note: `Poutre simple, charge répartie. Flèche admissible L/360 ≈ ${round(Lmm / 360, 1)} mm — indicatif.` }
    },
  },
  {
    id: 'str-elancement',
    category: 'Structure',
    name: 'Élancement d’une colonne (KL/r)',
    description: 'Rapport d’élancement d’un poteau : λ = K·L / r. Plus il est élevé, plus le risque de flambement est grand.',
    variables: [
      { id: 'K', label: 'Facteur de longueur effective', unit: '' },
      { id: 'L', label: 'Longueur non supportée', unit: 'mm' },
      { id: 'r', label: 'Rayon de giration', unit: 'mm' },
    ],
    resultUnit: '',
    example: 'Ex. : K=1, L=3000 mm, r=40 mm → 75',
    compute: ({ K, L, r }) => {
      if (r <= 0) return NaN
      return { value: (K * L) / r, note: 'Indicatif — un élancement élevé augmente le risque de flambement (vérifier au calcul).' }
    },
  },

  // ─── Toitures (Pro — A7) ──────────────────────────────────────────────────────
  {
    id: 'toit-chevron',
    category: 'Toitures',
    name: 'Longueur de chevron',
    description: 'Longueur d’un chevron à partir de la course horizontale et de l’élévation : √(course² + élévation²).',
    variables: [
      { id: 'course', label: 'Course horizontale', unit: 'mm' },
      { id: 'elevation', label: 'Élévation', unit: 'mm' },
    ],
    resultUnit: 'mm',
    example: 'Ex. : course=3000 mm, élévation=1500 mm → 3354 mm (hors débord)',
    compute: ({ course, elevation }) => {
      const v = Math.hypot(course, elevation)
      return { value: v, note: 'Longueur théorique hors débord et hors queue de chevron.' }
    },
  },
  {
    id: 'toit-surface-pente',
    category: 'Toitures',
    name: 'Surface réelle de toiture (en pente)',
    description: 'Surface réelle d’un pan de toiture à partir de la surface projetée en plan et de la pente : aire / cos(angle).',
    variables: [
      { id: 'aire', label: 'Surface projetée (en plan)', unit: 'm²' },
      { id: 'p', label: 'Pente', unit: '%' },
    ],
    resultUnit: 'm²',
    example: 'Ex. : 50 m² projetés à 33 % → 52,7 m² réels',
    compute: ({ aire, p }) => {
      const angle = Math.atan(p / 100)
      const real = aire / Math.cos(angle)
      return { value: real, note: `Facteur de pente ≈ ${round(1 / Math.cos(angle), 3)} (hors débords et pertes).` }
    },
  },

  // ─── Garde-corps (Pro — A7) ───────────────────────────────────────────────────
  {
    id: 'gc-nb-barreaux',
    category: 'Garde-corps',
    name: 'Garde-corps — nombre de barreaux',
    description: 'Nombre de barreaux verticaux pour respecter un espacement libre maximal entre barreaux (l’espacement maximal dépend du code).',
    variables: [
      { id: 'W', label: 'Largeur libre entre poteaux', unit: 'mm' },
      { id: 'gap', label: 'Espacement libre maximal', unit: 'mm' },
      { id: 'd', label: 'Largeur d’un barreau', unit: 'mm' },
    ],
    resultUnit: 'barreaux',
    example: 'Ex. : W=1500 mm, espacement max 100 mm, barreau 20 mm → 12 barreaux',
    compute: ({ W, gap, d }) => {
      if (W <= 0 || gap <= 0 || d < 0) return NaN
      const n = Math.max(0, Math.ceil((W - gap) / (gap + d)))
      const realGap = (W - n * d) / (n + 1)
      return { value: n, note: `Espacement réel ≈ ${round(realGap, 1)} mm. Espacement maximal selon le code (souvent ~100 mm) — à vérifier.` }
    },
  },
  {
    id: 'gc-moment-ancrage',
    category: 'Garde-corps',
    name: 'Garde-corps — moment au pied',
    description: 'Moment de renversement au pied par mètre courant, sous une charge horizontale linéaire en main courante : M = w · h.',
    variables: [
      { id: 'w', label: 'Charge horizontale linéaire', unit: 'kN/m' },
      { id: 'h', label: 'Hauteur du garde-corps', unit: 'm' },
    ],
    resultUnit: 'kN·m/m',
    example: 'Ex. : w=0,75 kN/m, h=1,07 m → 0,80 kN·m/m',
    compute: ({ w, h }) => ({ value: w * h, note: 'La charge de calcul dépend de l’usage — à vérifier au code. Sert à dimensionner l’ancrage.' }),
  },

  // ─── Accessibilité (Pro — A7) ─────────────────────────────────────────────────
  {
    id: 'acc-rampe-longueur',
    category: 'Accessibilité',
    name: 'Rampe — longueur horizontale',
    description: 'Longueur horizontale d’une rampe pour franchir une dénivelée à une pente donnée (la pente maximale dépend du code).',
    variables: [
      { id: 'denivele', label: 'Dénivelée à franchir', unit: 'mm' },
      { id: 'p', label: 'Pente visée', unit: '%' },
    ],
    resultUnit: 'm',
    example: 'Ex. : 400 mm à 8 % → 5 m (hors paliers)',
    compute: ({ denivele, p }) => {
      if (p <= 0) return NaN
      const L = denivele / (10 * p) // (mm/1000) / (p/100) = mm/(10p) en m
      return { value: L, note: 'Hors paliers de repos. Pente maximale (souvent ~1:12 ≈ 8,33 %) — à vérifier au code.' }
    },
  },
  {
    id: 'acc-rampe-paliers',
    category: 'Accessibilité',
    name: 'Rampe — nombre de paliers de repos',
    description: 'Nombre de paliers de repos intermédiaires selon une distance maximale entre paliers (valeur selon le code).',
    variables: [
      { id: 'L', label: 'Longueur de la rampe', unit: 'm' },
      { id: 'interval', label: 'Distance max entre paliers', unit: 'm' },
    ],
    resultUnit: 'paliers',
    example: 'Ex. : rampe 30 m, palier tous les 9 m → 3 paliers',
    compute: ({ L, interval }) => {
      if (interval <= 0) return NaN
      const n = Math.max(0, Math.ceil(L / interval) - 1)
      return { value: n, note: 'Paliers intermédiaires (hors paliers de tête/pied). Distances selon le code — à vérifier.' }
    },
  },
  {
    id: 'acc-pente-verif',
    category: 'Accessibilité',
    name: 'Rampe — vérification de pente',
    description: 'Pente d’une rampe à partir de la dénivelée et de la longueur horizontale, exprimée en pourcentage.',
    variables: [
      { id: 'denivele', label: 'Dénivelée', unit: 'mm' },
      { id: 'L', label: 'Longueur horizontale', unit: 'mm' },
    ],
    resultUnit: '%',
    example: 'Ex. : 400 mm sur 5000 mm → 8 %',
    compute: ({ denivele, L }) => {
      if (L <= 0) return NaN
      const p = (denivele / L) * 100
      return { value: p, note: 'Comparer à la pente maximale admissible (à vérifier au code).' }
    },
  },

  // ─── Stationnement (Pro — A7) ─────────────────────────────────────────────────
  {
    id: 'stat-cases-surface',
    category: 'Stationnement',
    name: 'Cases requises (ratio par surface)',
    description: 'Nombre de cases de stationnement requises selon un ratio « 1 case par X m² » (le ratio dépend du zonage/usage).',
    variables: [
      { id: 'surface', label: 'Surface de plancher', unit: 'm²' },
      { id: 'ratio', label: 'Surface par case', unit: 'm²/case' },
    ],
    resultUnit: 'cases',
    example: 'Ex. : 500 m², 1 case / 25 m² → 20 cases',
    compute: ({ surface, ratio }) => {
      if (ratio <= 0) return NaN
      return { value: Math.ceil(surface / ratio), note: 'Ratio selon le règlement de zonage municipal et l’usage — à vérifier.' }
    },
  },
  {
    id: 'stat-cases-accessibles',
    category: 'Stationnement',
    name: 'Cases accessibles requises',
    description: 'Nombre de cases accessibles selon un ratio « 1 accessible par X cases » (le ratio dépend du code/règlement).',
    variables: [
      { id: 'total', label: 'Nombre total de cases', unit: 'cases' },
      { id: 'ratio', label: 'Cases par case accessible', unit: 'cases' },
    ],
    resultUnit: 'cases',
    example: 'Ex. : 100 cases, 1 accessible / 25 → 4 cases accessibles',
    compute: ({ total, ratio }) => {
      if (ratio <= 0) return NaN
      return { value: Math.max(1, Math.ceil(total / ratio)), note: 'Ratio et minimum selon le code/règlement applicable — à vérifier.' }
    },
  },
  {
    id: 'stat-cases-rangee',
    category: 'Stationnement',
    name: 'Cases sur une rangée',
    description: 'Nombre de cases en enfilade sur une longueur donnée, selon la largeur de case.',
    variables: [
      { id: 'L', label: 'Longueur disponible', unit: 'm' },
      { id: 'larg', label: 'Largeur d’une case', unit: 'm' },
    ],
    resultUnit: 'cases',
    example: 'Ex. : 30 m, cases de 2,6 m → 11 cases',
    compute: ({ L, larg }) => (larg > 0 ? Math.floor(L / larg) : NaN),
  },

  // ─── Occupation (Pro — A7) ────────────────────────────────────────────────────
  {
    id: 'occ-nb-personnes',
    category: 'Occupation',
    name: 'Nombre de personnes (charge d’occupants)',
    description: 'Estimation du nombre de personnes selon l’aire et une superficie par personne (le facteur dépend de l’usage selon le code).',
    variables: [
      { id: 'aire', label: 'Aire de plancher', unit: 'm²' },
      { id: 'facteur', label: 'Superficie par personne', unit: 'm²/pers' },
    ],
    resultUnit: 'personnes',
    example: 'Ex. : 200 m², 1,2 m²/pers → 166 personnes',
    compute: ({ aire, facteur }) => {
      if (facteur <= 0) return NaN
      return { value: Math.floor(aire / facteur), note: 'Facteur d’aire par personne selon l’usage (CNB) — à vérifier.' }
    },
  },
  {
    id: 'occ-largeur-evac',
    category: 'Occupation',
    name: 'Largeur d’évacuation requise',
    description: 'Largeur totale des moyens d’évacuation selon le nombre de personnes et un facteur de largeur par personne (selon le code).',
    variables: [
      { id: 'personnes', label: 'Nombre de personnes', unit: 'pers' },
      { id: 'facteur', label: 'Largeur par personne', unit: 'mm/pers' },
    ],
    resultUnit: 'mm',
    example: 'Ex. : 150 personnes, 6,1 mm/pers → 915 mm',
    compute: ({ personnes, facteur }) => ({ value: personnes * facteur, note: 'Facteur de largeur par personne selon l’usage et le type de moyen d’évacuation (CNB) — à vérifier.' }),
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
