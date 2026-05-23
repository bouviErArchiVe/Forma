import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import useAppStore from "@/stores/useAppStore"
import { supabase } from "@/lib/supabase"

/* ══ PALETTES ═══════════════════════════════════════════════ */
const CPAL = {
  "⬛ Basique":   ["#000","#222","#444","#666","#888","#aaa","#ccc","#fff"],
  "🔴 Rouges":   ["#ff0000","#e53935","#c62828","#b71c1c","#ff5252","#ff8a80","#ff1744","#d50000"],
  "🟠 Oranges":  ["#ff6600","#e65100","#ff7043","#ff8c00","#ff9800","#ffa726","#ffb74d","#ffcc80"],
  "🟡 Jaunes":   ["#ffff00","#ffd600","#ffc107","#ffb300","#ffa000","#fff176","#fff59d","#f9a825"],
  "🟢 Verts":    ["#00e676","#00c853","#1b5e20","#2e7d32","#43a047","#4caf50","#66bb6a","#a5d6a7"],
  "🔵 Bleus":    ["#0000ff","#1565c0","#1976d2","#2196f3","#42a5f5","#64b5f6","#90caf9","#0d47a1"],
  "🟣 Violets":  ["#9c27b0","#7b1fa2","#6a1b9a","#ba68c8","#ce93d8","#e1bee7","#ab47bc","#d500f9"],
  "🩷 Roses":    ["#e91e63","#ad1457","#f06292","#f48fb1","#ff4081","#ff80ab","#ff1493","#c2185b"],
  "🏛 Archi":    ["#c8622a","#3d6b8c","#4a7c59","#8b4513","#546e7a","#7c3aed","#c73e1d","#2d6a4f"],
  "🪵 Bois":     ["#c8a96a","#b8904a","#a0722a","#8B6914","#6b4c1e","#4a3010","#deb887","#d2691e"],
  "⚙️ Métal":    ["#607d8b","#546e7a","#78909c","#b0bec5","#37474f","#90a4ae","#455a64","#cfd8dc"],
  "🧱 Béton":    ["#9e9e9e","#bdbdbd","#757575","#616161","#424242","#e0e0e0","#eeeeee","#808080"],
  "🌿 Nature":   ["#2d6a4f","#52b788","#95d5b2","#d8f3dc","#74c69d","#1b4332","#40916c","#081c15"],
  "🌅 Sunset":   ["#ff6b35","#ff9f1c","#ffd60a","#c73e1d","#ef233c","#8d0801","#f4a261","#e76f51"],
  "🌊 Océan":    ["#023e8a","#0077b6","#0096c7","#00b4d8","#48cae4","#90e0ef","#ade8f4","#03045e"],
  "🌸 Sakura":   ["#ffb7c5","#ff69b4","#ff1493","#db7093","#ffc0cb","#ffb6c1","#ff85a1","#e75480"],
  "🍂 Automne":  ["#8B4513","#A0522D","#CD853F","#D2691E","#DAA520","#B8860B","#8B6914","#A52A2A"],
  "🎨 Pastel":   ["#ffb3ba","#ffdfba","#ffffba","#baffc9","#bae1ff","#d4baff","#ffd4ba","#c9ffba"],
  "🌙 Nuit":     ["#0d1117","#161b22","#58a6ff","#3fb950","#f78166","#d2a8ff","#ffa657","#79c0ff"],
  "🌈 Néon":     ["#00ffcc","#ff00ff","#ffff00","#00ff00","#ff6600","#ff0066","#0066ff","#cc00ff"],
  "🎭 Pop Art":  ["#ff3366","#ff6600","#ffcc00","#33cc33","#3399ff","#cc33ff","#ff0099","#00cccc"],
  "🏯 Japonais": ["#c62828","#880e4f","#4a148c","#1a237e","#006064","#1b5e20","#f57f17","#bf360c"],
  "🌻 Champs":   ["#ffd700","#ffa500","#ff8c00","#228b22","#90ee90","#adff2f","#7fff00","#3cb371"],
  "🔥 Feu":      ["#ff0000","#ff3300","#ff6600","#ff9900","#ffcc00","#ffff00","#ff4500","#dc143c"],
  "💎 Gemmes":   ["#1a0a2e","#4a148c","#7b1fa2","#0d47a1","#1565c0","#006064","#004d40","#1b5e20"],
  "📐 Plans":    ["#1a1a1a","#c8622a","#3d6b8c","#e94560","#4a7c59","#ff6b35","#7c3aed","#2196f3"],
  "🏗 Structure":["#37474f","#455a64","#546e7a","#607d8b","#78909c","#90a4ae","#b0bec5","#cfd8dc"],
  "🇸🇪 Nordique": ["#2c3e50","#3498db","#ecf0f1","#95a5a6","#1abc9c","#16a085","#2980b9","#8e44ad"],
  "🎹 Piano":    ["#000","#1a1a1a","#333","#666","#999","#ccc","#e0e0e0","#fff"],
  "🌺 Tropical": ["#ff6b6b","#feca57","#48dbfb","#ff9ff3","#54a0ff","#5f27cd","#01aaa4","#ff9f43"],
}
const HPAL = {
  "Standards": ["#ffff00","#ff9f1c","#00ff88","#00cfff","#ff00ff","#ff3366"],
  "Doux":      ["#fff176","#ffe082","#a5d6a7","#80deea","#ce93d8","#f48fb1"],
  "Néon":      ["#00ffcc","#ff00ff","#ffff00","#00ff00","#ff6600","#0066ff"],
  "Pastel":    ["#ffcccc","#ffd9b3","#ffffcc","#ccffcc","#ccf2ff","#e6ccff"],
  "Archi":     ["#ffe066","#ffd6b0","#b3f0d9","#b3d9ff","#f0b3ff","#ffb3c1"],
}
const SIZES_MM = [0.05,0.1,0.18,0.25,0.35,0.5,0.7,1.0,1.4,2.0,3.0,5.0,7.0,10.0]
const mm2px = mm => mm * 3.78

