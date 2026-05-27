import { useCallback, useEffect, useRef, useState } from 'react'
import GameShell from '@/components/games/GameShell'

const W = 480
const H = 360
const COLS = 8
const ROWS = 5

export default function BreakoutGame({ T, onClose, bestScore = 0, onSaveScore }) {
  const canvasRef = useRef(null)
  const stateRef = useRef(null)
  const [score, setScore] = useState(0)

  const reset = useCallback(() => {
    const bricks = []
    for (let r = 0; r < ROWS; r += 1) {
      for (let c = 0; c < COLS; c += 1) {
        bricks.push({ x: c * 58 + 12, y: r * 22 + 36, w: 52, h: 16, alive: true })
      }
    }
    stateRef.current = {
      ball: { x: W / 2, y: H - 60, vx: 3, vy: -3.5 },
      paddle: W / 2 - 45,
      bricks,
      alive: true,
      points: 0,
    }
    setScore(0)
  }, [])

  useEffect(() => { reset() }, [reset])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf

    const move = (clientX) => {
      const rect = canvas.getBoundingClientRect()
      stateRef.current.paddle = Math.max(0, Math.min(W - 90, ((clientX - rect.left) / rect.width) * W - 45))
    }
    const onMove = (e) => move(e.clientX)
    const onTouch = (e) => { e.preventDefault(); move(e.touches[0].clientX) }
    const onKey = (e) => {
      const s = stateRef.current
      if (e.code === 'ArrowLeft') s.paddle = Math.max(0, s.paddle - 18)
      if (e.code === 'ArrowRight') s.paddle = Math.min(W - 90, s.paddle + 18)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('keydown', onKey)
    canvas.addEventListener('touchmove', onTouch, { passive: false })

    const loop = () => {
      const s = stateRef.current
      if (!s) return

      if (s.alive) {
        s.ball.x += s.ball.vx
        s.ball.y += s.ball.vy
        if (s.ball.x <= 8 || s.ball.x >= W - 8) s.ball.vx *= -1
        if (s.ball.y <= 8) s.ball.vy *= -1

        if (s.ball.y >= H - 28 && s.ball.x > s.paddle && s.ball.x < s.paddle + 90) {
          s.ball.vy = -Math.abs(s.ball.vy)
          s.ball.vx = (s.ball.x - (s.paddle + 45)) * 0.12
        } else if (s.ball.y > H) s.alive = false

        s.bricks.forEach((b) => {
          if (!b.alive) return
          if (s.ball.x > b.x && s.ball.x < b.x + b.w && s.ball.y > b.y && s.ball.y < b.y + b.h) {
            b.alive = false
            s.ball.vy *= -1
            s.points += 10
            setScore(s.points)
            onSaveScore?.(s.points)
          }
        })
        if (s.bricks.every((b) => !b.alive)) s.alive = false
      }

      ctx.fillStyle = T.bg
      ctx.fillRect(0, 0, W, H)
      s.bricks.forEach((b) => {
        if (!b.alive) return
        ctx.fillStyle = T.accent
        ctx.fillRect(b.x, b.y, b.w, b.h)
      })
      ctx.fillStyle = T.ink
      ctx.fillRect(s.paddle, H - 16, 90, 10)
      ctx.fillStyle = T.ink
      ctx.beginPath()
      ctx.arc(s.ball.x, s.ball.y, 7, 0, Math.PI * 2)
      ctx.fill()

      if (!s.alive) {
        ctx.fillStyle = T.ink
        ctx.font = 'bold 15px Syne, sans-serif'
        ctx.textAlign = 'center'
        const won = s.bricks.every((b) => !b.alive)
        ctx.fillText(won ? 'Bravo ! — Entrée' : 'Perdu — Entrée', W / 2, H / 2)
      }

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    const onRestart = (e) => { if (e.code === 'Enter' && !stateRef.current.alive) reset() }
    window.addEventListener('keydown', onRestart)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keydown', onRestart)
      canvas.removeEventListener('touchmove', onTouch)
    }
  }, [T, reset, onSaveScore])

  return (
    <GameShell T={T} title="Breakout" hint="Souris, toucher ou flèches" score={score} best={bestScore} onClose={onClose}>
      <canvas ref={canvasRef} width={W} height={H} style={{ width: '100%', maxWidth: W, display: 'block', touchAction: 'none' }} />
    </GameShell>
  )
}
