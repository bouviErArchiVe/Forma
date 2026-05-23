import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import useAppStore from "@/stores/useAppStore"
import { supabase } from "@/lib/supabase"

const THEMES = [
  {id:"classic",  n:"Classic",   e:"📐",bg:"#f5f2ec",surface:"#fff",panel:"#1c1c24",accent:"#c8622a",a2:"#3d6b8c",a3:"#4a7c59",ink:"#1c1c24",muted:"#8a8a96",border:"#ddd8ce",paper:"#fafaf7",grid:"rgba(0,0,0,.07)",pline:"rgba(61,107,140,.1)"},
  {id:"dark",     n:"Dark Pro",  e:"🌑",bg:"#0e0e14",surface:"#16161f",panel:"#0a0a10",accent:"#e94560",a2:"#60a5fa",a3:"#4ade80",ink:"#e8e8f0",muted:"#4a4a60",border:"#1e1e2e",paper:"#12121a",grid:"rgba(255,255,255,.04)",pline:"rgba(96,165,250,.08)"},
  {id:"neon",     n:"Neon",      e:"🌈",bg:"#05050f",surface:"#0a0a1a",panel:"#03030a",accent:"#00ffcc",a2:"#ff00ff",a3:"#ffff00",ink:"#e0e0ff",muted:"#3a3a5a",border:"#1a1a3a",paper:"#080814",grid:"rgba(0,255,204,.06)",pline:"rgba(0,255,204,.07)"},
  {id:"arctic",   n:"Arctic",    e:"❄️",bg:"#eef4fb",surface:"#fff",panel:"#1a2a3a",accent:"#2196f3",a2:"#00bcd4",a3:"#26a69a",ink:"#1a2a3a",muted:"#7a9ab8",border:"#c8ddef",paper:"#f8fbff",grid:"rgba(33,150,243,.08)",pline:"rgba(33,150,243,.1)"},
  {id:"sepia",    n:"Sépia",     e:"📜",bg:"#f4ede0",surface:"#fdf6ed",panel:"#3d2b1a",accent:"#8b4513",a2:"#6b5a3d",a3:"#5a7a3d",ink:"#3d2b1a",muted:"#9a856a",border:"#d4c4a8",paper:"#fdf6ed",grid:"rgba(139,69,19,.08)",pline:"rgba(139,69,19,.1)"},
  {id:"midnight", n:"Midnight",  e:"🌙",bg:"#0d1117",surface:"#161b22",panel:"#0d1117",accent:"#58a6ff",a2:"#3fb950",a3:"#f78166",ink:"#c9d1d9",muted:"#484f58",border:"#21262d",paper:"#1c2128",grid:"rgba(88,166,255,.05)",pline:"rgba(88,166,255,.07)"},
  {id:"sunset",   n:"Sunset",    e:"🌅",bg:"#fff8f0",surface:"#fff",panel:"#2d1a0e",accent:"#ff6b35",a2:"#ff9f1c",a3:"#c73e1d",ink:"#2d1a0e",muted:"#b08070",border:"#f0d8c8",paper:"#fffaf6",grid:"rgba(255,107,53,.07)",pline:"rgba(255,107,53,.09)"},
  {id:"forest",   n:"Forest",    e:"🌲",bg:"#f0f5f0",surface:"#fff",panel:"#1a2a1a",accent:"#2d6a4f",a2:"#52b788",a3:"#95d5b2",ink:"#1a2a1a",muted:"#6a8a6a",border:"#c8ddc8",paper:"#f8faf8",grid:"rgba(45,106,79,.08)",pline:"rgba(45,106,79,.09)"},
  {id:"violet",   n:"Violet",    e:"💜",bg:"#f5f0ff",surface:"#fff",panel:"#1a0a2e",accent:"#7c3aed",a2:"#a855f7",a3:"#ec4899",ink:"#1a0a2e",muted:"#8a6aaa",border:"#d8c8f0",paper:"#fdf8ff",grid:"rgba(124,58,237,.07)",pline:"rgba(124,58,237,.09)"},
  {id:"steel",    n:"Steel",     e:"⚙️",bg:"#e8ecef",surface:"#f4f6f8",panel:"#1c2833",accent:"#546e7a",a2:"#78909c",a3:"#b0bec5",ink:"#1c2833",muted:"#7a8a94",border:"#cfd8dc",paper:"#f4f6f8",grid:"rgba(84,110,122,.08)",pline:"rgba(84,110,122,.1)"},
  {id:"cherry",   n:"Cherry",    e:"🍒",bg:"#fff0f3",surface:"#fff",panel:"#2a0a10",accent:"#e01e5a",a2:"#ff6b9d",a3:"#c92842",ink:"#2a0a10",muted:"#b07080",border:"#f0c8d0",paper:"#fff8fa",grid:"rgba(224,30,90,.07)",pline:"rgba(224,30,90,.09)"},
  {id:"blueprint",n:"Blueprint", e:"🗺️",bg:"#003366",surface:"#004080",panel:"#001f3f",accent:"#ffffff",a2:"#80c0ff",a3:"#40ff80",ink:"#ffffff",muted:"#80a0c0",border:"#005599",paper:"#003d7a",grid:"rgba(255,255,255,.1)",pline:"rgba(255,255,255,.12)"},
  {id:"lemon",    n:"Lemon",     e:"🍋",bg:"#fffff0",surface:"#fff",panel:"#2a2a0a",accent:"#d4af00",a2:"#a0c000",a3:"#008080",ink:"#2a2a0a",muted:"#9a9a6a",border:"#e8e8c0",paper:"#fffff8",grid:"rgba(212,175,0,.08)",pline:"rgba(212,175,0,.1)"},
  {id:"sand",     n:"Sand",      e:"🏜️",bg:"#f5f0e8",surface:"#fff",panel:"#2a2010",accent:"#c9a84c",a2:"#8b7355",a3:"#6b8c3d",ink:"#2a2010",muted:"#9a8a6a",border:"#e0d4b8",paper:"#faf7f0",grid:"rgba(201,168,76,.08)",pline:"rgba(201,168,76,.1)"},
  {id:"slate",    n:"Slate Dark",e:"🪨",bg:"#1e2025",surface:"#252830",panel:"#16181c",accent:"#a8b2c4",a2:"#7a8fa8",a3:"#5a9a7a",ink:"#d8dce4",muted:"#5a6070",border:"#30343c",paper:"#2a2d35",grid:"rgba(168,178,196,.05)",pline:"rgba(168,178,196,.07)"},
]

