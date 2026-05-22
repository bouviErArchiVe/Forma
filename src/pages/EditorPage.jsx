import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import useAppStore from "@/stores/useAppStore"
import { supabase } from "@/lib/supabase"

/* ══ MASSIVE COLOR PALETTES ══════════════════════════════════ */
const CPAL = {
  "⬛ Basique":     ["#000000","#1a1a1a","#2d2d2d","#444444","#666666","#888888","#aaaaaa","#cccccc","#e0e0e0","#ffffff"],
  "🔴 Rouges":      ["#ff0000","#e53935","#c62828","#b71c1c","#ff5252","#ff8a80","#ff1744","#d50000","#f44336","#ef9a9a"],
  "🟠 Oranges":     ["#ff6600","#ff6d00","#e65100","#bf360c","#ff7043","#ff8c00","#ff9800","#ffa726","#ffb74d","#ffcc80"],
  "🟡 Jaunes":      ["#ffff00","#ffd600","#ffc107","#ffb300","#ffa000","#ff8f00","#fff176","#fff59d","#fff9c4","#f9a825"],
  "🟢 Verts":       ["#00ff00","#00e676","#00c853","#1b5e20","#2e7d32","#388e3c","#43a047","#4caf50","#66bb6a","#a5d6a7"],
  "🔵 Bleus":       ["#0000ff","#1565c0","#1976d2","#1e88e5","#2196f3","#42a5f5","#64b5f6","#90caf9","#0d47a1","#0288d1"],
  "🟣 Violets":     ["#9c27b0","#7b1fa2","#6a1b9a","#4a148c","#ba68c8","#ce93d8","#e1bee7","#ab47bc","#8e24aa","#d500f9"],
  "🩷 Roses":       ["#e91e63","#ad1457","#880e4f","#f06292","#f48fb1","#fce4ec","#ff4081","#ff80ab","#ff1493","#c2185b"],
  "🏛 Archi":       ["#c8622a","#3d6b8c","#4a7c59","#8b4513","#546e7a","#7c3aed","#c73e1d","#2d6a4f","#1a237e","#4e342e"],
  "🪵 Bois":        ["#c8a96a","#b8904a","#a0722a","#8B6914","#6b4c1e","#4a3010","#deb887","#d2691e","#cd853f","#f4a460"],
  "⚙️ Métal":       ["#607d8b","#546e7a","#78909c","#b0bec5","#37474f","#90a4ae","#455a64","#cfd8dc","#263238","#80cbc4"],
  "🧱 Béton":       ["#9e9e9e","#bdbdbd","#757575","#616161","#424242","#e0e0e0","#eeeeee","#f5f5f5","#d4d4d4","#808080"],
  "🌿 Nature":      ["#2d6a4f","#52b788","#95d5b2","#d8f3dc","#74c69d","#1b4332","#40916c","#b7e4c7","#081c15","#a8dadc"],
  "🌅 Sunset":      ["#ff6b35","#ff9f1c","#ffd60a","#c73e1d","#ef233c","#8d0801","#f4a261","#e76f51","#e63946","#ffb703"],
  "🌊 Océan":       ["#023e8a","#0077b6","#0096c7","#00b4d8","#48cae4","#90e0ef","#ade8f4","#caf0f8","#03045e","#7b9e87"],
  "🌸 Sakura":      ["#ffb7c5","#ff69b4","#ff1493","#db7093","#ffc0cb","#ffb6c1","#ff85a1","#e75480","#c71585","#ff007f"],
  "🏔 Arctique":    ["#e8f4f8","#b8d8e8","#7ab8d8","#4a90b8","#2c6e8c","#1a4a68","#0a2a48","#d0e8f0","#a0c8e0","#6aaac0"],
  "🍂 Automne":     ["#8B4513","#A0522D","#CD853F","#D2691E","#DAA520","#B8860B","#8B6914","#A52A2A","#800000","#C0392B"],
  "🎨 Pastel":      ["#ffb3ba","#ffdfba","#ffffba","#baffc9","#bae1ff","#d4baff","#ffd4ba","#c9ffba","#ffbaf0","#bafffa"],
  "🌙 Nuit":        ["#0d1117","#161b22","#58a6ff","#3fb950","#f78166","#d2a8ff","#ffa657","#79c0ff","#56d364","#ff7b72"],
  "🌈 Néon":        ["#00ffcc","#ff00ff","#ffff00","#00ff00","#ff6600","#ff0066","#0066ff","#cc00ff","#00ccff","#ff3300"],
  "🎭 Pop Art":     ["#ff3366","#ff6600","#ffcc00","#33cc33","#3399ff","#cc33ff","#ff0099","#00cccc","#ff9900","#9933ff"],
  "🏯 Japonais":    ["#c62828","#880e4f","#4a148c","#1a237e","#006064","#1b5e20","#f57f17","#bf360c","#37474f","#e0e0e0"],
  "🇸🇪 Nordique":    ["#2c3e50","#3498db","#ecf0f1","#95a5a6","#bdc3c7","#1abc9c","#16a085","#2980b9","#8e44ad","#27ae60"],
  "🎹 Piano":       ["#000000","#1a1a1a","#333333","#666666","#999999","#cccccc","#e0e0e0","#f5f5f5","#ffffff","#d4a017"],
  "🔥 Feu":         ["#ff0000","#ff3300","#ff6600","#ff9900","#ffcc00","#ffff00","#ff4500","#dc143c","#8b0000","#ffd700"],
  "💎 Gemmes":      ["#1a0a2e","#4a148c","#7b1fa2","#0d47a1","#1565c0","#006064","#004d40","#1b5e20","#b71c1c","#e65100"],
  "🌻 Champs":      ["#ffd700","#ffa500","#ff8c00","#228b22","#90ee90","#98fb98","#adff2f","#7fff00","#00ff7f","#3cb371"],
  "🏗 Structure":   ["#37474f","#455a64","#546e7a","#607d8b","#78909c","#90a4ae","#b0bec5","#cfd8dc","#eceff1","#263238"],
  "📐 Plans":       ["#1a1a1a","#c8622a","#3d6b8c","#e94560","#4a7c59","#ff6b35","#7c3aed","#2196f3","#4caf50","#ff9800"],
}

const HPAL = {
  "Standards": ["#ffff00","#ff9f1c","#00ff88","#00cfff","#ff00ff","#ff3366"],
  "Doux":      ["#fff176","#ffe082","#a5d6a7","#80deea","#ce93d8","#f48fb1"],
  "Néon":      ["#00ffcc","#ff00ff","#ffff00","#00ff00","#ff6600","#0066ff"],
  "Pastel":    ["#ffcccc","#ffd9b3","#ffffcc","#ccffcc","#ccf2ff","#e6ccff"],
  "Archi":     ["#ffe066","#ffd6b0","#b3f0d9","#b3d9ff","#f0b3ff","#ffb3c1"],
  "Chaud":     ["#ff4500","#ff6347","#ff7f50","#ffa07a","#ffb347","#ffd700"],
}

/* ══ BRUSH SIZES (mm) ════════════════════════════════════════ */
const BRUSH_SIZES_MM = [0.05,0.1,0.18,0.25,0.35,0.5,0.7,1.0,1.4,2.0,3.0,5.0,7.0,10.0]
const mmToPx = (mm) => mm * 3.78 // approx at 96dpi

const BRUSHES = [
  {id:"fineliner",n:"Fineliner"},
  {id:"crayon",   n:"Crayon"},
  {id:"stylo",    n:"Stylo"},
  {id:"feutre",   n:"Feutre"},
  {id:"pinceau",  n:"Pinceau"},
  {id:"craie",    n:"Craie"},
  {id:"broad",    n:"Broad"},
  {id:"gomme",    n:"Gomme"},
  {id:"surlig",   n:"Surligneur"},
]

const SCALES_M = ["1:1","1:2","1:5","1:10","1:20","1:50","1:100","1:200","1:500","1:1000"]
const SCALES_I = ['1/4"=1\'','3/16"=1\'','1/8"=1\'','3/32"=1\'','1"=10\'','1"=20\'','1"=40\'','1"=100\'']

const TOOLS_DEF = [
  {g:"Sélection",items:[{id:"select",l:"Sélection",i:"↖"},{id:"lasso",l:"Lasso",i:"⬡"}]},
  {g:"Dessin",   items:[{id:"pen",l:"Stylo",i:"✏"},{id:"highlight",l:"Surligneur",i:"▌"},{id:"eraser",l:"Gomme",i:"◻"}]},
  {g:"Formes",   items:[{id:"line",l:"Ligne",i:"/"},{id:"rect",l:"Rectangle",i:"□"},{id:"circle",l:"Cercle",i:"○"},{id:"arrow",l:"Flèche",i:"→"}]},
  {g:"Annotation",items:[{id:"text",l:"Texte",i:"T"},{id:"dim",l:"Cotation",i:"↔"},{id:"cloud",l:"Bulle",i:"💬"}]},
  {g:"Spécial",  items:[{id:"eyedropper",l:"Pipette",i:"💉"},{id:"ruler",l:"Règle",i:"📏"},{id:"protractor",l:"Rapporteur",i:"📐"}]},
]