/* ══ STRUCTURAL LIBRARY ════════════════════════════════════ */
const LIB_METRIC = {
  "🪵 Bois Montants": [
    {id:"mw2x4", l:"38×89mm (2×4)",    w:38,  h:89,  type:"wood"},
    {id:"mw2x6", l:"38×140mm (2×6)",   w:38,  h:140, type:"wood"},
    {id:"mw2x8", l:"38×184mm (2×8)",   w:38,  h:184, type:"wood"},
    {id:"mw2x10",l:"38×235mm (2×10)",  w:38,  h:235, type:"wood"},
    {id:"mw2x12",l:"38×286mm (2×12)",  w:38,  h:286, type:"wood"},
    {id:"mw4x4", l:"89×89mm (4×4)",    w:89,  h:89,  type:"wood"},
    {id:"mw6x6", l:"140×140mm (6×6)",  w:140, h:140, type:"wood"},
    {id:"mw8x8", l:"184×184mm (8×8)",  w:184, h:184, type:"wood"},
  ],
  "🪵 Bois Ingénierie": [
    {id:"mglb1",l:"GLB 80×200",  w:80,  h:200, type:"glulam"},
    {id:"mglb2",l:"GLB 130×300", w:130, h:300, type:"glulam"},
    {id:"mglb3",l:"GLB 175×380", w:175, h:380, type:"glulam"},
    {id:"mlvl1",l:"LVL 45×240",  w:45,  h:240, type:"glulam"},
    {id:"mclt1",l:"CLT 120mm",   w:120, h:400, type:"clt"},
    {id:"mclt2",l:"CLT 160mm",   w:160, h:400, type:"clt"},
    {id:"mclt3",l:"CLT 200mm",   w:200, h:400, type:"clt"},
  ],
  "⚙️ HSS Carré": [
    {id:"mhss1",l:"HSS 50×50×3",   w:50,  h:50,  t:3,  type:"hss"},
    {id:"mhss2",l:"HSS 75×75×5",   w:75,  h:75,  t:5,  type:"hss"},
    {id:"mhss3",l:"HSS 100×100×5", w:100, h:100, t:5,  type:"hss"},
    {id:"mhss4",l:"HSS 125×125×6", w:125, h:125, t:6,  type:"hss"},
    {id:"mhss5",l:"HSS 150×150×6", w:150, h:150, t:6,  type:"hss"},
    {id:"mhss6",l:"HSS 200×200×8", w:200, h:200, t:8,  type:"hss"},
    {id:"mhss7",l:"HSS 250×250×10",w:250, h:250, t:10, type:"hss"},
    {id:"mhss8",l:"HSS 300×300×12",w:300, h:300, t:12, type:"hss"},
  ],
  "⚙️ HSS Rect.": [
    {id:"mhssr1",l:"HSS 100×50×4",  w:100, h:50,  t:4, type:"hss"},
    {id:"mhssr2",l:"HSS 150×75×5",  w:150, h:75,  t:5, type:"hss"},
    {id:"mhssr3",l:"HSS 200×100×6", w:200, h:100, t:6, type:"hss"},
    {id:"mhssr4",l:"HSS 250×125×8", w:250, h:125, t:8, type:"hss"},
    {id:"mhssr5",l:"HSS 300×150×8", w:300, h:150, t:8, type:"hss"},
  ],
  "⚙️ Profilés W": [
    {id:"mw150",l:"W150×24",  w:102,h:160,fw:102,ft:10,wt:6,  type:"Ibeam"},
    {id:"mw200",l:"W200×36",  w:165,h:203,fw:165,ft:12,wt:7,  type:"Ibeam"},
    {id:"mw250",l:"W250×49",  w:202,h:257,fw:202,ft:14,wt:9,  type:"Ibeam"},
    {id:"mw310",l:"W310×60",  w:203,h:303,fw:203,ft:15,wt:8,  type:"Ibeam"},
    {id:"mw360",l:"W360×79",  w:205,h:354,fw:205,ft:17,wt:9,  type:"Ibeam"},
    {id:"mw460",l:"W460×97",  w:193,h:465,fw:193,ft:19,wt:11, type:"Ibeam"},
  ],
  "⚙️ IPE / HEA": [
    {id:"mipe120",l:"IPE 120",w:64, h:120,fw:64, ft:8, wt:4, type:"Ibeam"},
    {id:"mipe160",l:"IPE 160",w:82, h:160,fw:82, ft:9, wt:5, type:"Ibeam"},
    {id:"mipe200",l:"IPE 200",w:100,h:200,fw:100,ft:10,wt:6, type:"Ibeam"},
    {id:"mipe240",l:"IPE 240",w:120,h:240,fw:120,ft:10,wt:6, type:"Ibeam"},
    {id:"mipe300",l:"IPE 300",w:150,h:300,fw:150,ft:11,wt:7, type:"Ibeam"},
    {id:"mhea200",l:"HEA 200",w:200,h:190,fw:200,ft:10,wt:7, type:"Ibeam"},
    {id:"mhea260",l:"HEA 260",w:260,h:250,fw:260,ft:13,wt:8, type:"Ibeam"},
    {id:"mheb200",l:"HEB 200",w:200,h:200,fw:200,ft:15,wt:9, type:"Ibeam"},
  ],
  "⚙️ UPN / UPE": [
    {id:"mupn80", l:"UPN 80", w:45, h:80, fw:45, ft:8, wt:6, type:"channel"},
    {id:"mupn100",l:"UPN 100",w:50, h:100,fw:50, ft:9, wt:6, type:"channel"},
    {id:"mupn120",l:"UPN 120",w:55, h:120,fw:55, ft:9, wt:7, type:"channel"},
    {id:"mupn160",l:"UPN 160",w:65, h:160,fw:65, ft:11,wt:8, type:"channel"},
    {id:"mupn200",l:"UPN 200",w:75, h:200,fw:75, ft:12,wt:9, type:"channel"},
    {id:"mupn240",l:"UPN 240",w:85, h:240,fw:85, ft:13,wt:9, type:"channel"},
  ],
  "⚙️ Cornières L": [
    {id:"ml50",  l:"L 50×50×5",   w:50, h:50, t:5,  type:"angle"},
    {id:"ml65",  l:"L 65×65×6",   w:65, h:65, t:6,  type:"angle"},
    {id:"ml80",  l:"L 80×80×8",   w:80, h:80, t:8,  type:"angle"},
    {id:"ml100", l:"L 100×100×8", w:100,h:100,t:8,  type:"angle"},
    {id:"ml120", l:"L 120×120×10",w:120,h:120,t:10, type:"angle"},
    {id:"ml150", l:"L 150×90×10", w:150,h:90, t:10, type:"angle"},
  ],
  "🧱 Béton Poteaux": [
    {id:"mc200",l:"Poteau 200×200",w:200,h:200,type:"conc"},
    {id:"mc250",l:"Poteau 250×250",w:250,h:250,type:"conc"},
    {id:"mc300",l:"Poteau 300×300",w:300,h:300,type:"conc"},
    {id:"mc400",l:"Poteau 400×400",w:400,h:400,type:"conc"},
    {id:"mcr300",l:"Rond Ø300",    w:300,h:300,type:"concR"},
    {id:"mcr400",l:"Rond Ø400",    w:400,h:400,type:"concR"},
  ],
  "🧱 Béton Murs": [
    {id:"mm150",l:"Mur 150mm",     w:150,h:600,type:"conc"},
    {id:"mm200",l:"Mur 200mm",     w:200,h:600,type:"conc"},
    {id:"mm250",l:"Mur 250mm",     w:250,h:600,type:"conc"},
    {id:"mm300",l:"Mur 300mm",     w:300,h:600,type:"conc"},
    {id:"mb300",l:"Poutre 300×600",w:300,h:600,type:"concB"},
    {id:"mb400",l:"Poutre 400×700",w:400,h:700,type:"concB"},
  ],
  "🧱 Fondations": [
    {id:"mf400",l:"Semelle 400",  w:400,h:400,type:"ftg"},
    {id:"mf600",l:"Semelle 600",  w:600,h:600,type:"ftg"},
    {id:"mf900",l:"Semelle 900",  w:900,h:900,type:"ftg"},
    {id:"mp250",l:"Pieu Ø250",    w:250,h:250,type:"concR"},
    {id:"mp350",l:"Pieu Ø350",    w:350,h:350,type:"concR"},
  ],
  "🚪 Portes": [
    {id:"md900", l:"900×2030",  w:900, h:2030,type:"door"},
    {id:"md1000",l:"1000×2100", w:1000,h:2100,type:"door"},
    {id:"md1200",l:"1200×2100", w:1200,h:2100,type:"door"},
    {id:"mdd",   l:"Double 1800",w:1800,h:2100,type:"doorD"},
  ],
  "🪟 Fenêtres": [
    {id:"mw900",l:"900×1200",  w:900, h:1200,type:"win"},
    {id:"mw1200",l:"1200×1500",w:1200,h:1500,type:"win"},
    {id:"mw1500",l:"1500×1800",w:1500,h:1800,type:"win"},
  ],
}

const LIB_IMPERIAL = {
  "🪵 Wood Studs": [
    {id:"iw2x4", l:"2×4 (1.5\"×3.5\")",  w:38, h:89, type:"wood"},
    {id:"iw2x6", l:"2×6 (1.5\"×5.5\")",  w:38, h:140,type:"wood"},
    {id:"iw2x8", l:"2×8 (1.5\"×7.25\")", w:38, h:184,type:"wood"},
    {id:"iw2x10",l:"2×10 (1.5\"×9.25\")",w:38, h:235,type:"wood"},
    {id:"iw4x4", l:"4×4 (3.5\"×3.5\")",  w:89, h:89, type:"wood"},
    {id:"iw6x6", l:"6×6 (5.5\"×5.5\")",  w:140,h:140,type:"wood"},
  ],
  "⚙️ HSS Square": [
    {id:"ihss2",l:"HSS 2×2×3/16",w:51, h:51, t:5,  type:"hss"},
    {id:"ihss3",l:"HSS 3×3×1/4", w:76, h:76, t:6,  type:"hss"},
    {id:"ihss4",l:"HSS 4×4×1/4", w:102,h:102,t:6,  type:"hss"},
    {id:"ihss5",l:"HSS 5×5×5/16",w:127,h:127,t:8,  type:"hss"},
    {id:"ihss6",l:"HSS 6×6×3/8", w:152,h:152,t:10, type:"hss"},
    {id:"ihss8",l:"HSS 8×8×1/2", w:203,h:203,t:13, type:"hss"},
    {id:"ihss10",l:"HSS 10×10×5/8",w:254,h:254,t:16,type:"hss"},
  ],
  "⚙️ W Shapes": [
    {id:"iw6",  l:"W6×15",   w:152,h:152,fw:152,ft:11,wt:6, type:"Ibeam"},
    {id:"iw8",  l:"W8×24",   w:165,h:203,fw:165,ft:12,wt:7, type:"Ibeam"},
    {id:"iw10", l:"W10×49",  w:202,h:257,fw:202,ft:14,wt:9, type:"Ibeam"},
    {id:"iw12", l:"W12×53",  w:254,h:305,fw:254,ft:15,wt:9, type:"Ibeam"},
    {id:"iw14", l:"W14×82",  w:254,h:356,fw:254,ft:18,wt:11,type:"Ibeam"},
    {id:"iw16", l:"W16×100", w:267,h:406,fw:267,ft:19,wt:12,type:"Ibeam"},
    {id:"iw18", l:"W18×97",  w:214,h:457,fw:214,ft:19,wt:11,type:"Ibeam"},
  ],
  "🧱 Concrete": [
    {id:"ic8",  l:"Col 8\"×8\"",   w:203,h:203,type:"conc"},
    {id:"ic10", l:"Col 10\"×10\"", w:254,h:254,type:"conc"},
    {id:"ic12", l:"Col 12\"×12\"", w:305,h:305,type:"conc"},
    {id:"icr12",l:"Rnd Ø12\"",     w:305,h:305,type:"concR"},
    {id:"iw6",  l:"Wall 6\"",      w:152,h:600,type:"conc"},
    {id:"iw8",  l:"Wall 8\"",      w:203,h:600,type:"conc"},
    {id:"iw12", l:"Wall 12\"",     w:305,h:600,type:"conc"},
  ],
  "🚪 Doors (in)": [
    {id:"id32",l:"Door 32\"×80\"",w:813, h:2032,type:"door"},
    {id:"id36",l:"Door 36\"×80\"",w:914, h:2032,type:"door"},
    {id:"id48",l:"Door 48\"×84\"",w:1219,h:2134,type:"door"},
    {id:"idd", l:"Dbl 72\"×84\"", w:1829,h:2134,type:"doorD"},
  ],
  "🪟 Windows (in)": [
    {id:"iw24",l:"24\"×36\"",w:610, h:914, type:"win"},
    {id:"iw36",l:"36\"×48\"",w:914, h:1219,type:"win"},
    {id:"iw48",l:"48\"×60\"",w:1219,h:1524,type:"win"},
    {id:"iw60",l:"60\"×60\"",w:1524,h:1524,type:"win"},
  ],
}

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

