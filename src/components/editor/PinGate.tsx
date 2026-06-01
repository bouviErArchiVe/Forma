import { useState } from 'react'
import { verifyNotebookPin } from '../../services/lock'

export function PinGate({
  notebookId,
  onUnlock,
}: {
  notebookId: string
  onUnlock: () => void
}) {
  const [pin, setPin] = useState('')
  const [err, setErr] = useState('')

  return (
    <div className="flex items-center justify-center h-full bg-forma-bg p-4">
      <div className="bg-forma-surface rounded-xl shadow-lg p-6 max-w-xs w-full">
        <h2 className="font-semibold mb-2">Carnet verrouillé</h2>
        <p className="text-sm text-forma-muted mb-4">Entrez votre code PIN</p>
        <input
          type="password"
          inputMode="numeric"
          maxLength={8}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          className="w-full border rounded-lg px-3 py-2 mb-2 text-center tracking-widest"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void verifyNotebookPin(notebookId, pin).then((ok) => {
                if (ok) onUnlock()
                else setErr('Code incorrect')
              })
            }
          }}
        />
        {err && <p className="text-sm text-red-600 mb-2">{err}</p>}
        <button
          type="button"
          className="w-full py-2 bg-forma-accent text-white rounded-lg"
          onClick={async () => {
            const ok = await verifyNotebookPin(notebookId, pin)
            if (ok) onUnlock()
            else setErr('Code incorrect')
          }}
        >
          Déverrouiller
        </button>
      </div>
    </div>
  )
}