/* ══ MASSIVE STRUCTURAL LIBRARY ══════════════════════════════ */
const STRUCT_METRIC = {
  "🪵 Bois Montants": [
    {id:"m_w2x3",l:"38×64mm",    w:38,  h:64,  type:"wood"},
    {id:"m_w2x4",l:"38×89mm",    w:38,  h:89,  type:"wood"},
    {id:"m_w2x6",l:"38×140mm",   w:38,  h:140, type:"wood"},
    {id:"m_w2x8",l:"38×184mm",   w:38,  h:184, type:"wood"},
    {id:"m_w2x10",l:"38×235mm",  w:38,  h:235, type:"wood"},
    {id:"m_w2x12",l:"38×286mm",  w:38,  h:286, type:"wood"},
    {id:"m_w3x4",l:"64×89mm",    w:64,  h:89,  type:"wood"},
    {id:"m_w4x4",l:"89×89mm",    w:89,  h:89,  type:"wood"},
    {id:"m_w4x6",l:"89×140mm",   w:89,  h:140, type:"wood"},
    {id:"m_w6x6",l:"140×140mm",  w:140, h:140, type:"wood"},
    {id:"m_w8x8",l:"184×184mm",  w:184, h:184, type:"wood"},
  ],
  "🪵 Bois Ingénierie": [
    {id:"m_glulam1",l:"GLB 80×200",  w:80,  h:200, type:"glulam"},
    {id:"m_glulam2",l:"GLB 130×240", w:130, h:240, type:"glulam"},
    {id:"m_glulam3",l:"GLB 175×380", w:175, h:380, type:"glulam"},
    {id:"m_lvl1",   l:"LVL 45×240",  w:45,  h:240, type:"glulam"},
    {id:"m_lvl2",   l:"LVL 89×300",  w:89,  h:300, type:"glulam"},
    {id:"m_clt100", l:"CLT 100mm",   w:100, h:400, type:"clt"},
    {id:"m_clt120", l:"CLT 120mm",   w:120, h:400, type:"clt"},
    {id:"m_clt160", l:"CLT 160mm",   w:160, h:400, type:"clt"},
    {id:"m_clt200", l:"CLT 200mm",   w:200, h:400, type:"clt"},
  ],
  "⚙️ HSS Carré (mm)": [
    {id:"m_hss50",  l:"HSS 50×50×3",   w:50,  h:50,  t:3,  type:"hss"},
    {id:"m_hss75",  l:"HSS 75×75×5",   w:75,  h:75,  t:5,  type:"hss"},
    {id:"m_hss100", l:"HSS 100×100×5", w:100, h:100, t:5,  type:"hss"},
    {id:"m_hss125", l:"HSS 125×125×6", w:125, h:125, t:6,  type:"hss"},
    {id:"m_hss150", l:"HSS 150×150×6", w:150, h:150, t:6,  type:"hss"},
    {id:"m_hss175", l:"HSS 175×175×8", w:175, h:175, t:8,  type:"hss"},
    {id:"m_hss200", l:"HSS 200×200×8", w:200, h:200, t:8,  type:"hss"},
    {id:"m_hss250", l:"HSS 250×250×10",w:250, h:250, t:10, type:"hss"},
    {id:"m_hss300", l:"HSS 300×300×12",w:300, h:300, t:12, type:"hss"},
  ],
  "⚙️ HSS Rect. (mm)": [
    {id:"m_hssr1",l:"HSS 100×50×4",  w:100, h:50,  t:4, type:"hss"},
    {id:"m_hssr2",l:"HSS 150×75×5",  w:150, h:75,  t:5, type:"hss"},
    {id:"m_hssr3",l:"HSS 200×100×6", w:200, h:100, t:6, type:"hss"},
    {id:"m_hssr4",l:"HSS 250×125×8", w:250, h:125, t:8, type:"hss"},
    {id:"m_hssr5",l:"HSS 300×150×8", w:300, h:150, t:8, type:"hss"},
  ],
  "⚙️ Profilés W (mm)": [
    {id:"m_w150", l:"W150×24",  w:102, h:160, fw:102,ft:10,wt:6,  type:"Ibeam"},
    {id:"m_w200", l:"W200×36",  w:165, h:203, fw:165,ft:12,wt:7,  type:"Ibeam"},
    {id:"m_w250", l:"W250×49",  w:202, h:257, fw:202,ft:14,wt:9,  type:"Ibeam"},
    {id:"m_w310", l:"W310×60",  w:203, h:303, fw:203,ft:15,wt:8,  type:"Ibeam"},
    {id:"m_w360", l:"W360×79",  w:205, h:354, fw:205,ft:17,wt:9,  type:"Ibeam"},
    {id:"m_w460", l:"W460×97",  w:193, h:465, fw:193,ft:19,wt:11, type:"Ibeam"},
    {id:"m_w530", l:"W530×101", w:214, h:533, fw:214,ft:20,wt:12, type:"Ibeam"},
  ],
  "⚙️ IPE/HEA (mm)": [
    {id:"m_ipe120",l:"IPE 120", w:64,  h:120, fw:64, ft:8, wt:4.4,type:"Ibeam"},
    {id:"m_ipe160",l:"IPE 160", w:82,  h:160, fw:82, ft:9, wt:5,  type:"Ibeam"},
    {id:"m_ipe200",l:"IPE 200", w:100, h:200, fw:100,ft:10,wt:5.6,type:"Ibeam"},
    {id:"m_ipe240",l:"IPE 240", w:120, h:240, fw:120,ft:10,wt:6.2,type:"Ibeam"},
    {id:"m_ipe300",l:"IPE 300", w:150, h:300, fw:150,ft:11,wt:7.1,type:"Ibeam"},
    {id:"m_hea200",l:"HEA 200", w:200, h:190, fw:200,ft:10,wt:6.5,type:"Ibeam"},
    {id:"m_hea260",l:"HEA 260", w:260, h:250, fw:260,ft:13,wt:8,  type:"Ibeam"},
    {id:"m_heb200",l:"HEB 200", w:200, h:200, fw:200,ft:15,wt:9,  type:"Ibeam"},
  ],
  "🧱 Béton Poteaux": [
    {id:"m_c150",  l:"Poteau 150×150", w:150, h:150, type:"conc"},
    {id:"m_c200",  l:"Poteau 200×200", w:200, h:200, type:"conc"},
    {id:"m_c250",  l:"Poteau 250×250", w:250, h:250, type:"conc"},
    {id:"m_c300",  l:"Poteau 300×300", w:300, h:300, type:"conc"},
    {id:"m_c400",  l:"Poteau 400×400", w:400, h:400, type:"conc"},
    {id:"m_cr300", l:"Pot. Rond Ø300", w:300, h:300, type:"concR"},
    {id:"m_cr400", l:"Pot. Rond Ø400", w:400, h:400, type:"concR"},
    {id:"m_cr500", l:"Pot. Rond Ø500", w:500, h:500, type:"concR"},
  ],
  "🧱 Béton Murs/Dalles": [
    {id:"m_mur150",l:"Mur 150mm",      w:150, h:600, type:"conc"},
    {id:"m_mur200",l:"Mur 200mm",      w:200, h:600, type:"conc"},
    {id:"m_mur250",l:"Mur 250mm",      w:250, h:600, type:"conc"},
    {id:"m_mur300",l:"Mur 300mm",      w:300, h:600, type:"conc"},
    {id:"m_dal150",l:"Dalle 150mm",    w:600, h:150, type:"conc"},
    {id:"m_dal200",l:"Dalle 200mm",    w:600, h:200, type:"conc"},
    {id:"m_b300",  l:"Poutre 300×600", w:300, h:600, type:"concB"},
    {id:"m_b400",  l:"Poutre 400×700", w:400, h:700, type:"concB"},
  ],
  "🧱 Béton Fondations": [
    {id:"m_f400",  l:"Semelle 400×400",  w:400, h:400, type:"ftg"},
    {id:"m_f600",  l:"Semelle 600×600",  w:600, h:600, type:"ftg"},
    {id:"m_f900",  l:"Semelle 900×900",  w:900, h:900, type:"ftg"},
    {id:"m_sf200", l:"Sem. filante 200", w:200, h:600, type:"conc"},
    {id:"m_pile250",l:"Pieu Ø250",       w:250, h:250, type:"concR"},
    {id:"m_pile350",l:"Pieu Ø350",       w:350, h:350, type:"concR"},
    {id:"m_pile500",l:"Pieu Ø500",       w:500, h:500, type:"concR"},
  ],
  "🚪 Portes (mm)": [
    {id:"m_d810", l:"Porte 810×2030",   w:810, h:2030,type:"door"},
    {id:"m_d900", l:"Porte 900×2030",   w:900, h:2030,type:"door"},
    {id:"m_d1000",l:"Porte 1000×2100",  w:1000,h:2100,type:"door"},
    {id:"m_d1200",l:"Porte 1200×2100",  w:1200,h:2100,type:"door"},
    {id:"m_dd",   l:"Double 1800×2100", w:1800,h:2100,type:"doorD"},
    {id:"m_dg",   l:"Vitrée 900×2100",  w:900, h:2100,type:"doorG"},
    {id:"m_ds",   l:"Coulissante 900",  w:900, h:2100,type:"door"},
  ],
  "🪟 Fenêtres (mm)": [
    {id:"m_w600", l:"Fen. 600×900",    w:600, h:900, type:"win"},
    {id:"m_w900", l:"Fen. 900×1200",   w:900, h:1200,type:"win"},
    {id:"m_w1200",l:"Fen. 1200×1500",  w:1200,h:1500,type:"win"},
    {id:"m_w1500",l:"Fen. 1500×1800",  w:1500,h:1800,type:"win"},
    {id:"m_w1800",l:"Fen. 1800×1800",  w:1800,h:1800,type:"win"},
    {id:"m_skylight",l:"Lanterneau 1200",w:1200,h:1200,type:"win"},
  ],
}

