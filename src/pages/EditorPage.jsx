import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import useAppStore from "@/stores/useAppStore"
import { supabase } from "@/lib/supabase"

/* ── PALETTES ──────────────────────────────────────────────── */
const CPAL = {
  "Basique":  ["#000000","#1a1a1a","#333333","#555555","#888888","#aaaaaa","#cccccc","#ffffff"],
  "Chauds":   ["#c8622a","#e94560","#ff6b35","#ff9f1c","#ffd60a","#c9a84c","#8b4513","#d4a017"],
  "Froids":   ["#3d6b8c","#2196f3","#00bcd4","#26a69a","#4a7c59","#2d6a4f","#52b788","#1a6b8c"],
  "Néon":     ["#00ffcc","#ff00ff","#ffff00","#00ff00","#ff6600","#ff0066","#0066ff","#cc00ff"],
  "Pastel":   ["#ffb3ba","#ffdfba","#ffffba","#baffc9","#bae1ff","#d4baff","#ffd4ba","#c9ffba"],
  "Archi":    ["#c8622a","#3d6b8c","#4a7c59","#8b4513","#546e7a","#7c3aed","#c73e1d","#2d6a4f"],
  "Bois":     ["#c8a96a","#b8904a","#a0722a","#8B6914","#6b4c1e","#4a3010","#deb887","#d2691e"],
  "Métal":    ["#607d8b","#546e7a","#78909c","#b0bec5","#37474f","#90a4ae","#455a64","#cfd8dc"],
  "Nature":   ["#2d6a4f","#52b788","#95d5b2","#d8f3dc","#74c69d","#1b4332","#40916c","#081c15"],
  "Sunset":   ["#ff6b35","#ff9f1c","#ffd60a","#c73e1d","#ef233c","#8d0801","#f4a261","#e76f51"],
  "Nuit":     ["#0d1117","#161b22","#58a6ff","#3fb950","#f78166","#d2a8ff","#ffa657","#79c0ff"],
  "Plans":    ["#1a1a1a","#c8622a","#3d6b8c","#e94560","#4a7c59","#ff6b35","#7c3aed","#2196f3"],
}
const HPAL = {
  "Standards": ["#ffff00","#ff9f1c","#00ff88","#00cfff","#ff00ff","#ff3366"],
  "Doux":      ["#fff176","#ffe082","#a5d6a7","#80deea","#ce93d8","#f48fb1"],
  "Néon":      ["#00ffcc","#ff00ff","#ffff00","#00ff00","#ff6600","#0066ff"],
  "Pastel":    ["#ffcccc","#ffd9b3","#ffffcc","#ccffcc","#ccf2ff","#e6ccff"],
  "Archi":     ["#ffe066","#ffd6b0","#b3f0d9","#b3d9ff","#f0b3ff","#ffb3c1"],
}
const BRUSHES = [
  {id:"fineliner",n:"Fineliner",s:.5},
  {id:"crayon",   n:"Crayon",   s:1.5},
  {id:"stylo",    n:"Stylo",    s:2.5},
  {id:"feutre",   n:"Feutre",   s:5},
  {id:"pinceau",  n:"Pinceau",  s:9},
  {id:"craie",    n:"Craie",    s:14},
  {id:"broad",    n:"Broad",    s:22},
  {id:"custom",   n:"Perso",    s:3},
]
const SCALES_M = ["1:1","1:2","1:5","1:10","1:20","1:50","1:100","1:200","1:500","1:1000"]
const SCALES_I = ['1/4"=1\'','3/16"=1\'','1/8"=1\'','1"=10\'','1"=20\'','1"=40\'','1"=100\'']
const TOOLS = [
  {g:"Sélection",items:[{id:"select",l:"Sélection",i:"↖"},{id:"lasso",l:"Lasso",i:"⬡"}]},
  {g:"Dessin",   items:[{id:"pen",l:"Stylo",i:"✏"},{id:"highlight",l:"Surligneur",i:"▌"},{id:"eraser",l:"Gomme",i:"◻"}]},
  {g:"Formes",   items:[{id:"line",l:"Ligne",i:"/"},{id:"rect",l:"Rectangle",i:"□"},{id:"circle",l:"Cercle",i:"○"}]},
  {g:"Annotation",items:[{id:"text",l:"Texte",i:"T"},{id:"arrow",l:"Flèche",i:"→"},{id:"dim",l:"Cotation",i:"↔"}]},
  {g:"Mesure",   items:[{id:"ruler",l:"Règle",i:"📏"},{id:"protractor",l:"Rapporteur",i:"📐"}]},
]
const STRUCT = {
  "🪵 Bois": [
    {id:"w2x4",l:"2×4",w:38,h:89,type:"wood"},{id:"w2x6",l:"2×6",w:38,h:140,type:"wood"},
    {id:"w2x8",l:"2×8",w:38,h:184,type:"wood"},{id:"w4x4",l:"4×4 Poteau",w:89,h:89,type:"wood"},
    {id:"w6x6",l:"6×6 Poteau",w:140,h:140,type:"wood"},
    {id:"glulam",l:"Glu-Lam 80×240",w:80,h:240,type:"glulam"},
    {id:"lvl",l:"LVL 45×300",w:45,h:300,type:"glulam"},
    {id:"clt120",l:"CLT 120mm",w:120,h:400,type:"clt"},
  ],
  "⚙️ HSS": [
    {id:"hss2",l:"HSS 51×51×3",w:51,h:51,t:3,type:"hss"},
    {id:"hss3",l:"HSS 76×76×5",w:76,h:76,t:5,type:"hss"},
    {id:"hss4",l:"HSS 102×102×5",w:102,h:102,t:5,type:"hss"},
    {id:"hss6",l:"HSS 152×152×6",w:152,h:152,t:6,type:"hss"},
    {id:"hss8",l:"HSS 203×203×10",w:203,h:203,t:10,type:"hss"},
  ],
  "⚙️ Profilés W": [
    {id:"w150",l:"W150×24",w:102,h:160,fw:102,ft:10,wt:6,type:"Ibeam"},
    {id:"w200",l:"W200×36",w:165,h:203,fw:165,ft:12,wt:7,type:"Ibeam"},
    {id:"w250",l:"W250×49",w:202,h:257,fw:202,ft:14,wt:9,type:"Ibeam"},
    {id:"w310",l:"W310×60",w:203,h:303,fw:203,ft:15,wt:8,type:"Ibeam"},
  ],
  "🧱 Béton": [
    {id:"c200",l:"Poteau 200×200",w:200,h:200,type:"conc"},
    {id:"c300",l:"Poteau 300×300",w:300,h:300,type:"conc"},
    {id:"m150",l:"Mur 150mm",w:150,h:600,type:"conc"},
    {id:"m200",l:"Mur 200mm",w:200,h:600,type:"conc"},
  ],
  "🚪 Ouvertures": [
    {id:"d900",l:"Porte 900×2030",w:900,h:2030,type:"door"},
    {id:"d1200",l:"Porte 1200×2100",w:1200,h:2100,type:"door"},
    {id:"w900",l:"Fen. 900×1200",w:900,h:1200,type:"win"},
    {id:"w1200",l:"Fen. 1200×1500",w:1200,h:1500,type:"win"},
  ],
}

