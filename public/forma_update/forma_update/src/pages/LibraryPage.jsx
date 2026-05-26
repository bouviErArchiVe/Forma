import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import useAppStore from "@/stores/useAppStore"
import { supabase } from "@/lib/supabase"
import { THEMES } from "@/lib/themes"

const DEFAULT_SUBJECTS=[
  {id:"arch",    l:"Architecture",    c:"#c8622a",e:"🏛",custom:false},
  {id:"struct",  l:"Structure",       c:"#3d6b8c",e:"⚙", custom:false},
  {id:"urbanism",l:"Urbanisme",       c:"#5a7a3d",e:"🏙",custom:false},
  {id:"history", l:"Histoire Archi",  c:"#7c5c3d",e:"📜",custom:false},
  {id:"english", l:"Anglais",         c:"#4a7c59",e:"🇬🇧",custom:false},
  {id:"french",  l:"Français",        c:"#8c3d6b",e:"📖",custom:false},
  {id:"math",    l:"Mathématiques",   c:"#3d5c8c",e:"📐",custom:false},
  {id:"physics", l:"Physique",        c:"#5c3d8c",e:"⚡",custom:false},
  {id:"chemistry",l:"Chimie",         c:"#3d8c5c",e:"🧪",custom:false},
  {id:"compute", l:"Informatique",    c:"#2a6b8c",e:"💻",custom:false},
  {id:"art",     l:"Arts Plastiques", c:"#8c3d3d",e:"🎨",custom:false},
  {id:"music",   l:"Musique",         c:"#6b3d8c",e:"🎵",custom:false},
  {id:"economy", l:"Économie",        c:"#6b8c3d",e:"📊",custom:false},
  {id:"law",     l:"Droit",           c:"#8c6b3d",e:"⚖", custom:false},
  {id:"env",     l:"Environnement",   c:"#2d6a4f",e:"🌱",custom:false},
  {id:"design",  l:"Design",          c:"#6b3d6b",e:"✏", custom:false},
  {id:"geotech", l:"Géotechnique",    c:"#5c7a3d",e:"🪨",custom:false},
  {id:"thermal", l:"Thermique",       c:"#e65100",e:"🌡",custom:false},
  {id:"acoustic",l:"Acoustique",      c:"#0277bd",e:"🔊",custom:false},
  {id:"bim",     l:"BIM / Maquette",  c:"#4527a0",e:"🏗",custom:false},
]

const TEMPLATES=[
  {id:"blank",    l:"Vierge",      i:"□"},
  {id:"lined",    l:"Ligné",       i:"≡"},
  {id:"cornell",  l:"Cornell",     i:"⊢"},
  {id:"dotted",   l:"Pointillés",  i:"⠿"},
  {id:"grid5",    l:"Grille 5mm",  i:"⊞"},
  {id:"grid10",   l:"Grille 10mm", i:"⊞"},
  {id:"plan",     l:"Plan archi",  i:"⊕"},
  {id:"elevation",l:"Élévation",   i:"▭"},
  {id:"section",  l:"Coupe",       i:"⊟"},
  {id:"detail",   l:"Détail",      i:"⊙"},
  {id:"isometric",l:"Isométrique", i:"◇"},
  {id:"math",     l:"Maths",       i:"#"},
  {id:"music",    l:"Portées",     i:"♩"},
  {id:"mindmap",  l:"Carte ment.", i:"🧠"},
]

const EMOJI_LIST=["🏛","⚙","🏙","📜","🇬🇧","📖","📐","⚡","🧪","💻","🎨","🎵","📊","⚖","🌱","✏","🪨","🌡","🔊","🏗","🚀","⭐","🔥","💎","🌊","🌲","🎯","📌","🗺","🔬","🎭","🏆","💡","🎸","🏋","🌍","🔭","📚","🎓","🏠","🌺","🦋","🐉","🌈","☁","🌙","🎪"]
const COLOR_LIST=["#c8622a","#3d6b8c","#4a7c59","#7c5c3d","#8c3d6b","#3d5c8c","#5c3d8c","#3d8c5c","#8c3d3d","#6b3d8c","#6b8c3d","#8c6b3d","#2d6a4f","#e65100","#0277bd","#4527a0","#880e4f","#1a237e","#006064","#33691e","#bf360c","#4a148c","#01579b","#1b5e20","#b71c1c","#f57f17"]

const RECENT_KEY = "archnote_recent"
const saveRecent = (id) => {
  try {
    const r = [id, ...JSON.parse(localStorage.getItem(RECENT_KEY) || "[]").filter(x => x !== id)].slice(0, 5)
    localStorage.setItem(RECENT_KEY, JSON.stringify(r))
  } catch {}
}

function timeAgo(d){const m=Math.floor((Date.now()-new Date(d).getTime())/60000);if(m<1)return"À l'instant";if(m<60)return`Il y a ${m}min`;const h=Math.floor(m/60);if(h<24)return`Il y a ${h}h`;const days=Math.floor(h/24);if(days===1)return"Hier";return new Date(d).toLocaleDateString("fr-FR")}

