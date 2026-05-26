import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import useAppStore from "@/stores/useAppStore"
import { supabase } from "@/lib/supabase"
import { THEMES } from "@/lib/themes"

/* ══ PALETTES ═══════════════════════════════════════════ */
const CPAL={
  "⬛ Basique":  ["#000","#222","#444","#666","#888","#aaa","#ccc","#fff"],
  "🔴 Rouges":  ["#ff0000","#e53935","#c62828","#b71c1c","#ff5252","#ff8a80","#ff1744","#d50000"],
  "🟠 Oranges": ["#ff6600","#e65100","#ff7043","#ff8c00","#ff9800","#ffa726","#ffb74d","#ffcc80"],
  "🟡 Jaunes":  ["#ffff00","#ffd600","#ffc107","#ffb300","#ffa000","#fff176","#fff59d","#f9a825"],
  "🟢 Verts":   ["#00e676","#00c853","#1b5e20","#2e7d32","#43a047","#4caf50","#66bb6a","#a5d6a7"],
  "🔵 Bleus":   ["#0000ff","#1565c0","#1976d2","#2196f3","#42a5f5","#64b5f6","#90caf9","#0d47a1"],
  "🟣 Violets": ["#9c27b0","#7b1fa2","#6a1b9a","#ba68c8","#ce93d8","#e1bee7","#ab47bc","#d500f9"],
  "🩷 Roses":   ["#e91e63","#ad1457","#f06292","#f48fb1","#ff4081","#ff80ab","#ff1493","#c2185b"],
  "🏛 Archi":   ["#c8622a","#3d6b8c","#4a7c59","#8b4513","#546e7a","#7c3aed","#c73e1d","#2d6a4f"],
  "🪵 Bois":    ["#c8a96a","#b8904a","#a0722a","#8B6914","#6b4c1e","#4a3010","#deb887","#d2691e"],
  "⚙️ Métal":   ["#607d8b","#546e7a","#78909c","#b0bec5","#37474f","#90a4ae","#455a64","#cfd8dc"],
  "🧱 Béton":   ["#9e9e9e","#bdbdbd","#757575","#616161","#424242","#e0e0e0","#eeeeee","#808080"],
  "🌿 Nature":  ["#2d6a4f","#52b788","#95d5b2","#d8f3dc","#74c69d","#1b4332","#40916c","#081c15"],
  "🌅 Sunset":  ["#ff6b35","#ff9f1c","#ffd60a","#c73e1d","#ef233c","#8d0801","#f4a261","#e76f51"],
  "🌊 Océan":   ["#023e8a","#0077b6","#0096c7","#00b4d8","#48cae4","#90e0ef","#ade8f4","#03045e"],
  "🌸 Sakura":  ["#ffb7c5","#ff69b4","#ff1493","#db7093","#ffc0cb","#ffb6c1","#ff85a1","#e75480"],
  "🍂 Automne": ["#8B4513","#A0522D","#CD853F","#D2691E","#DAA520","#B8860B","#8B6914","#A52A2A"],
  "🎨 Pastel":  ["#ffb3ba","#ffdfba","#ffffba","#baffc9","#bae1ff","#d4baff","#ffd4ba","#c9ffba"],
  "🌙 Nuit":    ["#0d1117","#161b22","#58a6ff","#3fb950","#f78166","#d2a8ff","#ffa657","#79c0ff"],
  "🌈 Néon":    ["#00ffcc","#ff00ff","#ffff00","#00ff00","#ff6600","#ff0066","#0066ff","#cc00ff"],
  "🔥 Feu":     ["#ff0000","#ff3300","#ff6600","#ff9900","#ffcc00","#ffff00","#ff4500","#dc143c"],
  "📐 Plans":   ["#1a1a1a","#c8622a","#3d6b8c","#e94560","#4a7c59","#ff6b35","#7c3aed","#2196f3"],
  "🏗 Structure":["#37474f","#455a64","#546e7a","#607d8b","#78909c","#90a4ae","#b0bec5","#cfd8dc"],
  "💎 Gemmes":  ["#1a0a2e","#4a148c","#7b1fa2","#0d47a1","#1565c0","#006064","#004d40","#1b5e20"],
  "🌺 Tropical":["#ff6b6b","#feca57","#48dbfb","#ff9ff3","#54a0ff","#5f27cd","#01aaa4","#ff9f43"],
  "🇸🇪 Nordique":["#2c3e50","#3498db","#ecf0f1","#95a5a6","#1abc9c","#16a085","#2980b9","#8e44ad"],
  "🌻 Champs":  ["#ffd700","#ffa500","#ff8c00","#228b22","#90ee90","#adff2f","#7fff00","#3cb371"],
  "🍂 Terre":   ["#8b5a2b","#a0522d","#7a5c3a","#6b4423","#c19a6b","#d2a679","#e8c9a0","#f5deb3"],
  "🎭 Pop Art": ["#ff3366","#ff6600","#ffcc00","#33cc33","#3399ff","#cc33ff","#ff0099","#00cccc"],
  "🎹 Piano":   ["#000","#1a1a1a","#333","#666","#999","#ccc","#e0e0e0","#fff"],
}
const HPAL={
  "Standards":["#ffff00","#ff9f1c","#00ff88","#00cfff","#ff00ff","#ff3366"],
  "Doux":     ["#fff176","#ffe082","#a5d6a7","#80deea","#ce93d8","#f48fb1"],
  "Néon":     ["#00ffcc","#ff00ff","#ffff00","#00ff00","#ff6600","#0066ff"],
  "Pastel":   ["#ffcccc","#ffd9b3","#ffffcc","#ccffcc","#ccf2ff","#e6ccff"],
  "Archi":    ["#ffe066","#ffd6b0","#b3f0d9","#b3d9ff","#f0b3ff","#ffb3c1"],
}
const SIZES_MM=[0.05,0.1,0.18,0.25,0.35,0.5,0.7,1.0,1.4,2.0,3.0,5.0,7.0,10.0]
const ERASER_SIZES_MM=[0.5,1.0,2.0,3.0,5.0,8.0,12.0,20.0,30.0]
const mm2px=mm=>mm*3.78

function formatDimension(mm, unitSystem) {
  if (unitSystem === 'imperial') {
    const inches = mm / 25.4
    if (inches >= 12) {
      const feet = Math.floor(inches / 12)
      const remIn = Math.round((inches % 12) * 100) / 100
      return remIn > 0 ? `${feet}'-${remIn}"` : `${feet}'`
    }
    return `${Math.round(inches * 1000) / 1000}"`
  }
  if (mm >= 1000) return `${Math.round(mm / 10) / 100}m`
  if (mm >= 10) return `${Math.round(mm) / 10}cm`
  return `${mm}mm`
}
const PAGE_FORMATS=[
  {id:"a4p",  l:"A4 Portrait",    w:794,  h:1123,desc:"210×297mm"},
  {id:"a4l",  l:"A4 Paysage",     w:1123, h:794, desc:"297×210mm"},
  {id:"a3p",  l:"A3 Portrait",    w:1123, h:1587,desc:"297×420mm"},
  {id:"a5p",  l:"A5 Portrait",    w:559,  h:794, desc:"148×210mm"},
  {id:"ltr",  l:'Letter 8½×11"',  w:816,  h:1056,desc:'8.5×11"'},
  {id:"ltrl", l:'Letter 11×8½"',  w:1056, h:816, desc:'11×8.5"'},
  {id:"lgl",  l:'Legal 8½×14"',   w:816,  h:1344,desc:'8.5×14"'},
  {id:"tbl",  l:'Tabloid 11×17"', w:1056, h:1632,desc:'11×17"'},
  {id:"sq",   l:"Carré 210×210",  w:794,  h:794, desc:"210×210mm"},
]

/* ══ STRUCTURAL LIBRARY ════════════════════════════════ */
const LIB_METRIC={
  "🪵 Bois Montants":[
    {id:"mw2x4",l:"38×89mm (2×4)",w:38,h:89,type:"wood"},{id:"mw2x6",l:"38×140mm (2×6)",w:38,h:140,type:"wood"},
    {id:"mw2x8",l:"38×184mm (2×8)",w:38,h:184,type:"wood"},{id:"mw2x10",l:"38×235mm (2×10)",w:38,h:235,type:"wood"},
    {id:"mw2x12",l:"38×286mm (2×12)",w:38,h:286,type:"wood"},{id:"mw4x4",l:"89×89mm (4×4)",w:89,h:89,type:"wood"},
    {id:"mw6x6",l:"140×140mm (6×6)",w:140,h:140,type:"wood"},{id:"mw8x8",l:"184×184mm (8×8)",w:184,h:184,type:"wood"},
  ],
  "🪵 Bois Ingénierie":[
    {id:"mglb1",l:"GLB 80×200",w:80,h:200,type:"glulam"},{id:"mglb2",l:"GLB 130×300",w:130,h:300,type:"glulam"},
    {id:"mglb3",l:"GLB 175×380",w:175,h:380,type:"glulam"},{id:"mlvl1",l:"LVL 45×240",w:45,h:240,type:"glulam"},
    {id:"mclt1",l:"CLT 120mm",w:120,h:400,type:"clt"},{id:"mclt2",l:"CLT 160mm",w:160,h:400,type:"clt"},
  ],
  "⚙️ Cornières L":[
    {id:"ml12",l:"L 1/2×1/2×1/8",w:12,h:12,t:3,type:"angle"},{id:"ml19",l:"L 3/4×3/4×1/8",w:19,h:19,t:3,type:"angle"},
    {id:"ml25",l:"L 1×1×1/8",w:25,h:25,t:3,type:"angle"},{id:"ml38",l:"L 1-1/2×1-1/2",w:38,h:38,t:3,type:"angle"},
    {id:"ml51",l:"L 2×2×1/8",w:51,h:51,t:3,type:"angle"},{id:"ml76",l:"L 3×3×3/16",w:76,h:76,t:5,type:"angle"},
    {id:"ml102",l:"L 4×4×1/4",w:102,h:102,t:6,type:"angle"},{id:"ml152",l:"L 6×6×3/8",w:152,h:152,t:10,type:"angle"},
    {id:"ml203",l:"L 8×8×1/2",w:203,h:203,t:13,type:"angle"},
  ],
  "⚙️ HSS Carré":[
    {id:"mhss19",l:"HSS 3/4×3/4",w:19,h:19,t:2,type:"hss"},{id:"mhss25",l:"HSS 1×1×0.065",w:25,h:25,t:2,type:"hss"},
    {id:"mhss38",l:"HSS 1-1/2×1-1/2",w:38,h:38,t:3,type:"hss"},{id:"mhss51",l:"HSS 2×2×0.125",w:51,h:51,t:3,type:"hss"},
    {id:"mhss51b",l:"HSS 2×2×1/4",w:51,h:51,t:6,type:"hss"},{id:"mhss76",l:"HSS 3×3×1/4",w:76,h:76,t:6,type:"hss"},
    {id:"mhss102",l:"HSS 4×4×1/4",w:102,h:102,t:6,type:"hss"},{id:"mhss127",l:"HSS 5×5×1/4",w:127,h:127,t:6,type:"hss"},
    {id:"mhss152",l:"HSS 6×6×1/4",w:152,h:152,t:6,type:"hss"},{id:"mhss203",l:"HSS 8×8×1/4",w:203,h:203,t:6,type:"hss"},
    {id:"mhss254",l:"HSS 10×10×1/4",w:254,h:254,t:6,type:"hss"},{id:"mhss305",l:"HSS 12×12×1/4",w:305,h:305,t:6,type:"hss"},
  ],
  "⚙️ HSS Rect.":[
    {id:"mhssr1",l:"HSS 2×1",w:51,h:25,t:3,type:"hss"},{id:"mhssr3",l:"HSS 3×2",w:76,h:51,t:3,type:"hss"},
    {id:"mhssr4",l:"HSS 4×2",w:102,h:51,t:3,type:"hss"},{id:"mhssr5",l:"HSS 4×3",w:102,h:76,t:5,type:"hss"},
    {id:"mhssr6",l:"HSS 6×3",w:152,h:76,t:5,type:"hss"},{id:"mhssr7",l:"HSS 6×4",w:152,h:102,t:5,type:"hss"},
    {id:"mhssr8",l:"HSS 8×4",w:203,h:102,t:5,type:"hss"},{id:"mhssr9",l:"HSS 8×6",w:203,h:152,t:5,type:"hss"},
  ],
  "⚙️ Poutres W":[
    {id:"mw4x13",l:"W4×13",w:103,h:106,fw:103,ft:9,wt:6,type:"Ibeam"},
    {id:"mw6x9",l:"W6×9",w:100,h:150,fw:100,ft:5,wt:4,type:"Ibeam"},
    {id:"mw8x18",l:"W8×18",w:133,h:207,fw:133,ft:8,wt:6,type:"Ibeam"},
    {id:"mw8x31",l:"W8×31",w:203,h:203,fw:203,ft:11,wt:7,type:"Ibeam"},
    {id:"mw10x22",l:"W10×22",w:146,h:258,fw:146,ft:9,wt:6,type:"Ibeam"},
    {id:"mw10x49",l:"W10×49",w:254,h:254,fw:254,ft:14,wt:9,type:"Ibeam"},
    {id:"mw12x26",l:"W12×26",w:165,h:310,fw:165,ft:9,wt:6,type:"Ibeam"},
    {id:"mw12x53",l:"W12×53",w:254,h:305,fw:254,ft:15,wt:9,type:"Ibeam"},
    {id:"mw14x43",l:"W14×43",w:203,h:347,fw:203,ft:13,wt:8,type:"Ibeam"},
    {id:"mw16x26",l:"W16×26",w:140,h:398,fw:140,ft:9,wt:6,type:"Ibeam"},
    {id:"mw18x35",l:"W18×35",w:152,h:450,fw:152,ft:11,wt:8,type:"Ibeam"},
    {id:"mw21x44",l:"W21×44",w:165,h:525,fw:165,ft:11,wt:9,type:"Ibeam"},
    {id:"mw24x55",l:"W24×55",w:178,h:599,fw:178,ft:13,wt:10,type:"Ibeam"},
  ],
  "⚙️ Poutres S":[
    {id:"ms3",l:"S3×5.7",w:59,h:76,fw:59,ft:7,wt:4,type:"Ibeam"},
    {id:"ms5",l:"S5×10",w:76,h:127,fw:76,ft:8,wt:5,type:"Ibeam"},
    {id:"ms8",l:"S8×18.4",w:102,h:203,fw:102,ft:11,wt:7,type:"Ibeam"},
    {id:"ms10",l:"S10×25.4",w:118,h:254,fw:118,ft:12,wt:8,type:"Ibeam"},
    {id:"ms12",l:"S12×31.8",w:127,h:305,fw:127,ft:14,wt:9,type:"Ibeam"},
    {id:"ms15",l:"S15×42.9",w:140,h:381,fw:140,ft:16,wt:10,type:"Ibeam"},
    {id:"ms18",l:"S18×54.7",w:152,h:457,fw:152,ft:18,wt:12,type:"Ibeam"},
    {id:"ms24",l:"S24×79.9",w:178,h:610,fw:178,ft:22,wt:13,type:"Ibeam"},
  ],
  "⚙️ Profilés U/C":[
    {id:"mc3",l:"C3×4.1",w:36,h:76,fw:36,ft:7,wt:4,type:"channel"},
    {id:"mc4",l:"C4×5.4",w:40,h:102,fw:40,ft:8,wt:5,type:"channel"},
    {id:"mc6",l:"C6×8.2",w:49,h:152,fw:49,ft:9,wt:5,type:"channel"},
    {id:"mc8",l:"C8×11.5",w:57,h:203,fw:57,ft:10,wt:6,type:"channel"},
    {id:"mc10",l:"C10×15.3",w:66,h:254,fw:66,ft:11,wt:6,type:"channel"},
    {id:"mc12",l:"C12×20.7",w:76,h:305,fw:76,ft:13,wt:7,type:"channel"},
    {id:"mc15",l:"C15×33.9",w:86,h:381,fw:86,ft:17,wt:10,type:"channel"},
  ],
  "🧱 Béton":[
    {id:"mc150",l:"Poteau 150×150",w:150,h:150,type:"conc"},{id:"mc200",l:"Poteau 200×200",w:200,h:200,type:"conc"},
    {id:"mc300",l:"Poteau 300×300",w:300,h:300,type:"conc"},{id:"mcr300",l:"Rond Ø300",w:300,h:300,type:"concR"},
    {id:"mm150",l:"Mur 150mm",w:150,h:600,type:"conc"},{id:"mm200",l:"Mur 200mm",w:200,h:600,type:"conc"},
    {id:"mm300",l:"Mur 300mm",w:300,h:600,type:"conc"},{id:"mb300",l:"Poutre 300×600",w:300,h:600,type:"concB"},
    {id:"mf400",l:"Semelle 400",w:400,h:400,type:"ftg"},{id:"mf600",l:"Semelle 600",w:600,h:600,type:"ftg"},
  ],
  "🚪 Ouvertures":[
    {id:"md900",l:"Porte 900×2030",w:900,h:2030,type:"door"},{id:"md1200",l:"Porte 1200×2100",w:1200,h:2100,type:"door"},
    {id:"mdd",l:"Dble 1800×2100",w:1800,h:2100,type:"doorD"},
    {id:"mw900",l:"Fen. 900×1200",w:900,h:1200,type:"win"},{id:"mw1200",l:"Fen. 1200×1500",w:1200,h:1500,type:"win"},
    {id:"mw1500",l:"Fen. 1500×1800",w:1500,h:1800,type:"win"},
  ],
}
const LIB_IMPERIAL={
  "🪵 Wood Studs":[
    {id:"iw2x4",l:"2×4 (1.5\"×3.5\")",w:38,h:89,type:"wood"},{id:"iw2x6",l:"2×6 (1.5\"×5.5\")",w:38,h:140,type:"wood"},
    {id:"iw2x8",l:"2×8 (1.5\"×7.25\")",w:38,h:184,type:"wood"},{id:"iw4x4",l:"4×4 (3.5\"×3.5\")",w:89,h:89,type:"wood"},
    {id:"iw6x6",l:"6×6 (5.5\"×5.5\")",w:140,h:140,type:"wood"},
  ],
  "⚙️ Angles":[
    {id:"ia25",l:"1×1×1/8",w:25,h:25,t:3,type:"angle"},{id:"ia51",l:"2×2×1/8",w:51,h:51,t:3,type:"angle"},
    {id:"ia76",l:"3×3×3/16",w:76,h:76,t:5,type:"angle"},{id:"ia102",l:"4×4×1/4",w:102,h:102,t:6,type:"angle"},
    {id:"ia152",l:"6×6×3/8",w:152,h:152,t:10,type:"angle"},{id:"ia203",l:"8×8×1/2",w:203,h:203,t:13,type:"angle"},
  ],
  "⚙️ HSS Square":[
    {id:"ihss25",l:"HSS 1×1",w:25,h:25,t:2,type:"hss"},{id:"ihss51",l:"HSS 2×2×0.125",w:51,h:51,t:3,type:"hss"},
    {id:"ihss76",l:"HSS 3×3×1/4",w:76,h:76,t:6,type:"hss"},{id:"ihss102",l:"HSS 4×4×1/4",w:102,h:102,t:6,type:"hss"},
    {id:"ihss152",l:"HSS 6×6×3/8",w:152,h:152,t:10,type:"hss"},{id:"ihss203",l:"HSS 8×8×1/2",w:203,h:203,t:13,type:"hss"},
  ],
  "⚙️ W Shapes":[
    {id:"iw6x9",l:"W6×9",w:100,h:150,fw:100,ft:5,wt:4,type:"Ibeam"},
    {id:"iw8x31",l:"W8×31",w:203,h:203,fw:203,ft:11,wt:7,type:"Ibeam"},
    {id:"iw10x49",l:"W10×49",w:254,h:254,fw:254,ft:14,wt:9,type:"Ibeam"},
    {id:"iw12x53",l:"W12×53",w:254,h:305,fw:254,ft:15,wt:9,type:"Ibeam"},
    {id:"iw18x35",l:"W18×35",w:152,h:450,fw:152,ft:11,wt:8,type:"Ibeam"},
    {id:"iw24x55",l:"W24×55",w:178,h:599,fw:178,ft:13,wt:10,type:"Ibeam"},
  ],
  "⚙️ S Beams":[
    {id:"is6",l:"S6×12.5",w:85,h:152,fw:85,ft:9,wt:6,type:"Ibeam"},
    {id:"is10",l:"S10×25.4",w:118,h:254,fw:118,ft:12,wt:8,type:"Ibeam"},
    {id:"is15",l:"S15×42.9",w:140,h:381,fw:140,ft:16,wt:10,type:"Ibeam"},
    {id:"is24",l:"S24×79.9",w:178,h:610,fw:178,ft:22,wt:13,type:"Ibeam"},
  ],
  "⚙️ Channels":[
    {id:"ic6",l:"C6×8.2",w:49,h:152,fw:49,ft:9,wt:5,type:"channel"},
    {id:"ic10",l:"C10×15.3",w:66,h:254,fw:66,ft:11,wt:6,type:"channel"},
    {id:"ic15",l:"C15×33.9",w:86,h:381,fw:86,ft:17,wt:10,type:"channel"},
  ],
  "🧱 Concrete":[
    {id:"ic8",l:"Col 8\"×8\"",w:203,h:203,type:"conc"},{id:"ic12",l:"Col 12\"×12\"",w:305,h:305,type:"conc"},
    {id:"iw6",l:"Wall 6\"",w:152,h:600,type:"conc"},{id:"iw8",l:"Wall 8\"",w:203,h:600,type:"conc"},
  ],
  "🚪 Doors/Windows":[
    {id:"id36",l:"Door 36\"×80\"",w:914,h:2032,type:"door"},{id:"id48",l:"Door 48\"×84\"",w:1219,h:2134,type:"door"},
    {id:"iw36",l:"Win 36\"×48\"",w:914,h:1219,type:"win"},{id:"iw48",l:"Win 48\"×60\"",w:1219,h:1524,type:"win"},
  ],
}