const STRUCT_IMPERIAL = {
  "🪵 Wood Studs (in)": [
    {id:"i_w2x3",l:"2×3 (1.5\"×2.5\")",  w:38,  h:64,  type:"wood"},
    {id:"i_w2x4",l:"2×4 (1.5\"×3.5\")",  w:38,  h:89,  type:"wood"},
    {id:"i_w2x6",l:"2×6 (1.5\"×5.5\")",  w:38,  h:140, type:"wood"},
    {id:"i_w2x8",l:"2×8 (1.5\"×7.25\")", w:38,  h:184, type:"wood"},
    {id:"i_w2x10",l:"2×10 (1.5\"×9.25\")",w:38,  h:235, type:"wood"},
    {id:"i_w2x12",l:"2×12 (1.5\"×11.25\")",w:38, h:286, type:"wood"},
    {id:"i_w4x4",l:"4×4 (3.5\"×3.5\")",  w:89,  h:89,  type:"wood"},
    {id:"i_w6x6",l:"6×6 (5.5\"×5.5\")",  w:140, h:140, type:"wood"},
    {id:"i_w8x8",l:"8×8 (7.5\"×7.5\")",  w:184, h:184, type:"wood"},
  ],
  "🪵 Eng. Wood (in)": [
    {id:"i_glulam1",l:"Glu-Lam 3×8",   w:80,  h:200, type:"glulam"},
    {id:"i_glulam2",l:"Glu-Lam 5×10",  w:130, h:240, type:"glulam"},
    {id:"i_lvl",    l:"LVL 1.75×12",   w:45,  h:300, type:"glulam"},
    {id:"i_tji",    l:"TJI 9.5\"",      w:38,  h:241, type:"tji"},
    {id:"i_tji14",  l:"TJI 14\"",       w:38,  h:356, type:"tji"},
  ],
  "⚙️ HSS Square (in)": [
    {id:"i_hss2",  l:"HSS 2×2×3/16",  w:51,  h:51,  t:5,  type:"hss"},
    {id:"i_hss3",  l:"HSS 3×3×1/4",   w:76,  h:76,  t:6,  type:"hss"},
    {id:"i_hss4",  l:"HSS 4×4×1/4",   w:102, h:102, t:6,  type:"hss"},
    {id:"i_hss5",  l:"HSS 5×5×5/16",  w:127, h:127, t:8,  type:"hss"},
    {id:"i_hss6",  l:"HSS 6×6×3/8",   w:152, h:152, t:10, type:"hss"},
    {id:"i_hss8",  l:"HSS 8×8×1/2",   w:203, h:203, t:13, type:"hss"},
    {id:"i_hss10", l:"HSS 10×10×5/8", w:254, h:254, t:16, type:"hss"},
    {id:"i_hss12", l:"HSS 12×12×5/8", w:305, h:305, t:16, type:"hss"},
  ],
  "⚙️ HSS Rect. (in)": [
    {id:"i_hssr1",l:"HSS 4×2×3/16",  w:102, h:51,  t:5, type:"hss"},
    {id:"i_hssr2",l:"HSS 6×3×1/4",   w:152, h:76,  t:6, type:"hss"},
    {id:"i_hssr3",l:"HSS 8×4×1/4",   w:203, h:102, t:6, type:"hss"},
    {id:"i_hssr4",l:"HSS 10×6×3/8",  w:254, h:152, t:10,type:"hss"},
    {id:"i_hssr5",l:"HSS 12×6×3/8",  w:305, h:152, t:10,type:"hss"},
  ],
  "⚙️ W Shapes (in)": [
    {id:"i_w6x15", l:"W6×15",   w:152, h:152, fw:152,ft:11,wt:6,  type:"Ibeam"},
    {id:"i_w8x24", l:"W8×24",   w:165, h:203, fw:165,ft:12,wt:7,  type:"Ibeam"},
    {id:"i_w10x49",l:"W10×49",  w:202, h:257, fw:202,ft:14,wt:9,  type:"Ibeam"},
    {id:"i_w12x53",l:"W12×53",  w:254, h:305, fw:254,ft:15,wt:9,  type:"Ibeam"},
    {id:"i_w14x82",l:"W14×82",  w:254, h:356, fw:254,ft:18,wt:11, type:"Ibeam"},
    {id:"i_w16x100",l:"W16×100",w:267, h:406, fw:267,ft:19,wt:12, type:"Ibeam"},
    {id:"i_w18x97",l:"W18×97",  w:214, h:457, fw:214,ft:19,wt:11, type:"Ibeam"},
    {id:"i_w21x101",l:"W21×101",w:219, h:533, fw:219,ft:20,wt:12, type:"Ibeam"},
  ],
  "🧱 Concrete (in)": [
    {id:"i_c8",   l:"Col 8\"×8\"",    w:203, h:203, type:"conc"},
    {id:"i_c10",  l:"Col 10\"×10\"",  w:254, h:254, type:"conc"},
    {id:"i_c12",  l:"Col 12\"×12\"",  w:305, h:305, type:"conc"},
    {id:"i_c16",  l:"Col 16\"×16\"",  w:406, h:406, type:"conc"},
    {id:"i_cr12", l:"Col Rnd Ø12\"",  w:305, h:305, type:"concR"},
    {id:"i_cr16", l:"Col Rnd Ø16\"",  w:406, h:406, type:"concR"},
    {id:"i_w6in", l:"Wall 6\"",       w:152, h:600, type:"conc"},
    {id:"i_w8in", l:"Wall 8\"",       w:203, h:600, type:"conc"},
    {id:"i_w10in",l:"Wall 10\"",      w:254, h:600, type:"conc"},
    {id:"i_w12in",l:"Wall 12\"",      w:305, h:600, type:"conc"},
  ],
  "🚪 Doors (in)": [
    {id:"i_d32",  l:"Door 32\"×80\"", w:813, h:2032,type:"door"},
    {id:"i_d36",  l:"Door 36\"×80\"", w:914, h:2032,type:"door"},
    {id:"i_d48",  l:"Door 48\"×84\"", w:1219,h:2134,type:"door"},
    {id:"i_dd72", l:"Dbl 72\"×84\"",  w:1829,h:2134,type:"doorD"},
  ],
  "🪟 Windows (in)": [
    {id:"i_w2436",l:"Win 24\"×36\"", w:610, h:914, type:"win"},
    {id:"i_w3648",l:"Win 36\"×48\"", w:914, h:1219,type:"win"},
    {id:"i_w4860",l:"Win 48\"×60\"", w:1219,h:1524,type:"win"},
    {id:"i_w6060",l:"Win 60\"×60\"", w:1524,h:1524,type:"win"},
  ],
}

const THEMES_LIST = [
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
  {id:"white",  l:"Blanc",       c:"#ffffff"},
  {id:"cream",  l:"Crème",       c:"#fdf6ed"},
  {id:"yellow", l:"Jaune pâle",  c:"#fffff0"},
  {id:"blue",   l:"Bleu ciel",   c:"#f0f8ff"},
  {id:"green",  l:"Vert menthe", c:"#f0fff4"},
  {id:"pink",   l:"Rose poudré", c:"#fff0f5"},
  {id:"gray",   l:"Gris clair",  c:"#f5f5f5"},
  {id:"dark",   l:"Ardoise",     c:"#1c2128"},
  {id:"navy",   l:"Marine",      c:"#0d1b2a"},
  {id:"kraft",  l:"Kraft",       c:"#f4ede0"},
]

const GRID_COLORS = [
  {id:"blue",   l:"Bleu",    c:"rgba(61,107,140,.12)"},
  {id:"gray",   l:"Gris",    c:"rgba(0,0,0,.08)"},
  {id:"red",    l:"Rouge",   c:"rgba(200,50,50,.1)"},
  {id:"green",  l:"Vert",    c:"rgba(50,150,50,.1)"},
  {id:"orange", l:"Orange",  c:"rgba(200,98,42,.1)"},
  {id:"purple", l:"Violet",  c:"rgba(124,58,237,.1)"},
  {id:"white",  l:"Blanc",   c:"rgba(255,255,255,.15)"},
]

