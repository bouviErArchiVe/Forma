import { useEffect, useState } from 'react'
import {
  applyPwaUpdate,
  getPwaRegistration,
  getPwaUpdateState,
  subscribePwaUpdate,
  type PwaUpdateState,
} from '../lib/pwa'

export function usePwaUpdate() {
  const [state, setState] = useState<PwaUpdateState>(getPwaUpdateState)
  const [supported] = useState(
    () => 'serviceWorker' in navigator && import.meta.env.PROD,
  )

  useEffect(() => subscribePwaUpdate(setState), [])

  return {
    supported,
    updateState: state,
    hasUpdate: state === 'available',
    isApplying: state === 'applying',
    registration: getPwaRegistration(),
    applyUpdate: applyPwaUpdate,
    checkForUpdate: () => getPwaRegistration()?.update(),
  }
}