/* ══ SYMBOL LIBRARY (plan view) ══════════════════════════ */
const SYMBOLS_LIB={
  "🪑 Mobilier":[
    {id:"chair",l:"Chaise",w:450,h:450,type:"sym",sym:"chair"},
    {id:"desk",l:"Bureau",w:1200,h:600,type:"sym",sym:"desk"},
    {id:"tablernd",l:"Table ronde",w:1200,h:1200,type:"sym",sym:"tablernd"},
    {id:"table4",l:"Table rect.",w:1600,h:900,type:"sym",sym:"table4"},
    {id:"sofa2",l:"Canapé 2p",w:1600,h:800,type:"sym",sym:"sofa2"},
    {id:"sofa3",l:"Canapé 3p",w:2100,h:800,type:"sym",sym:"sofa3"},
    {id:"bed1",l:"Lit 1p",w:900,h:2000,type:"sym",sym:"bed1"},
    {id:"bed2",l:"Lit 2p",w:1400,h:2000,type:"sym",sym:"bed2"},
    {id:"wardrobe",l:"Armoire",w:1200,h:600,type:"sym",sym:"wardrobe"},
  ],
  "🚿 Sanitaire":[
    {id:"wc",l:"WC",w:370,h:600,type:"sym",sym:"wc"},
    {id:"sink",l:"Lavabo",w:600,h:450,type:"sym",sym:"sink"},
    {id:"bathtub",l:"Baignoire",w:700,h:1700,type:"sym",sym:"bathtub"},
    {id:"shower",l:"Douche 90×90",w:900,h:900,type:"sym",sym:"shower"},
  ],
  "💡 Électrique":[
    {id:"outlet",l:"Prise élec.",w:200,h:200,type:"sym",sym:"outlet"},
    {id:"switch",l:"Interrupteur",w:200,h:200,type:"sym",sym:"switch"},
    {id:"lightsq",l:"Plafon. carré",w:600,h:600,type:"sym",sym:"lightsq"},
    {id:"lightcirc",l:"Plafon. circ.",w:400,h:400,type:"sym",sym:"lightcirc"},
    {id:"spot",l:"Spot",w:150,h:150,type:"sym",sym:"spot"},
  ],
  "🌿 Végétaux":[
    {id:"tree5",l:"Arbre Ø5m",w:5000,h:5000,type:"sym",sym:"tree5"},
    {id:"tree3",l:"Arbre Ø3m",w:3000,h:3000,type:"sym",sym:"tree3"},
    {id:"shrub",l:"Arbuste",w:1500,h:1500,type:"sym",sym:"shrub"},
  ],
  "🚗 Véhicules":[
    {id:"car",l:"Voiture",w:2000,h:4500,type:"sym",sym:"car"},
    {id:"moto",l:"Moto",w:800,h:2200,type:"sym",sym:"moto"},
  ],
  "📐 Circulation":[
    {id:"stairs",l:"Escalier droit",w:1200,h:2400,type:"sym",sym:"stairs"},
    {id:"stairscirc",l:"Escalier spiral.",w:2000,h:2000,type:"sym",sym:"stairscirc"},
    {id:"lift",l:"Ascenseur",w:1500,h:1500,type:"sym",sym:"lift"},
    {id:"parking",l:"Place parking",w:2500,h:5000,type:"sym",sym:"parking"},
  ],
}

function renderSym(el,sc=1/50){
  const px=sc*3.78,W=Math.max(el.w*px,4),H=Math.max(el.h*px,4)
  const w="#d4b896",ws="#8B6914",sa="#d0e8f0",ss="#4a90b8",el2="#fffce0",es="#c8aa00",gr="#7dba84",gs="#2d6a4f"
  const s=el.sym
  if(s==="chair")return<svg width={W}height={H}style={{display:"block"}}viewBox="0 0 100 100"><rect x={15}y={45}width={70}height={45}rx={6}fill={w}stroke={ws}strokeWidth={2}/><rect x={15}y={8}width={70}height={34}rx={5}fill={w}stroke={ws}strokeWidth={2}/><rect x={17}y={50}width={5}height={38}rx={2}fill={ws}/><rect x={78}y={50}width={5}height={38}rx={2}fill={ws}/></svg>
  if(s==="desk")return<svg width={W}height={H}style={{display:"block"}}viewBox="0 0 200 100"><rect x={4}y={4}width={192}height={92}rx={5}fill={w}stroke={ws}strokeWidth={2}/><rect x={14}y={14}width={85}height={72}rx={3}fill={w}stroke={ws}strokeWidth={1}strokeDasharray="3,2"/></svg>
  if(s==="tablernd")return<svg width={W}height={H}style={{display:"block"}}viewBox="0 0 100 100"><circle cx={50}cy={50}r={46}fill={w}stroke={ws}strokeWidth={2}/><circle cx={50}cy={50}r={37}fill="none"stroke={ws}strokeWidth={.8}strokeDasharray="4,3"/></svg>
  if(s==="table4")return<svg width={W}height={H}style={{display:"block"}}viewBox="0 0 200 100"><rect x={4}y={4}width={192}height={92}rx={5}fill={w}stroke={ws}strokeWidth={2}/>{[33,80,120,167].map(x=>[<rect key={x+"t"}x={x-12}y={-9}width={24}height={18}rx={4}fill={w}stroke={ws}strokeWidth={1.5}/>,<rect key={x+"b"}x={x-12}y={91}width={24}height={18}rx={4}fill={w}stroke={ws}strokeWidth={1.5}/>]).flat()}</svg>
  if(s==="sofa2")return<svg width={W}height={H}style={{display:"block"}}viewBox="0 0 200 100"><rect x={0}y={18}width={200}height={72}rx={8}fill={w}stroke={ws}strokeWidth={2}/><rect x={0}y={8}width={200}height={18}rx={4}fill={w}stroke={ws}strokeWidth={2}/><rect x={0}y={18}width={14}height={72}rx={3}fill={ws}/><rect x={186}y={18}width={14}height={72}rx={3}fill={ws}/><line x1={100}y1={23}x2={100}y2={90}stroke={ws}strokeWidth={1.5}strokeDasharray="4,3"/></svg>
  if(s==="sofa3")return<svg width={W}height={H}style={{display:"block"}}viewBox="0 0 260 100"><rect x={0}y={18}width={260}height={72}rx={8}fill={w}stroke={ws}strokeWidth={2}/><rect x={0}y={8}width={260}height={18}rx={4}fill={w}stroke={ws}strokeWidth={2}/><rect x={0}y={18}width={14}height={72}rx={3}fill={ws}/><rect x={246}y={18}width={14}height={72}rx={3}fill={ws}/><line x1={87}y1={23}x2={87}y2={90}stroke={ws}strokeWidth={1.5}strokeDasharray="4,3"/><line x1={174}y1={23}x2={174}y2={90}stroke={ws}strokeWidth={1.5}strokeDasharray="4,3"/></svg>
  if(s==="bed1")return<svg width={W}height={H}style={{display:"block"}}viewBox="0 0 100 200"><rect x={5}y={5}width={90}height={190}rx={6}fill={w}stroke={ws}strokeWidth={2}/><rect x={5}y={5}width={90}height={44}rx={4}fill={w}stroke={ws}strokeWidth={1.5}/><ellipse cx={50}cy={27}rx={28}ry={14}fill="#fff"stroke={ws}strokeWidth={1}/></svg>
  if(s==="bed2")return<svg width={W}height={H}style={{display:"block"}}viewBox="0 0 140 200"><rect x={5}y={5}width={130}height={190}rx={6}fill={w}stroke={ws}strokeWidth={2}/><rect x={5}y={5}width={130}height={44}rx={4}fill={w}stroke={ws}strokeWidth={1.5}/><ellipse cx={42}cy={27}rx={26}ry={14}fill="#fff"stroke={ws}strokeWidth={1}/><ellipse cx={98}cy={27}rx={26}ry={14}fill="#fff"stroke={ws}strokeWidth={1}/><line x1={70}y1={49}x2={70}y2={195}stroke={ws}strokeWidth={1}strokeDasharray="5,4"/></svg>
  if(s==="wardrobe")return<svg width={W}height={H}style={{display:"block"}}viewBox="0 0 200 100"><rect x={5}y={5}width={190}height={90}rx={4}fill={w}stroke={ws}strokeWidth={2}/><line x1={100}y1={5}x2={100}y2={95}stroke={ws}strokeWidth={1.5}/><circle cx={88}cy={50}r={5}fill={ws}/><circle cx={112}cy={50}r={5}fill={ws}/></svg>
  if(s==="wc")return<svg width={W}height={H}style={{display:"block"}}viewBox="0 0 80 130"><rect x={5}y={5}width={70}height={38}rx={4}fill="#eee"stroke="#aaa"strokeWidth={2}/><ellipse cx={40}cy={95}rx={34}ry={30}fill="#eee"stroke="#aaa"strokeWidth={2}/><ellipse cx={40}cy={93}rx={26}ry={23}fill="#fff"stroke="#aaa"strokeWidth={1}/></svg>
  if(s==="sink")return<svg width={W}height={H}style={{display:"block"}}viewBox="0 0 120 90"><rect x={5}y={5}width={110}height={80}rx={8}fill={sa}stroke={ss}strokeWidth={2}/><ellipse cx={60}cy={45}rx={40}ry={28}fill="#fff"stroke={ss}strokeWidth={1.5}/><circle cx={60}cy={45}r={5}fill={ss}/></svg>
  if(s==="bathtub")return<svg width={W}height={H}style={{display:"block"}}viewBox="0 0 80 200"><rect x={5}y={5}width={70}height={190}rx={22}fill={sa}stroke={ss}strokeWidth={2}/><ellipse cx={40}cy={80}rx={26}ry={18}fill="#fff"stroke={ss}strokeWidth={1.5}/><circle cx={40}cy={168}r={8}fill={ss}opacity={.5}/></svg>
  if(s==="shower")return<svg width={W}height={H}style={{display:"block"}}viewBox="0 0 100 100"><rect x={5}y={5}width={90}height={90}rx={4}fill={sa}stroke={ss}strokeWidth={2}/>{Array.from({length:5},(_,i)=>Array.from({length:5},(_,j)=><circle key={`${i}${j}`}cx={18+i*16}cy={18+j*16}r={2}fill={ss}opacity={.4}/>)).flat()}<circle cx={85}cy={15}r={7}fill={ss}/></svg>
  if(s==="outlet")return<svg width={W}height={H}style={{display:"block"}}viewBox="0 0 60 60"><rect x={4}y={4}width={52}height={52}rx={6}fill={el2}stroke={es}strokeWidth={2}/><rect x={19}y={14}width={7}height={13}rx={2}fill={es}/><rect x={34}y={14}width={7}height={13}rx={2}fill={es}/><circle cx={30}cy={38}r={5}fill={es}/></svg>
  if(s==="switch")return<svg width={W}height={H}style={{display:"block"}}viewBox="0 0 60 60"><rect x={4}y={4}width={52}height={52}rx={6}fill={el2}stroke={es}strokeWidth={2}/><rect x={16}y={14}width={28}height={32}rx={4}fill={es}opacity={.25}/><rect x={22}y={20}width={16}height={12}rx={3}fill={es}/></svg>
  if(s==="lightsq")return<svg width={W}height={H}style={{display:"block"}}viewBox="0 0 100 100"><rect x={4}y={4}width={92}height={92}rx={6}fill={el2}stroke={es}strokeWidth={2}/><circle cx={50}cy={50}r={24}fill={es}opacity={.3}/>{[0,45,90,135].map(a=><line key={a}x1={50}y1={50}x2={50+34*Math.cos(a*Math.PI/180)}y2={50+34*Math.sin(a*Math.PI/180)}stroke={es}strokeWidth={1.2}/>)}</svg>
  if(s==="lightcirc")return<svg width={W}height={H}style={{display:"block"}}viewBox="0 0 100 100"><circle cx={50}cy={50}r={46}fill={el2}stroke={es}strokeWidth={2}/><circle cx={50}cy={50}r={22}fill={es}opacity={.3}/>{[0,60,120,180,240,300].map(a=><line key={a}x1={50}y1={50}x2={50+38*Math.cos(a*Math.PI/180)}y2={50+38*Math.sin(a*Math.PI/180)}stroke={es}strokeWidth={1}/>)}</svg>
  if(s==="spot")return<svg width={W}height={H}style={{display:"block"}}viewBox="0 0 60 60"><circle cx={30}cy={30}r={25}fill={el2}stroke={es}strokeWidth={2}/><circle cx={30}cy={30}r={11}fill={es}opacity={.5}/><circle cx={30}cy={30}r={4}fill={es}/></svg>
  if(s==="tree5")return<svg width={W}height={H}style={{display:"block"}}viewBox="0 0 100 100"><circle cx={50}cy={50}r={46}fill={gr}stroke={gs}strokeWidth={2}/><circle cx={50}cy={50}r={20}fill={gs}opacity={.3}/>{[0,72,144,216,288].map(a=><ellipse key={a}cx={50+27*Math.cos(a*Math.PI/180)}cy={50+27*Math.sin(a*Math.PI/180)}rx={14}ry={14}fill={gr}stroke={gs}strokeWidth={1}/>)}</svg>
  if(s==="tree3")return<svg width={W}height={H}style={{display:"block"}}viewBox="0 0 100 100"><circle cx={50}cy={50}r={44}fill={gr}stroke={gs}strokeWidth={2}/><circle cx={50}cy={50}r={17}fill={gs}opacity={.3}/>{[0,90,180,270].map(a=><ellipse key={a}cx={50+26*Math.cos(a*Math.PI/180)}cy={50+26*Math.sin(a*Math.PI/180)}rx={17}ry={17}fill={gr}stroke={gs}strokeWidth={1}/>)}</svg>
  if(s==="shrub")return<svg width={W}height={H}style={{display:"block"}}viewBox="0 0 100 100"><ellipse cx={50}cy={62}rx={42}ry={30}fill={gr}stroke={gs}strokeWidth={2}/><ellipse cx={30}cy={42}rx={24}ry={22}fill={gr}stroke={gs}strokeWidth={1.5}/><ellipse cx={66}cy={40}rx={23}ry={21}fill={gr}stroke={gs}strokeWidth={1.5}/></svg>
  if(s==="car")return<svg width={W}height={H}style={{display:"block"}}viewBox="0 0 80 180"><rect x={5}y={5}width={70}height={170}rx={14}fill="#b0bec5"stroke="#546e7a"strokeWidth={2}/><rect x={10}y={22}width={60}height={38}rx={4}fill="#90a4ae"stroke="#546e7a"strokeWidth={1}/><rect x={10}y={120}width={60}height={38}rx={4}fill="#90a4ae"stroke="#546e7a"strokeWidth={1}/>{[[12,12],[68,12],[12,168],[68,168]].map(([cx,cy])=><circle key={`${cx}${cy}`}cx={cx}cy={cy}r={9}fill="#37474f"/>)}</svg>
  if(s==="moto")return<svg width={W}height={H}style={{display:"block"}}viewBox="0 0 60 180"><rect x={20}y={5}width={20}height={170}rx={10}fill="#90a4ae"stroke="#546e7a"strokeWidth={2}/><ellipse cx={30}cy={20}rx={12}ry={18}fill="#78909c"stroke="#546e7a"strokeWidth={1.5}/><ellipse cx={30}cy={160}rx={12}ry={18}fill="#78909c"stroke="#546e7a"strokeWidth={1.5}/></svg>
  if(s==="stairs")return<svg width={W}height={H}style={{display:"block"}}viewBox="0 0 100 200">{Array.from({length:8},(_,i)=><rect key={i}x={5}y={5+i*24}width={90-i*9}height={20}fill="#e0e0e0"stroke="#aaa"strokeWidth={1}/>)}<line x1={5}y1={5}x2={5}y2={197}stroke="#888"strokeWidth={2}/><line x1={95}y1={5}x2={95}y2={197}stroke="#888"strokeWidth={2}strokeDasharray="6,4"/><text x={50}y={180}textAnchor="middle"fontSize={14}fill="#aaa">↑</text></svg>
  if(s==="stairscirc")return<svg width={W}height={H}style={{display:"block"}}viewBox="0 0 200 200"><circle cx={100}cy={100}r={94}fill="none"stroke="#aaa"strokeWidth={2}/>{Array.from({length:12},(_,i)=>{const a=i*30*Math.PI/180;return<line key={i}x1={100}y1={100}x2={100+90*Math.cos(a)}y2={100+90*Math.sin(a)}stroke="#bbb"strokeWidth={1}/>})}<circle cx={100}cy={100}r={20}fill="#e0e0e0"stroke="#aaa"strokeWidth={1.5}/></svg>
  if(s==="lift")return<svg width={W}height={H}style={{display:"block"}}viewBox="0 0 150 150"><rect x={5}y={5}width={140}height={140}rx={4}fill="#e8ecef"stroke="#607d8b"strokeWidth={2}/><rect x={20}y={20}width={48}height={110}rx={3}fill="#fff"stroke="#607d8b"strokeWidth={1.5}/><rect x={82}y={20}width={48}height={110}rx={3}fill="#fff"stroke="#607d8b"strokeWidth={1.5}/><line x1={20}y1={75}x2={68}y2={75}stroke="#607d8b"strokeWidth={1.5}/><line x1={82}y1={75}x2={130}y2={75}stroke="#607d8b"strokeWidth={1.5}/></svg>
  if(s==="parking")return<svg width={W}height={H}style={{display:"block"}}viewBox="0 0 100 200"><rect x={3}y={3}width={94}height={194}rx={4}fill="none"stroke="#bbb"strokeWidth={2}strokeDasharray="7,5"/><text x={50}y={110}textAnchor="middle"fontSize={50}fill="#ccc"fontWeight="bold"fontFamily="sans-serif">P</text></svg>
  return<div style={{width:W,height:H,background:"#f0f0f0",border:"1px solid #ccc",fontSize:8,display:"flex",alignItems:"center",justifyContent:"center"}}>{el.l}</div>
}

