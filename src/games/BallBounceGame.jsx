import { useCallback, useEffect, useRef, useState } from 'react'
import GameShell from '@/components/games/GameShell'

const W = 420
const H = 520

export default function BallBounceGame({ T, onClose, bestScore = 0, onSaveScore }) {
  const canvasRef = useRef(null)
  const stateRef = useRef(null)
  const [score, setScore] = useState(0)

  const reset = useCallback(() => {
    stateRef.current = {
      ball: { x: W / 2, y: H / 3, vx: 3, vy: 4 },
      paddle: W / 2 - 45,
      hits: 0,
      alive: true,
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
    window.addEventListener('mousemove', onMove)
    canvas.addEventListener('touchmove', onTouch, { passive: false })

    const loop = () => {
      const s = stateRef.current
      if (!s) return

      if (s.alive) {
        s.ball.x += s.ball.vx
        s.ball.y += s.ball.vy
        if (s.ball.x <= 10 || s.ball.x >= W - 10) s.ball.vx *= -1
        if (s.ball.y <= 10) s.ball.vy *= -1

        if (s.ball.y >= H - 28 && s.ball.y <= H - 12 && s.ball.x > s.paddle && s.ball.x < s.paddle + 90) {
          s.ball.vy = -Math.abs(s.ball.vy) - 0.15
          s.ball.vx += (s.ball.x - (s.paddle + 45)) * 0.08
          s.hits += 1
          setScore(s.hits)
          onSaveScore?.(s.hits)
        } else if (s.ball.y > H) {
          s.alive = false
        }
      }

      ctx.fillStyle = T.bg
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = T.ink
      ctx.fillRect(s.paddle, H - 18, 90, 10)
      ctx.fillStyle = T.accent
      ctx.beginPath()
      ctx.arc(s.ball.x, s.ball.y, 10, 0, Math.PI * 2)
      ctx.fill()

      if (!s.alive) {
        ctx.fillStyle = T.ink
        ctx.font = 'bold 15px Syne, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('Perdu — clic pour rejouer', W / 2, H / 2)
      }

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    const onTap = () => { if (!stateRef.current.alive) reset() }
    canvas.addEventListener('pointerdown', onTap)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('touchmove', onTouch)
      canvas.removeEventListener('pointerdown', onTap)
    }
  }, [T, reset, onSaveScore])

  return (
    <GameShell T={T} title="Ball Bounce" hint="Garde la balle en l'air" score={score} best={bestScore} onClose={onClose}>
      <canvas ref={canvasRef} width={W} height={H} style={{ width: '100%', maxWidth: W, display: 'block', touchAction: 'none' }} />
    </GameShell>
  )
}
