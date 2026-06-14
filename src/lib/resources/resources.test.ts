/**
 * Tests des bibliothèques de ressources (normative + détails constructifs).
 */
import { describe, expect, it } from 'vitest'
import {
  getNormativeSheet,
  normativeCategories,
  NORMATIVE_SHEETS,
  searchNormative,
} from './normative'
import {
  CONSTRUCTION_DETAILS,
  detailCategories,
  detailToBlock,
  getDetail,
  searchDetails,
} from './details'

describe('bibliothèque normative', () => {
  it('charge une base de fiches avec champs requis', () => {
    expect(NORMATIVE_SHEETS.length).toBeGreaterThanOrEqual(12)
    const ids = NORMATIVE_SHEETS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const s of NORMATIVE_SHEETS) {
      expect(s.title).toBeTruthy()
      expect(s.summary.length).toBeGreaterThan(30)
      expect(s.keywords.length).toBeGreaterThan(0)
    }
  })

  it('couvre plusieurs catégories', () => {
    expect(normativeCategories().length).toBeGreaterThanOrEqual(8)
  })

  it('recherche par mot-clé et catégorie', () => {
    expect(searchNormative('escalier').some((s) => s.id === 'escaliers-blondel')).toBe(true)
    expect(searchNormative('blondel').length).toBeGreaterThan(0)
    expect(searchNormative('', 'cnb').every((s) => s.category === 'cnb')).toBe(true)
    expect(getNormativeSheet('ccq-base')?.jurisdiction).toBe('Québec')
  })
})

describe('détails constructifs', () => {
  it('charge le catalogue V2 étendu avec SVG, tags et notes', () => {
    expect(CONSTRUCTION_DETAILS.length).toBeGreaterThanOrEqual(50)
    const ids = CONSTRUCTION_DETAILS.map((d) => d.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const d of CONSTRUCTION_DETAILS) {
      expect(d.name).toBeTruthy()
      expect(d.description.length).toBeGreaterThan(10)
      expect(d.svgBody).toBeTruthy()
      expect(d.tags.length).toBeGreaterThan(0)
      expect(d.notes.length).toBeGreaterThan(20)
      expect(d.width).toBeGreaterThan(0)
      expect(d.height).toBeGreaterThan(0)
    }
  })

  it('couvre toutes les catégories de détails (dont coupes types)', () => {
    const cats = new Set(detailCategories())
    expect(cats.size).toBeGreaterThanOrEqual(13)
    expect(cats.has('coupe-type')).toBe(true)
  })

  it('recherche par tag / catégorie', () => {
    expect(searchDetails('mur').some((d) => d.category === 'murs')).toBe(true)
    expect(searchDetails('pare-vapeur').length).toBeGreaterThan(0)
    expect(searchDetails('rainscreen').some((d) => d.id === 'd-wall-rainscreen')).toBe(true)
    expect(searchDetails('', 'coupe-type').length).toBeGreaterThanOrEqual(3)
  })

  it('detailToBlock produit un DrawingBlock insérable', () => {
    const detail = getDetail('d-wall-wood')!
    const block = detailToBlock(detail)
    expect(block.id).toBe('detail-d-wall-wood')
    expect(block.svgBody).toBe(detail.svgBody)
    expect(block.defaultWidth).toBe(detail.width)
    expect(block.unitSystem).toBe('metric')
  })
})