const PAGE_COLORS=[
  {id:"white",c:"#ffffff",l:"Blanc"},{id:"cream",c:"#fdf6ed",l:"Crème"},
  {id:"yellow",c:"#fffff0",l:"Jaune"},{id:"blue",c:"#f0f8ff",l:"Bleu ciel"},
  {id:"green",c:"#f0fff4",l:"Menthe"},{id:"pink",c:"#fff0f5",l:"Rose"},
  {id:"gray",c:"#f5f5f5",l:"Gris"},{id:"dark",c:"#1c2128",l:"Ardoise"},
  {id:"kraft",c:"#f4ede0",l:"Kraft"},{id:"navy",c:"#0d1b2a",l:"Marine"},
  {id:"black",c:"#000000",l:"Noir"},
]
const GRID_COLORS=[
  {id:"blue",c:"rgba(61,107,140,.12)",l:"Bleu"},{id:"gray",c:"rgba(0,0,0,.08)",l:"Gris"},
  {id:"red",c:"rgba(200,50,50,.1)",l:"Rouge"},{id:"green",c:"rgba(50,150,50,.1)",l:"Vert"},
  {id:"orange",c:"rgba(200,98,42,.1)",l:"Orange"},{id:"purple",c:"rgba(124,58,237,.1)",l:"Violet"},
  {id:"white",c:"rgba(255,255,255,.15)",l:"Blanc"},
]

/* ══ RENDER ════════════════════════════════════════════ */
function renderEl(el,sc=1/50){
  const px=sc*3.78,W=Math.max((el.fw||el.w)*px,4),H=Math.max(el.h*px,4),t=(el.t||6)*px
  if(["wood","glulam","clt"].includes(el.type)){const c=el.type==="wood"?"#c8a96a":el.type==="glulam"?"#b8904a":"#d4b896";return<svg width={W}height={H}style={{display:"block"}}><rect width={W}height={H}fill={c}stroke="#8B6914"strokeWidth={.8}/>{[.25,.5,.75].map(r=><line key={r}x1={W*r}y1={0}x2={W*r}y2={H}stroke="#a07820"strokeWidth={.4}strokeDasharray="3,4"/>)}</svg>}
  if(el.type==="hss")return<svg width={W}height={H}style={{display:"block"}}><rect width={W}height={H}fill="#607d8b"stroke="#37474f"strokeWidth={1}/><rect x={t}y={t}width={Math.max(W-2*t,1)}height={Math.max(H-2*t,1)}fill="white"stroke="#546e7a"strokeWidth={.5}/></svg>
  if(el.type==="Ibeam"){const fw=(el.fw||el.w)*px,ft2=(el.ft||5)*px,wt2=(el.wt||4)*px;return<svg width={fw}height={H}style={{display:"block"}}><rect x={0}y={0}width={fw}height={ft2}fill="#546e7a"stroke="#37474f"strokeWidth={.8}/><rect x={(fw-wt2)/2}y={ft2}width={wt2}height={Math.max(H-2*ft2,1)}fill="#607d8b"stroke="#37474f"strokeWidth={.8}/><rect x={0}y={H-ft2}width={fw}height={ft2}fill="#546e7a"stroke="#37474f"strokeWidth={.8}/></svg>}
  if(el.type==="channel"){const fw=(el.fw||el.w)*px,ft2=(el.ft||5)*px,wt2=(el.wt||4)*px;return<svg width={fw}height={H}style={{display:"block"}}><rect x={0}y={0}width={fw}height={ft2}fill="#546e7a"stroke="#37474f"strokeWidth={.8}/><rect x={0}y={ft2}width={wt2}height={H-2*ft2}fill="#607d8b"stroke="#37474f"strokeWidth={.8}/><rect x={0}y={H-ft2}width={fw}height={ft2}fill="#546e7a"stroke="#37474f"strokeWidth={.8}/></svg>}
  if(el.type==="angle"){const t2=t*.8;return<svg width={W}height={H}style={{display:"block"}}><polygon points={`0,0 ${t2},0 ${t2},${H-t2} ${W},${H-t2} ${W},${H} 0,${H}`}fill="#607d8b"stroke="#37474f"strokeWidth={.8}/></svg>}
  if(["conc","concB"].includes(el.type))return<svg width={W}height={H}style={{display:"block"}}><rect width={W}height={H}fill="#c0c0c0"stroke="#888"strokeWidth={1}/><line x1={0}y1={0}x2={W}y2={H}stroke="#aaa"strokeWidth={.6}/><line x1={W}y1={0}x2={0}y2={H}stroke="#aaa"strokeWidth={.6}/></svg>
  if(el.type==="concR")return<svg width={W}height={H}style={{display:"block"}}><circle cx={W/2}cy={H/2}r={Math.min(W,H)/2-1}fill="#c0c0c0"stroke="#888"strokeWidth={1}/></svg>
  if(el.type==="ftg")return<svg width={W}height={H}style={{display:"block"}}><rect width={W}height={H}fill="#d0d0d0"stroke="#666"strokeWidth={1}strokeDasharray="3,3"/></svg>
  if(el.type==="door")return<svg width={W}height={H}style={{display:"block"}}><rect width={W}height={H}fill="rgba(200,160,80,.12)"stroke="#8b6f47"strokeWidth={1.5}/><path d={`M ${W*.05},${H*.97} A ${W*.9},${H*.9} 0 0 1 ${W*.95},${H*.97}`}fill="none"stroke="#8b6f47"strokeWidth={.8}strokeDasharray="3,2"/></svg>
  if(el.type==="doorD")return<svg width={W}height={H}style={{display:"block"}}><rect width={W}height={H}fill="rgba(200,160,80,.12)"stroke="#8b6f47"strokeWidth={1.5}/><line x1={W/2}y1={0}x2={W/2}y2={H}stroke="#8b6f47"strokeWidth={.8}/></svg>
  if(el.type==="win")return<svg width={W}height={H}style={{display:"block"}}><rect width={W}height={H}fill="rgba(122,181,212,.25)"stroke="#4a90b8"strokeWidth={1.5}/><line x1={W/2}y1={0}x2={W/2}y2={H}stroke="#4a90b8"strokeWidth={.8}/><line x1={0}y1={H/2}x2={W}y2={H/2}stroke="#4a90b8"strokeWidth={.8}/></svg>
  return<div style={{width:W,height:H,background:"#ccc",border:"1px solid #999",fontSize:8,overflow:"hidden"}}>{el.l}</div>
}

/* ══ PAPER ════════════════════════════════════════════ */
function Paper({tmpl,T,pageColor,gridColor,PW=794,PH=1123}){
  const W=PW,H=PH,L=[],bg=pageColor||T.paper,gc=gridColor||T.grid,pl=gridColor||T.pline
  const grid=(gap,col,sw)=>{for(let x=0;x<=W;x+=gap)L.push(<line key={`v${x}${sw}`}x1={x}y1={0}x2={x}y2={H}stroke={col}strokeWidth={sw}/>);for(let y=0;y<=H;y+=gap)L.push(<line key={`h${y}${sw}`}x1={0}y1={y}x2={W}y2={y}stroke={col}strokeWidth={sw}/>)}
  if(tmpl==="grid5"){grid(18.9,gc,.5);grid(94.5,pl,.9)}
  if(tmpl==="grid10"){grid(37.8,gc,.5);grid(189,pl,.9)}
  if(tmpl==="math"){grid(28.35,gc,.5);grid(141.75,pl,.9)}
  if(tmpl==="dotted"){for(let x=26;x<W;x+=26)for(let y=26;y<H;y+=26)L.push(<circle key={`d${x}${y}`}cx={x}cy={y}r={1}fill={gc}opacity={.5}/>)}
  if(tmpl==="lined"){for(let y=72;y<H;y+=28)L.push(<line key={`l${y}`}x1={52}y1={y}x2={W-52}y2={y}stroke={gc}strokeWidth={.9}/>);L.push(<line key="lm"x1={90}y1={0}x2={90}y2={H}stroke="rgba(200,80,80,.15)"strokeWidth={1}/>)}
  if(tmpl==="cornell"){for(let y=80;y<H-100;y+=28)L.push(<line key={`cl${y}`}x1={200}y1={y}x2={W-48}y2={y}stroke={gc}strokeWidth={.9}/>);L.push(<line key="cv"x1={190}y1={70}x2={190}y2={H-100}stroke="rgba(200,80,80,.2)"strokeWidth={1}/>);L.push(<line key="ch"x1={40}y1={H-100}x2={W-40}y2={H-100}stroke="rgba(200,80,80,.2)"strokeWidth={1}/>)}
  if(tmpl==="isometric"){const s=37.8;for(let i=-H;i<W+H;i+=s){L.push(<line key={`a${i}`}x1={i}y1={0}x2={i+H}y2={H}stroke={gc}strokeWidth={.5}/>);L.push(<line key={`b${i}`}x1={i}y1={0}x2={i-H}y2={H}stroke={gc}strokeWidth={.5}/>)}}
  if(["plan","elevation","section","detail"].includes(tmpl)){grid(37.8,gc,.5);grid(189,pl,.9);L.push(<rect key="tb"x={20}y={H-92}width={W-40}height={82}fill="none"stroke={pl}strokeWidth={1}/>);L.push(<rect key="b1"x={12}y={12}width={W-24}height={H-24}fill="none"stroke={pl}strokeWidth={1.5}/>)}
  if(tmpl==="music"){for(let y=80;y<H-60;y+=70)for(let s=0;s<5;s++)L.push(<line key={`ms${y}${s}`}x1={40}y1={y+s*9}x2={W-40}y2={y+s*9}stroke={gc}strokeWidth={.9}/>)}
  const gradId=`pg-${T.id}`
  return<svg style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:0}}width={W}height={H}>
    <defs>
      <radialGradient id={gradId} cx="90%" cy="8%" r="65%">
        <stop offset="0%" stopColor={T.a3} stopOpacity={pageColor?0:0.2}/>
        <stop offset="100%" stopColor={T.a3} stopOpacity={0}/>
      </radialGradient>
    </defs>
    <rect width={W}height={H}fill={bg}/>
    <rect width={W}height={H}fill={`url(#${gradId})`}/>
    {L}
  </svg>
}

/* ══ CANVAS — Smart shape detection (GoodNotes-style) ══ */
function DrawCanvas({tool,color,size,eraserSize,cRef,onStroke,onPickColor,pencilOnly,unitSys}){
  const drawing=useRef(false)
  const strokes=useRef([])   // committed strokes
  const history=useRef([])   // for multi-level undo (copy of strokes at each commit)
  const cur=useRef([])
  const shape=useRef(null)
  const holdTimer=useRef(null) // for shape auto-correct on hold
  const lassoPath=useRef(null)
  const selBox=useRef(null)
  const selectedStrokes=useRef(new Set())
  const lassoRect=useRef(null)

  const pointInPolygon=(pt,polygon)=>{
    let inside=false
    for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
      const xi=polygon[i].x,yi=polygon[i].y,xj=polygon[j].x,yj=polygon[j].y
      if(((yi>pt.y)!==(yj>pt.y))&&(pt.x<(xj-xi)*(pt.y-yi)/(yj-yi)+xi))inside=!inside
    }
    return inside
  }

  const redraw=useCallback(()=>{
    const c=cRef.current;if(!c)return
    const ctx=c.getContext("2d");ctx.clearRect(0,0,794,1123)
    strokes.current.forEach(s=>{
      if(!s.pts||s.pts.length<2)return
      ctx.beginPath();ctx.strokeStyle=s.color;ctx.lineWidth=s.size
      ctx.lineCap="round";ctx.lineJoin="round"
      ctx.globalAlpha=s.tool==="highlight"?.4:1
      ctx.globalCompositeOperation=s.tool==="eraser"?"destination-out":"source-over"
      if(s.shapeType==="line"||s.shapeType==="dimline"){
        ctx.moveTo(s.pts[0].x,s.pts[0].y);ctx.lineTo(s.pts[1].x,s.pts[1].y);ctx.stroke()
        // Dimension line ticks
        if(s.shapeType==="dimline"){
          const ang=Math.atan2(s.pts[1].y-s.pts[0].y,s.pts[1].x-s.pts[0].x)
          const perp=ang+Math.PI/2,tick=8
          ;[[s.pts[0],s.pts[1]]].forEach(([a,b])=>{
            ctx.beginPath();ctx.moveTo(a.x-tick*Math.cos(perp)/2,a.y-tick*Math.sin(perp)/2);ctx.lineTo(a.x+tick*Math.cos(perp)/2,a.y+tick*Math.sin(perp)/2);ctx.stroke()
            ctx.beginPath();ctx.moveTo(b.x-tick*Math.cos(perp)/2,b.y-tick*Math.sin(perp)/2);ctx.lineTo(b.x+tick*Math.cos(perp)/2,b.y+tick*Math.sin(perp)/2);ctx.stroke()
          })
          // Distance label
          const distMm=Math.sqrt(Math.pow(s.pts[1].x-s.pts[0].x,2)+Math.pow(s.pts[1].y-s.pts[0].y,2))/3.78
          const mx=(s.pts[0].x+s.pts[1].x)/2,my=(s.pts[0].y+s.pts[1].y)/2
          ctx.font=`${Math.max(s.size*3,10)}px monospace`;ctx.fillStyle=s.color;ctx.globalAlpha=1
          ctx.fillText(formatDimension(distMm,unitSys),mx+4,my-4)
        }
      }
      else if(s.shapeType==="rect"){ctx.strokeRect(s.pts[0].x,s.pts[0].y,s.pts[1].x-s.pts[0].x,s.pts[1].y-s.pts[0].y)}
      else if(s.shapeType==="circle"){const rx=Math.abs(s.pts[1].x-s.pts[0].x)/2,ry=Math.abs(s.pts[1].y-s.pts[0].y)/2;if(rx>0&&ry>0){ctx.ellipse((s.pts[0].x+s.pts[1].x)/2,(s.pts[0].y+s.pts[1].y)/2,rx,ry,0,0,Math.PI*2);ctx.stroke()}}
      else if(s.shapeType==="arrow"){
        const[a,b]=[s.pts[0],s.pts[1]],ang=Math.atan2(b.y-a.y,b.x-a.x),hs=Math.min(20,s.size*5+10)
        ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()
        ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-hs*Math.cos(ang-Math.PI/6),b.y-hs*Math.sin(ang-Math.PI/6));ctx.lineTo(b.x-hs*Math.cos(ang+Math.PI/6),b.y-hs*Math.sin(ang+Math.PI/6));ctx.closePath();ctx.fillStyle=s.color;ctx.fill()
      }
      else if(s.shapeType==="text"){
        ctx.font=`${Math.max(s.size*3,14)}px Nunito, sans-serif`;ctx.fillStyle=s.color;ctx.globalAlpha=1;ctx.globalCompositeOperation="source-over"
        ctx.fillText(s.text||"",s.pts[0].x,s.pts[0].y)
      }
      else if(s.shapeType==="cloud"){
        // Annotation cloud bubble
        const[a,b]=[s.pts[0],s.pts[1]],W2=b.x-a.x,H2=b.y-a.y
        const r=12,steps=Math.max(6,Math.ceil((2*(Math.abs(W2)+Math.abs(H2)))/r/2))
        ctx.strokeStyle=s.color;ctx.fillStyle=s.color+"22"
        ctx.beginPath();ctx.roundRect(a.x,a.y,W2,H2,r);ctx.fill();ctx.stroke()
        // Tail
        ctx.beginPath();ctx.moveTo(a.x+W2*.3,a.y+H2);ctx.lineTo(a.x+W2*.2,a.y+H2+15);ctx.lineTo(a.x+W2*.45,a.y+H2);ctx.fill()
      }
      else{
        ctx.moveTo(s.pts[0].x,s.pts[0].y);s.pts.forEach(p=>ctx.lineTo(p.x,p.y));ctx.stroke()
      }
    })
    // Lasso selection overlay
    if(lassoPath.current&&lassoPath.current.length>2){
      ctx.save();ctx.strokeStyle="#2196f3";ctx.lineWidth=1.5;ctx.setLineDash([5,5]);ctx.globalAlpha=1;ctx.globalCompositeOperation="source-over"
      ctx.beginPath();ctx.moveTo(lassoPath.current[0].x,lassoPath.current[0].y)
      lassoPath.current.forEach(p=>ctx.lineTo(p.x,p.y));ctx.closePath();ctx.stroke()
      ctx.restore()
    }
    // Lasso-rect overlay
    if(lassoRect.current){
      const lr=lassoRect.current
      ctx.save();ctx.strokeStyle="#2196f3";ctx.lineWidth=1.5;ctx.setLineDash([5,5]);ctx.globalAlpha=1;ctx.globalCompositeOperation="source-over"
      ctx.strokeRect(lr.x1,lr.y1,lr.x2-lr.x1,lr.y2-lr.y1)
      ctx.restore()
    }
    // Selected strokes highlight
    selectedStrokes.current.forEach(idx=>{
      const s=strokes.current[idx]
      if(!s?.pts||s.pts.length<2)return
      ctx.save()
      ctx.strokeStyle="#2196f3"
      ctx.lineWidth=Math.max(s.size+4,6)
      ctx.globalAlpha=0.4
      ctx.lineCap="round";ctx.lineJoin="round"
      ctx.globalCompositeOperation="source-over"
      ctx.beginPath()
      ctx.moveTo(s.pts[0].x,s.pts[0].y)
      s.pts.forEach(p=>ctx.lineTo(p.x,p.y))
      ctx.stroke()
      ctx.restore()
    })
    ctx.globalCompositeOperation="source-over";ctx.globalAlpha=1
  },[cRef])

  const gP=e=>{
    const r=cRef.current.getBoundingClientRect()
    const src=e.touches?e.touches[0]:e
    return{x:(src.clientX-r.left)*(794/r.width),y:(src.clientY-r.top)*(1123/r.height)}
  }

  // Smart shape detection (GoodNotes-style)
  const detectShape=(pts)=>{
    if(pts.length<4)return null
    const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y)
    const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys)
    const W2=maxX-minX,H2=maxY-minY
    const start=pts[0],end=pts[pts.length-1]
    const closeness=Math.sqrt((start.x-end.x)**2+(start.y-end.y)**2)
    const perimeter=pts.reduce((a,p,i)=>i===0?0:a+Math.sqrt((p.x-pts[i-1].x)**2+(p.y-pts[i-1].y)**2),0)

    // Closed shape?
    const isClosed=closeness<W2*.3&&closeness<H2*.3
    if(isClosed){
      // Circle: bounding box is roughly square and perimeter ≈ π*d
      const aspect=W2/Math.max(H2,1)
      if(aspect>.6&&aspect<1.6&&Math.abs(perimeter-Math.PI*Math.max(W2,H2))<perimeter*.4){
        return{type:"circle",pts:[{x:minX,y:minY},{x:maxX,y:maxY}]}
      }
      // Rectangle
      return{type:"rect",pts:[{x:minX,y:minY},{x:maxX,y:maxY}]}
    }
    // Line: mostly straight
    const lineLen=Math.sqrt((end.x-start.x)**2+(end.y-start.y)**2)
    if(lineLen>0&&perimeter/lineLen<1.3){
      return{type:"line",pts:[start,end]}
    }
    return null
  }

  const dn=e=>{
    if(pencilOnly&&e.pointerType==="touch")return
    const p=gP(e)
    if(tool==="eyedropper"){
      const ctx=cRef.current.getContext("2d")
      const px2=ctx.getImageData(Math.round(Math.max(0,Math.min(p.x,793))),Math.round(Math.max(0,Math.min(p.y,1122))),1,1).data
      if(px2[3]>0&&onPickColor)onPickColor(`#${[px2[0],px2[1],px2[2]].map(v=>v.toString(16).padStart(2,"0")).join("")}`)
      return
    }
    if(tool==="text"){
      const txt=prompt("Texte :")
      if(txt){strokes.current.push({pts:[p,{x:p.x+1,y:p.y+1}],color,size,tool:"text",text:txt,shapeType:"text"});redraw();if(onStroke)onStroke(strokes.current)}
      return
    }
    if(tool==="lasso"){lassoPath.current=[p];drawing.current=true;return}
    if(tool==="lasso-rect"){shape.current={start:p};drawing.current=true;return}
    e.preventDefault();drawing.current=true;cur.current=[p]
    if(["line","rect","circle","arrow","cloud","dimline"].includes(tool)){shape.current={start:p};return}
    // Hold timer for shape auto-correct
    if(tool==="pen"){
      holdTimer.current=setTimeout(()=>{
        if(cur.current.length>3){
          const detected=detectShape(cur.current)
          if(detected){
            // Replace current freehand with detected shape
            strokes.current.push({...detected,color,size,tool})
            cur.current=[]
            drawing.current=false
            redraw()
            if(onStroke)onStroke(strokes.current)
          }
        }
      },800)
    }
  }

  const mv=e=>{
    if(pencilOnly&&e.pointerType==="touch")return
    if(!drawing.current)return
    e.preventDefault()
    const p=gP(e),ctx=cRef.current.getContext("2d")
    if(tool==="lasso"){lassoPath.current=[...lassoPath.current,p];redraw();return}
    if(tool==="lasso-rect"&&shape.current){
      const s=shape.current.start
      lassoRect.current={x1:Math.min(s.x,p.x),y1:Math.min(s.y,p.y),x2:Math.max(s.x,p.x),y2:Math.max(s.y,p.y)}
      redraw();return
    }
    if(["line","rect","circle","arrow","cloud","dimline"].includes(tool)&&shape.current){
      redraw()
      ctx.strokeStyle=color;ctx.lineWidth=size;ctx.lineCap="round"
      ctx.globalAlpha=1;ctx.globalCompositeOperation="source-over"
      const s=shape.current.start
      if(tool==="line"||tool==="dimline"){ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(p.x,p.y);ctx.stroke()}
      else if(tool==="rect"){ctx.strokeRect(s.x,s.y,p.x-s.x,p.y-s.y)}
      else if(tool==="circle"){const rx=Math.abs(p.x-s.x)/2,ry=Math.abs(p.y-s.y)/2;if(rx>0&&ry>0){ctx.beginPath();ctx.ellipse((s.x+p.x)/2,(s.y+p.y)/2,rx,ry,0,0,Math.PI*2);ctx.stroke()}}
      else if(tool==="arrow"){
        const ang=Math.atan2(p.y-s.y,p.x-s.x),hs=Math.min(20,size*5+10)
        ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(p.x,p.y);ctx.stroke()
        ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-hs*Math.cos(ang-Math.PI/6),p.y-hs*Math.sin(ang-Math.PI/6));ctx.lineTo(p.x-hs*Math.cos(ang+Math.PI/6),p.y-hs*Math.sin(ang+Math.PI/6));ctx.closePath();ctx.fillStyle=color;ctx.fill()
      }
      else if(tool==="cloud"){ctx.strokeStyle=color;ctx.fillStyle=color+"22";ctx.beginPath();ctx.roundRect&&ctx.roundRect(Math.min(s.x,p.x),Math.min(s.y,p.y),Math.abs(p.x-s.x),Math.abs(p.y-s.y),12);ctx.fill();ctx.stroke()}
      return
    }
    cur.current.push(p)
    if(cur.current.length<2)return
    const pts=cur.current,actualSize=tool==="eraser"?eraserSize:size
    ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=actualSize;ctx.lineCap="round";ctx.lineJoin="round"
    ctx.globalAlpha=tool==="highlight"?.4:1;ctx.globalCompositeOperation=tool==="eraser"?"destination-out":"source-over"
    ctx.moveTo(pts[pts.length-2].x,pts[pts.length-2].y);ctx.lineTo(pts[pts.length-1].x,pts[pts.length-1].y);ctx.stroke()
    ctx.globalCompositeOperation="source-over";ctx.globalAlpha=1
  }

  const up=e=>{
    if(!drawing.current)return
    drawing.current=false
    if(holdTimer.current){clearTimeout(holdTimer.current);holdTimer.current=null}
    if(tool==="lasso"){
      // Lasso complete — select strokes inside polygon
      if(lassoPath.current&&lassoPath.current.length>3){
        const poly=[...lassoPath.current,lassoPath.current[0]]
        selectedStrokes.current=new Set()
        strokes.current.forEach((s,i)=>{
          if(s.pts&&s.pts.some(pt=>pointInPolygon(pt,poly)))selectedStrokes.current.add(i)
        })
        // Keep lassoPath visible as selection contour
        redraw()
      }else{
        lassoPath.current=null;redraw()
      }
      return
    }
    if(tool==="lasso-rect"){
      // Lasso-rect complete — select strokes inside rect
      if(shape.current&&lassoRect.current){
        const lr=lassoRect.current
        selectedStrokes.current=new Set()
        strokes.current.forEach((s,i)=>{
          if(s.pts&&s.pts.some(pt=>pt.x>=lr.x1&&pt.x<=lr.x2&&pt.y>=lr.y1&&pt.y<=lr.y2))selectedStrokes.current.add(i)
        })
      }
      shape.current=null;redraw()
      return
    }
    const p=gP(e)
    history.current.push(JSON.stringify(strokes.current)) // save for undo
    if(history.current.length>50)history.current.shift()
    if(["line","rect","circle","arrow","cloud","dimline"].includes(tool)&&shape.current){
      const s=shape.current.start
      const finalPts=tool==="cloud"?[{x:Math.min(s.x,p.x),y:Math.min(s.y,p.y)},{x:Math.max(s.x,p.x),y:Math.max(s.y,p.y)}]:[s,p]
      strokes.current.push({pts:finalPts,color,size,tool,shapeType:tool})
      shape.current=null;redraw()
    } else if(cur.current.length>0){
      strokes.current.push({pts:[...cur.current],color,size:tool==="eraser"?eraserSize:size,tool})
    }
    cur.current=[]
    if(onStroke)onStroke(strokes.current)
  }

  useEffect(()=>{
    window.__undo=()=>{
      if(history.current.length>0){
        strokes.current=JSON.parse(history.current.pop())
      }else{strokes.current.pop()}
      redraw()
      if(onStroke)onStroke(strokes.current)
    }
    window.__redo=()=>{} // future
    window.__clear=()=>{history.current.push(JSON.stringify(strokes.current));strokes.current=[];redraw();if(onStroke)onStroke(strokes.current)}
    window.__loadStrokes=data=>{try{strokes.current=(typeof data==="string"?JSON.parse(data):data)||[];redraw()}catch{}}
    window.__getCanvas=()=>cRef.current
    window.__clearSelection=()=>{selectedStrokes.current.clear();lassoPath.current=null;lassoRect.current=null;redraw()}
    window.__deleteSelected=()=>{
      if(selectedStrokes.current.size===0)return
      history.current.push(JSON.stringify(strokes.current))
      strokes.current=strokes.current.filter((_,i)=>!selectedStrokes.current.has(i))
      selectedStrokes.current.clear()
      lassoPath.current=null
      redraw()
      if(onStroke)onStroke(strokes.current)
    }
  },[redraw])

  return<canvas ref={cRef}width={794}height={1123}
    style={{position:"absolute",inset:0,width:"100%",height:"100%",cursor:tool==="eraser"?"cell":tool==="eyedropper"?"crosshair":tool==="lasso"?"cell":"crosshair",touchAction:"none",zIndex:5}}
    onPointerDown={dn}onPointerMove={mv}onPointerUp={up}onPointerLeave={up}/>
}