/* ══ RENDER STRUCTURAL ELEMENT ════════════════════════════════ */
function renderEl(el, sc=1/50){
  const px=sc*3.78, W=Math.max(el.w*px,4), H=Math.max(el.h*px,4), t=(el.t||6)*px
  if(["wood","glulam","clt","tji"].includes(el.type)){
    const c=el.type==="wood"?"#c8a96a":el.type==="glulam"?"#b8904a":el.type==="clt"?"#d4b896":"#e8d4b0"
    return<svg width={W}height={H}style={{display:"block"}}><rect width={W}height={H}fill={c}stroke="#8B6914"strokeWidth={.8}/>{[.25,.5,.75].map(r=><line key={r}x1={W*r}y1={0}x2={W*r}y2={H}stroke="#a07820"strokeWidth={.4}strokeDasharray="3,4"/>)}</svg>
  }
  if(el.type==="hss")return<svg width={W}height={H}style={{display:"block"}}><rect width={W}height={H}fill="#607d8b"stroke="#37474f"strokeWidth={1}/><rect x={t}y={t}width={Math.max(W-2*t,1)}height={Math.max(H-2*t,1)}fill="white"stroke="#546e7a"strokeWidth={.5}/></svg>
  if(el.type==="Ibeam"){const fw=el.fw?el.fw*px:W,ft2=el.ft?el.ft*px:W*.12,wt2=el.wt?el.wt*px:W*.06;return<svg width={fw}height={H}style={{display:"block"}}><rect x={0}y={0}width={fw}height={ft2}fill="#546e7a"stroke="#37474f"strokeWidth={.8}/><rect x={(fw-wt2)/2}y={ft2}width={wt2}height={Math.max(H-2*ft2,1)}fill="#607d8b"stroke="#37474f"strokeWidth={.8}/><rect x={0}y={H-ft2}width={fw}height={ft2}fill="#546e7a"stroke="#37474f"strokeWidth={.8}/></svg>}
  if(["conc","concB"].includes(el.type))return<svg width={W}height={H}style={{display:"block"}}><rect width={W}height={H}fill="#c0c0c0"stroke="#888"strokeWidth={1}/><line x1={0}y1={0}x2={W}y2={H}stroke="#aaa"strokeWidth={.6}/><line x1={W}y1={0}x2={0}y2={H}stroke="#aaa"strokeWidth={.6}/></svg>
  if(el.type==="concR")return<svg width={W}height={H}style={{display:"block"}}><circle cx={W/2}cy={H/2}r={Math.min(W,H)/2-1}fill="#c0c0c0"stroke="#888"strokeWidth={1}/><line x1={W*.2}y1={H*.2}x2={W*.8}y2={H*.8}stroke="#aaa"strokeWidth={.6}/><line x1={W*.8}y1={H*.2}x2={W*.2}y2={H*.8}stroke="#aaa"strokeWidth={.6}/></svg>
  if(el.type==="ftg")return<svg width={W}height={H}style={{display:"block"}}><rect width={W}height={H}fill="#d0d0d0"stroke="#666"strokeWidth={1}strokeDasharray="3,3"/><rect x={W*.3}y={H*.3}width={W*.4}height={H*.4}fill="#b0b0b0"stroke="#888"strokeWidth={1}/></svg>
  if(el.type==="door")return<svg width={W}height={H}style={{display:"block"}}><rect width={W}height={H}fill="rgba(200,160,80,.12)"stroke="#8b6f47"strokeWidth={1.5}/><path d={`M ${W*.05},${H*.97} A ${W*.9},${H*.9} 0 0 1 ${W*.95},${H*.97}`}fill="none"stroke="#8b6f47"strokeWidth={.8}strokeDasharray="3,2"/><circle cx={W*.85}cy={H*.5}r={W*.05}fill="#c8622a"/></svg>
  if(el.type==="doorD")return<svg width={W}height={H}style={{display:"block"}}><rect width={W}height={H}fill="rgba(200,160,80,.12)"stroke="#8b6f47"strokeWidth={1.5}/><line x1={W/2}y1={0}x2={W/2}y2={H}stroke="#8b6f47"strokeWidth={.8}/></svg>
  if(el.type==="doorG")return<svg width={W}height={H}style={{display:"block"}}><rect width={W}height={H}fill="rgba(122,181,212,.2)"stroke="#4a90b8"strokeWidth={1.5}/><rect x={W*.05}y={H*.05}width={W*.9}height={H*.9}fill="rgba(122,181,212,.1)"stroke="#4a90b8"strokeWidth={.5}/></svg>
  if(el.type==="win")return<svg width={W}height={H}style={{display:"block"}}><rect width={W}height={H}fill="rgba(122,181,212,.25)"stroke="#4a90b8"strokeWidth={1.5}/><line x1={W/2}y1={0}x2={W/2}y2={H}stroke="#4a90b8"strokeWidth={.8}/><line x1={0}y1={H/2}x2={W}y2={H/2}stroke="#4a90b8"strokeWidth={.8}/></svg>
  return<div style={{width:Math.max(W,4),height:Math.max(H,4),background:"#ccc",border:"1px solid #999",fontSize:8,display:"flex",alignItems:"center",justifyContent:"center"}}>{el.l}</div>
}

/* ══ PAPER BACKGROUND ════════════════════════════════════════ */
function Paper({tmpl, T, pageColor, gridColor}){
  const W=794, H=1123, L=[]
  const bg = pageColor || T.paper
  const gc = gridColor || T.grid
  const pl = gridColor || T.pline
  const grid=(gap,col,sw)=>{for(let x=0;x<=W;x+=gap)L.push(<line key={`v${x}${sw}`}x1={x}y1={0}x2={x}y2={H}stroke={col}strokeWidth={sw}/>);for(let y=0;y<=H;y+=gap)L.push(<line key={`h${y}${sw}`}x1={0}y1={y}x2={W}y2={y}stroke={col}strokeWidth={sw}/>)}
  if(tmpl==="grid5") {grid(18.9,gc,.5);grid(94.5,pl,.9)}
  if(tmpl==="grid10"){grid(37.8,gc,.5);grid(189, pl,.9)}
  if(tmpl==="math")  {grid(28.35,gc,.5);grid(141.75,pl,.9)}
  if(tmpl==="dotted"){for(let x=26;x<W;x+=26)for(let y=26;y<H;y+=26)L.push(<circle key={`d${x}${y}`}cx={x}cy={y}r={1}fill={gc}opacity={.5}/>)}
  if(tmpl==="lined") {for(let y=72;y<H;y+=28)L.push(<line key={`l${y}`}x1={52}y1={y}x2={W-52}y2={y}stroke={gc}strokeWidth={.9}/>);L.push(<line key="lm"x1={90}y1={0}x2={90}y2={H}stroke="rgba(200,80,80,.15)"strokeWidth={1}/>)}
  if(tmpl==="cornell"){for(let y=80;y<H-100;y+=28)L.push(<line key={`cl${y}`}x1={200}y1={y}x2={W-48}y2={y}stroke={gc}strokeWidth={.9}/>);L.push(<line key="cv"x1={190}y1={70}x2={190}y2={H-100}stroke="rgba(200,80,80,.2)"strokeWidth={1}/>);L.push(<line key="ch"x1={40}y1={H-100}x2={W-40}y2={H-100}stroke="rgba(200,80,80,.2)"strokeWidth={1}/>)}
  if(tmpl==="isometric"){const s=37.8;for(let i=-H;i<W+H;i+=s){L.push(<line key={`a${i}`}x1={i}y1={0}x2={i+H}y2={H}stroke={gc}strokeWidth={.5}/>);L.push(<line key={`b${i}`}x1={i}y1={0}x2={i-H}y2={H}stroke={gc}strokeWidth={.5}/>)}}
  if(["plan","elevation","section","detail"].includes(tmpl)){grid(37.8,gc,.5);grid(189,pl,.9);L.push(<rect key="tb"x={20}y={H-92}width={W-40}height={82}fill="none"stroke={pl}strokeWidth={1}/>);L.push(<rect key="b1"x={12}y={12}width={W-24}height={H-24}fill="none"stroke={pl}strokeWidth={1.5}/>)}
  if(tmpl==="music"){for(let y=80;y<H-60;y+=70)for(let s=0;s<5;s++)L.push(<line key={`ms${y}${s}`}x1={40}y1={y+s*9}x2={W-40}y2={y+s*9}stroke={gc}strokeWidth={.9}/>)}
  return<svg style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:0}}width={W}height={H}><rect width={W}height={H}fill={bg}/>{L}</svg>
}

