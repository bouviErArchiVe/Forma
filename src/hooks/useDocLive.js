import { useEffect, useMemo, useState } from 'react'
import { getDoc } from '@/lib/docs/persistence'
import { subscribeDocUpdates } from '@/lib/docs/sync'

/** Recharge un document quand sa source est modifiée (Forma Docs). */
export function useDocLive(docId) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!docId) return undefined
    return subscribeDocUpdates((id) => {
      if (!id || id === docId) setTick((t) => t + 1)
    })
  }, [docId])

  return useMemo(() => (docId ? getDoc(docId) : null), [docId, tick])
}
