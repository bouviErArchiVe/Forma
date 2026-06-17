/**
 * Tests échelles dynamiques (Pack B4) : construction depuis ratio / densité,
 * conversions page↔réel (round-trip), conversion d'unités, valeurs invalides.
 */
import { describe, expect, it } from 'vitest'
import {
  commonScalePresets,
  convertUnit,
  identityScale,
  pageToReal,
  pageToRealInUnit,
  realInUnitToPage,
  realToPage,
  scaleFromRatio,
  scaleFromRealPerPx,
  type ScaleProfile,
} from './scale'

describe('convertUnit', () => {
  it('métrique', () => {
    expect(convertUnit(1, 'm', 'mm')).toBeCloseTo(1000, 6)
    expect(convertUnit(1000, 'mm', 'm')).toBeCloseTo(1, 6)
    expect(convertUnit(5, 'cm', 'mm')).toBeCloseTo(50, 6)
  })
  it('impérial ↔ métrique', () => {
    expect(convertUnit(1, 'in', 'mm')).toBeCloseTo(25.4, 6)
    expect(convertUnit(1, 'ft', 'in')).toBeCloseTo(12, 6)
  })
  it('même unité = identité', () => {
    expect(convertUnit(42, 'cm', 'cm')).toBe(42)
  })
  it('round-trip A→B→A', () => {
    const v = 123.45
    expect(convertUnit(convertUnit(v, 'm', 'in'), 'in', 'm')).toBeCloseTo(v, 6)
  })
  it('non fini → NaN', () => {
    expect(Number.isNaN(convertUnit(NaN, 'm', 'mm'))).toBe(true)
  })
})

describe('scaleFromRealPerPx', () => {
  it('densité directe', () => {
    const p = scaleFromRealPerPx(10, 'mm')
    expect(p.realPerPx).toBe(10)
    expect(p.unit).toBe('mm')
    expect(p.ratio).toBeUndefined()
    expect(p.label).toContain('10')
  })
  it('valeurs invalides → 1', () => {
    expect(scaleFromRealPerPx(0, 'm').realPerPx).toBe(1)
    expect(scaleFromRealPerPx(-5, 'm').realPerPx).toBe(1)
    expect(scaleFromRealPerPx(NaN, 'm').realPerPx).toBe(1)
  })
})

describe('scaleFromRatio', () => {
  it('1:N avec densité par défaut → realPerPx = N', () => {
    const p = scaleFromRatio(50, 'm')
    expect(p.realPerPx).toBe(50)
    expect(p.ratio).toBe(50)
    expect(p.label).toBe('1:50')
  })
  it('densité d’affichage : realPerPx = N / pxPerDrawnUnit', () => {
    const p = scaleFromRatio(100, 'm', 2)
    expect(p.realPerPx).toBe(50)
    expect(p.ratio).toBe(100)
  })
  it('ratio invalide → 1', () => {
    expect(scaleFromRatio(0, 'm').realPerPx).toBe(1)
    expect(scaleFromRatio(-3, 'm').realPerPx).toBe(1)
  })
})

describe('identityScale', () => {
  it('1 px = 1 unité', () => {
    const p = identityScale('mm')
    expect(p.realPerPx).toBe(1)
    expect(pageToReal(7, p)).toBe(7)
  })
})

describe('pageToReal / realToPage', () => {
  const p: ScaleProfile = scaleFromRealPerPx(10, 'mm')

  it('page → réel', () => {
    expect(pageToReal(200, p)).toBe(2000)
  })
  it('réel → page', () => {
    expect(realToPage(2000, p)).toBe(200)
  })
  it('round-trip page → réel → page', () => {
    for (const px of [0, 1, 37.5, 200, 1024]) {
      expect(realToPage(pageToReal(px, p), p)).toBeCloseTo(px, 9)
    }
  })
  it('round-trip réel → page → réel', () => {
    for (const r of [0, 12.5, 500, 9999]) {
      expect(pageToReal(realToPage(r, p), p)).toBeCloseTo(r, 9)
    }
  })
  it('round-trip sur une échelle 1:N archi', () => {
    const archi = scaleFromRatio(50, 'm')
    const px = 320
    expect(realToPage(pageToReal(px, archi), archi)).toBeCloseTo(px, 9)
  })
  it('entrées non finies → NaN', () => {
    expect(Number.isNaN(pageToReal(NaN, p))).toBe(true)
    expect(Number.isNaN(realToPage(Infinity, p))).toBe(true)
  })
})

describe('conversions avec unité cible', () => {
  it('pageToRealInUnit convertit après mesure', () => {
    // 1 px = 10 mm ; 1000 px = 10000 mm = 10 m
    const p = scaleFromRealPerPx(10, 'mm')
    expect(pageToRealInUnit(1000, p, 'm')).toBeCloseTo(10, 6)
  })
  it('realInUnitToPage : longueur en m sur un plan paramétré en mm', () => {
    const p = scaleFromRealPerPx(10, 'mm')
    // 10 m = 10000 mm → 1000 px
    expect(realInUnitToPage(10, 'm', p)).toBeCloseTo(1000, 6)
  })
  it('round-trip avec changement d’unité', () => {
    const p = scaleFromRatio(20, 'cm')
    const px = 256
    const inMeters = pageToRealInUnit(px, p, 'm')
    expect(realInUnitToPage(inMeters, 'm', p)).toBeCloseTo(px, 6)
  })
})

describe('commonScalePresets', () => {
  it('génère des profils valides et croissants', () => {
    const presets = commonScalePresets('m')
    expect(presets.length).toBeGreaterThan(0)
    expect(presets.every((p) => p.realPerPx > 0 && Number.isFinite(p.realPerPx))).toBe(true)
    expect(presets.every((p) => p.unit === 'm')).toBe(true)
    // ratios strictement croissants
    const ratios = presets.map((p) => p.ratio!)
    for (let i = 1; i < ratios.length; i++) expect(ratios[i]).toBeGreaterThan(ratios[i - 1])
  })
})