function CoverPattern({tmpl, color}) {
  const c = color + "28"
  const L = []
  if (tmpl === "lined") {
    for (let y = 22; y < 130; y += 18) L.push(<line key={y} x1={10} y1={y} x2={190} y2={y} stroke={c} strokeWidth={1}/>)
  } else if (["grid5","plan","math","detail"].includes(tmpl)) {
    for (let x = 0; x < 200; x += 20) L.push(<line key={`v${x}`} x1={x} y1={0} x2={x} y2={130} stroke={c} strokeWidth={.7}/>)
    for (let y = 0; y < 130; y += 20) L.push(<line key={`h${y}`} x1={0} y1={y} x2={200} y2={y} stroke={c} strokeWidth={.7}/>)
  } else if (tmpl === "grid10") {
    for (let x = 0; x < 200; x += 30) L.push(<line key={`v${x}`} x1={x} y1={0} x2={x} y2={130} stroke={c} strokeWidth={.7}/>)
    for (let y = 0; y < 130; y += 30) L.push(<line key={`h${y}`} x1={0} y1={y} x2={200} y2={y} stroke={c} strokeWidth={.7}/>)
  } else if (tmpl === "dotted") {
    for (let x = 15; x < 200; x += 22) for (let y = 15; y < 130; y += 22) L.push(<circle key={`${x},${y}`} cx={x} cy={y} r={1.8} fill={c}/>)
  } else if (tmpl === "cornell") {
    L.push(<line key="v" x1={50} y1={10} x2={50} y2={115} stroke={c} strokeWidth={1.2}/>)
    for (let y = 25; y < 115; y += 18) L.push(<line key={y} x1={55} y1={y} x2={190} y2={y} stroke={c} strokeWidth={1}/>)
  } else if (tmpl === "isometric") {
    for (let i = -200; i < 400; i += 28) {
      L.push(<line key={`a${i}`} x1={i} y1={0} x2={i + 130} y2={130} stroke={c} strokeWidth={.6}/>)
      L.push(<line key={`b${i}`} x1={i} y1={0} x2={i - 130} y2={130} stroke={c} strokeWidth={.6}/>)
    }
  } else if (["elevation","section"].includes(tmpl)) {
    for (let x = 0; x < 200; x += 28) L.push(<line key={`v${x}`} x1={x} y1={0} x2={x} y2={130} stroke={c} strokeWidth={.6}/>)
    for (let y = 0; y < 130; y += 28) L.push(<line key={`h${y}`} x1={0} y1={y} x2={200} y2={y} stroke={c} strokeWidth={.6}/>)
    L.push(<rect key="tb" x={10} y={100} width={180} height={22} fill="none" stroke={c} strokeWidth={1}/>)
    L.push(<rect key="b" x={5} y={5} width={190} height={120} fill="none" stroke={c} strokeWidth={1.5}/>)
  } else if (tmpl === "mindmap") {
    L.push(<circle key="c" cx={100} cy={65} r={22} fill="none" stroke={c} strokeWidth={2}/>)
    ;[[40,22],[160,22],[180,65],[155,108],[45,108],[20,65]].forEach(([x,y],i) => {
      L.push(<line key={`b${i}`} x1={100} y1={65} x2={x} y2={y} stroke={c} strokeWidth={1}/>)
      L.push(<circle key={`n${i}`} cx={x} cy={y} r={11} fill="none" stroke={c} strokeWidth={1.2}/>)
    })
  } else if (tmpl === "music") {
    for (let y = 20; y < 110; y += 38) for (let s = 0; s < 5; s++) L.push(<line key={`m${y}${s}`} x1={15} y1={y + s * 6} x2={185} y2={y + s * 6} stroke={c} strokeWidth={.9}/>)
  }
  return (
    <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}} viewBox="0 0 200 130" preserveAspectRatio="xMidYMid slice">
      {L}
    </svg>
  )
}

function StatChip({e, v, l, tab, activeTab, setActiveTab, T}) {
  const isActive = tab && activeTab === tab
  return (
    <div
      onClick={() => tab && setActiveTab(tab)}
      style={{
        padding:"6px 14px",
        borderRadius:20,
        background: isActive ? `${T.accent}18` : T.surface,
        border:`1px solid ${isActive ? T.accent : T.border}`,
        display:"flex",alignItems:"center",gap:6,
        cursor: tab ? "pointer" : "default",
        transition:"all .15s",
        userSelect:"none"
      }}
      onMouseEnter={e2 => { if (tab) e2.currentTarget.style.borderColor = T.accent + "66" }}
      onMouseLeave={e2 => { if (tab) e2.currentTarget.style.borderColor = isActive ? T.accent : T.border }}
    >
      <span style={{fontSize:13}}>{e}</span>
      <span style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:14,color:isActive?T.accent:T.ink,lineHeight:1}}>{v}</span>
      <span style={{fontSize:10,color:T.muted,lineHeight:1}}>{l}</span>
    </div>
  )
}

