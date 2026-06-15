/**
 * Surcharges des valeurs de référence du Compliance Checker, persistées en
 * localStorage. Les défauts vivent dans les définitions de vérification ; ici
 * on ne stocke que ce que l'utilisateur a modifié, clé `${checkId}:${paramId}`.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

function key(checkId: string, paramId: string): string {
  return `${checkId}:${paramId}`
}

interface ComplianceParamsState {
  overrides: Record<string, number>
  get: (checkId: string, paramId: string) => number | undefined
  set: (checkId: string, paramId: string, value: number) => void
  reset: (checkId: string, paramIds: string[]) => void
}

export const useComplianceParamsStore = create<ComplianceParamsState>()(
  persist(
    (setState, getState) => ({
      overrides: {},
      get: (checkId, paramId) => getState().overrides[key(checkId, paramId)],
      set: (checkId, paramId, value) =>
        setState((s) => ({ overrides: { ...s.overrides, [key(checkId, paramId)]: value } })),
      reset: (checkId, paramIds) =>
        setState((s) => {
          const next = { ...s.overrides }
          for (const pid of paramIds) delete next[key(checkId, pid)]
          return { overrides: next }
        }),
    }),
    { name: 'forma-compliance-params' },
  ),
)

/**
 * Valeurs de référence effectives = défauts du check, écrasés par les
 * surcharges utilisateur (lues depuis le store).
 */
export function effectiveParams(
  checkId: string,
  defaults: Record<string, number>,
  overrides: Record<string, number>,
): Record<string, number> {
  const out = { ...defaults }
  for (const pid of Object.keys(defaults)) {
    const ov = overrides[`${checkId}:${pid}`]
    if (typeof ov === 'number' && Number.isFinite(ov)) out[pid] = ov
  }
  return out
}
