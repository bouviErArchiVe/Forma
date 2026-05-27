import { useEffect, useMemo, useState } from 'react'
import { getSheet } from '@/lib/spreadsheet/persistence'
import { subscribeSheetUpdates } from '@/lib/spreadsheet/sync'

/** Recharge un tableur quand sa source est modifiée (Forma Sheets). */
export function useSheetLive(sheetId) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!sheetId) return undefined
    return subscribeSheetUpdates((id) => {
      if (!id || id === sheetId) setTick((t) => t + 1)
    })
  }, [sheetId])

  return useMemo(() => (sheetId ? getSheet(sheetId) : null), [sheetId, tick])
}

export function useSheetSyncTick() {
  const [tick, setTick] = useState(0)
  useEffect(() => subscribeSheetUpdates(() => setTick((t) => t + 1)), [])
  return tick
}