const PAGE_COLORS = [
  {id:"white",c:"#ffffff",l:"Blanc"},
  {id:"cream",c:"#fdf6ed",l:"Crème"},
  {id:"yellow",c:"#fffff0",l:"Jaune"},
  {id:"blue",c:"#f0f8ff",l:"Bleu ciel"},
  {id:"green",c:"#f0fff4",l:"Menthe"},
  {id:"pink",c:"#fff0f5",l:"Rose"},
  {id:"gray",c:"#f5f5f5",l:"Gris"},
  {id:"dark",c:"#1c2128",l:"Ardoise"},
  {id:"kraft",c:"#f4ede0",l:"Kraft"},
  {id:"navy",c:"#0d1b2a",l:"Marine"},
]

const GRID_COLORS = [
  {id:"blue",  c:"rgba(61,107,140,.12)",l:"Bleu"},
  {id:"gray",  c:"rgba(0,0,0,.08)",     l:"Gris"},
  {id:"red",   c:"rgba(200,50,50,.1)",  l:"Rouge"},
  {id:"green", c:"rgba(50,150,50,.1)",  l:"Vert"},
  {id:"orange",c:"rgba(200,98,42,.1)",  l:"Orange"},
  {id:"purple",c:"rgba(124,58,237,.1)", l:"Violet"},
  {id:"white", c:"rgba(255,255,255,.15)",l:"Blanc"},
]

/* ══ RENDER ELEMENT ════════════════════════════════════════ */
function renderEl(el,sc=1/50){
  const px=sc*3.78, W=Math.max(el.w*px,4), H=Math.max(el.h*px,4), t=(el.t||6)*px
  if(["wood","glulam","clt","tji"].includes(el.type)){
    const c=el.type==="wood"?"#c8a96a":el.type==="glulam"?"#b8904a":el.type==="clt"?"#d4b896":"#e8d4b0"
    return<svg width={W}height={H}style={{display:"block"}}><rect width={W}height={H}fill={c}stroke="#8B6914"strokeWidth={.8}/>{[.25,.5,.75].map(r=><line key={r}x1={W*r}y1={0}x2={W*r}y2={H}stroke="#a07820"strokeWidth={.4}strokeDasharray="3,4"/>)}</svg>
  }
  if(el.type==="hss")return<svg width={W}height={H}style={{display:"block"}}><rect width={W}height={H}fill="#607d8b"stroke="#37474f"strokeWidth={1}/><rect x={t}y={t}width={Math.max(W-2*t,1)}height={Math.max(H-2*t,1)}fill="white"stroke="#546e7a"strokeWidth={.5}/></svg>
  if(el.type==="Ibeam"){const fw=el.fw?el.fw*px:W,ft2=el.ft?el.ft*px:W*.12,wt2=el.wt?el.wt*px:W*.06;return<svg width={fw}height={H}style={{display:"block"}}><rect x={0}y={0}width={fw}height={ft2}fill="#546e7a"stroke="#37474f"strokeWidth={.8}/><rect x={(fw-wt2)/2}y={ft2}width={wt2}height={Math.max(H-2*ft2,1)}fill="#607d8b"stroke="#37474f"strokeWidth={.8}/><rect x={0}y={H-ft2}width={fw}height={ft2}fill="#546e7a"stroke="#37474f"strokeWidth={.8}/></svg>}
  if(el.type==="channel"){const fw=el.fw?el.fw*px:W,ft2=el.ft?el.ft*px:W*.15,wt2=el.wt?el.wt*px:W*.12;return<svg width={fw}height={H}style={{display:"block"}}><rect x={0}y={0}width={fw}height={ft2}fill="#546e7a"stroke="#37474f"strokeWidth={.8}/><rect x={0}y={ft2}width={wt2}height={H-2*ft2}fill="#607d8b"stroke="#37474f"strokeWidth={.8}/><rect x={0}y={H-ft2}width={fw}height={ft2}fill="#546e7a"stroke="#37474f"strokeWidth={.8}/></svg>}
  if(el.type==="angle"){const t2=t*.8;return<svg width={W}height={H}style={{display:"block"}}><polygon points={`0,0 ${t2},0 ${t2},${H-t2} ${W},${H-t2} ${W},${H} 0,${H}`}fill="#607d8b"stroke="#37474f"strokeWidth={.8}/></svg>}
  if(["conc","concB"].includes(el.type))return<svg width={W}height={H}style={{display:"block"}}><rect width={W}height={H}fill="#c0c0c0"stroke="#888"strokeWidth={1}/><line x1={0}y1={0}x2={W}y2={H}stroke="#aaa"strokeWidth={.6}/><line x1={W}y1={0}x2={0}y2={H}stroke="#aaa"strokeWidth={.6}/></svg>
  if(el.type==="concR")return<svg width={W}height={H}style={{display:"block"}}><circle cx={W/2}cy={H/2}r={Math.min(W,H)/2-1}fill="#c0c0c0"stroke="#888"strokeWidth={1}/><line x1={W*.2}y1={H*.2}x2={W*.8}y2={H*.8}stroke="#aaa"strokeWidth={.6}/><line x1={W*.8}y1={H*.2}x2={W*.2}y2={H*.8}stroke="#aaa"strokeWidth={.6}/></svg>
  if(el.type==="ftg")return<svg width={W}height={H}style={{display:"block"}}><rect width={W}height={H}fill="#d0d0d0"stroke="#666"strokeWidth={1}strokeDasharray="3,3"/><rect x={W*.3}y={H*.3}width={W*.4}height={H*.4}fill="#b0b0b0"stroke="#888"strokeWidth={1}/></svg>
  if(el.type==="door")return<svg width={W}height={H}style={{display:"block"}}><rect width={W}height={H}fill="rgba(200,160,80,.12)"stroke="#8b6f47"strokeWidth={1.5}/><path d={`M ${W*.05},${H*.97} A ${W*.9},${H*.9} 0 0 1 ${W*.95},${H*.97}`}fill="none"stroke="#8b6f47"strokeWidth={.8}strokeDasharray="3,2"/></svg>
  if(el.type==="doorD")return<svg width={W}height={H}style={{display:"block"}}><rect width={W}height={H}fill="rgba(200,160,80,.12)"stroke="#8b6f47"strokeWidth={1.5}/><line x1={W/2}y1={0}x2={W/2}y2={H}stroke="#8b6f47"strokeWidth={.8}/></svg>
  if(el.type==="win")return<svg width={W}height={H}style={{display:"block"}}><rect width={W}height={H}fill="rgba(122,181,212,.25)"stroke="#4a90b8"strokeWidth={1.5}/><line x1={W/2}y1={0}x2={W/2}y2={H}stroke="#4a90b8"strokeWidth={.8}/><line x1={0}y1={H/2}x2={W}y2={H/2}stroke="#4a90b8"strokeWidth={.8}/></svg>
  return<div style={{width:Math.max(W,4),height:Math.max(H,4),background:"#ccc",border:"1px solid #999",fontSize:8}}>{el.l}</div>
}

