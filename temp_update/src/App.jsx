// src/App.jsx
import { useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import useAppStore from '@/stores/useAppStore'
import LibraryPage from '@/pages/LibraryPage'
import EditorPage from '@/pages/EditorPage'
import AuthPage from '@/pages/AuthPage'
import MoodboardPage from '@/pages/MoodboardPage'
import Notifications from '@/components/Notifications'
import { BACKGROUNDS } from '@/lib/backgrounds'

const SYSTEM_FONTS = "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"

/* ── Particle helpers ──────────────────────────────────────── */
function mkParticle(W, H, anim, T) {
  // For fireflies pick from theme palette; others use accent
  const palette = [T.accent, T.a2, T.a3].filter(Boolean)
  const color = anim === 'fireflies'
    ? palette[Math.floor(Math.random() * palette.length)]
    : T.accent

  const base = { x: Math.random()*W, y: Math.random()*H, life:0, maxLife:120+Math.random()*180, color }

  if (anim === 'fireflies') {
    const shapes = ['circle','circle','circle','star','cross'] // weighted toward circle
    return { ...base,
      vx: (Math.random()-.5)*.4, vy: -(Math.random()*.5+.15),
      r: Math.random()*2.8+1,
      shape: shapes[Math.floor(Math.random()*shapes.length)],
      phase: Math.random()*Math.PI*2, amp: Math.random()*.25+.08,
    }
  }
  if (anim === 'leaves')
    return { ...base, x:Math.random()*W, y:-20, vx:(Math.random()-.5)*1.2, vy:Math.random()*.8+.4, rot:Math.random()*360, rspd:(Math.random()-.5)*2, r:Math.random()*5+3 }
  if (anim === 'sparkles')
    return { ...base, x:Math.random()*W, y:Math.random()*H, life:0, maxLife:60+Math.random()*80, r:Math.random()*2.5+1 }
  if (anim === 'geometry')
    return { ...base, vx:(Math.random()-.5)*.3, vy:(Math.random()-.5)*.3, rot:Math.random()*360, rspd:(Math.random()-.5)*.5, size:Math.random()*18+8, shape:['tri','sq','hex'][Math.floor(Math.random()*3)] }
  if (anim === 'waves')
    return { ...base, y:Math.random()*H, vy:0, vx:Math.random()*.6+.2, phase:Math.random()*Math.PI*2, amp:Math.random()*18+8, r:Math.random()*2+1 }

  if (anim === 'drops') {
    const baseR = Math.random()*18+8
    return { ...base, maxLife:100+Math.random()*60,
      waves: [{delay:0,r:0,maxR:baseR},{delay:10,r:0,maxR:baseR*1.8},{delay:22,r:0,maxR:baseR*2.8}],
      vr: Math.random()*.45+.3 }
  }
  if (anim === 'pulses')
    return { ...base, r:0, maxR:Math.random()*60+30, vr:Math.random()*.4+.15 }

  if (anim === 'pencil') {
    const angle = (Math.random()-.5)*Math.PI*.7 + Math.PI*(Math.random() < .4 ? .5 : 0) // mostly h+diagonal
    return { ...base,
      angle, len: Math.random()*80+20,
      curve: (Math.random()-.5)*.28,
      sw: Math.random()*1.4+.25,
      maxLife: 160+Math.random()*120,
      vx:(Math.random()-.5)*.04, vy:(Math.random()-.5)*.04,
    }
  }
  return base
}

function drawParticle(ctx, p, anim) {
  const a = Math.sin((p.life/p.maxLife)*Math.PI) * 0.35
  if (a <= 0) return
  ctx.fillStyle = p.color
  ctx.strokeStyle = p.color

  if (anim === 'fireflies') {
    ctx.globalAlpha = a
    if (p.shape === 'circle') {
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill()
      ctx.globalAlpha = a*.22; ctx.beginPath(); ctx.arc(p.x, p.y, p.r*3.8, 0, Math.PI*2); ctx.fill()
    } else if (p.shape === 'star') {
      ctx.save(); ctx.translate(p.x, p.y); ctx.globalAlpha = a
      ctx.lineWidth = p.r*.55; ctx.lineCap = 'round'
      for (let i=0;i<5;i++) {
        const ang = (i*Math.PI*2/5)-Math.PI/2
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(ang)*p.r*2.6, Math.sin(ang)*p.r*2.6); ctx.stroke()
      }
      ctx.restore()
    } else if (p.shape === 'cross') {
      ctx.save(); ctx.translate(p.x, p.y); ctx.globalAlpha = a
      ctx.lineWidth = p.r*.6; ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(-p.r*2.2,0); ctx.lineTo(p.r*2.2,0); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0,-p.r*2.2); ctx.lineTo(0,p.r*2.2); ctx.stroke()
      ctx.restore()
    }
  } else if (anim === 'leaves') {
    ctx.globalAlpha = a
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot*Math.PI/180)
    ctx.beginPath(); ctx.ellipse(0, 0, p.r*1.6, p.r*.8, 0, 0, Math.PI*2); ctx.fill()
    ctx.restore()
  } else if (anim === 'sparkles') {
    ctx.globalAlpha = a
    const s = p.r; ctx.save(); ctx.translate(p.x, p.y)
    for (let i=0;i<4;i++) { ctx.rotate(Math.PI/4); ctx.beginPath(); ctx.moveTo(0,-s*2.2); ctx.lineTo(0,-s*.5); ctx.lineWidth=s*.5; ctx.stroke() }
    ctx.restore()
  } else if (anim === 'geometry') {
    ctx.globalAlpha = a
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot*Math.PI/180)
    ctx.lineWidth = 1.2; ctx.beginPath()
    if (p.shape==='tri') { const h=p.size*.866; ctx.moveTo(0,-h*.67); ctx.lineTo(p.size/2,h*.33); ctx.lineTo(-p.size/2,h*.33); ctx.closePath(); ctx.stroke() }
    else if (p.shape==='sq') { ctx.strokeRect(-p.size/2,-p.size/2,p.size,p.size) }
    else { for(let i=0;i<6;i++){const a2=i*Math.PI/3;ctx.lineTo(p.size*Math.cos(a2),p.size*Math.sin(a2))};ctx.closePath();ctx.stroke() }
    ctx.restore()
  } else if (anim === 'waves') {
    ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill()
  } else if (anim === 'drops') {
    // Center dot
    ctx.globalAlpha = a * .9; ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, Math.PI*2); ctx.fill()
    // Ripple rings — each fades as it expands
    p.waves.forEach(w => {
      if (w.r <= 0) return
      const ringA = a * (1 - w.r/w.maxR) * 0.85
      if (ringA <= 0) return
      ctx.globalAlpha = ringA
      ctx.lineWidth = 1.4 * (1 - w.r/w.maxR) + .4
      ctx.beginPath(); ctx.arc(p.x, p.y, w.r, 0, Math.PI*2); ctx.stroke()
    })
  } else if (anim === 'pulses') {
    ctx.globalAlpha = a; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.stroke()
  } else if (anim === 'pencil') {
    // Draw-in effect: stroke grows during first 30% of life
    const progress = p.life / p.maxLife
    const drawLen = progress < .3 ? p.len * (progress/.3) : p.len
    ctx.globalAlpha = a * .8
    ctx.lineWidth = p.sw; ctx.lineCap = 'round'
    const x2 = p.x + Math.cos(p.angle)*drawLen
    const y2 = p.y + Math.sin(p.angle)*drawLen
    const mx = (p.x+x2)/2 + Math.cos(p.angle+Math.PI/2)*p.len*p.curve
    const my = (p.y+y2)/2 + Math.sin(p.angle+Math.PI/2)*p.len*p.curve
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.quadraticCurveTo(mx, my, x2, y2); ctx.stroke()
  }
  ctx.globalAlpha = 1
}

