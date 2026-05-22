import { useParams, useNavigate } from "react-router-dom"
import useAppStore from "@/stores/useAppStore"
import { useRef, useState, useEffect, useCallback } from "react"

const BRUSHES = [{id:"stylo",n:"Stylo",s:2.5},{id:"crayon",n:"Crayon",s:1.5},{id:"feutre",n:"Feutre",s:5},{id:"eraser",n:"Gomme",s:10}]
const COLORS = ["#1c1c24","#c8622a","#3d6b8c","#e94560","#4a7c59","#ff6b35","#4ade80","#60a5fa","#f5a623","#fff"]

export default function EditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getTheme, activeNotebook } = useAppStore()
  const T = getTheme()
  const cRef = useRef()
  const drawing = useRef(false)
  const strokes = useRef([])
  const cur = useRef([])
  const [tool, setTool] = useState("stylo")
  const [color, setColor] = useState("#1c1c24")
  const [brush, setBrush] = useState("stylo")
  const nb = activeNotebook || {title:"Carnet",pages:1}

  const getP = e => {
    const r = cRef.current.getBoundingClientRect()
    return {x:((e.touches?e.touches[0].clientX:e.clientX)-r.left)*(794/r.width),y:((e.touches?e.touches[0].clientY:e.clientY)-r.top)*(1123/r.height)}
  }
  const redraw = useCallback(()=>{
    const c=cRef.current;if(!c)return
    const ctx=c.getContext("2d");ctx.clearRect(0,0,794,1123)
    strokes.current.forEach(s=>{if(s.pts.length<2)return;ctx.beginPath();ctx.strokeStyle=s.color;ctx.lineWidth=s.size;ctx.lineCap="round";ctx.lineJoin="round";ctx.globalCompositeOperation=s.tool==="eraser"?"destination-out":"source-over";ctx.globalAlpha=s.tool==="highlight"?.4:1;ctx.moveTo(s.pts[0].x,s.pts[0].y);s.pts.forEach(p=>ctx.lineTo(p.x,p.y));ctx.stroke()});ctx.globalCompositeOperation="source-over";ctx.globalAlpha=1
  },[])
  const dn=e=>{e.preventDefault();drawing.current=true;cur.current=[getP(e)]}
  const mv=e=>{if(!drawing.current)return;e.preventDefault();const p=getP(e);cur.current.push(p);const c=cRef.current;const ctx=c.getContext("2d");const pts=cur.current;if(pts.length<2)return;const sz=BRUSHES.find(b=>b.id===brush)?.s||2.5;ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=sz;ctx.lineCap="round";ctx.lineJoin="round";ctx.globalCompositeOperation=brush==="eraser"?"destination-out":"source-over";ctx.moveTo(pts[pts.length-2].x,pts[pts.length-2].y);ctx.lineTo(pts[pts.length-1].x,pts[pts.length-1].y);ctx.stroke();ctx.globalCompositeOperation="source-over"}
  const up=()=>{if(!drawing.current)return;drawing.current=false;const sz=BRUSHES.find(b=>b.id===brush)?.s||2.5;strokes.current.push({pts:[...cur.current],color,size:sz,tool:brush});cur.current=[]}

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:T.bg,fontFamily:"Nunito,sans-serif",overflow:"hidden"}}>
      <div style={{height:50,background:T.panel,display:"flex",alignItems:"center",padding:"0 14px",gap:10,flexShrink:0}}>
        <button onClick={()=>navigate("/")} style={{background:"none",border:"none",color:"#888",cursor:"pointer",fontSize:13}}>← Retour</button>
        <div style={{flex:1,fontFamily:"Syne,sans-serif",fontWeight:600,fontSize:14,color:"#ddd",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{nb.title}</div>
        <button onClick={()=>{strokes.current=[];redraw();}} style={{padding:"4px 12px",borderRadius:7,border:"1px solid #ffffff18",background:"#ffffff0a",color:"#888",cursor:"pointer",fontSize:11}}>🗑 Effacer</button>
      </div>
      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        <div style={{width:56,background:T.surface,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",alignItems:"center",padding:"10px 0",gap:4,flexShrink:0}}>
          {BRUSHES.map(b=>(
            <button key={b.id} title={b.n} onClick={()=>setBrush(b.id)}
              style={{width:44,height:44,borderRadius:10,background:brush===b.id?`${T.accent}18`:"transparent",border:`1px solid ${brush===b.id?T.accent:T.border}`,cursor:"pointer",fontSize:11,color:brush===b.id?T.accent:T.muted}}>
              {b.n}
            </button>
          ))}
          <div style={{width:32,height:1,background:T.border,margin:"6px 0"}}/>
          {COLORS.map(c=>(
            <button key={c} onClick={()=>setColor(c)}
              style={{width:c===color?24:18,height:c===color?24:18,borderRadius:"50%",background:c,border:`2px solid ${c===color?T.accent:"transparent"}`,cursor:"pointer",outline:c==="#fff"?`1px solid ${T.border}`:"none",flexShrink:0}}/>
          ))}
          <div style={{width:32,height:1,background:T.border,margin:"6px 0"}}/>
          <button onClick={()=>{strokes.current.pop();redraw();}} style={{width:44,height:36,borderRadius:8,background:"transparent",border:"none",color:T.muted,cursor:"pointer",fontSize:16}}>↩</button>
        </div>
        <div style={{flex:1,overflow:"auto",background:T.bg,display:"flex",justifyContent:"center",alignItems:"flex-start",padding:"20px"}}>
          <div style={{transform:"scale(0.85)",transformOrigin:"top center",flexShrink:0}}>
            <div style={{width:794,height:1123,position:"relative",boxShadow:"0 4px 40px rgba(0,0,0,.2)"}}>
              <svg style={{position:"absolute",inset:0,pointerEvents:"none"}} width={794} height={1123}>
                <rect width={794} height={1123} fill={T.paper}/>
                {Array.from({length:30},(_,i)=><line key={i} x1={0} y1={37.8*(i+1)} x2={794} y2={37.8*(i+1)} stroke={T.grid} strokeWidth={0.5}/>)}
                {Array.from({length:20},(_,i)=><line key={i} x1={37.8*(i+1)} y1={0} x2={37.8*(i+1)} y2={1123} stroke={T.grid} strokeWidth={0.5}/>)}
              </svg>
              <canvas ref={cRef} width={794} height={1123}
                style={{position:"absolute",inset:0,width:"100%",height:"100%",cursor:brush==="eraser"?"cell":"crosshair",touchAction:"none",zIndex:5}}
                onMouseDown={dn} onMouseMove={mv} onMouseUp={up} onMouseLeave={up}
                onTouchStart={dn} onTouchMove={mv} onTouchEnd={up}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