/* ══ FLOATING PANEL ══════════════════════════════════ */
function FloatingPanel({T,color,setColor,sizeMm,setSizeMm,tool,setTool,eraserMm,setEraserMm,favorites,setFavorites,unitSys}){
  const[pos,setPos]=useState({x:16,y:120})
  const[drag,setDrag]=useState(false)
  const[offset,setOffset]=useState({x:0,y:0})
  const[collapsed,setCollapsed]=useState(true)
  const[cPal,setCPal]=useState("📐 Plans")
  const[hPal,setHPal]=useState("Standards")
  const[showWheel,setShowWheel]=useState(false)
  const[customHex,setCustomHex]=useState(color)
  const wheelRef=useRef()
  const isEraser=tool==="eraser"

  const startDrag=e=>{setDrag(true);setOffset({x:e.clientX-pos.x,y:e.clientY-pos.y})}
  useEffect(()=>{
    if(!drag)return
    const mm=e=>setPos({x:e.clientX-offset.x,y:e.clientY-offset.y})
    const mu=()=>setDrag(false)
    window.addEventListener("mousemove",mm);window.addEventListener("mouseup",mu)
    return()=>{window.removeEventListener("mousemove",mm);window.removeEventListener("mouseup",mu)}
  },[drag,offset])

  useEffect(()=>{
    if(!showWheel||!wheelRef.current)return
    const canvas=wheelRef.current,ctx=canvas.getContext("2d"),cx=75,cy=75,r=70
    for(let a=0;a<360;a++){const rad=a*Math.PI/180,g=ctx.createLinearGradient(cx,cy,cx+r*Math.cos(rad),cy+r*Math.sin(rad));g.addColorStop(0,"white");g.addColorStop(1,`hsl(${a},100%,50%)`);ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,rad,(a+1)*Math.PI/180);ctx.fillStyle=g;ctx.fill()}
    const dg=ctx.createRadialGradient(cx,cy,0,cx,cy,r);dg.addColorStop(0,"rgba(0,0,0,0)");dg.addColorStop(1,"rgba(0,0,0,0.5)");ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle=dg;ctx.fill()
  },[showWheel])

  const pickWheel=e=>{const r=wheelRef.current.getBoundingClientRect(),ctx=wheelRef.current.getContext("2d"),px2=ctx.getImageData(e.clientX-r.left,e.clientY-r.top,1,1).data;if(px2[3]>0){const h=`#${[px2[0],px2[1],px2[2]].map(v=>v.toString(16).padStart(2,"0")).join("")}`;setColor(h);setCustomHex(h)}}
  const saveFav=i=>{const f=[...favorites];f[i]={color,sizeMm,tool};setFavorites(f)}
  const loadFav=f=>{if(!f)return;setColor(f.color);setSizeMm(f.sizeMm);if(f.tool)setTool(f.tool)}

  if(collapsed)return(
    <div style={{position:"fixed",left:pos.x,top:pos.y,zIndex:100,cursor:"grab"}}onMouseDown={startDrag}>
      <div onClick={e=>{e.stopPropagation();setCollapsed(false)}}
        style={{width:32,height:32,borderRadius:"50%",background:isEraser?"#eee":color,border:`3px solid white`,boxShadow:"0 2px 12px rgba(0,0,0,.4)",cursor:"pointer",outline:`2px solid ${T.accent}`}}/>
    </div>
  )

  return(
    <div style={{position:"fixed",left:pos.x,top:pos.y,zIndex:100,background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,boxShadow:"0 8px 32px rgba(0,0,0,.25)",width:200,userSelect:"none"}}>
      <div onMouseDown={startDrag}style={{cursor:"grab",padding:"7px 11px 5px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${T.border}`}}>
        <div style={{fontSize:9,color:T.muted}}>⠿ OUTILS</div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <div style={{width:12,height:12,borderRadius:"50%",background:isEraser?"#eee":color,border:`1px solid ${T.border}`}}/>
          <span style={{fontSize:9,color:T.muted,fontFamily:"monospace"}}>{formatDimension(isEraser?eraserMm:sizeMm,unitSys)}</span>
          <button onClick={()=>setCollapsed(true)}style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:14,lineHeight:1,padding:0}}>−</button>
        </div>
      </div>
      <div style={{padding:"9px 11px",display:"flex",flexDirection:"column",gap:9,maxHeight:"70vh",overflowY:"auto"}}>
        <div>
          <div style={{fontSize:8,color:T.muted,marginBottom:3}}>PALETTE</div>
          <select value={cPal}onChange={e=>setCPal(e.target.value)}style={{width:"100%",padding:"3px 5px",borderRadius:7,border:`1px solid ${T.border}`,background:T.bg,color:T.ink,fontSize:10,outline:"none",cursor:"pointer"}}>
            {Object.keys(CPAL).map(p=><option key={p}value={p}>{p}</option>)}
          </select>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
          {CPAL[cPal].map(c=><button key={c}onClick={()=>{setColor(c);setCustomHex(c)}}style={{width:c===color?22:17,height:c===color?22:17,borderRadius:"50%",background:c,border:`2px solid ${c===color?T.accent:"transparent"}`,cursor:"pointer",outline:c==="#ffffff"?`1px solid ${T.border}`:"none",flexShrink:0,transition:"all .1s"}}/>)}
        </div>
        <button onClick={()=>setShowWheel(v=>!v)}style={{padding:"4px 8px",borderRadius:8,border:`1px solid ${showWheel?T.accent:T.border}`,background:showWheel?`${T.accent}15`:T.bg,color:showWheel?T.accent:T.muted,cursor:"pointer",fontSize:10,textAlign:"left"}}>🎡 Roue chromatique</button>
        {showWheel&&<div>
          <canvas ref={wheelRef}width={150}height={150}style={{borderRadius:"50%",cursor:"crosshair",display:"block",margin:"0 auto"}}onClick={pickWheel}/>
          <div style={{marginTop:5,display:"flex",gap:5,alignItems:"center"}}>
            <input type="color"value={customHex}onChange={e=>{setCustomHex(e.target.value);setColor(e.target.value)}}style={{width:26,height:26,padding:0,border:`1px solid ${T.border}`,borderRadius:5,cursor:"pointer"}}/>
            <input value={customHex}onChange={e=>{setCustomHex(e.target.value);if(/^#[0-9a-f]{6}$/i.test(e.target.value))setColor(e.target.value)}}style={{flex:1,padding:"3px 5px",borderRadius:7,border:`1px solid ${T.border}`,background:T.bg,color:T.ink,fontSize:10,outline:"none",fontFamily:"monospace"}}/>
          </div>
        </div>}
        <div>
          <div style={{fontSize:8,color:T.muted,marginBottom:3}}>SURLIGNEUR</div>
          <select value={hPal}onChange={e=>setHPal(e.target.value)}style={{width:"100%",padding:"3px 5px",borderRadius:7,border:`1px solid ${T.border}`,background:T.bg,color:T.ink,fontSize:10,outline:"none",cursor:"pointer",marginBottom:4}}>
            {Object.keys(HPAL).map(p=><option key={p}value={p}>{p}</option>)}
          </select>
          <div style={{display:"flex",gap:3}}>{HPAL[hPal].map(c=><button key={c}onClick={()=>{setColor(c);setTool("highlight")}}style={{width:17,height:17,borderRadius:3,background:c+"aa",border:`2px solid ${color===c&&tool==="highlight"?T.accent:"transparent"}`,cursor:"pointer",flexShrink:0}}/>)}</div>
        </div>
        <div>
          <div style={{fontSize:8,color:T.muted,marginBottom:3}}>TAILLE CRAYON</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:3}}>{SIZES_MM.map(s=><button key={s}onClick={()=>setSizeMm(s)}style={{padding:"2px 5px",borderRadius:5,border:`1px solid ${sizeMm===s&&!isEraser?T.accent:T.border}`,background:sizeMm===s&&!isEraser?`${T.accent}18`:T.bg,color:sizeMm===s&&!isEraser?T.accent:T.muted,cursor:"pointer",fontSize:8,fontFamily:"monospace"}}>{s}</button>)}</div>
        </div>
        <div>
          <div style={{fontSize:8,color:T.muted,marginBottom:3}}>TAILLE GOMME</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:3}}>{ERASER_SIZES_MM.map(s=><button key={s}onClick={()=>{setEraserMm(s);setTool("eraser")}}style={{padding:"2px 5px",borderRadius:5,border:`1px solid ${eraserMm===s&&isEraser?T.accent:T.border}`,background:eraserMm===s&&isEraser?`${T.accent}18`:T.bg,color:eraserMm===s&&isEraser?T.accent:T.muted,cursor:"pointer",fontSize:8,fontFamily:"monospace"}}>{s}</button>)}</div>
        </div>
        <div>
          <div style={{fontSize:8,color:T.muted,marginBottom:3}}>FAVORIS — clic: charger · dbl: sauvegarder</div>
          <div style={{display:"flex",gap:4}}>{Array.from({length:6},(_,i)=>{const fav=favorites[i];return<button key={i}onClick={()=>loadFav(fav)}onDoubleClick={()=>saveFav(i)}title={fav?`${fav.color} ${formatDimension(fav.sizeMm,unitSys)}`:"Dbl-clic sauvegarder"}style={{width:28,height:28,borderRadius:7,background:fav?fav.color:T.bg,border:`1px solid ${fav?T.accent:T.border}`,cursor:"pointer",fontSize:fav?"0":"13",color:T.muted,display:"flex",alignItems:"center",justifyContent:"center"}}>{!fav&&"+"}</button>})}</div>
        </div>
      </div>
    </div>
  )
}

/* ══ PAGE THUMBNAIL ═══════════════════════════════════ */
function PageThumbnail({pageData,pageNum,current,T,onClick}){
  const ref=useRef()
  useEffect(()=>{
    if(!ref.current||!pageData)return
    const ctx=ref.current.getContext("2d")
    ctx.fillStyle="#fff";ctx.fillRect(0,0,100,141)
    if(pageData.canvas_data){
      try{
        const strokes=typeof pageData.canvas_data==="string"?JSON.parse(pageData.canvas_data):pageData.canvas_data||[]
        const sc=100/794
        strokes.forEach(s=>{
          if(!s.pts||s.pts.length<2)return
          ctx.beginPath();ctx.strokeStyle=s.color||"#000";ctx.lineWidth=Math.max(s.size*sc,.5);ctx.lineCap="round"
          ctx.globalAlpha=s.tool==="highlight"?.4:1
          ctx.moveTo(s.pts[0].x*sc,s.pts[0].y*sc)
          s.pts.forEach(p=>ctx.lineTo(p.x*sc,p.y*sc))
          ctx.stroke()
        })
        ctx.globalAlpha=1
      }catch{}
    }
  },[pageData])
  return(
    <div onClick={onClick}style={{cursor:"pointer",padding:4,borderRadius:8,border:`2px solid ${current?T.accent:T.border}`,background:current?`${T.accent}10`:T.bg,transition:"all .15s"}}>
      <canvas ref={ref}width={100}height={141}style={{display:"block",width:80,height:113,borderRadius:4}}/>
      <div style={{fontSize:9,color:current?T.accent:T.muted,textAlign:"center",marginTop:3,fontFamily:"monospace"}}>{pageNum}</div>
    </div>
  )
}