const THEMES_LIST = [
  {id:"classic",n:"Classic",e:"📐",bg:"#f5f2ec",surface:"#fff",panel:"#1c1c24",accent:"#c8622a",a2:"#3d6b8c",a3:"#4a7c59",ink:"#1c1c24",muted:"#8a8a96",border:"#ddd8ce",paper:"#fafaf7",grid:"rgba(0,0,0,.07)",pline:"rgba(61,107,140,.1)"},
  {id:"dark",n:"Dark Pro",e:"🌑",bg:"#0e0e14",surface:"#16161f",panel:"#0a0a10",accent:"#e94560",a2:"#60a5fa",a3:"#4ade80",ink:"#e8e8f0",muted:"#4a4a60",border:"#1e1e2e",paper:"#12121a",grid:"rgba(255,255,255,.04)",pline:"rgba(96,165,250,.08)"},
  {id:"neon",n:"Neon",e:"🌈",bg:"#05050f",surface:"#0a0a1a",panel:"#03030a",accent:"#00ffcc",a2:"#ff00ff",a3:"#ffff00",ink:"#e0e0ff",muted:"#3a3a5a",border:"#1a1a3a",paper:"#080814",grid:"rgba(0,255,204,.06)",pline:"rgba(0,255,204,.07)"},
  {id:"arctic",n:"Arctic",e:"❄️",bg:"#eef4fb",surface:"#fff",panel:"#1a2a3a",accent:"#2196f3",a2:"#00bcd4",a3:"#26a69a",ink:"#1a2a3a",muted:"#7a9ab8",border:"#c8ddef",paper:"#f8fbff",grid:"rgba(33,150,243,.08)",pline:"rgba(33,150,243,.1)"},
  {id:"sepia",n:"Sépia",e:"📜",bg:"#f4ede0",surface:"#fdf6ed",panel:"#3d2b1a",accent:"#8b4513",a2:"#6b5a3d",a3:"#5a7a3d",ink:"#3d2b1a",muted:"#9a856a",border:"#d4c4a8",paper:"#fdf6ed",grid:"rgba(139,69,19,.08)",pline:"rgba(139,69,19,.1)"},
  {id:"midnight",n:"Midnight",e:"🌙",bg:"#0d1117",surface:"#161b22",panel:"#0d1117",accent:"#58a6ff",a2:"#3fb950",a3:"#f78166",ink:"#c9d1d9",muted:"#484f58",border:"#21262d",paper:"#1c2128",grid:"rgba(88,166,255,.05)",pline:"rgba(88,166,255,.07)"},
  {id:"sunset",n:"Sunset",e:"🌅",bg:"#fff8f0",surface:"#fff",panel:"#2d1a0e",accent:"#ff6b35",a2:"#ff9f1c",a3:"#c73e1d",ink:"#2d1a0e",muted:"#b08070",border:"#f0d8c8",paper:"#fffaf6",grid:"rgba(255,107,53,.07)",pline:"rgba(255,107,53,.09)"},
  {id:"forest",n:"Forest",e:"🌲",bg:"#f0f5f0",surface:"#fff",panel:"#1a2a1a",accent:"#2d6a4f",a2:"#52b788",a3:"#95d5b2",ink:"#1a2a1a",muted:"#6a8a6a",border:"#c8ddc8",paper:"#f8faf8",grid:"rgba(45,106,79,.08)",pline:"rgba(45,106,79,.09)"},
  {id:"violet",n:"Violet",e:"💜",bg:"#f5f0ff",surface:"#fff",panel:"#1a0a2e",accent:"#7c3aed",a2:"#a855f7",a3:"#ec4899",ink:"#1a0a2e",muted:"#8a6aaa",border:"#d8c8f0",paper:"#fdf8ff",grid:"rgba(124,58,237,.07)",pline:"rgba(124,58,237,.09)"},
  {id:"steel",n:"Steel",e:"⚙️",bg:"#e8ecef",surface:"#f4f6f8",panel:"#1c2833",accent:"#546e7a",a2:"#78909c",a3:"#b0bec5",ink:"#1c2833",muted:"#7a8a94",border:"#cfd8dc",paper:"#f4f6f8",grid:"rgba(84,110,122,.08)",pline:"rgba(84,110,122,.1)"},
  {id:"cherry",n:"Cherry",e:"🍒",bg:"#fff0f3",surface:"#fff",panel:"#2a0a10",accent:"#e01e5a",a2:"#ff6b9d",a3:"#c92842",ink:"#2a0a10",muted:"#b07080",border:"#f0c8d0",paper:"#fff8fa",grid:"rgba(224,30,90,.07)",pline:"rgba(224,30,90,.09)"},
  {id:"sand",n:"Sand",e:"🏜️",bg:"#f5f0e8",surface:"#fff",panel:"#2a2010",accent:"#c9a84c",a2:"#8b7355",a3:"#6b8c3d",ink:"#2a2010",muted:"#9a8a6a",border:"#e0d4b8",paper:"#faf7f0",grid:"rgba(201,168,76,.08)",pline:"rgba(201,168,76,.1)"},
  {id:"slate",n:"Slate Dark",e:"🪨",bg:"#1e2025",surface:"#252830",panel:"#16181c",accent:"#a8b2c4",a2:"#7a8fa8",a3:"#5a9a7a",ink:"#d8dce4",muted:"#5a6070",border:"#30343c",paper:"#2a2d35",grid:"rgba(168,178,196,.05)",pline:"rgba(168,178,196,.07)"},
  {id:"blueprint",n:"Blueprint",e:"🗺️",bg:"#003366",surface:"#004080",panel:"#001f3f",accent:"#ffffff",a2:"#80c0ff",a3:"#40ff80",ink:"#ffffff",muted:"#80a0c0",border:"#005599",paper:"#003d7a",grid:"rgba(255,255,255,.1)",pline:"rgba(255,255,255,.12)"},
  {id:"lemon",n:"Lemon",e:"🍋",bg:"#fffff0",surface:"#fff",panel:"#2a2a0a",accent:"#d4af00",a2:"#a0c000",a3:"#008080",ink:"#2a2a0a",muted:"#9a9a6a",border:"#e8e8c0",paper:"#fffff8",grid:"rgba(212,175,0,.08)",pline:"rgba(212,175,0,.1)"},
]

