import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'forma-pwa-dismiss'
const DISMISS_MS = 30 * 86400000

function isPwaDismissed(): boolean {
  const raw = localStorage.getItem(DISMISS_KEY)
  if (!raw) return false
  const at = Number(raw)
  if (!Number.isFinite(at)) return raw === '1'
  return Date.now() - at < DISMISS_MS
}

export function PwaInstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [hidden, setHidden] = useState(isPwaDismissed)

  useEffect(() => {
    const onBip = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onBip)
    return () => window.removeEventListener('beforeinstallprompt', onBip)
  }, [])

  if (hidden || !deferred) return null
  if (window.matchMedia('(display-mode: standalone)').matches) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-[95] bg-forma-surface dark:bg-gray-900 border border-forma-border rounded-xl shadow-lg p-4 text-sm">
      <p className="font-medium mb-1">Installer Forma</p>
      <p className="text-forma-muted text-xs mb-3">
        Ajoutez l’app à l’écran d’accueil pour un accès rapide hors navigateur.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          className="flex-1 py-2 bg-forma-accent text-white rounded-lg text-xs"
          onClick={async () => {
            await deferred.prompt()
            const { outcome } = await deferred.userChoice
            if (outcome === 'accepted') setDeferred(null)
          }}
        >
          Installer
        </button>
        <button
          type="button"
          className="px-3 py-2 border rounded-lg text-xs dark:border-gray-600"
          onClick={() => {
            localStorage.setItem(DISMISS_KEY, String(Date.now()))
            setHidden(true)
          }}
        >
          Plus tard
        </button>
      </div>
    </div>
  )
}
