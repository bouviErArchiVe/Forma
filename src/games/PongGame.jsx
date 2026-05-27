import { useCallback, useEffect, useRef, useState } from 'react'
import GameShell from '@/components/games/GameShell'

const W = 480
const H = 300

export default function PongGame({ T, onClose, bestScore = 0, onSaveScore }) {
  const canvasRef = useRef(null)
  const stateRef = useRef(null)
  const [score, setScore] = useState('0 - 0')

  const reset = useCallback(() => {
    stateRef.current = {
      ball: { x: W / 2, y: H / 2, vx: 3.5, vy: 2.5 },
      p1: H / 2 - 40,
      p2: H / 2 - 40,
      s1: 0,
      s2: 0,
      over: false,
    }
    setScore('0 - 0')
  }, [])

  useEffect(() => { reset() }, [reset])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf

    const movePaddle = (clientY) => {
      const rect = canvas.getBoundingClientRect()
      const y = ((clientY - rect.top) / rect.height) * H - 40
      stateRef.current.p1 = Math.max(8, Math.min(H - 88, y))
    }

    const onMove = (e) => movePaddle(e.clientY)
    const onTouch = (e) => { e.preventDefault(); movePaddle(e.touches[0].clientY) }
    window.addEventListener('mousemove', onMove)
    canvas.addEventListener('touchmove', onTouch, { passive: false })

    const loop = () => {
      const s = stateRef.current
      if (!s || s.over) {
        raf = requestAnimationFrame(loop)
        return
      }

      s.p2 += (s.ball.y - (s.p2 + 40)) * 0.08
      s.p2 = Math.max(8, Math.min(H - 88, s.p2))

      s.ball.x += s.ball.vx
      s.ball.y += s.ball.vy
      if (s.ball.y <= 8 || s.ball.y >= H - 8) s.ball.vy *= -1

      if (s.ball.x <= 20 && s.ball.y > s.p1 && s.ball.y < s.p1 + 80) {
        s.ball.vx = Math.abs(s.ball.vx) * 1.04
        s.ball.vy += (s.ball.y - (s.p1 + 40)) * 0.05
      }
      if (s.ball.x >= W - 20 && s.ball.y > s.p2 && s.ball.y < s.p2 + 80) {
        s.ball.vx = -Math.abs(s.ball.vx) * 1.04
        s.ball.vy += (s.ball.y - (s.p2 + 40)) * 0.05
      }

      if (s.ball.x < 0) {
        s.s2 += 1
        s.ball = { x: W / 2, y: H / 2, vx: 3.5, vy: (Math.random() - 0.5) * 5 }
      }
      if (s.ball.x > W) {
        s.s1 += 1
        s.ball = { x: W / 2, y: H / 2, vx: -3.5, vy: (Math.random() - 0.5) * 5 }
        onSaveScore?.(s.s1)
      }
      setScore(`${s.s1} - ${s.s2}`)
      if (s.s1 >= 5 || s.s2 >= 5) s.over = true

      ctx.fillStyle = T.bg
      ctx.fillRect(0, 0, W, H)
      ctx.setLineDash([6, 8])
      ctx.strokeStyle = `${T.muted}66`
      ctx.beginPath()
      ctx.moveTo(W / 2, 0)
      ctx.lineTo(W / 2, H)
      ctx.stroke()
      ctx.setLineDash([])

      ctx.fillStyle = T.ink
      ctx.fillRect(8, s.p1, 10, 80)
      ctx.fillStyle = `${T.accent}aa`
      ctx.fillRect(W - 18, s.p2, 10, 80)
      ctx.fillStyle = T.accent
      ctx.beginPath()
      ctx.arc(s.ball.x, s.ball.y, 8, 0, Math.PI * 2)
      ctx.fill()

      if (s.over) {
        ctx.fillStyle = T.ink
        ctx.font = 'bold 16px Syne, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(s.s1 >= 5 ? 'Victoire !' : 'Défaite…', W / 2, H / 2)
      }

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('touchmove', onTouch)
    }
  }, [T, onSaveScore])

  return (
    <GameShell T={T} title="Pong" hint="Souris ou doigt sur la raquette gauche" score={score} best={bestScore} onClose={onClose}>
      <canvas ref={canvasRef} width={W} height={H} style={{ width: '100%', maxWidth: W, display: 'block', touchAction: 'none' }} />
    </GameShell>
  )
}