function renderEl(el,sc=1/50){
  const px=sc*3.78,W=Math.max(el.w*px,4),H=Math.max(el.h*px,4),t=(el.t||6)*px
  if(["wood","glulam","clt"].includes(el.type)){const c=el.type==="wood"?"#c8a96a":el.type==="glulam"?"#b8904a":"#d4b896";return<svg width={W}height={H}style={{display:"block"}}><rect width={W}height={H}fill={c}stroke="#8B6914"strokeWidth={.8}/>{[.25,.5,.75].map(r=><line key={r}x1={W*r}y1={0}x2={W*r}y2={H}stroke="#a07820"strokeWidth={.4}strokeDasharray="3,4"/>)}</svg>}
  if(el.type==="hss")return<svg width={W}height={H}style={{display:"block"}}><rect width={W}height={H}fill="#607d8b"stroke="#37474f"strokeWidth={1}/><rect x={t}y={t}width={Math.max(W-2*t,1)}height={Math.max(H-2*t,1)}fill="white"stroke="#546e7a"strokeWidth={.5}/></svg>
  if(el.type==="Ibeam"){const fw=el.fw?el.fw*px:W,ft2=el.ft?el.ft*px:W*.12,wt2=el.wt?el.wt*px:W*.06;return<svg width={fw}height={H}style={{display:"block"}}><rect x={0}y={0}width={fw}height={ft2}fill="#546e7a"stroke="#37474f"strokeWidth={.8}/><rect x={(fw-wt2)/2}y={ft2}width={wt2}height={Math.max(H-2*ft2,1)}fill="#607d8b"stroke="#37474f"strokeWidth={.8}/><rect x={0}y={H-ft2}width={fw}height={ft2}fill="#546e7a"stroke="#37474f"strokeWidth={.8}/></svg>}
  if(el.type==="conc")return<svg width={W}height={H}style={{display:"block"}}><rect width={W}height={H}fill="#c0c0c0"stroke="#888"strokeWidth={1}/><line x1={0}y1={0}x2={W}y2={H}stroke="#aaa"strokeWidth={.6}/><line x1={W}y1={0}x2={0}y2={H}stroke="#aaa"strokeWidth={.6}/></svg>
  if(el.type==="door")return<svg width={W}height={H}style={{display:"block"}}><rect width={W}height={H}fill="rgba(200,160,80,.12)"stroke="#8b6f47"strokeWidth={1.5}/><path d={`M ${W*.05},${H*.97} A ${W*.9},${H*.9} 0 0 1 ${W*.95},${H*.97}`}fill="none"stroke="#8b6f47"strokeWidth={.8}strokeDasharray="3,2"/><circle cx={W*.85}cy={H*.5}r={W*.05}fill="#c8622a"/></svg>
  if(el.type==="win")return<svg width={W}height={H}style={{display:"block"}}><rect width={W}height={H}fill="rgba(122,181,212,.25)"stroke="#4a90b8"strokeWidth={1.5}/><line x1={W/2}y1={0}x2={W/2}y2={H}stroke="#4a90b8"strokeWidth={.8}/><line x1={0}y1={H/2}x2={W}y2={H/2}stroke="#4a90b8"strokeWidth={.8}/></svg>
  return<div style={{width:Math.max(W,4),height:Math.max(H,4),background:"#ccc",border:"1px solid #999",fontSize:8}}>{el.l}</div>
}

function Paper({tmpl,T}){
  const W=794,H=1123,L=[]
  const grid=(gap,col,sw)=>{for(let x=0;x<=W;x+=gap)L.push(<line key={`v${x}${sw}`}x1={x}y1={0}x2={x}y2={H}stroke={col}strokeWidth={sw}/>);for(let y=0;y<=H;y+=gap)L.push(<line key={`h${y}${sw}`}x1={0}y1={y}x2={W}y2={y}stroke={col}strokeWidth={sw}/>)}
  if(tmpl==="grid5"){grid(18.9,T.grid,.5);grid(94.5,T.pline,.9)}
  if(tmpl==="grid10"){grid(37.8,T.grid,.5);grid(189,T.pline,.9)}
  if(tmpl==="math"){grid(28.35,T.grid,.5);grid(141.75,T.pline,.9)}
  if(tmpl==="dotted"){for(let x=26;x<W;x+=26)for(let y=26;y<H;y+=26)L.push(<circle key={`d${x}${y}`}cx={x}cy={y}r={1}fill={T.muted}opacity={.3}/>)}
  if(tmpl==="lined"){for(let y=72;y<H;y+=28)L.push(<line key={`l${y}`}x1={52}y1={y}x2={W-52}y2={y}stroke="rgba(100,120,255,.1)"strokeWidth={.9}/>);L.push(<line key="lm"x1={90}y1={0}x2={90}y2={H}stroke="rgba(255,80,80,.15)"strokeWidth={1}/>)}
  if(tmpl==="cornell"){for(let y=80;y<H-100;y+=28)L.push(<line key={`cl${y}`}x1={200}y1={y}x2={W-48}y2={y}stroke="rgba(100,120,255,.1)"strokeWidth={.9}/>);L.push(<line key="cv"x1={190}y1={70}x2={190}y2={H-100}stroke="rgba(200,80,80,.2)"strokeWidth={1}/>);L.push(<line key="ch"x1={40}y1={H-100}x2={W-40}y2={H-100}stroke="rgba(200,80,80,.2)"strokeWidth={1}/>)}
  if(tmpl==="isometric"){const s=37.8;for(let i=-H;i<W+H;i+=s){L.push(<line key={`a${i}`}x1={i}y1={0}x2={i+H}y2={H}stroke={T.grid}strokeWidth={.5}/>);L.push(<line key={`b${i}`}x1={i}y1={0}x2={i-H}y2={H}stroke={T.grid}strokeWidth={.5}/>)}}
  if(["plan","elevation","section","detail"].includes(tmpl)){grid(37.8,T.pline,.5);grid(189,T.grid,.9);L.push(<rect key="tb"x={20}y={H-92}width={W-40}height={82}fill="none"stroke={T.pline}strokeWidth={1}/>);L.push(<rect key="b1"x={12}y={12}width={W-24}height={H-24}fill="none"stroke={T.pline}strokeWidth={1.5}/>)}
  if(tmpl==="music"){for(let y=80;y<H-60;y+=70)for(let s=0;s<5;s++)L.push(<line key={`ms${y}${s}`}x1={40}y1={y+s*9}x2={W-40}y2={y+s*9}stroke="rgba(0,0,0,.2)"strokeWidth={.9}/>)}
  return<svg style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:0}}width={W}height={H}><rect width={W}height={H}fill={T.paper}/>{L}</svg>
}