function updateParticle(p, anim, W, H, speed) {
  p.life += speed
  if (anim === 'fireflies') {
    // Sine-wave horizontal drift for organic movement
    p.vx += Math.sin(p.life*p.amp + p.phase) * .018 * speed
    p.vx = Math.max(-.9, Math.min(.9, p.vx))
    p.x += p.vx*speed; p.y += p.vy*speed
  }
  else if (anim === 'leaves')   { p.x+=p.vx*speed; p.y+=p.vy*speed; p.rot+=p.rspd*speed; p.vx+=(Math.random()-.5)*.08*speed }
  else if (anim === 'sparkles') { /* static */ }
  else if (anim === 'geometry') { p.x+=p.vx*speed; p.y+=p.vy*speed; p.rot+=p.rspd*speed }
  else if (anim === 'waves')    { p.x+=p.vx*speed; p.y+=Math.sin(p.x*.02+p.phase)*p.amp*.04*speed }
  else if (anim === 'drops')    { p.waves.forEach(w => { if (p.life > w.delay) w.r = Math.min(w.r+p.vr*speed, w.maxR) }) }
  else if (anim === 'pulses')   { p.r = Math.min(p.r+p.vr*speed, p.maxR) }
  else if (anim === 'pencil')   { p.x+=p.vx*speed; p.y+=p.vy*speed }
}