/* ══ DRAWING CANVAS ══════════════════════════════════════════ */
function DrawCanvas({tool, color, size, cRef, onStroke, onPickColor}){
  const drawing=useRef(false), strokes=useRef([]), cur=useRef([])
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
  const gP=e=>{const r=cRef.current.getBoundingClientRect();return{x:((e.touches?e.touches[0].clientX:e.clientX)-r.left)*(794/r.width),y:((e.touches?e.touches[0].clientY:e.clientY)-r.top)*(1123/r.height)}}
  const pickColor=e=>{
    const p=gP(e)
    const ctx=cRef.current.getContext("2d")
    const pixel=ctx.getImageData(p.x,p.y,1,1).data
    if(pixel[3]>0){
      const hex=`#${[pixel[0],pixel[1],pixel[2]].map(v=>v.toString(16).padStart(2,"0")).join("")}`
      if(onPickColor) onPickColor(hex)
    }
  }
  const dn=e=>{
    if(tool==="eyedropper"){pickColor(e);return}
    e.preventDefault();drawing.current=true;cur.current=[gP(e)]
  }
  const mv=e=>{
    if(tool==="eyedropper")return
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
    strokes.current.push({pts:[...cur.current],color,size,tool})
    cur.current=[]
    if(onStroke) onStroke(strokes.current)
  }
  useEffect(()=>{
    window.__undo=()=>{strokes.current.pop();redraw();if(onStroke)onStroke(strokes.current)}
    window.__clear=()=>{strokes.current=[];redraw();if(onStroke)onStroke(strokes.current)}
    window.__loadStrokes=(data)=>{try{const p=typeof data==="string"?JSON.parse(data):data;strokes.current=p||[];redraw()}catch{}}
  },[redraw])
  return<canvas ref={cRef}width={794}height={1123}
    style={{position:"absolute",inset:0,width:"100%",height:"100%",
            cursor:tool==="eraser"?"cell":tool==="eyedropper"?"crosshair":"crosshair",
            touchAction:"none",zIndex:5}}
    onMouseDown={dn}onMouseMove={mv}onMouseUp={up}onMouseLeave={up}
    onTouchStart={dn}onTouchMove={mv}onTouchEnd={up}/>
}