function DrawCanvas({tool,color,size,cRef,onStroke}){
  const drawing=useRef(false),strokes=useRef([]),cur=useRef([])
  const redraw=useCallback(()=>{
    const c=cRef.current;if(!c)return
    const ctx=c.getContext("2d");ctx.clearRect(0,0,794,1123)
    strokes.current.forEach(s=>{
      if(s.pts.length<2)return
      ctx.beginPath();ctx.strokeStyle=s.color;ctx.lineWidth=s.size
      ctx.lineCap="round";ctx.lineJoin="round"
      ctx.globalAlpha=s.tool==="highlight"?.4:1
      ctx.globalCompositeOperation=s.tool==="eraser"?"destination-out":"source-over"
      ctx.moveTo(s.pts[0].x,s.pts[0].y)
      s.pts.forEach(p=>ctx.lineTo(p.x,p.y))
      ctx.stroke()
    })
    ctx.globalCompositeOperation="source-over";ctx.globalAlpha=1
  },[cRef])

  const gP=e=>{
    const r=cRef.current.getBoundingClientRect()
    return{x:((e.touches?e.touches[0].clientX:e.clientX)-r.left)*(794/r.width),
           y:((e.touches?e.touches[0].clientY:e.clientY)-r.top)*(1123/r.height)}
  }
  const dn=e=>{e.preventDefault();drawing.current=true;cur.current=[gP(e)]}
  const mv=e=>{
    if(!drawing.current)return;e.preventDefault()
    const p=gP(e);cur.current.push(p)
    const c=cRef.current;const ctx=c.getContext("2d");const pts=cur.current
    if(pts.length<2)return
    ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=size
    ctx.lineCap="round";ctx.lineJoin="round"
    ctx.globalAlpha=tool==="highlight"?.4:1
    ctx.globalCompositeOperation=tool==="eraser"?"destination-out":"source-over"
    ctx.moveTo(pts[pts.length-2].x,pts[pts.length-2].y)
    ctx.lineTo(pts[pts.length-1].x,pts[pts.length-1].y)
    ctx.stroke();ctx.globalCompositeOperation="source-over";ctx.globalAlpha=1
  }
  const up=()=>{
    if(!drawing.current)return
    drawing.current=false
    const stroke={pts:[...cur.current],color,size,tool}
    strokes.current.push(stroke)
    cur.current=[]
    if(onStroke) onStroke(strokes.current)
  }

  // Load strokes from Supabase data
  const loadStrokes=(data)=>{
    if(!data)return
    try{
      const parsed=typeof data==="string"?JSON.parse(data):data
      strokes.current=parsed||[]
      redraw()
    }catch{}
  }

  useEffect(()=>{
    window.__undo=()=>{strokes.current.pop();redraw();if(onStroke)onStroke(strokes.current)}
    window.__clear=()=>{strokes.current=[];redraw();if(onStroke)onStroke(strokes.current)}
    window.__loadStrokes=loadStrokes
  },[redraw])

  return<canvas ref={cRef}width={794}height={1123}
    style={{position:"absolute",inset:0,width:"100%",height:"100%",
            cursor:tool==="eraser"?"cell":"crosshair",touchAction:"none",zIndex:5}}
    onMouseDown={dn}onMouseMove={mv}onMouseUp={up}onMouseLeave={up}
    onTouchStart={dn}onTouchMove={mv}onTouchEnd={up}/>
}