function isDead(p, W, H, anim) {
  if (p.life >= p.maxLife) return true
  if (anim === 'leaves'  && p.y > H+30) return true
  if (anim === 'waves'   && p.x > W+10) return true
  if (anim === 'drops'   && p.waves.every(w => w.r >= w.maxR)) return true
  if (anim === 'pulses'  && p.r >= p.maxR) return true
  return false
}

function ThemeAnimation({ T, animType, animSpeed }) {
  const canvasRef = useRef()
  const frameRef  = useRef()
  const ptcRef    = useRef([])
  const speedRef  = useRef(animSpeed)
  const anim = animType || T.anim || 'fireflies'

  useEffect(() => { speedRef.current = animSpeed }, [animSpeed])

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    let W = window.innerWidth, H = window.innerHeight
    canvas.width = W; canvas.height = H
    const N = anim==='drops'||anim==='pulses' ? 8 : anim==='pencil' ? 14 : 20
    ptcRef.current = Array.from({length:N}, () => {
      const p = mkParticle(W, H, anim, T)
      p.life = Math.floor(Math.random()*p.maxLife)
      return p
    })

    const tick = () => {
      ctx.clearRect(0,0,W,H)
      ptcRef.current.forEach((p,i) => {
        updateParticle(p, anim, W, H, speedRef.current)
        drawParticle(ctx, p, anim)
        if (isDead(p, W, H, anim)) {
          const np = mkParticle(W, H, anim, T)
          if (anim==='waves') np.x = -10
          ptcRef.current[i] = np
        }
      })
      frameRef.current = requestAnimationFrame(tick)
    }
    tick()

    const onResize = () => {
      W=window.innerWidth; H=window.innerHeight
      canvas.width=W; canvas.height=H
      ptcRef.current = Array.from({length:N}, () => mkParticle(W, H, anim, T))
    }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(frameRef.current); window.removeEventListener('resize', onResize) }
  }, [T.id, anim])

  return <canvas ref={canvasRef} style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:1, opacity:.55 }}/>
}

function ProtectedRoute({ children }) {
  const { loading } = useAuth()
  if (loading) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:'#888' }}>
      Chargement…
    </div>
  )
  return children
}

export default function App() {
  const { getTheme, animationsEnabled, animType, animSpeed, bgId, customBg } = useAppStore()
  const T = getTheme()
  const bg = bgId ? BACKGROUNDS.find(b => b.id === bgId) : null

  useEffect(() => {
    if (!document.getElementById('forma-system-fonts')) {
      const link = document.createElement('link')
      link.id = 'forma-system-fonts'; link.href = SYSTEM_FONTS; link.rel = 'stylesheet'
      document.head.appendChild(link)
    }
    let themeLink = document.getElementById('forma-theme-font')
    if (!themeLink) {
      themeLink = document.createElement('link')
      themeLink.id = 'forma-theme-font'; themeLink.rel = 'stylesheet'
      document.head.appendChild(themeLink)
    }
    themeLink.href = `https://fonts.googleapis.com/css2?family=${T.fontUrl}&display=swap`

    let style = document.getElementById('forma-global-style')
    if (!style) {
      style = document.createElement('style')
      style.id = 'forma-global-style'
      document.head.appendChild(style)
    }
    style.textContent = `
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html, body { height: 100%; overflow: hidden; }
      body { font-family: '${T.font}', sans-serif; -webkit-font-smoothing: antialiased; background: ${T.bg}; color: ${T.ink}; }
      :root { --accent: ${T.accent}; }
      #root { height: 100%; }
      button, input, select, textarea { font-family: '${T.font}', sans-serif; }
      ::-webkit-scrollbar { width: 5px; height: 5px; }
      ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 3px; }
      ::-webkit-scrollbar-track { background: transparent; }
      @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }
      .fade-up { animation: fadeUp .28s ease forwards; }
    `
  }, [T.bg, T.ink, T.border, T.fontUrl, T.font])

  return (
    <BrowserRouter>
      {customBg ? (
        <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, opacity:.1, overflow:'hidden' }}>
          <img src={customBg} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
        </div>
      ) : bg ? (
        <div
          style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, opacity:.1, color:T.accent, overflow:'hidden' }}
          dangerouslySetInnerHTML={{ __html: bg.svg.replace('<svg ', '<svg style="width:100%;height:100%;position:absolute;top:0;left:0;" preserveAspectRatio="xMidYMid slice" ') }}
        />
      ) : null}
      {animationsEnabled && <ThemeAnimation T={T} animType={animType} animSpeed={animSpeed} />}
      <Notifications />
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/" element={<ProtectedRoute><LibraryPage /></ProtectedRoute>} />
        <Route path="/editor/:id" element={<ProtectedRoute><EditorPage /></ProtectedRoute>} />
        <Route path="/moodboard" element={<ProtectedRoute><MoodboardPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