/* ══ MODALS ═══════════════════════════════════════════ */
function ThemePicker({current,onChange,onClose}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}}>
      <div style={{background:"#fff",borderRadius:20,padding:22,width:560,maxWidth:"94vw",maxHeight:"82vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.25)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:18}}>Thèmes ({THEMES.length})</div>
          <button onClick={onClose}style={{background:"none",border:"none",cursor:"pointer",fontSize:22,color:"#888"}}>×</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:9}}>
          {THEMES.map(th=><button key={th.id}onClick={()=>{onChange(th);onClose()}}style={{padding:0,border:`2px solid ${current?.id===th.id?"#c8622a":"#eee"}`,borderRadius:13,overflow:"hidden",cursor:"pointer",background:"none"}}>
            <div style={{height:80,background:`linear-gradient(135deg,${th.panel},${th.surface})`,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
              {th.img
                ? <img src={th.img} alt={th.n} style={{width:60,height:60,borderRadius:9,objectFit:"cover",boxShadow:"0 2px 8px rgba(0,0,0,.3)"}}/>
                : <span style={{fontSize:24}}>{th.e}</span>
              }
              <div style={{position:"absolute",bottom:4,right:6,fontSize:9,color:th.surface+"cc",fontFamily:"'Syne',sans-serif",fontWeight:700}}>{th.n}</div>
            </div>
            <div style={{padding:"5px 9px",background:th.bg,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",gap:3}}>{[th.accent,th.a2,th.a3].map((c,i)=><div key={i}style={{width:9,height:9,borderRadius:3,background:c}}/>)}</div>
              {current?.id===th.id&&<div style={{fontSize:9,color:th.accent,fontWeight:700}}>✓</div>}
            </div>
          </button>)}
        </div>
      </div>
    </div>
  )
}

function PageSettings({T,pageColor,setPageColor,gridColor,setGridColor,onClose}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}}>
      <div style={{background:T.surface,borderRadius:16,padding:22,width:360,maxWidth:"94vw",boxShadow:"0 20px 60px rgba(0,0,0,.25)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:15,color:T.ink}}>🎨 Style de page</div>
          <button onClick={onClose}style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:20}}>×</button>
        </div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:7}}>FOND</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:7}}>{PAGE_COLORS.map(pc=><button key={pc.id}onClick={()=>setPageColor(pc.c)}title={pc.l}style={{width:34,height:34,borderRadius:8,background:pc.c,border:`2px solid ${pageColor===pc.c?T.accent:T.border}`,cursor:"pointer",outline:pc.c==="#ffffff"?`1px solid ${T.border}`:"none"}}/>)}</div>
        </div>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:7}}>QUADRILLAGE</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:7}}>{GRID_COLORS.map(gc=><button key={gc.id}onClick={()=>setGridColor(gc.c)}title={gc.l}style={{width:34,height:34,borderRadius:8,background:"#fff",border:`2px solid ${gridColor===gc.c?T.accent:T.border}`,cursor:"pointer",position:"relative",overflow:"hidden"}}><svg width={34}height={34}style={{position:"absolute",inset:0}}>{[6,14,22,30].map(x=><line key={`v${x}`}x1={x}y1={0}x2={x}y2={34}stroke={gc.c}strokeWidth={1}/>)}{[6,14,22,30].map(y=><line key={`h${y}`}x1={0}y1={y}x2={34}y2={y}stroke={gc.c}strokeWidth={1}/>)}</svg></button>)}</div>
        </div>
        <button onClick={onClose}style={{width:"100%",padding:11,borderRadius:10,background:T.accent,border:"none",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer"}}>Appliquer ✓</button>
      </div>
    </div>
  )
}

function ShareModal({T,nbId,nbTitle,onClose}){
  const[email,setEmail]=useState("")
  const[sent,setSent]=useState(false)
  const shareUrl=`${window.location.origin}/editor/${nbId}`
  const copyLink=()=>{navigator.clipboard.writeText(shareUrl);alert("Lien copié !")}
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}}>
      <div style={{background:T.surface,borderRadius:16,padding:24,width:380,maxWidth:"94vw",boxShadow:"0 20px 60px rgba(0,0,0,.25)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:15,color:T.ink}}>🤝 Partager ce carnet</div>
          <button onClick={onClose}style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:20}}>×</button>
        </div>
        <div style={{padding:12,borderRadius:10,background:`${T.accent}10`,border:`1px solid ${T.accent}33`,marginBottom:14,fontSize:12,color:T.ink}}><strong>{nbTitle}</strong></div>
        {sent?(
          <div style={{textAlign:"center",padding:"16px 0"}}>
            <div style={{fontSize:32,marginBottom:8}}>✅</div>
            <div style={{fontSize:14,color:T.ink,fontWeight:600}}>Lien copié !</div>
            <button onClick={onClose}style={{marginTop:14,padding:"9px 20px",borderRadius:10,background:T.accent,border:"none",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:13}}>Fermer</button>
          </div>
        ):(
          <>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:5}}>LIEN DE PARTAGE</div>
              <div style={{display:"flex",gap:6}}>
                <input readOnly value={shareUrl}style={{flex:1,padding:"8px 10px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:10,background:T.bg,color:T.muted,outline:"none"}}/>
                <button onClick={()=>{copyLink();setSent(true)}}style={{padding:"8px 14px",borderRadius:8,background:T.accent,border:"none",color:"#fff",cursor:"pointer",fontSize:12,fontWeight:700}}>Copier</button>
              </div>
            </div>
            <div style={{marginBottom:16,fontSize:11,color:T.muted,lineHeight:1.6}}>
              Envoie ce lien à ton camarade pour qu'il puisse annoter le carnet en temps réel.
            </div>
            <button onClick={onClose}style={{width:"100%",padding:11,borderRadius:10,background:T.bg,border:`1px solid ${T.border}`,color:T.muted,fontSize:13,cursor:"pointer"}}>Fermer</button>
          </>
        )}
      </div>
    </div>
  )
}

