import { useEffect, useRef } from 'react'
import { GLOBAL_ANIM_OPACITY } from '@/config/appearance'

function mkParticle(W, H, anim, T) {
  const palette = [T.accent, T.a2, T.a3].filter(Boolean)
  const color = anim === 'fireflies'
    ? palette[Math.floor(Math.random() * palette.length)]
    : T.accent

  const base = { x: Math.random() * W, y: Math.random() * H, life: 0, maxLife: 120 + Math.random() * 180, color }

  if (anim === 'fireflies') {
    const shapes = ['circle', 'circle', 'circle', 'star', 'cross']
    return {
      ...base,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -(Math.random() * 0.5 + 0.15),
      r: Math.random() * 2.8 + 1,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      phase: Math.random() * Math.PI * 2,
      amp: Math.random() * 0.25 + 0.08,
    }
  }
  if (anim === 'leaves') {
    return { ...base, x: Math.random() * W, y: -20, vx: (Math.random() - 0.5) * 1.2, vy: Math.random() * 0.8 + 0.4, rot: Math.random() * 360, rspd: (Math.random() - 0.5) * 2, r: Math.random() * 5 + 3 }
  }
  if (anim === 'sparkles') {
    return { ...base, x: Math.random() * W, y: Math.random() * H, life: 0, maxLife: 60 + Math.random() * 80, r: Math.random() * 2.5 + 1 }
  }
  if (anim === 'geometry') {
    return { ...base, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, rot: Math.random() * 360, rspd: (Math.random() - 0.5) * 0.5, size: Math.random() * 18 + 8, shape: ['tri', 'sq', 'hex'][Math.floor(Math.random() * 3)] }
  }
  if (anim === 'waves') {
    return { ...base, y: Math.random() * H, vy: 0, vx: Math.random() * 0.6 + 0.2, phase: Math.random() * Math.PI * 2, amp: Math.random() * 18 + 8, r: Math.random() * 2 + 1 }
  }
  if (anim === 'drops') {
    const baseR = Math.random() * 18 + 8
    return {
      ...base,
      maxLife: 100 + Math.random() * 60,
      waves: [{ delay: 0, r: 0, maxR: baseR }, { delay: 10, r: 0, maxR: baseR * 1.8 }, { delay: 22, r: 0, maxR: baseR * 2.8 }],
      vr: Math.random() * 0.45 + 0.3,
    }
  }
  if (anim === 'pulses') {
    return { ...base, r: 0, maxR: Math.random() * 60 + 30, vr: Math.random() * 0.4 + 0.15 }
  }
  if (anim === 'pencil') {
    const angle = (Math.random() - 0.5) * Math.PI * 0.7 + Math.PI * (Math.random() < 0.4 ? 0.5 : 0)
    return {
      ...base,
      angle,
      len: Math.random() * 80 + 20,
      curve: (Math.random() - 0.5) * 0.28,
      sw: Math.random() * 1.4 + 0.25,
      maxLife: 160 + Math.random() * 120,
      vx: (Math.random() - 0.5) * 0.04,
      vy: (Math.random() - 0.5) * 0.04,
    }
  }
  return base
}

