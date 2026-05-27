import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/hooks/useAppearance'
import useMoodboardStore from '@/stores/useMoodboardStore'
import CalculatorDrawer from '@/components/CalculatorDrawer'
import { useCalculator } from '@/hooks/useCalculator'

const EMOJIS = ['🌅','🎨','🏛','🌿','🌊','🔥','💎','🌙','⭐','🎭','🏙','🌸','🦋','🪨','🌈','🎯','📐','✏','🖼','🗺']
const mkId = () => Date.now().toString() + Math.random().toString(36).slice(2,6)

function readFile(file) {
  return new Promise(resolve => {
    const r = new FileReader()
    r.onload = e => {
      const url = e.target.result
      const img = new Image()
      img.onload = () => resolve({ url, nw: img.naturalWidth, nh: img.naturalHeight, name: file.name.replace(/\.[^.]+$/, '') })
      img.src = url
    }
    r.readAsDataURL(file)
  })
}

function loadUrl(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve({ url: src, nw: img.naturalWidth, nh: img.naturalHeight, name: src.split('/').pop().split('?')[0].slice(0,40) || 'image' })
    img.onerror = reject
    img.src = src
  })
}

function GridCard({ img, T, onStar, onDelete, onFullscreen }) {
  const [hov, setHov] = useState(false)
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{borderRadius:10,overflow:'hidden',background:T.surface,border:`1px solid ${T.border}`,position:'relative',marginBottom:10,cursor:'default',boxShadow:hov?`0 6px 24px ${T.accent}22`:'none',transition:'box-shadow .2s'}}>
      <img src={img.url} alt={img.name} style={{width:'100%',display:'block',objectFit:'cover'}}/>
      {img.starred && !hov && <span style={{position:'absolute',top:6,right:7,fontSize:14,color:'#f5a623',textShadow:'0 1px 3px rgba(0,0,0,.4)'}}>★</span>}
      {hov && <>
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(0,0,0,.6) 0%,transparent 50%)',pointerEvents:'none'}}/>
        <div style={{position:'absolute',top:6,right:6,display:'flex',gap:4}}>
          <Btn small onClick={()=>onStar(img.id)} title={img.starred?'Retirer':'Favoris'} T={T}>{img.starred?'★':'☆'}</Btn>
          <Btn small onClick={()=>onFullscreen(img)} title='Agrandir' T={T}>⛶</Btn>
          <Btn small onClick={()=>onDelete(img.id)} title='Supprimer' T={T} danger>✕</Btn>
        </div>
        {(img.name||img.tags?.length>0) && <div style={{position:'absolute',bottom:7,left:8,right:8}}>
          {img.name && <div style={{color:'#fff',fontSize:11,fontWeight:600,marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{img.name}</div>}
          <div style={{display:'flex',flexWrap:'wrap',gap:3}}>
            {img.tags?.slice(0,4).map(t=><span key={t} style={{background:'rgba(255,255,255,.22)',color:'#fff',fontSize:9,padding:'1px 6px',borderRadius:8}}>{t}</span>)}
          </div>
        </div>}
      </>}
    </div>
  )
}

function Btn({ children, onClick, small, danger, T, title, style: sx }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:hov?(danger?'#e53935':T.accent):small?'rgba(0,0,0,.45)':'transparent',color:hov?'#fff':(small?'#fff':T.ink),border:small?'none':`1px solid ${T.border}`,borderRadius:small?6:8,padding:small?'3px 6px':'6px 12px',cursor:'pointer',fontSize:small?11:12,transition:'all .15s',lineHeight:1,...sx}}>
      {children}
    </button>
  )
}