const DEFAULT_SUBJECTS = [
  {id:"arch",    l:"Architecture",    c:"#c8622a", e:"🏛", custom:false},
  {id:"struct",  l:"Structure",       c:"#3d6b8c", e:"⚙",  custom:false},
  {id:"urbanism",l:"Urbanisme",       c:"#5a7a3d", e:"🏙", custom:false},
  {id:"history", l:"Histoire Archi",  c:"#7c5c3d", e:"📜", custom:false},
  {id:"english", l:"Anglais",         c:"#4a7c59", e:"🇬🇧",custom:false},
  {id:"french",  l:"Français",        c:"#8c3d6b", e:"📖", custom:false},
  {id:"math",    l:"Mathématiques",   c:"#3d5c8c", e:"📐", custom:false},
  {id:"physics", l:"Physique",        c:"#5c3d8c", e:"⚡", custom:false},
  {id:"chemistry",l:"Chimie",         c:"#3d8c5c", e:"🧪", custom:false},
  {id:"compute", l:"Informatique",    c:"#2a6b8c", e:"💻", custom:false},
  {id:"art",     l:"Arts Plastiques", c:"#8c3d3d", e:"🎨", custom:false},
  {id:"music",   l:"Musique",         c:"#6b3d8c", e:"🎵", custom:false},
  {id:"economy", l:"Économie",        c:"#6b8c3d", e:"📊", custom:false},
  {id:"law",     l:"Droit",           c:"#8c6b3d", e:"⚖",  custom:false},
  {id:"env",     l:"Environnement",   c:"#2d6a4f", e:"🌱", custom:false},
  {id:"design",  l:"Design",          c:"#6b3d6b", e:"✏",  custom:false},
  {id:"geotech", l:"Géotechnique",    c:"#5c7a3d", e:"🪨", custom:false},
  {id:"thermal", l:"Thermique",       c:"#e65100", e:"🌡", custom:false},
  {id:"acoustic",l:"Acoustique",      c:"#0277bd", e:"🔊", custom:false},
  {id:"bim",     l:"BIM / Maquette",  c:"#4527a0", e:"🏗", custom:false},
]

