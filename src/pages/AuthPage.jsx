import { useState } from "react"
import { useNavigate } from "react-router-dom"
import useAppStore from "@/stores/useAppStore"

export default function AuthPage() {
  const navigate = useNavigate()
  const { getTheme } = useAppStore()
  const T = getTheme()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Nunito,sans-serif"}}>
      <div style={{background:T.surface,borderRadius:20,padding:32,width:380,maxWidth:"90vw",border:`1px solid ${T.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:28}}>
          <div style={{width:42,height:42,borderRadius:11,background:T.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🏛</div>
          <div>
            <div style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:22,color:T.ink}}>ArchNote</div>
            <div style={{fontSize:11,color:T.muted}}>Smart Notebook for Architecture</div>
          </div>
        </div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,color:T.muted,marginBottom:5,fontWeight:700}}>EMAIL</div>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="ton@email.com" type="email"
            style={{width:"100%",padding:"11px 13px",borderRadius:10,border:`1px solid ${T.border}`,fontSize:14,outline:"none",color:T.ink,background:T.bg,boxSizing:"border-box"}}/>
        </div>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,color:T.muted,marginBottom:5,fontWeight:700}}>MOT DE PASSE</div>
          <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" type="password"
            style={{width:"100%",padding:"11px 13px",borderRadius:10,border:`1px solid ${T.border}`,fontSize:14,outline:"none",color:T.ink,background:T.bg,boxSizing:"border-box"}}/>
        </div>
        <button onClick={()=>navigate("/")}
          style={{width:"100%",padding:13,borderRadius:11,background:T.accent,border:"none",color:"#fff",fontWeight:700,fontSize:15,cursor:"pointer",marginBottom:12}}>
          Se connecter →
        </button>
        <button onClick={()=>navigate("/")}
          style={{width:"100%",padding:13,borderRadius:11,background:"transparent",border:`1px solid ${T.border}`,color:T.muted,fontWeight:600,fontSize:14,cursor:"pointer"}}>
          Continuer sans compte
        </button>
      </div>
    </div>
  )
}