function CanvasImg({ img, selected, T, onSelect, onUpdate, onDelete, onBringToFront }) {
  const dragRef = useRef(null)
  const imgRef = useRef()

  const handleMouseDown = (e, mode) => {
    e.stopPropagation()
    if (!selected) { onSelect(); return }
    onBringToFront()
    const startX = e.clientX, startY = e.clientY
    const ox = img.x, oy = img.y, ow = img.w, oh = img.h, orot = img.rotation
    dragRef.current = { mode, startX, startY, ox, oy, ow, oh, orot }
    const cx = img.x + img.w / 2, cy = img.y + img.h / 2

    const onMove = ev => {
      const dx = ev.clientX - startX, dy = ev.clientY - startY
      const d = dragRef.current
      if (!d) return
      if (d.mode === 'move') {
        onUpdate({ x: d.ox + dx, y: d.oy + dy })
      } else if (d.mode === 'rotate') {
        const angle = Math.atan2(ev.clientY - (cy), ev.clientX - (cx)) * 180 / Math.PI
        onUpdate({ rotation: Math.round(angle + 90) })
      } else {
        let nx = d.ox, ny = d.oy, nw = d.ow, nh = d.oh
        const ratio = d.oh / d.ow
        if (d.mode === 'se') { nw = Math.max(60, d.ow + dx); nh = nw * ratio }
        else if (d.mode === 'sw') { nw = Math.max(60, d.ow - dx); nx = d.ox + d.ow - nw; nh = nw * ratio }
        else if (d.mode === 'ne') { nw = Math.max(60, d.ow + dx); nh = nw * ratio; ny = d.oy + d.oh - nh }
        else if (d.mode === 'nw') { nw = Math.max(60, d.ow - dx); nx = d.ox + d.ow - nw; nh = nw * ratio; ny = d.oy + d.oh - nh }
        onUpdate({ x: nx, y: ny, w: Math.round(nw), h: Math.round(nh) })
      }
    }
    const onUp = () => { dragRef.current = null; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const handles = [['nw',-4,-4,'nw-resize'],['ne',img.w-4,-4,'ne-resize'],['se',img.w-4,img.h-4,'se-resize'],['sw',-4,img.h-4,'sw-resize']]
  return (
    <div ref={imgRef}
      onMouseDown={e => handleMouseDown(e, 'move')}
      style={{position:'absolute',left:img.x,top:img.y,width:img.w,height:img.h,transform:`rotate(${img.rotation}deg)`,zIndex:img.zIndex||1,
        cursor:selected?'move':'pointer',border:selected?`2px solid ${T.accent}`:'2px solid transparent',borderRadius:4,
        boxShadow:selected?`0 0 0 3px ${T.accent}44`:'none',userSelect:'none'}}>
      <img src={img.url} alt={img.name} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:2,display:'block',pointerEvents:'none'}} draggable={false}/>
      {selected && <>
        {handles.map(([m,rx,ry,cur])=>(
          <div key={m} onMouseDown={e=>handleMouseDown(e,m)}
            style={{position:'absolute',left:rx,top:ry,width:8,height:8,background:'#fff',border:`1.5px solid ${T.accent}`,borderRadius:1,cursor:cur,zIndex:2}}/>
        ))}
        <div onMouseDown={e=>handleMouseDown(e,'rotate')}
          style={{position:'absolute',left:'50%',top:-22,transform:'translateX(-50%)',width:12,height:12,background:T.accent,borderRadius:'50%',cursor:'crosshair',zIndex:2,border:'2px solid #fff'}}/>
      </>}
    </div>
  )
}

