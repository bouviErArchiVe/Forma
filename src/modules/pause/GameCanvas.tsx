/**
 * GameCanvas — hôte canvas commun des mini-jeux Pause.
 * Boucle rAF avec pause/restart propre, entrées clavier/souris/tactile,
 * cleanup complet au démontage (rAF, listeners).
 */
import { useEffect, useRef, useState } from 'react'
import { Icon } from '../../components/ui/Icon'
import type { GameColors, GameDef, InputState } from './games/core'

const COLORS_LIGHT: GameColors = {
  fg: '#1f2937', muted: '#9ca3af', accent: '#3b82f6', danger: '#ef4444', bg: 'transparent',
}
const COLORS_DARK: GameColors = {
  fg: '#e5e7eb', muted: '#6b7280', accent: '#60a5fa', danger: '#f87171', bg: 'transparent',
}

export function GameCanvas({
  game,
  bestScore,
  onGameOver,
}: {
  game: GameDef
  bestScore: number
  onGameOver: (score: number) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [running, setRunning] = useState(false)
  const [paused, setPaused] = useState(false)
  const [score, setScore] = useState(0)
  const [over, setOver] = useState(false)
  // generation force un nouvel état de jeu au restart
  const [generation, setGeneration] = useState(0)
  const overReportedRef = useRef(false)
  const pauseRef = useRef<() => void>(() => undefined)

  useEffect(() => {
    if (!running) return
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    const w = parent ? parent.clientWidth : 480
    const h = 320
    const dpr = window.devicePixelRatio || 1
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(dpr, dpr)

    const dark = document.documentElement.classList.contains('dark')
    const colors = dark ? COLORS_DARK : COLORS_LIGHT

    const input: InputState = { keys: new Set(), justPressed: new Set(), pointerX: null, tapped: false }
    let state = game.init(w, h)
    overReportedRef.current = false
    let raf = 0
    let last = performance.now()
    let isPaused = false

    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault()
      if (!input.keys.has(e.code)) input.justPressed.add(e.code)
      input.keys.add(e.code)
    }
    const onKeyUp = (e: KeyboardEvent) => input.keys.delete(e.code)
    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      input.pointerX = e.clientX - rect.left
    }
    const onPointerLeave = () => { input.pointerX = null }
    const onPointerDown = () => { input.tapped = true }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerleave', onPointerLeave)
    canvas.addEventListener('pointerdown', onPointerDown)

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!isPaused) {
        game.update(state, dt, input, w, h)
        input.justPressed.clear()
        input.tapped = false
        ctx.clearRect(0, 0, w, h)
        game.draw(ctx, state, w, h, colors)
        setScore(game.score(state))
        if (game.isGameOver(state) && !overReportedRef.current) {
          overReportedRef.current = true
          setOver(true)
          onGameOver(game.score(state))
        }
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    pauseRef.current = () => { isPaused = !isPaused }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerleave', onPointerLeave)
      canvas.removeEventListener('pointerdown', onPointerDown)
      // libère l'état (les jeux peuvent contenir des tableaux volumineux)
      state = game.init(1, 1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, generation, game])

  const start = () => {
    setOver(false)
    setScore(0)
    setPaused(false)
    setGeneration((g) => g + 1)
    setRunning(true)
  }

  const togglePause = () => {
    pauseRef.current()
    setPaused((p) => !p)
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-forma-muted">
          Score : <span className="font-semibold text-forma-text">{score}</span>
          {bestScore > 0 && <span className="ml-2">Meilleur : {bestScore}</span>}
        </div>
        <div className="flex gap-1.5">
          {!running || over ? (
            <button
              type="button"
              onClick={start}
              className="text-xs px-3 py-1 rounded-lg bg-forma-accent text-white hover:bg-forma-accent-hover transition-colors"
            >
              {over ? 'Rejouer' : 'Démarrer'}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={togglePause}
                className="text-xs px-3 py-1 rounded-lg border border-forma-border text-forma-muted hover:text-forma-accent hover:border-forma-accent/60 transition-colors"
              >
                {paused ? 'Reprendre' : 'Pause'}
              </button>
              <button
                type="button"
                onClick={start}
                title="Recommencer"
                className="text-xs px-2 py-1 rounded-lg border border-forma-border text-forma-muted hover:text-forma-accent hover:border-forma-accent/60 transition-colors"
              >
                <Icon name="undo" className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
      <div className="relative rounded-xl border border-forma-border bg-forma-surface overflow-hidden">
        <canvas ref={canvasRef} className="block w-full touch-none" style={{ height: 320 }} />
        {!running && !over && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <p className="text-sm font-medium text-forma-text mb-1">{game.name}</p>
            <p className="text-xs text-forma-muted">{game.description}</p>
          </div>
        )}
        {over && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 text-center">
            <p className="text-sm font-semibold text-white mb-0.5">Partie terminée</p>
            <p className="text-xs text-white/80">Score : {score}</p>
            {score > bestScore && score > 0 && (
              <p className="text-xs font-semibold text-amber-300 mt-1">★ Nouveau record !</p>
            )}
          </div>
        )}
        {paused && running && !over && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <p className="text-sm font-semibold text-white">Pause</p>
          </div>
        )}
      </div>
      <p className="text-[10px] text-forma-muted mt-1">{game.controls}</p>
    </div>
  )
}
