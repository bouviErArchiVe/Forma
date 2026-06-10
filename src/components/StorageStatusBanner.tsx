import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getBrowserStorageEstimate, isStorageNearlyFull, type BrowserStorageEstimate } from '../lib/storage-quota'

const CHECK_INTERVAL_MS = 5 * 60 * 1000

/** Bandeau d'alerte de saturation du stockage navigateur (quota IndexedDB). */
export function StorageStatusBanner() {
  const [estimate, setEstimate] = useState<BrowserStorageEstimate | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    let cancelled = false
    const check = () => {
      void getBrowserStorageEstimate().then((est) => {
        if (!cancelled) setEstimate(est)
      })
    }
    check()
    const interval = window.setInterval(check, CHECK_INTERVAL_MS)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [])

  const percent = estimate?.percent ?? null
  if (percent == null || dismissed) return null

  const critical = isStorageNearlyFull(percent, 95)
  const warning = !critical && isStorageNearlyFull(percent, 85)
  if (!critical && !warning) return null

  if (critical) {
    return (
      <div
        className="shrink-0 flex items-center justify-center gap-2 text-center text-xs py-1.5 px-3 bg-red-100 text-red-950 dark:bg-red-950 dark:text-red-100 border-b border-red-300/60"
        role="alert"
        aria-live="assertive"
      >
        <span>
          Stockage presque saturé ({percent} %) — risque de perte de données à la prochaine
          sauvegarde. Libérez de l’espace dans les{' '}
          <Link to="/settings" className="underline font-medium">
            Paramètres
          </Link>
          .
        </span>
        <button
          type="button"
          className="shrink-0 px-1.5 py-0.5 rounded hover:bg-red-200/80 dark:hover:bg-red-900 text-red-700 dark:text-red-300"
          aria-label="Masquer l’alerte"
          onClick={() => setDismissed(true)}
        >
          ×
        </button>
      </div>
    )
  }

  return (
    <div
      className="shrink-0 flex items-center justify-center gap-2 text-center text-xs py-1.5 px-3 bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-100 border-b border-amber-300/60"
      role="status"
      aria-live="polite"
    >
      <span>
        Espace de stockage faible ({percent} %) — pensez à nettoyer dans les{' '}
        <Link to="/settings" className="underline font-medium">
          Paramètres
        </Link>
        .
      </span>
      <button
        type="button"
        className="shrink-0 px-1.5 py-0.5 rounded hover:bg-amber-200/80 dark:hover:bg-amber-900 text-amber-700 dark:text-amber-300"
        aria-label="Masquer l’avertissement"
        onClick={() => setDismissed(true)}
      >
        ×
      </button>
    </div>
  )
}
