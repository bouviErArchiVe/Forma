// src/App.jsx
import { useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import useAppStore from '@/stores/useAppStore'
import LibraryPage from '@/pages/LibraryPage'
import EditorPage from '@/pages/EditorPage'
import AuthPage from '@/pages/AuthPage'
import Notifications from '@/components/Notifications'

const SYSTEM_FONTS = "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"

/* ── Particle animation per theme ─────────────────────────── */
function mkParticle(W, H, anim, color) {
  const base = { x: Math.random()*W, y: Math.random()*H, life:0, maxLife: 120+Math.random()*180, color }
  if (anim==='fireflies') return {...base, vx:(Math.random()-.5)*.4, vy:-(Math.random()*.5+.15), r:Math.random()*3+1.5}
  if (anim==='leaves')    return {...base, x:Math.random()*W, y:-20, vx:(Math.random()-.5)*1.2, vy:Math.random()*.8+.4, rot:Math.random()*360, rspd:(Math.random()-.5)*2, r:Math.random()*5+3}
  if (anim==='sparkles')  return {...base, x:Math.random()*W, y:Math.random()*H, life:0, maxLife:60+Math.random()*80, r:Math.random()*2.5+1}
  if (anim==='geometry')  return {...base, vx:(Math.random()-.5)*.3, vy:(Math.random()-.5)*.3, rot:Math.random()*360, rspd:(Math.random()-.5)*.5, size:Math.random()*18+8, shape:['tri','sq','hex'][Math.floor(Math.random()*3)]}
  if (anim==='waves')     return {...base, y:Math.random()*H, vy:0, vx:Math.random()*.6+.2, phase:Math.random()*Math.PI*2, amp:Math.random()*18+8, r:Math.random()*2+1}
  if (anim==='drops')     return {...base, r:0, maxR:Math.random()*40+15, vr:Math.random()*.5+.2}
  if (anim==='pulses')    return {...base, r:0, maxR:Math.random()*60+30, vr:Math.random()*.4+.15}
  return base
}

function drawParticle(ctx, p, anim) {
  const a = Math.sin((p.life/p.maxLife)*Math.PI) * 0.35
  if (a <= 0) return
  ctx.globalAlpha = a
  ctx.fillStyle = p.color
  ctx.strokeStyle = p.color
  if (anim==='fireflies') {
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill()
    ctx.globalAlpha = a*.3; ctx.beginPath(); ctx.arc(p.x, p.y, p.r*3, 0, Math.PI*2); ctx.fill()
  } else if (anim==='leaves') {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot*Math.PI/180)
    ctx.beginPath(); ctx.ellipse(0, 0, p.r*1.6, p.r*.8, 0, 0, Math.PI*2); ctx.fill()
    ctx.restore()
  } else if (anim==='sparkles') {
    const s = p.r; ctx.save(); ctx.translate(p.x, p.y)
    for (let i=0;i<4;i++) { ctx.rotate(Math.PI/4); ctx.beginPath(); ctx.moveTo(0,-s*2.2); ctx.lineTo(0,-s*.5); ctx.lineWidth=s*.5; ctx.stroke() }
    ctx.restore()
  } else if (anim==='geometry') {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot*Math.PI/180)
    ctx.lineWidth = 1.2; ctx.beginPath()
    if (p.shape==='tri') { const h=p.size*.866; ctx.moveTo(0,-h*.67); ctx.lineTo(p.size/2,h*.33); ctx.lineTo(-p.size/2,h*.33); ctx.closePath(); ctx.stroke() }
    else if (p.shape==='sq') { ctx.strokeRect(-p.size/2,-p.size/2,p.size,p.size) }
    else { for(let i=0;i<6;i++){const a2=i*Math.PI/3;ctx.lineTo(p.size*Math.cos(a2),p.size*Math.sin(a2))};ctx.closePath();ctx.stroke() }
    ctx.restore()
  } else if (anim==='waves') {
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill()
  } else if (anim==='drops') {
    ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.stroke()
  } else if (anim==='pulses') {
    ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.stroke()
  }
  ctx.globalAlpha = 1
}

function updateParticle(p, anim, W, H) {
  p.life++
  if (anim==='fireflies') { p.x+=p.vx; p.y+=p.vy; p.vx+=(Math.random()-.5)*.05 }
  else if (anim==='leaves') { p.x+=p.vx; p.y+=p.vy; p.rot+=p.rspd; p.vx+=(Math.random()-.5)*.08 }
  else if (anim==='sparkles') { /* static sparkle */ }
  else if (anim==='geometry') { p.x+=p.vx; p.y+=p.vy; p.rot+=p.rspd }
  else if (anim==='waves') { p.x+=p.vx; p.y+=Math.sin(p.x*.02+p.phase)*p.amp*.04 }
  else if (anim==='drops') { p.r = Math.min(p.r+p.vr, p.maxR) }
  else if (anim==='pulses') { p.r = Math.min(p.r+p.vr, p.maxR) }
}

function isDead(p, W, H, anim) {
  if (p.life >= p.maxLife) return true
  if (anim==='leaves' && p.y > H+30) return true
  if (anim==='waves' && p.x > W+10) return true
  if (anim==='drops' && p.r >= p.maxR) return true
  if (anim==='pulses' && p.r >= p.maxR) return true
  return false
}

function ThemeAnimation({ T }) {
  const canvasRef = useRef()
  const frameRef  = useRef()
  const ptcRef    = useRef([])
  const anim = T.anim || 'fireflies'

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    let W = window.innerWidth, H = window.innerHeight
    canvas.width = W; canvas.height = H
    const N = anim==='drops'||anim==='pulses' ? 8 : 20
    ptcRef.current = Array.from({length:N}, () => { const p=mkParticle(W,H,anim,T.accent); p.life=Math.floor(Math.random()*p.maxLife); return p })

    const tick = () => {
      ctx.clearRect(0,0,W,H)
      ptcRef.current.forEach((p,i) => {
        updateParticle(p, anim, W, H)
        drawParticle(ctx, p, anim)
        if (isDead(p, W, H, anim)) {
          const np = mkParticle(W,H,anim,T.accent)
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
      ptcRef.current = Array.from({length:N}, () => mkParticle(W,H,anim,T.accent))
    }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(frameRef.current); window.removeEventListener('resize', onResize) }
  }, [T.id])

  return <canvas ref={canvasRef} style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, opacity:.55 }}/>
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
  const { getTheme, animationsEnabled } = useAppStore()
  const T = getTheme()

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
      {animationsEnabled && <ThemeAnimation T={T} />}
      <Notifications />
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/" element={<ProtectedRoute><LibraryPage /></ProtectedRoute>} />
        <Route path="/editor/:id" element={<ProtectedRoute><EditorPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