/* ══ PAPER ════════════════════════════════════════════════ */
function Paper({tmpl,T,pageColor,gridColor}){
  const W=794,H=1123,L=[],bg=pageColor||T.paper,gc=gridColor||T.grid,pl=gridColor||T.pline
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
  return<svg style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:0}}width={W}height={H}><rect width={W}height={H}fill={bg}/>{L}</svg>
}

/* ══ CANVAS — full drawing tools ═════════════════════════ */
function DrawCanvas({tool,color,size,cRef,onStroke,onPickColor}){
  const drawing=useRef(false),strokes=useRef([]),cur=useRef([])
  const shape=useRef(null) // for line/rect/circle
  const textItems=useRef([])

  const redraw=useCallback(()=>{
    const c=cRef.current;if(!c)return
    const ctx=c.getContext("2d");ctx.clearRect(0,0,794,1123)
    strokes.current.forEach(s=>{
      if(!s.pts||s.pts.length<2)return
      ctx.beginPath();ctx.strokeStyle=s.color;ctx.lineWidth=s.size
      ctx.lineCap="round";ctx.lineJoin="round"
      ctx.globalAlpha=s.tool==="highlight"?.4:1
      ctx.globalCompositeOperation=s.tool==="eraser"?"destination-out":"source-over"
      if(s.shapeType==="line"){ctx.moveTo(s.pts[0].x,s.pts[0].y);ctx.lineTo(s.pts[1].x,s.pts[1].y)}
      else if(s.shapeType==="rect"){const dx=s.pts[1].x-s.pts[0].x,dy=s.pts[1].y-s.pts[0].y;ctx.strokeRect(s.pts[0].x,s.pts[0].y,dx,dy)}
      else if(s.shapeType==="circle"){const rx=Math.abs(s.pts[1].x-s.pts[0].x)/2,ry=Math.abs(s.pts[1].y-s.pts[0].y)/2,cx=(s.pts[0].x+s.pts[1].x)/2,cy=(s.pts[0].y+s.pts[1].y)/2;ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);ctx.stroke()}
      else if(s.shapeType==="arrow"){const ax=s.pts[0].x,ay=s.pts[0].y,bx=s.pts[1].x,by=s.pts[1].y,angle=Math.atan2(by-ay,bx-ax),hs=Math.min(20,size*5+8);ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx-hs*Math.cos(angle-Math.PI/6),by-hs*Math.sin(angle-Math.PI/6));ctx.lineTo(bx-hs*Math.cos(angle+Math.PI/6),by-hs*Math.sin(angle+Math.PI/6));ctx.closePath();ctx.fillStyle=s.color;ctx.fill()}
      else{ctx.moveTo(s.pts[0].x,s.pts[0].y);s.pts.forEach(p=>ctx.lineTo(p.x,p.y));ctx.stroke()}
    })
    // Draw text items
    textItems.current.forEach(ti=>{
      ctx.font=`${ti.size||16}px Nunito, sans-serif`
      ctx.fillStyle=ti.color||"#000"
      ctx.globalAlpha=1;ctx.globalCompositeOperation="source-over"
      ctx.fillText(ti.text,ti.x,ti.y)
    })
    ctx.globalCompositeOperation="source-over";ctx.globalAlpha=1
  },[cRef])

  const gP=e=>{const r=cRef.current.getBoundingClientRect();return{x:((e.touches?e.touches[0].clientX:e.clientX)-r.left)*(794/r.width),y:((e.touches?e.touches[0].clientY:e.clientY)-r.top)*(1123/r.height)}}

  const dn=e=>{
    const p=gP(e)
    if(tool==="eyedropper"){const ctx=cRef.current.getContext("2d");const px2=ctx.getImageData(p.x,p.y,1,1).data;if(px2[3]>0){const hex=`#${[px2[0],px2[1],px2[2]].map(v=>v.toString(16).padStart(2,"0")).join("")}`;if(onPickColor)onPickColor(hex)};return}
    if(tool==="text"){const txt=prompt("Texte :");if(txt){textItems.current.push({text:txt,x:p.x,y:p.y,color,size:mm2px(2)});redraw();if(onStroke)onStroke(strokes.current)};return}
    e.preventDefault();drawing.current=true;cur.current=[p]
    if(["line","rect","circle","arrow"].includes(tool)){shape.current={start:p};return}
  }
  const mv=e=>{
    if(!drawing.current)return;e.preventDefault()
    const p=gP(e)
    // Shape preview
    if(["line","rect","circle","arrow"].includes(tool)&&shape.current){
      const ctx=cRef.current.getContext("2d")
      redraw()
      ctx.strokeStyle=color;ctx.lineWidth=size;ctx.lineCap="round"
      ctx.globalAlpha=1;ctx.globalCompositeOperation="source-over"
      const s=shape.current.start
      if(tool==="line"){ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(p.x,p.y);ctx.stroke()}
      else if(tool==="rect"){ctx.strokeRect(s.x,s.y,p.x-s.x,p.y-s.y)}
      else if(tool==="circle"){const rx=Math.abs(p.x-s.x)/2,ry=Math.abs(p.y-s.y)/2,cx=(s.x+p.x)/2,cy=(s.y+p.y)/2;ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);ctx.stroke()}
      else if(tool==="arrow"){const angle=Math.atan2(p.y-s.y,p.x-s.x),hs=Math.min(20,size*5+8);ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-hs*Math.cos(angle-Math.PI/6),p.y-hs*Math.sin(angle-Math.PI/6));ctx.lineTo(p.x-hs*Math.cos(angle+Math.PI/6),p.y-hs*Math.sin(angle+Math.PI/6));ctx.closePath();ctx.fillStyle=color;ctx.fill()}
      return
    }
    cur.current.push(p)
    const c=cRef.current;const ctx=c.getContext("2d");const pts=cur.current
    if(pts.length<2)return
    ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=size;ctx.lineCap="round";ctx.lineJoin="round"
    ctx.globalAlpha=tool==="highlight"?.4:1;ctx.globalCompositeOperation=tool==="eraser"?"destination-out":"source-over"
    ctx.moveTo(pts[pts.length-2].x,pts[pts.length-2].y);ctx.lineTo(pts[pts.length-1].x,pts[pts.length-1].y);ctx.stroke()
    ctx.globalCompositeOperation="source-over";ctx.globalAlpha=1
  }
  const up=e=>{
    if(!drawing.current)return;drawing.current=false
    const p=gP(e)
    if(["line","rect","circle","arrow"].includes(tool)&&shape.current){
      strokes.current.push({pts:[shape.current.start,p],color,size,tool,shapeType:tool})
      shape.current=null;redraw()
    } else {
      strokes.current.push({pts:[...cur.current],color,size,tool})
    }
    cur.current=[]
    if(onStroke)onStroke(strokes.current)
  }

  useEffect(()=>{
    window.__undo=()=>{strokes.current.pop();redraw();if(onStroke)onStroke(strokes.current)}
    window.__clear=()=>{strokes.current=[];textItems.current=[];redraw();if(onStroke)onStroke(strokes.current)}
    window.__loadStrokes=(data)=>{try{const p=typeof data==="string"?JSON.parse(data):data;strokes.current=p||[];redraw()}catch{}}
  },[redraw])

  const cursor = tool==="eyedropper"?"crosshair":tool==="eraser"?"cell":tool==="select"?"default":"crosshair"

  return<canvas ref={cRef}width={794}height={1123}
    style={{position:"absolute",inset:0,width:"100%",height:"100%",cursor,touchAction:"none",zIndex:5}}
    onMouseDown={dn}onMouseMove={mv}onMouseUp={up}onMouseLeave={up}
    onTouchStart={dn}onTouchMove={mv}onTouchEnd={up}/>
}

