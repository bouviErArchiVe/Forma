/**
 * Tests Compliance Checker (Pack A — A6) : évaluations déterministes,
 * statuts (conforme / non-conforme / à-verifier), paramètres, recherche.
 */
import { describe, expect, it } from 'vitest'
import {
  COMPLIANCE_CHECKS,
  complianceCategories,
  defaultParams,
  getCheck,
  searchChecks,
  type ComplianceCheck,
} from './checks'

function evalDefault(check: ComplianceCheck, values: Record<string, number>) {
  return check.evaluate(values, defaultParams(check))
}

describe('catalogue de vérifications', () => {
  it('contient toutes les catégories V1', () => {
    const cats = new Set(complianceCategories())
    for (const c of ['escaliers', 'garde-corps', 'accessibilite', 'issues', 'portes', 'stationnement', 'occupation'] as const) {
      expect(cats.has(c)).toBe(true)
    }
  })

  it('ids uniques et champs complets', () => {
    const ids = COMPLIANCE_CHECKS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const c of COMPLIANCE_CHECKS) {
      expect(c.name).toBeTruthy()
      expect(c.description.length).toBeGreaterThan(10)
      expect(c.fields.length).toBeGreaterThan(0)
      expect(c.params.length).toBeGreaterThan(0)
    }
  })
})

describe('entrées manquantes → à-verifier', () => {
  it('escalier sans valeurs → a-verifier', () => {
    const check = getCheck('chk-escalier')!
    expect(evalDefault(check, {}).status).toBe('a-verifier')
  })
})

describe('escaliers', () => {
  const check = getCheck('chk-escalier')!
  it('marche/giron/Blondel corrects → conforme', () => {
    const r = evalDefault(check, { h: 178, g: 280 }) // 2h+g = 636
    expect(r.status).toBe('conforme')
  })
  it('giron trop court → non-conforme', () => {
    const r = evalDefault(check, { h: 178, g: 200 })
    expect(r.status).toBe('non-conforme')
    expect(r.details.some((d) => d.label === 'Giron' && d.ok === false)).toBe(true)
  })
})

describe('garde-corps', () => {
  const check = getCheck('chk-garde-corps')!
  it('hauteur et ajourement conformes', () => {
    expect(evalDefault(check, { hauteur: 1070, espacement: 100 }).status).toBe('conforme')
  })
  it('ajourement trop large → non-conforme', () => {
    expect(evalDefault(check, { hauteur: 1100, espacement: 120 }).status).toBe('non-conforme')
  })
})

describe('rampe / accessibilité', () => {
  const check = getCheck('chk-rampe')!
  it('pente 8% et largeur ok → conforme', () => {
    // 80 mm sur 1000 mm = 8 % ≤ 8.33 %
    expect(evalDefault(check, { denivele: 80, longueur: 1000, largeur: 900 }).status).toBe('conforme')
  })
  it('pente trop forte → non-conforme', () => {
    expect(evalDefault(check, { denivele: 150, longueur: 1000, largeur: 900 }).status).toBe('non-conforme')
  })
  it('longueur nulle → a-verifier (pas de division par zéro)', () => {
    expect(evalDefault(check, { denivele: 80, longueur: 0, largeur: 900 }).status).toBe('a-verifier')
  })
})

describe('stationnement', () => {
  const check = getCheck('chk-stationnement')!
  it('places accessibles suffisantes', () => {
    // 50 places / ratio 25 = 2 requis ; 2 fournies → conforme
    expect(evalDefault(check, { totalPlaces: 50, accessiblesFournies: 2 }).status).toBe('conforme')
  })
  it('places accessibles insuffisantes', () => {
    expect(evalDefault(check, { totalPlaces: 50, accessiblesFournies: 1 }).status).toBe('non-conforme')
  })
})

describe('occupation', () => {
  const check = getCheck('chk-occupation')!
  it('charge sous la capacité → conforme', () => {
    // 100 m² / 1 = 100 personnes ≤ 120
    expect(evalDefault(check, { aire: 100, capaciteMax: 120 }).status).toBe('conforme')
  })
  it('charge au-dessus de la capacité → non-conforme', () => {
    expect(evalDefault(check, { aire: 200, capaciteMax: 120 }).status).toBe('non-conforme')
  })
})

describe('paramètres configurables', () => {
  it('un seuil modifié change le résultat', () => {
    const check = getCheck('chk-porte')!
    const strict = check.evaluate({ largeurLibre: 800 }, { largeurMin: 810 })
    const lenient = check.evaluate({ largeurLibre: 800 }, { largeurMin: 760 })
    expect(strict.status).toBe('non-conforme')
    expect(lenient.status).toBe('conforme')
  })
})

describe('searchChecks', () => {
  it('requête vide → tout', () => {
    expect(searchChecks('').length).toBe(COMPLIANCE_CHECKS.length)
  })
  it('trouve par catégorie / mot-clé (accents-insensible)', () => {
    expect(searchChecks('garde-corps').some((c) => c.id === 'chk-garde-corps')).toBe(true)
    expect(searchChecks('rampe').some((c) => c.category === 'accessibilite')).toBe(true)
    expect(searchChecks('OCCUPATION').some((c) => c.id === 'chk-occupation')).toBe(true)
  })
  it('aucune correspondance → vide', () => {
    expect(searchChecks('zzzxxqq')).toEqual([])
  })
})
