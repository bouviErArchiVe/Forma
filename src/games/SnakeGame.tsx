import { useCallback, useEffect, useRef, useState } from 'react'
import { GameShell } from './GameShell'
import type { GameProps } from './theme'

const COLS = 20
const ROWS = 16
const CELL = 18
const W = COLS * CELL
const H = ROWS * CELL

const DIR: Record<string, [number, number]> = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
}

interface SnakeState {
  snake: { x: number; y: number }[]
  dir: [number, number]
  nextDir: [number, number]
  food: { x: number; y: number }
  alive: boolean
}

export default function SnakeGame({ T, onClose, bestScore = 0, onSaveScore }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<SnakeState | null>(null)
  const [score, setScore] = useState(0)
  const [over, setOver] = useState(false)

  const reset = useCallback(() => {
    stateRef.current = {
      snake: [
        { x: 10, y: 8 },
        { x: 9, y: 8 },
        { x: 8, y: 8 },
      ],
      dir: [1, 0],
      nextDir: [1, 0],
      food: { x: 14, y: 8 },
      alive: true,
    }
    setScore(0)
    setOver(false)
  }, [])

  useEffect(() => {
    reset()
  }, [reset])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf = 0
    let last = 0

    const setDir = (d: [number, number]) => {
      const s = stateRef.current
      if (!s || !s.alive) return
      if (d[0] === -s.dir[0] && d[1] === -s.dir[1]) return
      s.nextDir = d
    }

    const onKey = (e: KeyboardEvent) => {
      if (DIR[e.code]) {
        e.preventDefault()
        setDir(DIR[e.code])
      }
    }
    window.addEventListener('keydown', onKey)

    let touchStart: { x: number; y: number } | null = null
    const onTouchStart = (e: TouchEvent) => {
      touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
    const onTouchEnd = (e: TouchEvent) => {
      if (!touchStart) return
      const dx = e.changedTouches[0].clientX - touchStart.x
      const dy = e.changedTouches[0].clientY - touchStart.y
      if (Math.abs(dx) > Math.abs(dy)) setDir(dx > 0 ? [1, 0] : [-1, 0])
      else setDir(dy > 0 ? [0, 1] : [0, -1])
      touchStart = null
    }
    canvas.addEventListener('touchstart', onTouchStart, { passive: true })
    canvas.addEventListener('touchend', onTouchEnd, { passive: true })

    const spawnFood = (snake: { x: number; y: number }[]) => {
      let p: { x: number; y: number }
      do {
        p = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) }
      } while (snake.some((s) => s.x === p.x && s.y === p.y))
      return p
    }

    const loop = (now: number) => {
      const s = stateRef.current
      if (!s) return
      if (s.alive && now - last > 95) {
        last = now
        s.dir = s.nextDir
        const head = { x: s.snake[0].x + s.dir[0], y: s.snake[0].y + s.dir[1] }
        if (
          head.x < 0 ||
          head.x >= COLS ||
          head.y < 0 ||
          head.y >= ROWS ||
          s.snake.some((p) => p.x === head.x && p.y === head.y)
        ) {
          s.alive = false
          setOver(true)
          onSaveScore?.(s.snake.length - 3)
        } else {
          s.snake.unshift(head)
          if (head.x === s.food.x && head.y === s.food.y) {
            s.food = spawnFood(s.snake)
            setScore(s.snake.length - 3)
          } else s.snake.pop()
        }
      }

      ctx.fillStyle = T.bg
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = T.accent
      ctx.fillRect(s.food.x * CELL + 2, s.food.y * CELL + 2, CELL - 4, CELL - 4)
      s.snake.forEach((p, i) => {
        ctx.fillStyle = i === 0 ? T.ink : `${T.accent}cc`
        ctx.fillRect(p.x * CELL + 1, p.y * CELL + 1, CELL - 2, CELL - 2)
      })
      if (!s.alive) {
        ctx.fillStyle = T.ink
        ctx.font = 'bold 14px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('Game Over — Entrée pour rejouer', W / 2, H / 2)
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKey)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchend', onTouchEnd)
    }
  }, [T, onSaveScore])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (over && e.code === 'Enter') reset()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [over, reset])

  return (
    <GameShell T={T} title="Snake" hint="Flèches ou swipe" score={score} best={bestScore} onClose={onClose}>
      <canvas ref={canvasRef} width={W} height={H} className="w-full block" style={{ maxWidth: W }} />
    </GameShell>
  )
}