/* ══ FLOATING PANEL ═══════════════════════════════════════ */
function FloatingPanel({T,color,setColor,sizeMm,setSizeMm,tool,setTool,favorites,setFavorites}){
  const [pos,setPos]=useState({x:16,y:180})
  const [drag,setDrag]=useState(false)
  const [offset,setOffset]=useState({x:0,y:0})
  const [collapsed,setCollapsed]=useState(false)
  const [cPal,setCPal]=useState("📐 Plans")
  const [hPal,setHPal]=useState("Standards")
  const [showWheel,setShowWheel]=useState(false)
  const [customHex,setCustomHex]=useState(color)
  const wheelRef=useRef()

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
        style={{width:32,height:32,borderRadius:"50%",background:color,border:`3px solid ${T.surface}`,
                boxShadow:"0 2px 12px rgba(0,0,0,.4)",cursor:"pointer",outline:`2px solid ${T.accent}`}}/>
    </div>
  )

  return(
    <div style={{position:"fixed",left:pos.x,top:pos.y,zIndex:100,background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,boxShadow:"0 8px 32px rgba(0,0,0,.25)",width:224,userSelect:"none"}}>
      <div onMouseDown={startDrag} style={{cursor:"grab",padding:"7px 11px 5px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${T.border}`}}>
        <div style={{fontSize:9,color:T.muted,letterSpacing:.5}}>⠿ OUTILS</div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <div style={{width:12,height:12,borderRadius:"50%",background:color,border:`1px solid ${T.border}`}}/>
          <span style={{fontSize:9,color:T.muted,fontFamily:"monospace"}}>{sizeMm}mm</span>
          <button onClick={()=>setCollapsed(true)} style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:14,lineHeight:1,padding:0}}>−</button>
        </div>
      </div>
      <div style={{padding:"9px 11px",display:"flex",flexDirection:"column",gap:9,maxHeight:"70vh",overflowY:"auto"}}>
        {/* Palette selector */}
        <div>
          <div style={{fontSize:8,color:T.muted,marginBottom:3,letterSpacing:.5}}>PALETTE ENCRE</div>
          <select value={cPal} onChange={e=>setCPal(e.target.value)} style={{width:"100%",padding:"3px 5px",borderRadius:7,border:`1px solid ${T.border}`,background:T.bg,color:T.ink,fontSize:10,outline:"none",cursor:"pointer"}}>
            {Object.keys(CPAL).map(p=><option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        {/* Color swatches */}
        <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
          {CPAL[cPal].map(c=>(
            <button key={c} onClick={()=>{setColor(c);setCustomHex(c)}}
              style={{width:c===color?22:17,height:c===color?22:17,borderRadius:"50%",background:c,border:`2px solid ${c===color?T.accent:"transparent"}`,cursor:"pointer",outline:c==="#ffffff"?`1px solid ${T.border}`:"none",flexShrink:0,transition:"all .1s"}}/>
          ))}
        </div>
        {/* Color wheel */}
        <button onClick={()=>setShowWheel(v=>!v)} style={{padding:"4px 8px",borderRadius:8,border:`1px solid ${showWheel?T.accent:T.border}`,background:showWheel?`${T.accent}15`:T.bg,color:showWheel?T.accent:T.muted,cursor:"pointer",fontSize:10,textAlign:"left"}}>
          🎡 Roue chromatique
        </button>
        {showWheel&&<div>
          <canvas ref={wheelRef} width={150} height={150} style={{borderRadius:"50%",cursor:"crosshair",display:"block",margin:"0 auto"}} onClick={pickWheel}/>
          <div style={{marginTop:5,display:"flex",gap:5,alignItems:"center"}}>
            <input type="color" value={customHex} onChange={e=>{setCustomHex(e.target.value);setColor(e.target.value)}} style={{width:26,height:26,padding:0,border:`1px solid ${T.border}`,borderRadius:5,cursor:"pointer"}}/>
            <input value={customHex} onChange={e=>{setCustomHex(e.target.value);if(/^#[0-9a-f]{6}$/i.test(e.target.value))setColor(e.target.value)}} style={{flex:1,padding:"3px 5px",borderRadius:7,border:`1px solid ${T.border}`,background:T.bg,color:T.ink,fontSize:10,outline:"none",fontFamily:"monospace"}}/>
          </div>
        </div>}
        {/* Highlighter */}
        <div>
          <div style={{fontSize:8,color:T.muted,marginBottom:3,letterSpacing:.5}}>SURLIGNEUR</div>
          <select value={hPal} onChange={e=>setHPal(e.target.value)} style={{width:"100%",padding:"3px 5px",borderRadius:7,border:`1px solid ${T.border}`,background:T.bg,color:T.ink,fontSize:10,outline:"none",cursor:"pointer",marginBottom:4}}>
            {Object.keys(HPAL).map(p=><option key={p} value={p}>{p}</option>)}
          </select>
          <div style={{display:"flex",gap:3}}>
            {HPAL[hPal].map(c=>(
              <button key={c} onClick={()=>{setColor(c);setTool("highlight")}} style={{width:17,height:17,borderRadius:3,background:c+"aa",border:`2px solid ${color===c?T.accent:"transparent"}`,cursor:"pointer",flexShrink:0}}/>
            ))}
          </div>
        </div>
        {/* Size mm */}
        <div>
          <div style={{fontSize:8,color:T.muted,marginBottom:3,letterSpacing:.5}}>TAILLE</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
            {SIZES_MM.map(s=>(
              <button key={s} onClick={()=>setSizeMm(s)} style={{padding:"2px 5px",borderRadius:5,border:`1px solid ${sizeMm===s?T.accent:T.border}`,background:sizeMm===s?`${T.accent}18`:T.bg,color:sizeMm===s?T.accent:T.muted,cursor:"pointer",fontSize:8,fontFamily:"monospace"}}>
                {s}mm
              </button>
            ))}
          </div>
        </div>
        {/* Favorites */}
        <div>
          <div style={{fontSize:8,color:T.muted,marginBottom:3,letterSpacing:.5}}>FAVORIS — clic: charger · dbl: sauvegarder</div>
          <div style={{display:"flex",gap:4}}>
            {Array.from({length:6},(_,i)=>{
              const fav=favorites[i]
              return(
                <button key={i} onClick={()=>loadFav(fav)} onDoubleClick={()=>saveFav(i)}
                  title={fav?`${fav.color} ${fav.sizeMm}mm – dbl-clic sauvegarder`:"Dbl-clic pour sauvegarder"}
                  style={{width:28,height:28,borderRadius:7,background:fav?fav.color:T.bg,border:`1px solid ${fav?T.accent:T.border}`,cursor:"pointer",fontSize:fav?"0":"13",color:T.muted,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {!fav&&"+"}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══ THEME PICKER ═════════════════════════════════════════ */
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

/* ══ PAGE SETTINGS ════════════════════════════════════════ */
function PageSettings({T,pageColor,setPageColor,gridColor,setGridColor,onClose}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}}>
      <div style={{background:T.surface,borderRadius:16,padding:22,width:360,maxWidth:"94vw",boxShadow:"0 20px 60px rgba(0,0,0,.25)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:15,color:T.ink}}>🎨 Style de la page</div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:20}}>×</button>
        </div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:7}}>COULEUR DE FOND</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
            {PAGE_COLORS.map(pc=>(
              <button key={pc.id} onClick={()=>setPageColor(pc.c)} title={pc.l}
                style={{width:34,height:34,borderRadius:8,background:pc.c,border:`2px solid ${pageColor===pc.c?T.accent:T.border}`,cursor:"pointer",outline:pc.c==="#ffffff"?`1px solid ${T.border}`:"none"}}/>
            ))}
          </div>
        </div>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:7}}>COULEUR DU QUADRILLAGE</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
            {GRID_COLORS.map(gc=>(
              <button key={gc.id} onClick={()=>setGridColor(gc.c)} title={gc.l}
                style={{width:34,height:34,borderRadius:8,background:"#fff",border:`2px solid ${gridColor===gc.c?T.accent:T.border}`,cursor:"pointer",position:"relative",overflow:"hidden"}}>
                <svg width={34} height={34} style={{position:"absolute",inset:0}}>{[6,14,22,30].map(x=><line key={`v${x}`}x1={x}y1={0}x2={x}y2={34}stroke={gc.c}strokeWidth={1}/>)}{[6,14,22,30].map(y=><line key={`h${y}`}x1={0}y1={y}x2={34}y2={y}stroke={gc.c}strokeWidth={1}/>)}</svg>
              </button>
            ))}
          </div>
        </div>
        <button onClick={onClose} style={{width:"100%",padding:11,borderRadius:10,background:T.accent,border:"none",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer"}}>Appliquer ✓</button>
      </div>
    </div>
  )
}

/* ══ MAIN EDITOR ══════════════════════════════════════════ */
export default function EditorPage(){
  const navigate=useNavigate()
  const {activeNotebook,getTheme,setTheme}=useAppStore()
  const [localTheme,setLocalTheme]=useState(null)
  const T=localTheme||getTheme()
  const nb=activeNotebook||{id:"1",title:"Carnet",subject:"arch",template:"plan",pages_count:1}
  const cRef=useRef()

  const [tool,setTool]=useState("pen")
  const [color,setColor]=useState("#1c1c24")
  const [sizeMm,setSizeMm]=useState(0.5)
  const [favorites,setFavorites]=useState(Array(6).fill(null))
  const [unitSys,setUnitSys]=useState("metric")
  const [scale,setScale]=useState("1:50")
  const [zoom,setZoom]=useState(.85)
  const [panX,setPanX]=useState(0)
  const [panY,setPanY]=useState(0)
  const [panning,setPanning]=useState(false)
  const panStart=useRef(null)
  const [showLib,setShowLib]=useState(false)
  const [libMode,setLibMode]=useState("metric")
  const [libCat,setLibCat]=useState("🪵 Bois Montants")
  const [libSearch,setLibSearch]=useState("")
  const [libPending,setLibPending]=useState(null)
  const [mousePos,setMousePos]=useState({x:0,y:0})
  const [placed,setPlaced]=useState([])
  const [selected,setSelected]=useState(null)
  const [page,setPage]=useState(1)
  const [showLayers,setShowLayers]=useState(false)
  const [layers,setLayers]=useState([{id:"s",n:"Esquisse",v:true,locked:false},{id:"a",n:"Annotations",v:true,locked:false},{id:"st",n:"Structure",v:true,locked:false}])
  const [showPageSettings,setShowPageSettings]=useState(false)
  const [pageColor,setPageColor]=useState(null)
  const [gridColor,setGridColor]=useState(null)
  const [showRuler,setShowRuler]=useState(false)
  const [showProt,setShowProt]=useState(false)
  const [showTheme,setShowTheme]=useState(false)
  const [saveStatus,setSaveStatus]=useState("idle")
  const [pageId,setPageId]=useState(null)
  const saveTimer=useRef(null)

  const sizePx=mm2px(sizeMm)
  const curLib=libMode==="metric"?LIB_METRIC:LIB_IMPERIAL
  const libCats=Object.keys(curLib)
  const libItems=useMemo(()=>{
    const items=curLib[libCat]||[]
    return libSearch?items.filter(e=>e.l.toLowerCase().includes(libSearch.toLowerCase())):items
  },[libCat,libSearch,curLib,libMode])

  useEffect(()=>{const cats=Object.keys(libMode==="metric"?LIB_METRIC:LIB_IMPERIAL);if(!cats.includes(libCat))setLibCat(cats[0])},[libMode])

  // Load page
  useEffect(()=>{
    const load=async()=>{
      try{
        const {data:{session}}=await supabase.auth.getSession()
        if(!session?.user)return
        const {data:pg}=await supabase.from("pages").select("*").eq("notebook_id",nb.id).eq("page_number",1).single()
        if(pg){setPageId(pg.id);if(pg.canvas_data&&window.__loadStrokes)window.__loadStrokes(pg.canvas_data);if(pg.elements)setPlaced(typeof pg.elements==="string"?JSON.parse(pg.elements):pg.elements||[])}
        else{const {data:np}=await supabase.from("pages").insert([{notebook_id:nb.id,page_number:1,user_id:session.user.id}]).select().single();if(np)setPageId(np.id)}
      }catch{}
    }
    load()
  },[nb.id])

  const save=useCallback(async(strokes)=>{
    if(!pageId)return
    try{
      const {data:{session}}=await supabase.auth.getSession()
      if(!session?.user)return
      setSaveStatus("saving")
      await supabase.from("pages").update({canvas_data:JSON.stringify(strokes),elements:JSON.stringify(placed),updated_at:new Date().toISOString()}).eq("id",pageId)
      await supabase.from("notebooks").update({updated_at:new Date().toISOString()}).eq("id",nb.id)
      setSaveStatus("saved");setTimeout(()=>setSaveStatus("idle"),2000)
    }catch{setSaveStatus("error");setTimeout(()=>setSaveStatus("idle"),3000)}
  },[pageId,placed,nb.id])

  const onStroke=useCallback((s)=>{if(saveTimer.current)clearTimeout(saveTimer.current);saveTimer.current=setTimeout(()=>save(s),1500)},[save])

  // Pan
  const startPan=e=>{
    if(tool!=="select")return
    setPanning(true);panStart.current={x:e.clientX-panX,y:e.clientY-panY}
  }
  const movePan=e=>{
    if(!panning)return
    setPanX(e.clientX-panStart.current.x);setPanY(e.clientY-panStart.current.y)
    if(libPending)setMousePos({x:e.clientX,y:e.clientY})
  }
  const endPan=()=>setPanning(false)

  // Click to place element
  const handleCanvasClick=e=>{
    if(!libPending)return
    const r=document.getElementById("canvas-area")?.getBoundingClientRect()
    if(!r)return
    const elW=libPending.w*3.78/50, elH=libPending.h*3.78/50
    const x=(e.clientX-r.left-panX)/zoom - elW/2
    const y=(e.clientY-r.top-panY)/zoom - elH/2
    setPlaced(p=>[...p,{id:Date.now(),el:libPending,x:Math.max(0,x),y:Math.max(0,y)}])
    setLibPending(null)
  }

  const SCALES_M=["1:1","1:2","1:5","1:10","1:20","1:50","1:100","1:200","1:500","1:1000"]
  const SCALES_I=['1/4"=1\'','3/16"=1\'','1/8"=1\'','3/32"=1\'','1"=10\'','1"=20\'','1"=40\'','1"=100\'']

  const TOOLS_LIST=[
    {g:"Sélect.",items:[{id:"select",l:"Déplacer",i:"✋"},{id:"lasso",l:"Lasso",i:"⬡"}]},
    {g:"Dessin", items:[{id:"pen",l:"Crayon",i:"✏"},{id:"highlight",l:"Surlig.",i:"▌"},{id:"eraser",l:"Gomme",i:"◻"}]},
    {g:"Formes", items:[{id:"line",l:"Ligne",i:"/"},{id:"rect",l:"Rect.",i:"□"},{id:"circle",l:"Cercle",i:"○"},{id:"arrow",l:"Flèche",i:"→"}]},
    {g:"Annot.", items:[{id:"text",l:"Texte",i:"T"},{id:"eyedropper",l:"Pipette",i:"💉"}]},
  ]

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:T.bg,fontFamily:"'Nunito',sans-serif",overflow:"hidden",color:T.ink}}>
      {showPageSettings&&<PageSettings T={T} pageColor={pageColor} setPageColor={setPageColor} gridColor={gridColor} setGridColor={setGridColor} onClose={()=>setShowPageSettings(false)}/>}
      {showTheme&&<ThemePicker current={T} onChange={th=>{setLocalTheme(th);setTheme(th.id)}} onClose={()=>setShowTheme(false)}/>}

      <FloatingPanel T={T} color={color} setColor={setColor} sizeMm={sizeMm} setSizeMm={setSizeMm} tool={tool} setTool={setTool} favorites={favorites} setFavorites={setFavorites}/>

      {libPending&&<div style={{position:"fixed",bottom:56,left:"50%",transform:"translateX(-50%)",zIndex:50,background:T.panel,color:"#fff",padding:"7px 14px",borderRadius:20,fontSize:11,pointerEvents:"none",boxShadow:"0 4px 16px rgba(0,0,0,.3)"}}>
        📍 Clic sur la feuille pour placer <strong>{libPending.l}</strong> — Échap pour annuler
      </div>}

      {/* TOP BAR */}
      <div style={{height:46,background:T.panel,display:"flex",alignItems:"center",padding:"0 10px",gap:6,flexShrink:0,boxShadow:"0 2px 16px rgba(0,0,0,.3)",zIndex:30}}>
        <button onClick={()=>navigate("/")} style={{background:"none",border:"none",color:"#888",cursor:"pointer",fontSize:11,padding:"4px 7px",borderRadius:7}}>← Retour</button>
        <div style={{width:1,height:20,background:"#ffffff14"}}/>
        <div style={{flex:1,fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:12,color:"#ddd",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{nb.title}</div>
        <div style={{display:"flex",gap:4,alignItems:"center",flexWrap:"nowrap"}}>
          {saveStatus==="saving"&&<span style={{fontSize:9,color:"#f5a623"}}>⏳</span>}
          {saveStatus==="saved"&&<span style={{fontSize:9,color:"#4ade80"}}>✓ Sauvegardé</span>}
          <div style={{display:"flex",borderRadius:6,overflow:"hidden",border:"1px solid #ffffff14"}}>
            <button onClick={()=>{setUnitSys("metric");setScale("1:50")}} style={{padding:"3px 7px",background:unitSys==="metric"?"rgba(200,98,42,.4)":"transparent",border:"none",color:unitSys==="metric"?"#fff":"#777",cursor:"pointer",fontSize:9}}>mm</button>
            <button onClick={()=>{setUnitSys("imperial");setScale('1/4"=1\'')}} style={{padding:"3px 7px",background:unitSys==="imperial"?"rgba(200,98,42,.4)":"transparent",border:"none",color:unitSys==="imperial"?"#fff":"#777",cursor:"pointer",fontSize:9}}>in</button>
          </div>
          <select value={scale} onChange={e=>setScale(e.target.value)} style={{padding:"3px 5px",borderRadius:6,border:"1px solid #ffffff14",background:"#ffffff0c",color:"#aaa",fontSize:9,outline:"none",cursor:"pointer"}}>
            {(unitSys==="metric"?SCALES_M:SCALES_I).map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <div style={{display:"flex",alignItems:"center",gap:2,background:"#ffffff0a",borderRadius:6,padding:"0 6px",border:"1px solid #ffffff10"}}>
            <button onClick={()=>setZoom(z=>Math.max(.25,z-.1))} style={{background:"none",border:"none",color:"#aaa",cursor:"pointer",fontSize:13}}>−</button>
            <span style={{color:"#666",fontSize:9,minWidth:26,textAlign:"center"}}>{Math.round(zoom*100)}%</span>
            <button onClick={()=>setZoom(z=>Math.min(3,z+.1))} style={{background:"none",border:"none",color:"#aaa",cursor:"pointer",fontSize:13}}>+</button>
          </div>
          {[
            [()=>setShowLib(v=>!v),"🏗",showLib],
            [()=>setShowPageSettings(true),"🎨 Page",false],
            [()=>setShowTheme(true),"🎨 Thème",false],
            [()=>setShowLayers(v=>!v),"⊞",showLayers],
            [()=>setShowRuler(v=>!v),"📏",showRuler],
            [()=>setShowProt(v=>!v),"📐",showProt],
          ].map(([fn,label,active],i)=>(
            <button key={i} onClick={fn} style={{padding:"3px 8px",borderRadius:6,border:`1px solid ${active?T.accent:"#ffffff14"}`,background:active?`${T.accent}22`:"#ffffff0a",color:active?T.accent:"#888",cursor:"pointer",fontSize:9,whiteSpace:"nowrap"}}>{label}</button>
          ))}
          <button onClick={()=>window.__undo?.()} style={{padding:"3px 7px",borderRadius:6,border:"1px solid #ffffff14",background:"#ffffff0a",color:"#aaa",cursor:"pointer",fontSize:11}}>↩</button>
          <button onClick={()=>window.__clear?.()} style={{padding:"3px 7px",borderRadius:6,border:"1px solid rgba(233,69,96,.3)",background:"rgba(233,69,96,.1)",color:"#e94560",cursor:"pointer",fontSize:9}}>🗑</button>
        </div>
      </div>

      {/* TOOLS ROW */}
      <div style={{height:38,background:T.surface,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",padding:"0 10px",gap:4,flexShrink:0,overflowX:"auto"}}>
        {TOOLS_LIST.map(grp=>(
          <div key={grp.g} style={{display:"flex",gap:2,paddingRight:7,marginRight:3,borderRight:`1px solid ${T.border}`,flexShrink:0}}>
            {grp.items.map(t=>(
              <button key={t.id} title={t.l} onClick={()=>setTool(t.id)}
                style={{height:26,padding:"0 7px",borderRadius:6,border:`1px solid ${tool===t.id?T.accent:T.border}`,background:tool===t.id?`${T.accent}18`:T.bg,color:tool===t.id?T.accent:T.muted,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",gap:3,whiteSpace:"nowrap",flexShrink:0}}>
                <span>{t.i}</span><span style={{fontSize:8}}>{t.l}</span>
              </button>
            ))}
          </div>
        ))}
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
          <div style={{width:14,height:14,borderRadius:"50%",background:color,border:`1px solid ${T.border}`}}/>
          <span style={{fontSize:9,color:T.muted,fontFamily:"monospace"}}>{sizeMm}mm · {tool}</span>
        </div>
      </div>

      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        {/* CANVAS */}
        <div style={{flex:1,overflow:"hidden",background:T.bg,position:"relative",cursor:libPending?"crosshair":tool==="select"?"grab":"default"}}
          id="canvas-area"
          onMouseMove={e=>{if(libPending)setMousePos({x:e.clientX,y:e.clientY});if(panning&&panStart.current){setPanX(e.clientX-panStart.current.x);setPanY(e.clientY-panStart.current.y)}}}
          onMouseDown={e=>{if(libPending){handleCanvasClick(e);return};if(tool==="select"){setPanning(true);panStart.current={x:e.clientX-panX,y:e.clientY-panY}}}}
          onMouseUp={()=>setPanning(false)}
          onKeyDown={e=>{if(e.key==="Escape")setLibPending(null)}}
          tabIndex={0}>

          {/* Preview ghost of pending element */}
          {libPending&&(()=>{
            const r=document.getElementById("canvas-area")?.getBoundingClientRect()
            if(!r)return null
            const elW=libPending.w*3.78/50*zoom, elH=libPending.h*3.78/50*zoom
            const gx=mousePos.x-r.left-elW/2, gy=mousePos.y-r.top-elH/2
            return<div style={{position:"absolute",left:gx,top:gy,zIndex:50,opacity:.6,pointerEvents:"none",transform:`scale(${zoom})`,transformOrigin:"top left"}}>
              {renderEl(libPending,1/50)}
            </div>
          })()}

          <div style={{transform:`translate(${panX}px,${panY}px) scale(${zoom})`,transformOrigin:"center center",transition:"transform .05s",position:"absolute",top:"50%",left:"50%",marginLeft:-397,marginTop:-562}}>
            <div style={{width:794,height:1123,position:"relative",boxShadow:"0 4px 40px rgba(0,0,0,.2)"}}>
              <Paper tmpl={nb.template||"plan"} T={T} pageColor={pageColor} gridColor={gridColor}/>

              {placed.map(item=>{
                const sel=selected===item.id
                return<div key={item.id} style={{position:"absolute",left:item.x,top:item.y,cursor:"move",pointerEvents:"all",userSelect:"none",outline:sel?"2px solid #c8622a":"none",outlineOffset:2,zIndex:sel?12:10}}
                  onMouseDown={e=>{e.stopPropagation();setSelected(item.id);const ox=e.clientX-item.x*zoom,oy=e.clientY-item.y*zoom;const mm=ev=>setPlaced(p=>p.map(e=>e.id===item.id?{...e,x:(ev.clientX-ox)/zoom,y:(ev.clientY-oy)/zoom}:e));const mu=()=>{window.removeEventListener("mousemove",mm);window.removeEventListener("mouseup",mu)};window.addEventListener("mousemove",mm);window.addEventListener("mouseup",mu)}}>
                  {renderEl(item.el,1/50)}
                  {sel&&<button onClick={()=>{setPlaced(p=>p.filter(e=>e.id!==item.id));setSelected(null)}} style={{position:"absolute",top:-10,right:-10,width:20,height:20,borderRadius:"50%",background:"#e94560",border:"none",color:"#fff",cursor:"pointer",fontSize:11,fontWeight:700,zIndex:20}}>×</button>}
                </div>
              })}

              {showRuler&&<div style={{position:"absolute",top:0,left:0,right:0,height:24,background:T.surface,borderBottom:`1px solid ${T.border}`,zIndex:15,opacity:.9}}>
                <svg width={794}height={24}style={{display:"block"}}>{Array.from({length:80},(_,i)=>{const x=i*10,big=i%10===0,med=i%5===0;return<g key={i}><line x1={x}y1={24}x2={x}y2={big?5:med?10:17}stroke={T.muted}strokeWidth={big?1:.5}/>{big&&<text x={x+2}y={8}fontSize={6}fill={T.muted}fontFamily="monospace">{i*(unitSys==="metric"?10:1)}{unitSys==="metric"?"mm":"\"" }</text>}</g>})}</svg>
              </div>}

              {showProt&&<div style={{position:"absolute",top:36,right:36,zIndex:15,pointerEvents:"none"}}>
                <svg width={160}height={80}style={{background:T.surface+"ee",borderRadius:8}}>
                  <path d="M 10,70 A 70,70 0 0 1 150,70" fill="none" stroke={T.accent} strokeWidth={1.5}/>
                  <line x1={80}y1={70}x2={80}y2={10}stroke={T.a2}strokeWidth={1}/>
                  {[0,30,60,90,120,150,180].map(a=>{const r=(180-a)*Math.PI/180,x=80+70*Math.cos(r),y=70-70*Math.sin(r),ix=80+55*Math.cos(r),iy=70-55*Math.sin(r);return<g key={a}><line x1={ix}y1={iy}x2={x}y2={y}stroke={T.accent}strokeWidth={1.2}/><text x={x}y={y-3}fontSize={7}fill={T.muted}textAnchor="middle"fontFamily="monospace">{a}°</text></g>})}
                </svg>
              </div>}

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

              <DrawCanvas tool={tool} color={color} size={sizePx} cRef={cRef} onStroke={onStroke} onPickColor={c=>setColor(c)}/>
            </div>
          </div>
        </div>

        {/* CALQUES */}
        {showLayers&&<div style={{width:170,background:T.surface,borderLeft:`1px solid ${T.border}`,display:"flex",flexDirection:"column",flexShrink:0}}>
          <div style={{padding:"9px 11px 7px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,color:T.accent}}>Calques</div>
            <button onClick={()=>setLayers(p=>[...p,{id:Date.now(),n:`Calque ${p.length+1}`,v:true,locked:false}])} style={{background:"none",border:"none",cursor:"pointer",color:T.accent,fontSize:16,lineHeight:1}}>+</button>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:6,display:"flex",flexDirection:"column",gap:4}}>
            {layers.map((l,i)=>(
              <div key={l.id} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 8px",borderRadius:8,background:T.bg,border:`1px solid ${T.border}`}}>
                <button onClick={()=>setLayers(p=>p.map((x,j)=>j===i?{...x,v:!x.v}:x))} style={{background:"none",border:"none",cursor:"pointer",color:l.v?T.accent:T.muted,fontSize:10,flexShrink:0}}>{l.v?"👁":"◻"}</button>
                <div style={{flex:1,fontSize:10,color:T.ink,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.n}</div>
                <button onClick={()=>setLayers(p=>p.map((x,j)=>j===i?{...x,locked:!x.locked}:x))} style={{background:"none",border:"none",cursor:"pointer",color:l.locked?T.accent:T.muted,fontSize:9,flexShrink:0}}>{l.locked?"🔒":"🔓"}</button>
              </div>
            ))}
          </div>
        </div>}

        {/* BIBLIOTHÈQUE */}
        {showLib&&<div style={{width:255,background:T.surface,borderLeft:`1px solid ${T.border}`,display:"flex",flexDirection:"column",flexShrink:0}}>
          <div style={{padding:"9px 11px 7px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,color:T.accent}}>Bibliothèque</div>
            <button onClick={()=>setShowLib(false)} style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:15}}>×</button>
          </div>
          <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
            <button onClick={()=>setLibMode("metric")} style={{flex:1,padding:"6px 0",border:"none",background:libMode==="metric"?`${T.accent}18`:T.bg,color:libMode==="metric"?T.accent:T.muted,cursor:"pointer",fontSize:10,fontWeight:libMode==="metric"?700:400,borderRight:`1px solid ${T.border}`}}>📏 Métrique</button>
            <button onClick={()=>setLibMode("imperial")} style={{flex:1,padding:"6px 0",border:"none",background:libMode==="imperial"?`${T.accent}18`:T.bg,color:libMode==="imperial"?T.accent:T.muted,cursor:"pointer",fontSize:10,fontWeight:libMode==="imperial"?700:400}}>📐 Impérial</button>
          </div>
          <div style={{padding:"5px 8px",borderBottom:`1px solid ${T.border}`}}>
            <input value={libSearch} onChange={e=>setLibSearch(e.target.value)} placeholder="Chercher…" style={{width:"100%",padding:"4px 7px",borderRadius:7,border:`1px solid ${T.border}`,fontSize:10,outline:"none",background:T.bg,color:T.ink,boxSizing:"border-box"}}/>
          </div>
          <div style={{overflowX:"auto",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
            <div style={{display:"flex",gap:3,padding:"4px 6px",whiteSpace:"nowrap"}}>
              {libCats.map(c=><button key={c} onClick={()=>setLibCat(c)} style={{padding:"2px 6px",borderRadius:10,border:`1px solid ${libCat===c?T.accent:T.border}`,background:libCat===c?`${T.accent}15`:T.bg,color:libCat===c?T.accent:T.muted,fontSize:8,cursor:"pointer",whiteSpace:"nowrap"}}>{c}</button>)}
            </div>
          </div>
          <div style={{padding:"4px 7px",borderBottom:`1px solid ${T.border}`,background:`${T.accent}05`,flexShrink:0}}>
            <div style={{fontSize:8,color:T.muted,textAlign:"center"}}>{libPending?`📍 Clic sur la feuille → "${libPending.l}"`:("Clic = placer · glisser aussi")}</div>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:5,display:"flex",flexDirection:"column",gap:3}}>
            {libItems.map(el=>(
              <div key={el.id}
                onClick={()=>setLibPending(libPending?.id===el.id?null:el)}
                draggable
                onDragEnd={e=>{
                  const r=document.getElementById("canvas-area")?.getBoundingClientRect()
                  if(!r)return
                  const elW=el.w*3.78/50,elH=el.h*3.78/50
                  const x=(e.clientX-r.left-panX)/zoom-elW/2
                  const y=(e.clientY-r.top-panY)/zoom-elH/2
                  setPlaced(p=>[...p,{id:Date.now(),el,x:Math.max(0,x),y:Math.max(0,y)}])
                  setLibPending(null)
                }}
                style={{padding:"6px 8px",borderRadius:8,border:`1px solid ${libPending?.id===el.id?T.accent:T.border}`,background:libPending?.id===el.id?`${T.accent}10`:T.bg,cursor:"pointer",display:"flex",alignItems:"center",gap:7,transition:"all .12s"}}
                onMouseEnter={e=>{if(libPending?.id!==el.id)e.currentTarget.style.borderColor=T.accent}}
                onMouseLeave={e=>{if(libPending?.id!==el.id)e.currentTarget.style.borderColor=T.border}}>
                <div style={{width:28,height:28,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>{renderEl(el,1/300)}</div>
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
      <div style={{height:34,background:T.surface,borderTop:`1px solid ${T.border}`,display:"flex",alignItems:"center",padding:"0 12px",gap:10,zIndex:20}}>
        <div style={{display:"flex",alignItems:"center",gap:5}}>
          <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{background:"none",border:"none",color:page===1?T.border:T.muted,cursor:page===1?"default":"pointer",fontSize:12}}>‹</button>
          <span style={{fontSize:9,color:T.muted,fontFamily:"monospace"}}>{page.toString().padStart(2,"0")} / {(nb.pages_count||1).toString().padStart(2,"0")}</span>
          <button onClick={()=>setPage(p=>p+1)} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:12}}>›</button>
        </div>
        <div style={{width:1,height:14,background:T.border}}/>
        {/* Pan controls */}
        <div style={{display:"flex",gap:3}}>
          <button onClick={()=>setPanY(p=>p+80)} style={{width:22,height:22,borderRadius:5,background:T.bg,border:`1px solid ${T.border}`,color:T.muted,cursor:"pointer",fontSize:10}}>↑</button>
          <button onClick={()=>setPanY(p=>p-80)} style={{width:22,height:22,borderRadius:5,background:T.bg,border:`1px solid ${T.border}`,color:T.muted,cursor:"pointer",fontSize:10}}>↓</button>
          <button onClick={()=>setPanX(p=>p+80)} style={{width:22,height:22,borderRadius:5,background:T.bg,border:`1px solid ${T.border}`,color:T.muted,cursor:"pointer",fontSize:10}}>←</button>
          <button onClick={()=>setPanX(p=>p-80)} style={{width:22,height:22,borderRadius:5,background:T.bg,border:`1px solid ${T.border}`,color:T.muted,cursor:"pointer",fontSize:10}}>→</button>
          <button onClick={()=>{setPanX(0);setPanY(0)}} style={{width:22,height:22,borderRadius:5,background:T.bg,border:`1px solid ${T.border}`,color:T.muted,cursor:"pointer",fontSize:9}}>⊙</button>
        </div>
        <div style={{width:1,height:14,background:T.border}}/>
        <div style={{fontSize:9,color:T.muted,fontFamily:"monospace"}}>{tool} · {sizeMm}mm · {scale} · {Math.round(zoom*100)}%</div>
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:4}}>
          <div style={{width:5,height:5,borderRadius:"50%",background:saveStatus==="saved"?"#4ade80":saveStatus==="saving"?"#f5a623":"#4ade80"}}/>
          <span style={{fontSize:8,color:T.muted}}>{saveStatus==="saving"?"Sauvegarde...":saveStatus==="saved"?"Sauvegardé ✓":"Auto-save"}</span>
        </div>
      </div>
    </div>
  )
}
