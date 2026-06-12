/**
 * FocusTimer — minuteur de pauses/focus (5/10/15/25 min ou durée libre).
 * Signal de fin : toast + deux bips Web Audio (aucun fichier audio).
 */
import { useEffect, useRef, useState } from 'react'
import { useToastStore } from '../../stores/toastStore'

const PRESETS_MIN = [5, 10, 15, 25]

/** Deux bips courts via oscillateur (AudioContext fermé après usage). */
function playEndChime(): void {
  try {
    const ctx = new AudioContext()
    const beep = (at: number, freq: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + at)
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + at + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + 0.35)
      osc.connect(gain).connect(ctx.destination)
      osc.start(ctx.currentTime + at)
      osc.stop(ctx.currentTime + at + 0.4)
    }
    beep(0, 880)
    beep(0.45, 1175)
    window.setTimeout(() => void ctx.close(), 1200)
  } catch {
    /* audio indisponible — le toast suffit */
  }
}

export function FocusTimer({
  lastDuration,
  onDurationChange,
}: {
  lastDuration: number
  onDurationChange: (minutes: number) => void
}) {
  const [durationMin, setDurationMin] = useState(lastDuration > 0 ? lastDuration : 25)
  const [remaining, setRemaining] = useState(durationMin * 60)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<number | null>(null)
  const endAtRef = useRef(0)

  useEffect(() => {
    if (!running) {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current)
      intervalRef.current = null
      return
    }
    endAtRef.current = Date.now() + remaining * 1000
    intervalRef.current = window.setInterval(() => {
      const left = Math.max(0, Math.round((endAtRef.current - Date.now()) / 1000))
      setRemaining(left)
      if (left <= 0) {
        setRunning(false)
        playEndChime()
        useToastStore.getState().show('⏰ Pause terminée — au travail !')
      }
    }, 250)
    return () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  const mm = Math.floor(remaining / 60)
  const ss = remaining % 60
  const pct = durationMin > 0 ? (remaining / (durationMin * 60)) * 100 : 0

  const selectDuration = (min: number) => {
    setDurationMin(min)
    onDurationChange(min)
    setRunning(false)
    setRemaining(min * 60)
  }

  return (
    <div className="max-w-sm mx-auto text-center">
      {/* Présélections */}
      <div className="flex justify-center gap-1.5 mb-5">
        {PRESETS_MIN.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => selectDuration(m)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              durationMin === m
                ? 'border-forma-accent text-forma-accent bg-forma-accent/10 font-medium'
                : 'border-forma-border text-forma-muted hover:border-forma-accent/50'
            }`}
          >
            {m} min
          </button>
        ))}
        <input
          type="number"
          min={1}
          max={120}
          value={durationMin}
          onChange={(e) => selectDuration(Math.max(1, Math.min(120, Number(e.target.value) || 1)))}
          title="Durée libre (minutes)"
          className="w-16 text-xs border border-forma-border rounded-lg px-2 py-1.5 bg-forma-bg text-center focus:outline-none focus:border-forma-accent"
        />
      </div>

      {/* Affichage */}
      <div className="relative w-48 h-48 mx-auto mb-5">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="6" className="text-forma-border" />
          <circle
            cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * 276.5} 276.5`}
            className="text-forma-accent transition-all duration-200"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl font-semibold tabular-nums text-forma-text">
            {mm}:{String(ss).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Contrôles */}
      <div className="flex justify-center gap-2">
        {!running ? (
          <button
            type="button"
            onClick={() => remaining > 0 && setRunning(true)}
            className="text-sm px-5 py-2 rounded-xl bg-forma-accent text-white hover:bg-forma-accent-hover transition-colors font-medium"
          >
            {remaining < durationMin * 60 && remaining > 0 ? 'Reprendre' : 'Démarrer'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setRunning(false)}
            className="text-sm px-5 py-2 rounded-xl border border-forma-border text-forma-text hover:border-forma-accent/60 transition-colors font-medium"
          >
            Pause
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setRunning(false)
            setRemaining(durationMin * 60)
          }}
          className="text-sm px-4 py-2 rounded-xl border border-forma-border text-forma-muted hover:text-forma-text transition-colors"
        >
          Réinitialiser
        </button>
      </div>
    </div>
  )
}
