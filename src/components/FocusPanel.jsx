import { useState, useEffect, useRef } from 'react'

export default function FocusPanel({ T, onClose, spotifyIframeRef }) {
  const [workMin, setWorkMin]   = useState(25)
  const [breakMin, setBreakMin] = useState(5)
  const [sec, setSec]           = useState(25 * 60)
  const [running, setRunning]   = useState(false)
  const [mode, setMode]         = useState('work')
  const [alarmType, setAlarmType] = useState('default')
  const [customAlarm, setCustomAlarm] = useState('')
  const [recording, setRecording] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const timerRef   = useRef(null)
  const mediaRef   = useRef(null)
  const chunksRef  = useRef([])

  useEffect(() => {
    try {
      const s = localStorage.getItem('forma_alarm')
      if (s) { setCustomAlarm(s); setAlarmType('custom') }
    } catch {}
  }, [])

  useEffect(() => {
    if (!running) { clearInterval(timerRef.current); return }
    timerRef.current = setInterval(() => {
      setSec(s => {
        if (s > 1) return s - 1
        clearInterval(timerRef.current)
        setRunning(false)
        playAlarm()
        const next = mode === 'work' ? 'break' : 'work'
        setMode(next)
        setSec((next === 'work' ? workMin : breakMin) * 60)
        return 0
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [running, mode, workMin, breakMin])

  const playAlarm = () => {
    if (alarmType === 'custom' && customAlarm) {
      new Audio(customAlarm).play().catch(() => {})
    } else {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        ;[0, 0.35, 0.7].forEach(t => {
          const osc = ctx.createOscillator()
          const g   = ctx.createGain()
          osc.connect(g); g.connect(ctx.destination)
          osc.frequency.value = 440
          g.gain.setValueAtTime(0.25, ctx.currentTime + t)
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.3)
          osc.start(ctx.currentTime + t)
          osc.stop(ctx.currentTime + t + 0.35)
        })
      } catch {}
    }
  }

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream)
      chunksRef.current = []
      rec.ondataavailable = e => chunksRef.current.push(e.data)
      rec.onstop = () => {
        const reader = new FileReader()
        reader.onload = () => {
          const url = reader.result
          setCustomAlarm(url); setAlarmType('custom')
          try { localStorage.setItem('forma_alarm', url) } catch {}
        }
        reader.readAsDataURL(new Blob(chunksRef.current, { type: 'audio/webm' }))
        stream.getTracks().forEach(t => t.stop())
      }
      rec.start(); mediaRef.current = rec; setRecording(true)
    } catch (e) { alert('Microphone non disponible : ' + e.message) }
  }

  const stopRec = () => { mediaRef.current?.stop(); setRecording(false) }

  const importAudio = e => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const url = reader.result
      setCustomAlarm(url); setAlarmType('custom')
      try { localStorage.setItem('forma_alarm', url) } catch {}
    }
    reader.readAsDataURL(file)
  }

  const toggle = () => {
    if (!running && spotifyIframeRef?.current) {
      // mute Spotify iframe while focusing
      try { spotifyIframeRef.current.style.opacity = '0.3' } catch {}
    }
    if (running && spotifyIframeRef?.current) {
      try { spotifyIframeRef.current.style.opacity = '1' } catch {}
    }
    setRunning(v => !v)
  }

  const reset = () => {
    setRunning(false); setMode('work'); setSec(workMin * 60)
    if (spotifyIframeRef?.current) spotifyIframeRef.current.style.opacity = '1'
  }

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  const total = (mode === 'work' ? workMin : breakMin) * 60
  const pct   = sec / total
  const R = 38, circ = 2 * Math.PI * R

  return (
    <div style={{ position:'fixed', bottom:24, right:24, zIndex:200, background:T.surface, borderRadius:20, padding:20, width:268, boxShadow:`0 12px 44px rgba(0,0,0,.22)`, border:`1px solid ${T.border}` }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div style={{ fontWeight:700, fontSize:13, color:T.ink }}>⚡ Mode Focus</div>
        <div style={{ display:'flex', gap:6 }}>
          <button onClick={() => setShowConfig(v => !v)} title="Configurer" style={{ background:'none', border:'none', cursor:'pointer', color:showConfig?T.accent:T.muted, fontSize:15 }}>⚙</button>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:T.muted, fontSize:18, lineHeight:1 }}>×</button>
        </div>
      </div>

      {/* Mode tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:14, background:T.bg, borderRadius:10, padding:4, border:`1px solid ${T.border}` }}>
        {[['work','⚡ Focus'],['break','☕ Pause']].map(([m,l]) => (
          <button key={m} onClick={() => { setRunning(false); setMode(m); setSec((m==='work'?workMin:breakMin)*60) }}
            style={{ flex:1, padding:'5px 0', borderRadius:7, border:'none', background:mode===m?T.accent:'transparent', color:mode===m?'#fff':T.muted, fontSize:11, fontWeight:600, cursor:'pointer', transition:'all .15s' }}>
            {l}
          </button>
        ))}
      </div>

      {/* Ring + time */}
      <div style={{ position:'relative', display:'flex', justifyContent:'center', alignItems:'center', height:96, marginBottom:14 }}>
        <svg width={96} height={96} style={{ transform:'rotate(-90deg)', position:'absolute' }}>
          <circle cx={48} cy={48} r={R} fill="none" stroke={T.border} strokeWidth={7}/>
          <circle cx={48} cy={48} r={R} fill="none" stroke={T.accent} strokeWidth={7}
            strokeDasharray={circ} strokeDashoffset={circ*(1-pct)} strokeLinecap="round"
            style={{ transition:'stroke-dashoffset .6s ease' }}/>
        </svg>
        <div style={{ textAlign:'center', zIndex:1 }}>
          <div style={{ fontFamily:'monospace', fontSize:26, fontWeight:700, color:T.ink, letterSpacing:2, lineHeight:1 }}>{fmt(sec)}</div>
          <div style={{ fontSize:9, color:T.muted, marginTop:3 }}>{mode==='work'?`${workMin} min focus`:`${breakMin} min pause`}</div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:14 }}>
        <button onClick={toggle}
          style={{ padding:'8px 24px', borderRadius:10, background:running?T.a2:T.accent, border:'none', color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', boxShadow:`0 3px 12px ${T.accent}44`, transition:'all .15s' }}>
          {running ? '⏸' : '▶'}
        </button>
        <button onClick={reset} title="Réinitialiser"
          style={{ padding:'8px 14px', borderRadius:10, background:T.bg, border:`1px solid ${T.border}`, color:T.muted, fontSize:14, cursor:'pointer' }}>↺</button>
        <button onClick={playAlarm} title="Tester l'alarme"
          style={{ padding:'8px 14px', borderRadius:10, background:T.bg, border:`1px solid ${T.border}`, color:T.muted, fontSize:13, cursor:'pointer' }}>🔔</button>
      </div>

      {/* Config */}
      {showConfig && (
        <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:12, display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ display:'flex', gap:8 }}>
            {[['FOCUS (min)', workMin, v => { setWorkMin(v); if(!running&&mode==='work') setSec(v*60) }],
              ['PAUSE (min)', breakMin, v => { setBreakMin(v); if(!running&&mode==='break') setSec(v*60) }]
            ].map(([label, val, setter]) => (
              <div key={label} style={{ flex:1 }}>
                <div style={{ fontSize:9, color:T.muted, marginBottom:3 }}>{label}</div>
                <input type="number" min={1} max={120} value={val}
                  onChange={e => setter(+e.target.value)}
                  style={{ width:'100%', padding:'4px 6px', borderRadius:7, border:`1px solid ${T.border}`, background:T.bg, color:T.ink, fontSize:12, outline:'none' }}/>
              </div>
            ))}
          </div>

          <div>
            <div style={{ fontSize:9, color:T.muted, marginBottom:5 }}>ALARME</div>
            <div style={{ display:'flex', gap:4, marginBottom:6 }}>
              {[['default','🔔 Défaut'],['custom','🎵 Perso']].map(([t,l]) => (
                <button key={t} onClick={() => setAlarmType(t)} disabled={t==='custom'&&!customAlarm}
                  style={{ flex:1, padding:'5px 0', borderRadius:7, border:`1px solid ${alarmType===t&&(t==='default'||customAlarm)?T.accent:T.border}`, background:alarmType===t&&(t==='default'||customAlarm)?`${T.accent}18`:T.bg, color:alarmType===t&&(t==='default'||customAlarm)?T.accent:T.muted, fontSize:10, cursor:'pointer', opacity:t==='custom'&&!customAlarm?.5:1 }}>
                  {l}
                </button>
              ))}
            </div>
            <div style={{ display:'flex', gap:4 }}>
              <button onClick={recording ? stopRec : startRec}
                style={{ flex:1, padding:'5px 0', borderRadius:7, border:`1px solid ${recording?'#e94560':T.border}`, background:recording?'rgba(233,69,96,.1)':T.bg, color:recording?'#e94560':T.muted, fontSize:10, cursor:'pointer', fontWeight:recording?700:400 }}>
                {recording ? '⏹ Stop' : '🎙 Enregistrer'}
              </button>
              <label style={{ flex:1, padding:'5px 0', borderRadius:7, border:`1px solid ${T.border}`, background:T.bg, color:T.muted, fontSize:10, cursor:'pointer', textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center' }}>
                📁 Importer
                <input type="file" accept="audio/*" onChange={importAudio} style={{ display:'none' }}/>
              </label>
            </div>
            {customAlarm && <div style={{ fontSize:9, color:T.accent, marginTop:4 }}>✓ Son personnalisé enregistré</div>}
          </div>
        </div>
      )}
    </div>
  )
}
