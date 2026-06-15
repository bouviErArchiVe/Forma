/**
 * Tests du store de paramètres du Compliance Checker + effectiveParams.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { effectiveParams, useComplianceParamsStore } from './complianceParamsStore'

beforeEach(() => {
  useComplianceParamsStore.setState({ overrides: {} })
})

describe('complianceParamsStore', () => {
  it('enregistre et lit une surcharge par check + param', () => {
    const { set, get } = useComplianceParamsStore.getState()
    set('chk-porte', 'largeurMin', 760)
    expect(useComplianceParamsStore.getState().get('chk-porte', 'largeurMin')).toBe(760)
    expect(get('chk-porte', 'inconnu')).toBeUndefined()
  })

  it('reset supprime les surcharges du check', () => {
    const { set, reset } = useComplianceParamsStore.getState()
    set('chk-porte', 'largeurMin', 760)
    reset('chk-porte', ['largeurMin'])
    expect(useComplianceParamsStore.getState().get('chk-porte', 'largeurMin')).toBeUndefined()
  })
})

describe('effectiveParams', () => {
  const defaults = { largeurMin: 810 }

  it('renvoie les défauts sans surcharge', () => {
    expect(effectiveParams('chk-porte', defaults, {})).toEqual({ largeurMin: 810 })
  })

  it('applique la surcharge utilisateur', () => {
    expect(effectiveParams('chk-porte', defaults, { 'chk-porte:largeurMin': 760 })).toEqual({ largeurMin: 760 })
  })

  it('ignore une surcharge non finie', () => {
    expect(effectiveParams('chk-porte', defaults, { 'chk-porte:largeurMin': NaN })).toEqual({ largeurMin: 810 })
  })

  it('n’applique pas la surcharge d’un autre check', () => {
    expect(effectiveParams('chk-porte', defaults, { 'autre:largeurMin': 100 })).toEqual({ largeurMin: 810 })
  })
})