function drawParticle(ctx, p, anim) {
  const a = Math.sin((p.life / p.maxLife) * Math.PI) * 0.35
  if (a <= 0) return
  ctx.fillStyle = p.color
  ctx.strokeStyle = p.color

  if (anim === 'fireflies') {
    ctx.globalAlpha = a
    if (p.shape === 'circle') {
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = a * 0.22
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r * 3.8, 0, Math.PI * 2)
      ctx.fill()
    } else if (p.shape === 'star') {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.globalAlpha = a
      ctx.lineWidth = p.r * 0.55
      ctx.lineCap = 'round'
      for (let i = 0; i < 5; i++) {
        const ang = (i * Math.PI * 2) / 5 - Math.PI / 2
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(Math.cos(ang) * p.r * 2.6, Math.sin(ang) * p.r * 2.6)
        ctx.stroke()
      }
      ctx.restore()
    } else if (p.shape === 'cross') {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.globalAlpha = a
      ctx.lineWidth = p.r * 0.6
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(-p.r * 2.2, 0)
      ctx.lineTo(p.r * 2.2, 0)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, -p.r * 2.2)
      ctx.lineTo(0, p.r * 2.2)
      ctx.stroke()
      ctx.restore()
    }
  } else if (anim === 'leaves') {
    ctx.globalAlpha = a
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate((p.rot * Math.PI) / 180)
    ctx.beginPath()
    ctx.ellipse(0, 0, p.r * 1.6, p.r * 0.8, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  } else if (anim === 'sparkles') {
    ctx.globalAlpha = a
    const s = p.r
    ctx.save()
    ctx.translate(p.x, p.y)
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 4)
      ctx.beginPath()
      ctx.moveTo(0, -s * 2.2)
      ctx.lineTo(0, -s * 0.5)
      ctx.lineWidth = s * 0.5
      ctx.stroke()
    }
    ctx.restore()
  } else if (anim === 'geometry') {
    ctx.globalAlpha = a
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate((p.rot * Math.PI) / 180)
    ctx.lineWidth = 1.2
    ctx.beginPath()
    if (p.shape === 'tri') {
      const h = p.size * 0.866
      ctx.moveTo(0, -h * 0.67)
      ctx.lineTo(p.size / 2, h * 0.33)
      ctx.lineTo(-p.size / 2, h * 0.33)
      ctx.closePath()
      ctx.stroke()
    } else if (p.shape === 'sq') {
      ctx.strokeRect(-p.size / 2, -p.size / 2, p.size, p.size)
    } else {
      for (let i = 0; i < 6; i++) {
        const a2 = (i * Math.PI) / 3
        ctx.lineTo(p.size * Math.cos(a2), p.size * Math.sin(a2))
      }
      ctx.closePath()
      ctx.stroke()
    }
    ctx.restore()
  } else if (anim === 'waves') {
    ctx.globalAlpha = a
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fill()
  } else if (anim === 'drops') {
    ctx.globalAlpha = a * 0.9
    ctx.beginPath()
    ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2)
    ctx.fill()
    p.waves.forEach((w) => {
      if (w.r <= 0) return
      const ringA = a * (1 - w.r / w.maxR) * 0.85
      if (ringA <= 0) return
      ctx.globalAlpha = ringA
      ctx.lineWidth = 1.4 * (1 - w.r / w.maxR) + 0.4
      ctx.beginPath()
      ctx.arc(p.x, p.y, w.r, 0, Math.PI * 2)
      ctx.stroke()
    })
  } else if (anim === 'pulses') {
    ctx.globalAlpha = a
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.stroke()
  } else if (anim === 'pencil') {
    const progress = p.life / p.maxLife
    const drawLen = progress < 0.3 ? p.len * (progress / 0.3) : p.len
    ctx.globalAlpha = a * 0.8
    ctx.lineWidth = p.sw
    ctx.lineCap = 'round'
    const x2 = p.x + Math.cos(p.angle) * drawLen
    const y2 = p.y + Math.sin(p.angle) * drawLen
    const mx = (p.x + x2) / 2 + Math.cos(p.angle + Math.PI / 2) * p.len * p.curve
    const my = (p.y + y2) / 2 + Math.sin(p.angle + Math.PI / 2) * p.len * p.curve
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
    ctx.quadraticCurveTo(mx, my, x2, y2)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

function updateParticle(p, anim, W, H, speed) {
  p.life += speed
  if (anim === 'fireflies') {
    p.vx += Math.sin(p.life * p.amp + p.phase) * 0.018 * speed
    p.vx = Math.max(-0.9, Math.min(0.9, p.vx))
    p.x += p.vx * speed
    p.y += p.vy * speed
  } else if (anim === 'leaves') {
    p.x += p.vx * speed
    p.y += p.vy * speed
    p.rot += p.rspd * speed
    p.vx += (Math.random() - 0.5) * 0.08 * speed
  } else if (anim === 'geometry') {
    p.x += p.vx * speed
    p.y += p.vy * speed
    p.rot += p.rspd * speed
  } else if (anim === 'waves') {
    p.x += p.vx * speed
    p.y += Math.sin(p.x * 0.02 + p.phase) * p.amp * 0.04 * speed
  } else if (anim === 'drops') {
    p.waves.forEach((w) => {
      if (p.life > w.delay) w.r = Math.min(w.r + p.vr * speed, w.maxR)
    })
  } else if (anim === 'pulses') {
    p.r = Math.min(p.r + p.vr * speed, p.maxR)
  } else if (anim === 'pencil') {
    p.x += p.vx * speed
    p.y += p.vy * speed
  }
}

function isDead(p, W, H, anim) {
  if (p.life >= p.maxLife) return true
  if (anim === 'leaves' && p.y > H + 30) return true
  if (anim === 'waves' && p.x > W + 10) return true
  if (anim === 'drops' && p.waves.every((w) => w.r >= w.maxR)) return true
  if (anim === 'pulses' && p.r >= p.maxR) return true
  return false
}

export default function ThemeAnimation({ T, animType, animSpeed }) {
  const canvasRef = useRef()
  const frameRef = useRef()
  const ptcRef = useRef([])
  const speedRef = useRef(animSpeed)
  const anim = animType || T.anim || 'fireflies'

  useEffect(() => {
    speedRef.current = animSpeed
  }, [animSpeed])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let W = window.innerWidth
    let H = window.innerHeight
    canvas.width = W
    canvas.height = H
    const N = anim === 'drops' || anim === 'pulses' ? 8 : anim === 'pencil' ? 14 : 20
    ptcRef.current = Array.from({ length: N }, () => {
      const p = mkParticle(W, H, anim, T)
      p.life = Math.floor(Math.random() * p.maxLife)
      return p
    })

    const tick = () => {
      ctx.clearRect(0, 0, W, H)
      ptcRef.current.forEach((p, i) => {
        updateParticle(p, anim, W, H, speedRef.current)
        drawParticle(ctx, p, anim)
        if (isDead(p, W, H, anim)) {
          const np = mkParticle(W, H, anim, T)
          if (anim === 'waves') np.x = -10
          ptcRef.current[i] = np
        }
      })
      frameRef.current = requestAnimationFrame(tick)
    }
    tick()

    const onResize = () => {
      W = window.innerWidth
      H = window.innerHeight
      canvas.width = W
      canvas.height = H
      ptcRef.current = Array.from({ length: N }, () => mkParticle(W, H, anim, T))
    }
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(frameRef.current)
      window.removeEventListener('resize', onResize)
    }
  }, [T.id, T.accent, T.a2, T.a3, anim, animType])

  return (
    <canvas
      ref={canvasRef}
      className="forma-app-animation"
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
        opacity: GLOBAL_ANIM_OPACITY,
      }}
    />
  )
}
