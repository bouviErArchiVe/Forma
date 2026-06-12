/**
 * Tests Formula V2 : moteur de calcul, formules clés, conversions.
 */
import { describe, expect, it } from 'vitest'
import { CalcError, evaluate } from './calc-engine'
import { FORMULA_CATEGORIES, FORMULAS, getFormula, searchFormulas } from './formulas-data'
import { convertValue } from './units'

// ─── Bibliothèque de formules ─────────────────────────────────────────────────

describe('FORMULAS (bibliothèque)', () => {
  it('contient au moins 30 formules réparties en catégories', () => {
    expect(FORMULAS.length).toBeGreaterThanOrEqual(30)
    expect(FORMULA_CATEGORIES.length).toBeGreaterThanOrEqual(7)
  })

  it('ids uniques et champs complets', () => {
    const ids = FORMULAS.map((f) => f.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const f of FORMULAS) {
      expect(f.description, f.id).toBeTruthy()
      expect(f.example, f.id).toBeTruthy()
      expect(f.variables.length, f.id).toBeGreaterThan(0)
    }
  })

  it('Blondel : 2h+g, plage 590-660 mm', () => {
    const blondel = getFormula('esc-blondel')!
    const ok = blondel.compute({ h: 178, g: 280 })
    const value = typeof ok === 'number' ? ok : ok.value
    expect(value).toBe(636)
    const tight = blondel.compute({ h: 150, g: 200 })
    if (typeof tight !== 'number') {
      expect(tight.note).toBeTruthy() // hors plage → note d'avertissement
    }
  })

  it('nombre de marches : arrondi cohérent', () => {
    const f = getFormula('esc-nb-marches')!
    const r = f.compute({ H: 2850, hc: 180 })
    const value = typeof r === 'number' ? r : r.value
    expect(value).toBe(16) // 2850/180 = 15.83 → 16 contremarches
  })

  it('pente : 45° = 100 %', () => {
    const pct = getFormula('pente-pourcent')!
    const r = pct.compute({ h: 1, L: 1 })
    expect(typeof r === 'number' ? r : r.value).toBe(100)
  })

  it('surface cercle : r=1 → π', () => {
    const f = getFormula('surf-cercle')!
    const r = f.compute({ r: 1 })
    expect(typeof r === 'number' ? r : r.value).toBeCloseTo(Math.PI, 5)
  })

  it('searchFormulas trouve par nom', () => {
    const hits = searchFormulas('blondel')
    expect(hits.some((f) => f.id === 'esc-blondel')).toBe(true)
  })
})

// ─── Moteur de calcul (sans eval) ─────────────────────────────────────────────

describe('calc-engine evaluate', () => {
  it('priorités des opérateurs', () => {
    expect(evaluate('2+3*4')).toBe(14)
    expect(evaluate('(2+3)*4')).toBe(20)
    expect(evaluate('10-4/2')).toBe(8)
  })

  it('puissances et racines', () => {
    expect(evaluate('2^10')).toBe(1024)
    expect(evaluate('sqrt(144)')).toBe(12)
  })

  it('trigonométrie en degrés', () => {
    expect(evaluate('sin(30)')).toBeCloseTo(0.5, 6)
    expect(evaluate('cos(60)')).toBeCloseTo(0.5, 6)
    expect(evaluate('tan(45)')).toBeCloseTo(1, 6)
  })

  it('constantes π et e', () => {
    expect(evaluate('pi')).toBeCloseTo(Math.PI, 6)
    expect(evaluate('e')).toBeCloseTo(Math.E, 6)
  })

  it('pourcentage', () => {
    expect(evaluate('50%')).toBeCloseTo(0.5, 6)
  })

  it('division par zéro → CalcError', () => {
    expect(() => evaluate('1/0')).toThrow(CalcError)
  })

  it('expression invalide → CalcError', () => {
    expect(() => evaluate('2+*3')).toThrow(CalcError)
    expect(() => evaluate('(2+3')).toThrow(CalcError)
  })
})

// ─── Conversions ──────────────────────────────────────────────────────────────

describe('convertValue', () => {
  it('longueurs : aller-retour stable', () => {
    expect(convertValue('length', 1000, 'mm', 'm')).toBeCloseTo(1, 9)
    const ft = convertValue('length', 3, 'm', 'ft')
    expect(convertValue('length', ft, 'ft', 'm')).toBeCloseTo(3, 9)
    expect(convertValue('length', 1, 'in', 'cm')).toBeCloseTo(2.54, 9)
  })

  it('surfaces et volumes', () => {
    expect(convertValue('area', 1, 'm2', 'ft2')).toBeCloseTo(10.7639, 3)
    expect(convertValue('volume', 1, 'm3', 'l')).toBeCloseTo(1000, 6)
  })

  it('poids', () => {
    expect(convertValue('weight', 1, 'kg', 'lb')).toBeCloseTo(2.20462, 4)
    expect(convertValue('weight', 1, 't', 'kg')).toBeCloseTo(1000, 6)
  })
})