/* ══ FLOATING TOOL PANEL ══════════════════════════════════════ */
function FloatingPanel({T, color, setColor, sizeMm, setSizeMm, tool, setTool, favorites, setFavorites}){
  const [pos, setPos] = useState({x: 20, y: 200})
  const [dragging, setDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({x:0,y:0})
  const [collapsed, setCollapsed] = useState(false)
  const [cPal, setCPal] = useState("📐 Plans")
  const [hPal, setHPal] = useState("Standards")
  const [showColorWheel, setShowColorWheel] = useState(false)
  const [customColor, setCustomColor] = useState(color)
  const wheelRef = useRef()

  const startDrag=e=>{setDragging(true);setDragOffset({x:e.clientX-pos.x,y:e.clientY-pos.y})}
  useEffect(()=>{
    if(!dragging)return
    const mm=e=>{setPos({x:e.clientX-dragOffset.x,y:e.clientY-dragOffset.y})}
    const mu=()=>setDragging(false)
    window.addEventListener("mousemove",mm);window.addEventListener("mouseup",mu)
    return()=>{window.removeEventListener("mousemove",mm);window.removeEventListener("mouseup",mu)}
  },[dragging,dragOffset])

  const saveFav=(slot)=>{
    const newFavs=[...favorites]
    newFavs[slot]={color,sizeMm,tool}
    setFavorites(newFavs)
  }
  const loadFav=(fav)=>{
    if(!fav)return
    setColor(fav.color)
    setSizeMm(fav.sizeMm)
    if(fav.tool)setTool(fav.tool)
  }

  // Color wheel using canvas
  useEffect(()=>{
    if(!showColorWheel||!wheelRef.current)return
    const canvas=wheelRef.current
    const ctx=canvas.getContext("2d")
    const cx=75,cy=75,r=70
    for(let a=0;a<360;a++){
      const rad=a*Math.PI/180
      const grad=ctx.createLinearGradient(cx,cy,cx+r*Math.cos(rad),cy+r*Math.sin(rad))
      grad.addColorStop(0,"white")
      grad.addColorStop(1,`hsl(${a},100%,50%)`)
      ctx.beginPath();ctx.moveTo(cx,cy)
      ctx.arc(cx,cy,r,rad,(a+1)*Math.PI/180)
      ctx.fillStyle=grad;ctx.fill()
    }
    const darkGrad=ctx.createRadialGradient(cx,cy,0,cx,cy,r)
    darkGrad.addColorStop(0,"rgba(0,0,0,0)");darkGrad.addColorStop(1,"rgba(0,0,0,0.5)")
    ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle=darkGrad;ctx.fill()
  },[showColorWheel])

  const pickFromWheel=e=>{
    const r=wheelRef.current.getBoundingClientRect()
    const ctx=wheelRef.current.getContext("2d")
    const pixel=ctx.getImageData(e.clientX-r.left,e.clientY-r.top,1,1).data
    if(pixel[3]>0){
      const hex=`#${[pixel[0],pixel[1],pixel[2]].map(v=>v.toString(16).padStart(2,"0")).join("")}`
      setColor(hex);setCustomColor(hex)
    }
  }

  if(collapsed) return(
    <div style={{position:"fixed",left:pos.x,top:pos.y,zIndex:100,cursor:"move"}}
      onMouseDown={startDrag}>
      <div onClick={e=>{e.stopPropagation();setCollapsed(false)}}
        style={{width:28,height:28,borderRadius:"50%",background:color,border:`3px solid ${T.surface}`,
                boxShadow:"0 2px 12px rgba(0,0,0,.3)",cursor:"pointer",
                outline:`2px solid ${T.accent}`}}
        title="Ouvrir le panneau"/>
    </div>
  )

  return(
    <div style={{position:"fixed",left:pos.x,top:pos.y,zIndex:100,
                 background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,
                 boxShadow:"0 8px 32px rgba(0,0,0,.25)",width:220,userSelect:"none"}}>
      {/* Drag handle */}
      <div onMouseDown={startDrag} style={{cursor:"grab",padding:"8px 12px 4px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${T.border}`}}>
        <div style={{fontSize:10,color:T.muted,letterSpacing:.5}}>⠿ OUTILS</div>
        <div style={{display:"flex",gap:4}}>
          <div style={{width:10,height:10,borderRadius:"50%",background:color,border:`1px solid ${T.border}`}}/>
          <button onClick={()=>setCollapsed(true)} style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:13,lineHeight:1,padding:0}}>−</button>
        </div>
      </div>

      <div style={{padding:"10px 12px",display:"flex",flexDirection:"column",gap:10}}>
        {/* Color palette selector */}
        <div>
          <div style={{fontSize:9,color:T.muted,marginBottom:4,letterSpacing:.5}}>PALETTE</div>
          <select value={cPal} onChange={e=>setCPal(e.target.value)}
            style={{width:"100%",padding:"4px 6px",borderRadius:7,border:`1px solid ${T.border}`,background:T.bg,color:T.ink,fontSize:11,outline:"none",cursor:"pointer"}}>
            {Object.keys(CPAL).map(p=><option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Color swatches */}
        <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
          {CPAL[cPal].map(c=>(
            <button key={c} onClick={()=>{setColor(c);setCustomColor(c)}}
              style={{width:c===color?22:17,height:c===color?22:17,borderRadius:"50%",background:c,
                      border:`2px solid ${c===color?T.accent:"transparent"}`,cursor:"pointer",
                      outline:c==="#ffffff"?`1px solid ${T.border}`:"none",flexShrink:0,
                      transition:"all .1s"}}/>
          ))}
        </div>

        {/* Color wheel toggle */}
        <div>
          <button onClick={()=>setShowColorWheel(v=>!v)}
            style={{width:"100%",padding:"5px 8px",borderRadius:8,border:`1px solid ${showColorWheel?T.accent:T.border}`,background:showColorWheel?`${T.accent}15`:T.bg,color:showColorWheel?T.accent:T.muted,cursor:"pointer",fontSize:11,display:"flex",alignItems:"center",gap:6}}>
            🎡 Roue chromatique
          </button>
          {showColorWheel&&(
            <div style={{marginTop:6}}>
              <canvas ref={wheelRef} width={150} height={150}
                style={{borderRadius:"50%",cursor:"crosshair",display:"block",margin:"0 auto"}}
                onClick={pickFromWheel}/>
              <div style={{marginTop:6,display:"flex",alignItems:"center",gap:6}}>
                <input type="color" value={customColor} onChange={e=>{setCustomColor(e.target.value);setColor(e.target.value)}}
                  style={{width:28,height:28,padding:0,border:`1px solid ${T.border}`,borderRadius:6,cursor:"pointer"}}/>
                <input value={customColor} onChange={e=>{setCustomColor(e.target.value);if(/^#[0-9a-f]{6}$/i.test(e.target.value))setColor(e.target.value)}}
                  style={{flex:1,padding:"4px 6px",borderRadius:7,border:`1px solid ${T.border}`,background:T.bg,color:T.ink,fontSize:11,outline:"none",fontFamily:"monospace"}}/>
              </div>
            </div>
          )}
        </div>

        {/* Highlighter */}
        <div>
          <div style={{fontSize:9,color:T.muted,marginBottom:4,letterSpacing:.5}}>SURLIGNEUR</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
            {HPAL[hPal].map(c=>(
              <button key={c} onClick={()=>{setColor(c);setTool("highlight")}}
                style={{width:17,height:17,borderRadius:3,background:c+"aa",border:`2px solid ${color===c?T.accent:"transparent"}`,cursor:"pointer",flexShrink:0}}/>
            ))}
          </div>
        </div>

        {/* Size in mm */}
        <div>
          <div style={{fontSize:9,color:T.muted,marginBottom:4,letterSpacing:.5}}>TAILLE ({sizeMm}mm)</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
            {BRUSH_SIZES_MM.map(s=>(
              <button key={s} onClick={()=>setSizeMm(s)}
                style={{padding:"3px 6px",borderRadius:6,border:`1px solid ${sizeMm===s?T.accent:T.border}`,background:sizeMm===s?`${T.accent}18`:T.bg,color:sizeMm===s?T.accent:T.muted,cursor:"pointer",fontSize:9,fontFamily:"monospace"}}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Favorites */}
        <div>
          <div style={{fontSize:9,color:T.muted,marginBottom:4,letterSpacing:.5}}>FAVORIS (clic=charger, dbl=sauvegarder)</div>
          <div style={{display:"flex",gap:4}}>
            {Array.from({length:6},(_,i)=>{
              const fav=favorites[i]
              return(
                <div key={i} style={{position:"relative"}}>
                  <button
                    onClick={()=>loadFav(fav)}
                    onDoubleClick={()=>saveFav(i)}
                    title={fav?`${fav.color} ${fav.sizeMm}mm — double-clic pour sauvegarder`:"Double-clic pour sauvegarder"}
                    style={{width:28,height:28,borderRadius:7,background:fav?fav.color:T.bg,
                            border:`1px solid ${fav?T.accent:T.border}`,cursor:"pointer",
                            fontSize:fav?"8":"14",color:fav?"transparent":T.muted,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {!fav&&"+"}
                  </button>
                  {fav&&<div style={{position:"absolute",bottom:-12,left:0,right:0,textAlign:"center",fontSize:7,color:T.muted,fontFamily:"monospace"}}>{fav.sizeMm}</div>}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══ PAGE SETTINGS PANEL ══════════════════════════════════════ */
function PageSettingsPanel({T, pageColor, setPageColor, gridColor, setGridColor, onClose}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}}>
      <div style={{background:T.surface,borderRadius:16,padding:24,width:380,maxWidth:"94vw",boxShadow:"0 20px 60px rgba(0,0,0,.25)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:16,color:T.ink}}>🎨 Style de page</div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:20}}>×</button>
        </div>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:11,fontWeight:700,color:T.muted,marginBottom:8}}>COULEUR DE FOND</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {PAGE_COLORS.map(pc=>(
              <button key={pc.id} onClick={()=>setPageColor(pc.c)}
                title={pc.l}
                style={{width:36,height:36,borderRadius:8,background:pc.c,
                        border:`2px solid ${pageColor===pc.c?T.accent:T.border}`,
                        cursor:"pointer",outline:pc.c==="#ffffff"?`1px solid ${T.border}`:"none",
                        boxShadow:pageColor===pc.c?`0 0 8px ${T.accent}66`:"none"}}/>
            ))}
          </div>
        </div>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:T.muted,marginBottom:8}}>COULEUR DU QUADRILLAGE</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {GRID_COLORS.map(gc=>(
              <button key={gc.id} onClick={()=>setGridColor(gc.c)}
                title={gc.l}
                style={{width:36,height:36,borderRadius:8,background:`white`,
                        border:`2px solid ${gridColor===gc.c?T.accent:T.border}`,
                        cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
                        position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",inset:0,background:"white"}}/>
                <svg width={36} height={36} style={{position:"absolute",inset:0}}>
                  {[0,1,2,3].map(i=><line key={`v${i}`}x1={i*10+5}y1={0}x2={i*10+5}y2={36}stroke={gc.c}strokeWidth={1}/>)}
                  {[0,1,2,3].map(i=><line key={`h${i}`}x1={0}y1={i*10+5}x2={36}y2={i*10+5}stroke={gc.c}strokeWidth={1}/>)}
                </svg>
              </button>
            ))}
          </div>
        </div>
        <button onClick={onClose}
          style={{width:"100%",marginTop:18,padding:12,borderRadius:10,background:T.accent,border:"none",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer"}}>
          Appliquer ✓
        </button>
      </div>
    </div>
  )
}

/* ══ EDITOR ════════════════════════════════════════════════ */
export default function EditorPage() {
  const navigate = useNavigate()
  const { activeNotebook, getTheme, setTheme } = useAppStore()
  const [localTheme, setLocalTheme] = useState(null)
  const T = localTheme || getTheme()
  const nb = activeNotebook || {id:"1",title:"Carnet",subject:"arch",template:"plan",pages_count:1}
  const cRef = useRef()

  const [tool, setTool] = useState("pen")
  const [color, setColor] = useState("#1c1c24")
  const [sizeMm, setSizeMm] = useState(0.5)
  const [favorites, setFavorites] = useState(Array(6).fill(null))
  const [unitSys, setUnitSys] = useState("metric")
  const [scale, setScale] = useState("1:50")
  const [zoom, setZoom] = useState(.85)
  const [showLib, setShowLib] = useState(false)
  const [libMode, setLibMode] = useState("metric") // metric | imperial
  const [libCat, setLibCat] = useState("🪵 Bois Montants")
  const [libSearch, setLibSearch] = useState("")
  const [libClickMode, setLibClickMode] = useState(false)
  const [libPending, setLibPending] = useState(null)
  const [placed, setPlaced] = useState([])
  const [selected, setSelected] = useState(null)
  const [page, setPage] = useState(1)
  const [showLayers, setShowLayers] = useState(false)
  const [layers, setLayers] = useState([
    {id:"sketch",n:"Esquisse",v:true,locked:false},
    {id:"annot",n:"Annotations",v:true,locked:false},
    {id:"struct",n:"Structure",v:true,locked:false},
  ])
  const [showPageSettings, setShowPageSettings] = useState(false)
  const [pageColor, setPageColor] = useState(null)
  const [gridColor, setGridColor] = useState(null)
  const [showRuler, setShowRuler] = useState(false)
  const [showProt, setShowProt] = useState(false)
  const [saveStatus, setSaveStatus] = useState("idle")
  const [pageId, setPageId] = useState(null)
  const saveTimer = useRef(null)

  const sizePx = mmToPx(sizeMm)
  const activeColor = tool==="highlight" ? color : color

  const currentLib = libMode==="metric" ? STRUCT_METRIC : STRUCT_IMPERIAL
  const libCats = Object.keys(currentLib)
  const libItems = useMemo(()=>{
    const items = currentLib[libCat] || []
    return libSearch ? items.filter(e=>e.l.toLowerCase().includes(libSearch.toLowerCase())) : items
  },[libCat, libSearch, currentLib, libMode])

  // When switching lib mode, reset cat to first
  useEffect(()=>{
    const cats = Object.keys(libMode==="metric"?STRUCT_METRIC:STRUCT_IMPERIAL)
    if(!cats.includes(libCat)) setLibCat(cats[0])
  },[libMode])

  // Load page
  useEffect(()=>{
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) return
        const { data: pg } = await supabase.from("pages").select("*").eq("notebook_id", nb.id).eq("page_number", 1).single()
        if (pg) {
          setPageId(pg.id)
          if (pg.canvas_data && window.__loadStrokes) window.__loadStrokes(pg.canvas_data)
          if (pg.elements) setPlaced(typeof pg.elements==="string"?JSON.parse(pg.elements):pg.elements||[])
        } else {
          const { data: newPg } = await supabase.from("pages").insert([{notebook_id:nb.id,page_number:1,user_id:session.user.id}]).select().single()
          if (newPg) setPageId(newPg.id)
        }
      } catch {}
    }
    load()
  },[nb.id])

  const save = useCallback(async (strokes) => {
    if (!pageId) return
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return
      setSaveStatus("saving")
      await supabase.from("pages").update({canvas_data:JSON.stringify(strokes),elements:JSON.stringify(placed),updated_at:new Date().toISOString()}).eq("id",pageId)
      await supabase.from("notebooks").update({updated_at:new Date().toISOString()}).eq("id",nb.id)
      setSaveStatus("saved")
      setTimeout(()=>setSaveStatus("idle"),2000)
    } catch { setSaveStatus("error"); setTimeout(()=>setSaveStatus("idle"),3000) }
  },[pageId,placed,nb.id])

  const onStroke = useCallback((strokes)=>{
    if(saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(()=>save(strokes),1500)
  },[save])

  // Click-to-place element
  const handleCanvasClick = (e) => {
    if (!libPending) return
    const r = document.getElementById("canvas-area")?.getBoundingClientRect()
    if (!r) return
    const x = (e.clientX - r.left) / zoom - libPending.w*3.78/100
    const y = (e.clientY - r.top) / zoom - libPending.h*3.78/100
    setPlaced(p=>[...p,{id:Date.now(),el:libPending,x:Math.max(0,x),y:Math.max(0,y)}])
    setLibPending(null)
    setLibClickMode(false)
  }

  const changeTheme=(th)=>{setLocalTheme(th);setTheme(th.id)}

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:T.bg,fontFamily:"'Nunito',sans-serif",overflow:"hidden",color:T.ink}}>
      {showPageSettings&&<PageSettingsPanel T={T} pageColor={pageColor} setPageColor={setPageColor} gridColor={gridColor} setGridColor={setGridColor} onClose={()=>setShowPageSettings(false)}/>}

      {/* Floating panel */}
      <FloatingPanel T={T} color={color} setColor={setColor} sizeMm={sizeMm} setSizeMm={setSizeMm} tool={tool} setTool={setTool} favorites={favorites} setFavorites={setFavorites}/>

      {/* Pending element cursor */}
      {libPending&&(
        <div style={{position:"fixed",bottom:60,left:"50%",transform:"translateX(-50%)",zIndex:50,background:T.panel,color:"#fff",padding:"8px 16px",borderRadius:20,fontSize:12,pointerEvents:"none",boxShadow:"0 4px 16px rgba(0,0,0,.3)"}}>
          📍 Clic sur la page pour placer <strong>{libPending.l}</strong> — Échap pour annuler
        </div>
      )}

      {/* TOP BAR */}
      <div style={{height:48,background:T.panel,display:"flex",alignItems:"center",padding:"0 12px",gap:8,flexShrink:0,boxShadow:"0 2px 16px rgba(0,0,0,.3)",zIndex:30}}>
        <button onClick={()=>navigate("/")} style={{background:"none",border:"none",color:"#888",cursor:"pointer",fontSize:12,padding:"5px 8px",borderRadius:7}}>← Retour</button>
        <div style={{width:1,height:22,background:"#ffffff14"}}/>
        <div style={{flex:1,fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:13,color:"#ddd",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{nb.title}</div>
        <div style={{display:"flex",gap:5,alignItems:"center"}}>
          {saveStatus==="saving"&&<span style={{fontSize:10,color:"#f5a623"}}>⏳</span>}
          {saveStatus==="saved"&&<span style={{fontSize:10,color:"#4ade80"}}>✓</span>}
          <div style={{display:"flex",borderRadius:7,overflow:"hidden",border:"1px solid #ffffff14"}}>
            <button onClick={()=>{setUnitSys("metric");setScale("1:50")}} style={{padding:"3px 8px",background:unitSys==="metric"?"rgba(200,98,42,.4)":"transparent",border:"none",color:unitSys==="metric"?"#fff":"#777",cursor:"pointer",fontSize:10}}>mm</button>
            <button onClick={()=>{setUnitSys("imperial");setScale('1/4"=1\'')}} style={{padding:"3px 8px",background:unitSys==="imperial"?"rgba(200,98,42,.4)":"transparent",border:"none",color:unitSys==="imperial"?"#fff":"#777",cursor:"pointer",fontSize:10}}>in</button>
          </div>
          <select value={scale} onChange={e=>setScale(e.target.value)} style={{padding:"3px 6px",borderRadius:7,border:"1px solid #ffffff14",background:"#ffffff0c",color:"#aaa",fontSize:10,outline:"none",cursor:"pointer"}}>
            {(unitSys==="metric"?SCALES_M:SCALES_I).map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <div style={{display:"flex",alignItems:"center",gap:3,background:"#ffffff0a",borderRadius:7,padding:"0 7px",border:"1px solid #ffffff10"}}>
            <button onClick={()=>setZoom(z=>Math.max(.25,z-.1))} style={{background:"none",border:"none",color:"#aaa",cursor:"pointer",fontSize:14}}>−</button>
            <span style={{color:"#666",fontSize:10,minWidth:28,textAlign:"center"}}>{Math.round(zoom*100)}%</span>
            <button onClick={()=>setZoom(z=>Math.min(3,z+.1))} style={{background:"none",border:"none",color:"#aaa",cursor:"pointer",fontSize:14}}>+</button>
          </div>
          <button onClick={()=>setShowLib(v=>!v)} style={{padding:"3px 9px",borderRadius:7,border:`1px solid ${showLib?T.accent:"#ffffff14"}`,background:showLib?`${T.accent}22`:"#ffffff0a",color:showLib?T.accent:"#888",cursor:"pointer",fontSize:10}}>🏗 Biblio</button>
          <button onClick={()=>setShowPageSettings(true)} style={{padding:"3px 9px",borderRadius:7,border:"1px solid #ffffff14",background:"#ffffff0a",color:"#888",cursor:"pointer",fontSize:10}}>🎨 Page</button>
          <button onClick={()=>setShowLayers(v=>!v)} style={{padding:"3px 9px",borderRadius:7,border:`1px solid ${showLayers?"#60a5fa":"#ffffff14"}`,background:showLayers?"rgba(96,165,250,.15)":"#ffffff0a",color:showLayers?"#60a5fa":"#888",cursor:"pointer",fontSize:10}}>⊞</button>
          <button onClick={()=>setShowRuler(v=>!v)} style={{padding:"3px 9px",borderRadius:7,border:`1px solid ${showRuler?T.accent:"#ffffff14"}`,background:showRuler?`${T.accent}18`:"#ffffff0a",color:showRuler?T.accent:"#888",cursor:"pointer",fontSize:10}}>📏</button>
          <button onClick={()=>setShowProt(v=>!v)} style={{padding:"3px 9px",borderRadius:7,border:`1px solid ${showProt?T.accent:"#ffffff14"}`,background:showProt?`${T.accent}18`:"#ffffff0a",color:showProt?T.accent:"#888",cursor:"pointer",fontSize:10}}>📐</button>
          <button onClick={()=>window.__undo?.()} style={{padding:"3px 9px",borderRadius:7,border:"1px solid #ffffff14",background:"#ffffff0a",color:"#aaa",cursor:"pointer",fontSize:12}}>↩</button>
          <button onClick={()=>window.__clear?.()} style={{padding:"3px 9px",borderRadius:7,border:"1px solid rgba(233,69,96,.3)",background:"rgba(233,69,96,.1)",color:"#e94560",cursor:"pointer",fontSize:10}}>🗑</button>
        </div>
      </div>

      {/* TOOLS BAR */}
      <div style={{height:40,background:T.surface,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",padding:"0 12px",gap:4,flexShrink:0,overflowX:"auto"}}>
        {TOOLS_DEF.map(grp=>(
          <div key={grp.g} style={{display:"flex",gap:2,paddingRight:8,marginRight:4,borderRight:`1px solid ${T.border}`}}>
            {grp.items.map(t=>(
              <button key={t.id} title={t.l} onClick={()=>setTool(t.id)}
                style={{height:28,padding:"0 8px",borderRadius:7,border:`1px solid ${tool===t.id?T.accent:T.border}`,background:tool===t.id?`${T.accent}18`:T.bg,color:tool===t.id?T.accent:T.muted,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",gap:4,transition:"all .12s",whiteSpace:"nowrap",flexShrink:0}}>
                <span>{t.i}</span>
                <span style={{fontSize:9}}>{t.l}</span>
              </button>
            ))}
          </div>
        ))}
        {/* Current color + size display */}
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
          <div style={{width:18,height:18,borderRadius:"50%",background:color,border:`1px solid ${T.border}`}}/>
          <span style={{fontSize:10,color:T.muted,fontFamily:"monospace"}}>{sizeMm}mm</span>
        </div>
      </div>

      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        {/* CANVAS */}
        <div style={{flex:1,overflow:"auto",background:T.bg,display:"flex",justifyContent:"center",alignItems:"flex-start",padding:"20px",cursor:libPending?"crosshair":"default"}}
          id="canvas-area"
          onClick={libPending?handleCanvasClick:undefined}
          onKeyDown={e=>{if(e.key==="Escape")setLibPending(null)}}
          tabIndex={0}>
          <div style={{transform:`scale(${zoom})`,transformOrigin:"top center",transition:"transform .12s",position:"relative",flexShrink:0}}>
            <div style={{width:794,height:1123,position:"relative",boxShadow:"0 4px 40px rgba(0,0,0,.2)"}}>
              <Paper tmpl={nb.template||"plan"} T={T} pageColor={pageColor} gridColor={gridColor}/>

              {/* Placed elements */}
              {placed.map(item=>{
                const sel=selected===item.id
                return<div key={item.id} style={{position:"absolute",left:item.x,top:item.y,cursor:"move",pointerEvents:"all",userSelect:"none",outline:sel?"2px solid #c8622a":"none",outlineOffset:2,zIndex:sel?12:10}}
                  onMouseDown={e=>{e.stopPropagation();setSelected(item.id);const ox=e.clientX-item.x,oy=e.clientY-item.y;const mm=ev=>setPlaced(p=>p.map(e=>e.id===item.id?{...e,x:ev.clientX-ox,y:ev.clientY-oy}:e));const mu=()=>{window.removeEventListener("mousemove",mm);window.removeEventListener("mouseup",mu)};window.addEventListener("mousemove",mm);window.addEventListener("mouseup",mu)}}>
                  {renderEl(item.el,1/50)}
                  {sel&&<button onClick={()=>{setPlaced(p=>p.filter(e=>e.id!==item.id));setSelected(null)}} style={{position:"absolute",top:-10,right:-10,width:20,height:20,borderRadius:"50%",background:"#e94560",border:"none",color:"#fff",cursor:"pointer",fontSize:11,fontWeight:700,zIndex:20}}>×</button>}
                </div>
              })}

              {/* Ruler */}
              {showRuler&&<div style={{position:"absolute",top:0,left:0,right:0,height:26,background:T.surface,borderBottom:`1px solid ${T.border}`,zIndex:15,opacity:.9}}>
                <svg width={794}height={26}style={{display:"block"}}>
                  {Array.from({length:80},(_,i)=>{const x=i*10;const big=i%10===0,med=i%5===0;return<g key={i}><line x1={x}y1={26}x2={x}y2={big?6:med?12:18}stroke={T.muted}strokeWidth={big?1:.5}/>{big&&<text x={x+2}y={9}fontSize={7}fill={T.muted}fontFamily="monospace">{i*(unitSys==="metric"?10:1)}{unitSys==="metric"?"mm":"\"" }</text>}</g>})}
                </svg>
              </div>}

              {/* Protractor */}
              {showProt&&<div style={{position:"absolute",top:40,right:40,zIndex:15,pointerEvents:"none"}}>
                <svg width={160}height={80}>
                  <path d="M 10,70 A 70,70 0 0 1 150,70" fill={T.surface+"cc"} stroke={T.accent} strokeWidth={1.5}/>
                  <line x1={80}y1={70}x2={80}y2={10}stroke={T.a2}strokeWidth={1}/>
                  {[0,15,30,45,60,75,90,105,120,135,150,165,180].map(a=>{const r=(180-a)*Math.PI/180;const x=80+70*Math.cos(r),y=70-70*Math.sin(r),ix=80+56*Math.cos(r),iy=70-56*Math.sin(r);return<g key={a}><line x1={ix}y1={iy}x2={x}y2={y}stroke={T.accent}strokeWidth={a%30===0?1.2:.5}/>{a%30===0&&<text x={x}y={y-3}fontSize={7}fill={T.muted}textAnchor="middle"fontFamily="monospace">{a}°</text>}</g>})}
                </svg>
              </div>}

              {/* Title block */}
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

              <DrawCanvas tool={tool} color={activeColor} size={sizePx} cRef={cRef} onStroke={onStroke} onPickColor={(c)=>setColor(c)}/>
            </div>
          </div>
        </div>

        {/* CALQUES */}
        {showLayers&&(
          <div style={{width:180,background:T.surface,borderLeft:`1px solid ${T.border}`,display:"flex",flexDirection:"column",flexShrink:0}}>
            <div style={{padding:"10px 12px 8px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,color:T.accent}}>Calques</div>
              <button onClick={()=>setLayers(p=>[...p,{id:Date.now(),n:`Calque ${p.length+1}`,v:true,locked:false}])} style={{background:"none",border:"none",cursor:"pointer",color:T.accent,fontSize:16,lineHeight:1}}>+</button>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:6,display:"flex",flexDirection:"column",gap:4}}>
              {layers.map((l,i)=>(
                <div key={l.id} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 8px",borderRadius:8,background:T.bg,border:`1px solid ${T.border}`}}>
                  <button onClick={()=>setLayers(p=>p.map((x,j)=>j===i?{...x,v:!x.v}:x))} style={{background:"none",border:"none",cursor:"pointer",color:l.v?T.accent:T.muted,fontSize:11,flexShrink:0}}>{l.v?"👁":"◻"}</button>
                  <div style={{flex:1,fontSize:10,color:T.ink,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.n}</div>
                  <button onClick={()=>setLayers(p=>p.map((x,j)=>j===i?{...x,locked:!x.locked}:x))} style={{background:"none",border:"none",cursor:"pointer",color:l.locked?T.accent:T.muted,fontSize:9,flexShrink:0}}>{l.locked?"🔒":"🔓"}</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BIBLIOTHÈQUE */}
        {showLib&&(
          <div style={{width:260,background:T.surface,borderLeft:`1px solid ${T.border}`,display:"flex",flexDirection:"column",flexShrink:0}}>
            <div style={{padding:"10px 12px 8px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,color:T.accent}}>Bibliothèque</div>
              <button onClick={()=>setShowLib(false)} style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:16}}>×</button>
            </div>

            {/* Metric / Imperial toggle */}
            <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
              <button onClick={()=>setLibMode("metric")} style={{flex:1,padding:"7px 0",border:"none",background:libMode==="metric"?`${T.accent}18`:T.bg,color:libMode==="metric"?T.accent:T.muted,cursor:"pointer",fontSize:11,fontWeight:libMode==="metric"?700:400,borderRight:`1px solid ${T.border}`}}>
                📏 Métrique (mm)
              </button>
              <button onClick={()=>setLibMode("imperial")} style={{flex:1,padding:"7px 0",border:"none",background:libMode==="imperial"?`${T.accent}18`:T.bg,color:libMode==="imperial"?T.accent:T.muted,cursor:"pointer",fontSize:11,fontWeight:libMode==="imperial"?700:400}}>
                📐 Impérial (in)
              </button>
            </div>

            <div style={{padding:"6px 8px",borderBottom:`1px solid ${T.border}`}}>
              <input value={libSearch} onChange={e=>setLibSearch(e.target.value)} placeholder="Chercher…"
                style={{width:"100%",padding:"5px 8px",borderRadius:7,border:`1px solid ${T.border}`,fontSize:11,outline:"none",background:T.bg,color:T.ink,boxSizing:"border-box"}}/>
            </div>

            {/* Category tabs */}
            <div style={{overflowX:"auto",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
              <div style={{display:"flex",gap:3,padding:"5px 6px",whiteSpace:"nowrap"}}>
                {libCats.map(c=>(
                  <button key={c} onClick={()=>setLibCat(c)} style={{padding:"3px 7px",borderRadius:12,border:`1px solid ${libCat===c?T.accent:T.border}`,background:libCat===c?`${T.accent}15`:T.bg,color:libCat===c?T.accent:T.muted,fontSize:9,cursor:"pointer",whiteSpace:"nowrap"}}>{c}</button>
                ))}
              </div>
            </div>

            {/* Placement mode toggle */}
            <div style={{padding:"5px 8px",borderBottom:`1px solid ${T.border}`,background:`${T.accent}05`,flexShrink:0}}>
              <div style={{fontSize:9,color:T.muted,textAlign:"center"}}>
                {libPending ? `📍 Clic sur la page pour placer "${libPending.l}"` : "Clic sur un élément → clic sur la page pour placer"}
              </div>
            </div>

            <div style={{flex:1,overflowY:"auto",padding:6,display:"flex",flexDirection:"column",gap:4}}>
              {libItems.map(el=>(
                <div key={el.id}
                  onClick={()=>setLibPending(el)}
                  draggable
                  onDragEnd={e=>{const r=document.getElementById("canvas-area")?.getBoundingClientRect();if(r){const x=(e.clientX-r.left)/zoom-20,y=(e.clientY-r.top)/zoom-20;setPlaced(p=>[...p,{id:Date.now(),el,x:Math.max(0,x),y:Math.max(0,y)}])}}}
                  style={{padding:"7px 9px",borderRadius:8,border:`1px solid ${libPending?.id===el.id?T.accent:T.border}`,background:libPending?.id===el.id?`${T.accent}10`:T.bg,cursor:"pointer",display:"flex",alignItems:"center",gap:8,transition:"all .12s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accent}}
                  onMouseLeave={e=>{if(libPending?.id!==el.id)e.currentTarget.style.borderColor=T.border}}>
                  <div style={{width:30,height:30,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>{renderEl(el,1/300)}</div>
                  <div>
                    <div style={{fontSize:10,fontWeight:700,color:T.ink,lineHeight:1.2}}>{el.l}</div>
                    <div style={{fontSize:8,color:T.muted,fontFamily:"monospace",marginTop:1}}>{el.w}×{el.h}mm</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM BAR */}
      <div style={{height:36,background:T.surface,borderTop:`1px solid ${T.border}`,display:"flex",alignItems:"center",padding:"0 14px",gap:12,zIndex:20}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{background:"none",border:"none",color:page===1?T.border:T.muted,cursor:page===1?"default":"pointer",fontSize:13}}>‹</button>
          <span style={{fontSize:10,color:T.muted,fontFamily:"monospace"}}>{page.toString().padStart(2,"0")} / {(nb.pages_count||1).toString().padStart(2,"0")}</span>
          <button onClick={()=>setPage(p=>p+1)} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:13}}>›</button>
        </div>
        <div style={{width:1,height:14,background:T.border}}/>
        <div style={{fontSize:9,color:T.muted,fontFamily:"monospace"}}>{tool.toUpperCase()} · {sizeMm}mm · {scale} · {Math.round(zoom*100)}%</div>
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:4}}>
          <div style={{width:5,height:5,borderRadius:"50%",background:saveStatus==="saved"?"#4ade80":saveStatus==="saving"?"#f5a623":"#4ade80"}}/>
          <span style={{fontSize:9,color:T.muted}}>{saveStatus==="saving"?"Sauvegarde...":saveStatus==="saved"?"Sauvegardé ✓":"Auto-sauvegarde"}</span>
        </div>
      </div>
    </div>
  )
}