/* ══ MAIN EDITOR ══════════════════════════════════════ */
export default function EditorPage(){
  const navigate=useNavigate()
  const{activeNotebook,getTheme,setTheme}=useAppStore()
  const[localTheme,setLocalTheme]=useState(null)
  const T=localTheme||getTheme()
  const nb=activeNotebook||{id:"1",title:"Carnet",subject:"arch",template:"plan",pages_count:1}
  const cRef=useRef()

  const[tool,setTool]=useState("pen")
  const[color,setColor]=useState("#1c1c24")
  const[sizeMm,setSizeMm]=useState(0.5)
  const[eraserMm,setEraserMm]=useState(5.0)
  const[favorites,setFavorites]=useState(Array(6).fill(null))
  const[unitSys,setUnitSys]=useState("metric")
  const[scale,setScale]=useState("1:50")
  const[zoom,setZoom]=useState(.85)
  const[panX,setPanX]=useState(0)
  const[panY,setPanY]=useState(0)
  const isPanning=useRef(false)
  const panStart=useRef(null)
  const[showLib,setShowLib]=useState(false)
  const[libMode,setLibMode]=useState("metric")
  const[libCat,setLibCat]=useState("🪵 Bois Montants")
  const[libSearch,setLibSearch]=useState("")
  const[libPending,setLibPending]=useState(null)
  const[mousePos,setMousePos]=useState({x:0,y:0})
  const[placed,setPlaced]=useState([])
  const[selected,setSelected]=useState(null)
  const[pages,setPages]=useState([]) // all pages data
  const[page,setPage]=useState(1)
  const[showPagePanel,setShowPagePanel]=useState(false) // thumbnails
  const[showLayers,setShowLayers]=useState(false)
  const[layers,setLayers]=useState([{id:"s",n:"Esquisse",v:true,locked:false},{id:"a",n:"Annotations",v:true,locked:false},{id:"st",n:"Structure",v:true,locked:false}])
  const[showPageSettings,setShowPageSettings]=useState(false)
  const[pageColor,setPageColor]=useState(null)
  const[gridColor,setGridColor]=useState(null)
  const[showTheme,setShowTheme]=useState(false)
  const[showShare,setShowShare]=useState(false)
  const[showRuler,setShowRuler]=useState(false)
  const[showProt,setShowProt]=useState(false)
  const[saveStatus,setSaveStatus]=useState("idle")
  const[pageId,setPageId]=useState(null)
  const saveTimer=useRef(null)
  const[pencilOnly,setPencilOnly]=useState(false)
  const[importedImages,setImportedImages]=useState([])
  const[collabCursors,setCollabCursors]=useState([])
  const realtimeChannel=useRef(null)
  const[exporting,setExporting]=useState(false)
  const[readOnly,setReadOnly]=useState(false)
  const[showPresent,setShowPresent]=useState(false) // presentation mode
  const[focusMode,setFocusMode]=useState(false)
  const[showCalc,setShowCalc]=useState(false)
  const[showTimer,setShowTimer]=useState(false)
  const[showConv,setShowConv]=useState(false)
  const[calcExpr,setCalcExpr]=useState("")
  const[calcResult,setCalcResult]=useState("")
  const[calcHistory,setCalcHistory]=useState([])
  const[timerSec,setTimerSec]=useState(25*60)
  const[timerRunning,setTimerRunning]=useState(false)
  const[timerMode,setTimerMode]=useState("work")
  const timerRef=useRef(null)
  const[convVal,setConvVal]=useState("")
  const[convFrom,setConvFrom]=useState("mm")
  const[convMode,setConvMode]=useState("unit")
  const[showFlash,setShowFlash]=useState(false)
  const[flashCards,setFlashCards]=useState([])
  const[flashQ,setFlashQ]=useState("")
  const[flashA,setFlashA]=useState("")
  const[flashReview,setFlashReview]=useState(false)
  const[flashIdx,setFlashIdx]=useState(0)
  const[flashFlipped,setFlashFlipped]=useState(false)
  const[pageHistory,setPageHistory]=useState([]) // [{ts, label, data, elements}]
  const[showHistory,setShowHistory]=useState(false)
  const[infiniteMode,setInfiniteMode]=useState(false)
  const[pageFormat,setPageFormat]=useState("a4p")
  const[nextPageFmt,setNextPageFmt]=useState("a4p")

  const sizePx=mm2px(sizeMm)
  const eraserPx=mm2px(eraserMm)
  const fmt=PAGE_FORMATS.find(f=>f.id===pageFormat)||PAGE_FORMATS[0]
  const PW=infiniteMode?3000:fmt.w
  const PH=infiniteMode?3000:fmt.h
  const curLib=libMode==="symbols"?SYMBOLS_LIB:libMode==="metric"?LIB_METRIC:LIB_IMPERIAL
  const libCats=Object.keys(curLib)
  const libItems=useMemo(()=>{const items=curLib[libCat]||[];return libSearch?items.filter(e=>e.l.toLowerCase().includes(libSearch.toLowerCase())):items},[libCat,libSearch,curLib,libMode])
  useEffect(()=>{const cats=Object.keys(libMode==="metric"?LIB_METRIC:LIB_IMPERIAL);if(!cats.includes(libCat))setLibCat(cats[0])},[libMode])

  // Load page + all pages for thumbnails
  useEffect(()=>{
    const load=async()=>{
      try{
        const{data:{session}}=await supabase.auth.getSession()
        if(!session?.user)return
        // Load current page
        const{data:pg}=await supabase.from("pages").select("*").eq("notebook_id",nb.id).eq("page_number",page).single()
        if(pg){
          setPageId(pg.id)
          if(pg.canvas_data&&window.__loadStrokes)window.__loadStrokes(pg.canvas_data)
          if(pg.elements){const rawEl=typeof pg.elements==="string"?JSON.parse(pg.elements):pg.elements;if(rawEl&&!Array.isArray(rawEl)&&rawEl.format){setPageFormat(rawEl.format);setNextPageFmt(rawEl.format);setPlaced(rawEl.items||[])}else{setPlaced(Array.isArray(rawEl)?rawEl:[])}}
        }else{
          const{data:np}=await supabase.from("pages").insert([{notebook_id:nb.id,page_number:page,user_id:session.user.id}]).select().single()
          if(np){setPageId(np.id);if(window.__loadStrokes)window.__loadStrokes([])}
        }
        // Load all pages for thumbnails
        const{data:allPgs}=await supabase.from("pages").select("*").eq("notebook_id",nb.id).order("page_number")
        setPages(allPgs||[])
      }catch{}
    }
    load()
  },[nb.id,page])

  // Add new page
  const addPage=async()=>{
    try{
      const{data:{session}}=await supabase.auth.getSession()
      if(!session?.user)return
      const newNum=(nb.pages_count||1)+1
      const{data:np}=await supabase.from("pages").insert([{notebook_id:nb.id,page_number:newNum,user_id:session.user.id,elements:JSON.stringify({format:nextPageFmt,items:[]})}]).select().single()
      if(np){
        await supabase.from("notebooks").update({pages_count:newNum}).eq("id",nb.id)
        activeNotebook.pages_count=newNum
        setPageFormat(nextPageFmt)
        setPage(newNum)
      }
    }catch{}
  }

  // Duplicate page
  const duplicatePage=async()=>{
    if(!pageId)return
    try{
      const{data:{session}}=await supabase.auth.getSession()
      if(!session?.user)return
      const{data:current}=await supabase.from("pages").select("*").eq("id",pageId).single()
      if(!current)return
      const newNum=(nb.pages_count||1)+1
      await supabase.from("pages").insert([{notebook_id:nb.id,page_number:newNum,user_id:session.user.id,canvas_data:current.canvas_data,elements:current.elements}])
      await supabase.from("notebooks").update({pages_count:newNum}).eq("id",nb.id)
      activeNotebook.pages_count=newNum
      setPage(newNum)
    }catch{}
  }

  // Realtime
  useEffect(()=>{
    const setup=async()=>{
      try{
        const{data:{session}}=await supabase.auth.getSession()
        if(!session?.user)return
        const ch=supabase.channel(`nb:${nb.id}`)
        ch.on("broadcast",{event:"cursor"},({payload})=>{
          if(payload.userId!==session.user.id)setCollabCursors(p=>[...p.filter(c=>c.userId!==payload.userId),{...payload,ts:Date.now()}])
        }).subscribe()
        realtimeChannel.current=ch
        const t=setInterval(()=>setCollabCursors(p=>p.filter(c=>Date.now()-c.ts<5000)),3000)
        return()=>{clearInterval(t);ch.unsubscribe()}
      }catch{}
    }
    setup()
  },[nb.id])

  const broadcastCursor=useCallback(async(x,y)=>{
    if(!realtimeChannel.current)return
    try{const{data:{session}}=await supabase.auth.getSession();if(!session?.user)return;realtimeChannel.current.send({type:"broadcast",event:"cursor",payload:{userId:session.user.id,userName:session.user.user_metadata?.full_name||session.user.email||"?",x,y,color}})}catch{}
  },[color])

  // Calculator
  const evalCalcExpr=expr=>{try{const r=Function('"use strict";return('+expr.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-')+')')();return isFinite(r)&&!isNaN(r)?String(Math.round(r*100000)/100000):"Erreur"}catch{return"Erreur"}}
  const handleCalcBtn=btn=>{
    if(btn==="C"){setCalcExpr("");setCalcResult("");return}
    if(btn==="CE"){setCalcExpr(e=>e.slice(0,-1));return}
    if(btn==="±"){setCalcExpr(e=>e.startsWith("-")?e.slice(1):"-"+e);return}
    if(btn==="="){const r=evalCalcExpr(calcExpr);setCalcResult(r);if(r!=="Erreur"){setCalcHistory(h=>[...h,`${calcExpr} = ${r}`]);setCalcExpr(r)}return}
    const op=btn==="÷"?"/":btn==="×"?"*":btn==="−"?"-":btn
    setCalcExpr(e=>e+op)
  }
  // Timer
  useEffect(()=>{
    if(!timerRunning){clearInterval(timerRef.current);return}
    timerRef.current=setInterval(()=>setTimerSec(s=>{if(s>1)return s-1;clearInterval(timerRef.current);setTimerRunning(false);return 0}),1000)
    return()=>clearInterval(timerRef.current)
  },[timerRunning])
  useEffect(()=>{
    if(timerSec===0)setTimerMode(m=>{const next=m==="work"?"break":"work";setTimeout(()=>setTimerSec(next==="work"?25*60:5*60),50);return next})
  },[timerSec])

  // Flashcards — persist per notebook
  useEffect(()=>{
    try{const saved=localStorage.getItem(`forma_flash_${nb.id}`);if(saved)setFlashCards(JSON.parse(saved))}catch{}
  },[nb.id])
  const saveFlash=cards=>{setFlashCards(cards);try{localStorage.setItem(`forma_flash_${nb.id}`,JSON.stringify(cards))}catch{}}
  const addFlashCard=()=>{
    if(!flashQ.trim()||!flashA.trim())return
    saveFlash([...flashCards,{id:Date.now(),q:flashQ.trim(),a:flashA.trim()}])
    setFlashQ("");setFlashA("")
  }
  const deleteFlashCard=id=>saveFlash(flashCards.filter(c=>c.id!==id))

  // Save
  const save=useCallback(async strokes=>{
    if(!pageId||readOnly)return
    try{
      const{data:{session}}=await supabase.auth.getSession()
      if(!session?.user)return
      setSaveStatus("saving")
      await supabase.from("pages").update({canvas_data:JSON.stringify(strokes),elements:JSON.stringify({format:pageFormat,items:placed}),updated_at:new Date().toISOString()}).eq("id",pageId)
      await supabase.from("notebooks").update({updated_at:new Date().toISOString()}).eq("id",nb.id)
      setSaveStatus("saved");setTimeout(()=>setSaveStatus("idle"),2000)
    }catch{setSaveStatus("error");setTimeout(()=>setSaveStatus("idle"),3000)}
  },[pageId,placed,nb.id,readOnly])

  const onStroke=useCallback(s=>{if(saveTimer.current)clearTimeout(saveTimer.current);saveTimer.current=setTimeout(()=>save(s),1500)},[save])

  // Page versioning (localStorage, 20 versions max per page)
  const HIST_KEY=`forma_hist_${nb.id}_${page}`
  const saveVersion=label=>{
    const canvas=cRef.current;if(!canvas)return
    const snap=canvas.toDataURL("image/jpeg",.4)
    const ver={ts:Date.now(),label:label||new Date().toLocaleTimeString("fr-FR"),snap,elements:JSON.stringify(placed)}
    const hist=[ver,...(()=>{try{return JSON.parse(localStorage.getItem(HIST_KEY)||"[]")}catch{return[]}})()].slice(0,20)
    localStorage.setItem(HIST_KEY,JSON.stringify(hist))
    setPageHistory(hist)
  }
  useEffect(()=>{try{setPageHistory(JSON.parse(localStorage.getItem(HIST_KEY)||"[]"))}catch{}},[page,nb.id])
  const restoreVersion=ver=>{
    if(!confirm("Restaurer cette version ? Les changements non sauvegardés seront perdus."))return
    if(ver.elements&&window.__loadStrokes){
      try{const el=JSON.parse(ver.elements);setPlaced(el)}catch{}
    }
    setShowHistory(false)
  }

  // Export PNG 2x
  const exportPNG=async()=>{
    setExporting(true)
    try{
      const canvas=cRef.current;if(!canvas)return
      const eW=canvas.width,eH=canvas.height,sc2=2
      const exp=document.createElement("canvas");exp.width=eW*sc2;exp.height=eH*sc2
      const ctx=exp.getContext("2d");ctx.scale(sc2,sc2)
      ctx.fillStyle=pageColor||"#ffffff";ctx.fillRect(0,0,eW,eH)
      ctx.drawImage(canvas,0,0,eW,eH)
      const link=document.createElement("a")
      link.download=`${nb.title.replace(/[^a-z0-9]/gi,"-")}-p${page}.png`
      link.href=exp.toDataURL("image/png",1.0);link.click()
    }catch(e){alert("Export error: "+e.message)}
    finally{setExporting(false)}
  }

  // Import image/PDF
  const handleImport=e=>{
    const file=e.target.files?.[0];if(!file)return
    const reader=new FileReader()
    reader.onload=ev=>{
      const img=new window.Image()
      img.onload=()=>{
        const maxW=400,maxH=500,ratio=Math.min(maxW/img.width,maxH/img.height,1)
        setImportedImages(p=>[...p,{id:Date.now(),src:ev.target.result,x:100,y:80,w:img.width*ratio,h:img.height*ratio}])
      }
      img.src=ev.target.result
    }
    reader.readAsDataURL(file);e.target.value=""
  }

  // Apple Pencil double-tap: switch eraser/pen
  useEffect(()=>{
    const handleDblTap=e=>{
      if(e.pointerType==="pen"&&e.buttons===2){// barrel button or double-tap
        setTool(t=>t==="eraser"?"pen":"eraser")
      }
    }
    window.addEventListener("pointerdown",handleDblTap)
    return()=>window.removeEventListener("pointerdown",handleDblTap)
  },[])

  // Keyboard shortcuts for lasso selection
  useEffect(()=>{
    const handleKey=e=>{
      if(e.key==="Delete"||e.key==="Backspace")window.__deleteSelected?.()
      if(e.key==="Escape")window.__clearSelection?.()
    }
    window.addEventListener("keydown",handleKey)
    return()=>window.removeEventListener("keydown",handleKey)
  },[])

  const isPanMode=tool==="select"
  const SCALES_M=["1:1","1:2","1:5","1:10","1:20","1:50","1:100","1:200","1:500","1:1000"]
  const SCALES_I=['1/4"=1\'','3/16"=1\'','1/8"=1\'','3/32"=1\'','1"=10\'','1"=20\'','1"=40\'','1"=100\'']
  const TOOLS_LIST=[
    {g:"Nav",items:[{id:"select",l:"Déplacer",i:"✋"}]},
    {g:"Dessin",items:[{id:"pen",l:"Crayon",i:"✏"},{id:"highlight",l:"Surlig.",i:"▌"},{id:"eraser",l:"Gomme",i:"◻"}]},
    {g:"Formes",items:[{id:"line",l:"Ligne",i:"/"},{id:"rect",l:"Rect.",i:"□"},{id:"circle",l:"Cercle",i:"○"},{id:"arrow",l:"Flèche",i:"→"}]},
    {g:"Archi",items:[{id:"dimline",l:"Cotation",i:"↔"},{id:"cloud",l:"Bulle",i:"💬"},{id:"lasso",l:"Lasso",i:"⬡"},{id:"lasso-rect",l:"Lasso ▭",i:"⬜"}]},
    {g:"Spécial",items:[{id:"text",l:"Texte",i:"T"},{id:"eyedropper",l:"Pipette",i:"💉"}]},
  ]
  const COLLAB_COLORS=["#e94560","#2196f3","#4ade80","#f5a623","#a855f7","#00bcd4"]

  // Presentation mode
  if(showPresent){
    return(
      <div style={{position:"fixed",inset:0,background:"#000",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}}>
        <div style={{position:"absolute",top:16,right:16,display:"flex",gap:8,zIndex:10}}>
          <button onClick={()=>setPage(p=>Math.max(1,p-1))}style={{padding:"8px 16px",borderRadius:10,background:"rgba(255,255,255,.1)",border:"none",color:"#fff",cursor:"pointer",fontSize:18}}>‹</button>
          <span style={{color:"#fff",fontSize:14,padding:"8px 12px"}}>{page}/{nb.pages_count||1}</span>
          <button onClick={()=>setPage(p=>Math.min(nb.pages_count||1,p+1))}style={{padding:"8px 16px",borderRadius:10,background:"rgba(255,255,255,.1)",border:"none",color:"#fff",cursor:"pointer",fontSize:18}}>›</button>
          <button onClick={()=>setShowPresent(false)}style={{padding:"8px 16px",borderRadius:10,background:"rgba(233,69,96,.3)",border:"none",color:"#fff",cursor:"pointer",fontSize:13}}>✕ Quitter</button>
        </div>
        <div style={{transform:"scale(0.9)",transformOrigin:"center",boxShadow:"0 20px 80px rgba(0,0,0,.8)"}}>
          <div style={{width:fmt.w,height:fmt.h,position:"relative",background:"#fff"}}>
            <Paper tmpl={nb.template||"plan"} T={T} pageColor={pageColor} gridColor={gridColor} PW={fmt.w} PH={fmt.h}/>
            <canvas ref={cRef}width={fmt.w}height={fmt.h}style={{position:"absolute",inset:0,width:"100%",height:"100%"}}/>
          </div>
        </div>
      </div>
    )
  }

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:T.bg,fontFamily:"'Nunito',sans-serif",overflow:"hidden",color:T.ink,position:"relative",zIndex:2}}>
      {showPageSettings&&<PageSettings T={T} pageColor={pageColor} setPageColor={setPageColor} gridColor={gridColor} setGridColor={setGridColor} onClose={()=>setShowPageSettings(false)}/>}
      {showTheme&&<ThemePicker current={T} onChange={th=>{setLocalTheme(th);setTheme(th.id)}} onClose={()=>setShowTheme(false)}/>}
      {showShare&&<ShareModal T={T} nbId={nb.id} nbTitle={nb.title} onClose={()=>setShowShare(false)}/>}

      {/* ── CALCULATRICE ──────────────────────────────── */}
      {showCalc&&<div style={{position:"fixed",bottom:72,right:showTimer?280:20,width:232,background:T.surface,borderRadius:16,boxShadow:"0 8px 36px rgba(0,0,0,.35)",border:`1px solid ${T.border}`,zIndex:90,overflow:"hidden",userSelect:"none"}}>
        <div style={{background:T.panel,padding:"9px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:12,color:"#fff"}}>🔢 Calculatrice</span>
          <button onClick={()=>setShowCalc(false)} style={{background:"none",border:"none",color:"#666",cursor:"pointer",fontSize:18,lineHeight:1}}>×</button>
        </div>
        <div style={{padding:"8px 10px 4px",background:T.panel+"bb",textAlign:"right"}}>
          <div style={{fontSize:10,color:"#888",fontFamily:"monospace",minHeight:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{calcExpr||"0"}</div>
          <div style={{fontSize:26,color:calcResult==="Erreur"?"#e94560":T.ink,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,lineHeight:1.2}}>{calcResult||"0"}</div>
        </div>
        <div style={{padding:"6px 8px",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4}}>
          {[["C","CE","(","÷"],["7","8","9","×"],["4","5","6","−"],["1","2","3","+"],["%","0",".","="]].flat().map(btn=>(
            <button key={btn} onClick={()=>handleCalcBtn(btn)} style={{padding:"10px 0",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontWeight:600,fontSize:13,
              background:btn==="="?T.accent:["÷","×","−","+"].includes(btn)?T.accent+"33":["C"].includes(btn)?"rgba(233,69,96,.25)":T.bg,
              color:btn==="="?"#fff":["÷","×","−","+"].includes(btn)?T.accent:btn==="C"?"#e94560":T.ink,
              transition:"opacity .1s"}}
              onMouseDown={e=>e.currentTarget.style.opacity=".6"} onMouseUp={e=>e.currentTarget.style.opacity="1"}>
              {btn}
            </button>
          ))}
        </div>
        {calcHistory.length>0&&<div style={{borderTop:`1px solid ${T.border}`,padding:"4px 10px 6px",maxHeight:72,overflowY:"auto"}}>
          {calcHistory.slice(-4).reverse().map((h,i)=><div key={i} style={{fontSize:9,color:T.muted,fontFamily:"monospace",padding:"1px 0"}}>{h}</div>)}
        </div>}
      </div>}

      {/* ── POMODORO ──────────────────────────────────── */}
      {showTimer&&<div style={{position:"fixed",bottom:72,right:20,width:220,background:T.surface,borderRadius:16,boxShadow:"0 8px 36px rgba(0,0,0,.35)",border:`1px solid ${T.border}`,zIndex:89,overflow:"hidden",userSelect:"none"}}>
        <div style={{background:T.panel,padding:"9px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:12,color:"#fff"}}>⏱ Pomodoro</span>
          <button onClick={()=>setShowTimer(false)} style={{background:"none",border:"none",color:"#666",cursor:"pointer",fontSize:18,lineHeight:1}}>×</button>
        </div>
        <div style={{padding:"14px 14px 10px",textAlign:"center"}}>
          <div style={{fontSize:9,fontWeight:700,letterSpacing:2,color:timerMode==="work"?T.accent:"#4ade80",marginBottom:8,textTransform:"uppercase"}}>{timerMode==="work"?"⚡ Focus":"☕ Pause"}</div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:38,fontWeight:700,color:T.ink,lineHeight:1,marginBottom:10,letterSpacing:2}}>
            {String(Math.floor(timerSec/60)).padStart(2,'0')}:{String(timerSec%60).padStart(2,'0')}
          </div>
          <div style={{height:5,background:T.border,borderRadius:5,marginBottom:12,overflow:"hidden"}}>
            <div style={{height:"100%",background:timerMode==="work"?T.accent:"#4ade80",borderRadius:5,transition:"width 1s linear",
              width:`${timerMode==="work"?(1-timerSec/(25*60))*100:(1-timerSec/(5*60))*100}%`}}/>
          </div>
          <div style={{display:"flex",gap:6,justifyContent:"center",marginBottom:8}}>
            <button onClick={()=>setTimerRunning(v=>!v)} style={{padding:"8px 14px",borderRadius:8,
              background:timerRunning?"rgba(233,69,96,.15)":T.accent+"22",
              border:`1px solid ${timerRunning?"#e94560":T.accent}`,
              color:timerRunning?"#e94560":T.accent,cursor:"pointer",fontSize:11,fontWeight:700}}>
              {timerRunning?"⏸ Pause":"▶ Démarrer"}
            </button>
            <button onClick={()=>{setTimerRunning(false);setTimerSec(timerMode==="work"?25*60:5*60)}}
              style={{padding:"8px 10px",borderRadius:8,background:T.bg,border:`1px solid ${T.border}`,color:T.muted,cursor:"pointer",fontSize:14}}>↺</button>
          </div>
          <div style={{display:"flex",gap:4,justifyContent:"center"}}>
            {[[5,"5min"],[10,"10min"],[25,"25min"]].map(([m,l])=>(
              <button key={m} onClick={()=>{setTimerRunning(false);setTimerSec(m*60);setTimerMode("work")}}
                style={{padding:"3px 7px",borderRadius:6,background:T.bg,border:`1px solid ${T.border}`,color:T.muted,cursor:"pointer",fontSize:9}}>{l}</button>
            ))}
          </div>
        </div>
      </div>}

      {/* ── CONVERTISSEUR ─────────────────────────────── */}
      {showConv&&(()=>{
        const TO_MM={mm:1,cm:10,m:1000,ft:304.8,in:25.4}
        const UNITS=["mm","cm","m","ft","in"]
        const base=parseFloat(convVal)*TO_MM[convFrom]
        const scParts=scale.split(":").map(Number)
        const scFactor=scParts.length===2&&scParts[0]>0?scParts[1]/scParts[0]:50
        const scaleRes=isNaN(base)?null:{
          real_mm:Math.round(base*scFactor*100)/100,
          real_cm:Math.round(base*scFactor/10*100)/100,
          real_m:Math.round(base*scFactor/1000*1000)/1000,
        }
        const offset=20+(showTimer?240:0)+(showCalc?252:0)
        return(
        <div style={{position:"fixed",bottom:72,right:offset,width:238,background:T.surface,borderRadius:16,boxShadow:"0 8px 36px rgba(0,0,0,.35)",border:`1px solid ${T.border}`,zIndex:88,overflow:"hidden",userSelect:"none"}}>
          <div style={{background:T.panel,padding:"9px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:12,color:"#fff"}}>📐 Convertisseur</span>
            <button onClick={()=>setShowConv(false)} style={{background:"none",border:"none",color:"#666",cursor:"pointer",fontSize:18,lineHeight:1}}>×</button>
          </div>
          {/* Mode tabs */}
          <div style={{display:"flex",borderBottom:`1px solid ${T.border}`}}>
            {[["unit","Unités"],["scale","Échelle"]].map(([m,l])=>(
              <button key={m} onClick={()=>setConvMode(m)} style={{flex:1,padding:"6px 0",border:"none",cursor:"pointer",fontSize:10,fontWeight:convMode===m?700:400,background:convMode===m?`${T.accent}15`:T.bg,color:convMode===m?T.accent:T.muted}}>
                {l}
              </button>
            ))}
          </div>
          <div style={{padding:"10px 12px",display:"flex",flexDirection:"column",gap:8}}>
            {/* Input */}
            <div style={{display:"flex",gap:6}}>
              <input value={convVal} onChange={e=>setConvVal(e.target.value.replace(/[^0-9.,]/g,""))} placeholder="0"
                style={{flex:1,padding:"7px 10px",borderRadius:8,border:`1px solid ${T.border}`,background:T.bg,color:T.ink,fontSize:16,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,outline:"none",textAlign:"right"}}
                onFocus={e=>e.target.style.borderColor=T.accent}
                onBlur={e=>e.target.style.borderColor=T.border}/>
              <select value={convFrom} onChange={e=>setConvFrom(e.target.value)}
                style={{padding:"7px 8px",borderRadius:8,border:`1px solid ${T.border}`,background:T.bg,color:T.accent,fontSize:12,fontWeight:700,outline:"none",cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}}>
                {UNITS.map(u=><option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            {convMode==="unit"&&(
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                {UNITS.filter(u=>u!==convFrom).map(u=>{
                  const val=isNaN(base)?"-":String(Math.round(base/TO_MM[u]*100000)/100000)
                  return(
                    <div key={u} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 9px",borderRadius:8,background:T.bg,border:`1px solid ${T.border}`}}>
                      <span style={{fontSize:9,color:T.muted,fontFamily:"monospace",minWidth:20}}>{u}</span>
                      <span style={{fontSize:14,color:T.ink,fontFamily:"'JetBrains Mono',monospace",fontWeight:600}}>{val}</span>
                      <button onClick={()=>{setConvFrom(u);setConvVal(val==="- "?"":val)}}
                        style={{background:"none",border:"none",color:T.accent,cursor:"pointer",fontSize:9,padding:"2px 4px"}}>↩</button>
                    </div>
                  )
                })}
              </div>
            )}

            {convMode==="scale"&&(
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                <div style={{fontSize:9,color:T.muted,textAlign:"center"}}>Échelle active : <strong style={{color:T.accent}}>{scale}</strong></div>
                {scaleRes?(
                  <>
                    <div style={{padding:"7px 9px",borderRadius:8,background:`${T.accent}10`,border:`1px solid ${T.accent}33`,display:"flex",justifyContent:"space-between"}}>
                      <span style={{fontSize:9,color:T.muted}}>Réalité (mm)</span>
                      <span style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:700,color:T.ink,fontSize:13}}>{scaleRes.real_mm}</span>
                    </div>
                    <div style={{padding:"7px 9px",borderRadius:8,background:T.bg,border:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between"}}>
                      <span style={{fontSize:9,color:T.muted}}>Réalité (cm)</span>
                      <span style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:700,color:T.ink,fontSize:13}}>{scaleRes.real_cm}</span>
                    </div>
                    <div style={{padding:"7px 9px",borderRadius:8,background:T.bg,border:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between"}}>
                      <span style={{fontSize:9,color:T.muted}}>Réalité (m)</span>
                      <span style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:700,color:T.accent,fontSize:13}}>{scaleRes.real_m}</span>
                    </div>
                    <div style={{fontSize:8,color:T.muted,textAlign:"center",marginTop:2}}>
                      {convVal||"0"}{convFrom} dessin → {scaleRes.real_m}m réel
                    </div>
                  </>
                ):(
                  <div style={{textAlign:"center",color:T.muted,fontSize:11,padding:"10px 0"}}>Entrez une valeur</div>
                )}
                {/* Quick scale presets */}
                <div style={{display:"flex",flexWrap:"wrap",gap:3,marginTop:2}}>
                  {["1:20","1:50","1:100","1:200","1:500"].map(s=>(
                    <button key={s} onClick={()=>setScale(s)}
                      style={{padding:"3px 7px",borderRadius:6,background:scale===s?`${T.accent}18`:T.bg,border:`1px solid ${scale===s?T.accent:T.border}`,color:scale===s?T.accent:T.muted,cursor:"pointer",fontSize:9}}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )})()}

      {/* ── FLASHCARDS ────────────────────────────────── */}
      {showFlash&&(()=>{
        const flashOffset=20+(showTimer?240:0)+(showCalc?252:0)+(showConv?258:0)
        const card=flashCards[flashIdx]
        return(
        <div style={{position:"fixed",bottom:72,right:flashOffset,width:280,background:T.surface,borderRadius:16,boxShadow:"0 8px 36px rgba(0,0,0,.35)",border:`1px solid ${T.border}`,zIndex:87,overflow:"hidden",userSelect:"none"}}>
          <div style={{background:T.panel,padding:"9px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:12,color:"#fff"}}>🃏 Flashcards ({flashCards.length})</span>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <button onClick={()=>setFlashReview(v=>!v)} style={{background:flashReview?T.accent:"transparent",border:`1px solid ${flashReview?T.accent:T.border}`,borderRadius:6,color:flashReview?"#fff":T.muted,cursor:"pointer",fontSize:9,padding:"2px 7px",fontWeight:700}}>{flashReview?"✕ Révision":"▶ Réviser"}</button>
              <button onClick={()=>setShowFlash(false)} style={{background:"none",border:"none",color:"#666",cursor:"pointer",fontSize:18,lineHeight:1}}>×</button>
            </div>
          </div>

          {flashReview&&flashCards.length>0?(
            <div style={{padding:"14px 14px 12px"}}>
              {/* Card flip area */}
              <div onClick={()=>setFlashFlipped(v=>!v)} style={{minHeight:120,borderRadius:12,background:flashFlipped?`${T.accent}18`:T.bg,border:`2px solid ${flashFlipped?T.accent:T.border}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"14px 12px",cursor:"pointer",transition:"all .25s",textAlign:"center"}}>
                <div style={{fontSize:8,fontWeight:700,letterSpacing:1,color:T.muted,marginBottom:6,textTransform:"uppercase"}}>{flashFlipped?"RÉPONSE ✓":"QUESTION — clic pour retourner"}</div>
                <div style={{fontSize:13,color:flashFlipped?T.accent:T.ink,fontWeight:flashFlipped?700:400,lineHeight:1.5}}>{flashFlipped?card.a:card.q}</div>
              </div>
              {/* Navigation */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:10}}>
                <button onClick={()=>{setFlashIdx(i=>Math.max(0,i-1));setFlashFlipped(false)}} disabled={flashIdx===0}
                  style={{padding:"5px 12px",borderRadius:8,background:T.bg,border:`1px solid ${T.border}`,color:flashIdx===0?T.border:T.muted,cursor:flashIdx===0?"default":"pointer",fontSize:12}}>‹</button>
                <span style={{fontSize:10,color:T.muted,fontFamily:"monospace"}}>{flashIdx+1} / {flashCards.length}</span>
                <button onClick={()=>{setFlashIdx(i=>Math.min(flashCards.length-1,i+1));setFlashFlipped(false)}} disabled={flashIdx===flashCards.length-1}
                  style={{padding:"5px 12px",borderRadius:8,background:T.bg,border:`1px solid ${T.border}`,color:flashIdx===flashCards.length-1?T.border:T.muted,cursor:flashIdx===flashCards.length-1?"default":"pointer",fontSize:12}}>›</button>
              </div>
              <div style={{display:"flex",gap:4,justifyContent:"center",marginTop:8}}>
                <button onClick={()=>{setFlashIdx(Math.floor(Math.random()*flashCards.length));setFlashFlipped(false)}}
                  style={{padding:"4px 10px",borderRadius:7,background:T.bg,border:`1px solid ${T.border}`,color:T.muted,cursor:"pointer",fontSize:9}}>🔀 Aléatoire</button>
                <button onClick={()=>deleteFlashCard(card.id)}
                  style={{padding:"4px 10px",borderRadius:7,background:"rgba(233,69,96,.1)",border:"1px solid rgba(233,69,96,.3)",color:"#e94560",cursor:"pointer",fontSize:9}}>🗑 Supprimer</button>
              </div>
            </div>
          ):(
            <div style={{padding:"10px 12px",display:"flex",flexDirection:"column",gap:8}}>
              {/* Add card form */}
              <div style={{fontSize:8,fontWeight:700,color:T.muted,letterSpacing:.8}}>NOUVELLE CARTE</div>
              <textarea value={flashQ} onChange={e=>setFlashQ(e.target.value)} placeholder="Question…"
                style={{padding:"7px 9px",borderRadius:8,border:`1px solid ${T.border}`,background:T.bg,color:T.ink,fontSize:11,outline:"none",resize:"none",height:48,fontFamily:"inherit"}}
                onFocus={e=>e.target.style.borderColor=T.accent} onBlur={e=>e.target.style.borderColor=T.border}/>
              <textarea value={flashA} onChange={e=>setFlashA(e.target.value)} placeholder="Réponse…"
                style={{padding:"7px 9px",borderRadius:8,border:`1px solid ${T.accent}44`,background:`${T.accent}06`,color:T.ink,fontSize:11,outline:"none",resize:"none",height:48,fontFamily:"inherit"}}
                onFocus={e=>e.target.style.borderColor=T.accent} onBlur={e=>e.target.style.borderColor=T.accent+"44"}/>
              <button onClick={addFlashCard} disabled={!flashQ.trim()||!flashA.trim()}
                style={{padding:"8px 0",borderRadius:9,background:flashQ.trim()&&flashA.trim()?`linear-gradient(135deg,${T.accent},${T.a2})`:T.border,border:"none",color:"#fff",fontWeight:700,fontSize:12,cursor:flashQ.trim()&&flashA.trim()?"pointer":"not-allowed"}}>
                + Ajouter la carte
              </button>
              {/* Cards list */}
              {flashCards.length>0&&<div style={{borderTop:`1px solid ${T.border}`,paddingTop:8,display:"flex",flexDirection:"column",gap:4,maxHeight:140,overflowY:"auto"}}>
                {flashCards.map((c,i)=>(
                  <div key={c.id} style={{display:"flex",alignItems:"flex-start",gap:6,padding:"5px 7px",borderRadius:7,background:T.bg,border:`1px solid ${T.border}`}}>
                    <div style={{flex:1,overflow:"hidden"}}>
                      <div style={{fontSize:9,fontWeight:700,color:T.ink,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>Q: {c.q}</div>
                      <div style={{fontSize:8,color:T.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>R: {c.a}</div>
                    </div>
                    <button onClick={()=>{setFlashIdx(i);setFlashReview(true);setFlashFlipped(false)}}
                      style={{background:"none",border:"none",color:T.accent,cursor:"pointer",fontSize:9,padding:"0 2px",flexShrink:0}}>▶</button>
                    <button onClick={()=>deleteFlashCard(c.id)}
                      style={{background:"none",border:"none",color:"#e94560",cursor:"pointer",fontSize:11,padding:"0 2px",flexShrink:0}}>×</button>
                  </div>
                ))}
              </div>}
            </div>
          )}
        </div>
      )})()}

      {/* ── HISTORIQUE DE VERSIONS ────────────────────── */}
      {showHistory&&<div style={{position:"fixed",top:0,right:0,bottom:0,width:280,background:T.surface,borderLeft:`1px solid ${T.border}`,zIndex:150,display:"flex",flexDirection:"column",boxShadow:"-4px 0 24px rgba(0,0,0,.2)"}}>
        <div style={{background:T.panel,padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,color:"#fff"}}>🕐 Historique ({pageHistory.length})</span>
          <button onClick={()=>setShowHistory(false)} style={{background:"none",border:"none",color:"#888",cursor:"pointer",fontSize:20,lineHeight:1}}>×</button>
        </div>
        <div style={{padding:"10px 10px 6px",borderBottom:`1px solid ${T.border}`,display:"flex",gap:6}}>
          <button onClick={()=>saveVersion()} style={{flex:1,padding:"7px 0",borderRadius:8,background:`linear-gradient(135deg,${T.accent},${T.a2})`,border:"none",color:"#fff",fontWeight:700,fontSize:11,cursor:"pointer"}}>📸 Sauvegarder version</button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:8,display:"flex",flexDirection:"column",gap:6}}>
          {pageHistory.length===0&&<div style={{textAlign:"center",padding:"30px 0",color:T.muted,fontSize:12}}>Aucune version sauvegardée.<br/>Cliquez sur "Sauvegarder version".</div>}
          {pageHistory.map((ver,i)=>(
            <div key={ver.ts} style={{borderRadius:10,border:`1px solid ${T.border}`,overflow:"hidden",background:T.bg}}>
              {ver.snap&&<img src={ver.snap} alt="" style={{width:"100%",height:80,objectFit:"cover",display:"block",opacity:.85}}/>}
              <div style={{padding:"6px 9px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:T.ink}}>{i===0?"Dernière":"Version "+(pageHistory.length-i)}</div>
                  <div style={{fontSize:8,color:T.muted,fontFamily:"monospace"}}>{ver.label}</div>
                </div>
                <button onClick={()=>restoreVersion(ver)} style={{padding:"4px 9px",borderRadius:7,background:`${T.accent}18`,border:`1px solid ${T.accent}44`,color:T.accent,cursor:"pointer",fontSize:9,fontWeight:700}}>Restaurer</button>
              </div>
            </div>
          ))}
        </div>
      </div>}

      <FloatingPanel T={T} color={color} setColor={setColor} sizeMm={sizeMm} setSizeMm={setSizeMm} tool={tool} setTool={setTool} eraserMm={eraserMm} setEraserMm={setEraserMm} favorites={favorites} setFavorites={setFavorites} unitSys={unitSys}/>

      {libPending&&<div style={{position:"fixed",bottom:52,left:"50%",transform:"translateX(-50%)",zIndex:50,background:T.panel,color:"#fff",padding:"7px 14px",borderRadius:20,fontSize:11,pointerEvents:"none",boxShadow:"0 4px 16px rgba(0,0,0,.3)"}}>
        📍 Clic sur la feuille → <strong>{libPending.l}</strong> — Échap pour annuler
      </div>}

      {/* FOCUS MODE — barre flottante */}
      {focusMode&&<div style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",zIndex:200,background:T.panel,borderRadius:16,padding:"6px 10px",display:"flex",gap:4,alignItems:"center",boxShadow:"0 8px 32px rgba(0,0,0,.4)",border:`1px solid ${T.accent}22`}}>
        {TOOLS_LIST.flatMap(g=>g.items).map(t=>(
          <button key={t.id} title={t.l} onClick={()=>setTool(t.id)}
            style={{padding:"5px 8px",borderRadius:8,border:`1px solid ${tool===t.id?T.accent:"transparent"}`,background:tool===t.id?`${T.accent}25`:"transparent",color:tool===t.id?T.accent:"#aaa",cursor:"pointer",fontSize:13}}>
            {t.i}
          </button>
        ))}
        <div style={{width:1,height:18,background:"#ffffff14",margin:"0 2px"}}/>
        <div style={{width:16,height:16,borderRadius:"50%",background:color,border:"2px solid rgba(255,255,255,.3)",cursor:"pointer"}}/>
        <div style={{width:1,height:18,background:"#ffffff14",margin:"0 2px"}}/>
        <button onClick={()=>window.__undo?.()} style={{padding:"5px 8px",borderRadius:8,background:"transparent",border:"1px solid transparent",color:"#aaa",cursor:"pointer",fontSize:12}}>↩</button>
        <button onClick={()=>setFocusMode(false)} title="Quitter focus" style={{padding:"4px 8px",borderRadius:8,background:"rgba(168,85,247,.2)",border:"1px solid #a855f7",color:"#a855f7",cursor:"pointer",fontSize:9,fontWeight:700,marginLeft:2}}>⛶ Exit</button>
      </div>}
      {readOnly&&<div style={{position:"fixed",top:60,left:"50%",transform:"translateX(-50%)",zIndex:50,background:"rgba(233,69,96,.9)",color:"#fff",padding:"6px 14px",borderRadius:20,fontSize:11,fontWeight:700}}>🔒 Mode lecture seule</div>}

      {/* TOP BAR */}
      <div style={{height:46,background:T.panel,display:"flex",alignItems:"center",padding:"0 10px",gap:5,flexShrink:0,boxShadow:"0 2px 16px rgba(0,0,0,.3)",zIndex:30}}>
        <button onClick={()=>navigate("/")}style={{background:"none",border:"none",color:"#888",cursor:"pointer",fontSize:11,padding:"4px 7px",borderRadius:7}}>← Retour</button>
        <div style={{width:1,height:20,background:"#ffffff14"}}/>
        <div style={{flex:1,fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:12,color:"#ddd",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{nb.title}</div>
        {collabCursors.length>0&&<div style={{display:"flex",gap:2}}>{collabCursors.map((c,i)=><div key={c.userId}title={c.userName}style={{width:20,height:20,borderRadius:"50%",background:COLLAB_COLORS[i%6],display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,color:"#fff",border:"2px solid rgba(255,255,255,.3)"}}>{(c.userName||"?")[0].toUpperCase()}</div>)}</div>}
        <div style={{display:"flex",gap:4,alignItems:"center"}}>
          {saveStatus==="saving"&&<span style={{fontSize:9,color:"#f5a623"}}>⏳</span>}
          {saveStatus==="saved"&&<span style={{fontSize:9,color:"#4ade80"}}>✓</span>}
          <div style={{display:"flex",borderRadius:6,overflow:"hidden",border:"1px solid #ffffff14"}}>
            <button onClick={()=>{setUnitSys("metric");setScale("1:50")}}style={{padding:"3px 7px",background:unitSys==="metric"?"rgba(200,98,42,.4)":"transparent",border:"none",color:unitSys==="metric"?"#fff":"#777",cursor:"pointer",fontSize:9}}>mm</button>
            <button onClick={()=>{setUnitSys("imperial");setScale('1/4"=1\'')}}style={{padding:"3px 7px",background:unitSys==="imperial"?"rgba(200,98,42,.4)":"transparent",border:"none",color:unitSys==="imperial"?"#fff":"#777",cursor:"pointer",fontSize:9}}>in</button>
          </div>
          <select value={scale}onChange={e=>setScale(e.target.value)}style={{padding:"3px 5px",borderRadius:6,border:"1px solid #ffffff14",background:"#ffffff0c",color:"#aaa",fontSize:9,outline:"none",cursor:"pointer"}}>
            {(unitSys==="metric"?SCALES_M:SCALES_I).map(s=><option key={s}value={s}>{s}</option>)}
          </select>
          <div style={{display:"flex",alignItems:"center",gap:2,background:"#ffffff0a",borderRadius:6,padding:"0 6px",border:"1px solid #ffffff10"}}>
            <button onClick={()=>setZoom(z=>Math.max(.25,z-.1))}style={{background:"none",border:"none",color:"#aaa",cursor:"pointer",fontSize:13}}>−</button>
            <span style={{color:"#666",fontSize:9,minWidth:26,textAlign:"center"}}>{Math.round(zoom*100)}%</span>
            <button onClick={()=>setZoom(z=>Math.min(3,z+.1))}style={{background:"none",border:"none",color:"#aaa",cursor:"pointer",fontSize:13}}>+</button>
          </div>
          {/* Quick action buttons */}
          {[
            [()=>setShowLib(v=>!v),"🏗",showLib,"Bibliothèque"],
            [()=>setShowPagePanel(v=>!v),"📋",showPagePanel,"Pages"],
            [()=>setShowPageSettings(true),"🎨","","Fond/Grille"],
            [()=>setShowTheme(true),"✨","","Thème"],
            [()=>setShowLayers(v=>!v),"⊞",showLayers,"Calques"],
            [()=>setShowRuler(v=>!v),"📏",showRuler,"Règle"],
          ].map(([fn,label,active,title],i)=>(
            <button key={i}onClick={fn}title={title}style={{padding:"3px 7px",borderRadius:6,border:`1px solid ${active?T.accent:"#ffffff14"}`,background:active?`${T.accent}22`:"#ffffff0a",color:active?T.accent:"#888",cursor:"pointer",fontSize:10}}>{label}</button>
          ))}
          <button onClick={()=>setInfiniteMode(v=>!v)}title="Canvas infini"style={{padding:"3px 7px",borderRadius:6,border:`1px solid ${infiniteMode?"#00ffcc":"#ffffff14"}`,background:infiniteMode?"rgba(0,255,204,.15)":"#ffffff0a",color:infiniteMode?"#00ffcc":"#888",cursor:"pointer",fontSize:9}}>∞{infiniteMode?"✓":""}</button>
          <button onClick={()=>setShowHistory(v=>!v)}title="Historique versions"style={{padding:"3px 7px",borderRadius:6,border:`1px solid ${showHistory?T.accent:"#ffffff14"}`,background:showHistory?`${T.accent}22`:"#ffffff0a",color:showHistory?T.accent:"#888",cursor:"pointer",fontSize:10}}>🕐</button>
          <button onClick={()=>setPencilOnly(v=>!v)}title="Mode Apple Pencil — bloque le doigt"style={{padding:"3px 7px",borderRadius:6,border:`1px solid ${pencilOnly?"#a855f7":"#ffffff14"}`,background:pencilOnly?"rgba(168,85,247,.2)":"#ffffff0a",color:pencilOnly?"#a855f7":"#888",cursor:"pointer",fontSize:9}}>✏️{pencilOnly?"✓":""}</button>
          <button onClick={()=>setReadOnly(v=>!v)}title="Mode lecture seule"style={{padding:"3px 7px",borderRadius:6,border:`1px solid ${readOnly?"#e94560":"#ffffff14"}`,background:readOnly?"rgba(233,69,96,.2)":"#ffffff0a",color:readOnly?"#e94560":"#888",cursor:"pointer",fontSize:10}}>🔒</button>
          <button onClick={()=>setShowPresent(true)}title="Mode présentation"style={{padding:"3px 7px",borderRadius:6,border:"1px solid #ffffff14",background:"#ffffff0a",color:"#888",cursor:"pointer",fontSize:10}}>📽</button>
          <button onClick={()=>setShowCalc(v=>!v)}title="Calculatrice"style={{padding:"3px 7px",borderRadius:6,border:`1px solid ${showCalc?T.accent:"#ffffff14"}`,background:showCalc?`${T.accent}22`:"#ffffff0a",color:showCalc?T.accent:"#888",cursor:"pointer",fontSize:10}}>🔢</button>
          <button onClick={()=>setShowConv(v=>!v)}title="Convertisseur"style={{padding:"3px 7px",borderRadius:6,border:`1px solid ${showConv?T.accent:"#ffffff14"}`,background:showConv?`${T.accent}22`:"#ffffff0a",color:showConv?T.accent:"#888",cursor:"pointer",fontSize:10}}>📐</button>
          <button onClick={()=>setShowTimer(v=>!v)}title="Pomodoro"style={{padding:"3px 7px",borderRadius:6,border:`1px solid ${showTimer?"#4ade80":"#ffffff14"}`,background:showTimer?"rgba(74,222,128,.15)":"#ffffff0a",color:showTimer?"#4ade80":"#888",cursor:"pointer",fontSize:10}}>{timerRunning?`⏱${String(Math.floor(timerSec/60)).padStart(2,'0')}:${String(timerSec%60).padStart(2,'0')}`:"⏱"}</button>
          <button onClick={()=>setShowFlash(v=>!v)}title={`Flashcards (${flashCards.length})`}style={{padding:"3px 7px",borderRadius:6,border:`1px solid ${showFlash?"#a855f7":"#ffffff14"}`,background:showFlash?"rgba(168,85,247,.2)":"#ffffff0a",color:showFlash?"#a855f7":"#888",cursor:"pointer",fontSize:10}}>🃏{flashCards.length>0?flashCards.length:""}</button>
          <button onClick={()=>setFocusMode(v=>!v)}title="Mode focus"style={{padding:"3px 7px",borderRadius:6,border:`1px solid ${focusMode?"#a855f7":"#ffffff14"}`,background:focusMode?"rgba(168,85,247,.2)":"#ffffff0a",color:focusMode?"#a855f7":"#888",cursor:"pointer",fontSize:10}}>⛶</button>
          <button onClick={()=>setShowShare(true)}style={{padding:"3px 7px",borderRadius:6,border:"1px solid #ffffff14",background:"#ffffff0a",color:"#88c",cursor:"pointer",fontSize:9}}>🤝</button>
          <label title="Importer image"style={{padding:"3px 7px",borderRadius:6,border:"1px solid #ffffff14",background:"#ffffff0a",color:"#888",cursor:"pointer",fontSize:9}}>
            📎<input type="file"accept="image/*"style={{display:"none"}}onChange={handleImport}/>
          </label>
          <button onClick={exportPNG}disabled={exporting}title="Exporter PNG 2x"style={{padding:"3px 7px",borderRadius:6,border:"1px solid rgba(74,222,128,.3)",background:"rgba(74,222,128,.1)",color:"#4ade80",cursor:"pointer",fontSize:9}}>{exporting?"⏳":"⬇️"}</button>
          <button onClick={()=>window.__undo?.()}style={{padding:"3px 7px",borderRadius:6,border:"1px solid #ffffff14",background:"#ffffff0a",color:"#aaa",cursor:"pointer",fontSize:11}}>↩</button>
          <button onClick={()=>window.__clear?.()}style={{padding:"3px 7px",borderRadius:6,border:"1px solid rgba(233,69,96,.3)",background:"rgba(233,69,96,.1)",color:"#e94560",cursor:"pointer",fontSize:9}}>🗑</button>
        </div>
      </div>

      {/* TOOLS ROW */}
      <div style={{height:focusMode?0:36,overflow:"hidden",background:T.surface,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",padding:focusMode?"0":"0 10px",gap:4,flexShrink:0,overflowX:focusMode?"hidden":"auto",transition:"height .3s ease"}}>
        {TOOLS_LIST.map(grp=>(
          <div key={grp.g}style={{display:"flex",gap:2,paddingRight:6,marginRight:3,borderRight:`1px solid ${T.border}`,flexShrink:0}}>
            {grp.items.map(t=>(
              <button key={t.id}title={t.l}onClick={()=>setTool(t.id)}
                style={{height:25,padding:"0 6px",borderRadius:6,border:`1px solid ${tool===t.id?T.accent:T.border}`,background:tool===t.id?`${T.accent}18`:T.bg,color:tool===t.id?T.accent:T.muted,cursor:"pointer",fontSize:11,display:"flex",alignItems:"center",gap:3,whiteSpace:"nowrap",flexShrink:0}}>
                <span>{t.i}</span><span style={{fontSize:8}}>{t.l}</span>
              </button>
            ))}
          </div>
        ))}
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
          <div style={{width:12,height:12,borderRadius:"50%",background:tool==="eraser"?"#eee":color,border:`1px solid ${T.border}`}}/>
          <span style={{fontSize:9,color:T.muted,fontFamily:"monospace"}}>{formatDimension(tool==="eraser"?eraserMm:sizeMm,unitSys)} · {tool}</span>
        </div>
      </div>

      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        {/* PAGE THUMBNAILS */}
        {showPagePanel&&!focusMode&&<div style={{width:110,background:T.surface,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",flexShrink:0}}>
          <div style={{padding:"8px 8px 6px",borderBottom:`1px solid ${T.border}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <div style={{fontSize:10,fontWeight:700,color:T.accent}}>Pages</div>
              <div style={{display:"flex",gap:3}}>
                <button onClick={addPage}title="Ajouter page"style={{background:"none",border:"none",cursor:"pointer",color:T.accent,fontSize:14,lineHeight:1}}>+</button>
                <button onClick={duplicatePage}title="Dupliquer page courante"style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:11}}>⊕</button>
              </div>
            </div>
            <select value={nextPageFmt}onChange={e=>setNextPageFmt(e.target.value)}style={{width:"100%",fontSize:8,padding:"2px 3px",borderRadius:5,border:`1px solid ${T.border}`,background:T.bg,color:T.ink,outline:"none",cursor:"pointer"}}>
              {PAGE_FORMATS.map(f=><option key={f.id}value={f.id}>{f.l} — {f.desc}</option>)}
            </select>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:6,display:"flex",flexDirection:"column",gap:6}}>
            {Array.from({length:nb.pages_count||1},(_,i)=>{
              const pageData=pages.find(p=>p.page_number===i+1)
              return<PageThumbnail key={i+1} pageData={pageData} pageNum={i+1} current={page===i+1} T={T} onClick={()=>setPage(i+1)}/>
            })}
          </div>
        </div>}

        {/* CANVAS */}
        <div style={{flex:1,overflow:"hidden",background:T.bg,position:"relative",cursor:libPending?"crosshair":isPanMode?"grab":"default"}}
          id="canvas-area"
          onMouseMove={e=>{
            if(libPending)setMousePos({x:e.clientX,y:e.clientY})
            if(isPanMode&&isPanning.current&&panStart.current){setPanX(e.clientX-panStart.current.x);setPanY(e.clientY-panStart.current.y)}
            const r=document.getElementById("canvas-area")?.getBoundingClientRect()
            if(r)broadcastCursor((e.clientX-r.left-panX)/zoom,(e.clientY-r.top-panY)/zoom)
          }}
          onMouseDown={e=>{if(libPending){handleCanvasAreaClick(e);return};if(isPanMode){isPanning.current=true;panStart.current={x:e.clientX-panX,y:e.clientY-panY}}}}
          onMouseUp={()=>{isPanning.current=false}}
          onKeyDown={e=>{if(e.key==="Escape")setLibPending(null)}}
          tabIndex={0}>

          {/* Ghost preview */}
          {libPending&&(()=>{
            const r=document.getElementById("canvas-area")?.getBoundingClientRect()
            if(!r)return null
            const sc=3.78/50,elW=(libPending.fw||libPending.w)*sc*zoom,elH=libPending.h*sc*zoom
            return<div style={{position:"absolute",left:mousePos.x-r.left-elW/2,top:mousePos.y-r.top-elH/2,zIndex:50,opacity:.55,pointerEvents:"none",transform:`scale(${zoom})`,transformOrigin:"top left"}}>{renderEl(libPending,1/50)}</div>
          })()}

          {/* Collab cursors */}
          {collabCursors.map((c,i)=>{
            const r=document.getElementById("canvas-area")?.getBoundingClientRect()
            if(!r)return null
            return<div key={c.userId}style={{position:"absolute",left:c.x*zoom+panX,top:c.y*zoom+panY,zIndex:60,pointerEvents:"none"}}>
              <div style={{width:12,height:12,background:COLLAB_COLORS[i%6],clipPath:"polygon(0 0,100% 30%,40% 40%,30% 100%)"}}/>
              <div style={{position:"absolute",top:12,left:8,background:COLLAB_COLORS[i%6],color:"#fff",fontSize:9,padding:"2px 5px",borderRadius:6,whiteSpace:"nowrap",fontWeight:600}}>{c.userName||"?"}</div>
            </div>
          })}

          <div style={{transform:`translate(${panX}px,${panY}px) scale(${zoom})`,transformOrigin:"center center",position:"absolute",top:"50%",left:"50%",marginLeft:infiniteMode?-1500:-(fmt.w/2),marginTop:infiniteMode?-1500:-(fmt.h/2)}}>
            <div style={{width:PW,height:PH,position:"relative",boxShadow:infiniteMode?"none":"0 4px 40px rgba(0,0,0,.2)",background:infiniteMode?(pageColor||T.paper):"none"}}>
              {infiniteMode&&<svg style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:0}}width={3000}height={3000}><defs><pattern id="inf-grid"width={37.8}height={37.8}patternUnits="userSpaceOnUse"><path d={`M 37.8 0 L 0 0 0 37.8`}fill="none"stroke={gridColor||T.grid}strokeWidth={.6}/></pattern></defs><rect width={3000}height={3000}fill={`url(#inf-grid)`}/></svg>}
              {!infiniteMode&&<Paper tmpl={nb.template||"plan"} T={T} pageColor={pageColor} gridColor={gridColor} PW={fmt.w} PH={fmt.h}/>}

              {/* Imported images */}
              {importedImages.map(img=>(
                <div key={img.id}style={{position:"absolute",left:img.x,top:img.y,zIndex:3,cursor:"move",userSelect:"none"}}
                  onMouseDown={e=>{e.stopPropagation();const ox=e.clientX/zoom-img.x,oy=e.clientY/zoom-img.y;const mm=ev=>setImportedImages(p=>p.map(i=>i.id===img.id?{...i,x:ev.clientX/zoom-ox,y:ev.clientY/zoom-oy}:i));const mu=()=>{window.removeEventListener("mousemove",mm);window.removeEventListener("mouseup",mu)};window.addEventListener("mousemove",mm);window.addEventListener("mouseup",mu)}}>
                  <img src={img.src}alt=""style={{width:img.w,height:img.h,display:"block",opacity:.88,pointerEvents:"none"}}/>
                  <button onClick={()=>setImportedImages(p=>p.filter(i=>i.id!==img.id))}style={{position:"absolute",top:-8,right:-8,width:18,height:18,borderRadius:"50%",background:"#e94560",border:"none",color:"#fff",cursor:"pointer",fontSize:10,fontWeight:700}}>×</button>
                </div>
              ))}

              {/* Structural elements */}
              {placed.map(item=>{
                const sel=selected===item.id
                return<div key={item.id}style={{position:"absolute",left:item.x,top:item.y,cursor:readOnly||isPanMode?"default":"move",pointerEvents:"all",userSelect:"none",outline:sel?"2px solid #c8622a":"none",outlineOffset:2,zIndex:sel?12:10}}
                  onMouseDown={e=>{if(readOnly||isPanMode)return;e.stopPropagation();setSelected(item.id);const ox=e.clientX/zoom-item.x,oy=e.clientY/zoom-item.y;const mm=ev=>setPlaced(p=>p.map(e=>e.id===item.id?{...e,x:ev.clientX/zoom-ox,y:ev.clientY/zoom-oy}:e));const mu=()=>{window.removeEventListener("mousemove",mm);window.removeEventListener("mouseup",mu)};window.addEventListener("mousemove",mm);window.addEventListener("mouseup",mu)}}>
                  {item.el.type==="sym"?renderSym(item.el,1/50):renderEl(item.el,1/50)}
                  {sel&&!readOnly&&<button onClick={()=>{setPlaced(p=>p.filter(e=>e.id!==item.id));setSelected(null)}}style={{position:"absolute",top:-10,right:-10,width:20,height:20,borderRadius:"50%",background:"#e94560",border:"none",color:"#fff",cursor:"pointer",fontSize:11,fontWeight:700,zIndex:20}}>×</button>}
                </div>
              })}

              {/* Ruler */}
              {showRuler&&<div style={{position:"absolute",top:0,left:0,right:0,height:24,background:T.surface,borderBottom:`1px solid ${T.border}`,zIndex:15,opacity:.9}}>
                <svg width={794}height={24}style={{display:"block"}}>{Array.from({length:80},(_,i)=>{const x=i*10,big=i%10===0,med=i%5===0;return<g key={i}><line x1={x}y1={24}x2={x}y2={big?5:med?10:17}stroke={T.muted}strokeWidth={big?1:.5}/>{big&&<text x={x+2}y={8}fontSize={6}fill={T.muted}fontFamily="monospace">{i*(unitSys==="metric"?10:1)}{unitSys==="metric"?"mm":"\"" }</text>}</g>})}</svg>
              </div>}

              {/* Cartouche architectural */}
              {["plan","elevation","section","detail"].includes(nb.template)&&(
                <div style={{position:"absolute",bottom:12,left:24,right:24,height:78,pointerEvents:"none",zIndex:6}}>
                  <div style={{position:"absolute",left:6,bottom:28,fontSize:7,fontFamily:"monospace",color:T.pline}}>PROJET</div>
                  <div style={{position:"absolute",left:6,bottom:8,fontSize:10,fontFamily:"'Syne',sans-serif",fontWeight:700,color:T.pline}}>{nb.title}</div>
                  <div style={{position:"absolute",left:298,bottom:28,fontSize:7,fontFamily:"monospace",color:T.pline}}>N° PLANCHE</div>
                  <div style={{position:"absolute",left:298,bottom:8,fontSize:9,color:T.pline}}>{page.toString().padStart(2,"0")}</div>
                  <div style={{position:"absolute",left:548,bottom:28,fontSize:7,fontFamily:"monospace",color:T.pline}}>ÉCHELLE</div>
                  <div style={{position:"absolute",left:548,bottom:8,fontSize:9,color:T.pline}}>{scale}</div>
                </div>
              )}

              {!readOnly&&!isPanMode&&<DrawCanvas tool={tool} color={color} size={sizePx} eraserSize={eraserPx} cRef={cRef} onStroke={onStroke} onPickColor={c=>setColor(c)} pencilOnly={pencilOnly} unitSys={unitSys}/>}
              {(readOnly||isPanMode)&&<canvas ref={cRef}width={fmt.w}height={fmt.h}style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:1,pointerEvents:"none",zIndex:5}}/>}
            </div>
          </div>
        </div>

        {/* CALQUES — style Procreate */}
        {showLayers&&!focusMode&&<div style={{width:180,background:T.surface,borderLeft:`1px solid ${T.border}`,display:"flex",flexDirection:"column",flexShrink:0}}>
          <div style={{padding:"9px 12px 7px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:11,color:T.accent,letterSpacing:.5}}>CALQUES</div>
            <button onClick={()=>setLayers(p=>[...p,{id:Date.now(),n:`Calque ${p.length+1}`,v:true,locked:false,color:["#c8622a","#3d6b8c","#4a7c59","#a855f7","#e94560","#f5a623"][p.length%6]}])}
              style={{background:T.accent,border:"none",cursor:"pointer",color:"#fff",fontSize:13,width:20,height:20,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>+</button>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"6px 5px",display:"flex",flexDirection:"column",gap:3}}>
            {layers.map((l,i)=>{
              const lc=l.color||T.accent
              return(
              <div key={l.id} style={{borderRadius:10,background:T.bg,border:`1px solid ${l.v?lc+"44":T.border}`,overflow:"hidden",transition:"border-color .15s"}}>
                <div style={{display:"flex",alignItems:"center",gap:6,padding:"7px 8px"}}>
                  {/* Color swatch */}
                  <div style={{width:10,height:10,borderRadius:3,background:l.v?lc:T.muted,flexShrink:0}}/>
                  {/* Name */}
                  <div style={{flex:1,fontSize:10,color:l.v?T.ink:T.muted,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.n}</div>
                  {/* Visibility */}
                  <button onClick={()=>setLayers(p=>p.map((x,j)=>j===i?{...x,v:!x.v}:x))}
                    style={{background:"none",border:"none",cursor:"pointer",color:l.v?lc:T.muted+"66",fontSize:11,padding:"0 2px",flexShrink:0}}>
                    {l.v?"◉":"○"}
                  </button>
                  {/* Lock */}
                  <button onClick={()=>setLayers(p=>p.map((x,j)=>j===i?{...x,locked:!x.locked}:x))}
                    style={{background:"none",border:"none",cursor:"pointer",color:l.locked?T.accent:T.muted+"66",fontSize:10,padding:"0 1px",flexShrink:0}}>
                    {l.locked?"🔒":"🔓"}
                  </button>
                </div>
                {/* Opacity mini-bar (visual) */}
                <div style={{height:2,background:T.border,margin:"0 8px 6px"}}>
                  <div style={{height:"100%",width:l.v?"100%":"30%",background:lc,borderRadius:1,opacity:.6,transition:"width .3s"}}/>
                </div>
              </div>
            )})}
            {/* Delete last custom layer */}
            {layers.length>3&&<button onClick={()=>setLayers(p=>p.slice(0,-1))}
              style={{padding:"4px",borderRadius:7,border:`1px dashed ${T.border}`,background:"none",color:T.muted,cursor:"pointer",fontSize:9,marginTop:2}}>
              − Supprimer dernier calque
            </button>}
          </div>
        </div>}

        {/* BIBLIOTHÈQUE */}
        {showLib&&!focusMode&&<div style={{width:250,background:T.surface,borderLeft:`1px solid ${T.border}`,display:"flex",flexDirection:"column",flexShrink:0}}>
          <div style={{padding:"8px 10px 6px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,color:T.accent}}>Bibliothèque</div>
            <button onClick={()=>setShowLib(false)}style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:15}}>×</button>
          </div>
          <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
            {[["metric","📏 mm"],["imperial","📐 in"],["symbols","🏠 Sym."]].map(([m,l],i,arr)=>(
              <button key={m} onClick={()=>{setLibMode(m);setLibCat(Object.keys(m==="symbols"?SYMBOLS_LIB:m==="metric"?LIB_METRIC:LIB_IMPERIAL)[0])}}
                style={{flex:1,padding:"5px 0",border:"none",background:libMode===m?`${T.accent}18`:T.bg,color:libMode===m?T.accent:T.muted,cursor:"pointer",fontSize:10,fontWeight:libMode===m?700:400,borderRight:i<arr.length-1?`1px solid ${T.border}`:"none"}}>
                {l}
              </button>
            ))}
          </div>
          <div style={{padding:"4px 7px",borderBottom:`1px solid ${T.border}`}}>
            <input value={libSearch}onChange={e=>setLibSearch(e.target.value)}placeholder="Chercher…"style={{width:"100%",padding:"4px 7px",borderRadius:7,border:`1px solid ${T.border}`,fontSize:10,outline:"none",background:T.bg,color:T.ink,boxSizing:"border-box"}}/>
          </div>
          <div style={{overflowX:"auto",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
            <div style={{display:"flex",gap:3,padding:"4px 5px",whiteSpace:"nowrap"}}>
              {libCats.map(c=><button key={c}onClick={()=>setLibCat(c)}style={{padding:"2px 5px",borderRadius:10,border:`1px solid ${libCat===c?T.accent:T.border}`,background:libCat===c?`${T.accent}15`:T.bg,color:libCat===c?T.accent:T.muted,fontSize:8,cursor:"pointer",whiteSpace:"nowrap"}}>{c}</button>)}
            </div>
          </div>
          <div style={{padding:"3px 6px",borderBottom:`1px solid ${T.border}`,background:`${T.accent}05`,flexShrink:0}}>
            <div style={{fontSize:8,color:T.muted,textAlign:"center"}}>{libPending?`📍 Clic feuille → "${libPending.l}"`:("Clic = sélect · glisser aussi")}</div>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:4,display:"flex",flexDirection:"column",gap:3}}>
            {libItems.map(el=>(
              <div key={el.id}
                onClick={()=>setLibPending(libPending?.id===el.id?null:el)}
                draggable
                onDragEnd={e=>{const r=document.getElementById("canvas-area")?.getBoundingClientRect();if(!r)return;const sc=3.78/50,elW=(el.fw||el.w)*sc,elH=el.h*sc,x=(e.clientX-r.left-panX)/zoom-elW/2,y=(e.clientY-r.top-panY)/zoom-elH/2;setPlaced(p=>[...p,{id:Date.now(),el,x:Math.max(0,x),y:Math.max(0,y)}]);setLibPending(null)}}
                style={{padding:"5px 7px",borderRadius:8,border:`1px solid ${libPending?.id===el.id?T.accent:T.border}`,background:libPending?.id===el.id?`${T.accent}10`:T.bg,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}
                onMouseEnter={e=>{if(libPending?.id!==el.id)e.currentTarget.style.borderColor=T.accent}}
                onMouseLeave={e=>{if(libPending?.id!==el.id)e.currentTarget.style.borderColor=T.border}}>
                <div style={{width:28,height:28,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>{el.type==="sym"?renderSym(el,1/300):renderEl(el,1/300)}</div>
                <div>
                  <div style={{fontSize:9,fontWeight:700,color:T.ink,lineHeight:1.2}}>{el.l}</div>
                  <div style={{fontSize:7,color:T.muted,fontFamily:"monospace",marginTop:1}}>{el.w}×{el.h}mm</div>
                </div>
              </div>
            ))}
          </div>
        </div>}
      </div>

      {/* BOTTOM BAR */}
      <div style={{height:32,background:T.surface,borderTop:`1px solid ${T.border}`,display:"flex",alignItems:"center",padding:"0 10px",gap:8,zIndex:20}}>
        <div style={{display:"flex",alignItems:"center",gap:4}}>
          <button onClick={()=>setPage(p=>Math.max(1,p-1))}disabled={page===1}style={{background:"none",border:"none",color:page===1?T.border:T.muted,cursor:page===1?"default":"pointer",fontSize:12}}>‹</button>
          <span style={{fontSize:9,color:T.muted,fontFamily:"monospace"}}>{page}/{nb.pages_count||1}</span>
          <button onClick={()=>setPage(p=>Math.min(nb.pages_count||1,p+1))}style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:12}}>›</button>
          <button onClick={addPage}title="Nouvelle page"style={{background:"none",border:"none",color:T.accent,cursor:"pointer",fontSize:11}}>＋</button>
        </div>
        <div style={{width:1,height:12,background:T.border}}/>
        <div style={{display:"flex",gap:3,alignItems:"center"}}>
          {[["↑",()=>setPanY(p=>p+80)],["↓",()=>setPanY(p=>p-80)],["←",()=>setPanX(p=>p+80)],["→",()=>setPanX(p=>p-80)],["⊙",()=>{setPanX(0);setPanY(0)}]].map(([l,fn])=>(
            <button key={l}onClick={fn}style={{width:20,height:20,borderRadius:4,background:T.bg,border:`1px solid ${T.border}`,color:T.muted,cursor:"pointer",fontSize:9}}>{l}</button>
          ))}
        </div>
        <div style={{width:1,height:12,background:T.border}}/>
        <div style={{fontSize:9,color:T.muted,fontFamily:"monospace"}}>{tool} · {formatDimension(tool==="eraser"?eraserMm:sizeMm,unitSys)} · {scale} · {Math.round(zoom*100)}%</div>
        {collabCursors.length>0&&<div style={{fontSize:9,color:"#4ade80"}}>🟢 {collabCursors.length}</div>}
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:4}}>
          <div style={{width:5,height:5,borderRadius:"50%",background:saveStatus==="saved"?"#4ade80":saveStatus==="saving"?"#f5a623":"#4ade80"}}/>
          <span style={{fontSize:8,color:T.muted}}>{saveStatus==="saving"?"Sauvegarde...":saveStatus==="saved"?"Sauvegardé ✓":"Auto-save"}</span>
        </div>
      </div>
    </div>
  )

  function handleCanvasAreaClick(e){
    if(!libPending)return
    const r=document.getElementById("canvas-area")?.getBoundingClientRect()
    if(!r)return
    const sc=3.78/50,elW=(libPending.fw||libPending.w)*sc,elH=libPending.h*sc
    const x=(e.clientX-r.left-panX)/zoom-elW/2,y=(e.clientY-r.top-panY)/zoom-elH/2
    setPlaced(p=>[...p,{id:Date.now(),el:libPending,x:Math.max(0,x),y:Math.max(0,y)}])
    setLibPending(null)
  }
}
