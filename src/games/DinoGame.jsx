import { useCallback, useEffect, useRef, useState } from 'react'
import GameShell from '@/components/games/GameShell'

const W = 640
const H = 180
const GROUND = H - 24

export default function DinoGame({ T, onClose, bestScore = 0, onSaveScore }) {
  const canvasRef = useRef(null)
  const stateRef = useRef(null)
  const [score, setScore] = useState(0)
  const [over, setOver] = useState(false)

  const reset = useCallback(() => {
    stateRef.current = {
      dinoY: GROUND - 36,
      vy: 0,
      jumping: false,
      obstacles: [],
      spawn: 0,
      tick: 0,
      speed: 4,
      alive: true,
    }
    setScore(0)
    setOver(false)
  }, [])

  useEffect(() => { reset() }, [reset])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf

    const jump = () => {
      const s = stateRef.current
      if (!s || !s.alive || s.jumping) return
      s.vy = -11
      s.jumping = true
    }

    const onKey = (e) => { if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); jump() } }
    const onTap = () => jump()
    window.addEventListener('keydown', onKey)
    canvas.addEventListener('pointerdown', onTap)

    const loop = () => {
      const s = stateRef.current
      if (!s) return
      s.tick += 1
      if (s.alive) {
        s.speed = 4 + Math.floor(s.tick / 600)
        s.spawn -= 1
        if (s.spawn <= 0) {
          s.obstacles.push({ x: W + 20, w: 14 + Math.random() * 16, h: 24 + Math.random() * 18 })
          s.spawn = 70 + Math.random() * 80
        }
        s.vy += 0.55
        s.dinoY += s.vy
        if (s.dinoY >= GROUND - 36) { s.dinoY = GROUND - 36; s.vy = 0; s.jumping = false }
        s.obstacles.forEach((o) => { o.x -= s.speed })
        s.obstacles = s.obstacles.filter((o) => o.x > -40)
        const dx = 48
        const dy = s.dinoY
        for (const o of s.obstacles) {
          if (dx + 28 > o.x && dx < o.x + o.w && dy + 32 > GROUND - o.h) {
            s.alive = false
            setOver(true)
            onSaveScore?.(Math.floor(s.tick / 6))
          }
        }
        if (s.tick % 6 === 0) setScore(Math.floor(s.tick / 6))
      }

      ctx.fillStyle = T.bg || '#faf8f5'
      ctx.fillRect(0, 0, W, H)
      ctx.strokeStyle = T.muted || '#888'
      ctx.beginPath()
      ctx.moveTo(0, GROUND)
      ctx.lineTo(W, GROUND)
      ctx.stroke()

      ctx.fillStyle = T.ink || '#333'
      ctx.fillRect(48, s.dinoY, 28, 32)
      ctx.fillRect(68, s.dinoY + 8, 12, 8)

      ctx.fillStyle = T.accent || '#c8622a'
      s.obstacles.forEach((o) => ctx.fillRect(o.x, GROUND - o.h, o.w, o.h))

      if (!s.alive) {
        ctx.fillStyle = T.ink
        ctx.font = 'bold 16px Syne, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('Game Over — Espace pour rejouer', W / 2, H / 2)
      }

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKey)
      canvas.removeEventListener('pointerdown', onTap)
    }
  }, [T, reset, onSaveScore])

  useEffect(() => {
    const onKey = (e) => {
      if (over && e.code === 'Space') reset()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [over, reset])

  return (
    <GameShell T={T} title="Dino Run" hint="Espace ou toucher pour sauter" score={score} best={bestScore} onClose={onClose}>
      <canvas ref={canvasRef} width={W} height={H} style={{ width: '100%', maxWidth: W, display: 'block', touchAction: 'none' }} />
    </GameShell>
  )
}