export default function EditorPage() {
  const navigate = useNavigate()
  const { activeNotebook, getTheme, setTheme } = useAppStore()
  const [localTheme, setLocalTheme] = useState(null)
  const T = localTheme || getTheme()
  const nb = activeNotebook || {id:"1",title:"Carnet",subject:"arch",template:"plan",pages_count:1}
  const cRef = useRef()

  const [tool, setTool] = useState("pen")
  const [leftTab, setLeftTab] = useState("tools")
  const [cPal, setCPal] = useState("Basique")
  const [color, setColor] = useState("#1c1c24")
  const [hPal, setHPal] = useState("Standards")
  const [hColor, setHColor] = useState("#ffff00")
  const [brush, setBrush] = useState("stylo")
  const [customSz, setCustomSz] = useState(3)
  const [unitSys, setUnitSys] = useState("metric")
  const [scale, setScale] = useState("1:50")
  const [zoom, setZoom] = useState(.85)
  const [showLib, setShowLib] = useState(false)
  const [showTheme, setShowTheme] = useState(false)
  const [libCat, setLibCat] = useState("🪵 Bois")
  const [libSearch, setLibSearch] = useState("")
  const [placed, setPlaced] = useState([])
  const [selected, setSelected] = useState(null)
  const [page, setPage] = useState(1)
  const [showRuler, setShowRuler] = useState(false)
  const [showProt, setShowProt] = useState(false)
  const [layers, setLayers] = useState([
    {id:"sketch",n:"Esquisse",v:true,locked:false},
    {id:"annot",n:"Annotations",v:true,locked:false},
    {id:"struct",n:"Structure",v:true,locked:false},
  ])
  const [showLayers, setShowLayers] = useState(false)
  const [saveStatus, setSaveStatus] = useState("idle") // idle | saving | saved | error
  const [pageId, setPageId] = useState(null)
  const saveTimer = useRef(null)

  const sz = brush==="custom" ? customSz : BRUSHES.find(b=>b.id===brush)?.s||2.5
  const activeColor = tool==="highlight" ? hColor : color
  const libItems = useMemo(()=>(STRUCT[libCat]||[]).filter(e=>!libSearch||e.l.toLowerCase().includes(libSearch.toLowerCase())),[libCat,libSearch])

  // Load page data on mount
  useEffect(()=>{
    const loadPage = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) return

        // Get or create page 1
        const { data: existingPage } = await supabase
          .from("pages")
          .select("*")
          .eq("notebook_id", nb.id)
          .eq("page_number", 1)
          .single()

        if (existingPage) {
          setPageId(existingPage.id)
          // Load strokes
          if (existingPage.canvas_data && window.__loadStrokes) {
            window.__loadStrokes(existingPage.canvas_data)
          }
          // Load placed elements
          if (existingPage.elements) {
            setPlaced(typeof existingPage.elements === "string"
              ? JSON.parse(existingPage.elements)
              : existingPage.elements || [])
          }
        } else {
          // Create page
          const { data: newPage } = await supabase
            .from("pages")
            .insert([{ notebook_id: nb.id, page_number: 1, user_id: session.user.id }])
            .select()
            .single()
          if (newPage) setPageId(newPage.id)
        }
      } catch (err) {
        console.log("Load page error:", err.message)
      }
    }
    loadPage()
  }, [nb.id])

  // Auto-save strokes with debounce
  const saveStrokes = useCallback(async (strokes) => {
    if (!pageId) return
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      setSaveStatus("saving")
      await supabase
        .from("pages")
        .update({
          canvas_data: JSON.stringify(strokes),
          elements: JSON.stringify(placed),
          updated_at: new Date().toISOString()
        })
        .eq("id", pageId)

      // Update notebook updated_at
      await supabase
        .from("notebooks")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", nb.id)

      setSaveStatus("saved")
      setTimeout(() => setSaveStatus("idle"), 2000)
    } catch {
      setSaveStatus("error")
      setTimeout(() => setSaveStatus("idle"), 3000)
    }
  }, [pageId, placed, nb.id])

  const onStroke = useCallback((strokes) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveStrokes(strokes), 1500)
  }, [saveStrokes])

  const dropEl=(el,x,y)=>setPlaced(p=>[...p,{id:Date.now(),el,x:x-20,y:y-20}])

  const changeTheme=(th)=>{setLocalTheme(th);setTheme(th.id)}

  const saveStatusLabel = {
    idle: "",
    saving: "⏳ Sauvegarde...",
    saved: "✓ Sauvegardé",
    error: "⚠ Erreur sauvegarde"
  }[saveStatus]

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:T.bg,fontFamily:"'Nunito',sans-serif",overflow:"hidden",color:T.ink}}>

      {/* THEME PICKER */}
      {showTheme&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}}>
          <div style={{background:"#fff",borderRadius:20,padding:24,width:560,maxWidth:"94vw",maxHeight:"82vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.25)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:18}}>🎨 Thèmes ({THEMES_LIST.length})</div>
              <button onClick={()=>setShowTheme(false)} style={{background:"none",border:"none",cursor:"pointer",fontSize:22,color:"#888"}}>×</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
              {THEMES_LIST.map(th=>(
                <button key={th.id} onClick={()=>{changeTheme(th);setShowTheme(false)}}
                  style={{padding:0,border:`2px solid ${T.id===th.id?"#c8622a":"#eee"}`,borderRadius:14,overflow:"hidden",cursor:"pointer",background:"none"}}>
                  <div style={{height:48,background:`linear-gradient(135deg,${th.panel},${th.surface})`,display:"flex",alignItems:"center",gap:8,padding:"0 12px"}}>
                    <span style={{fontSize:16}}>{th.e}</span>
                    {[th.accent,th.a2,th.a3].map((c,i)=><div key={i}style={{width:10-i*2,height:10-i*2,borderRadius:2,background:c}}/>)}
                  </div>
                  <div style={{padding:"6px 10px",background:th.bg}}>
                    <div style={{fontSize:11,fontWeight:700,color:th.ink,fontFamily:"'Syne',sans-serif"}}>{th.n}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TOP BAR */}
      <div style={{height:50,background:T.panel,display:"flex",alignItems:"center",padding:"0 12px",gap:8,flexShrink:0,boxShadow:"0 2px 16px rgba(0,0,0,.3)",zIndex:30}}>
        <button onClick={()=>navigate("/")} style={{background:"none",border:"none",color:"#888",cursor:"pointer",fontSize:12,padding:"5px 8px",borderRadius:7}}>← Retour</button>
        <div style={{width:1,height:24,background:"#ffffff14"}}/>
        <div style={{flex:1,fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:13,color:"#ddd",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{nb.title}</div>
        <div style={{display:"flex",gap:5,alignItems:"center"}}>
          {saveStatusLabel && (
            <div style={{fontSize:10,color:saveStatus==="saved"?"#4ade80":saveStatus==="error"?"#e94560":"#888",padding:"3px 8px",borderRadius:6,background:"#ffffff08"}}>
              {saveStatusLabel}
            </div>
          )}
          <div style={{display:"flex",borderRadius:7,overflow:"hidden",border:"1px solid #ffffff14"}}>
            <button onClick={()=>{setUnitSys("metric");setScale("1:50")}} style={{padding:"4px 9px",background:unitSys==="metric"?"rgba(200,98,42,.4)":"transparent",border:"none",color:unitSys==="metric"?"#fff":"#777",cursor:"pointer",fontSize:10}}>mm</button>
            <button onClick={()=>{setUnitSys("imperial");setScale('1/4"=1\'')}} style={{padding:"4px 9px",background:unitSys==="imperial"?"rgba(200,98,42,.4)":"transparent",border:"none",color:unitSys==="imperial"?"#fff":"#777",cursor:"pointer",fontSize:10}}>in</button>
          </div>
          <select value={scale} onChange={e=>setScale(e.target.value)} style={{padding:"4px 7px",borderRadius:7,border:"1px solid #ffffff14",background:"#ffffff0c",color:"#aaa",fontSize:10,outline:"none",cursor:"pointer"}}>
            {(unitSys==="metric"?SCALES_M:SCALES_I).map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <div style={{display:"flex",alignItems:"center",gap:3,background:"#ffffff0a",borderRadius:7,padding:"0 8px",border:"1px solid #ffffff10"}}>
            <button onClick={()=>setZoom(z=>Math.max(.25,z-.1))} style={{background:"none",border:"none",color:"#aaa",cursor:"pointer",fontSize:15}}>−</button>
            <span style={{color:"#666",fontSize:10,minWidth:30,textAlign:"center"}}>{Math.round(zoom*100)}%</span>
            <button onClick={()=>setZoom(z=>Math.min(3,z+.1))} style={{background:"none",border:"none",color:"#aaa",cursor:"pointer",fontSize:15}}>+</button>
          </div>
          <button onClick={()=>setShowLib(v=>!v)} style={{padding:"4px 10px",borderRadius:7,border:`1px solid ${showLib?T.accent:"#ffffff14"}`,background:showLib?`${T.accent}22`:"#ffffff0a",color:showLib?T.accent:"#888",cursor:"pointer",fontSize:10}}>🏗 Biblio</button>
          <button onClick={()=>setShowLayers(v=>!v)} style={{padding:"4px 10px",borderRadius:7,border:`1px solid ${showLayers?"#60a5fa":"#ffffff14"}`,background:showLayers?"rgba(96,165,250,.15)":"#ffffff0a",color:showLayers?"#60a5fa":"#888",cursor:"pointer",fontSize:10}}>⊞ Calques</button>
          <button onClick={()=>setShowTheme(true)} style={{padding:"4px 10px",borderRadius:7,border:"1px solid #ffffff14",background:"#ffffff0a",color:"#888",cursor:"pointer",fontSize:10}}>🎨 Thème</button>
          <button onClick={()=>window.__clear?.()} style={{padding:"4px 10px",borderRadius:7,border:"1px solid rgba(233,69,96,.3)",background:"rgba(233,69,96,.1)",color:"#e94560",cursor:"pointer",fontSize:10}}>🗑</button>
        </div>
      </div>

      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        {/* LEFT TOOLBAR */}
        <div style={{width:56,background:T.surface,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",alignItems:"center",padding:"8px 0",gap:2,flexShrink:0,overflowY:"auto"}}>
          <div style={{display:"flex",width:"100%",borderBottom:`1px solid ${T.border}`,marginBottom:4,paddingBottom:4}}>
            {[["tools","🔧"],["clr","🎨"],["brush","✏"]].map(([t,ic])=>(
              <button key={t} onClick={()=>setLeftTab(t)} style={{flex:1,height:28,background:leftTab===t?`${T.accent}18`:"transparent",border:"none",cursor:"pointer",fontSize:11,color:leftTab===t?T.accent:T.muted}}>{ic}</button>
            ))}
          </div>

          {leftTab==="tools"&&TOOLS.map(grp=>(
            <div key={grp.g} style={{width:"100%",paddingBottom:4,marginBottom:2,borderBottom:`1px solid ${T.border}`}}>
              <div style={{fontSize:7,color:T.muted,textAlign:"center",marginBottom:2,marginTop:2}}>{grp.g.toUpperCase()}</div>
              {grp.items.map(t=>(
                <button key={t.id} title={t.l} onClick={()=>setTool(t.id)}
                  style={{width:52,height:36,borderRadius:8,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",border:"none",background:tool===t.id?`${T.accent}18`:"transparent",color:tool===t.id?T.accent:T.muted,cursor:"pointer",fontSize:13,gap:1}}>
                  <span>{t.i}</span>
                  <span style={{fontSize:7,opacity:.7}}>{t.l.slice(0,5)}</span>
                </button>
              ))}
            </div>
          ))}

          {leftTab==="clr"&&<>
            <div style={{fontSize:8,color:T.muted,margin:"2px 0 3px"}}>ENCRE</div>
            <select value={cPal} onChange={e=>setCPal(e.target.value)} style={{width:52,fontSize:8,padding:"2px",borderRadius:6,border:`1px solid ${T.border}`,background:T.bg,color:T.muted,outline:"none",cursor:"pointer"}}>
              {Object.keys(CPAL).map(p=><option key={p} value={p}>{p}</option>)}
            </select>
            <div style={{display:"flex",flexWrap:"wrap",width:50,gap:3,justifyContent:"center",marginTop:3}}>
              {CPAL[cPal].map(c=>(
                <button key={c} onClick={()=>setColor(c)} style={{width:c===color?20:16,height:c===color?20:16,borderRadius:"50%",background:c,border:`2px solid ${c===color?T.accent:"transparent"}`,cursor:"pointer",outline:c==="#ffffff"?`1px solid ${T.border}`:"none",flexShrink:0}}/>
              ))}
            </div>
            <div style={{width:44,height:1,background:T.border,margin:"5px 0"}}/>
            <div style={{fontSize:8,color:T.muted,margin:"2px 0 3px"}}>SURLIG.</div>
            <select value={hPal} onChange={e=>setHPal(e.target.value)} style={{width:52,fontSize:8,padding:"2px",borderRadius:6,border:`1px solid ${T.border}`,background:T.bg,color:T.muted,outline:"none",cursor:"pointer"}}>
              {Object.keys(HPAL).map(p=><option key={p} value={p}>{p}</option>)}
            </select>
            <div style={{display:"flex",flexWrap:"wrap",width:50,gap:3,justifyContent:"center",marginTop:3}}>
              {HPAL[hPal].map(c=>(
                <button key={c} onClick={()=>{setHColor(c);setTool("highlight")}} style={{width:c===hColor?20:16,height:c===hColor?20:16,borderRadius:3,background:c+"aa",border:`2px solid ${c===hColor?T.accent:"transparent"}`,cursor:"pointer",flexShrink:0}}/>
              ))}
            </div>
          </>}

          {leftTab==="brush"&&<>
            <div style={{fontSize:8,color:T.muted,margin:"2px 0 4px"}}>PINCEAUX</div>
            {BRUSHES.map(b=>(
              <button key={b.id} title={b.n} onClick={()=>setBrush(b.id)} style={{width:50,height:32,borderRadius:8,background:brush===b.id?`${T.accent}18`:"transparent",border:`1px solid ${brush===b.id?T.accent:T.border}`,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:1}}>
                <div style={{width:Math.min(b.s*1.2+2,34),height:Math.min(b.s*1.2+2,34),borderRadius:"50%",background:color,border:`1px solid ${T.border}`}}/>
                <div style={{fontSize:7,color:T.muted}}>{b.n}</div>
              </button>
            ))}
            {brush==="custom"&&<div style={{padding:"4px",width:"100%"}}><input type="range" min={.5} max={40} step={.5} value={customSz} onChange={e=>setCustomSz(+e.target.value)} style={{width:"100%",accentColor:T.accent}}/><div style={{fontSize:8,color:T.muted,textAlign:"center"}}>{customSz}px</div></div>}
            <div style={{width:44,height:1,background:T.border,margin:"5px 0"}}/>
            <button title="Règle" onClick={()=>setShowRuler(v=>!v)} style={{width:50,height:30,borderRadius:8,background:showRuler?`${T.accent}18`:"transparent",border:`1px solid ${showRuler?T.accent:T.border}`,color:showRuler?T.accent:T.muted,cursor:"pointer",fontSize:13}}>📏</button>
            <button title="Rapporteur" onClick={()=>setShowProt(v=>!v)} style={{width:50,height:30,borderRadius:8,background:showProt?`${T.accent}18`:"transparent",border:`1px solid ${showProt?T.accent:T.border}`,color:showProt?T.accent:T.muted,cursor:"pointer",fontSize:13}}>📐</button>
            <div style={{width:44,height:1,background:T.border,margin:"5px 0"}}/>
            <button onClick={()=>window.__undo?.()} style={{width:50,height:28,borderRadius:8,background:"transparent",border:"none",color:T.muted,cursor:"pointer",fontSize:15}}>↩</button>
            <button onClick={()=>window.__clear?.()} style={{width:50,height:28,borderRadius:8,background:"transparent",border:"none",color:T.muted,cursor:"pointer",fontSize:11}}>🗑 tout</button>
          </>}
        </div>

        {/* CANVAS AREA */}
        <div style={{flex:1,overflow:"auto",background:T.bg,display:"flex",justifyContent:"center",alignItems:"flex-start",padding:"20px"}} id="canvas-area">
          <div style={{transform:`scale(${zoom})`,transformOrigin:"top center",transition:"transform .12s",position:"relative",flexShrink:0}}>
            <div style={{width:794,height:1123,position:"relative",boxShadow:"0 4px 40px rgba(0,0,0,.2)"}}>
              <Paper tmpl={nb.template||"plan"} T={T}/>
              {placed.map(item=>{
                const sel=selected===item.id
                return<div key={item.id} style={{position:"absolute",left:item.x,top:item.y,cursor:"move",pointerEvents:"all",userSelect:"none",outline:sel?"2px solid #c8622a":"none",outlineOffset:2,zIndex:sel?12:10}}
                  onMouseDown={e=>{e.stopPropagation();setSelected(item.id);const ox=e.clientX-item.x,oy=e.clientY-item.y;const mm=ev=>setPlaced(p=>p.map(e=>e.id===item.id?{...e,x:ev.clientX-ox,y:ev.clientY-oy}:e));const mu=()=>{window.removeEventListener("mousemove",mm);window.removeEventListener("mouseup",mu)};window.addEventListener("mousemove",mm);window.addEventListener("mouseup",mu)}}>
                  {renderEl(item.el,1/50)}
                  {sel&&<button onClick={()=>{setPlaced(p=>p.filter(e=>e.id!==item.id));setSelected(null)}} style={{position:"absolute",top:-10,right:-10,width:20,height:20,borderRadius:"50%",background:"#e94560",border:"none",color:"#fff",cursor:"pointer",fontSize:11,fontWeight:700,zIndex:20}}>×</button>}
                </div>
              })}
              {showRuler&&<div style={{position:"absolute",top:0,left:0,right:0,height:26,background:T.surface,borderBottom:`1px solid ${T.border}`,zIndex:15,opacity:.9}}>
                <svg width={794}height={26}style={{display:"block"}}>
                  {Array.from({length:80},(_,i)=>{const x=i*10;const big=i%10===0,med=i%5===0;return<g key={i}><line x1={x}y1={26}x2={x}y2={big?6:med?12:18}stroke={T.muted}strokeWidth={big?1:.5}/>{big&&<text x={x+2}y={9}fontSize={7}fill={T.muted}fontFamily="monospace">{i*(unitSys==="metric"?10:1)}{unitSys==="metric"?"mm":"\"" }</text>}</g>})}
                </svg>
              </div>}
              {showProt&&<div style={{position:"absolute",top:40,right:40,zIndex:15,pointerEvents:"none"}}>
                <svg width={160}height={80}>
                  <path d="M 10,70 A 70,70 0 0 1 150,70" fill="none" stroke={T.accent} strokeWidth={1.5}/>
                  <line x1={80}y1={70}x2={80}y2={10}stroke={T.a2}strokeWidth={1}/>
                  {[0,15,30,45,60,75,90,105,120,135,150,165,180].map(a=>{const r=(180-a)*Math.PI/180;const x=80+70*Math.cos(r),y=70-70*Math.sin(r),ix=80+56*Math.cos(r),iy=70-56*Math.sin(r);return<g key={a}><line x1={ix}y1={iy}x2={x}y2={y}stroke={T.accent}strokeWidth={a%30===0?1.2:.5}/>{a%30===0&&<text x={x}y={y-3}fontSize={7}fill={T.muted}textAnchor="middle"fontFamily="monospace">{a}°</text>}</g>})}
                </svg>
              </div>}
              {["plan","elevation","section","detail"].includes(nb.template)&&(
                <div style={{position:"absolute",bottom:12,left:24,right:24,height:78,pointerEvents:"none",zIndex:6}}>
                  <div style={{position:"absolute",left:6,bottom:28,fontSize:7,fontFamily:"monospace",color:T.pline}}>PROJET</div>
                  <div style={{position:"absolute",left:6,bottom:8,fontSize:11,fontFamily:"'Syne',sans-serif",fontWeight:700,color:T.pline}}>{nb.title}</div>
                  <div style={{position:"absolute",left:298,bottom:28,fontSize:7,fontFamily:"monospace",color:T.pline}}>N° PLANCHE</div>
                  <div style={{position:"absolute",left:298,bottom:8,fontSize:10,color:T.pline}}>{page.toString().padStart(2,"0")}</div>
                  <div style={{position:"absolute",left:548,bottom:28,fontSize:7,fontFamily:"monospace",color:T.pline}}>ÉCHELLE</div>
                  <div style={{position:"absolute",left:548,bottom:8,fontSize:10,color:T.pline}}>{scale}</div>
                </div>
              )}
              <DrawCanvas tool={tool} color={activeColor} size={sz} cRef={cRef} onStroke={onStroke}/>
            </div>
          </div>
        </div>

        {/* CALQUES */}
        {showLayers&&(
          <div style={{width:190,background:T.surface,borderLeft:`1px solid ${T.border}`,display:"flex",flexDirection:"column",flexShrink:0}}>
            <div style={{padding:"12px 14px 10px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:12,color:T.accent}}>Calques</div>
              <button onClick={()=>setLayers(p=>[...p,{id:Date.now(),n:`Calque ${p.length+1}`,v:true,locked:false}])} style={{background:"none",border:"none",cursor:"pointer",color:T.accent,fontSize:18,lineHeight:1}}>+</button>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:8,display:"flex",flexDirection:"column",gap:6}}>
              {layers.map((l,i)=>(
                <div key={l.id} style={{display:"flex",alignItems:"center",gap:7,padding:"8px 10px",borderRadius:9,background:T.bg,border:`1px solid ${T.border}`}}>
                  <button onClick={()=>setLayers(p=>p.map((x,j)=>j===i?{...x,v:!x.v}:x))} style={{background:"none",border:"none",cursor:"pointer",color:l.v?T.accent:T.muted,fontSize:12,flexShrink:0}}>{l.v?"👁":"◻"}</button>
                  <div style={{flex:1,fontSize:11,color:T.ink,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.n}</div>
                  <button onClick={()=>setLayers(p=>p.map((x,j)=>j===i?{...x,locked:!x.locked}:x))} style={{background:"none",border:"none",cursor:"pointer",color:l.locked?T.accent:T.muted,fontSize:10,flexShrink:0}}>{l.locked?"🔒":"🔓"}</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BIBLIOTHÈQUE */}
        {showLib&&(
          <div style={{width:250,background:T.surface,borderLeft:`1px solid ${T.border}`,display:"flex",flexDirection:"column",flexShrink:0}}>
            <div style={{padding:"12px 14px 10px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:12,color:T.accent}}>Bibliothèque</div>
              <button onClick={()=>setShowLib(false)} style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:18}}>×</button>
            </div>
            <div style={{padding:"6px 10px",borderBottom:`1px solid ${T.border}`}}>
              <input value={libSearch} onChange={e=>setLibSearch(e.target.value)} placeholder="Chercher…" style={{width:"100%",padding:"6px 10px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:11,outline:"none",background:T.bg,color:T.ink,boxSizing:"border-box"}}/>
            </div>
            <div style={{overflowX:"auto",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
              <div style={{display:"flex",gap:4,padding:"5px 8px",whiteSpace:"nowrap"}}>
                {Object.keys(STRUCT).map(c=>(
                  <button key={c} onClick={()=>setLibCat(c)} style={{padding:"3px 8px",borderRadius:14,border:`1px solid ${libCat===c?T.accent:T.border}`,background:libCat===c?`${T.accent}15`:"transparent",color:libCat===c?T.accent:T.muted,fontSize:9,cursor:"pointer",whiteSpace:"nowrap"}}>{c}</button>
                ))}
              </div>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:7,display:"flex",flexDirection:"column",gap:5}}>
              {libItems.map(el=>(
                <div key={el.id} draggable
                  onDragEnd={e=>{const r=document.getElementById("canvas-area")?.getBoundingClientRect();if(r)dropEl(el,e.clientX-r.left,e.clientY-r.top)}}
                  style={{padding:"8px 10px",borderRadius:9,border:`1px solid ${T.border}`,background:T.bg,cursor:"grab",display:"flex",alignItems:"center",gap:9,transition:"all .13s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accent}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border}}>
                  <div style={{width:32,height:32,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>{renderEl(el,1/300)}</div>
                  <div>
                    <div style={{fontSize:10,fontWeight:700,color:T.ink,lineHeight:1.2}}>{el.l}</div>
                    <div style={{fontSize:8,color:T.muted,fontFamily:"monospace",marginTop:2}}>{el.w}×{el.h}mm</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{padding:"7px 10px",borderTop:`1px solid ${T.border}`,background:`${T.accent}06`}}>
              <div style={{fontSize:9,color:T.a2,textAlign:"center"}}>⬇ Glissez sur le dessin</div>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM BAR */}
      <div style={{height:38,background:T.surface,borderTop:`1px solid ${T.border}`,display:"flex",alignItems:"center",padding:"0 16px",gap:14,zIndex:20}}>
        <div style={{display:"flex",alignItems:"center",gap:7}}>
          <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{background:"none",border:"none",color:page===1?T.border:T.muted,cursor:page===1?"default":"pointer",fontSize:14}}>‹</button>
          <span style={{fontSize:10,color:T.muted,fontFamily:"monospace"}}>{page.toString().padStart(2,"0")} / {(nb.pages_count||1).toString().padStart(2,"0")}</span>
          <button onClick={()=>setPage(p=>p+1)} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:14}}>›</button>
        </div>
        <div style={{width:1,height:16,background:T.border}}/>
        <div style={{fontSize:10,color:T.muted,fontFamily:"monospace"}}>{tool.toUpperCase()} · {scale} · {Math.round(zoom*100)}%</div>
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:5}}>
          <div style={{width:5,height:5,borderRadius:"50%",background:saveStatus==="saved"?"#4ade80":saveStatus==="saving"?"#f5a623":"#4ade80"}}/>
          <span style={{fontSize:9,color:T.muted}}>{saveStatus==="saving"?"Sauvegarde...":saveStatus==="saved"?"Sauvegardé ✓":"Auto-sauvegarde"}</span>
        </div>
      </div>
    </div>
  )
}
