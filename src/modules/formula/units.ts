/**
 * units — table de conversion d'unités du convertisseur Formula V2.
 *
 * Chaque grandeur linéaire définit une unité de base et des facteurs
 * `toBase` exacts (valeurs légales : 1 po = 2,54 cm ; 1 lb = 0,45359237 kg).
 * La grandeur « angle » est non linéaire (degrés ↔ pourcentage de pente,
 * via tan/atan) et traitée à part par convertValue.
 */

export interface UnitDef {
  id: string
  label: string
  /** Facteur multiplicatif vers l'unité de base de la grandeur. */
  toBase: number
}

export interface QuantityDef {
  id: string
  label: string
  kind: 'linear' | 'angle'
  units: UnitDef[]
}

const FT_M = 0.3048 // exact
const FT2_M2 = FT_M * FT_M
const FT3_M3 = FT_M * FT_M * FT_M

export const QUANTITIES: QuantityDef[] = [
  {
    id: 'length',
    label: 'Longueur',
    kind: 'linear',
    units: [
      { id: 'mm', label: 'Millimètres (mm)', toBase: 0.001 },
      { id: 'cm', label: 'Centimètres (cm)', toBase: 0.01 },
      { id: 'm', label: 'Mètres (m)', toBase: 1 },
      { id: 'km', label: 'Kilomètres (km)', toBase: 1000 },
      { id: 'in', label: 'Pouces (po)', toBase: 0.0254 },
      { id: 'ft', label: 'Pieds (pi)', toBase: FT_M },
      { id: 'yd', label: 'Verges (vg)', toBase: 0.9144 },
    ],
  },
  {
    id: 'area',
    label: 'Surface',
    kind: 'linear',
    units: [
      { id: 'cm2', label: 'Centimètres carrés (cm²)', toBase: 0.0001 },
      { id: 'm2', label: 'Mètres carrés (m²)', toBase: 1 },
      { id: 'ft2', label: 'Pieds carrés (pi²)', toBase: FT2_M2 },
    ],
  },
  {
    id: 'volume',
    label: 'Volume',
    kind: 'linear',
    units: [
      { id: 'ml', label: 'Millilitres (ml)', toBase: 0.000001 },
      { id: 'l', label: 'Litres (L)', toBase: 0.001 },
      { id: 'm3', label: 'Mètres cubes (m³)', toBase: 1 },
      { id: 'ft3', label: 'Pieds cubes (pi³)', toBase: FT3_M3 },
      { id: 'gal', label: 'Gallons US (gal)', toBase: 0.003785411784 },
    ],
  },
  {
    id: 'weight',
    label: 'Poids',
    kind: 'linear',
    units: [
      { id: 'g', label: 'Grammes (g)', toBase: 0.001 },
      { id: 'kg', label: 'Kilogrammes (kg)', toBase: 1 },
      { id: 't', label: 'Tonnes (t)', toBase: 1000 },
      { id: 'lb', label: 'Livres (lb)', toBase: 0.45359237 },
    ],
  },
  {
    id: 'angle',
    label: 'Angle / pente',
    kind: 'angle',
    units: [
      { id: 'deg', label: 'Degrés (°)', toBase: 1 },
      { id: 'percent', label: 'Pourcentage de pente (%)', toBase: 1 },
    ],
  },
]

export function getQuantity(id: string): QuantityDef | undefined {
  return QUANTITIES.find((q) => q.id === id)
}

const DEG = Math.PI / 180

/**
 * Convertit `value` de l'unité `fromId` vers `toId` au sein d'une grandeur.
 * @throws {Error} grandeur/unité inconnue, ou degrés ≥ 90° vers une pente %.
 */
export function convertValue(quantityId: string, value: number, fromId: string, toId: string): number {
  const quantity = getQuantity(quantityId)
  if (!quantity) throw new Error(`Grandeur inconnue : ${quantityId}`)
  const from = quantity.units.find((u) => u.id === fromId)
  const to = quantity.units.find((u) => u.id === toId)
  if (!from || !to) throw new Error(`Unité inconnue : ${fromId} → ${toId}`)
  if (fromId === toId) return value

  if (quantity.kind === 'angle') {
    // degrés ↔ pourcentage de pente : % = tan(deg) × 100
    if (fromId === 'deg' && toId === 'percent') {
      if (Math.abs(value) >= 90) throw new Error('Pente non définie à ±90°')
      return Math.tan(value * DEG) * 100
    }
    if (fromId === 'percent' && toId === 'deg') {
      return Math.atan(value / 100) / DEG
    }
    return value
  }

  return (value * from.toBase) / to.toBase
}
