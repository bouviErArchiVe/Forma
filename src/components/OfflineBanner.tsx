import { useEffect, useRef, useState } from 'react'
import { initMultiTabDetection, subscribeMultiTab } from '../lib/multi-tab'

function readOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine
}

/** Bandeau hors-ligne (données locales IndexedDB). */
export function OfflineBanner() {
  const [online, setOnline] = useState(readOnline)
  const [showReconnected, setShowReconnected] = useState(false)
  const wasOfflineRef = useRef(false)

  useEffect(() => {
    const sync = () => setOnline(readOnline())

    const onOnline = () => {
      setOnline(true)
      if (wasOfflineRef.current) {
        setShowReconnected(true)
        window.setTimeout(() => setShowReconnected(false), 4000)
      }
      wasOfflineRef.current = false
    }

    const onOffline = () => {
      setOnline(false)
      wasOfflineRef.current = true
      setShowReconnected(false)
    }

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    window.addEventListener('focus', sync)
    document.addEventListener('visibilitychange', sync)

    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('focus', sync)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [])

  if (showReconnected) {
    return (
      <div
        className="shrink-0 text-center text-xs py-1.5 bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-100 border-b border-emerald-300/60"
        role="status"
        aria-live="polite"
      >
        Connexion rétablie — synchronisation cloud toujours indisponible (100 % local)
      </div>
    )
  }

  if (online) return null

  return (
    <div
      className="shrink-0 text-center text-xs py-1.5 bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-100 border-b border-amber-300/60"
      role="status"
      aria-live="polite"
    >
      Hors ligne — vos carnets restent disponibles et modifiables localement (IndexedDB)
    </div>
  )
}

/** Avertissement discret si Forma est ouvert dans un autre onglet. */
export function MultiTabBanner() {
  const [hasOther, setHasOther] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const stopDetection = initMultiTabDetection()
    const unsub = subscribeMultiTab(setHasOther)
    return () => {
      unsub()
      stopDetection()
    }
  }, [])

  if (!hasOther || dismissed) return null

  return (
    <div
      className="shrink-0 flex items-center justify-center gap-2 text-center text-xs py-1.5 px-3 bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200 border-b border-slate-300/50 dark:border-slate-700"
      role="status"
      aria-live="polite"
    >
      <span>
        Forma est ouvert dans un autre onglet — évitez d’éditer le même carnet en parallèle
      </span>
      <button
        type="button"
        className="shrink-0 px-1.5 py-0.5 rounded hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
        aria-label="Masquer l’avertissement"
        onClick={() => setDismissed(true)}
      >
        ×
      </button>
    </div>
  )
}
