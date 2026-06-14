/**
 * Tests bibliothèque de matériaux (Pack A — A2) : recherche, catégories,
 * résolution par id, intégrité des données.
 */
import { describe, expect, it } from 'vitest'
import {
  getMaterial,
  MATERIAL_CATEGORY_LABELS,
  MATERIALS,
  materialCategories,
  searchMaterials,
  type MaterialCategory,
} from './materials'

describe('catalogue matériaux', () => {
  it('contient un catalogue substantiel', () => {
    expect(MATERIALS.length).toBeGreaterThanOrEqual(30)
  })

  it('chaque matériau a les champs requis et non vides', () => {
    for (const m of MATERIALS) {
      expect(m.id).toBeTruthy()
      expect(m.name).toBeTruthy()
      expect(m.description.length).toBeGreaterThan(10)
      expect(MATERIAL_CATEGORY_LABELS[m.category]).toBeTruthy()
      expect(m.properties.length).toBeGreaterThan(0)
      expect(m.advantages.length).toBeGreaterThan(0)
      expect(m.disadvantages.length).toBeGreaterThan(0)
      expect(m.applications.length).toBeGreaterThan(0)
      expect(m.notes.length).toBeGreaterThan(0)
      expect(m.keywords.length).toBeGreaterThan(0)
      for (const p of m.properties) {
        expect(p.label).toBeTruthy()
        expect(p.value).toBeTruthy()
      }
    }
  })

  it('les identifiants sont uniques', () => {
    const ids = MATERIALS.map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('toutes les catégories déclarées sont utilisées', () => {
    const used = new Set(materialCategories())
    const labelled = Object.keys(MATERIAL_CATEGORY_LABELS) as MaterialCategory[]
    for (const c of labelled) expect(used.has(c)).toBe(true)
  })
})

describe('getMaterial', () => {
  it('résout un matériau existant', () => {
    expect(getMaterial('acier-charpente')?.name).toContain('Acier')
  })
  it('renvoie undefined pour un id inconnu', () => {
    expect(getMaterial('inexistant')).toBeUndefined()
  })
})

describe('searchMaterials', () => {
  it('requête vide → tout (ou filtré par catégorie)', () => {
    expect(searchMaterials('').length).toBe(MATERIALS.length)
    const bois = searchMaterials('', 'bois')
    expect(bois.length).toBeGreaterThan(0)
    expect(bois.every((m) => m.category === 'bois')).toBe(true)
  })

  it('recherche insensible à la casse et aux accents', () => {
    const r1 = searchMaterials('beton')
    const r2 = searchMaterials('BÉTON')
    expect(r1.length).toBeGreaterThan(0)
    expect(r2.length).toBe(r1.length)
  })

  it('trouve par mot-clé et par application', () => {
    expect(searchMaterials('armature').some((m) => m.id === 'acier-armature')).toBe(true)
    expect(searchMaterials('fondation').length).toBeGreaterThan(0)
  })

  it('filtre par catégorie + requête', () => {
    const r = searchMaterials('toiture', 'toitures')
    expect(r.length).toBeGreaterThan(0)
    expect(r.every((m) => m.category === 'toitures')).toBe(true)
  })

  it('requête sans correspondance → vide', () => {
    expect(searchMaterials('zzzxxxqqq')).toEqual([])
  })
})