export default function MoodboardPage() {
  const navigate = useNavigate()
  const { T } = useTheme()
  const { boards, images, addBoard, updateBoard, deleteBoard, archiveBoard, addImage, updateImage, deleteImage, toggleStar, bringToFront } = useMoodboardStore()

  const [collapsed, setCollapsed] = useState(false)
  const [nav, setNav] = useState('all')
  const [activeId, setActiveId] = useState(null)
  const [mode, setMode] = useState('grid')
  const [search, setSearch] = useState('')
  const [selectedImgId, setSelectedImgId] = useState(null)
  const [showNewBoard, setShowNewBoard] = useState(false)
  const [newBoardName, setNewBoardName] = useState('')
  const [newBoardEmoji, setNewBoardEmoji] = useState('🎨')
  const [newBoardColor, setNewBoardColor] = useState('#d4714a')
  const [dragOver, setDragOver] = useState(false)
  const [lightbox, setLightbox] = useState(null)
  const [lbIdx, setLbIdx] = useState(0)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlVal, setUrlVal] = useState('')
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [showCalc, setShowCalc] = useState(false)
  const calc = useCalculator()
  const fileInputRef = useRef()
  const addMenuRef = useRef()
  const sW = collapsed ? 52 : 240

  const activeBoard = boards.find(b => b.id === activeId)
  const boardImages = useCallback((bid) => images.filter(i => i.board_id === bid), [images])

  const visibleBoards = nav === 'archives' ? boards.filter(b => b.archived) : boards.filter(b => !b.archived)

  const displayImages = (() => {
    if (!activeId && nav === 'starred') return images.filter(i => i.starred)
    if (!activeId && nav === 'archives') return []
    if (!activeId) return []
    let imgs = boardImages(activeId)
    if (search) imgs = imgs.filter(i => i.name?.toLowerCase().includes(search.toLowerCase()) || i.tags?.some(t => t.toLowerCase().includes(search.toLowerCase())))
    return imgs
  })()

  const selectedImg = images.find(i => i.id === selectedImgId)

  useEffect(() => {
    const handler = e => {
      if (e.key === 'Escape') { setSelectedImgId(null); setShowNewBoard(false); setLightbox(null); setShowAddMenu(false) }
      if (e.key === 'Delete' && selectedImgId && mode === 'canvas') deleteImage(selectedImgId) && setSelectedImgId(null)
      if (lightbox) {
        if (e.key === 'ArrowRight') setLbIdx(i => Math.min(i+1, displayImages.length-1))
        if (e.key === 'ArrowLeft') setLbIdx(i => Math.max(i-1, 0))
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedImgId, mode, lightbox, displayImages.length])

  useEffect(() => {
    const handler = e => { if (addMenuRef.current && !addMenuRef.current.contains(e.target)) setShowAddMenu(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleFiles = async (files) => {
    if (!activeId) return
    for (const f of Array.from(files)) {
      if (!f.type.startsWith('image/')) continue
      const { url, nw, nh, name } = await readFile(f)
      const w = 260, h = Math.round(nh / nw * w)
      const existingCount = boardImages(activeId).length
      addImage(activeId, { id: mkId(), url, name, w, h, x: 40 + (existingCount % 4) * 20, y: 40 + (existingCount % 4) * 20 })
    }
  }

  const handleUrlImport = async () => {
    if (!urlVal || !activeId) return
    try {
      const { url, nw, nh, name } = await loadUrl(urlVal)
      const w = 260, h = Math.round(nh / nw * w)
      addImage(activeId, { id: mkId(), url, name, w, h })
      setUrlVal(''); setShowUrlInput(false)
    } catch { alert('Impossible de charger cette image') }
  }

  const createBoard = () => {
    if (!newBoardName.trim()) return
    const b = addBoard(newBoardName.trim(), newBoardEmoji, newBoardColor)
    setActiveId(b.id); setNav('all'); setShowNewBoard(false); setNewBoardName('')
  }

  const openLightbox = (img) => {
    const idx = displayImages.findIndex(i => i.id === img.id)
    setLbIdx(idx >= 0 ? idx : 0); setLightbox(true)
  }

  const SB = { background: T.surface, borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', width: sW, minWidth: sW, height: '100vh', overflow: 'hidden', transition: 'width .2s,min-width .2s', zIndex: 10, flexShrink: 0 }

  const navItems = [
    { id: 'all', icon: '📚', label: 'Tous les boards' },
    { id: 'starred', icon: '⭐', label: 'Favoris' },
    { id: 'archives', icon: '🗃', label: 'Archives' },
  ]

  const cols = [0, 1, 2].map(col => displayImages.filter((_, i) => i % 3 === col))

  return (
    <div className="forma-page-shell" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      <CalculatorDrawer
        T={T}
        open={showCalc}
        onClose={() => setShowCalc(false)}
        stackOffset={0}
        scale="1:50"
        {...calc}
      />

      {/* SIDEBAR */}
      <div style={SB}>
        <div style={{ padding: collapsed ? '14px 10px' : '14px 12px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button onClick={() => navigate('/')} title='Retour' style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: T.muted, padding: '2px 4px', borderRadius: 6, lineHeight: 1, flexShrink: 0 }}>←</button>
          {!collapsed && <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15, color: T.ink, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Moodboard</span>}
          <button onClick={() => setCollapsed(c => !c)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: T.muted, padding: '2px 4px', borderRadius: 6, lineHeight: 1, flexShrink: 0, marginLeft: 'auto' }}>{collapsed ? '»' : '«'}</button>
        </div>

        <div style={{ padding: collapsed ? '8px 6px' : '8px 8px', display: 'flex', flexDirection: 'column', gap: 2, borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setNav(item.id); if (item.id !== 'all') setActiveId(null) }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: collapsed ? '7px 0' : '7px 9px', justifyContent: collapsed ? 'center' : 'flex-start', borderRadius: 8, border: 'none', background: nav === item.id ? `${T.accent}18` : 'transparent', color: nav === item.id ? T.accent : T.ink, cursor: 'pointer', fontSize: 12, fontWeight: nav === item.id ? 700 : 400, transition: 'all .15s', width: '100%' }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: collapsed ? '6px 4px' : '6px 8px' }}>
          {visibleBoards.map(b => {
            const cnt = boardImages(b.id).length
            const isActive = activeId === b.id
            return (
              <button key={b.id} onClick={() => { setActiveId(b.id); setNav('all') }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: collapsed ? '7px 0' : '7px 8px', justifyContent: collapsed ? 'center' : 'flex-start', borderRadius: 8, border: 'none', background: isActive ? `${T.accent}18` : 'transparent', color: isActive ? T.accent : T.ink, cursor: 'pointer', fontSize: 12, transition: 'all .15s', marginBottom: 1 }}>
                <span style={{ fontSize: 15, flexShrink: 0 }}>{b.emoji}</span>
                {!collapsed && <>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left', fontWeight: isActive ? 700 : 400 }}>{b.name}</span>
                  <span style={{ fontSize: 9, color: T.muted, flexShrink: 0, background: `${T.accent}18`, padding: '1px 5px', borderRadius: 8, fontWeight: 600 }}>{cnt}</span>
                </>}
              </button>
            )
          })}
        </div>

        <div style={{ padding: collapsed ? '8px 6px' : '8px 10px', borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
          <button onClick={() => setShowNewBoard(true)}
            style={{ width: '100%', padding: collapsed ? '8px 0' : '9px 0', borderRadius: 9, border: 'none', background: `linear-gradient(135deg,${T.accent},${T.a2})`, color: '#fff', cursor: 'pointer', fontSize: collapsed ? 16 : 12, fontWeight: 700, transition: 'opacity .15s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '.85'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            {collapsed ? '+' : '+ Nouveau board'}
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* TOOLBAR */}
        <div style={{ height: 56, background: T.surface, borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10, flexShrink: 0, zIndex: 5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '0 0 auto', minWidth: 0, maxWidth: 220 }}>
            {nav === 'starred' && <><span style={{ fontSize: 16 }}>⭐</span><span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Favoris</span></>}
            {nav === 'archives' && <><span style={{ fontSize: 16 }}>🗃</span><span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, color: T.ink }}>Archives</span></>}
            {activeBoard && nav === 'all' && <>
              <span style={{ fontSize: 18 }}>{activeBoard.emoji}</span>
              <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeBoard.name}</span>
              <span style={{ fontSize: 10, color: T.muted, background: `${T.accent}18`, padding: '2px 7px', borderRadius: 8, fontWeight: 600, flexShrink: 0 }}>{displayImages.length}</span>
            </>}
          </div>
          <div style={{ flex: 1 }}/>
          <div style={{ display: 'flex', alignItems: 'center', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '0 10px', gap: 6, height: 34 }}>
            <span style={{ fontSize: 12, color: T.muted }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder='Rechercher…'
              style={{ background: 'none', border: 'none', outline: 'none', fontSize: 12, color: T.ink, width: 160 }}/>
          </div>
          <div style={{ display: 'flex', border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
            {[['grid','⊞ Grille'],['canvas','◈ Canvas']].map(([m, l]) => (
              <button key={m} onClick={() => setMode(m)}
                style={{ padding: '6px 12px', border: 'none', background: mode === m ? `${T.accent}22` : 'transparent', color: mode === m ? T.accent : T.muted, cursor: 'pointer', fontSize: 11, fontWeight: mode === m ? 700 : 400, transition: 'all .15s' }}>{l}</button>
            ))}
          </div>
          <button type="button" onClick={() => setShowCalc(v => !v)} title="Calculatrice"
            style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${showCalc ? T.accent : T.border}`, background: showCalc ? `${T.accent}18` : 'transparent', color: showCalc ? T.accent : T.ink, cursor: 'pointer', fontSize: 14, flexShrink: 0 }}>
            🧮
          </button>
          {activeId && (
            <div ref={addMenuRef} style={{ position: 'relative', flexShrink: 0 }}>
              <button onClick={() => setShowAddMenu(v => !v)}
                style={{ background: `linear-gradient(135deg,${T.accent},${T.a2})`, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 13px', cursor: 'pointer', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                + Ajouter ▾
              </button>
              {showAddMenu && (
                <div style={{ position: 'absolute', right: 0, top: '110%', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden', boxShadow: `0 8px 24px rgba(0,0,0,.12)`, zIndex: 50, minWidth: 180 }}>
                  <button onClick={() => { fileInputRef.current?.click(); setShowAddMenu(false) }}
                    style={{ display: 'block', width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: T.ink, textAlign: 'left' }}
                    onMouseEnter={e => e.currentTarget.style.background = `${T.accent}11`} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    📁 Importer des fichiers
                  </button>
                  <button onClick={() => { setShowUrlInput(v => !v); setShowAddMenu(false) }}
                    style={{ display: 'block', width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: T.ink, textAlign: 'left' }}
                    onMouseEnter={e => e.currentTarget.style.background = `${T.accent}11`} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    🔗 Depuis une URL
                  </button>
                </div>
              )}
            </div>
          )}
          <input ref={fileInputRef} type='file' accept='image/*' multiple style={{ display: 'none' }} onChange={e => { handleFiles(e.target.files); e.target.value = '' }}/>
        </div>

        {/* URL BAR */}
        {showUrlInput && activeId && (
          <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '8px 16px', display: 'flex', gap: 8, alignItems: 'center' }}>
            <input value={urlVal} onChange={e => setUrlVal(e.target.value)} placeholder='https://…'
              onKeyDown={e => e.key === 'Enter' && handleUrlImport()}
              style={{ flex: 1, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 7, padding: '6px 10px', fontSize: 12, color: T.ink, outline: 'none' }} autoFocus/>
            <button onClick={handleUrlImport} style={{ background: T.accent, color: '#fff', border: 'none', borderRadius: 7, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>OK</button>
            <button onClick={() => setShowUrlInput(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: T.muted }}>✕</button>
          </div>
        )}

        {/* CONTENT */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', position: 'relative' }}>

          {!activeId && nav !== 'starred' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <span style={{ fontSize: 56 }}>🖼</span>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 20, color: T.ink }}>Crée ton premier board</div>
              <div style={{ fontSize: 13, color: T.muted }}>Rassemble tes références visuelles et inspirations</div>
              <button onClick={() => setShowNewBoard(true)}
                style={{ background: `linear-gradient(135deg,${T.accent},${T.a2})`, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', cursor: 'pointer', fontSize: 13, fontWeight: 700, marginTop: 4 }}>
                + Nouveau board
              </button>
            </div>
          )}

          {activeId && nav === 'all' && mode === 'grid' && (
            <div onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
              style={{ flex: 1, overflowY: 'auto', padding: 16, position: 'relative' }}>
              {dragOver && <div style={{ position: 'absolute', inset: 0, background: `${T.accent}22`, border: `3px dashed ${T.accent}`, borderRadius: 12, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}><span style={{ fontSize: 40 }}>📁</span></div>}
              {displayImages.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', gap: 12 }}>
                  <span style={{ fontSize: 40, opacity: .4 }}>🖼</span>
                  <div style={{ fontSize: 13, color: T.muted }}>Aucune image — importe ou glisse des fichiers ici</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, alignItems: 'start' }}>
                  {[0, 1, 2].map(col => (
                    <div key={col}>
                      {cols[col].map(img => (
                        <GridCard key={img.id} img={img} T={T}
                          onStar={id => toggleStar(id)}
                          onDelete={id => deleteImage(id)}
                          onFullscreen={img => openLightbox(img)}/>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeId && nav === 'all' && mode === 'canvas' && (
            <div onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
              style={{ flex: 1, overflow: 'auto', position: 'relative', cursor: 'default' }}>
              <div onClick={() => setSelectedImgId(null)}
                style={{ width: 3000, height: 2200, position: 'relative',
                  backgroundImage: `radial-gradient(circle, ${T.accent}33 1px, transparent 1px)`,
                  backgroundSize: '28px 28px' }}>
                {dragOver && <div style={{ position: 'absolute', inset: 0, background: `${T.accent}22`, border: `3px dashed ${T.accent}`, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}><span style={{ fontSize: 60 }}>📁</span></div>}
                {displayImages.map(img => (
                  <CanvasImg key={img.id} img={img} T={T}
                    selected={selectedImgId === img.id}
                    onSelect={() => setSelectedImgId(img.id)}
                    onUpdate={upd => updateImage(img.id, upd)}
                    onDelete={() => { deleteImage(img.id); setSelectedImgId(null) }}
                    onBringToFront={() => bringToFront(img.id, activeId)}/>
                ))}
              </div>
            </div>
          )}

          {nav === 'starred' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
              {displayImages.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', gap: 10 }}>
                  <span style={{ fontSize: 40, opacity: .4 }}>⭐</span>
                  <div style={{ fontSize: 13, color: T.muted }}>Aucun favori pour l'instant</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, alignItems: 'start' }}>
                  {[0, 1, 2].map(col => (
                    <div key={col}>
                      {displayImages.filter((_, i) => i % 3 === col).map(img => (
                        <GridCard key={img.id} img={img} T={T}
                          onStar={id => toggleStar(id)}
                          onDelete={id => deleteImage(id)}
                          onFullscreen={img => openLightbox(img)}/>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* RIGHT PANEL */}
          {selectedImg && (
            <div style={{ width: 260, background: T.surface, borderLeft: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
              <div style={{ padding: '10px 12px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12, color: T.muted }}>Détails</span>
                <button onClick={() => setSelectedImgId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: T.muted }}>✕</button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div onClick={() => openLightbox(selectedImg)} style={{ aspectRatio: '4/3', borderRadius: 8, overflow: 'hidden', cursor: 'zoom-in', background: T.bg }}>
                  <img src={selectedImg.url} alt='' style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => toggleStar(selectedImg.id)}
                    style={{ flex: 1, padding: '6px 0', borderRadius: 7, border: `1px solid ${T.border}`, background: selectedImg.starred ? '#f5a623' : 'transparent', color: selectedImg.starred ? '#fff' : T.ink, cursor: 'pointer', fontSize: 13 }}>
                    {selectedImg.starred ? '★ Favori' : '☆ Favoris'}
                  </button>
                  <button onClick={() => { deleteImage(selectedImg.id); setSelectedImgId(null) }}
                    style={{ flex: 1, padding: '6px 0', borderRadius: 7, border: `1px solid ${T.border}`, background: 'transparent', color: '#e53935', cursor: 'pointer', fontSize: 12 }}>
                    ✕ Supprimer
                  </button>
                </div>
                <div>
                  <label style={{ fontSize: 10, color: T.muted, fontWeight: 600, display: 'block', marginBottom: 4 }}>NOM</label>
                  <input value={selectedImg.name || ''} onChange={e => updateImage(selectedImg.id, { name: e.target.value })}
                    style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 7, padding: '6px 8px', fontSize: 12, color: T.ink, outline: 'none', boxSizing: 'border-box' }}/>
                </div>
                <div>
                  <label style={{ fontSize: 10, color: T.muted, fontWeight: 600, display: 'block', marginBottom: 4 }}>TAGS</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 5 }}>
                    {selectedImg.tags?.map(t => (
                      <span key={t} style={{ background: `${T.accent}18`, color: T.accent, fontSize: 10, padding: '2px 7px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 3 }}>
                        {t}<button onClick={() => updateImage(selectedImg.id, { tags: selectedImg.tags.filter(x => x !== t) })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.accent, fontSize: 11, padding: 0, lineHeight: 1 }}>×</button>
                      </span>
                    ))}
                  </div>
                  <TagInput onAdd={tag => { if (tag && !selectedImg.tags?.includes(tag)) updateImage(selectedImg.id, { tags: [...(selectedImg.tags||[]), tag] }) }} T={T}/>
                </div>
                <div>
                  <label style={{ fontSize: 10, color: T.muted, fontWeight: 600, display: 'block', marginBottom: 4 }}>DESCRIPTION</label>
                  <textarea value={selectedImg.description || ''} onChange={e => updateImage(selectedImg.id, { description: e.target.value })} rows={3}
                    style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 7, padding: '6px 8px', fontSize: 11, color: T.ink, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}/>
                </div>
                {mode === 'canvas' && (
                  <div>
                    <label style={{ fontSize: 10, color: T.muted, fontWeight: 600, display: 'block', marginBottom: 6 }}>POSITION & TAILLE</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                      {[['x','X'],['y','Y'],['w','L'],['h','H'],['rotation','°']].map(([k, l]) => (
                        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 9, color: T.muted, width: 10, flexShrink: 0 }}>{l}</span>
                          <input type='number' value={Math.round(selectedImg[k] || 0)} onChange={e => updateImage(selectedImg.id, { [k]: parseFloat(e.target.value) || 0 })}
                            style={{ flex: 1, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 5, padding: '4px 5px', fontSize: 11, color: T.ink, outline: 'none', minWidth: 0 }}/>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* NEW BOARD MODAL */}
      {showNewBoard && (
        <div onClick={e => e.target === e.currentTarget && setShowNewBoard(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: T.surface, borderRadius: 16, padding: 24, width: 360, boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 17, color: T.ink, marginBottom: 18 }}>Nouveau board</div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: T.muted, fontWeight: 600, marginBottom: 6 }}>EMOJI</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {EMOJIS.map(em => (
                  <button key={em} onClick={() => setNewBoardEmoji(em)}
                    style={{ width: 34, height: 34, borderRadius: 8, border: `2px solid ${newBoardEmoji === em ? T.accent : T.border}`, background: newBoardEmoji === em ? `${T.accent}18` : 'transparent', cursor: 'pointer', fontSize: 16 }}>{em}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: T.muted, fontWeight: 600, marginBottom: 6 }}>NOM</div>
              <input value={newBoardName} onChange={e => setNewBoardName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createBoard()}
                placeholder='Mon board…' autoFocus
                style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 10px', fontSize: 13, color: T.ink, outline: 'none', boxSizing: 'border-box' }}/>
            </div>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 10, color: T.muted, fontWeight: 600, marginBottom: 6 }}>COULEUR</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['#d4714a','#e8a070','#3d6b8c','#4a7c59','#8c3d6b','#6b3d8c','#3d8c5c','#c8622a','#1e3058','#388080'].map(c => (
                  <button key={c} onClick={() => setNewBoardColor(c)}
                    style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: `3px solid ${newBoardColor === c ? T.ink : 'transparent'}`, cursor: 'pointer', padding: 0 }}/>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowNewBoard(false)} style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: `1px solid ${T.border}`, background: 'transparent', color: T.muted, cursor: 'pointer', fontSize: 12 }}>Annuler</button>
              <button onClick={createBoard} style={{ flex: 2, padding: '9px 0', borderRadius: 9, border: 'none', background: `linear-gradient(135deg,${T.accent},${T.a2})`, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Créer</button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX */}
      {lightbox && displayImages.length > 0 && (
        <div onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.88)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: 18, right: 22, background: 'none', border: 'none', color: '#fff', fontSize: 26, cursor: 'pointer', zIndex: 2 }}>✕</button>
          {lbIdx > 0 && <button onClick={e => { e.stopPropagation(); setLbIdx(i => i-1) }}
            style={{ position: 'absolute', left: 22, background: 'rgba(255,255,255,.12)', border: 'none', color: '#fff', borderRadius: '50%', width: 42, height: 42, fontSize: 18, cursor: 'pointer', zIndex: 2 }}>‹</button>}
          {lbIdx < displayImages.length-1 && <button onClick={e => { e.stopPropagation(); setLbIdx(i => i+1) }}
            style={{ position: 'absolute', right: 22, background: 'rgba(255,255,255,.12)', border: 'none', color: '#fff', borderRadius: '50%', width: 42, height: 42, fontSize: 18, cursor: 'pointer', zIndex: 2 }}>›</button>}
          <img src={displayImages[lbIdx]?.url} alt='' onClick={e => e.stopPropagation()}
            style={{ maxWidth: '88vw', maxHeight: '78vh', objectFit: 'contain', borderRadius: 8, boxShadow: '0 10px 50px rgba(0,0,0,.5)' }}/>
          <div style={{ marginTop: 14, textAlign: 'center' }}>
            {displayImages[lbIdx]?.name && <div style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{displayImages[lbIdx].name}</div>}
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
              {displayImages[lbIdx]?.tags?.map(t => <span key={t} style={{ background: 'rgba(255,255,255,.18)', color: '#fff', fontSize: 10, padding: '2px 8px', borderRadius: 8 }}>{t}</span>)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TagInput({ onAdd, T }) {
  const [val, setVal] = useState('')
  const submit = () => { if (val.trim()) { onAdd(val.trim()); setVal('') } }
  return (
    <div style={{ display: 'flex', gap: 5 }}>
      <input value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
        placeholder='Ajouter tag…'
        style={{ flex: 1, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 7, padding: '5px 8px', fontSize: 11, color: T.ink, outline: 'none', minWidth: 0 }}/>
      <button onClick={submit} style={{ background: T.accent, color: '#fff', border: 'none', borderRadius: 7, padding: '5px 9px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>OK</button>
    </div>
  )
}
