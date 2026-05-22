import { useState } from "react"
import useAppStore from "@/stores/useAppStore"
import { useNavigate } from "react-router-dom"

const SUBJECTS = [
  {id:"arch",l:"Architecture",c:"#c8622a",e:"🏛"},
  {id:"struct",l:"Structure",c:"#3d6b8c",e:"⚙"},
  {id:"english",l:"Anglais",c:"#4a7c59",e:"🇬🇧"},
  {id:"math",l:"Mathématiques",c:"#3d5c8c",e:"📐"},
  {id:"french",l:"Français",c:"#8c3d6b",e:"📖"},
]

const MOCK = [
  {id:"1",title:"Maison Unifamiliale",subject:"arch",template:"plan",pages:18,starred:true,modified:"Aujourd'hui"},
  {id:"2",title:"Calcul des Charges",subject:"struct",template:"grid10",pages:12,starred:false,modified:"Hier"},
  {id:"3",title:"Technical English B2",subject:"english",template:"lined",pages:8,starred:false,modified:"20 mai"},
  {id:"4",title:"Mathématiques",subject:"math",template:"math",pages:22,starred:true,modified:"18 mai"},
]

export default function LibraryPage() {
  const navigate = useNavigate()
  const { getTheme, setActiveNotebook } = useAppStore()
  const T = getTheme()
  const [notebooks, setNotebooks] = useState(MOCK)
  const [search, setSearch] = useState("")

  const filtered = notebooks.filter(n => n.title.toLowerCase().includes(search.toLowerCase()))

  const open = (nb) => {
    setActiveNotebook(nb)
    navigate(`/editor/${nb.id}`)
  }

  return (
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"Nunito,sans-serif",color:T.ink}}>
      <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:"0 24px",position:"sticky",top:0,zIndex:20}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",height:60}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:40,height:40,borderRadius:11,background:T.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🏛</div>
            <div>
              <div style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:21,color:T.ink}}>ArchNote</div>
              <div style={{fontSize:10,color:T.muted}}>Smart Notebook · Architecture & Plus</div>
            </div>
          </div>
          <button onClick={()=>{const nb={id:Date.now().toString(),title:"Nouveau carnet",subject:"arch",template:"plan",pages:1,starred:false,modified:"Maintenant"};setNotebooks(p=>[nb,...p]);open(nb);}}
            style={{padding:"8px 16px",borderRadius:9,background:T.accent,border:"none",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>
            + Nouveau carnet
          </button>
        </div>
      </div>
      <div style={{padding:"20px 24px"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher..."
          style={{width:"100%",padding:"11px 14px",borderRadius:11,border:`1px solid ${T.border}`,background:T.surface,fontSize:14,outline:"none",color:T.ink,marginBottom:20,boxSizing:"border-box"}}/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:13}}>
          {filtered.map(nb=>{
            const s=SUBJECTS.find(s=>s.id===nb.subject)||SUBJECTS[0]
            return(
              <div key={nb.id} onClick={()=>open(nb)}
                style={{borderRadius:15,background:T.surface,border:`1px solid ${T.border}`,overflow:"hidden",cursor:"pointer",transition:"all .22s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=s.c+"66";e.currentTarget.style.transform="translateY(-3px)"}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.transform="none"}}>
                <div style={{height:90,background:`linear-gradient(135deg,${s.c}22,${s.c}06)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:34,borderBottom:`1px solid ${T.border}`}}>
                  {s.e}
                </div>
                <div style={{padding:"11px 14px"}}>
                  <div style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:12,color:T.ink,marginBottom:5}}>{nb.title}</div>
                  <div style={{display:"flex",gap:5,alignItems:"center"}}>
                    <div style={{padding:"2px 7px",borderRadius:20,background:s.c+"18",color:s.c,fontSize:9,fontWeight:700}}>{s.l}</div>
                    <div style={{fontSize:9,color:T.muted}}>{nb.pages}p · {nb.modified}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