function ThemePicker({current, onChange, onClose}) {
  const isDark = current && (current.bg < "#888")
  const modalBg = isDark ? "#111" : "#fff"
  const modalInk = isDark ? "#e8e8f0" : "#1c1c24"
  const modalMuted = isDark ? "#666" : "#888"
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}}>
      <div style={{background:modalBg,borderRadius:20,padding:22,width:580,maxWidth:"94vw",maxHeight:"84vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.4)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:19,color:modalInk}}>Thèmes ({THEMES.length})</div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:22,color:modalMuted}}>×</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:9}}>
          {THEMES.map(th => (
            <button key={th.id} onClick={() => {onChange(th); onClose()}}
              style={{padding:0,border:`2px solid ${current?.id===th.id?"#c8622a":"rgba(128,128,128,.25)"}`,borderRadius:13,overflow:"hidden",cursor:"pointer",background:"none",transition:"all .15s"}}
              onMouseEnter={e => e.currentTarget.style.transform="scale(1.02)"}
              onMouseLeave={e => e.currentTarget.style.transform="none"}>
              <div style={{height:80,background:`linear-gradient(135deg,${th.panel},${th.surface})`,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
                {th.img
                  ? <img src={th.img} alt={th.n} style={{width:64,height:64,borderRadius:10,objectFit:"cover",boxShadow:"0 2px 10px rgba(0,0,0,.3)"}}/>
                  : <span style={{fontSize:28}}>{th.e}</span>
                }
                <div style={{position:"absolute",bottom:4,right:6,fontSize:9,color:th.surface+"cc",fontFamily:"'Syne',sans-serif",fontWeight:700}}>{th.n}</div>
              </div>
              <div style={{padding:"5px 10px",background:th.bg,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",gap:3}}>{[th.accent,th.a2,th.a3].map((c,i)=><div key={i} style={{width:10,height:10,borderRadius:3,background:c}}/>)}</div>
                {current?.id===th.id&&<div style={{fontSize:9,color:th.accent,fontWeight:700}}>✓ Actif</div>}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function LibraryPage() {
  const navigate = useNavigate()
  const {getTheme, setTheme, setActiveNotebook} = useAppStore()
  const [localTheme, setLocalTheme] = useState(null)
  const T = localTheme || getTheme()

  const [notebooks, setNotebooks] = useState([])
  const [folders, setFolders] = useState([])
  const [subjects, setSubjects] = useState(DEFAULT_SUBJECTS)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [subjFilt, setSubjFilt] = useState("all")
  const [folderFilt, setFolderFilt] = useState("all")
  const [activeTab, setActiveTab] = useState("notebooks")
  const [userId, setUserId] = useState(null)
  const [userName, setUserName] = useState("")
  const [showTheme, setShowTheme] = useState(false)
  const [recentIds, setRecentIds] = useState([])

  // Modals
  const [showNew, setShowNew] = useState(false)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [showNewSubject, setShowNewSubject] = useState(false)
  const [showFolderAssign, setShowFolderAssign] = useState(null)

  // New notebook
  const [newTitle, setNewTitle] = useState("")
  const [newSubj, setNewSubj] = useState("arch")
  const [newTmpl, setNewTmpl] = useState("plan")
  const [newFolder, setNewFolder] = useState("none")
  const [saving, setSaving] = useState(false)

  // New folder
  const [folderName, setFolderName] = useState("")
  const [folderEmoji, setFolderEmoji] = useState("📁")

  // New subject
  const [subjName, setSubjName] = useState("")
  const [subjEmoji, setSubjEmoji] = useState("⭐")
  const [subjColor, setSubjColor] = useState("#c8622a")

  useEffect(() => {
    const init = async () => {
      try {
        const {data:{session}} = await supabase.auth.getSession()
        if (session?.user) {
          setUserId(session.user.id)
          setUserName(session.user.user_metadata?.full_name || session.user.email || "")
          loadNotebooks(session.user.id)
        } else {
          setLoading(false)
        }
      } catch {
        setLoading(false)
      }
    }
    init()
    setRecentIds(JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"))
  }, [])

  const loadNotebooks = async uid => {
    try {
      const {data, error} = await supabase.from("notebooks").select("*").eq("user_id", uid).order("updated_at", {ascending:false})
      if (error) throw error
      setNotebooks(data || [])
    } catch {
      setNotebooks([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => notebooks.filter(n => {
    const ms = n.title.toLowerCase().includes(search.toLowerCase())
    const msj = subjFilt === "all" || n.subject === subjFilt
    const mf = folderFilt === "all" || (folderFilt === "none" ? !n.folder_id : n.folder_id === folderFilt)
    const mstar = activeTab !== "favorites" || n.starred
    return ms && msj && mf && mstar
  }), [notebooks, search, subjFilt, folderFilt, activeTab])

  const open = nb => {
    saveRecent(nb.id)
    setRecentIds(JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"))
    setActiveNotebook(nb)
    navigate(`/editor/${nb.id}`)
  }

  const toggleStar = async (id, e) => {
    e.stopPropagation()
    const nb = notebooks.find(n => n.id === id); if (!nb) return
    setNotebooks(ns => ns.map(n => n.id === id ? {...n, starred:!n.starred} : n))
    if (userId) await supabase.from("notebooks").update({starred:!nb.starred}).eq("id", id)
  }

  const create = async () => {
    if (!newTitle.trim()) return; setSaving(true)
    const subj = subjects.find(s => s.id === newSubj)
    const nb = {title:newTitle, subject:newSubj, template:newTmpl, pages_count:1, starred:false, color:subj?.c||"#c8622a", folder_id:newFolder==="none"?null:newFolder}
    try {
      if (userId) {
        const {data, error} = await supabase.from("notebooks").insert([{...nb, user_id:userId}]).select().single()
        if (error) throw error
        setNotebooks(p => [data, ...p]); setShowNew(false); setNewTitle(""); open(data)
      }
    } catch {
      alert("Erreur lors de la création.")
    } finally {
      setSaving(false)
    }
  }

  const deleteNB = async (id, e) => {
    e.stopPropagation()
    if (!confirm("Supprimer ce carnet définitivement ?")) return
    setNotebooks(ns => ns.filter(n => n.id !== id))
    if (userId) await supabase.from("notebooks").delete().eq("id", id)
  }

  const assignFolder = async (nbId, folderId) => {
    setNotebooks(ns => ns.map(n => n.id === nbId ? {...n, folder_id:folderId||null} : n))
    if (userId) await supabase.from("notebooks").update({folder_id:folderId||null}).eq("id", nbId)
    setShowFolderAssign(null)
  }

  const createFolder = () => {
    if (!folderName.trim()) return
    setFolders(p => [...p, {id:Date.now().toString(), n:folderName, e:folderEmoji}])
    setShowNewFolder(false); setFolderName(""); setFolderEmoji("📁")
  }

  const createSubject = () => {
    if (!subjName.trim()) return
    setSubjects(p => [...p, {id:Date.now().toString(), l:subjName, c:subjColor, e:subjEmoji, custom:true}])
    setShowNewSubject(false); setSubjName(""); setSubjEmoji("⭐"); setSubjColor("#c8622a")
  }

  const changeTheme = th => { setLocalTheme(th); setTheme(th.id) }
  const logout = async () => { await supabase.auth.signOut(); setUserId(null); setUserName(""); setNotebooks([]) }

  const usedSubjects = subjects.filter(s => notebooks.some(n => n.subject === s.id))
  const starredCount = notebooks.filter(n => n.starred).length

  const recentNotebooks = recentIds.map(id => notebooks.find(n => n.id === id)).filter(Boolean).slice(0, 4)

  const avatarLetter = userName ? userName.charAt(0).toUpperCase() : "?"

  return (
    <div style={{minHeight:"100vh", background:T.bg, fontFamily:"'Nunito',sans-serif", color:T.ink}}>
      <style>{`
        @keyframes cardIn { from { opacity:0; transform:translateY(14px) scale(.97); } to { opacity:1; transform:none; } }
        @keyframes shimmer { from { background-position: -200% center; } to { background-position: 200% center; } }
        .nb-card { animation: cardIn .3s cubic-bezier(.2,.8,.2,1) both; transition: transform .22s cubic-bezier(.2,.8,.2,1), box-shadow .22s; }
        .nb-card:hover { transform: translateY(-6px) !important; }
        .nb-btn-action { opacity:0; transition: opacity .15s; }
        .nb-card:hover .nb-btn-action { opacity:1; }
        .star-btn { transition: transform .15s, color .15s; }
        .star-btn:hover { transform: scale(1.3); }
        .nb-card:nth-child(1){animation-delay:0ms} .nb-card:nth-child(2){animation-delay:30ms} .nb-card:nth-child(3){animation-delay:60ms} .nb-card:nth-child(4){animation-delay:90ms} .nb-card:nth-child(5){animation-delay:120ms} .nb-card:nth-child(6){animation-delay:150ms}
      `}</style>

      {showTheme && <ThemePicker current={T} onChange={changeTheme} onClose={() => setShowTheme(false)}/>}

      {/* NEW NOTEBOOK */}
      {showNew && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
          <div style={{background:T.surface,borderRadius:20,padding:26,width:520,maxWidth:"94vw",maxHeight:"88vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.25)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:19,color:T.ink}}>Nouveau carnet</div>
              <button onClick={() => setShowNew(false)} style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:22}}>×</button>
            </div>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:5}}>TITRE</div>
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Ex: Projet École Primaire 2026…"
                onKeyDown={e => e.key === "Enter" && create()} autoFocus
                style={{width:"100%",padding:"10px 12px",borderRadius:10,border:`1px solid ${T.border}`,fontSize:14,outline:"none",color:T.ink,background:T.bg,boxSizing:"border-box"}}/>
            </div>
            {folders.length > 0 && <div style={{marginBottom:14}}>
              <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:5}}>DOSSIER</div>
              <select value={newFolder} onChange={e => setNewFolder(e.target.value)} style={{width:"100%",padding:"8px 10px",borderRadius:10,border:`1px solid ${T.border}`,fontSize:13,background:T.bg,color:T.ink,outline:"none",cursor:"pointer"}}>
                <option value="none">Aucun dossier</option>
                {folders.map(f => <option key={f.id} value={f.id}>{f.e} {f.n}</option>)}
              </select>
            </div>}
            <div style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                <div style={{fontSize:10,fontWeight:700,color:T.muted}}>MATIÈRE ({subjects.length})</div>
                <button onClick={() => {setShowNew(false); setShowNewSubject(true)}} style={{fontSize:9,color:T.accent,background:"none",border:"none",cursor:"pointer"}}>+ Nouvelle matière</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5,maxHeight:180,overflowY:"auto"}}>
                {subjects.map(s => (
                  <button key={s.id} onClick={() => setNewSubj(s.id)}
                    style={{padding:"7px 4px",borderRadius:8,border:`1px solid ${newSubj===s.id?s.c:T.border}`,background:newSubj===s.id?s.c+"18":T.bg,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                    <div style={{fontSize:14}}>{s.e}</div>
                    <div style={{fontSize:8,fontWeight:700,color:newSubj===s.id?s.c:T.muted,textAlign:"center",lineHeight:1.1}}>{s.l}</div>
                  </button>
                ))}
              </div>
            </div>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:5}}>MODÈLE</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5}}>
                {TEMPLATES.map(t => (
                  <button key={t.id} onClick={() => setNewTmpl(t.id)}
                    style={{padding:"8px 4px",borderRadius:8,border:`1px solid ${newTmpl===t.id?T.accent:T.border}`,background:newTmpl===t.id?`${T.accent}10`:T.bg,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                    <div style={{fontSize:15,color:newTmpl===t.id?T.accent:T.muted}}>{t.i}</div>
                    <div style={{fontSize:8,fontWeight:700,color:newTmpl===t.id?T.accent:T.muted,textAlign:"center",lineHeight:1.2}}>{t.l}</div>
                  </button>
                ))}
              </div>
            </div>
            <button onClick={create} disabled={!newTitle.trim() || saving}
              style={{width:"100%",padding:12,borderRadius:11,background:newTitle.trim()?`linear-gradient(135deg,${T.accent},${T.a2})`:T.border,border:"none",color:"#fff",fontWeight:700,fontSize:14,cursor:newTitle.trim()?"pointer":"not-allowed"}}>
              {saving ? "Création..." : "Créer le carnet →"}
            </button>
          </div>
        </div>
      )}

      {/* NEW FOLDER */}
      {showNewFolder && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
          <div style={{background:T.surface,borderRadius:18,padding:24,width:380,maxWidth:"94vw",boxShadow:"0 20px 60px rgba(0,0,0,.25)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:17,color:T.ink}}>📁 Nouveau dossier</div>
              <button onClick={() => setShowNewFolder(false)} style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:20}}>×</button>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:5}}>NOM</div>
              <input value={folderName} onChange={e => setFolderName(e.target.value)} placeholder="Ex: Projet École 2026" autoFocus
                onKeyDown={e => e.key === "Enter" && createFolder()}
                style={{width:"100%",padding:"10px 12px",borderRadius:10,border:`1px solid ${T.border}`,fontSize:14,outline:"none",color:T.ink,background:T.bg,boxSizing:"border-box"}}/>
            </div>
            <div style={{marginBottom:18}}>
              <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:5}}>EMOJI</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                {["📁","📂","🏗","🏛","📐","⚙","🎨","📚","🌿","🔥","⭐","💡","🎯","🏆","🔬","🌍","🏠","🚀","💎","🗂"].map(e => (
                  <button key={e} onClick={() => setFolderEmoji(e)}
                    style={{width:32,height:32,borderRadius:8,background:folderEmoji===e?`${T.accent}18`:T.bg,border:`1px solid ${folderEmoji===e?T.accent:T.border}`,cursor:"pointer",fontSize:16}}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={createFolder} disabled={!folderName.trim()}
              style={{width:"100%",padding:12,borderRadius:11,background:folderName.trim()?T.accent:T.border,border:"none",color:"#fff",fontWeight:700,fontSize:14,cursor:folderName.trim()?"pointer":"not-allowed"}}>
              Créer le dossier →
            </button>
          </div>
        </div>
      )}

      {/* NEW SUBJECT */}
      {showNewSubject && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
          <div style={{background:T.surface,borderRadius:18,padding:24,width:400,maxWidth:"94vw",boxShadow:"0 20px 60px rgba(0,0,0,.25)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:17,color:T.ink}}>✏ Nouvelle matière</div>
              <button onClick={() => setShowNewSubject(false)} style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:20}}>×</button>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:5}}>NOM</div>
              <input value={subjName} onChange={e => setSubjName(e.target.value)} placeholder="Ex: Matière du Caca 💩" autoFocus
                style={{width:"100%",padding:"10px 12px",borderRadius:10,border:`1px solid ${T.border}`,fontSize:14,outline:"none",color:T.ink,background:T.bg,boxSizing:"border-box"}}/>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:5}}>EMOJI</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:3,maxHeight:100,overflowY:"auto"}}>
                {EMOJI_LIST.map(e => (
                  <button key={e} onClick={() => setSubjEmoji(e)}
                    style={{width:30,height:30,borderRadius:7,background:subjEmoji===e?`${T.accent}18`:T.bg,border:`1px solid ${subjEmoji===e?T.accent:T.border}`,cursor:"pointer",fontSize:14}}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:5}}>COULEUR</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                {COLOR_LIST.map(c => (
                  <button key={c} onClick={() => setSubjColor(c)}
                    style={{width:26,height:26,borderRadius:"50%",background:c,border:`2px solid ${subjColor===c?T.ink:"transparent"}`,cursor:"pointer"}}/>
                ))}
              </div>
            </div>
            <div style={{marginBottom:16,padding:12,borderRadius:10,background:`${subjColor}18`,border:`1px solid ${subjColor}44`,display:"flex",alignItems:"center",gap:10}}>
              <div style={{fontSize:22}}>{subjEmoji}</div>
              <div style={{fontWeight:700,color:subjColor,fontSize:13}}>{subjName || "Aperçu de la matière"}</div>
            </div>
            <button onClick={createSubject} disabled={!subjName.trim()}
              style={{width:"100%",padding:12,borderRadius:11,background:subjName.trim()?subjColor:T.border,border:"none",color:"#fff",fontWeight:700,fontSize:14,cursor:subjName.trim()?"pointer":"not-allowed"}}>
              Créer la matière →
            </button>
          </div>
        </div>
      )}

      {/* ASSIGN FOLDER */}
      {showFolderAssign && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
          <div style={{background:T.surface,borderRadius:16,padding:22,width:340,maxWidth:"94vw",boxShadow:"0 20px 60px rgba(0,0,0,.25)"}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:15,color:T.ink,marginBottom:16}}>📁 Assigner à un dossier</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              <button onClick={() => assignFolder(showFolderAssign, null)} style={{padding:"10px 14px",borderRadius:10,background:T.bg,border:`1px solid ${T.border}`,color:T.muted,cursor:"pointer",textAlign:"left",fontSize:13}}>
                ❌ Aucun dossier
              </button>
              {folders.map(f => (
                <button key={f.id} onClick={() => assignFolder(showFolderAssign, f.id)}
                  style={{padding:"10px 14px",borderRadius:10,background:T.bg,border:`1px solid ${T.border}`,color:T.ink,cursor:"pointer",textAlign:"left",fontSize:13,display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:18}}>{f.e}</span>{f.n}
                </button>
              ))}
            </div>
            <button onClick={() => setShowFolderAssign(null)} style={{width:"100%",marginTop:14,padding:10,borderRadius:10,background:T.bg,border:`1px solid ${T.border}`,color:T.muted,cursor:"pointer",fontSize:13}}>Annuler</button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:"0 22px",position:"sticky",top:0,zIndex:20,boxShadow:"0 1px 14px rgba(0,0,0,.07)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",height:62,maxWidth:1400,margin:"0 auto"}}>
          {/* Logo + title */}
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:38,height:38,borderRadius:10,background:`linear-gradient(135deg,${T.accent},${T.a2})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontFamily:"'Syne',sans-serif",fontWeight:800,color:"#fff",letterSpacing:-1,boxShadow:`0 4px 16px ${T.accent}44`,flexShrink:0}}>F</div>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:7}}>
                <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:20,color:T.ink,lineHeight:1}}>Forma</div>
                {userId && notebooks.length > 0 && (
                  <div style={{padding:"2px 7px",borderRadius:20,background:`${T.accent}18`,border:`1px solid ${T.accent}44`,fontSize:10,fontWeight:700,color:T.accent,lineHeight:1.4}}>{notebooks.length}</div>
                )}
              </div>
              <div style={{fontSize:9,color:T.muted,marginTop:1}}>{userId ? `✓ ${userName}` : "Non connecté"}</div>
            </div>
          </div>

          {/* Right actions */}
          <div style={{display:"flex",gap:7,alignItems:"center"}}>
            <button onClick={() => setShowTheme(true)}
              style={{padding:"6px 13px",borderRadius:8,background:T.bg,border:`1px solid ${T.border}`,color:T.muted,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",gap:5}}>
              {T.e || "🎨"} Thème
            </button>
            {userId ? (
              <button onClick={logout} style={{padding:"6px 12px",borderRadius:8,background:"transparent",border:`1px solid ${T.border}`,color:T.muted,fontWeight:600,fontSize:11,cursor:"pointer"}}>Déconnexion</button>
            ) : (
              <button onClick={() => navigate("/auth")} style={{padding:"6px 12px",borderRadius:8,background:"transparent",border:`1px solid ${T.accent}`,color:T.accent,fontWeight:600,fontSize:11,cursor:"pointer"}}>Se connecter</button>
            )}
            {/* User avatar */}
            {userId && (
              <div style={{width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${T.accent},${T.a2})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"#fff",flexShrink:0,boxShadow:`0 2px 8px ${T.accent}44`}}>
                {avatarLetter}
              </div>
            )}
            <button onClick={() => userId ? setShowNew(true) : navigate("/auth")}
              style={{padding:"8px 16px",borderRadius:9,background:`linear-gradient(135deg,${T.accent},${T.a2})`,border:"none",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer",boxShadow:`0 3px 14px ${T.accent}44`,letterSpacing:.2}}>
              + Nouveau
            </button>
          </div>
        </div>
      </div>

      {/* NOT LOGGED IN */}
      {!userId && !loading && (
        <div style={{textAlign:"center",padding:"90px 0"}}>
          <div style={{width:72,height:72,borderRadius:20,background:`linear-gradient(135deg,${T.accent},${T.a2})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,fontFamily:"'Syne',sans-serif",fontWeight:800,color:"#fff",letterSpacing:-2,margin:"0 auto 14px",boxShadow:`0 8px 28px ${T.accent}44`}}>F</div>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:24,color:T.ink,marginBottom:8}}>Bienvenue sur Forma</div>
          <div style={{fontSize:14,color:T.muted,marginBottom:28}}>Le carnet de conception pour architectes & designers</div>
          <button onClick={() => navigate("/auth")} style={{padding:"12px 26px",borderRadius:12,background:`linear-gradient(135deg,${T.accent},${T.a2})`,border:"none",color:"#fff",fontWeight:700,fontSize:15,cursor:"pointer",boxShadow:`0 4px 14px ${T.accent}44`}}>
            Se connecter / Créer un compte
          </button>
        </div>
      )}

      {userId && (
        <div style={{padding:"20px 22px",maxWidth:1400,margin:"0 auto"}}>

          {/* COMPACT STATS BAR */}
          <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
            {[
              {e:"📓", v:notebooks.length,  l:"carnets",     tab:"notebooks"},
              {e:"⭐", v:starredCount,       l:"favoris",     tab:"favorites"},
              {e:"📁", v:folders.length,     l:"dossiers",    tab:"folders"},
              {e:"✏",  v:subjects.length,    l:"matières",    tab:"subjects"},
              {e:"📄", v:notebooks.reduce((s,n) => s + (n.pages_count || 1), 0), l:"pages total", tab:null},
              {e:"📊", v:"",                 l:"tableau",     tab:"dashboard"},
            ].map(s => (
              <StatChip key={s.l} e={s.e} v={s.v} l={s.l} tab={s.tab} activeTab={activeTab} setActiveTab={setActiveTab} T={T}/>
            ))}
          </div>

          {/* DOSSIERS */}
          {activeTab === "folders" && (
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:17,color:T.ink}}>📁 Dossiers de projets</div>
                <button onClick={() => setShowNewFolder(true)} style={{padding:"7px 14px",borderRadius:8,background:`linear-gradient(135deg,${T.accent},${T.a2})`,border:"none",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Nouveau dossier</button>
              </div>
              {folders.length === 0 && (
                <div style={{textAlign:"center",padding:"40px 0",color:T.muted}}>
                  <div style={{fontSize:40,marginBottom:10}}>📁</div>
                  <div style={{fontSize:14,marginBottom:16}}>Aucun dossier pour l'instant</div>
                  <button onClick={() => setShowNewFolder(true)} style={{padding:"10px 20px",borderRadius:10,background:T.accent,border:"none",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>Créer mon premier dossier</button>
                </div>
              )}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:11,marginBottom:24}}>
                <div onClick={() => {setFolderFilt("all"); setActiveTab("notebooks")}}
                  style={{padding:"16px 18px",borderRadius:13,background:T.surface,border:`1px solid ${T.border}`,cursor:"pointer",display:"flex",alignItems:"center",gap:10,transition:"all .2s"}}
                  onMouseEnter={e => e.currentTarget.style.borderColor = T.accent + "66"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                  <div style={{fontSize:28}}>📚</div>
                  <div>
                    <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,color:T.ink}}>Tous les carnets</div>
                    <div style={{fontSize:10,color:T.muted}}>{notebooks.length} carnets</div>
                  </div>
                </div>
                <div onClick={() => {setFolderFilt("none"); setActiveTab("notebooks")}}
                  style={{padding:"16px 18px",borderRadius:13,background:T.surface,border:`1px solid ${T.border}`,cursor:"pointer",display:"flex",alignItems:"center",gap:10,transition:"all .2s"}}
                  onMouseEnter={e => e.currentTarget.style.borderColor = T.accent + "66"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                  <div style={{fontSize:28}}>📝</div>
                  <div>
                    <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,color:T.ink}}>Sans dossier</div>
                    <div style={{fontSize:10,color:T.muted}}>{notebooks.filter(n => !n.folder_id).length} carnets</div>
                  </div>
                </div>
                {folders.map(f => (
                  <div key={f.id}
                    onClick={() => {setFolderFilt(f.id); setActiveTab("notebooks")}}
                    style={{padding:"16px 18px",borderRadius:13,background:T.surface,border:`1px solid ${T.border}`,cursor:"pointer",display:"flex",alignItems:"center",gap:10,transition:"all .2s",position:"relative"}}
                    onMouseEnter={e => e.currentTarget.style.borderColor = T.accent + "66"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                    <div style={{fontSize:28}}>{f.e}</div>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,color:T.ink}}>{f.n}</div>
                      <div style={{fontSize:10,color:T.muted}}>{notebooks.filter(n => n.folder_id === f.id).length} carnets</div>
                    </div>
                    <button onClick={e => {e.stopPropagation(); setFolders(p => p.filter(x => x.id !== f.id))}}
                      style={{position:"absolute",top:6,right:6,background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:11,opacity:.5}}>×</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MATIÈRES */}
          {activeTab === "subjects" && (
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:17,color:T.ink}}>✏ Matières ({subjects.length})</div>
                <button onClick={() => setShowNewSubject(true)} style={{padding:"7px 14px",borderRadius:8,background:`linear-gradient(135deg,${T.accent},${T.a2})`,border:"none",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Nouvelle matière</button>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:9}}>
                {subjects.map(s => (
                  <div key={s.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",borderRadius:22,background:s.c+"18",border:`1px solid ${s.c}44`}}>
                    <span style={{fontSize:18}}>{s.e}</span>
                    <span style={{fontSize:12,fontWeight:700,color:s.c}}>{s.l}</span>
                    <span style={{fontSize:10,color:s.c+"88"}}>{notebooks.filter(n => n.subject === s.id).length} carnets</span>
                    {s.custom && <button onClick={() => setSubjects(p => p.filter(x => x.id !== s.id))} style={{background:"none",border:"none",color:s.c,cursor:"pointer",fontSize:13,opacity:.6,padding:0}}>×</button>}
                  </div>
                ))}
                <button onClick={() => setShowNewSubject(true)}
                  style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",borderRadius:22,background:T.bg,border:`1px dashed ${T.border}`,color:T.muted,cursor:"pointer",fontSize:12}}>
                  ➕ Créer une matière
                </button>
              </div>
            </div>
          )}

          {/* DASHBOARD */}
          {activeTab === "dashboard" && (() => {
            const totalPages = notebooks.reduce((s,n) => s + (n.pages_count||1), 0)
            const bySubject = subjects.map(s => ({...s, count:notebooks.filter(n => n.subject===s.id).length})).filter(s => s.count>0).sort((a,b) => b.count-a.count)
            const byTemplate = TEMPLATES.map(t => ({...t, count:notebooks.filter(n => n.template===t.id).length})).filter(t => t.count>0).sort((a,b) => b.count-a.count)
            const maxSubj = bySubject[0]?.count || 1
            const maxTmpl = byTemplate[0]?.count || 1
            const recentActivity = [...notebooks].sort((a,b) => new Date(b.updated_at)-new Date(a.updated_at)).slice(0,5)
            const TIPS = [
              "💡 Utilise l'outil Cotation (↔) pour annoter tes plans avec des dimensions automatiques.",
              "🎨 Le mode Focus (⛶) masque la barre d'outils et laisse toute la place à ta feuille.",
              "📐 Glisse les éléments de la bibliothèque structurale directement sur ton plan.",
              "⏱ Le minuteur Pomodoro (25min travail / 5min pause) améliore ta concentration.",
              "🔢 La calculatrice intégrée se souvient de tes 4 derniers calculs.",
              "🏠 Ajoute des symboles de mobilier avec l'onglet 'Sym.' dans la bibliothèque.",
            ]
            const tip = TIPS[new Date().getDay() % TIPS.length]
            return (
              <div style={{display:"flex",flexDirection:"column",gap:20}}>
                {/* Big numbers */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:12}}>
                  {[
                    {e:"📓",v:notebooks.length,l:"Carnets créés",c:T.accent},
                    {e:"📄",v:totalPages,l:"Pages au total",c:T.a2},
                    {e:"⭐",v:starredCount,l:"Mis en favori",c:"#f5a623"},
                    {e:"✏",v:subjects.filter(s => notebooks.some(n=>n.subject===s.id)).length,l:"Matières actives",c:T.a3},
                  ].map(card => (
                    <div key={card.l} style={{padding:"16px 18px",borderRadius:14,background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 2px 8px rgba(0,0,0,.05)"}}>
                      <div style={{fontSize:24,marginBottom:6}}>{card.e}</div>
                      <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:28,color:card.c,lineHeight:1}}>{card.v}</div>
                      <div style={{fontSize:10,color:T.muted,marginTop:4}}>{card.l}</div>
                    </div>
                  ))}
                </div>

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                  {/* Subject breakdown */}
                  <div style={{background:T.surface,borderRadius:14,padding:"16px 18px",border:`1px solid ${T.border}`}}>
                    <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,color:T.ink,marginBottom:14}}>📚 Carnets par matière</div>
                    {bySubject.length === 0 && <div style={{color:T.muted,fontSize:12}}>Aucune donnée</div>}
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {bySubject.slice(0,7).map(s => (
                        <div key={s.id}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                            <div style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:T.ink}}>
                              <span style={{fontSize:14}}>{s.e}</span>{s.l}
                            </div>
                            <span style={{fontSize:11,fontWeight:700,color:s.c}}>{s.count}</span>
                          </div>
                          <div style={{height:6,borderRadius:3,background:T.border}}>
                            <div style={{height:"100%",borderRadius:3,background:`linear-gradient(90deg,${s.c},${s.c}88)`,width:`${(s.count/maxSubj)*100}%`,transition:"width .6s ease"}}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Template usage */}
                  <div style={{background:T.surface,borderRadius:14,padding:"16px 18px",border:`1px solid ${T.border}`}}>
                    <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,color:T.ink,marginBottom:14}}>📋 Modèles utilisés</div>
                    {byTemplate.length === 0 && <div style={{color:T.muted,fontSize:12}}>Aucune donnée</div>}
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {byTemplate.slice(0,6).map(t => (
                        <div key={t.id}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:3,fontSize:11,color:T.ink}}>
                            <span>{t.i} {t.l}</span>
                            <span style={{fontWeight:700,color:T.accent}}>{t.count}</span>
                          </div>
                          <div style={{height:6,borderRadius:3,background:T.border}}>
                            <div style={{height:"100%",borderRadius:3,background:`linear-gradient(90deg,${T.accent},${T.a2})`,width:`${(t.count/maxTmpl)*100}%`,transition:"width .6s ease"}}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent activity */}
                <div style={{background:T.surface,borderRadius:14,padding:"16px 18px",border:`1px solid ${T.border}`}}>
                  <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,color:T.ink,marginBottom:12}}>🕐 Activité récente</div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {recentActivity.map((nb,i) => {
                      const s = subjects.find(s=>s.id===nb.subject)||subjects[0]
                      return (
                        <div key={nb.id} onClick={() => open(nb)} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 10px",borderRadius:10,cursor:"pointer",transition:"background .15s"}}
                          onMouseEnter={e=>e.currentTarget.style.background=T.bg}
                          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                          <div style={{width:36,height:36,borderRadius:10,background:`linear-gradient(135deg,${s.c}30,${s.c}10)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0,border:`1px solid ${s.c}30`}}>{s.e}</div>
                          <div style={{flex:1,overflow:"hidden"}}>
                            <div style={{fontWeight:700,fontSize:12,color:T.ink,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{nb.title}</div>
                            <div style={{fontSize:10,color:T.muted,marginTop:2}}>{s.l} · {nb.pages_count||1} page{(nb.pages_count||1)>1?"s":""}</div>
                          </div>
                          <div style={{fontSize:9,color:T.muted,flexShrink:0}}>{timeAgo(nb.updated_at)}</div>
                        </div>
                      )
                    })}
                    {recentActivity.length === 0 && <div style={{color:T.muted,fontSize:12,textAlign:"center",padding:"12px 0"}}>Aucun carnet pour l'instant</div>}
                  </div>
                </div>

                {/* Tip of the day */}
                <div style={{padding:"14px 18px",borderRadius:14,background:`${T.accent}10`,border:`1px dashed ${T.accent}44`,display:"flex",alignItems:"flex-start",gap:12}}>
                  <div style={{fontSize:20,flexShrink:0,marginTop:1}}>📌</div>
                  <div>
                    <div style={{fontSize:10,fontWeight:700,color:T.accent,letterSpacing:.8,marginBottom:4}}>ASTUCE DU JOUR</div>
                    <div style={{fontSize:12,color:T.ink,lineHeight:1.6}}>{tip}</div>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* NOTEBOOKS + FAVORITES */}
          {(activeTab === "notebooks" || activeTab === "favorites") && <>

            {/* RECENTLY OPENED STRIP */}
            {recentNotebooks.length > 0 && activeTab === "notebooks" && (
              <div style={{marginBottom:22}}>
                <div style={{fontSize:10,fontWeight:700,color:T.muted,letterSpacing:.8,marginBottom:8,textTransform:"uppercase"}}>Récemment ouvert</div>
                <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:4}}>
                  {recentNotebooks.map(nb => {
                    const rs = subjects.find(s => s.id === nb.subject) || subjects[0]
                    return (
                      <div key={nb.id} onClick={() => open(nb)}
                        style={{width:220,height:80,flexShrink:0,borderRadius:12,overflow:"hidden",cursor:"pointer",border:`1px solid ${T.border}`,background:T.surface,display:"flex",position:"relative",transition:"all .18s",boxShadow:"0 2px 8px rgba(0,0,0,.05)"}}
                        onMouseEnter={e => {e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow=`0 6px 20px ${rs.c}22`}}
                        onMouseLeave={e => {e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,.05)"}}>
                        {/* Colored left strip */}
                        <div style={{width:5,flexShrink:0,background:`linear-gradient(to bottom,${rs.c},${rs.c}88)`}}/>
                        {/* Cover area */}
                        <div style={{width:60,flexShrink:0,background:`linear-gradient(145deg,${rs.c}28,${rs.c}08)`,display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
                          <CoverPattern tmpl={nb.template} color={rs.c}/>
                          <div style={{fontSize:22,position:"relative",zIndex:1}}>{rs.e}</div>
                        </div>
                        {/* Info */}
                        <div style={{flex:1,padding:"8px 10px",overflow:"hidden",display:"flex",flexDirection:"column",justifyContent:"center"}}>
                          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,color:T.ink,lineHeight:1.3,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>{nb.title}</div>
                          <div style={{fontSize:9,color:T.muted,marginTop:3}}>{timeAgo(nb.updated_at)}</div>
                          <div style={{fontSize:9,color:rs.c,fontWeight:700,marginTop:2}}>{rs.l}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Folder breadcrumb */}
            {folderFilt !== "all" && activeTab === "notebooks" && (
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,padding:"8px 12px",background:T.surface,borderRadius:10,border:`1px solid ${T.border}`}}>
                <button onClick={() => setFolderFilt("all")} style={{background:"none",border:"none",color:T.accent,cursor:"pointer",fontSize:12}}>← Tous</button>
                <span style={{color:T.muted,fontSize:12}}>›</span>
                <span style={{fontSize:12,color:T.ink,fontWeight:600}}>
                  {folderFilt === "none" ? "📝 Sans dossier" : (folders.find(f => f.id === folderFilt)?.e + " " + folders.find(f => f.id === folderFilt)?.n)}
                </span>
              </div>
            )}

            {/* Filters */}
            <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
              <button onClick={() => setSubjFilt("all")} style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${subjFilt==="all"?T.accent:T.border}`,background:subjFilt==="all"?`${T.accent}15`:T.bg,color:subjFilt==="all"?T.accent:T.muted,fontSize:11,cursor:"pointer"}}>
                Tous ({activeTab === "favorites" ? starredCount : notebooks.length})
              </button>
              {usedSubjects.map(s => (
                <button key={s.id} onClick={() => setSubjFilt(s.id)} style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${subjFilt===s.id?s.c:T.border}`,background:subjFilt===s.id?s.c+"18":T.bg,color:subjFilt===s.id?s.c:T.muted,fontSize:11,cursor:"pointer"}}>
                  {s.e} {s.l}
                </button>
              ))}
            </div>

            {/* Search */}
            <div style={{position:"relative",marginBottom:20}}>
              <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:T.muted,fontSize:14}}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…"
                style={{width:"100%",padding:"10px 12px 10px 38px",borderRadius:11,border:`1px solid ${T.border}`,background:T.surface,fontSize:13,outline:"none",color:T.ink,boxSizing:"border-box"}}
                onFocus={e => e.target.style.borderColor = T.accent}
                onBlur={e => e.target.style.borderColor = T.border}/>
            </div>

            {loading ? (
              <div style={{textAlign:"center",padding:"60px 0",color:T.muted}}>
                <div style={{fontSize:28,marginBottom:10}}>⏳</div><div>Chargement…</div>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{textAlign:"center",padding:"80px 0 60px",animation:"cardIn .4s ease both"}}>
                <div style={{fontSize:56,marginBottom:16,filter:"grayscale(.3)"}}>📓</div>
                <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:20,color:T.ink,marginBottom:8}}>
                  {search || subjFilt !== "all" ? "Aucun résultat trouvé" : "Aucun carnet pour l'instant"}
                </div>
                <div style={{fontSize:13,color:T.muted,marginBottom:24,maxWidth:320,margin:"0 auto 24px"}}>
                  {search ? `Aucun carnet ne correspond à "${search}"` : subjFilt !== "all" ? "Essaie un autre filtre" : "Commence par créer ton premier carnet de cours"}
                </div>
                {notebooks.length === 0 && (
                  <button onClick={() => setShowNew(true)} style={{padding:"12px 26px",borderRadius:12,background:T.accent,border:"none",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer",boxShadow:`0 4px 18px ${T.accent}44`}}>
                    + Créer mon premier carnet
                  </button>
                )}
              </div>
            ) : (
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14}}>
                {filtered.map(nb => {
                  const s = subjects.find(s => s.id === nb.subject) || subjects[0]
                  const t = TEMPLATES.find(t => t.id === nb.template) || TEMPLATES[0]
                  const f = folders.find(f => f.id === nb.folder_id)
                  return (
                    <div key={nb.id} className="nb-card" onClick={() => open(nb)} style={{
                      borderRadius:16,
                      background:T.surface,
                      border:`1px solid ${T.border}`,
                      overflow:"hidden",
                      cursor:"pointer",
                      boxShadow:"0 2px 8px rgba(0,0,0,.06)"
                    }}>
                      {/* COVER */}
                      <div style={{
                        height:130,
                        position:"relative",
                        overflow:"hidden",
                        background:`linear-gradient(145deg,${s.c}25,${s.c}08)`
                      }}>
                        {/* Left spine */}
                        <div style={{position:"absolute",left:0,top:0,bottom:0,width:6,background:`linear-gradient(to bottom,${s.c},${s.c}aa)`}}/>

                        {/* Template pattern overlay */}
                        <CoverPattern tmpl={nb.template} color={s.c}/>

                        {/* Star button */}
                        <button className="star-btn" onClick={e => toggleStar(nb.id, e)} style={{
                          position:"absolute",top:8,right:8,
                          background:"rgba(255,255,255,.15)",backdropFilter:"blur(4px)",
                          border:"none",borderRadius:8,padding:"4px 6px",cursor:"pointer",
                          fontSize:14,color:nb.starred?"#f5a623":"rgba(255,255,255,.5)"
                        }}>★</button>

                        {/* Folder badge */}
                        {f && <div style={{position:"absolute",bottom:7,left:12,fontSize:9,color:T.ink+"66",background:"rgba(255,255,255,.2)",borderRadius:4,padding:"1px 5px",backdropFilter:"blur(4px)"}}>{f.e} {f.n}</div>}

                        {/* Center emoji */}
                        <div style={{
                          position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",
                          paddingLeft:6
                        }}>
                          <div style={{fontSize:40,filter:"drop-shadow(0 2px 6px rgba(0,0,0,.15))"}}>{s.e}</div>
                        </div>
                      </div>

                      {/* INFO SECTION */}
                      <div style={{padding:"10px 12px 10px 14px"}}>
                        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:4,marginBottom:6}}>
                          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:12,color:T.ink,lineHeight:1.35,flex:1,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{nb.title}</div>
                        </div>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                          <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap"}}>
                            <div style={{padding:"2px 7px",borderRadius:12,background:s.c+"20",color:s.c,fontSize:9,fontWeight:700,letterSpacing:.3}}>{s.l}</div>
                            <div style={{fontSize:9,color:T.muted}}>{t.i} {nb.pages_count||1}p</div>
                          </div>
                          <div className="nb-btn-action" style={{display:"flex",gap:2}}>
                            <button onClick={e => {e.stopPropagation(); setShowFolderAssign(nb.id)}} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:11,padding:"2px 4px",borderRadius:4}} title="Dossier">📁</button>
                            <button onClick={e => deleteNB(nb.id, e)} style={{background:"none",border:"none",color:"#e94560",cursor:"pointer",fontSize:11,padding:"2px 4px",borderRadius:4}} title="Supprimer">🗑</button>
                          </div>
                        </div>
                        <div style={{fontSize:8,color:T.muted,marginTop:4}}>{timeAgo(nb.updated_at)}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>}
        </div>
      )}
    </div>
  )
}