const TEMPLATES = [
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

const EMOJI_LIST = ["🏛","⚙","🏙","📜","🇬🇧","📖","📐","⚡","🧪","💻","🎨","🎵","📊","⚖","🌱","✏","🪨","🌡","🔊","🏗","🚀","⭐","🔥","💎","🌊","🌲","🎯","📌","🗺","🔬","🎭","🏆","💡","🎸","🏋","🌍","🔭","📚","🎓","🏠","🌺","🦋","🐉","🌈","☁","🌙","⚡","🎪"]
const COLOR_LIST = ["#c8622a","#3d6b8c","#4a7c59","#7c5c3d","#8c3d6b","#3d5c8c","#5c3d8c","#3d8c5c","#8c3d3d","#6b3d8c","#6b8c3d","#8c6b3d","#2d6a4f","#e65100","#0277bd","#4527a0","#880e4f","#1a237e","#006064","#33691e","#bf360c","#4a148c","#01579b","#1b5e20","#b71c1c","#f57f17"]

function timeAgo(dateStr){
  const diff=Date.now()-new Date(dateStr).getTime(),mins=Math.floor(diff/60000)
  if(mins<1)return"À l'instant";if(mins<60)return`Il y a ${mins}min`
  const h=Math.floor(mins/60);if(h<24)return`Il y a ${h}h`
  const d=Math.floor(h/24);if(d===1)return"Hier";return new Date(dateStr).toLocaleDateString("fr-FR")
}

function ThemePicker({current,onChange,onClose}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}}>
      <div style={{background:"#fff",borderRadius:20,padding:22,width:560,maxWidth:"94vw",maxHeight:"82vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.25)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:18}}>🎨 Thèmes ({THEMES.length})</div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:22,color:"#888"}}>×</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:9}}>
          {THEMES.map(th=>(
            <button key={th.id} onClick={()=>{onChange(th);onClose()}}
              style={{padding:0,border:`2px solid ${current?.id===th.id?"#c8622a":"#eee"}`,borderRadius:13,overflow:"hidden",cursor:"pointer",background:"none"}}>
              <div style={{height:44,background:`linear-gradient(135deg,${th.panel},${th.surface})`,display:"flex",alignItems:"center",gap:7,padding:"0 11px"}}>
                <span style={{fontSize:15}}>{th.e}</span>
                {[th.accent,th.a2,th.a3].map((c,i)=><div key={i}style={{width:9-i*2,height:9-i*2,borderRadius:2,background:c}}/>)}
              </div>
              <div style={{padding:"5px 9px",background:th.bg}}>
                <div style={{fontSize:10,fontWeight:700,color:th.ink,fontFamily:"'Syne',sans-serif"}}>{th.n}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function LibraryPage(){
  const navigate=useNavigate()
  const {getTheme,setTheme,setActiveNotebook}=useAppStore()
  const [localTheme,setLocalTheme]=useState(null)
  const T=localTheme||getTheme()

  const [notebooks,setNotebooks]=useState([])
  const [folders,setFolders]=useState([{id:"all",n:"Tous les carnets",e:"📚",system:true}])
  const [activeFolder,setActiveFolder]=useState("all")
  const [subjects,setSubjects]=useState(DEFAULT_SUBJECTS)
  const [loading,setLoading]=useState(true)
  const [search,setSearch]=useState("")
  const [filt,setFilt]=useState("all")
  const [userId,setUserId]=useState(null)
  const [userName,setUserName]=useState("")
  const [showTheme,setShowTheme]=useState(false)
  const [showNew,setShowNew]=useState(false)
  const [showNewFolder,setShowNewFolder]=useState(false)
  const [showNewSubject,setShowNewSubject]=useState(false)
  const [activeTab,setActiveTab]=useState("notebooks") // notebooks | favorites | folders

  // New notebook state
  const [newTitle,setNewTitle]=useState("")
  const [newSubj,setNewSubj]=useState("arch")
  const [newTmpl,setNewTmpl]=useState("plan")
  const [newFolder,setNewFolder]=useState("all")
  const [saving,setSaving]=useState(false)

  // New folder state
  const [folderName,setFolderName]=useState("")
  const [folderEmoji,setFolderEmoji]=useState("📁")

  // New subject state
  const [subjName,setSubjName]=useState("")
  const [subjEmoji,setSubjEmoji]=useState("⭐")
  const [subjColor,setSubjColor]=useState("#c8622a")

  useEffect(()=>{
    const init=async()=>{
      try{
        const {data:{session}}=await supabase.auth.getSession()
        if(session?.user){
          setUserId(session.user.id)
          setUserName(session.user.user_metadata?.full_name||session.user.email||"")
          loadNotebooks(session.user.id)
        } else {setLoading(false)}
      }catch{setLoading(false)}
    }
    init()
  },[])

  const loadNotebooks=async(uid)=>{
    try{
      const {data,error}=await supabase.from("notebooks").select("*").eq("user_id",uid).order("updated_at",{ascending:false})
      if(error)throw error
      setNotebooks(data||[])
    }catch{setNotebooks([])}
    finally{setLoading(false)}
  }

  const filtered=useMemo(()=>notebooks.filter(n=>{
    const ms=n.title.toLowerCase().includes(search.toLowerCase())
    const mf=filt==="all"||n.subject===filt
    const mfold=activeFolder==="all"||n.folder_id===activeFolder
    const mstar=activeTab!=="favorites"||n.starred
    return ms&&mf&&mfold&&mstar
  }),[notebooks,search,filt,activeFolder,activeTab])

  const open=nb=>{setActiveNotebook(nb);navigate(`/editor/${nb.id}`)}

  const toggleStar=async(id,e)=>{
    e.stopPropagation()
    const nb=notebooks.find(n=>n.id===id);if(!nb)return
    setNotebooks(ns=>ns.map(n=>n.id===id?{...n,starred:!n.starred}:n))
    if(userId)await supabase.from("notebooks").update({starred:!nb.starred}).eq("id",id)
  }

  const create=async()=>{
    if(!newTitle.trim())return
    setSaving(true)
    const subj=subjects.find(s=>s.id===newSubj)
    const nb={title:newTitle,subject:newSubj,template:newTmpl,pages_count:1,starred:false,color:subj?.c||"#c8622a",folder_id:newFolder==="all"?null:newFolder}
    try{
      if(userId){
        const {data,error}=await supabase.from("notebooks").insert([{...nb,user_id:userId}]).select().single()
        if(error)throw error
        setNotebooks(p=>[data,...p]);setShowNew(false);setNewTitle("");open(data)
      }
    }catch{alert("Erreur lors de la création.")}
    finally{setSaving(false)}
  }

  const deleteNB=async(id,e)=>{
    e.stopPropagation()
    if(!confirm("Supprimer ce carnet ?"))return
    setNotebooks(ns=>ns.filter(n=>n.id!==id))
    if(userId)await supabase.from("notebooks").delete().eq("id",id)
  }

  const createFolder=()=>{
    if(!folderName.trim())return
    const f={id:Date.now().toString(),n:folderName,e:folderEmoji,system:false}
    setFolders(p=>[...p,f]);setShowNewFolder(false);setFolderName("");setFolderEmoji("📁")
  }

  const createSubject=()=>{
    if(!subjName.trim())return
    const s={id:Date.now().toString(),l:subjName,c:subjColor,e:subjEmoji,custom:true}
    setSubjects(p=>[...p,s]);setShowNewSubject(false);setSubjName("");setSubjEmoji("⭐");setSubjColor("#c8622a")
  }

  const changeTheme=th=>{setLocalTheme(th);setTheme(th.id)}

  const logout=async()=>{await supabase.auth.signOut();setUserId(null);setUserName("");setNotebooks([])}

  const usedSubjects=subjects.filter(s=>notebooks.some(n=>n.subject===s.id))
  const starredCount=notebooks.filter(n=>n.starred).length

  return(
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"'Nunito',sans-serif",color:T.ink}}>
      {showTheme&&<ThemePicker current={T} onChange={changeTheme} onClose={()=>setShowTheme(false)}/>}

      {/* NEW NOTEBOOK MODAL */}
      {showNew&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
          <div style={{background:T.surface,borderRadius:20,padding:26,width:520,maxWidth:"94vw",maxHeight:"88vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.25)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:19,color:T.ink}}>Nouveau carnet</div>
              <button onClick={()=>setShowNew(false)} style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:22}}>×</button>
            </div>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:5}}>TITRE</div>
              <input value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="Ex: Projet École Primaire 2026…"
                onKeyDown={e=>e.key==="Enter"&&create()} autoFocus
                style={{width:"100%",padding:"10px 12px",borderRadius:10,border:`1px solid ${T.border}`,fontSize:14,outline:"none",color:T.ink,background:T.bg,boxSizing:"border-box"}}/>
            </div>
            {/* Folder */}
            {folders.length>1&&<div style={{marginBottom:14}}>
              <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:5}}>DOSSIER</div>
              <select value={newFolder} onChange={e=>setNewFolder(e.target.value)} style={{width:"100%",padding:"8px 10px",borderRadius:10,border:`1px solid ${T.border}`,fontSize:13,background:T.bg,color:T.ink,outline:"none",cursor:"pointer"}}>
                <option value="all">Aucun dossier</option>
                {folders.filter(f=>!f.system).map(f=><option key={f.id} value={f.id}>{f.e} {f.n}</option>)}
              </select>
            </div>}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:5}}>MATIÈRE ({subjects.length})</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5,maxHeight:180,overflowY:"auto"}}>
                {subjects.map(s=>(
                  <button key={s.id} onClick={()=>setNewSubj(s.id)}
                    style={{padding:"7px 4px",borderRadius:8,border:`1px solid ${newSubj===s.id?s.c:T.border}`,background:newSubj===s.id?s.c+"18":T.bg,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                    <div style={{fontSize:15}}>{s.e}</div>
                    <div style={{fontSize:8,fontWeight:700,color:newSubj===s.id?s.c:T.muted,textAlign:"center",lineHeight:1.1}}>{s.l}</div>
                  </button>
                ))}
                <button onClick={()=>{setShowNew(false);setShowNewSubject(true)}}
                  style={{padding:"7px 4px",borderRadius:8,border:`1px dashed ${T.border}`,background:T.bg,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                  <div style={{fontSize:15}}>➕</div>
                  <div style={{fontSize:8,color:T.muted,textAlign:"center"}}>Nouvelle matière</div>
                </button>
              </div>
            </div>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:5}}>MODÈLE</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5}}>
                {TEMPLATES.map(t=>(
                  <button key={t.id} onClick={()=>setNewTmpl(t.id)}
                    style={{padding:"8px 4px",borderRadius:8,border:`1px solid ${newTmpl===t.id?T.accent:T.border}`,background:newTmpl===t.id?`${T.accent}10`:T.bg,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                    <div style={{fontSize:16,color:newTmpl===t.id?T.accent:T.muted}}>{t.i}</div>
                    <div style={{fontSize:8,fontWeight:700,color:newTmpl===t.id?T.accent:T.muted,textAlign:"center",lineHeight:1.2}}>{t.l}</div>
                  </button>
                ))}
              </div>
            </div>
            <button onClick={create} disabled={!newTitle.trim()||saving}
              style={{width:"100%",padding:12,borderRadius:11,background:newTitle.trim()?T.accent:T.border,border:"none",color:"#fff",fontWeight:700,fontSize:14,cursor:newTitle.trim()?"pointer":"not-allowed"}}>
              {saving?"Création...":"Créer le carnet →"}
            </button>
          </div>
        </div>
      )}

      {/* NEW FOLDER MODAL */}
      {showNewFolder&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
          <div style={{background:T.surface,borderRadius:18,padding:24,width:380,maxWidth:"94vw",boxShadow:"0 20px 60px rgba(0,0,0,.25)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:17,color:T.ink}}>📁 Nouveau dossier</div>
              <button onClick={()=>setShowNewFolder(false)} style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:20}}>×</button>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:5}}>NOM</div>
              <input value={folderName} onChange={e=>setFolderName(e.target.value)} placeholder="Ex: Projet École 2026" autoFocus
                onKeyDown={e=>e.key==="Enter"&&createFolder()}
                style={{width:"100%",padding:"10px 12px",borderRadius:10,border:`1px solid ${T.border}`,fontSize:14,outline:"none",color:T.ink,background:T.bg,boxSizing:"border-box"}}/>
            </div>
            <div style={{marginBottom:18}}>
              <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:5}}>EMOJI</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                {["📁","📂","🏗","🏛","📐","⚙","🎨","📚","🌿","🔥","⭐","💡","🎯","🏆","🔬"].map(e=>(
                  <button key={e} onClick={()=>setFolderEmoji(e)}
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

      {/* NEW SUBJECT MODAL */}
      {showNewSubject&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
          <div style={{background:T.surface,borderRadius:18,padding:24,width:400,maxWidth:"94vw",boxShadow:"0 20px 60px rgba(0,0,0,.25)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:17,color:T.ink}}>✏ Nouvelle matière</div>
              <button onClick={()=>setShowNewSubject(false)} style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:20}}>×</button>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:5}}>NOM DE LA MATIÈRE</div>
              <input value={subjName} onChange={e=>setSubjName(e.target.value)} placeholder="Ex: Matière du Caca 💩" autoFocus
                style={{width:"100%",padding:"10px 12px",borderRadius:10,border:`1px solid ${T.border}`,fontSize:14,outline:"none",color:T.ink,background:T.bg,boxSizing:"border-box"}}/>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:5}}>EMOJI ({subjEmoji})</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:3,maxHeight:100,overflowY:"auto"}}>
                {EMOJI_LIST.map(e=>(
                  <button key={e} onClick={()=>setSubjEmoji(e)}
                    style={{width:30,height:30,borderRadius:7,background:subjEmoji===e?`${T.accent}18`:T.bg,border:`1px solid ${subjEmoji===e?T.accent:T.border}`,cursor:"pointer",fontSize:14}}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div style={{marginBottom:18}}>
              <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:5}}>COULEUR</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                {COLOR_LIST.map(c=>(
                  <button key={c} onClick={()=>setSubjColor(c)}
                    style={{width:26,height:26,borderRadius:"50%",background:c,border:`2px solid ${subjColor===c?T.ink:"transparent"}`,cursor:"pointer"}}/>
                ))}
              </div>
            </div>
            <div style={{marginBottom:16,padding:12,borderRadius:10,background:`${subjColor}18`,border:`1px solid ${subjColor}44`,display:"flex",alignItems:"center",gap:10}}>
              <div style={{fontSize:24}}>{subjEmoji}</div>
              <div style={{fontWeight:700,color:subjColor,fontSize:14}}>{subjName||"Nom de la matière"}</div>
            </div>
            <button onClick={createSubject} disabled={!subjName.trim()}
              style={{width:"100%",padding:12,borderRadius:11,background:subjName.trim()?subjColor:T.border,border:"none",color:"#fff",fontWeight:700,fontSize:14,cursor:subjName.trim()?"pointer":"not-allowed"}}>
              Créer la matière →
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:"0 22px",position:"sticky",top:0,zIndex:20,boxShadow:"0 1px 12px rgba(0,0,0,.06)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",height:58}}>
          <div style={{display:"flex",alignItems:"center",gap:11}}>
            <div style={{width:38,height:38,borderRadius:10,background:T.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,boxShadow:`0 4px 14px ${T.accent}44`}}>🏛</div>
            <div>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:20,color:T.ink}}>ArchNote</div>
              <div style={{fontSize:9,color:T.muted}}>{userId?`✓ ${userName}`:"Non connecté"}</div>
            </div>
          </div>
          <div style={{display:"flex",gap:7,alignItems:"center"}}>
            <button onClick={()=>setShowTheme(true)}
              style={{padding:"6px 13px",borderRadius:8,background:T.bg,border:`1px solid ${T.border}`,color:T.muted,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",gap:5}}>
              {T.e||"🎨"} Thème
            </button>
            {userId?(
              <button onClick={logout} style={{padding:"6px 12px",borderRadius:8,background:"transparent",border:`1px solid ${T.border}`,color:T.muted,fontWeight:600,fontSize:11,cursor:"pointer"}}>Déconnexion</button>
            ):(
              <button onClick={()=>navigate("/auth")} style={{padding:"6px 12px",borderRadius:8,background:"transparent",border:`1px solid ${T.accent}`,color:T.accent,fontWeight:600,fontSize:11,cursor:"pointer"}}>Se connecter</button>
            )}
            <button onClick={()=>userId?setShowNew(true):navigate("/auth")}
              style={{padding:"7px 14px",borderRadius:8,background:T.accent,border:"none",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer",boxShadow:`0 3px 12px ${T.accent}44`}}>
              + Nouveau carnet
            </button>
          </div>
        </div>
      </div>

      {!userId&&!loading&&(
        <div style={{textAlign:"center",padding:"80px 0"}}>
          <div style={{fontSize:48,marginBottom:14}}>🏛</div>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:22,color:T.ink,marginBottom:8}}>Bienvenue sur ArchNote</div>
          <div style={{fontSize:14,color:T.muted,marginBottom:26}}>Le carnet intelligent pour étudiants en architecture</div>
          <button onClick={()=>navigate("/auth")} style={{padding:"11px 22px",borderRadius:11,background:T.accent,border:"none",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer",boxShadow:`0 4px 14px ${T.accent}44`}}>Se connecter / Créer un compte</button>
        </div>
      )}

      {userId&&<div style={{padding:"18px 22px",maxWidth:1400,margin:"0 auto"}}>
        {/* STATS CLIQUABLES */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:11,marginBottom:20}}>
          {[
            {l:"Carnets",  v:notebooks.length,           c:T.accent,  e:"📓", tab:"notebooks"},
            {l:"Dossiers", v:folders.filter(f=>!f.system).length, c:T.a2, e:"📁", tab:"folders"},
            {l:"Favoris",  v:starredCount,                c:"#f5a623", e:"⭐", tab:"favorites"},
            {l:"Matières", v:subjects.length,             c:T.a3,      e:"✏",  tab:null, action:()=>setShowNewSubject(true)},
          ].map(s=>(
            <div key={s.l}
              onClick={()=>s.tab?setActiveTab(s.tab):s.action?.()}
              style={{padding:"14px 18px",borderRadius:13,background:activeTab===s.tab&&s.tab?`${s.c}15`:T.surface,border:`1px solid ${activeTab===s.tab&&s.tab?s.c:T.border}`,display:"flex",alignItems:"center",gap:12,cursor:"pointer",transition:"all .2s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=s.c+"44";e.currentTarget.style.boxShadow=`0 4px 14px ${s.c}12`}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=activeTab===s.tab&&s.tab?s.c:T.border;e.currentTarget.style.boxShadow="none"}}>
              <div style={{fontSize:24}}>{s.e}</div>
              <div>
                <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:20,color:s.c,lineHeight:1}}>{s.v}</div>
                <div style={{fontSize:10,color:T.muted,marginTop:1}}>{s.l}</div>
              </div>
            </div>
          ))}
        </div>

        {/* FOLDERS VIEW */}
        {activeTab==="folders"&&(
          <div style={{marginBottom:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:16,color:T.ink}}>📁 Dossiers</div>
              <button onClick={()=>setShowNewFolder(true)} style={{padding:"6px 13px",borderRadius:8,background:T.accent,border:"none",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Nouveau dossier</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:11}}>
              {folders.map(f=>(
                <div key={f.id}
                  onClick={()=>{setActiveFolder(f.id);setActiveTab("notebooks")}}
                  style={{padding:"16px 18px",borderRadius:13,background:T.surface,border:`1px solid ${T.border}`,cursor:"pointer",transition:"all .2s",display:"flex",alignItems:"center",gap:10}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accent+"66";e.currentTarget.style.transform="translateY(-2px)"}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.transform="none"}}>
                  <div style={{fontSize:28}}>{f.e}</div>
                  <div>
                    <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,color:T.ink}}>{f.n}</div>
                    <div style={{fontSize:10,color:T.muted}}>{f.system?"Tous":""}  {notebooks.filter(n=>f.system||(n.folder_id===f.id)).length} carnets</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBJECTS MANAGER */}
        {activeTab==="folders"&&(
          <div style={{marginBottom:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:16,color:T.ink}}>✏ Matières ({subjects.length})</div>
              <button onClick={()=>setShowNewSubject(true)} style={{padding:"6px 13px",borderRadius:8,background:T.accent,border:"none",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Nouvelle matière</button>
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {subjects.map(s=>(
                <div key={s.id} style={{display:"flex",alignItems:"center",gap:7,padding:"7px 12px",borderRadius:20,background:s.c+"18",border:`1px solid ${s.c}44`}}>
                  <span style={{fontSize:16}}>{s.e}</span>
                  <span style={{fontSize:12,fontWeight:700,color:s.c}}>{s.l}</span>
                  {s.custom&&<button onClick={()=>setSubjects(p=>p.filter(x=>x.id!==s.id))} style={{background:"none",border:"none",color:s.c,cursor:"pointer",fontSize:12,opacity:.6}}>×</button>}
                </div>
              ))}
              <button onClick={()=>setShowNewSubject(true)} style={{padding:"7px 12px",borderRadius:20,background:T.bg,border:`1px dashed ${T.border}`,color:T.muted,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",gap:5}}>
                ➕ Créer une matière
              </button>
            </div>
          </div>
        )}

        {/* FILTERS (notebooks + favorites) */}
        {(activeTab==="notebooks"||activeTab==="favorites")&&<>
          {activeTab==="notebooks"&&folders.length>1&&(
            <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
              {folders.map(f=>(
                <button key={f.id} onClick={()=>setActiveFolder(f.id)}
                  style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${activeFolder===f.id?T.accent:T.border}`,background:activeFolder===f.id?`${T.accent}15`:T.bg,color:activeFolder===f.id?T.accent:T.muted,fontSize:11,cursor:"pointer"}}>
                  {f.e} {f.n}
                </button>
              ))}
            </div>
          )}
          <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
            <button onClick={()=>setFilt("all")} style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${filt==="all"?T.accent:T.border}`,background:filt==="all"?`${T.accent}15`:T.bg,color:filt==="all"?T.accent:T.muted,fontSize:11,cursor:"pointer"}}>
              Tous ({notebooks.length})
            </button>
            {usedSubjects.map(s=>(
              <button key={s.id} onClick={()=>setFilt(s.id)} style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${filt===s.id?s.c:T.border}`,background:filt===s.id?s.c+"18":T.bg,color:filt===s.id?s.c:T.muted,fontSize:11,cursor:"pointer"}}>
                {s.e} {s.l}
              </button>
            ))}
          </div>
          <div style={{position:"relative",marginBottom:18}}>
            <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:T.muted}}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher…"
              style={{width:"100%",padding:"10px 12px 10px 38px",borderRadius:11,border:`1px solid ${T.border}`,background:T.surface,fontSize:13,outline:"none",color:T.ink,boxSizing:"border-box"}}
              onFocus={e=>e.target.style.borderColor=T.accent}
              onBlur={e=>e.target.style.borderColor=T.border}/>
          </div>
          {loading?(
            <div style={{textAlign:"center",padding:"60px 0",color:T.muted}}><div style={{fontSize:28,marginBottom:10}}>⏳</div><div>Chargement…</div></div>
          ):notebooks.length===0?(
            <div style={{textAlign:"center",padding:"60px 0",color:T.muted}}>
              <div style={{fontSize:38,marginBottom:11}}>📓</div>
              <div style={{fontSize:15,fontWeight:700,color:T.ink,marginBottom:7}}>Aucun carnet</div>
              <button onClick={()=>setShowNew(true)} style={{padding:"10px 22px",borderRadius:11,background:T.accent,border:"none",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>+ Créer mon premier carnet</button>
            </div>
          ):(
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(195px,1fr))",gap:13}}>
              {filtered.map(nb=>{
                const s=subjects.find(s=>s.id===nb.subject)||subjects[0]
                const t=TEMPLATES.find(t=>t.id===nb.template)||TEMPLATES[0]
                return(
                  <div key={nb.id} onClick={()=>open(nb)}
                    style={{borderRadius:14,background:T.surface,border:`1px solid ${T.border}`,overflow:"hidden",cursor:"pointer",transition:"all .22s"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=s.c+"66";e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow=`0 8px 28px ${s.c}18`}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none"}}>
                    <div style={{height:90,background:`linear-gradient(135deg,${s.c}22,${s.c}06)`,display:"flex",alignItems:"center",justifyContent:"center",borderBottom:`1px solid ${T.border}`,position:"relative"}}>
                      <div style={{fontSize:32}}>{s.e}</div>
                      <div style={{position:"absolute",top:7,left:7,width:5,height:5,borderRadius:1,background:s.c}}/>
                      <div style={{position:"absolute",top:7,right:7,fontSize:9,color:s.c+"88"}}>{t.i}</div>
                    </div>
                    <div style={{padding:"10px 12px"}}>
                      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:5}}>
                        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,color:T.ink,lineHeight:1.3,flex:1}}>{nb.title}</div>
                        <button onClick={e=>toggleStar(nb.id,e)} style={{background:"none",border:"none",color:nb.starred?"#f5a623":T.border,cursor:"pointer",fontSize:13}}>★</button>
                      </div>
                      <div style={{display:"flex",gap:5,alignItems:"center",justifyContent:"space-between"}}>
                        <div style={{display:"flex",gap:4}}>
                          <div style={{padding:"2px 6px",borderRadius:20,background:s.c+"18",color:s.c,fontSize:8,fontWeight:700}}>{s.l}</div>
                          <div style={{fontSize:8,color:T.muted}}>{nb.pages_count||1}p</div>
                        </div>
                        <button onClick={e=>deleteNB(nb.id,e)} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:10,opacity:.5}}>🗑</button>
                      </div>
                      <div style={{fontSize:8,color:T.muted,marginTop:4}}>{timeAgo(nb.updated_at)}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>}
      </div>}
    </div>
  )
}
