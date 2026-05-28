import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { useNavigate, useParams } from "react-router-dom"
import useAppStore from "@/stores/useAppStore"
import { supabase } from "@/lib/supabase"
import { THEMES } from "@/lib/themes"
import FloatingSelectionToolbar from "@/components/FloatingSelectionToolbar"
import CanvasTextEditor from "@/components/CanvasTextEditor"
import TextFontPicker from "@/components/TextFontPicker"
import ShapeTransformHandles from "@/components/ShapeTransformHandles"
import { drawShapeStroke, shapeStylePayload, getShapeBounds, isTransformableShape, resizeShapeBox, SHAPE_TYPES } from "@/lib/shapeStroke"
import { canvasFontCss, ensureCanvasTextFontsLoaded, preloadCanvasFont } from "@/lib/fontUtils"
import { glassStyle } from "@/theme/glass"
import { TOKENS } from "@/theme/tokens"
import { getToolCursor, getPlacementCursor, isDarkSurface } from "@/theme/cursors"
import { normalizeCanvasData, serializeCanvasData, DEFAULT_LAYERS, defaultActiveLayerId, createLayer, reorderLayers, deleteLayer } from "@/lib/layers"
import { collectSnapLines, snapDelta, snapPoint, drawSnapGuides } from "@/lib/snap"
import { shouldShowMinimap } from "@/lib/minimap"
import CanvasMinimap from "@/components/CanvasMinimap"
import FocusToolbar from "@/components/FocusToolbar"
import { EDITOR_TOOLS_LIST } from "@/components/FloatingToolsToolbar"
import BottomSheet from "@/components/ui/BottomSheet"
import {
  ChevronLeft, Pen, Highlighter, Eraser, Type, Lasso, MousePointer2, Undo2, Redo2,
  Presentation, Lock, Share2, MoreHorizontal, Minus, Square, Circle, ArrowRight,
  MessageSquare, Ruler, Pipette, BookOpen, PanelRight, PanelLeft, ChevronRight, Plus, ZoomIn,
  ZoomOut, Maximize2, Move, Copy, Clipboard, Layers, Trash2, X, Monitor, Hand,
  Search, Sparkles, SlidersHorizontal, ChevronDown, Grid3x3, List, LayoutList,
} from "lucide-react"
import { CANVAS_TEXT_FONTS } from "@/lib/fontUtils"
import { useTabletLayout } from "@/hooks/useTabletLayout"
import { useSwipeToolCycle, flattenEditorTools } from "@/hooks/useSwipeToolCycle"
import HistoryPanel from "@/components/HistoryPanel"
import { buildActionEntry } from "@/lib/actionHistory"
import PageContextMenu from "@/components/PageContextMenu"
import PagePhotoInsertModal from "@/components/PagePhotoInsertModal"
import CalculatorDrawer from "@/components/CalculatorDrawer"
import ShareModal from "@/components/ShareModal"
import UnitConverter from "@/components/UnitConverter"
import TranslationWidget from "@/components/translation/TranslationWidget"
import DictationWidget from "@/components/DictationWidget"
import { useCalculator, calcDrawerWidth } from "@/hooks/useCalculator"
import { useAuth } from "@/hooks/useAuth"
import { useCollaboration } from "@/hooks/useCollaboration"
import DraggablePanel from "@/components/DraggablePanel"
import { useAutoSave } from "@/hooks/useAutoSave"
import { useNotebookCollab } from "@/hooks/useNotebookCollab"
import { resolveInsertPageNumber, shiftLocalPagesForInsert, shiftSupabasePagesForInsert } from "@/lib/pages/insert"
import {
  isLocalNotebookId,
  getLocalNotebook,
  loadLocalPages,
  saveLocalPages,
  saveLocalPage,
  upsertLocalNotebook,
} from "@/lib/projectPersistence"
import BrandLogo, { ThemePreviewThumb } from "@/components/BrandLogo"
import { useTheme } from "@/hooks/useAppearance"
import { loadFavorites, saveFavorites, FAVORITE_SLOTS, favoriteFromEditor } from "@/lib/favorites"
import { loadEraserSettings, saveEraserSettings, ERASER_MODES } from "@/lib/eraserSettings"
import { selectObjectsInRect, selectObjectsInPolygon, hitTestObjects } from "@/lib/canvasHitTest"
import { getPlacedSize, getPlacedLocalBounds, resizePlacedItem, getImportedImageLocalBounds, resizeImportedImage } from "@/lib/placedElements"
import { renderSpreadsheetPlaced, SpreadsheetPlacedStatic } from "@/components/spreadsheet/SpreadsheetPlacedView"
import { DocPlacedStatic } from "@/components/docs/DocPlacedView"
import {
  euProfilesAsLibItems,
  customProfileToLibEntry,
  renderWlsSvg,
} from "@/lib/structuralProfiles"
import CustomProfileForm from "@/components/CustomProfileForm"
import { screenToPage, pageToScreen } from "@/lib/viewport"
import { useCanvasViewport } from "@/hooks/useCanvasViewport"
import { resolvePageDimensions, formatLabel } from "@/lib/pageFormats"
import PageFormatPicker from "@/components/PageFormatPicker"
import RulerSvg from "@/components/RulerSvg"
import { computeRotatedBounds } from "@/lib/pageRotation"
import {
  parsePageElements,
  serializePageElements,
  defaultGridStyle,
  defaultPageMeta,
  GRID_STYLES,
  PAGE_COLORS,
  GRID_COLORS,
  pageDisplayName,
} from "@/lib/pageSettings"

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
const C = {
  bg: '#000000', bar: '#1C1C1E', panel: '#2C2C2E', border: '#38383A', border2: '#3A3A3C',
  text: '#FFFFFF', muted: '#8E8E93', accent: '#0A84FF', success: '#30D158', danger: '#FF453A',
  icon: '#EBEBF5', warning: '#FFD60A',
}
const COLORS = {
  bg: C.bg, toolbar: C.bar, toolbarBorder: C.border, panelBg: C.panel, panelBorder: C.border2,
  text: C.text, textSecondary: C.muted, accent: C.accent, accentActive: C.accent,
  destructive: C.danger, warning: C.warning, separator: C.border, success: C.success,
}
const TOP_BAR_H = 52
const BOTTOM_BAR_H = 44
const TOP_TOOL_GROUPS = [
  [{ id: 'arrow', Icon: MousePointer2, label: 'Sélection', key: 'V' }, { id: 'lasso', Icon: Lasso, label: 'Lasso', key: 'L', popup: true }],
  [{ id: 'pen', Icon: Pen, label: 'Stylo', key: 'P', popup: true }, { id: 'highlight', Icon: Highlighter, label: 'Surligneur', key: 'H', popup: true }, { id: 'eraser', Icon: Eraser, label: 'Gomme', key: 'E', popup: true }, { id: 'text', Icon: Type, label: 'Texte', key: 'T', popup: true }],
  [{ id: 'line', Icon: Minus, label: 'Ligne', key: '1' }, { id: 'rect', Icon: Square, label: 'Rectangle', key: '2' }, { id: 'circle', Icon: Circle, label: 'Cercle', key: '3' }, { id: 'shape-arrow', Icon: ArrowRight, label: 'Flèche', key: 'A' }],
  [{ id: 'dimline', Icon: Ruler, label: 'Cotation', key: 'D' }, { id: 'cloud', Icon: MessageSquare, label: 'Bulle', key: 'C' }],
]
const BRUSHES = [
  { id: 'fine', label: 'Fin', mm: 0.18, icon: '•' },
  { id: 'medium', label: 'Moyen', mm: 0.5, icon: '●' },
  { id: 'bold', label: 'Épais', mm: 1.0, icon: '⬤' },
  { id: 'marker', label: 'Marker', mm: 2.0, icon: '▮' },
]
const GN_T = {
  accent: COLORS.accent, border: COLORS.panelBorder, bg: COLORS.panelBg,
  ink: COLORS.text, muted: COLORS.textSecondary, surface: COLORS.toolbar,
}
const TOOL_ICON_MAP = {
  hand: Hand, arrow: MousePointer2, pen: Pen, highlight: Highlighter, eraser: Eraser,
  line: Minus, rect: Square, circle: Circle, 'shape-arrow': ArrowRight,
  dimline: Ruler, cloud: MessageSquare, lasso: Lasso, 'lasso-rect': Lasso,
  text: Type, eyedropper: Pipette,
}
const SIZES_MM=[0.05,0.1,0.18,0.25,0.35,0.5,0.7,1.0,1.4,2.0,3.0,5.0,7.0,10.0]
const ERASER_SIZES_MM=[0.5,1.0,2.0,3.0,5.0,8.0,12.0,20.0,30.0]
const mm2px=mm=>mm*3.78

function formatDimension(mm, unitSystem) {
  if (unitSystem === 'imperial') {
    const totalIn = mm / 25.4
    const snap = (v, den = 16) => Math.round(v * den) / den
    const fmtIn = (inch) => {
      const s = snap(inch, 16)
      const whole = Math.floor(s + 1e-9)
      const frac = s - whole
      if (frac < 1e-9) return `${whole}`
      const den = 16
      let num = Math.round(frac * den)
      let w = whole
      if (num === den) { w += 1; num = 0 }
      if (num === 0) return `${w}`
      // reduce fraction
      const gcd = (a,b)=>b?gcd(b,a%b):a
      const g = gcd(num, den)
      num /= g
      const rden = den / g
      return w > 0 ? `${w} ${num}/${rden}` : `${num}/${rden}`
    }

    if (totalIn >= 12) {
      const feet = Math.floor(totalIn / 12)
      const remIn = totalIn - feet * 12
      const remTxt = fmtIn(remIn)
      // If remainder snaps to 0, only show feet
      if (remTxt === '0') return `${feet}'`
      return `${feet}' - ${remTxt}"`
    }
    return `${fmtIn(totalIn)}"`
  }
  if (mm >= 1000) return `${Math.round(mm / 10) / 100}m`
  if (mm >= 10) return `${Math.round(mm) / 10}cm`
  return `${mm}mm`
}

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

function renderSym(el,sc=1/50,sx=1,sy=1){
  const px=sc*3.78,W=Math.max(el.w*px*sx,4),H=Math.max(el.h*px*sy,4)
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

/* ══ RENDER ════════════════════════════════════════════ */
function renderEl(el,sc=1/50,sx=1,sy=1){
  const px=sc*3.78,W=Math.max((el.fw||el.w)*px*sx,4),H=Math.max(el.h*px*sy,4),t=(el.t||6)*px*Math.min(sx,sy)
  if(["wood","glulam","clt"].includes(el.type)){const c=el.type==="wood"?"#c8a96a":el.type==="glulam"?"#b8904a":"#d4b896";return<svg width={W}height={H}style={{display:"block"}}><rect width={W}height={H}fill={c}stroke="#8B6914"strokeWidth={.8}/>{[.25,.5,.75].map(r=><line key={r}x1={W*r}y1={0}x2={W*r}y2={H}stroke="#a07820"strokeWidth={.4}strokeDasharray="3,4"/>)}</svg>}
  if(el.type==="hss")return<svg width={W}height={H}style={{display:"block"}}><rect width={W}height={H}fill="#607d8b"stroke="#37474f"strokeWidth={1}/><rect x={t}y={t}width={Math.max(W-2*t,1)}height={Math.max(H-2*t,1)}fill="white"stroke="#546e7a"strokeWidth={.5}/></svg>
  if(el.type==="Ibeam"){const fw=(el.fw||el.w)*px*sx,ft2=(el.ft||5)*px*sy,wt2=(el.wt||4)*px*Math.min(sx,sy);return<svg width={fw}height={H}style={{display:"block"}}><rect x={0}y={0}width={fw}height={ft2}fill="#546e7a"stroke="#37474f"strokeWidth={.8}/><rect x={(fw-wt2)/2}y={ft2}width={wt2}height={Math.max(H-2*ft2,1)}fill="#607d8b"stroke="#37474f"strokeWidth={.8}/><rect x={0}y={H-ft2}width={fw}height={ft2}fill="#546e7a"stroke="#37474f"strokeWidth={.8}/></svg>}
  if(el.type==="wls")return renderWlsSvg(el,px,sx,sy)
  if(el.type==="channel"){const fw=(el.fw||el.w)*px*sx,ft2=(el.ft||5)*px*sy,wt2=(el.wt||4)*px*Math.min(sx,sy);return<svg width={fw}height={H}style={{display:"block"}}><rect x={0}y={0}width={fw}height={ft2}fill="#546e7a"stroke="#37474f"strokeWidth={.8}/><rect x={0}y={ft2}width={wt2}height={H-2*ft2}fill="#607d8b"stroke="#37474f"strokeWidth={.8}/><rect x={0}y={H-ft2}width={fw}height={ft2}fill="#546e7a"stroke="#37474f"strokeWidth={.8}/></svg>}
  if(el.type==="angle"){const t2=t*.8;return<svg width={W}height={H}style={{display:"block"}}><polygon points={`0,0 ${t2},0 ${t2},${H-t2} ${W},${H-t2} ${W},${H} 0,${H}`}fill="#607d8b"stroke="#37474f"strokeWidth={.8}/></svg>}
  if(["conc","concB"].includes(el.type))return<svg width={W}height={H}style={{display:"block"}}><rect width={W}height={H}fill="#c0c0c0"stroke="#888"strokeWidth={1}/><line x1={0}y1={0}x2={W}y2={H}stroke="#aaa"strokeWidth={.6}/><line x1={W}y1={0}x2={0}y2={H}stroke="#aaa"strokeWidth={.6}/></svg>
  if(el.type==="concR")return<svg width={W}height={H}style={{display:"block"}}><circle cx={W/2}cy={H/2}r={Math.min(W,H)/2-1}fill="#c0c0c0"stroke="#888"strokeWidth={1}/></svg>
  if(el.type==="ftg")return<svg width={W}height={H}style={{display:"block"}}><rect width={W}height={H}fill="#d0d0d0"stroke="#666"strokeWidth={1}strokeDasharray="3,3"/></svg>
  if(el.type==="door")return<svg width={W}height={H}style={{display:"block"}}><rect width={W}height={H}fill="rgba(200,160,80,.12)"stroke="#8b6f47"strokeWidth={1.5}/><path d={`M ${W*.05},${H*.97} A ${W*.9},${H*.9} 0 0 1 ${W*.95},${H*.97}`}fill="none"stroke="#8b6f47"strokeWidth={.8}strokeDasharray="3,2"/></svg>
  if(el.type==="doorD")return<svg width={W}height={H}style={{display:"block"}}><rect width={W}height={H}fill="rgba(200,160,80,.12)"stroke="#8b6f47"strokeWidth={1.5}/><line x1={W/2}y1={0}x2={W/2}y2={H}stroke="#8b6f47"strokeWidth={.8}/></svg>
  if(el.type==="win")return<svg width={W}height={H}style={{display:"block"}}><rect width={W}height={H}fill="rgba(122,181,212,.25)"stroke="#4a90b8"strokeWidth={1.5}/><line x1={W/2}y1={0}x2={W/2}y2={H}stroke="#4a90b8"strokeWidth={.8}/><line x1={0}y1={H/2}x2={W}y2={H/2}stroke="#4a90b8"strokeWidth={.8}/></svg>
  if(el.type==="spreadsheet")return<SpreadsheetPlacedStatic el={el} sx={sx} sy={sy}/>
  if(el.type==="document")return<DocPlacedStatic el={el} sx={sx} sy={sy}/>
  if(el.type==="proforma"&&el.imageSrc)return<img src={el.imageSrc} alt={el.l||"Image"} style={{width:W,height:H,objectFit:"contain",display:"block"}}/>
  if(el.type==="drawn"&&el.sketchUrl)return<img src={el.sketchUrl} alt={el.l||"Profil"} style={{width:W,height:H,objectFit:"contain",display:"block"}}/>
  return<div style={{width:W,height:H,background:"#ccc",border:"1px solid #999",fontSize:8,overflow:"hidden"}}>{el.l}</div>
}

/* ══ PAPER ════════════════════════════════════════════ */
function Paper({gridStyle,tmpl,T,pageColor,gridColor,PW=794,PH=1123}){
  const effective=gridStyle??tmpl??"grid10"
  const W=PW,H=PH,L=[]
  let bg=pageColor||T.paper,gc=gridColor||T.grid,pl=gridColor||T.pline
  const grid=(gap,col,sw)=>{for(let x=0;x<=W;x+=gap)L.push(<line key={`v${x}${sw}`}x1={x}y1={0}x2={x}y2={H}stroke={col}strokeWidth={sw}/>);for(let y=0;y<=H;y+=gap)L.push(<line key={`h${y}${sw}`}x1={0}y1={y}x2={W}y2={y}stroke={col}strokeWidth={sw}/>)}
  if(effective==="blueprint"){
    bg=pageColor||"#dceefb"
    gc=gridColor||"rgba(0,80,160,.25)"
    pl=gridColor||"rgba(0,80,160,.45)"
    grid(37.8,gc,.5);grid(189,pl,.9)
  }else if(effective==="sketch"){
    bg=pageColor||"#faf6ef"
    gc=gridColor||"rgba(60,50,40,.07)"
    const step=22
    for(let i=-H;i<W+H;i+=step){
      L.push(<line key={`ska${i}`}x1={i}y1={0}x2={i+H*.55}y2={H}stroke={gc}strokeWidth={.35}/>)
      L.push(<line key={`skb${i}`}x1={i}y1={H}x2={i+H*.55}y2={0}stroke={gc}strokeWidth={.35}/>)
    }
    grid(37.8,gc,.35)
  }else if(effective==="grid5"){grid(18.9,gc,.5);grid(94.5,pl,.9)}
  else if(effective==="grid10"){grid(37.8,gc,.5);grid(189,pl,.9)}
  else if(effective==="math"){grid(28.35,gc,.5);grid(141.75,pl,.9)}
  else if(effective==="dotted"){for(let x=26;x<W;x+=26)for(let y=26;y<H;y+=26)L.push(<circle key={`d${x}${y}`}cx={x}cy={y}r={1}fill={gc}opacity={.5}/>)}
  else if(effective==="lined"){for(let y=72;y<H;y+=28)L.push(<line key={`l${y}`}x1={52}y1={y}x2={W-52}y2={y}stroke={gc}strokeWidth={.9}/>);L.push(<line key="lm"x1={90}y1={0}x2={90}y2={H}stroke="rgba(200,80,80,.15)"strokeWidth={1}/>)}
  else if(effective==="cornell"){for(let y=80;y<H-100;y+=28)L.push(<line key={`cl${y}`}x1={200}y1={y}x2={W-48}y2={y}stroke={gc}strokeWidth={.9}/>);L.push(<line key="cv"x1={190}y1={70}x2={190}y2={H-100}stroke="rgba(200,80,80,.2)"strokeWidth={1}/>);L.push(<line key="ch"x1={40}y1={H-100}x2={W-40}y2={H-100}stroke="rgba(200,80,80,.2)"strokeWidth={1}/>)}
  else if(effective==="isometric"){const s=37.8;for(let i=-H;i<W+H;i+=s){L.push(<line key={`a${i}`}x1={i}y1={0}x2={i+H}y2={H}stroke={gc}strokeWidth={.5}/>);L.push(<line key={`b${i}`}x1={i}y1={0}x2={i-H}y2={H}stroke={gc}strokeWidth={.5}/>)}}
  else if(["plan","elevation","section","detail"].includes(effective)){grid(37.8,gc,.5);grid(189,pl,.9);L.push(<rect key="tb"x={20}y={H-92}width={W-40}height={82}fill="none"stroke={pl}strokeWidth={1}/>);L.push(<rect key="b1"x={12}y={12}width={W-24}height={H-24}fill="none"stroke={pl}strokeWidth={1.5}/>)}
  else if(effective==="music"){for(let y=80;y<H-60;y+=70)for(let s=0;s<5;s++)L.push(<line key={`ms${y}${s}`}x1={40}y1={y+s*9}x2={W-40}y2={y+s*9}stroke={gc}strokeWidth={.9}/>)}
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

function smoothStrokePoints(pts, amount = 0.32) {
  if (!pts?.length || pts.length < 3 || amount <= 0) return pts
  const dedup = [pts[0]]
  for (let i = 1; i < pts.length; i += 1) {
    const p = pts[i]
    const last = dedup[dedup.length - 1]
    if (Math.hypot(p.x - last.x, p.y - last.y) > 1.2) dedup.push(p)
  }
  if (dedup.length < 3) return dedup
  const sm = [dedup[0]]
  for (let i = 1; i < dedup.length; i += 1) {
    const prev = sm[sm.length - 1]
    const cur = dedup[i]
    sm.push({
      x: prev.x + (cur.x - prev.x) * (1 - amount),
      y: prev.y + (cur.y - prev.y) * (1 - amount),
      p: cur.p,
    })
  }
  return sm
}

/* ══ CANVAS — Smart shape detection (GoodNotes-style) ══ */
function DrawCanvas({tool,color,size,eraserSize,cRef,onStroke,onPickColor,pencilOnly,unitSys,onEraseAt,onSelectionChange,cursorDark,layers,activeLayerId,onAction,eraserMode,onLassoComplete,onEraseZone,pageW=794,pageH=1123,shapeStyle,onTextEditRequest,canvasTextFont,canvasZIndex=5}){
  const drawing=useRef(false)
  const strokes=useRef([])   // committed strokes
  const history=useRef([])   // for multi-level undo (copy of strokes at each commit)
  const redoStack=useRef([])
  const cur=useRef([])
  const shape=useRef(null)
  const holdTimer=useRef(null) // for shape auto-correct on hold
  const lassoPath=useRef(null)
  const selBox=useRef(null)
  const selectedStrokes=useRef(new Set())
  const lassoRect=useRef(null)
  const groupDrag=useRef(null)
  const snapGuides=useRef([])
  const eraseCooldown=useRef({t:0})
  const onSelRef=useRef(onSelectionChange)
  onSelRef.current=onSelectionChange
  const onActionRef=useRef(onAction)
  onActionRef.current=onAction
  const logAction=(type,payload={})=>onActionRef.current?.({type,...payload})
  const layersRef=useRef(layers||[])
  const activeLayerRef=useRef(activeLayerId)
  useEffect(()=>{layersRef.current=layers||[]},[layers])
  useEffect(()=>{activeLayerRef.current=activeLayerId},[activeLayerId])

  const getLayerMap=()=>{
    const m={}
    ;(layersRef.current||[]).forEach(l=>{m[l.id]=l})
    return m
  }

  const fallbackLayerId=()=>layersRef.current?.[0]?.id||"base"

  const canUseActiveLayer=()=>{
    const l=getLayerMap()[activeLayerRef.current]
    return !!(l&&l.v&&!l.locked)
  }

  const strokeLayerId=s=>s.layerId||fallbackLayerId()

  const pushStroke=stroke=>{
    strokes.current.push({...stroke,layerId:activeLayerRef.current||fallbackLayerId()})
  }

  const drawSingleStroke=(ctx,s,layerOp)=>{
    const st=s.shapeType||s.tool
    if(st==="text"||SHAPE_TYPES.has(st)||["line","rect","circle","arrow","cloud","dimline"].includes(st)){
      drawShapeStroke(ctx,s,layerOp,unitSys,formatDimension)
      return
    }
    if(!s.pts||s.pts.length<2)return
    ctx.beginPath();ctx.strokeStyle=s.color;ctx.lineWidth=s.size
    ctx.lineCap="round";ctx.lineJoin="round"
    const baseOp=(s.opacity??1)*layerOp
    ctx.globalAlpha=s.tool==="highlight"?Math.min(baseOp,.4):baseOp
    ctx.globalCompositeOperation=s.tool==="eraser"?"destination-out":"source-over"
    ctx.moveTo(s.pts[0].x,s.pts[0].y);s.pts.forEach(p=>ctx.lineTo(p.x,p.y));ctx.stroke()
    ctx.globalCompositeOperation="source-over";ctx.globalAlpha=1
  }

  const getSelectionBounds=()=>{
    let x1=Infinity,y1=Infinity,x2=-Infinity,y2=-Infinity,found=false
    selectedStrokes.current.forEach(i=>{
      const s=strokes.current[i]
      if(!s?.pts?.length)return
      found=true
      s.pts.forEach(pt=>{x1=Math.min(x1,pt.x);y1=Math.min(y1,pt.y);x2=Math.max(x2,pt.x);y2=Math.max(y2,pt.y)})
    })
    if(!found)return null
    return {x1,y1,x2,y2,cx:(x1+x2)/2,cy:(y1+y2)/2}
  }

  const pointInExpandedBounds=(p,b,pad=0)=>p.x>=b.x1-pad&&p.x<=b.x2+pad&&p.y>=b.y1-pad&&p.y<=b.y2+pad

  const [selectionActive,setSelectionActive]=useState(false)

  const notifySelection=useCallback(()=>{
    const active=selectedStrokes.current.size>0
    setSelectionActive(active)
    if(!onSelRef.current)return
    const indices=[...selectedStrokes.current]
    const primary=indices.length===1?strokes.current[indices[0]]:null
    const b=getSelectionBounds()
    const shapeBounds=primary&&isTransformableShape(primary)?getShapeBounds(primary):null
    if(!active||!b)onSelRef.current({active:false,count:0,bounds:null,indices:[],shapeBounds:null,rotation:0,primaryIndex:null})
    else onSelRef.current({active:true,count:selectedStrokes.current.size,bounds:b,indices,primaryIndex:indices.length===1?indices[0]:null,shapeBounds,rotation:primary?.rotation||0,primaryShapeType:primary?.shapeType||primary?.tool||null})
  },[])

  const tryStartGroupDrag=(p,e)=>{
    if(selectedStrokes.current.size===0||["eraser","eyedropper","text"].includes(tool))return false
    const b=getSelectionBounds()
    if(!b||!pointInExpandedBounds(p,b,12))return false
    groupDrag.current={
      startP:p,
      origBounds:getSelectionBounds(),
      snapshots:[...selectedStrokes.current].map(i=>({i,pts:strokes.current[i].pts.map(pt=>({...pt}))})),
      origLasso:lassoPath.current?lassoPath.current.map(pt=>({...pt})):null,
      origRect:lassoRect.current?{...lassoRect.current}:null,
    }
    snapGuides.current=[]
    drawing.current=true
    e?.preventDefault?.()
    return true
  }

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
    const ctx=c.getContext("2d");ctx.clearRect(0,0,pageW,pageH)
    const layerMap=getLayerMap()
    ;(layersRef.current||[]).forEach(layer=>{
      if(!layer.v)return
      const layerOp=layer.opacity??1
      strokes.current.forEach(s=>{
        if(strokeLayerId(s)!==layer.id)return
        drawSingleStroke(ctx,s,layerOp)
      })
    })
    // Lasso selection overlay
    if(lassoPath.current&&lassoPath.current.length>2){
      ctx.save();ctx.strokeStyle=C.accent;ctx.lineWidth=1.5;ctx.setLineDash([5,5]);ctx.globalAlpha=1;ctx.globalCompositeOperation="source-over"
      ctx.beginPath();ctx.moveTo(lassoPath.current[0].x,lassoPath.current[0].y)
      lassoPath.current.forEach(p=>ctx.lineTo(p.x,p.y));ctx.closePath();ctx.stroke()
      ctx.restore()
    }
    // Lasso-rect overlay
    if(lassoRect.current){
      const lr=lassoRect.current
      ctx.save();ctx.strokeStyle=C.accent;ctx.lineWidth=1.5;ctx.setLineDash([5,5]);ctx.globalAlpha=1;ctx.globalCompositeOperation="source-over"
      ctx.strokeRect(lr.x1,lr.y1,lr.x2-lr.x1,lr.y2-lr.y1)
      ctx.restore()
    }
    // Selected strokes highlight
    selectedStrokes.current.forEach(idx=>{
      const s=strokes.current[idx]
      if(!s?.pts||s.pts.length<2)return
      const lm=getLayerMap()[strokeLayerId(s)]
      if(!lm?.v)return
      ctx.save()
      ctx.strokeStyle=C.accent
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
    drawSnapGuides(ctx,snapGuides.current)
    ctx.globalCompositeOperation="source-over";ctx.globalAlpha=1
  },[cRef,unitSys,pageW,pageH])

  useEffect(()=>{redraw()},[layers,activeLayerId,redraw])

  const gP=e=>{
    const r=cRef.current.getBoundingClientRect()
    const src=e.touches?e.touches[0]:e
    return{x:(src.clientX-r.left)*(pageW/r.width),y:(src.clientY-r.top)*(pageH/r.height)}
  }

  const distPointToSegment=(p,a,b)=>{
    const vx=b.x-a.x,vy=b.y-a.y
    const wx=p.x-a.x,wy=p.y-a.y
    const c1=vx*wx+vy*wy
    if(c1<=0)return Math.hypot(p.x-a.x,p.y-a.y)
    const c2=vx*vx+vy*vy
    if(c2<=c1)return Math.hypot(p.x-b.x,p.y-b.y)
    const t=c1/c2
    const px=a.x+t*vx,py=a.y+t*vy
    return Math.hypot(p.x-px,p.y-py)
  }

  const rectDistance=(p,rx,ry,rw,rh)=>{
    const cx=Math.max(rx,Math.min(p.x,rx+rw))
    const cy=Math.max(ry,Math.min(p.y,ry+rh))
    return Math.hypot(p.x-cx,p.y-cy)
  }

  const bboxOfStroke=(s)=>{
    if(!s?.pts?.length)return null
    const xs=s.pts.map(p=>p.x),ys=s.pts.map(p=>p.y)
    const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys)
    return {x:minX,y:minY,w:maxX-minX,h:maxY-minY}
  }

  const hitStroke=(s,p,r)=>{
    if(!s?.pts?.length)return false
    const pad=Math.max(r,(s.size||1)/2)+2
    const bb=bboxOfStroke(s)
    if(bb){
      if(p.x < bb.x-pad || p.x > bb.x+bb.w+pad || p.y < bb.y-pad || p.y > bb.y+bb.h+pad) return false
    }
    const st=s.shapeType || s.tool
    if(st==="rect"){
      const a=s.pts[0],b=s.pts[1]
      const rx=Math.min(a.x,b.x),ry=Math.min(a.y,b.y),rw=Math.abs(b.x-a.x),rh=Math.abs(b.y-a.y)
      return rectDistance(p,rx,ry,rw,rh) <= pad
    }
    if(st==="circle"){
      const a=s.pts[0],b=s.pts[1]
      const cx=(a.x+b.x)/2,cy=(a.y+b.y)/2
      const rx=Math.abs(b.x-a.x)/2,ry=Math.abs(b.y-a.y)/2
      if(rx<1||ry<1)return false
      // distance to ellipse border approx via normalized radius
      const nx=(p.x-cx)/rx,ny=(p.y-cy)/ry
      const d=Math.abs(Math.hypot(nx,ny)-1) * Math.max(rx,ry)
      return d <= pad
    }
    if(st==="line"||st==="dimline"||st==="arrow"){
      const a=s.pts[0],b=s.pts[1]||s.pts[s.pts.length-1]
      return distPointToSegment(p,a,b) <= pad
    }
    if(st==="text"){
      // Approx bbox for canvas text
      const x=s.pts[0]?.x||0,y=s.pts[0]?.y||0
      const h=Math.max((s.size||4)*3,14)
      const w=Math.max(((s.text||"").length||1)*h*0.55, h)
      return rectDistance(p,x,y-h,w,h*1.2) <= pad
    }
    if(st==="cloud"){
      const a=s.pts[0],b=s.pts[1]
      const rx=Math.min(a.x,b.x),ry=Math.min(a.y,b.y),rw=Math.abs(b.x-a.x),rh=Math.abs(b.y-a.y)
      return rectDistance(p,rx,ry,rw,rh) <= pad
    }
    // Freehand polyline
    const pts=s.pts
    for(let i=1;i<pts.length;i++){
      if(distPointToSegment(p,pts[i-1],pts[i]) <= pad) return true
    }
    return false
  }

  const eraseStrokesAt=(p,r)=>{
    if(!strokes.current.length||!canUseActiveLayer()) return false
    const activeId=activeLayerRef.current
    const hit = new Set()
    strokes.current.forEach((s,i)=>{ if(strokeLayerId(s)===activeId&&hitStroke(s,p,r)) hit.add(i) })
    if(hit.size===0) return false
    history.current.push(JSON.stringify(strokes.current))
    if(history.current.length>50)history.current.shift()
    strokes.current = strokes.current.filter((_,i)=>!hit.has(i))
    // cleanup selection
    if(selectedStrokes.current.size){
      const nextSel=new Set()
      let j=0
      strokes.current.forEach((_,i)=>{ if(selectedStrokes.current.has(i)) nextSel.add(j); j++ })
      selectedStrokes.current = nextSel
    }
    redraw()
    if(onStroke)onStroke(strokes.current)
    logAction("erase_strokes",{count:hit.size})
    return true
  }

  const pointInPoly=(p,poly)=>{
    let inside=false
    for(let i=0,j=poly.length-1;i<poly.length;j=i++){
      const xi=poly[i].x,yi=poly[i].y,xj=poly[j].x,yj=poly[j].y
      if((yi>p.y)!==(yj>p.y)&&p.x<((xj-xi)*(p.y-yi))/(yj-yi+1e-9)+xi)inside=!inside
    }
    return inside
  }

  const strokeInPolygon=(s,poly)=>{
    if(!s?.pts?.length)return false
    return s.pts.some(pt=>pointInPoly(pt,poly))
  }

  const trimStrokesInPolygon=(poly)=>{
    if(!strokes.current.length||!canUseActiveLayer()||!poly?.length||poly.length<3)return 0
    const activeId=activeLayerRef.current
    const next=[]
    let changed=0
    strokes.current.forEach(s=>{
      if(strokeLayerId(s)!==activeId){next.push(s);return}
      const st=s.shapeType||s.tool
      if(st&&st!=="pen"&&st!=="highlight"&&st!=="eraser"){
        if(strokeInPolygon(s,poly)){changed++;return}
        next.push(s);return
      }
      if(!s.pts?.length){next.push(s);return}
      const runs=[]
      let run=[]
      s.pts.forEach(pt=>{
        if(!pointInPoly(pt,poly))run.push(pt)
        else if(run.length>=2){runs.push([...run]);run=[]}
        else run=[]
      })
      if(run.length>=2)runs.push(run)
      if(runs.length===0){changed++;return}
      if(runs.length===1&&runs[0].length===s.pts.length){next.push(s);return}
      runs.forEach(pts=>{if(pts.length>=2)next.push({...s,pts})})
      changed++
    })
    if(!changed)return 0
    history.current.push(JSON.stringify(strokes.current))
    if(history.current.length>50)history.current.shift()
    strokes.current=next
    selectedStrokes.current.clear()
    redraw()
    if(onStroke)onStroke(strokes.current)
    logAction("erase_strokes",{count:changed})
    return changed
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
    const isClosed=closeness<Math.max(W2,H2)*.35
    if(isClosed){
      const aspect=W2/Math.max(H2,1)
      if(aspect>.6&&aspect<1.6&&Math.abs(perimeter-Math.PI*Math.max(W2,H2))<perimeter*.45){
        return{type:"circle",pts:[{x:minX,y:minY},{x:maxX,y:maxY}]}
      }
      if(aspect>.8&&aspect<1.25){
        const side=Math.max(W2,H2)
        const cx=(minX+maxX)/2,cy=(minY+maxY)/2
        return{type:"rect",pts:[{x:cx-side/2,y:cy-side/2},{x:cx+side/2,y:cy+side/2}]}
      }
      return{type:"rect",pts:[{x:minX,y:minY},{x:maxX,y:maxY}]}
    }
    const lineLen=Math.sqrt((end.x-start.x)**2+(end.y-start.y)**2)
    if(lineLen>8&&perimeter/lineLen<1.35){
      if(Math.abs(end.x-start.x)>Math.abs(end.y-start.y)*2&&lineLen>20){
        return{type:"arrow",pts:[start,end]}
      }
      return{type:"line",pts:[start,end]}
    }
    return null
  }

  const dn=e=>{
    if(pencilOnly&&e.pointerType==="touch")return
    if(pencilOnly&&e.pointerType==="pen"&&tool==="hand")return
    if(tool==="arrow"||tool==="select")return
    const p=gP(e)
    if(tool==="eyedropper"){
      const ctx=cRef.current.getContext("2d")
      const px2=ctx.getImageData(Math.round(Math.max(0,Math.min(p.x,pageW-1))),Math.round(Math.max(0,Math.min(p.y,pageH-1))),1,1).data
      if(px2[3]>0&&onPickColor)onPickColor(`#${[px2[0],px2[1],px2[2]].map(v=>v.toString(16).padStart(2,"0")).join("")}`)
      return
    }
    if(tool==="text"){
      if(!canUseActiveLayer())return
      for(let i=strokes.current.length-1;i>=0;i--){
        const s=strokes.current[i]
        if(s.shapeType==="text"&&hitStroke(s,p,10)){
          onTextEditRequest?.({index:i,x:s.pts[0].x,y:s.pts[0].y,text:s.text||"",color:s.color,size:s.size,fontFamily:s.fontFamily})
          return
        }
      }
      onTextEditRequest?.({index:null,x:p.x,y:p.y,text:"",color,size,fontFamily:canvasTextFont})
      return
    }
    if(["pen","highlight","eraser","line","rect","circle","shape-arrow","cloud","dimline"].includes(tool)&&!canUseActiveLayer())return
    if(tool==="eraser"&&eraserMode==="zone"){
      e.preventDefault();drawing.current=true;cur.current=[p];return
    }
    if(tool==="eraser"&&eraserMode==="auto"){
      e.preventDefault();drawing.current=true
      eraseStrokesAt(p,eraserSize)
      onEraseAt?.(p,eraserSize)
      return
    }
    if(tool==="lasso"){
      if(tryStartGroupDrag(p,e))return
      selectedStrokes.current.clear();lassoRect.current=null;lassoPath.current=[p];notifySelection();drawing.current=true;return
    }
    if(tool==="lasso-rect"){
      if(tryStartGroupDrag(p,e))return
      selectedStrokes.current.clear();lassoPath.current=null;lassoRect.current=null;notifySelection();shape.current={start:p};drawing.current=true;return
    }
    if(!["eraser","eyedropper","text"].includes(tool)&&selectedStrokes.current.size>0){
      if(tryStartGroupDrag(p,e))return
      const b=getSelectionBounds()
      if(b&&!pointInExpandedBounds(p,b,12)){
        selectedStrokes.current.clear();lassoPath.current=null;lassoRect.current=null;notifySelection()
      }
    }
    e.preventDefault();drawing.current=true;cur.current=[p]
    if(["line","rect","circle","shape-arrow","cloud","dimline"].includes(tool)){
      const sp=snapPoint(p,strokes.current,new Set())
      shape.current={start:{x:sp.x,y:sp.y}}
      return
    }
    // Hold timer for shape auto-correct
    if(tool==="pen"){
      holdTimer.current=setTimeout(()=>{
        if(cur.current.length>3){
          const detected=detectShape(cur.current)
          if(detected){
            // Replace current freehand with detected shape
            pushStroke({pts:detected.pts,color,size,tool:"pen",shapeType:detected.type,...shapeStylePayload(shapeStyle,color)})
            cur.current=[]
            drawing.current=false
            redraw()
            if(onStroke)onStroke(strokes.current)
            logAction("stroke_shape",{stroke:strokes.current[strokes.current.length-1],detail:detected.shapeType||detected.type})
          }
        }
      },650)
    }
  }

  const mv=e=>{
    if(pencilOnly&&e.pointerType==="touch")return
    if(!drawing.current)return
    e.preventDefault()
    const p=gP(e),ctx=cRef.current.getContext("2d")
    if(groupDrag.current){
      const rawDx=p.x-groupDrag.current.startP.x,rawDy=p.y-groupDrag.current.startP.y
      const exclude=new Set([...selectedStrokes.current])
      const {xLines,yLines}=collectSnapLines(strokes.current,exclude)
      const {dx,dy,guides}=snapDelta(rawDx,rawDy,groupDrag.current.origBounds,xLines,yLines)
      snapGuides.current=guides
      groupDrag.current.snapshots.forEach(({i,pts})=>{
        strokes.current[i].pts=pts.map(pt=>({x:pt.x+dx,y:pt.y+dy}))
      })
      if(groupDrag.current.origLasso)lassoPath.current=groupDrag.current.origLasso.map(pt=>({x:pt.x+dx,y:pt.y+dy}))
      if(groupDrag.current.origRect){
        const r=groupDrag.current.origRect
        lassoRect.current={x1:r.x1+dx,y1:r.y1+dy,x2:r.x2+dx,y2:r.y2+dy}
      }
      redraw();notifySelection();return
    }
    if(tool==="lasso"){lassoPath.current=[...lassoPath.current,p];redraw();return}
    if(tool==="lasso-rect"&&shape.current){
      const s=shape.current.start
      lassoRect.current={x1:Math.min(s.x,p.x),y1:Math.min(s.y,p.y),x2:Math.max(s.x,p.x),y2:Math.max(s.y,p.y)}
      redraw();return
    }
    if(["line","rect","circle","shape-arrow","cloud","dimline"].includes(tool)&&shape.current){
      const snapped=snapPoint(p,strokes.current,new Set())
      snapGuides.current=snapped.guides
      const ep={x:snapped.x,y:snapped.y}
      redraw()
      const s=shape.current.start
      const finalPts=tool==="cloud"?[{x:Math.min(s.x,ep.x),y:Math.min(s.y,ep.y)},{x:Math.max(s.x,ep.x),y:Math.max(s.y,ep.y)}]:[s,ep]
      const preview={pts:finalPts,color,size,tool,shapeType:tool==="shape-arrow"?"arrow":tool,...shapeStylePayload(shapeStyle,color)}
      drawShapeStroke(ctx,preview,1,unitSys,formatDimension)
      drawSnapGuides(ctx,snapGuides.current)
      shape.current.end=ep
      return
    }
    if (["pen", "highlight"].includes(tool)) {
      const last = cur.current[cur.current.length - 1]
      if (last && Math.hypot(p.x - last.x, p.y - last.y) < 1.5) return
    }
    cur.current.push(p)

    if(tool==="eraser"){
      if(eraserMode==="zone"){
        redraw()
        const ctx2=cRef.current.getContext("2d")
        if(cur.current.length>1){
          ctx2.save()
          ctx2.strokeStyle="rgba(233,69,96,.85)";ctx2.fillStyle="rgba(233,69,96,.14)";ctx2.lineWidth=2
          ctx2.setLineDash([6,4])
          ctx2.beginPath();ctx2.moveTo(cur.current[0].x,cur.current[0].y)
          cur.current.forEach(pt=>ctx2.lineTo(pt.x,pt.y))
          ctx2.closePath();ctx2.fill();ctx2.stroke()
          ctx2.restore()
        }
        return
      }
      if(eraserMode==="auto"){
        const now=performance.now()
        if(now-eraseCooldown.current.t>10){
          eraseCooldown.current.t=now
          eraseStrokesAt(p,eraserSize)
          onEraseAt?.(p,eraserSize)
        }
        return
      }
      // precision — gomme pixel sous le curseur uniquement
      if(cur.current.length<2)return
      const pts=cur.current
      ctx.beginPath();ctx.strokeStyle="rgba(0,0,0,1)";ctx.lineWidth=eraserSize;ctx.lineCap="round";ctx.lineJoin="round"
      ctx.globalCompositeOperation="destination-out"
      ctx.moveTo(pts[pts.length-2].x,pts[pts.length-2].y);ctx.lineTo(pts[pts.length-1].x,pts[pts.length-1].y);ctx.stroke()
      ctx.globalCompositeOperation="source-over"
      return
    }

    if(cur.current.length<2)return
    const pts=cur.current,actualSize=size
    ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=actualSize;ctx.lineCap="round";ctx.lineJoin="round"
    ctx.globalAlpha=tool==="highlight"?.4:1;ctx.globalCompositeOperation="source-over"
    ctx.moveTo(pts[pts.length-2].x,pts[pts.length-2].y);ctx.lineTo(pts[pts.length-1].x,pts[pts.length-1].y);ctx.stroke()
    ctx.globalAlpha=1
  }

  const up=e=>{
    if(!drawing.current)return
    if(groupDrag.current){
      groupDrag.current=null
      snapGuides.current=[]
      drawing.current=false
      history.current.push(JSON.stringify(strokes.current))
      if(history.current.length>50)history.current.shift()
      if(onStroke)onStroke(strokes.current)
      logAction("move_selection",{count:selectedStrokes.current.size})
      notifySelection()
      return
    }
    drawing.current=false
    if(holdTimer.current){clearTimeout(holdTimer.current);holdTimer.current=null}
    if(tool==="eraser"&&eraserMode==="zone"&&cur.current.length>2){
      const poly=[...cur.current]
      trimStrokesInPolygon(poly)
      onEraseZone?.(poly)
      cur.current=[]
      redraw()
      if(onStroke)onStroke(strokes.current)
      return
    }
    if(tool==="eraser"&&eraserMode==="auto"){
      cur.current=[]
      return
    }
    if(tool==="lasso"){
      // Lasso complete — select strokes inside polygon
      if(lassoPath.current&&lassoPath.current.length>3){
        const poly=[...lassoPath.current,lassoPath.current[0]]
        selectedStrokes.current=new Set()
        const lm=getLayerMap()
        strokes.current.forEach((s,i)=>{
          if(!lm[strokeLayerId(s)]?.v||lm[strokeLayerId(s)]?.locked)return
          if(s.pts&&s.pts.some(pt=>pointInPolygon(pt,poly)))selectedStrokes.current.add(i)
        })
        redraw();notifySelection()
        if(selectedStrokes.current.size)logAction("select_strokes",{count:selectedStrokes.current.size})
        if(lassoPath.current?.length>3)onLassoComplete?.({type:"polygon",points:[...lassoPath.current]})
      }else{
        lassoPath.current=null;redraw();notifySelection()
      }
      return
    }
    if(tool==="lasso-rect"){
      // Lasso-rect complete — select strokes inside rect
      if(shape.current&&lassoRect.current){
        const lr=lassoRect.current
        const lm=getLayerMap()
        selectedStrokes.current=new Set()
        strokes.current.forEach((s,i)=>{
          if(!lm[strokeLayerId(s)]?.v||lm[strokeLayerId(s)]?.locked)return
          if(s.pts&&s.pts.some(pt=>pt.x>=lr.x1&&pt.x<=lr.x2&&pt.y>=lr.y1&&pt.y<=lr.y2))selectedStrokes.current.add(i)
        })
        if(selectedStrokes.current.size)logAction("select_strokes",{count:selectedStrokes.current.size})
        if(lassoRect.current)onLassoComplete?.({type:"rect",...lassoRect.current})
      }
      shape.current=null;redraw();notifySelection()
      return
    }
    const p=gP(e)
    history.current.push(JSON.stringify(strokes.current)) // save for undo
    if(history.current.length>50)history.current.shift()
    redoStack.current=[]
    snapGuides.current=[]
    if(["line","rect","circle","shape-arrow","cloud","dimline"].includes(tool)&&shape.current){
      const s=shape.current.start
      const end=shape.current.end||p
      const finalPts=tool==="cloud"?[{x:Math.min(s.x,end.x),y:Math.min(s.y,end.y)},{x:Math.max(s.x,end.x),y:Math.max(s.y,end.y)}]:[s,end]
      pushStroke({pts:finalPts,color,size,tool,shapeType:tool==="shape-arrow"?"arrow":tool,...shapeStylePayload(shapeStyle,color)})
      shape.current=null;redraw()
      logAction("stroke_shape",{stroke:strokes.current[strokes.current.length-1],detail:tool})
    } else if(cur.current.length>0){
      if(tool==="eraser"&&eraserMode==="precision"){
        pushStroke({pts:[...cur.current],color:"#000000",size:eraserSize,tool:"eraser"})
        const last=strokes.current[strokes.current.length-1]
        logAction("erase_draw",{stroke:last})
      } else if(tool!=="eraser"){
        const rawPts=[...cur.current]
        const pts=(tool==="pen"||tool==="highlight")&&rawPts.length>2?smoothStrokePoints(rawPts):rawPts
        pushStroke({pts,color,size,tool})
        const last=strokes.current[strokes.current.length-1]
        logAction(tool==="highlight"?"stroke_highlight":"stroke_pen",{stroke:last})
      }
    }
    cur.current=[]
    if(onStroke)onStroke(strokes.current)
  }

  useEffect(()=>{
    window.__undo=()=>{
      if(history.current.length===0)return
      redoStack.current.push(JSON.stringify(strokes.current))
      strokes.current=JSON.parse(history.current.pop())
      redraw()
      if(onStroke)onStroke(strokes.current)
      logAction("undo")
    }
    window.__redo=()=>{
      if(redoStack.current.length===0)return
      history.current.push(JSON.stringify(strokes.current))
      strokes.current=JSON.parse(redoStack.current.pop())
      redraw()
      if(onStroke)onStroke(strokes.current)
      logAction("redo")
    }
    window.__hasUndo=()=>history.current.length>0
    window.__hasRedo=()=>redoStack.current.length>0
    window.__clear=()=>{history.current.push(JSON.stringify(strokes.current));strokes.current=[];redraw();if(onStroke)onStroke(strokes.current);logAction("clear_canvas")}
    window.__loadStrokes=data=>{try{const norm=normalizeCanvasData(data);strokes.current=norm.strokes;selectedStrokes.current.clear();redraw()}catch{}}
    window.__getStrokes=()=>strokes.current
    window.__setStrokes=st=>{strokes.current=st||[];redraw();if(onStroke)onStroke(strokes.current)}
    window.__redraw=redraw
    window.__getCanvas=()=>cRef.current
    window.__clearSelection=()=>{selectedStrokes.current.clear();lassoPath.current=null;lassoRect.current=null;redraw();notifySelection()}
    window.__deleteSelected=()=>{
      if(selectedStrokes.current.size===0)return
      const n=selectedStrokes.current.size
      history.current.push(JSON.stringify(strokes.current))
      strokes.current=strokes.current.filter((_,i)=>!selectedStrokes.current.has(i))
      selectedStrokes.current.clear()
      lassoPath.current=null;lassoRect.current=null
      redraw();notifySelection()
      if(onStroke)onStroke(strokes.current)
      logAction("delete_selection",{count:n})
    }
    window.__duplicateSelected=()=>{
      if(selectedStrokes.current.size===0)return
      const n=selectedStrokes.current.size
      history.current.push(JSON.stringify(strokes.current))
      const newIndices=new Set(),offset={x:14,y:14}
      ;[...selectedStrokes.current].sort((a,b)=>a-b).forEach(i=>{
        const s=strokes.current[i]
        const copy=JSON.parse(JSON.stringify(s))
        copy.pts=copy.pts.map(pt=>({x:pt.x+offset.x,y:pt.y+offset.y}))
        strokes.current.push(copy)
        newIndices.add(strokes.current.length-1)
      })
      selectedStrokes.current=newIndices
      const b=getSelectionBounds()
      if(b)lassoRect.current={x1:b.x1+offset.x,y1:b.y1+offset.y,x2:b.x2+offset.x,y2:b.y2+offset.y}
      redraw();notifySelection()
      if(onStroke)onStroke(strokes.current)
      logAction("duplicate_selection",{count:n})
    }
    window.__setSelectionColor=c=>{
      if(selectedStrokes.current.size===0)return
      selectedStrokes.current.forEach(i=>{strokes.current[i].color=c})
      redraw();if(onStroke)onStroke(strokes.current)
      logAction("selection_color",{color:c,count:selectedStrokes.current.size})
    }
    window.__setSelectionSize=s=>{
      if(selectedStrokes.current.size===0)return
      selectedStrokes.current.forEach(i=>{strokes.current[i].size=s})
      redraw();if(onStroke)onStroke(strokes.current)
      logAction("selection_size",{count:selectedStrokes.current.size,detail:String(s)})
    }
    window.__setSelectionOpacity=o=>{
      if(selectedStrokes.current.size===0)return
      selectedStrokes.current.forEach(i=>{strokes.current[i].opacity=o})
      redraw();if(onStroke)onStroke(strokes.current)
      logAction("selection_opacity",{count:selectedStrokes.current.size,detail:`${Math.round(o*100)}%`})
    }
    window.__setSelectionFill=(fill,fillOpacity)=>{
      if(selectedStrokes.current.size===0)return
      selectedStrokes.current.forEach(i=>{
        const s=strokes.current[i]
        if(!SHAPE_TYPES.has(s.shapeType||s.tool)&&!["rect","circle","cloud"].includes(s.shapeType))return
        if(fill!=null)strokes.current[i].fill=fill
        if(fillOpacity!=null)strokes.current[i].fillOpacity=fillOpacity
      })
      redraw();if(onStroke)onStroke(strokes.current)
      logAction("selection_fill",{count:selectedStrokes.current.size})
    }
    window.__setSelectionRotation=deg=>{
      if(selectedStrokes.current.size===0)return
      selectedStrokes.current.forEach(i=>{strokes.current[i].rotation=deg})
      redraw();notifySelection();if(onStroke)onStroke(strokes.current)
      logAction("selection_rotate",{count:selectedStrokes.current.size,detail:`${deg}°`})
    }
    window.__setSelectionFont=font=>{
      if(selectedStrokes.current.size===0)return
      selectedStrokes.current.forEach(i=>{
        const s=strokes.current[i]
        if((s.shapeType||s.tool)==="text")strokes.current[i].fontFamily=font
      })
      redraw();if(onStroke)onStroke(strokes.current)
      logAction("selection_font",{count:selectedStrokes.current.size,detail:font})
    }
    window.__resizeSelectedShape=(x1,y1,x2,y2)=>{
      if(selectedStrokes.current.size!==1)return
      const i=[...selectedStrokes.current][0]
      strokes.current[i]=resizeShapeBox(strokes.current[i],x1,y1,x2,y2)
      history.current.push(JSON.stringify(strokes.current))
      redraw();notifySelection();if(onStroke)onStroke(strokes.current)
    }
    window.__updateTextStroke=(index,payload)=>{
      if(index==null||index<0||!strokes.current[index])return
      history.current.push(JSON.stringify(strokes.current))
      strokes.current[index]={...strokes.current[index],...payload,shapeType:"text",tool:"text"}
      redraw();if(onStroke)onStroke(strokes.current)
      logAction("stroke_text",{stroke:strokes.current[index]})
    }
    window.__addTextStroke=(payload)=>{
      history.current.push(JSON.stringify(strokes.current))
      pushStroke({pts:[{x:payload.x,y:payload.y}],color:payload.color,size:payload.size,tool:"text",text:payload.text,shapeType:"text",fontFamily:payload.fontFamily})
      redraw();if(onStroke)onStroke(strokes.current)
      logAction("stroke_text",{stroke:strokes.current[strokes.current.length-1]})
    }
  },[redraw,notifySelection,onStroke,shapeStyle])

  const navTool=tool==="arrow"||tool==="select"||tool==="hand"
  const cursor=navTool?"default":getToolCursor(tool,{selectionActive,dark:cursorDark})
  return<canvas ref={cRef}width={pageW}height={pageH}
    style={{position:"absolute",inset:0,width:"100%",height:"100%",cursor,touchAction:"none",zIndex:canvasZIndex,pointerEvents:navTool?"none":"auto"}}
    onPointerDown={dn}onPointerMove={mv}onPointerUp={up}onPointerLeave={up}/>
}

/* ══ GOODNOTES UI ════════════════════════════════════ */
function GoodNotesSlider({value,min,max,step=1,onChange,label}){
  const pct=((value-min)/(max-min))*100
  return(
    <div style={{display:"flex",flexDirection:"column",gap:4}}>
      {label&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:10,color:COLORS.textSecondary}}>{label}</span>
        <span style={{fontSize:10,color:COLORS.text,fontFamily:"monospace"}}>{typeof value==="number"?value.toFixed(step<1?1:0):value}</span>
      </div>}
      <div style={{position:"relative",height:20,display:"flex",alignItems:"center"}}>
        <div style={{position:"absolute",left:0,right:0,height:4,borderRadius:2,background:COLORS.separator}}/>
        <div style={{position:"absolute",left:0,width:`${pct}%`,height:4,borderRadius:2,background:COLORS.accent}}/>
        <input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(parseFloat(e.target.value))}
          style={{position:"relative",width:"100%",height:20,appearance:"none",WebkitAppearance:"none",background:"transparent",cursor:"pointer",margin:0,accentColor:COLORS.accent}}/>
      </div>
    </div>
  )
}

function GoodNotesSectionLabel({children}){
  return<div style={{fontSize:11,fontWeight:600,color:COLORS.textSecondary,textTransform:"uppercase",letterSpacing:0.6,marginBottom:6}}>{children}</div>
}

function GoodNotesToolRail({tool,setTool,setShowLib}){
  return(
    <div style={{width:56,flexShrink:0,background:COLORS.toolbar,borderRight:`1px solid ${COLORS.toolbarBorder}`,display:"flex",flexDirection:"column",alignItems:"center",padding:"8px 0",gap:2,zIndex:10}}>
      {EDITOR_TOOLS_LIST.map((grp,gi)=>(
        <div key={grp.g} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,width:"100%"}}>
          {grp.items.map(t=>{
            const Icon=TOOL_ICON_MAP[t.id]
            const active=tool===t.id
            return(
              <button key={t.id} type="button" title={t.l} onClick={()=>setTool(t.id)}
                style={{width:40,height:40,borderRadius:8,border:"none",background:active?`${COLORS.accent}22`:"transparent",color:active?COLORS.accent:COLORS.textSecondary,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"background .15s,color .15s"}}>
                {Icon?<Icon size={18} strokeWidth={active?2.2:1.8}/>:<span style={{fontSize:14}}>{t.i}</span>}
              </button>
            )
          })}
          {gi<EDITOR_TOOLS_LIST.length-1&&<div style={{width:28,height:1,background:COLORS.separator,margin:"4px 0"}}/>}
        </div>
      ))}
      <div style={{flex:1}}/>
      <button type="button" title="Bibliothèque" onClick={()=>setShowLib(true)}
        style={{width:40,height:40,borderRadius:8,border:"none",background:"transparent",color:COLORS.textSecondary,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:4}}>
        <BookOpen size={18}/>
      </button>
    </div>
  )
}

function GnIconBtn({children,active,onClick,title,disabled,size=40}){
  return(
    <button type="button" title={title} disabled={disabled} onClick={onClick}
      style={{width:size,height:size,borderRadius:8,border:"none",background:active?C.panel:"transparent",color:active?C.accent:(disabled?C.muted:C.icon),cursor:disabled?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:disabled?0.3:1,transition:"background .12s,color .12s",padding:6,flexShrink:0}}>
      {children}
    </button>
  )
}

function GnColorDot({c,active,onClick,size=26}){
  return(
    <button type="button" onClick={onClick} style={{width:size,height:size,borderRadius:"50%",background:c,border:active?`2px solid ${C.text}`:`2px solid transparent`,cursor:"pointer",outline:c==="#ffffff"||c==="#fff"?`1px solid ${C.border2}`:"none",transform:active?"scale(1.1)":"scale(1)",transition:"transform .1s",flexShrink:0}}/>
  )
}

function GoodNotesToolPopup({toolPopup,onClose,color,setColor,sizeMm,setSizeMm,eraserSettings,setEraserSettings,unitSys,canvasTextFont,setCanvasTextFont,favorites,setFavorites,setTool,setPropsCollapsed,setShowPropsPanel,lassoType,setLassoType,lassoInclude,setLassoInclude,pencilOnly,setPencilOnly,textSize,setTextSize}){
  if(!toolPopup)return null
  const popupStyle={position:"absolute",top:TOP_BAR_H+4,left:"50%",transform:"translateX(-50%)",background:C.bar,borderRadius:14,border:`1px solid ${C.border}`,boxShadow:"0 8px 24px rgba(0,0,0,.6)",padding:"10px 16px",display:"flex",alignItems:"center",gap:12,zIndex:45,flexWrap:"wrap",maxWidth:"min(92vw,720px)",animation:"gnPopupIn .15s ease"}
  const quickPal=(toolPopup==="highlight"?HPAL["Standards"]:CPAL["📐 Plans"]).slice(0,8)
  const favColors=favorites.filter(Boolean).slice(0,3).map(f=>f.color)
  if(toolPopup==="pen"||toolPopup==="highlight"){
    return(
      <div style={popupStyle}>
        <select value={sizeMm} onChange={e=>setSizeMm(parseFloat(e.target.value))} style={{padding:"6px 10px",borderRadius:8,border:"none",background:C.panel,color:C.text,fontSize:13,cursor:"pointer"}}>
          {BRUSHES.map(b=><option key={b.id} value={b.mm}>{b.label} · {b.mm}mm</option>)}
        </select>
        {favColors.map(c=><GnColorDot key={c} c={c} active={color===c} onClick={()=>setColor(c)}/>)}
        {quickPal.map(c=><GnColorDot key={c} c={c} active={color===c} onClick={()=>{setColor(c);setTool(toolPopup)}}/>)}
        <button type="button" onClick={()=>{setShowPropsPanel(true);setPropsCollapsed(false);onClose()}} title="Réglages complets" style={{width:36,height:36,borderRadius:8,border:"none",background:C.panel,color:C.icon,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><SlidersHorizontal size={18}/></button>
      </div>
    )
  }
  if(toolPopup==="eraser"){
    const sizeMm=eraserSettings.sizeMm
    const setSizeMm=v=>setEraserSettings(s=>({...s,sizeMm:typeof v==="function"?v(s.sizeMm):v}))
    return(
      <div style={{...popupStyle,flexDirection:"column",alignItems:"stretch",gap:10,minWidth:280}}>
        <div style={{display:"flex",gap:6}}>
          {ERASER_MODES.map(m=>(
            <button key={m.id} type="button" onClick={()=>setEraserSettings(s=>({...s,mode:m.id}))} style={{flex:1,padding:"8px 6px",borderRadius:8,border:"none",background:eraserSettings.mode===m.id?C.accent:C.panel,color:C.text,fontSize:12,cursor:"pointer"}}>{m.label}</button>
          ))}
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center"}}>
          {ERASER_SIZES_MM.map(s=>(
            <button key={s} type="button" onClick={()=>setSizeMm(s)} style={{width:32,height:32,borderRadius:8,border:"none",background:sizeMm===s?C.accent:C.panel,color:C.text,fontSize:10,cursor:"pointer",fontFamily:"monospace"}}>{s}</button>
          ))}
        </div>
        <GoodNotesSlider value={sizeMm} min={0.5} max={30} step={0.5} onChange={setSizeMm}/>
      </div>
    )
  }
  if(toolPopup==="text"){
    const sizes=[12,14,16,18,24,32,48]
    const fontLabel=CANVAS_TEXT_FONTS.find(f=>f.id===canvasTextFont)?.label||"Moderne"
    return(
      <div style={popupStyle}>
        <GnColorDot c={color} active onClick={()=>{setShowPropsPanel(true);setPropsCollapsed(false)}} size={28}/>
        <select value={textSize} onChange={e=>setTextSize(parseInt(e.target.value,10))} style={{padding:"6px 10px",borderRadius:8,border:"none",background:C.panel,color:C.text,fontSize:13}}>
          {sizes.map(s=><option key={s} value={s}>{s}px</option>)}
        </select>
        <select value={canvasTextFont} onChange={e=>setCanvasTextFont(e.target.value)} style={{padding:"6px 10px",borderRadius:8,border:"none",background:C.panel,color:C.text,fontSize:13,maxWidth:140}}>
          {CANVAS_TEXT_FONTS.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}
        </select>
        <span style={{fontSize:11,color:C.muted,whiteSpace:"nowrap"}}>{fontLabel}</span>
        <button type="button" onClick={()=>setTool("text")} style={{padding:"6px 10px",borderRadius:8,border:"none",background:C.panel,color:C.text,fontSize:12,cursor:"pointer",whiteSpace:"nowrap"}}>↖ Épingler Texte</button>
      </div>
    )
  }
  if(toolPopup==="lasso"){
    const toggles=[["handwriting","Écriture manuscrite"],["images","Images"],["shapes","Formes"],["arrows","Flèches"],["text","Zones de texte"],["equations","Équations"]]
    return(
      <div style={{...popupStyle,flexDirection:"column",alignItems:"stretch",gap:12,minWidth:300,maxWidth:360}}>
        <div style={{fontSize:17,fontWeight:700,color:C.text}}>Outil Lasso</div>
        <div>
          <GoodNotesSectionLabel>Type de lasso</GoodNotesSectionLabel>
          <div style={{display:"flex",gap:8}}>
            {[["free","À main levée","lasso"],["rect","Rectangulaire","lasso-rect"]].map(([id,l,tid])=>(
              <button key={id} type="button" onClick={()=>{setLassoType(id);setTool(tid)}} style={{flex:1,padding:"12px 8px",borderRadius:10,border:lassoType===id?`1.5px solid ${C.text}`:`1px solid ${C.border}`,background:lassoType===id?C.border2:C.panel,color:C.text,fontSize:13,cursor:"pointer"}}>{l}</button>
            ))}
          </div>
        </div>
        <div>
          <GoodNotesSectionLabel>Contenus à inclure</GoodNotesSectionLabel>
          {toggles.map(([k,l])=>(
            <div key={k} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
              <span style={{fontSize:14,color:C.text}}>{l}</span>
              <button type="button" onClick={()=>setLassoInclude(s=>({...s,[k]:!s[k]}))} style={{width:44,height:26,borderRadius:13,border:"none",background:lassoInclude[k]?C.success:C.border2,cursor:"pointer",position:"relative",transition:"background .15s"}}>
                <span style={{position:"absolute",top:3,left:lassoInclude[k]?22:3,width:20,height:20,borderRadius:"50%",background:C.text,transition:"left .15s"}}/>
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={()=>{setPencilOnly(v=>{const n=!v;try{localStorage.setItem("forma_pencil_only",n?"1":"0")}catch{};return n})}} style={{background:"none",border:"none",color:C.danger,fontSize:14,cursor:"pointer",textAlign:"left",padding:"4px 0"}}>
          {pencilOnly?"Déconnecter l'Apple Pencil":"Connecter Apple Pencil uniquement"}
        </button>
      </div>
    )
  }
  return null
}

function GoodNotesTopBar({
  nb,navigate,updateNotebook,tool,setTool,onToolClick,readOnly,setReadOnly,readOnlyLocked,
  setShowPresent,setShowShare,showPagePanel,setShowPagePanel,setShowSearchPanel,
  setShowLib,setShowLayers,setShowHistory,setShowCalc,setShowConv,setShowTranslate,setShowDictation,
  setShowTimer,setShowFlash,setShowPropsPanel,setPropsCollapsed,setShowPageSettings,
  showHistory,showCalc,showConv,showTranslate,showDictation,showTimer,showFlash,showLayers,
  infiniteMode,applyPageSettings,page,pencilOnly,setPencilOnly,toggleFocusMode,handleImport,
  exportPNG,exporting,unitSys,setUnitSys,scale,setScale,scalesM,scalesI,actionLogLength,
  flashCardsLength,timerRunning,timerSec,propsCollapsed,collabCursors,collabColors,notebooks,
  canUndo,canRedo,
}){
  const[showNbDrop,setShowNbDrop]=useState(false)
  const[showMore,setShowMore]=useState(false)
  const nbRef=useRef(null)
  const moreRef=useRef(null)
  const siblingNbs=(notebooks||[]).filter(n=>n.subject===nb.subject&&n.id!==nb.id)
  useEffect(()=>{
    if(!showMore&&!showNbDrop)return
    const close=e=>{
      if(showMore&&moreRef.current&&!moreRef.current.contains(e.target))setShowMore(false)
      if(showNbDrop&&nbRef.current&&!nbRef.current.contains(e.target))setShowNbDrop(false)
    }
    window.addEventListener("pointerdown",close)
    return()=>window.removeEventListener("pointerdown",close)
  },[showMore,showNbDrop])
  const menuBtn=(label,fn,active)=>(
    <button key={label} type="button" onClick={()=>{fn();setShowMore(false)}} style={{width:"100%",padding:"8px 12px",border:"none",background:active?`${C.accent}18`:"transparent",color:active?C.accent:C.text,cursor:"pointer",fontSize:12,textAlign:"left",borderRadius:6}}>{label}</button>
  )
  return(
    <div style={{height:TOP_BAR_H,flexShrink:0,background:C.bar,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",padding:"0 8px",gap:4,zIndex:30,position:"relative"}}>
      <GnIconBtn active={showPagePanel} onClick={()=>setShowPagePanel(v=>!v)} title="Pages"><PanelLeft size={22}/></GnIconBtn>
      <button type="button" onClick={()=>navigate("/")} style={{background:"none",border:"none",color:C.accent,cursor:"pointer",display:"flex",alignItems:"center",gap:2,padding:"4px 6px",fontSize:15,flexShrink:0}}>
        <ChevronLeft size={18}/><span style={{maxWidth:80,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>Bibliothèque</span>
      </button>
      <div ref={nbRef} style={{position:"relative",flexShrink:0}}>
        <button type="button" onClick={()=>setShowNbDrop(v=>!v)} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,padding:"4px 8px",maxWidth:180}}>
          <span style={{fontSize:16,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{nb.title}</span>
          <ChevronDown size={14} color={C.muted}/>
        </button>
        {showNbDrop&&(
          <div style={{position:"absolute",top:"100%",left:0,marginTop:6,minWidth:220,background:C.bar,borderRadius:12,border:`1px solid ${C.border}`,boxShadow:"0 8px 32px rgba(0,0,0,.6)",zIndex:100,overflow:"hidden"}}>
            <button type="button" onClick={()=>setShowNbDrop(false)} style={{width:"100%",height:44,padding:"0 14px",border:"none",background:"transparent",color:C.accent,cursor:"default",fontSize:15,textAlign:"left",display:"flex",alignItems:"center",gap:10}}><BookOpen size={18}/>{nb.title}</button>
            {siblingNbs.map(n=>(
              <button key={n.id} type="button" onClick={()=>{setShowNbDrop(false);navigate(`/editor/${n.id}`)}} style={{width:"100%",height:44,padding:"0 14px",border:"none",background:"transparent",color:C.text,cursor:"pointer",fontSize:15,textAlign:"left",display:"flex",alignItems:"center",gap:10}}><BookOpen size={18}/>{n.title}</button>
            ))}
          </div>
        )}
      </div>
      {Array.isArray(collabCursors)&&collabCursors.length>0&&(
        <div style={{display:"flex",gap:2}}>
          {collabCursors.slice(0,4).map((c,i)=>(
            <div key={c.userId} title={c.userName} style={{width:18,height:18,borderRadius:"50%",background:collabColors[i%6],display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,color:"#fff"}}>{(c.userName||"?")[0].toUpperCase()}</div>
          ))}
        </div>
      )}
      <GnIconBtn onClick={()=>window.__undo?.()} title="Annuler" disabled={!canUndo}><Undo2 size={20}/></GnIconBtn>
      <GnIconBtn onClick={()=>window.__redo?.()} title="Refaire" disabled={!canRedo}><Redo2 size={20}/></GnIconBtn>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:2,minWidth:0,overflowX:"auto"}}>
        {TOP_TOOL_GROUPS.map((grp,gi)=>(
          <div key={gi} style={{display:"flex",alignItems:"center",gap:2,flexShrink:0}}>
            {grp.map(({id,Icon,label,popup})=>{
              const active=tool===id||(id==="lasso"&&(tool==="lasso"||tool==="lasso-rect"))
              return(
                <GnIconBtn key={id} active={active} title={`${label}`} onClick={()=>onToolClick(id,!!popup)}>
                  <Icon size={22} strokeWidth={active?2.2:1.8}/>
                </GnIconBtn>
              )
            })}
            {gi<TOP_TOOL_GROUPS.length-1&&<div style={{width:1,height:24,background:C.border,margin:"0 4px"}}/>}
          </div>
        ))}
      </div>
      <GnIconBtn onClick={()=>setShowSearchPanel(true)} title="Rechercher"><Search size={20}/></GnIconBtn>
      <GnIconBtn onClick={()=>window.dispatchEvent(new Event("forma:open-ai"))} title="IA"><Sparkles size={20}/></GnIconBtn>
      <GnIconBtn onClick={()=>setShowLib(true)} title="Bibliothèque archi"><BookOpen size={20}/></GnIconBtn>
      <GnIconBtn onClick={()=>setShowShare(true)} title="Partager"><Share2 size={20}/></GnIconBtn>
      <div ref={moreRef} style={{position:"relative"}}>
        <GnIconBtn active={showMore} onClick={()=>setShowMore(v=>!v)} title="Plus"><MoreHorizontal size={20}/></GnIconBtn>
        {showMore&&(
          <div style={{position:"absolute",top:"100%",right:0,marginTop:6,width:220,background:C.panel,border:`1px solid ${C.border}`,borderRadius:10,boxShadow:"0 8px 32px rgba(0,0,0,.5)",padding:6,zIndex:100,maxHeight:"70vh",overflowY:"auto"}}>
            {menuBtn("Présentation",()=>setShowPresent(true),false)}
            {menuBtn(readOnly?"Désactiver lecture seule":"Lecture seule",()=>{if(!readOnlyLocked)setReadOnly(v=>!v)},readOnly)}
            {menuBtn("Calques",()=>setShowLayers(v=>!v),showLayers)}
            {menuBtn("Style de page",()=>setShowPageSettings(true),false)}
            {menuBtn(`Historique${actionLogLength>0?` (${actionLogLength})`:""}`,()=>setShowHistory(v=>!v),showHistory)}
            {menuBtn("Calculatrice",()=>setShowCalc(v=>!v),showCalc)}
            {menuBtn("Convertisseur",()=>setShowConv(v=>!v),showConv)}
            {menuBtn("Traduction",()=>setShowTranslate(v=>!v),showTranslate)}
            {menuBtn("Dictée",()=>setShowDictation(v=>!v),showDictation)}
            {menuBtn(timerRunning?`Pomodoro ${String(Math.floor(timerSec/60)).padStart(2,"0")}:${String(timerSec%60).padStart(2,"0")}`:"Pomodoro",()=>setShowTimer(v=>!v),showTimer)}
            {menuBtn(`Flashcards${flashCardsLength>0?` (${flashCardsLength})`:""}`,()=>setShowFlash(v=>!v),showFlash)}
            {menuBtn(`Canvas infini${infiniteMode?" ✓":""}`,()=>applyPageSettings(page,{infinite:!infiniteMode}),infiniteMode)}
            {menuBtn(`Apple Pencil${pencilOnly?" ✓":""}`,()=>{setPencilOnly(v=>{const n=!v;try{localStorage.setItem("forma_pencil_only",n?"1":"0")}catch{};return n})},pencilOnly)}
            {menuBtn("Mode focus",toggleFocusMode,false)}
            {menuBtn("Couleurs & taille",()=>{setShowPropsPanel(true);setPropsCollapsed(false)},!propsCollapsed)}
            {menuBtn("Déplacer (main)",()=>setTool("hand"),tool==="hand")}
            {menuBtn("Pipette",()=>setTool("eyedropper"),tool==="eyedropper")}
            <div style={{height:1,background:C.border,margin:"4px 0"}}/>
            <div style={{padding:"4px 8px",display:"flex",gap:4}}>
              <button type="button" onClick={()=>{setUnitSys("metric");setScale("1:50");setShowMore(false)}} style={{flex:1,padding:"4px 0",borderRadius:6,border:`1px solid ${unitSys==="metric"?C.accent:C.border}`,background:unitSys==="metric"?`${C.accent}18`:C.bar,color:unitSys==="metric"?C.accent:C.muted,cursor:"pointer",fontSize:10}}>mm</button>
              <button type="button" onClick={()=>{setUnitSys("imperial");setScale('1/4"=1\'');setShowMore(false)}} style={{flex:1,padding:"4px 0",borderRadius:6,border:`1px solid ${unitSys==="imperial"?C.accent:C.border}`,background:unitSys==="imperial"?`${C.accent}18`:C.bar,color:unitSys==="imperial"?C.accent:C.muted,cursor:"pointer",fontSize:10}}>in</button>
            </div>
            <select value={scale} onChange={e=>setScale(e.target.value)} style={{width:"100%",margin:"4px 0",padding:"4px 8px",borderRadius:6,border:`1px solid ${C.border}`,background:C.bar,color:C.muted,fontSize:10,outline:"none"}}>
              {(unitSys==="metric"?scalesM:scalesI).map(s=><option key={s} value={s}>{s}</option>)}
            </select>
            <label style={{display:"flex",alignItems:"center",gap:6,padding:"6px 8px",cursor:"pointer",fontSize:11,color:C.muted}}>
              📎 Importer<input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{handleImport(e);setShowMore(false)}}/>
            </label>
            <button type="button" onClick={()=>{exportPNG();setShowMore(false)}} disabled={exporting} style={{width:"100%",padding:"6px 8px",border:"none",background:"transparent",color:C.text,cursor:exporting?"default":"pointer",fontSize:11,textAlign:"left",borderRadius:6}}>{exporting?"Export…":"Export PNG"}</button>
            <button type="button" onClick={()=>{window.__clear?.();setShowMore(false)}} style={{width:"100%",padding:"6px 8px",border:"none",background:"transparent",color:C.danger,cursor:"pointer",fontSize:11,textAlign:"left",borderRadius:6}}>Effacer canvas</button>
          </div>
        )}
      </div>
    </div>
  )
}

function GoodNotesPagesSlidePanel({open,onClose,page,pagesCount,pages,nb,T,goToPage,addPage,duplicatePage,setPageMenu,applyPageSettings,pageFormat,customPageMm,nextPageFmt,nextPageCustomMm,setNextPageFmt,setNextPageCustomMm}){
  const[viewMode,setViewMode]=useState("grid")
  if(!open)return null
  return(
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",zIndex:55}}/>
      <div style={{position:"fixed",top:0,left:0,bottom:0,width:300,background:C.bar,borderRight:`1px solid ${C.border}`,zIndex:56,display:"flex",flexDirection:"column",transform:open?"translateX(0)":"translateX(-300px)",transition:"transform .25s ease",boxShadow:"4px 0 32px rgba(0,0,0,.5)"}}>
        <div style={{padding:"12px 14px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",flexShrink:0}}>
          <span style={{fontSize:17,fontWeight:700,color:C.text}}>Pages</span>
          <button type="button" onClick={onClose} style={{position:"absolute",right:12,background:"none",border:"none",color:C.muted,cursor:"pointer",padding:4,display:"flex"}}><X size={20}/></button>
        </div>
        <div style={{padding:"8px 12px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div style={{display:"flex",gap:4}}>
            {[["grid",Grid3x3],["list",List],["outline",LayoutList]].map(([m,Icon])=>(
              <button key={m} type="button" onClick={()=>setViewMode(m)} style={{width:32,height:32,borderRadius:8,border:"none",background:viewMode===m?C.panel:"transparent",color:viewMode===m?C.accent:C.muted,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon size={18}/></button>
            ))}
          </div>
          <span style={{fontSize:12,color:C.muted}}>Toutes les pages ▾</span>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:10}}>
          <div style={{display:viewMode==="list"?"flex":"grid",flexDirection:viewMode==="list"?"column":"unset",gridTemplateColumns:viewMode==="grid"?"1fr 1fr":"unset",gap:10}}>
            {Array.from({length:pagesCount},(_,i)=>{
              const n=i+1
              const pageData=pages.find(p=>p.page_number===n)
              const gnT={...T,accent:C.accent,border:C.border,bg:C.panel,muted:C.muted}
              return(
                <div key={n}>
                  <PageThumbnail pageData={pageData} pageNum={n} current={page===n} T={gnT} notebookTemplate={nb.template} compact={viewMode==="grid"} onClick={()=>{goToPage(n);onClose()}} onMenu={(e,num)=>setPageMenu({x:e.clientX,y:e.clientY,pageNum:num})}/>
                </div>
              )
            })}
            <button type="button" onClick={()=>addPage()} style={{minHeight:viewMode==="grid"?160:56,borderRadius:8,border:`2px dashed ${C.border}`,background:"transparent",color:C.muted,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>+</button>
          </div>
        </div>
        <div style={{padding:"8px 12px",borderTop:`1px solid ${C.border}`,flexShrink:0}}>
          <PageFormatPicker T={T} format={pageFormat} customMm={customPageMm} compact onChange={(partial)=>applyPageSettings(page,partial)}/>
        </div>
      </div>
    </>
  )
}

function GoodNotesSearchPanel({open,onClose}){
  const[tab,setTab]=useState("notes")
  const[query,setQuery]=useState("")
  if(!open)return null
  return(
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",zIndex:55}}/>
      <div style={{position:"fixed",top:0,left:0,bottom:0,width:300,background:C.bar,borderRight:`1px solid ${C.border}`,zIndex:56,display:"flex",flexDirection:"column",boxShadow:"4px 0 32px rgba(0,0,0,.5)"}}>
        <div style={{padding:"12px 14px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:17,fontWeight:700,color:C.text}}>Rechercher</span>
          <button type="button" onClick={onClose} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",padding:4,display:"flex"}}><X size={20}/></button>
        </div>
        <div style={{padding:12}}>
          <div style={{display:"flex",alignItems:"center",gap:8,background:C.panel,borderRadius:10,padding:"8px 12px"}}>
            <Search size={16} color={C.muted}/>
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher" style={{flex:1,border:"none",background:"transparent",color:C.text,fontSize:14,outline:"none"}}/>
          </div>
        </div>
        <div style={{display:"flex",gap:6,padding:"0 12px 12px"}}>
          {[["notes","Notes"],["plans","Plans"]].map(([id,l])=>(
            <button key={id} type="button" onClick={()=>setTab(id)} style={{flex:1,padding:"8px 0",borderRadius:8,border:"none",background:tab===id?C.border2:C.panel,color:C.text,fontSize:13,cursor:"pointer"}}>{l}</button>
          ))}
        </div>
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,textAlign:"center"}}>
          <div style={{fontSize:40,marginBottom:12,opacity:.5}}>🔍</div>
          <div style={{fontSize:16,fontWeight:600,color:C.text,marginBottom:8}}>Trouvez tout ce que vous cherchez</div>
          <div style={{fontSize:13,color:C.muted,lineHeight:1.5}}>Recherchez dans vos notes, annotations et plans.</div>
        </div>
      </div>
    </>
  )
}

function GoodNotesBottomBar({page,pagesCount,goToPage,addPage,pagePhotoInputRef,handlePagePhotoPick,pages,nb,setPageMenu,zoom,zoomBy,resetViewport,viewSize,setShowLayers,setShowPageSettings}){
  const thumbRef=useRef(null)
  useEffect(()=>{
    if(!thumbRef.current)return
    const el=thumbRef.current.querySelector(`[data-page="${page}"]`)
    el?.scrollIntoView({behavior:"smooth",inline:"center",block:"nearest"})
  },[page])
  return(
    <div style={{height:BOTTOM_BAR_H,flexShrink:0,background:C.bar,borderTop:`1px solid ${C.border}`,display:"flex",alignItems:"center",padding:"0 16px",gap:8,zIndex:20}}>
      <span style={{fontSize:13,color:C.text,whiteSpace:"nowrap"}}>{page} sur {pagesCount}</span>
      <button type="button" onClick={()=>goToPage(Math.max(1,page-1))} disabled={page===1} style={{background:"none",border:"none",color:page===1?C.border:C.accent,cursor:page===1?"default":"pointer",padding:2,display:"flex"}}><ChevronLeft size={20}/></button>
      <button type="button" onClick={()=>goToPage(Math.min(pagesCount,page+1))} style={{background:"none",border:"none",color:C.accent,cursor:"pointer",padding:2,display:"flex"}}><ChevronRight size={20}/></button>
      <button type="button" onClick={()=>addPage()} title="Nouvelle page" style={{background:"none",border:"none",color:C.accent,cursor:"pointer",padding:2,display:"flex"}}><Plus size={18}/></button>
      <button type="button" onClick={()=>setShowPageSettings(true)} title="Modèle de feuille" style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16,padding:2}}>📄</button>
      <input ref={pagePhotoInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>handlePagePhotoPick(e,"new")}/>
      <div ref={thumbRef} style={{flex:1,display:"flex",gap:8,overflowX:"auto",padding:"2px 0",minWidth:0,alignItems:"flex-end"}}>
        {Array.from({length:pagesCount},(_,i)=>{
          const n=i+1
          const pageData=pages.find(p=>p.page_number===n)
          return(
            <div key={n} data-page={n} style={{flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
              <div style={{width:36,height:48,borderRadius:4,border:`${page===n?2:1}px solid ${page===n?C.accent:C.border}`,overflow:"hidden",background:C.panel}}>
                <PageThumbnail pageData={pageData} pageNum={n} current={page===n} T={{accent:C.accent,border:C.border,bg:C.panel,muted:C.muted}} notebookTemplate={nb.template} mini onClick={()=>goToPage(n)} onMenu={(e,num)=>setPageMenu({x:e.clientX,y:e.clientY,pageNum:num})}/>
              </div>
              <span style={{fontSize:10,color:C.muted}}>Page {n}</span>
            </div>
          )
        })}
      </div>
      <span style={{fontSize:13,color:C.muted,minWidth:36,textAlign:"center"}}>{Math.round(zoom*100)}%</span>
      <button type="button" onClick={()=>zoomBy(1/1.1,{x:viewSize.w/2,y:viewSize.h/2})} style={{background:"none",border:"none",color:C.accent,cursor:"pointer",padding:2,display:"flex"}}><ZoomOut size={20}/></button>
      <button type="button" onClick={()=>zoomBy(1.1,{x:viewSize.w/2,y:viewSize.h/2})} style={{background:"none",border:"none",color:C.accent,cursor:"pointer",padding:2,display:"flex"}}><ZoomIn size={20}/></button>
      <button type="button" onClick={()=>setShowLayers(v=>!v)} title="Calques" style={{background:"none",border:"none",color:C.muted,cursor:"pointer",padding:2,display:"flex"}}><Layers size={20}/></button>
    </div>
  )
}

function PropertiesPanelContent({T,color,setColor,sizeMm,setSizeMm,tool,setTool,eraserMm,setEraserMm,favorites,setFavorites,unitSys,shapeStyle,setShapeStyle,canvasTextFont,setCanvasTextFont,onExpand,useBrushGrid}){
  const[cPal,setCPal]=useState("📐 Plans")
  const[hPal,setHPal]=useState("Standards")
  const[showWheel,setShowWheel]=useState(false)
  const[customHex,setCustomHex]=useState(color)
  const wheelRef=useRef()
  const isEraser=tool==="eraser"
  const isShapeTool=["line","rect","circle","shape-arrow","cloud","dimline"].includes(tool)
  const isTextTool=tool==="text"
  const prevToolRef=useRef(tool)
  useEffect(()=>{
    if(tool==="text"&&prevToolRef.current!=="text")onExpand?.()
    prevToolRef.current=tool
  },[tool,onExpand])
  useEffect(()=>{
    if(!showWheel||!wheelRef.current)return
    const canvas=wheelRef.current,ctx=canvas.getContext("2d"),cx=75,cy=75,r=70
    for(let a=0;a<360;a++){const rad=a*Math.PI/180,g=ctx.createLinearGradient(cx,cy,cx+r*Math.cos(rad),cy+r*Math.sin(rad));g.addColorStop(0,"white");g.addColorStop(1,`hsl(${a},100%,50%)`);ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,rad,(a+1)*Math.PI/180);ctx.fillStyle=g;ctx.fill()}
    const dg=ctx.createRadialGradient(cx,cy,0,cx,cy,r);dg.addColorStop(0,"rgba(0,0,0,0)");dg.addColorStop(1,"rgba(0,0,0,0.5)");ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle=dg;ctx.fill()
  },[showWheel])
  const pickWheel=e=>{const r=wheelRef.current.getBoundingClientRect(),ctx=wheelRef.current.getContext("2d"),px2=ctx.getImageData(e.clientX-r.left,e.clientY-r.top,1,1).data;if(px2[3]>0){const h=`#${[px2[0],px2[1],px2[2]].map(v=>v.toString(16).padStart(2,"0")).join("")}`;setColor(h);setCustomHex(h)}}
  const saveFav=i=>{const f=[...favorites];f[i]=favoriteFromEditor({color,sizeMm,tool,eraserMm,label:`F${i+1}`});setFavorites(f)}
  const loadFav=f=>{if(!f)return;setColor(f.color);setSizeMm(f.sizeMm);if(f.tool)setTool(f.tool);if(f.eraserMm!=null)setEraserMm(f.eraserMm)}
  return(
    <div style={{padding:"12px 14px",display:"flex",flexDirection:"column",gap:12,overflowY:"auto",flex:1}}>
      {useBrushGrid?(
        <div>
          <GoodNotesSectionLabel>Pinceau</GoodNotesSectionLabel>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            {BRUSHES.map(b=>{
              const active=sizeMm===b.mm&&!isEraser
              return(
                <button key={b.id} type="button" onClick={()=>setSizeMm(b.mm)} style={{padding:"8px 6px",borderRadius:8,border:`1px solid ${active?COLORS.accent:COLORS.panelBorder}`,background:active?`${COLORS.accent}18`:COLORS.toolbar,color:active?COLORS.accent:COLORS.text,cursor:"pointer",fontSize:11,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                  <span style={{fontSize:16,lineHeight:1}}>{b.icon}</span>
                  <span>{b.label}</span>
                  <span style={{fontSize:9,color:COLORS.textSecondary,fontFamily:"monospace"}}>{b.mm}mm</span>
                </button>
              )
            })}
          </div>
          <div style={{marginTop:10}}>
            <GoodNotesSlider value={sizeMm} min={0.05} max={10} step={0.05} label="Taille" onChange={setSizeMm}/>
          </div>
        </div>
      ):(
        <div>
          <div style={{fontSize:8,color:T.muted,marginBottom:3}}>TAILLE CRAYON</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:3}}>{SIZES_MM.map(s=><button key={s}onClick={()=>setSizeMm(s)}style={{padding:"2px 5px",borderRadius:5,border:`1px solid ${sizeMm===s&&!isEraser?T.accent:T.border}`,background:sizeMm===s&&!isEraser?`${T.accent}18`:T.bg,color:sizeMm===s&&!isEraser?T.accent:T.muted,cursor:"pointer",fontSize:8,fontFamily:"monospace"}}>{s}</button>)}</div>
        </div>
      )}
      <div>
        {useBrushGrid?<GoodNotesSectionLabel>Palette</GoodNotesSectionLabel>:<div style={{fontSize:8,color:T.muted,marginBottom:3}}>PALETTE</div>}
        <select value={cPal}onChange={e=>setCPal(e.target.value)}style={{width:"100%",padding:"6px 8px",borderRadius:8,border:`1px solid ${useBrushGrid?COLORS.panelBorder:T.border}`,background:useBrushGrid?COLORS.toolbar:T.bg,color:useBrushGrid?COLORS.text:T.ink,fontSize:11,outline:"none",cursor:"pointer",marginBottom:6}}>
          {Object.keys(CPAL).map(p=><option key={p}value={p}>{p}</option>)}
        </select>
        <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
          {CPAL[cPal].map(c=><button key={c}onClick={()=>{setColor(c);setCustomHex(c)}}style={{width:c===color?24:20,height:c===color?24:20,borderRadius:"50%",background:c,border:`2px solid ${c===color?(useBrushGrid?COLORS.accent:T.accent):"transparent"}`,cursor:"pointer",outline:c==="#ffffff"?`1px solid ${useBrushGrid?COLORS.panelBorder:T.border}`:"none",flexShrink:0,transition:"all .1s"}}/>)}
        </div>
      </div>
      <button onClick={()=>setShowWheel(v=>!v)}style={{padding:"6px 10px",borderRadius:8,border:`1px solid ${showWheel?(useBrushGrid?COLORS.accent:T.accent):(useBrushGrid?COLORS.panelBorder:T.border)}`,background:showWheel?`${useBrushGrid?COLORS.accent:T.accent}15`:useBrushGrid?COLORS.toolbar:T.bg,color:showWheel?(useBrushGrid?COLORS.accent:T.accent):T.muted,cursor:"pointer",fontSize:11,textAlign:"left"}}>🎡 Roue chromatique</button>
      {showWheel&&<div>
        <canvas ref={wheelRef}width={150}height={150}style={{borderRadius:"50%",cursor:"crosshair",display:"block",margin:"0 auto"}}onClick={pickWheel}/>
        <div style={{marginTop:5,display:"flex",gap:5,alignItems:"center"}}>
          <input type="color"value={customHex}onChange={e=>{setCustomHex(e.target.value);setColor(e.target.value)}}style={{width:26,height:26,padding:0,border:`1px solid ${useBrushGrid?COLORS.panelBorder:T.border}`,borderRadius:5,cursor:"pointer"}}/>
          <input value={customHex}onChange={e=>{setCustomHex(e.target.value);if(/^#[0-9a-f]{6}$/i.test(e.target.value))setColor(e.target.value)}}style={{flex:1,padding:"4px 6px",borderRadius:7,border:`1px solid ${useBrushGrid?COLORS.panelBorder:T.border}`,background:useBrushGrid?COLORS.toolbar:T.bg,color:useBrushGrid?COLORS.text:T.ink,fontSize:10,outline:"none",fontFamily:"monospace"}}/>
        </div>
      </div>}
      <div>
        {useBrushGrid?<GoodNotesSectionLabel>Surligneur</GoodNotesSectionLabel>:<div style={{fontSize:8,color:T.muted,marginBottom:3}}>SURLIGNEUR</div>}
        <select value={hPal}onChange={e=>setHPal(e.target.value)}style={{width:"100%",padding:"6px 8px",borderRadius:8,border:`1px solid ${useBrushGrid?COLORS.panelBorder:T.border}`,background:useBrushGrid?COLORS.toolbar:T.bg,color:useBrushGrid?COLORS.text:T.ink,fontSize:11,outline:"none",cursor:"pointer",marginBottom:6}}>
          {Object.keys(HPAL).map(p=><option key={p}value={p}>{p}</option>)}
        </select>
        <div style={{display:"flex",gap:4}}>{HPAL[hPal].map(c=><button key={c}onClick={()=>{setColor(c);setTool("highlight")}}style={{width:20,height:20,borderRadius:4,background:c+"aa",border:`2px solid ${color===c&&tool==="highlight"?(useBrushGrid?COLORS.accent:T.accent):"transparent"}`,cursor:"pointer",flexShrink:0}}/>)}</div>
      </div>
      <div>
        {useBrushGrid?<GoodNotesSectionLabel>Gomme</GoodNotesSectionLabel>:<div style={{fontSize:8,color:T.muted,marginBottom:3}}>TAILLE GOMME</div>}
        {useBrushGrid?(
          <GoodNotesSlider value={eraserMm} min={0.5} max={30} step={0.5} label="Taille gomme" onChange={v=>{setEraserMm(v);setTool("eraser")}}/>
        ):(
          <div style={{display:"flex",flexWrap:"wrap",gap:3}}>{ERASER_SIZES_MM.map(s=><button key={s}onClick={()=>{setEraserMm(s);setTool("eraser")}}style={{padding:"2px 5px",borderRadius:5,border:`1px solid ${eraserMm===s&&isEraser?T.accent:T.border}`,background:eraserMm===s&&isEraser?`${T.accent}18`:T.bg,color:eraserMm===s&&isEraser?T.accent:T.muted,cursor:"pointer",fontSize:8,fontFamily:"monospace"}}>{s}</button>)}</div>
        )}
      </div>
      {isShapeTool&&shapeStyle&&setShapeStyle&&(
        <div style={{borderTop:`1px solid ${useBrushGrid?COLORS.separator:T.border}`,paddingTop:10,display:"flex",flexDirection:"column",gap:8}}>
          <GoodNotesSectionLabel>Formes / bulles</GoodNotesSectionLabel>
          <label style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:useBrushGrid?COLORS.text:T.ink,cursor:"pointer"}}>
            <input type="checkbox"checked={shapeStyle.useFill!==false}onChange={e=>setShapeStyle(s=>({...s,useFill:e.target.checked}))}/>
            Remplissage
          </label>
          <GoodNotesSlider value={shapeStyle.fillOpacity??0.22} min={0} max={1} step={0.05} label="Fill opac." onChange={v=>setShapeStyle(s=>({...s,fillOpacity:v}))}/>
          {tool==="cloud"&&(
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
              {[["round","Arrondi"],["sharp","Carré"],["speech","Bulle"]].map(([id,l])=>(
                <button key={id}type="button"onClick={()=>setShapeStyle(s=>({...s,bubbleStyle:id}))}style={{padding:"4px 8px",borderRadius:6,border:`1px solid ${shapeStyle.bubbleStyle===id?COLORS.accent:COLORS.panelBorder}`,background:shapeStyle.bubbleStyle===id?`${COLORS.accent}18`:COLORS.toolbar,color:shapeStyle.bubbleStyle===id?COLORS.accent:COLORS.textSecondary,fontSize:10,cursor:"pointer"}}>{l}</button>
              ))}
            </div>
          )}
        </div>
      )}
      {isTextTool&&setCanvasTextFont&&(
        <div style={{borderTop:`1px solid ${COLORS.separator}`,paddingTop:10,display:"flex",flexDirection:"column",gap:8}}>
          <GoodNotesSectionLabel>Police texte</GoodNotesSectionLabel>
          <TextFontPicker T={useBrushGrid?GN_T:T} value={canvasTextFont} onChange={setCanvasTextFont}/>
        </div>
      )}
      <div>
        <GoodNotesSectionLabel>Favoris</GoodNotesSectionLabel>
        <div style={{fontSize:9,color:COLORS.textSecondary,marginBottom:6}}>Clic: charger · dbl-clic: sauvegarder</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{Array.from({length:FAVORITE_SLOTS},(_,i)=>{const fav=favorites[i];return<button key={i}onClick={()=>loadFav(fav)}onDoubleClick={()=>saveFav(i)}title={fav?`${fav.label||""} ${fav.tool} ${fav.color} ${formatDimension(fav.sizeMm,unitSys)}`:"Dbl-clic sauvegarder"}style={{width:28,height:28,borderRadius:8,background:fav?fav.color:COLORS.toolbar,border:`1px solid ${fav?COLORS.accent:COLORS.panelBorder}`,cursor:"pointer",fontSize:fav?"0":"12",color:COLORS.textSecondary,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{!fav&&"+"}</button>})}</div>
      </div>
    </div>
  )
}

function GoodNotesPropsPanel({color,setColor,sizeMm,setSizeMm,tool,setTool,eraserMm,setEraserMm,favorites,setFavorites,unitSys,shapeStyle,setShapeStyle,canvasTextFont,setCanvasTextFont,onClose}){
  return(
    <div style={{width:240,flexShrink:0,background:COLORS.panelBg,borderLeft:`1px solid ${COLORS.panelBorder}`,display:"flex",flexDirection:"column",overflow:"hidden",zIndex:10}}>
      <div style={{height:44,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 12px",borderBottom:`1px solid ${COLORS.panelBorder}`}}>
        <span style={{fontSize:13,fontWeight:600,color:COLORS.text}}>Propriétés</span>
        <button type="button" onClick={onClose} style={{background:"none",border:"none",color:COLORS.textSecondary,cursor:"pointer",padding:2,display:"flex"}}><PanelRight size={18}/></button>
      </div>
      <PropertiesPanelContent T={GN_T} color={color} setColor={setColor} sizeMm={sizeMm} setSizeMm={setSizeMm} tool={tool} setTool={setTool} eraserMm={eraserMm} setEraserMm={setEraserMm} favorites={favorites} setFavorites={setFavorites} unitSys={unitSys} shapeStyle={shapeStyle} setShapeStyle={setShapeStyle} canvasTextFont={canvasTextFont} setCanvasTextFont={setCanvasTextFont} useBrushGrid/>
    </div>
  )
}

function GoodNotesLibraryDrawer({open,onClose,T,libMode,setLibMode,libSearch,setLibSearch,libCat,setLibCat,libCats,libItems,libPending,setLibPending,showNewProfile,setShowNewProfile,addCustomProfile,addNotification,getLibForMode,customProfiles,removeCustomProfile,setPlaced,toPageCoords,pushAction,scheduleSave,renderEl,renderSym}){
  if(!open)return null
  return(
    <>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,.45)",zIndex:40}}/>
      <div style={{position:"absolute",top:0,left:0,bottom:0,width:300,background:COLORS.panelBg,borderRight:`1px solid ${COLORS.panelBorder}`,zIndex:41,display:"flex",flexDirection:"column",boxShadow:"4px 0 24px rgba(0,0,0,.4)"}}>
        <div style={{height:44,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 12px",borderBottom:`1px solid ${COLORS.panelBorder}`}}>
          <span style={{fontSize:14,fontWeight:600,color:COLORS.text}}>Bibliothèque</span>
          <button type="button" onClick={onClose} style={{background:"none",border:"none",color:COLORS.textSecondary,cursor:"pointer",padding:2,display:"flex"}}><X size={18}/></button>
        </div>
        <div style={{display:"flex",borderBottom:`1px solid ${COLORS.panelBorder}`,flexShrink:0}}>
          {[["metric","📏 mm"],["imperial","📐 in"],["symbols","🏠 Sym."]].map(([m,l],i,arr)=>(
            <button key={m} type="button" onClick={()=>{setLibMode(m);setLibSearch("");setLibCat(Object.keys(getLibForMode(m))[0]||"")}}
              style={{flex:1,padding:"8px 0",border:"none",background:libMode===m?`${COLORS.accent}18`:COLORS.toolbar,color:libMode===m?COLORS.accent:COLORS.textSecondary,cursor:"pointer",fontSize:11,fontWeight:libMode===m?600:400,borderRight:i<arr.length-1?`1px solid ${COLORS.panelBorder}`:"none"}}>{l}</button>
          ))}
        </div>
        <div style={{padding:"6px 10px",borderBottom:`1px solid ${COLORS.panelBorder}`}}>
          <input value={libSearch} onChange={e=>setLibSearch(e.target.value)} placeholder="Chercher…" style={{width:"100%",padding:"6px 10px",borderRadius:8,border:`1px solid ${COLORS.panelBorder}`,fontSize:11,outline:"none",background:COLORS.toolbar,color:COLORS.text,boxSizing:"border-box"}}/>
        </div>
        <div style={{padding:"6px 10px",borderBottom:`1px solid ${COLORS.panelBorder}`,display:"flex",gap:6,flexShrink:0}}>
          <button type="button" onClick={()=>setShowNewProfile(v=>!v)} style={{flex:1,padding:"6px 0",borderRadius:8,border:`1px solid ${showNewProfile?COLORS.accent:COLORS.panelBorder}`,background:showNewProfile?`${COLORS.accent}12`:COLORS.toolbar,color:showNewProfile?COLORS.accent:COLORS.textSecondary,cursor:"pointer",fontSize:10,fontWeight:600}}>+ Profil perso</button>
        </div>
        {showNewProfile&&(
          <CustomProfileForm T={T} onCancel={()=>setShowNewProfile(false)} onSave={p=>{addCustomProfile(p);setLibCat("⭐ Mes profils");setShowNewProfile(false);addNotification(`Profil « ${p.name} » ajouté`,"success")}}/>
        )}
        <div style={{overflowX:"auto",borderBottom:`1px solid ${COLORS.panelBorder}`,flexShrink:0}}>
          <div style={{display:"flex",gap:4,padding:"6px 8px",whiteSpace:"nowrap"}}>
            {libCats.map(c=><button key={c} type="button" onClick={e=>{e.stopPropagation();setLibCat(c);setLibPending(null)}} style={{padding:"3px 8px",borderRadius:10,border:`1px solid ${libCat===c?COLORS.accent:COLORS.panelBorder}`,background:libCat===c?`${COLORS.accent}15`:COLORS.toolbar,color:libCat===c?COLORS.accent:COLORS.textSecondary,fontSize:9,cursor:"pointer",whiteSpace:"nowrap"}}>{c}</button>)}
          </div>
        </div>
        <div style={{padding:"4px 10px",borderBottom:`1px solid ${COLORS.panelBorder}`,background:`${COLORS.accent}08`,flexShrink:0}}>
          <div style={{fontSize:9,color:COLORS.textSecondary,textAlign:"center"}}>{libPending?`📍 Clic feuille → "${libPending.l}"`:"Clic = sélect · glisser aussi"}</div>
        </div>
        <div style={{padding:6,display:"flex",flexDirection:"column",gap:4,flex:1,minHeight:0,overflow:"auto"}}>
          {libItems.length===0?(
            <div style={{padding:"24px 12px",textAlign:"center",color:COLORS.textSecondary,fontSize:11,lineHeight:1.5}}>
              {libSearch?`Aucun objet pour « ${libSearch} ».`:"Aucun objet dans cette catégorie."}
            </div>
          ):libItems.map(el=>(
            <div key={el.id} onClick={()=>setLibPending(libPending?.id===el.id?null:el)} draggable
              onDragEnd={e=>{const r=document.getElementById("canvas-area")?.getBoundingClientRect();if(!r)return;const sc=3.78/50,elW=(el.fw||el.w)*sc,elH=el.h*sc;const pt=toPageCoords(e.clientX-r.left,e.clientY-r.top,r.width,r.height);setPlaced(p=>[...p,{id:Date.now(),el,x:Math.max(0,pt.x-elW/2),y:Math.max(0,pt.y-elH/2)}]);pushAction({type:"element_placed",detail:el.l});setLibPending(null);scheduleSave()}}
              style={{padding:"6px 8px",borderRadius:8,border:`1px solid ${libPending?.id===el.id?COLORS.accent:COLORS.panelBorder}`,background:libPending?.id===el.id?`${COLORS.accent}10`:COLORS.toolbar,cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:32,height:32,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>{el.type==="sym"?renderSym(el,1/300):renderEl(el,1/300)}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:10,fontWeight:600,color:COLORS.text,lineHeight:1.2}}>{el.l}</div>
                <div style={{fontSize:8,color:COLORS.textSecondary,fontFamily:"monospace",marginTop:1}}>{el.w}×{el.h}mm</div>
              </div>
              {el.custom&&<button type="button" onClick={e=>{e.stopPropagation();const profile=customProfiles.find(p=>customProfileToLibEntry(p).id===el.id);if(profile)removeCustomProfile(profile.id)}} title="Supprimer" style={{background:"none",border:"none",color:COLORS.destructive,cursor:"pointer",fontSize:12,padding:"0 4px"}}>×</button>}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

/* ══ FLOATING PANEL ══════════════════════════════════ */
function FloatingPanel({T,color,setColor,sizeMm,setSizeMm,tool,setTool,eraserMm,setEraserMm,favorites,setFavorites,unitSys,shapeStyle,setShapeStyle,canvasTextFont,setCanvasTextFont,focusMode,open=true,collapsed=false,onClose,onExpand,dock=false}){
  if(focusMode||!open)return null
  if(dock)return null
  const isEraser=tool==="eraser"
  return(
    <DraggablePanel
      T={T}
      id="editor-properties"
      title="Outils & couleurs"
      open
      collapsed={collapsed}
      onExpand={onExpand}
      onClose={onClose}
      defaultSide="left"
      width={220}
      zIndexOffset={2}
      collapsedPreview={(
        <div className="forma-animate-scale" style={{width:36,height:36,borderRadius:"50%",background:isEraser?"#eee":color,border:"2px solid rgba(255,255,255,.55)",boxShadow:TOKENS.shadow.float,cursor:"pointer",outline:`2px solid ${T.accent}`,backdropFilter:"blur(8px)"}}/>
      )}
      headerExtra={(
        <div style={{display:"flex",gap:4,alignItems:"center"}}>
          <div style={{width:10,height:10,borderRadius:"50%",background:isEraser?"#eee":color,border:`1px solid ${T.border}`}}/>
          <span style={{fontSize:8,color:T.muted,fontFamily:"monospace"}}>{formatDimension(isEraser?eraserMm:sizeMm,unitSys)}</span>
        </div>
      )}
    >
      <PropertiesPanelContent T={T} color={color} setColor={setColor} sizeMm={sizeMm} setSizeMm={setSizeMm} tool={tool} setTool={setTool} eraserMm={eraserMm} setEraserMm={setEraserMm} favorites={favorites} setFavorites={setFavorites} unitSys={unitSys} shapeStyle={shapeStyle} setShapeStyle={setShapeStyle} canvasTextFont={canvasTextFont} setCanvasTextFont={setCanvasTextFont} onExpand={onExpand}/>
    </DraggablePanel>
  )
}

/* ══ PAGE THUMBNAIL ═══════════════════════════════════ */
function PageThumbnail({pageData,pageNum,current,T,onClick,onMenu,notebookTemplate,compact,mini}){
  const ref=useRef()
  const meta=parsePageElements(pageData?.elements,notebookTemplate)
  const label=pageDisplayName(pageNum,meta)
  const rotation=meta.rotation??0
  const cw=mini?36:compact?100:100
  const ch=mini?48:compact?141:141
  const dw=mini?36:compact?80:80
  const dh=mini?48:compact?113:113
  useEffect(()=>{
    if(!ref.current||!pageData)return
    const canvas=ref.current
    const ctx=canvas.getContext("2d")
    const drawStrokes=()=>{
      if(!meta.bgImage){
        ctx.fillStyle=meta.pageColor||"#fff"
        ctx.fillRect(0,0,100,141)
      }
      if(pageData.canvas_data){
        try{
          const strokes=typeof pageData.canvas_data==="string"?JSON.parse(pageData.canvas_data):pageData.canvas_data||[]
          const sc=100/794
          strokes.forEach(s=>{
            if(!s.pts&&!s.text)return
            if(s.shapeType==="text"||s.tool==="text"){
              const fs=Math.max((s.size||4)*3,14)*sc
              ctx.font=`${fs}px ${canvasFontCss(s.fontFamily)}`
              ctx.fillStyle=s.color||"#000"
              ctx.globalAlpha=s.opacity??1
              ctx.textBaseline="alphabetic"
              ctx.fillText(s.text||"",(s.pts?.[0]?.x||0)*sc,(s.pts?.[0]?.y||0)*sc)
              ctx.globalAlpha=1
              return
            }
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
    }
    if(meta.bgImage){
      const img=new Image()
      img.onload=()=>{
        ctx.fillStyle=meta.pageColor||"#fff"
        ctx.fillRect(0,0,100,141)
        ctx.globalAlpha=meta.bgImageOpacity??1
        ctx.drawImage(img,0,0,100,141)
        ctx.globalAlpha=1
        drawStrokes()
      }
      img.onerror=drawStrokes
      img.src=meta.bgImage
    }else{
      drawStrokes()
    }
  },[pageData,meta.pageColor,meta.bgImage,meta.bgImageOpacity,rotation])
  if(mini){
    return(
      <div onClick={onClick} style={{width:"100%",height:"100%",cursor:"pointer",position:"relative"}}>
        <canvas ref={ref} width={100} height={141} style={{display:"block",width:"100%",height:"100%",objectFit:"cover"}}/>
        <button type="button" onClick={e=>{e.stopPropagation();onMenu?.(e,pageNum)}} style={{position:"absolute",top:1,right:1,width:14,height:14,borderRadius:3,border:"none",background:"rgba(0,0,0,.5)",color:C.text,cursor:"pointer",fontSize:8,lineHeight:1,padding:0}}>···</button>
      </div>
    )
  }
  return(
    <div style={{position:"relative",padding:compact?2:4,borderRadius:8,border:`2px solid ${current?T.accent:T.border}`,background:current?`${T.accent}10`:T.bg,transition:"all .15s"}}>
      <div onClick={onClick}style={{cursor:"pointer"}}>
        <div style={{
          width:dw,height:dh,margin:"0 auto",
          display:"flex",alignItems:"center",justifyContent:"center",
          transform:rotation?`rotate(${rotation}deg)`:"none",
          transformOrigin:"center center",
        }}>
          <canvas ref={ref}width={100}height={141}style={{display:"block",width:dw,height:dh,borderRadius:4}}/>
        </div>
        {!compact&&<div style={{fontSize:8,color:current?T.accent:T.muted,textAlign:"center",marginTop:3,fontFamily:"var(--app-font)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:84}}title={label}>{label}</div>}
        {compact&&<div style={{fontSize:12,color:C.muted,textAlign:"center",marginTop:4,display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>{pageNum}<ChevronDown size={12}/></div>}
      </div>
      <button type="button"onClick={e=>{e.stopPropagation();onMenu?.(e,pageNum)}}title="Options page"style={{position:"absolute",top:2,right:2,width:18,height:18,borderRadius:4,border:`1px solid ${T.border}`,background:T.surface||C.panel,color:T.muted,cursor:"pointer",fontSize:10,lineHeight:1,padding:0}}>⋯</button>
    </div>
  )
}

function EraserOptionsPanel({T,settings,setSettings,unitSys,formatDimension}){
  const sizeMm=settings.sizeMm
  const setSizeMm=v=>setSettings(s=>({...s,sizeMm:typeof v==="function"?v(s.sizeMm):v}))
  return(
    <div style={{padding:"8px 10px",userSelect:"none"}}>
      <div style={{fontSize:9,fontWeight:700,color:T.accent,marginBottom:6}}>GOMME</div>
      <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:8}}>
        {ERASER_MODES.map(m=>(
          <button key={m.id}type="button"onClick={()=>setSettings(s=>({...s,mode:m.id}))}title={m.desc}style={{padding:"5px 8px",borderRadius:7,border:`1px solid ${settings.mode===m.id?T.accent:T.border}`,background:settings.mode===m.id?`${T.accent}18`:T.bg,color:settings.mode===m.id?T.accent:T.ink,cursor:"pointer",fontSize:9,textAlign:"left"}}>
            {m.label}
          </button>
        ))}
      </div>
      <div style={{fontSize:8,color:T.muted,marginBottom:4}}>TAILLE</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:3,marginBottom:6}}>
        {ERASER_SIZES_MM.map(s=><button key={s}type="button"onClick={()=>setSizeMm(s)}style={{padding:"2px 5px",borderRadius:5,border:`1px solid ${sizeMm===s?T.accent:T.border}`,background:sizeMm===s?`${T.accent}18`:T.bg,color:sizeMm===s?T.accent:T.muted,cursor:"pointer",fontSize:8,fontFamily:"monospace"}}>{s}</button>)}
      </div>
      <input type="range"min={1}max={20}step={0.5}value={sizeMm}onChange={e=>setSizeMm(parseFloat(e.target.value))}style={{width:"100%",accentColor:T.accent}}/>
      <div style={{fontSize:8,color:T.muted,textAlign:"center",marginTop:4,fontFamily:"monospace"}}>{formatDimension(sizeMm,unitSys)}</div>
    </div>
  )
}

/* ══ MODALS ═══════════════════════════════════════════ */
function ThemePicker({current,onChange,onClose}){
  const [draftId,setDraftId]=useState(current?.id||THEMES[0]?.id)
  const draft=THEMES.find(t=>t.id===draftId)||THEMES[0]
  const T=current||draft
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}}>
      <div className="forma-animate-in" style={{...glassStyle(T,{variant:"modal"}),padding:22,width:560,maxWidth:"94vw",maxHeight:"82vh",overflowY:"auto"}}>
        <div style={{position:"relative",marginBottom:14}}>
          <button onClick={onClose}style={{position:"absolute",top:0,right:0,background:"none",border:"none",cursor:"pointer",fontSize:22,color:T.muted,padding:"2px 6px",zIndex:1}}>×</button>
          <BrandLogo src={draft.img} alt={draft.n} size="md" subtitle={`FTheme (${THEMES.length})`} accent={draft.accent} ink={T.ink} muted={T.muted}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:9}}>
          {THEMES.map(th=>(
            <ThemePreviewThumb key={th.id} theme={th} selected={draftId===th.id} onSelect={()=>{setDraftId(th.id);onChange(th);onClose()}} selectedLabel="✓"/>
          ))}
        </div>
      </div>
    </div>
  )
}

function PageSettingsBody({T,pageColor,setPageColor,gridColor,setGridColor,gridStyle,setGridStyle,pageFormat,customMm,onFormatChange,onClose}){
  return(
    <div style={{padding:"12px 14px 16px",display:"flex",flexDirection:"column",gap:14}}>
      <div>
        <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:7}}>FORMAT DE PAGE</div>
        <PageFormatPicker T={T} format={pageFormat} customMm={customMm} onChange={onFormatChange} />
      </div>
      <div>
        <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:7}}>GRILLE / PAPIER</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:5}}>{GRID_STYLES.map(g=><button key={g.id}type="button"onClick={()=>setGridStyle(g.id)}title={g.desc}style={{padding:"4px 8px",borderRadius:7,border:`1px solid ${gridStyle===g.id?T.accent:T.border}`,background:gridStyle===g.id?`${T.accent}18`:T.bg,color:gridStyle===g.id?T.accent:T.ink,cursor:"pointer",fontSize:9}}>{g.label}</button>)}</div>
      </div>
      <div>
        <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:7}}>FOND</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:7}}>{PAGE_COLORS.map(pc=><button key={pc.id}onClick={()=>setPageColor(pc.c)}title={pc.l}style={{width:34,height:34,borderRadius:8,background:pc.c,border:`2px solid ${pageColor===pc.c?T.accent:T.border}`,cursor:"pointer",outline:pc.c==="#ffffff"?`1px solid ${T.border}`:"none"}}/>)}</div>
      </div>
      <div>
        <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:7}}>QUADRILLAGE</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:7}}>{GRID_COLORS.map(gc=><button key={gc.id}onClick={()=>setGridColor(gc.c)}title={gc.l}style={{width:34,height:34,borderRadius:8,background:"#fff",border:`2px solid ${gridColor===gc.c?T.accent:T.border}`,cursor:"pointer",position:"relative",overflow:"hidden"}}><svg width={34}height={34}style={{position:"absolute",inset:0}}>{[6,14,22,30].map(x=><line key={`v${x}`}x1={x}y1={0}x2={x}y2={34}stroke={gc.c}strokeWidth={1}/>)}{[6,14,22,30].map(y=><line key={`h${y}`}x1={0}y1={y}x2={34}y2={y}stroke={gc.c}strokeWidth={1}/>)}</svg></button>)}</div>
      </div>
      <button type="button" onClick={onClose} style={{width:"100%",padding:11,borderRadius:10,background:T.accent,border:"none",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer"}}>Appliquer ✓</button>
    </div>
  )
}

/* ══ MAIN EDITOR ══════════════════════════════════════ */
export default function EditorPage(){
  const navigate=useNavigate()
  const { id: routeNotebookId } = useParams()
  const{activeNotebook,updateNotebook,setActiveNotebook,setTheme,canvasTextFont,setCanvasTextFont,addNotification,pendingFormulaNote,setPendingFormulaNote,pendingSpreadsheetInsert,setPendingSpreadsheetInsert,pendingDocInsert,setPendingDocInsert,notebooks,customProfiles,addCustomProfile,removeCustomProfile}=useAppStore()
  const{ T }=useTheme()
  const { user } = useAuth()
  const collab = useCollaboration()
  useEffect(()=>{ensureCanvasTextFontsLoaded()},[])
  useEffect(()=>{preloadCanvasFont(canvasTextFont)},[canvasTextFont])
  const nb=activeNotebook||{id:"1",title:"Carnet",subject:"arch",template:"plan",pages_count:1}

  useEffect(()=>{
    if(!routeNotebookId)return
    if(activeNotebook?.id===routeNotebookId)return
    let cancelled=false
    const loadNb=async()=>{
      const local=getLocalNotebook(routeNotebookId)
      if(local&&!cancelled){setActiveNotebook(local);return}
      try{
        const{data:{session}}=await supabase.auth.getSession()
        if(session?.user){
          const{data}=await supabase.from("notebooks").select("*").eq("id",routeNotebookId).single()
          if(!cancelled&&data){setActiveNotebook(data);return}
        }
      }catch{/* ignore */}
      if(!cancelled)navigate("/",{replace:true})
    }
    loadNb()
    return()=>{cancelled=true}
  },[routeNotebookId,activeNotebook,setActiveNotebook,navigate])
  const cRef=useRef()

  const[tool,setTool]=useState("pen")
  const[color,setColor]=useState("#1c1c24")
  const[sizeMm,setSizeMm]=useState(0.5)
  const[favorites,setFavorites]=useState(()=>loadFavorites())
  useEffect(()=>{saveFavorites(favorites)},[favorites])
  const[eraserSettings,setEraserSettings]=useState(()=>loadEraserSettings())
  useEffect(()=>{saveEraserSettings(eraserSettings)},[eraserSettings])
  const setEraserMm=useCallback(v=>setEraserSettings(s=>({...s,sizeMm:typeof v==="function"?v(s.sizeMm):v})),[])
  const eraserMm=eraserSettings.sizeMm
  const[selectedObjects,setSelectedObjects]=useState({placed:[],images:[]})
  const[pageMenu,setPageMenu]=useState(null)
  const[rulerPos,setRulerPos]=useState({x:40,y:40})
  const rulerPosRef=useRef(rulerPos)
  useEffect(()=>{rulerPosRef.current=rulerPos},[rulerPos])
  const[rulerDrag,setRulerDrag]=useState(null)
  const[rulerRotation,setRulerRotation]=useState(0)
  const[rulerLocked,setRulerLocked]=useState(false)
  const[eraserCursor,setEraserCursor]=useState(null)
  const[unitSys,setUnitSys]=useState("metric")
  const[scale,setScale]=useState("1:50")
  const[showLib,setShowLib]=useState(false)
  const[libMode,setLibMode]=useState("metric")
  const[libCat,setLibCat]=useState("🪵 Bois Montants")
  const[libSearch,setLibSearch]=useState("")
  const[libPending,setLibPending]=useState(null)
  const[showNewProfile,setShowNewProfile]=useState(false)
  const[pageBgImage,setPageBgImage]=useState(null)
  const[pageBgOpacity,setPageBgOpacity]=useState(1)
  const pagePhotoInputRef=useRef(null)
  const[mousePos,setMousePos]=useState({x:0,y:0})
  const[placed,setPlaced]=useState([])
  const[selected,setSelected]=useState(null)
  const[pages,setPages]=useState([]) // all pages data
  const[page,setPage]=useState(1)
  const[showPagePanel,setShowPagePanel]=useState(false) // thumbnails
  const[showLayers,setShowLayers]=useState(false)
  const[layers,setLayers]=useState(()=>DEFAULT_LAYERS.map(l=>({...l})))
  const[activeLayerId,setActiveLayerId]=useState(()=>defaultActiveLayerId())
  const[renamingLayer,setRenamingLayer]=useState(null)
  const[renameVal,setRenameVal]=useState("")
  const[dragLayerIdx,setDragLayerIdx]=useState(null)
  const[showPageSettings,setShowPageSettings]=useState(false)
  const[pageColor,setPageColor]=useState(null)
  const[gridColor,setGridColor]=useState(null)
  const[showShare,setShowShare]=useState(false)
  const[showRuler,setShowRuler]=useState(false)
  const[showProt,setShowProt]=useState(false)
  const[pageId,setPageId]=useState(null)
  const[pencilOnly,setPencilOnly]=useState(()=>{
    try{
      const stored=localStorage.getItem("forma_pencil_only")
      if(stored!==null)return stored!=="0"
    }catch{}
    return typeof window!=="undefined"&&("ontouchstart"in window||navigator.maxTouchPoints>0)
  })
  const penTapRef=useRef({t:0,x:0,y:0})
  const[importedImages,setImportedImages]=useState([])
  const[exporting,setExporting]=useState(false)
  const[readOnly,setReadOnly]=useState(false)
  const[readOnlyLocked,setReadOnlyLocked]=useState(false)
  const[sharePermission,setSharePermission]=useState(null)
  const[photoInsertPending,setPhotoInsertPending]=useState(null)
  const[showPresent,setShowPresent]=useState(false) // presentation mode
  const[focusMode,setFocusMode]=useState(false)
  const[canvasSelection,setCanvasSelection]=useState(null)
  const[shapeStyle,setShapeStyle]=useState({useFill:true,fill:null,fillOpacity:0.22,opacity:1,rotation:0,bubbleStyle:"round"})
  const[textEdit,setTextEdit]=useState(null)
  const[showCalc,setShowCalc]=useState(false)
  const[showTimer,setShowTimer]=useState(false)
  const[showConv,setShowConv]=useState(false)
  const[showTranslate,setShowTranslate]=useState(false)
  const[showDictation,setShowDictation]=useState(false)
  const calc=useCalculator()
  const[convValue,setConvValue]=useState("")
  const[convCategory,setConvCategory]=useState("length")
  const[convFromUnit,setConvFromUnit]=useState("mm")
  const[convToUnit,setConvToUnit]=useState("m")
  const[timerSec,setTimerSec]=useState(25*60)
  const[timerRunning,setTimerRunning]=useState(false)
  const[timerMode,setTimerMode]=useState("work")
  const timerRef=useRef(null)
  const[showFlash,setShowFlash]=useState(false)
  const[flashCards,setFlashCards]=useState([])
  const[flashQ,setFlashQ]=useState("")
  const[flashA,setFlashA]=useState("")
  const[flashReview,setFlashReview]=useState(false)
  const[flashIdx,setFlashIdx]=useState(0)
  const[flashFlipped,setFlashFlipped]=useState(false)
  const[pageHistory,setPageHistory]=useState([]) // [{ts, label, data, elements}]
  const[showHistory,setShowHistory]=useState(false)
  const[actionLog,setActionLog]=useState([])
  const[showToolsToolbar,setShowToolsToolbar]=useState(true)
  const[toolbarDock,setToolbarDock]=useState('top')
  const[showPropsPanel,setShowPropsPanel]=useState(true)
  const[propsCollapsed,setPropsCollapsed]=useState(true)
  const[saveIndicatorVisible,setSaveIndicatorVisible]=useState(true)
  const[showEraserPanel,setShowEraserPanel]=useState(false)
  const[toolPopup,setToolPopup]=useState(null)
  const[showSearchPanel,setShowSearchPanel]=useState(false)
  const[lassoType,setLassoType]=useState("free")
  const[lassoInclude,setLassoInclude]=useState({handwriting:true,images:true,shapes:true,arrows:true,text:true,equations:true})
  const[textToolToast,setTextToolToast]=useState(true)
  const[canUndo,setCanUndo]=useState(false)
  const[canRedo,setCanRedo]=useState(false)
  const activePointersRef=useRef(new Map())
  const pinchRef=useRef({dist:null,lastMid:null})
  const pinchModeRef=useRef(false)
  const[infiniteMode,setInfiniteMode]=useState(false)
  useEffect(()=>{if(tool==="eraser")setShowEraserPanel(true)},[tool])
  const[pageFormat,setPageFormat]=useState("a4")
  const[nextPageFmt,setNextPageFmt]=useState("a4")
  const[nextPageCustomMm,setNextPageCustomMm]=useState({w:210,h:297})
  const[pageRotation,setPageRotation]=useState(0)
  const[customPageMm,setCustomPageMm]=useState({w:210,h:297})
  const[pageGridStyle,setPageGridStyle]=useState(()=>defaultGridStyle("plan"))
  const[pageName,setPageName]=useState("")
  const[viewSize,setViewSize]=useState({w:0,h:0})
  const[canvasRevision,setCanvasRevision]=useState(0)
  const[showEditorSidebar,setShowEditorSidebar]=useState(false)
  const isTablet=useTabletLayout()

  const sizePx=mm2px(sizeMm)
  const eraserPx=mm2px(eraserMm)
  const placedRef=useRef(placed)
  const importedRef=useRef(importedImages)
  const skipPageLoadRef=useRef(false)
  const addingPageRef=useRef(false)
  const formulaNoteInsertedRef=useRef(false)
  const spreadsheetInsertedRef=useRef(false)
  const docInsertedRef=useRef(false)
  const saveNowRef=useRef(()=>{})
  const scheduleSaveRef=useRef(()=>{})
  const goToPageRef=useRef(async()=>{})
  const lastFitKeyRef=useRef("")
  useEffect(()=>{ placedRef.current = placed }, [placed])
  useEffect(()=>{ importedRef.current = importedImages }, [importedImages])
  useEffect(()=>{
    const el=document.getElementById("canvas-area")
    if(!el)return
    const sync=()=>setViewSize({w:el.clientWidth,h:el.clientHeight})
    sync()
    const ro=new ResizeObserver(()=>sync())
    ro.observe(el)
    return()=>ro.disconnect()
  },[])

  const pointInRect=(p,rx,ry,rw,rh)=>p.x>=rx&&p.x<=rx+rw&&p.y>=ry&&p.y<=ry+rh

  const eraseObjectsAt = useCallback((p, r) => {
    if(!p) return
    let changed = false
    const hitR = Math.max(r, 2)
    // Imported images (absolute page coords) — auto mode: centre du curseur dans l'objet
    const imgs = importedRef.current || []
    if(imgs.length){
      const hitIds = imgs.filter(img => pointInRect(p, img.x, img.y, img.w, img.h)).map(i => i.id)
      if(hitIds.length){
        setImportedImages(cur => cur.filter(i => !hitIds.includes(i.id)))
        changed = true
      }
    }

    // Structural elements — idem, pas de suppression au simple survol proche
    const els = placedRef.current || []
    if(els.length){
      const hitIds = els.filter(it => {
        const { w, h } = getPlacedSize(it)
        return pointInRect(p, it.x, it.y, w, h)
      }).map(i => i.id)
      if(hitIds.length){
        setPlaced(cur => cur.filter(it => !hitIds.includes(it.id)))
        if(selected && hitIds.includes(selected)) setSelected(null)
        changed = true
      }
    }
    if (changed) scheduleSaveRef.current?.()
  }, [selected])
  const pageDims=resolvePageDimensions(pageFormat,customPageMm,0)
  const PW=infiniteMode?3000:pageDims.w
  const PH=infiniteMode?3000:pageDims.h
  const rotLayout=useMemo(()=>(
    infiniteMode
      ? { boxW: PW, boxH: PH, offsetX: 0, offsetY: 0, rotation: 0 }
      : computeRotatedBounds(PW, PH, pageRotation)
  ),[PW,PH,pageRotation,infiniteMode])
  const displayW=infiniteMode?PW:rotLayout.boxW
  const displayH=infiniteMode?PH:rotLayout.boxH
  const pagesCount=useMemo(()=>Math.max(nb.pages_count||1,pages.length||1),[nb.pages_count,pages.length])

  const editorToolIds=useMemo(()=>flattenEditorTools(EDITOR_TOOLS_LIST),[])
  const swipeToolCycle=useSwipeToolCycle({
    enabled:isTablet&&!readOnly&&!libPending&&tool!=="hand",
    toolIds:editorToolIds,
    tool,
    setTool,
    onCycle:(nextId)=>{
      const label=EDITOR_TOOLS_LIST.flatMap((g)=>g.items).find((t)=>t.id===nextId)?.l
      if(label)addNotification(label,"info")
    },
  })

  const onRemotePageUpdate=useCallback((updatedPage)=>{
    if(!updatedPage?.page_number)return
    setPages((prev)=>prev.map((p)=>(p.id===updatedPage.id?updatedPage:p)))
    if(updatedPage.page_number===page){
      addNotification("Page mise à jour par un collaborateur","info")
    }
  },[page,addNotification])

  const notebookCollab=useNotebookCollab({
    notebookId:nb.id,
    notebookOwnerId:nb.user_id,
    userId:user?.id,
    userName:collab.profile?.display_name||user?.email||"?",
    userColor:color,
    onRemotePageUpdate,
  })

  useEffect(()=>{
    setReadOnlyLocked(notebookCollab.forcedReadOnly)
    setSharePermission(notebookCollab.permission)
    if(notebookCollab.forcedReadOnly)setReadOnly(true)
  },[notebookCollab.forcedReadOnly,notebookCollab.permission])

  const selectedPlacedItem=useMemo(()=>{
    if(readOnly) return null
    const ids=selectedObjects.placed.length?selectedObjects.placed:(selected?[selected]:[])
    if(ids.length!==1) return null
    return placed.find(p=>p.id===ids[0])||null
  },[readOnly,selectedObjects.placed,selected,placed])

  const selectedPlacedBounds=useMemo(
    ()=>(selectedPlacedItem?getPlacedLocalBounds(selectedPlacedItem):null),
    [selectedPlacedItem],
  )

  const selectedImportedItem=useMemo(()=>{
    if(readOnly) return null
    if(selectedObjects.placed.length) return null
    if(selectedObjects.images.length!==1) return null
    return importedImages.find(i=>i.id===selectedObjects.images[0])||null
  },[readOnly,selectedObjects.placed,selectedObjects.images,importedImages])

  const selectedImportedBounds=useMemo(
    ()=>(selectedImportedItem?getImportedImageLocalBounds(selectedImportedItem):null),
    [selectedImportedItem],
  )

  const applyPageMetaToState=useCallback(meta=>{
    setPageFormat(meta.format||"a4")
    setPageRotation(meta.rotation??0)
    setCustomPageMm(meta.customMm||{w:210,h:297})
    setPlaced(meta.items||[])
    setImportedImages(meta.images||[])
    setPageColor(meta.pageColor??null)
    setGridColor(meta.gridColor??null)
    setPageGridStyle(meta.gridStyle||defaultGridStyle(nb.template))
    setInfiniteMode(!!meta.infinite)
    setPageName(meta.name||"")
    setPageBgImage(meta.bgImage??null)
    setPageBgOpacity(meta.bgImageOpacity??1)
    setNextPageFmt(meta.format||"a4")
    setNextPageCustomMm(meta.customMm||{w:210,h:297})
  },[nb.template])

  const buildCurrentPageMeta=useCallback(()=>serializePageElements({
    format:pageFormat,
    rotation:pageRotation,
    customMm:customPageMm,
    items:placed,
    images:importedImages,
    pageColor,
    gridColor,
    gridStyle:pageGridStyle,
    infinite:infiniteMode,
    name:pageName,
    bgImage:pageBgImage,
    bgImageOpacity:pageBgOpacity,
  }),[pageFormat,pageRotation,customPageMm,placed,importedImages,pageColor,gridColor,pageGridStyle,infiniteMode,pageName,pageBgImage,pageBgOpacity])

  const buildPagePayload=useCallback(()=>({
    elements:JSON.stringify(buildCurrentPageMeta()),
    canvas_data:serializeCanvasData(window.__getStrokes?.()||[],layers,activeLayerId),
  }),[buildCurrentPageMeta,layers,activeLayerId])

  const{saveNow,scheduleSave,cancelScheduledSave,status:saveStatus,lastSavedAt}=useAutoSave({
    notebookId:nb.id,
    pageId,
    pageNum:page,
    readOnly,
    buildPagePayload,
    onPagesUpdate:setPages,
    onNotebookTouch:()=>({title:nb.title,subject:nb.subject,pages_count:pagesCount}),
    userId:user?.id,
  })
  saveNowRef.current=saveNow
  scheduleSaveRef.current=scheduleSave

  const goToPage=useCallback(async(num)=>{
    if(num<1||num>pagesCount||num===page)return
    cancelScheduledSave()
    await saveNow()
    setPage(num)
  },[page,pagesCount,saveNow,cancelScheduledSave])
  goToPageRef.current=goToPage

  const documentPage=useMemo(()=>({
    w:displayW,
    h:displayH,
    page,
    pageCount:pagesCount,
    onPrev:()=>{if(page>1)goToPageRef.current(page-1)},
    onNext:()=>{if(page<pagesCount)goToPageRef.current(page+1)},
  }),[displayW,displayH,page,pagesCount])

  const{
    zoom,panX,panY,panActive,spacePan,
    setPan,zoomBy,resetViewport,fitToPage,canvasHandlers,
    viewportRef,
  }=useCanvasViewport({
    viewW:viewSize.w,
    viewH:viewSize.h,
    enabled:!readOnly,
    allowPan:!readOnly,
    touchPan:pencilOnly&&isTablet,
    documentPage,
  })
  const pageFitKey=`${page}-${pageFormat}-${pageRotation}-${infiniteMode}-${displayW}x${displayH}`
  const prevViewRef=useRef({w:0,h:0})
  useEffect(()=>{
    if(!viewSize.w||!viewSize.h||!displayW||!displayH)return
    const pageChanged=lastFitKeyRef.current!==pageFitKey
    const viewReady=prevViewRef.current.w===0&&viewSize.w>0
    prevViewRef.current=viewSize
    if(pageChanged||viewReady){
      lastFitKeyRef.current=pageFitKey
      fitToPage(displayW,displayH)
    }
  },[pageFitKey,viewSize.w,viewSize.h,displayW,displayH,fitToPage])

  const toPageCoords=useCallback((sx,sy,viewW,viewH)=>screenToPage({
    sx,sy,viewW,viewH,
    pageW:displayW,pageH:displayH,
    zoom,panX,panY,
    offsetX:rotLayout.offsetX,offsetY:rotLayout.offsetY,
    baseW:PW,baseH:PH,rotationDeg:infiniteMode?0:pageRotation,
  }),[displayW,displayH,PW,PH,pageRotation,infiniteMode,zoom,panX,panY,rotLayout.offsetX,rotLayout.offsetY])

  useEffect(() => {
    if (tool !== 'eraser') return
    setSelected(null)
    setSelectedObjects({ placed: [], images: [] })
    setCanvasSelection(null)
    window.__clearSelection?.()
  }, [tool])

  useEffect(() => { formulaNoteInsertedRef.current = false; spreadsheetInsertedRef.current = false; docInsertedRef.current = false }, [nb.id])

  useEffect(() => {
    if (readOnly || !pendingDocInsert || pendingDocInsert.notebookId !== nb.id || docInsertedRef.current) return
    const timer = setTimeout(() => {
      if (docInsertedRef.current) return
      const p = pendingDocInsert
      const el = {
        type: 'document',
        docId: p.docId,
        l: p.name || 'Document',
        pw: p.w || 300,
        ph: p.h || 220,
        mode: p.mode || 'live',
        imageSrc: p.imageSrc || null,
      }
      setPlaced(prev => [...prev, {
        id: Date.now(),
        el,
        x: Math.max(48, PW * 0.08),
        y: Math.max(48, PH * 0.14),
      }])
      docInsertedRef.current = true
      setPendingDocInsert(null)
      scheduleSave()
      addNotification('Document inséré depuis FormaDoc', 'success')
    }, 700)
    return () => clearTimeout(timer)
  }, [pendingDocInsert, nb.id, readOnly, PW, PH, setPendingDocInsert, addNotification, scheduleSave])

  useEffect(() => {
    if (readOnly || !pendingSpreadsheetInsert || pendingSpreadsheetInsert.notebookId !== nb.id || spreadsheetInsertedRef.current) return
    const timer = setTimeout(() => {
      if (spreadsheetInsertedRef.current) return
      const p = pendingSpreadsheetInsert
      const el = {
        type: 'spreadsheet',
        sheetId: p.sheetId,
        l: p.name || 'Tableau',
        pw: p.w || 340,
        ph: p.h || 200,
        mode: p.mode || 'live',
        imageSrc: p.imageSrc || null,
      }
      setPlaced(prev => [...prev, {
        id: Date.now(),
        el,
        x: Math.max(48, PW * 0.08),
        y: Math.max(48, PH * 0.12),
      }])
      spreadsheetInsertedRef.current = true
      setPendingSpreadsheetInsert(null)
      scheduleSave()
      addNotification('Tableau inséré depuis FormaTab', 'success')
    }, 700)
    return () => clearTimeout(timer)
  }, [pendingSpreadsheetInsert, nb.id, readOnly, PW, PH, setPendingSpreadsheetInsert, addNotification, scheduleSave])

  useEffect(() => {
    if (readOnly || !pendingFormulaNote || pendingFormulaNote.notebookId !== nb.id || formulaNoteInsertedRef.current) return
    const timer = setTimeout(() => {
      if (!window.__addTextStroke || formulaNoteInsertedRef.current) return
      window.__addTextStroke({
        x: Math.max(48, PW * 0.08),
        y: Math.max(48, PH * 0.1),
        text: pendingFormulaNote.text,
        color,
        size: sizePx,
        fontFamily: canvasTextFont,
      })
      formulaNoteInsertedRef.current = true
      setPendingFormulaNote(null)
      scheduleSave()
      addNotification('Calcul inséré depuis Formules', 'success')
    }, 900)
    return () => clearTimeout(timer)
  }, [pendingFormulaNote, nb.id, readOnly, PW, PH, color, sizePx, canvasTextFont, setPendingFormulaNote, addNotification, scheduleSave])

  const saveLabel=useMemo(()=>{
    if(saveStatus==="dirty")return "Modifications en attente…"
    if(saveStatus==="saving")return "Sauvegarde locale…"
    if(saveStatus==="syncing_cloud")return "Sync cloud…"
    if(saveStatus==="error")return "Erreur sauvegarde"
    if(saveStatus==="offline")return lastSavedAt?`Local · ${lastSavedAt.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}`:"Sauvegarde locale"
    if((saveStatus==="saved_local"||saveStatus==="saved"||saveStatus==="synced")&&lastSavedAt){
      const prefix=saveStatus==="synced"?"Sync ·":saveStatus==="saved_local"?"Local ·":"Sauvegardé ·"
      return `${prefix} ${lastSavedAt.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}`
    }
    if(lastSavedAt)return `Dernière sauvegarde ${lastSavedAt.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}`
    return "Prêt"
  },[saveStatus,lastSavedAt])

  const metricLib=useMemo(()=>{
    const base={...LIB_METRIC,"⚙️ Profilés EU":euProfilesAsLibItems()}
    const custom=(customProfiles||[]).map(customProfileToLibEntry)
    if(custom.length)base["⭐ Mes profils"]=custom
    return base
  },[customProfiles])
  const getLibForMode=useCallback((mode)=>{
    if(mode==="symbols")return SYMBOLS_LIB
    if(mode==="metric")return metricLib
    return LIB_IMPERIAL
  },[metricLib])
  const curLib=getLibForMode(libMode)
  const libCats=Object.keys(curLib)
  const libItems=useMemo(()=>{
    const items=curLib[libCat]||[]
    if(!libSearch)return items
    const q=libSearch.toLowerCase()
    return items.filter(e=>e.l.toLowerCase().includes(q))
  },[libCat,libSearch,curLib])
  useEffect(()=>{
    const cats=Object.keys(getLibForMode(libMode))
    if(cats.length&&!cats.includes(libCat))setLibCat(cats[0])
  },[libMode,libCat,getLibForMode])

  // Load page + all pages for thumbnails
  useEffect(()=>{
    if(skipPageLoadRef.current){
      skipPageLoadRef.current=false
      return
    }
    cancelScheduledSave()
    const load=async()=>{
      try{
        const{data:{session}}=await supabase.auth.getSession()
        const useLocal=!session?.user||isLocalNotebookId(nb.id)

        if(useLocal){
          let localPages=loadLocalPages(nb.id)
          if(!localPages.length){
            const meta=defaultPageMeta(nb.template)
            const initialMeta=serializePageElements(meta)
            const emptyCanvas=serializeCanvasData([],DEFAULT_LAYERS,defaultActiveLayerId())
            localPages=[{id:`local-${nb.id}-p1`,page_number:1,notebook_id:nb.id,elements:JSON.stringify(initialMeta),canvas_data:emptyCanvas,updated_at:new Date().toISOString()}]
            saveLocalPages(nb.id,localPages)
            upsertLocalNotebook({...nb,pages_count:Math.max(nb.pages_count||1,1)})
          }
          setPages(localPages)
          const pg=localPages.find(p=>p.page_number===page)||localPages[0]
          if(pg){
            setPageId(pg.id)
            const norm=normalizeCanvasData(pg.canvas_data||[])
            setLayers(norm.layers)
            setActiveLayerId(norm.activeLayerId)
            if(window.__loadStrokes)window.__loadStrokes(norm.strokes)
            applyPageMetaToState(parsePageElements(pg.elements,nb.template))
          }
          return
        }

        const{data:pg}=await supabase.from("pages").select("*").eq("notebook_id",nb.id).eq("page_number",page).single()
        if(pg){
          setPageId(pg.id)
          const norm=normalizeCanvasData(pg.canvas_data||[])
          setLayers(norm.layers)
          setActiveLayerId(norm.activeLayerId)
          if(window.__loadStrokes)window.__loadStrokes(norm.strokes)
          const meta=parsePageElements(pg.elements,nb.template)
          applyPageMetaToState(meta)
        }else{
          const initialMeta=serializePageElements(defaultPageMeta(nb.template))
          const emptyCanvas=serializeCanvasData([],DEFAULT_LAYERS,defaultActiveLayerId())
          const{data:np,error:insertErr}=await supabase.from("pages").insert([{notebook_id:nb.id,page_number:page,user_id:session.user.id,elements:JSON.stringify(initialMeta),canvas_data:emptyCanvas}]).select().single()
          if(insertErr)throw insertErr
          if(np){
            setPageId(np.id)
            const norm=normalizeCanvasData(emptyCanvas)
            setLayers(norm.layers)
            setActiveLayerId(norm.activeLayerId)
            if(window.__loadStrokes)window.__loadStrokes(norm.strokes)
            applyPageMetaToState(parsePageElements(initialMeta,nb.template))
          }
        }
        const{data:allPgs}=await supabase.from("pages").select("*").eq("notebook_id",nb.id).order("page_number")
        setPages(allPgs||[])
      }catch(err){
        console.error("Editor page load error:",err)
      }
    }
    load()
  },[nb.id,nb.template,page,applyPageMetaToState,cancelScheduledSave])

  // Add / insert page
  const insertPageAt=async(position="end",bgImage=null)=>{
    if(addingPageRef.current)return
    addingPageRef.current=true
    try{
      if(pageId)await saveNow()
      const count=pages.length||nb.pages_count||1
      const atNum=resolveInsertPageNumber(position,page,count)
      const newMeta=serializePageElements({
        format:nextPageFmt,
        rotation:0,
        customMm:nextPageCustomMm,
        items:[],
        gridStyle:pageGridStyle||defaultGridStyle(nb.template),
        bgImage:bgImage||null,
        bgImageOpacity:bgImage?0.92:1,
      })
      const emptyCanvas=serializeCanvasData([],DEFAULT_LAYERS,defaultActiveLayerId())
      const{data:{session}}=await supabase.auth.getSession()
      const useLocal=!session?.user||isLocalNotebookId(nb.id)
      const newCount=count+1
      if(useLocal){
        const shifted=atNum<=count?shiftLocalPagesForInsert(pages,atNum):pages
        const np={
          id:`local-${nb.id}-p${atNum}-${Date.now()}`,
          page_number:atNum,
          notebook_id:nb.id,
          elements:JSON.stringify(newMeta),
          canvas_data:emptyCanvas,
          updated_at:new Date().toISOString(),
        }
        const all=[...shifted,np].sort((a,b)=>a.page_number-b.page_number)
        saveLocalPages(nb.id,all)
        setPages(all)
        updateNotebook(nb.id,{pages_count:newCount})
        setActiveNotebook({...nb,pages_count:newCount,updated_at:np.updated_at})
        upsertLocalNotebook({...nb,pages_count:newCount,updated_at:np.updated_at})
        skipPageLoadRef.current=true
        setPageId(np.id)
        const norm=normalizeCanvasData(emptyCanvas)
        setLayers(norm.layers)
        setActiveLayerId(norm.activeLayerId)
        if(window.__loadStrokes)window.__loadStrokes(norm.strokes)
        applyPageMetaToState(parsePageElements(newMeta,nb.template))
        setPage(atNum)
        scheduleSave()
        addNotification(bgImage?`Page ${atNum} créée avec photo`:`Page ${atNum} créée`,"success")
        pushAction({type:"page_bg",detail:`Page ${atNum} créée`})
        return
      }
      if(atNum<=count)await shiftSupabasePagesForInsert(supabase,nb.id,atNum)
      const{data:np,error}=await supabase.from("pages").insert([{
        notebook_id:nb.id,
        page_number:atNum,
        user_id:session.user.id,
        elements:JSON.stringify(newMeta),
        canvas_data:emptyCanvas,
      }]).select().single()
      if(error||!np)throw error||new Error("insert failed")
      await supabase.from("notebooks").update({pages_count:newCount}).eq("id",nb.id)
      updateNotebook(nb.id,{pages_count:newCount})
      setActiveNotebook({...nb,pages_count:newCount})
      skipPageLoadRef.current=true
      const{data:allPgs}=await supabase.from("pages").select("*").eq("notebook_id",nb.id).order("page_number")
      setPages(allPgs||[])
      setPageId(np.id)
      const norm=normalizeCanvasData(emptyCanvas)
      setLayers(norm.layers)
      setActiveLayerId(norm.activeLayerId)
      if(window.__loadStrokes)window.__loadStrokes(norm.strokes)
      applyPageMetaToState(parsePageElements(newMeta,nb.template))
      setPage(atNum)
      scheduleSave()
      addNotification(bgImage?`Page ${atNum} créée avec photo`:`Page ${atNum} créée`,"success")
      pushAction({type:"page_bg",detail:`Page ${atNum} créée`})
    }catch(e){
      console.error(e)
      addNotification("Impossible d'ajouter la page","error")
    }finally{
      addingPageRef.current=false
    }
  }

  const addPage=async(bgImage=null)=>insertPageAt("end",bgImage)

  const deletePage=async(pageNum)=>{
    if((nb.pages_count||pages.length||1)<=1)return
    if(!confirm(`Supprimer la page ${pageNum} ?`))return
    await saveNow()
    try{
      const{data:{session}}=await supabase.auth.getSession()
      const useLocal=!session?.user||isLocalNotebookId(nb.id)
      const newCount=(nb.pages_count||pages.length||1)-1
      if(useLocal){
        const remaining=pages.filter(p=>p.page_number!==pageNum).map((p,i)=>({...p,page_number:i+1}))
        saveLocalPages(nb.id,remaining)
        upsertLocalNotebook({...nb,pages_count:newCount,updated_at:new Date().toISOString()})
        updateNotebook(nb.id,{pages_count:newCount})
        setPages(remaining)
        if(page===pageNum)goToPage(Math.max(1,pageNum-1))
        else if(page>pageNum)goToPage(page-1)
        addNotification(`Page ${pageNum} supprimée`,"success")
        return
      }
      await supabase.from("pages").delete().eq("notebook_id",nb.id).eq("page_number",pageNum)
      await supabase.from("notebooks").update({pages_count:newCount}).eq("id",nb.id)
      updateNotebook(nb.id,{pages_count:newCount})
      const{data:allPgs}=await supabase.from("pages").select("*").eq("notebook_id",nb.id).order("page_number")
      setPages(allPgs||[])
      if(page===pageNum)goToPage(Math.max(1,pageNum-1))
      else if(page>pageNum)goToPage(page-1)
      addNotification(`Page ${pageNum} supprimée`,"success")
    }catch(e){
      console.error(e)
      addNotification("Impossible de supprimer la page","error")
    }
  }

  const handleLassoComplete=useCallback(({type,points,x1,y1,x2,y2})=>{
    if(type==="rect"){
      const sel=selectObjectsInRect(placed,importedImages,{x1,y1,x2,y2})
      setSelectedObjects({placed:sel.placedIds,images:sel.imageIds})
      if(sel.placedIds[0])setSelected(sel.placedIds[0])
    }else if(type==="polygon"&&points?.length){
      const sel=selectObjectsInPolygon(placed,importedImages,points)
      setSelectedObjects({placed:sel.placedIds,images:sel.imageIds})
      if(sel.placedIds[0])setSelected(sel.placedIds[0])
    }
  },[placed,importedImages])

  const startObjectGroupDrag=useCallback((e,{kind,item})=>{
    if(readOnly||tool==="eraser")return
    e.stopPropagation()
    window.__clearSelection?.()
    setCanvasSelection(null)
    let placedIds=[...selectedObjects.placed]
    let imageIds=[...selectedObjects.images]
    if(kind==="placed"){
      if(!placedIds.includes(item.id)){
        placedIds=[item.id]
        imageIds=[]
        setSelected(item.id)
        setSelectedObjects({placed:placedIds,images:[]})
      }
    }else if(!imageIds.includes(item.id)){
      placedIds=[]
      imageIds=[item.id]
      setSelected(null)
      setSelectedObjects({placed:[],images:imageIds})
    }
    const startX=e.clientX,startY=e.clientY
    const snapPlaced=placed.filter(p=>placedIds.includes(p.id)).map(p=>({id:p.id,x:p.x,y:p.y}))
    const snapImages=importedImages.filter(i=>imageIds.includes(i.id)).map(i=>({id:i.id,x:i.x,y:i.y}))
    const mm=(ev)=>{
      const dx=(ev.clientX-startX)/zoom,dy=(ev.clientY-startY)/zoom
      setPlaced(prev=>prev.map(it=>{
        const o=snapPlaced.find(s=>s.id===it.id)
        return o?{...it,x:Math.max(0,o.x+dx),y:Math.max(0,o.y+dy)}:it
      }))
      setImportedImages(prev=>prev.map(it=>{
        const o=snapImages.find(s=>s.id===it.id)
        return o?{...it,x:Math.max(0,o.x+dx),y:Math.max(0,o.y+dy)}:it
      }))
    }
    const mu=()=>{window.removeEventListener("mousemove",mm);window.removeEventListener("mouseup",mu);scheduleSaveRef.current?.()}
    window.addEventListener("mousemove",mm)
    window.addEventListener("mouseup",mu)
  },[readOnly,tool,selectedObjects,placed,importedImages,zoom])

  const handleEraseZone=useCallback((poly)=>{
    if(!poly?.length)return
    setPlaced(p=>p.filter(it=>{
      const sc=3.78/50,el=it.el||{},w=(el.fw||el.w||0)*sc,h=(el.h||0)*sc
      const corners=[{x:it.x,y:it.y},{x:it.x+w,y:it.y},{x:it.x+w,y:it.y+h},{x:it.x,y:it.y+h}]
      return !corners.some(c=>{ let ins=false; for(let i=0,j=poly.length-1;i<poly.length;j=i++){const xi=poly[i].x,yi=poly[i].y,xj=poly[j].x,yj=poly[j].y;if((yi>c.y)!==(yj>c.y)&&c.x<((xj-xi)*(c.y-yi))/(yj-yi+1e-9)+xi)ins=!ins} return ins })
    }))
    setImportedImages(p=>p.filter(img=>{
      const corners=[{x:img.x,y:img.y},{x:img.x+img.w,y:img.y},{x:img.x+img.w,y:img.y+img.h},{x:img.x,y:img.y+img.h}]
      return !corners.some(c=>{ let ins=false; for(let i=0,j=poly.length-1;i<poly.length;j=i++){const xi=poly[i].x,yi=poly[i].y,xj=poly[j].x,yj=poly[j].y;if((yi>c.y)!==(yj>c.y)&&c.x<((xj-xi)*(c.y-yi))/(yj-yi+1e-9)+xi)ins=!ins} return ins })
    }))
    scheduleSaveRef.current?.()
  },[])

  // Duplicate page (optionally from a specific page number)
  const duplicatePageByNum=async(sourcePageNum=page)=>{
    try{
      await saveNow()
      const src=pages.find(p=>p.page_number===sourcePageNum)
      if(!src)return
      const newNum=(pages.reduce((m,p)=>Math.max(m,p.page_number||0),0)||0)+1
      const{data:{session}}=await supabase.auth.getSession()
      const useLocal=!session?.user||isLocalNotebookId(nb.id)
      if(useLocal){
        const np={
          id:`local-${nb.id}-p${newNum}`,
          page_number:newNum,
          notebook_id:nb.id,
          elements:src.elements,
          canvas_data:src.canvas_data,
          updated_at:new Date().toISOString(),
        }
        const all=saveLocalPage(nb.id,np,pages)
        upsertLocalNotebook({...nb,pages_count:newNum,updated_at:np.updated_at})
        updateNotebook(nb.id,{pages_count:newNum})
        setPages(all)
        setPageId(np.id)
        const norm=normalizeCanvasData(src.canvas_data||[])
        setLayers(norm.layers)
        setActiveLayerId(norm.activeLayerId)
        if(window.__loadStrokes)window.__loadStrokes(norm.strokes)
        applyPageMetaToState(parsePageElements(src.elements,nb.template))
        setPage(newNum)
        scheduleSave()
        addNotification(`Page ${newNum} dupliquée`,"success")
        return
      }
      const{data:np,error}=await supabase.from("pages").insert([{notebook_id:nb.id,page_number:newNum,user_id:session.user.id,canvas_data:src.canvas_data,elements:src.elements}]).select().single()
      if(error||!np)throw error
      await supabase.from("notebooks").update({pages_count:newNum}).eq("id",nb.id)
      updateNotebook(nb.id,{pages_count:newNum})
      const{data:allPgs}=await supabase.from("pages").select("*").eq("notebook_id",nb.id).order("page_number")
      setPages(allPgs||[])
      setPageId(np.id)
      const norm=normalizeCanvasData(src.canvas_data||[])
      setLayers(norm.layers)
      setActiveLayerId(norm.activeLayerId)
      if(window.__loadStrokes)window.__loadStrokes(norm.strokes)
      applyPageMetaToState(parsePageElements(src.elements,nb.template))
      setPage(newNum)
      scheduleSave()
      addNotification(`Page ${newNum} dupliquée`,"success")
    }catch(e){
      console.error(e)
      addNotification("Impossible de dupliquer la page","error")
    }
  }
  const duplicatePage=()=>duplicatePageByNum(page)

  // Calculator — handled by CalculatorDrawer component

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

  // Save — debounced via useAutoSave (scheduleSave / saveNow)
  const commitLayerRename=()=>{
    if(renamingLayer&&renameVal.trim()){
      setLayers(p=>p.map(x=>x.id===renamingLayer?{...x,n:renameVal.trim()}:x))
      scheduleSave()
    }
    setRenamingLayer(null)
  }

  const handleDeleteLayer=id=>{
    const st=window.__getStrokes?.()||[]
    const r=deleteLayer(layers,id,st)
    if(!r.removed)return
    setLayers(r.layers)
    window.__setStrokes?.(r.strokes)
    if(activeLayerId===id)setActiveLayerId(r.activeFallback)
    scheduleSave()
  }

  const handleCanvasSelection=useCallback(info=>{
    setCanvasSelection(info?.active?info:null)
    if(info?.active){
      setSelected(null)
      setSelectedObjects({placed:[],images:[]})
    }
  },[])

  const pagePointToScreen=useCallback((px,py)=>{
    const canvas=cRef.current
    if(!canvas)return{x:0,y:0}
    const r=canvas.getBoundingClientRect()
    return{x:r.left+(px/PW)*r.width,y:r.top+(py/PH)*r.height}
  },[PW,PH])

  const handleTextEditRequest=useCallback(({index,x,y,text,color:textColor,size:textSize,fontFamily:textFont})=>{
    setTextEdit({index,x,y,text,color:textColor||color,size:textSize||sizePx,fontFamily:textFont||canvasTextFont,key:Date.now(),screen:pagePointToScreen(x,y)})
  },[pagePointToScreen,color,sizePx,canvasTextFont])

  const handleTextCommit=useCallback((payload)=>{
    const fontFamily=payload.fontFamily||canvasTextFont
    if(payload.index!=null){
      window.__updateTextStroke?.(payload.index,{text:payload.text,pts:[{x:payload.x,y:payload.y}],color:payload.color,size:payload.size,fontFamily})
    }else{
      window.__addTextStroke?.({x:payload.x,y:payload.y,text:payload.text,color:payload.color,size:payload.size,fontFamily})
    }
    setTextEdit(null)
    scheduleSave()
  },[scheduleSave,canvasTextFont])

  const handleTextCancel=useCallback(()=>setTextEdit(null),[])

  const insertDictationText=useCallback((text)=>{
    const trimmed=(text||"").trim()
    if(!trimmed||readOnly)return
    const x=PW*0.12
    const y=PH*0.2
    handleTextEditRequest({index:null,x,y,text:trimmed,color,size:sizePx,fontFamily:canvasTextFont})
  },[readOnly,PW,PH,handleTextEditRequest,color,sizePx,canvasTextFont])

  const ACTION_KEY=useMemo(()=>`forma_actions_${nb.id}_${page}`,[nb.id,page])
  useEffect(()=>{try{setActionLog(JSON.parse(localStorage.getItem(ACTION_KEY)||"[]"))}catch{setActionLog([])}},[ACTION_KEY])
  const pushAction=useCallback((payload)=>{
    const entry=buildActionEntry(payload)
    setActionLog(log=>{
      const next=[entry,...log].slice(0,100)
      try{localStorage.setItem(ACTION_KEY,JSON.stringify(next))}catch{}
      return next
    })
  },[ACTION_KEY])
  const handleCanvasAction=useCallback(payload=>pushAction(payload),[pushAction])
  const clearActionLog=useCallback(()=>{
    setActionLog([])
    try{localStorage.removeItem(ACTION_KEY)}catch{}
  },[ACTION_KEY])
  const setPageColorLogged=useCallback(c=>{setPageColor(c);pushAction({type:"page_bg",color:c,detail:c||"défaut"});scheduleSave()},[pushAction,scheduleSave])
  const setGridColorLogged=useCallback(c=>{setGridColor(c);pushAction({type:"page_grid",color:c,detail:c||"défaut"});scheduleSave()},[pushAction,scheduleSave])
  const setPageGridStyleLogged=useCallback(s=>{setPageGridStyle(s);pushAction({type:"page_grid",detail:s});scheduleSave()},[pushAction,scheduleSave])

  const handlePagePhotoPick=useCallback(async(e,mode="current")=>{
    const file=e.target.files?.[0]
    e.target.value=""
    if(!file||!file.type.startsWith("image/"))return
    const reader=new FileReader()
    reader.onload=async()=>{
      let url=reader.result
      if(typeof url==="string"&&url.length>480000)url=url.slice(0,480000)
      if(mode==="new"){
        setPhotoInsertPending({url,name:file.name})
        return
      }
      setPageBgImage(url)
      setPageBgOpacity(0.92)
      scheduleSave()
      addNotification("Photo de fond appliquée","success")
    }
    reader.readAsDataURL(file)
  },[scheduleSave,addNotification])

  const confirmPhotoInsert=useCallback(async(position)=>{
    if(!photoInsertPending?.url)return
    await insertPageAt(position,photoInsertPending.url)
    setPhotoInsertPending(null)
  },[photoInsertPending,insertPageAt])

  const applyPageSettings=useCallback(async(pageNum,partial)=>{
    if(pageNum===page){
      if(partial.format!==undefined){
        setPageFormat(partial.format)
        setNextPageFmt(partial.format)
        if(partial.format==="infinite")setInfiniteMode(true)
        else if(partial.infinite===undefined)setInfiniteMode(false)
      }
      if(partial.rotation!==undefined)setPageRotation(partial.rotation)
      if(partial.customMm){
        setCustomPageMm(partial.customMm)
        setNextPageCustomMm(partial.customMm)
      }
      if(partial.pageColor!==undefined)setPageColor(partial.pageColor)
      if(partial.gridColor!==undefined)setGridColor(partial.gridColor)
      if(partial.gridStyle!==undefined)setPageGridStyle(partial.gridStyle)
      if(partial.infinite!==undefined)setInfiniteMode(!!partial.infinite)
      if(partial.name!==undefined)setPageName(partial.name)
      if(partial.bgImage!==undefined)setPageBgImage(partial.bgImage)
      if(partial.bgImageOpacity!==undefined)setPageBgOpacity(partial.bgImageOpacity)
      scheduleSave()
      if(partial.format||partial.customMm)addNotification("Format de page appliqué","success")
      return
    }
    const pg=pages.find(p=>p.page_number===pageNum)
    if(!pg)return
    try{
      const merged=serializePageElements({...parsePageElements(pg.elements,nb.template),...partial})
      const elementsStr=JSON.stringify(merged)
      const{data:{session}}=await supabase.auth.getSession()
      const useLocal=!session?.user||isLocalNotebookId(nb.id)
      if(useLocal){
        const updated={...pg,elements:elementsStr,updated_at:new Date().toISOString()}
        saveLocalPage(nb.id,updated,pages)
        setPages(prev=>prev.map(p=>p.id===pg.id?updated:p))
        upsertLocalNotebook({...nb,updated_at:updated.updated_at})
        return
      }
      await supabase.from("pages").update({elements:elementsStr,updated_at:new Date().toISOString()}).eq("id",pg.id)
      setPages(prev=>prev.map(p=>p.id===pg.id?{...p,elements:elementsStr}:p))
    }catch(e){console.error(e)}
  },[page,pages,nb,scheduleSave,addNotification])

  const pageMenuMeta=useMemo(()=>{
    if(!pageMenu)return null
    if(pageMenu.pageNum===page)return buildCurrentPageMeta()
    const pg=pages.find(p=>p.page_number===pageMenu.pageNum)
    return parsePageElements(pg?.elements,nb.template)
  },[pageMenu,page,pages,nb.template,buildCurrentPageMeta])

  const onStroke=useCallback(()=>{setCanvasRevision(r=>r+1);scheduleSave()},[scheduleSave])

  // Page versioning (localStorage, 20 versions max per page)
  const HIST_KEY=`forma_hist_${nb.id}_${page}`
  const saveVersion=label=>{
    const canvas=cRef.current;if(!canvas)return
    const snap=canvas.toDataURL("image/jpeg",.4)
    const strokes=window.__getStrokes?.()||[]
    const ver={ts:Date.now(),label:label||new Date().toLocaleTimeString("fr-FR"),snap,data:strokes,elements:JSON.stringify(placed)}
    const hist=[ver,...(()=>{try{return JSON.parse(localStorage.getItem(HIST_KEY)||"[]")}catch{return[]}})()].slice(0,20)
    localStorage.setItem(HIST_KEY,JSON.stringify(hist))
    setPageHistory(hist)
  }
  useEffect(()=>{try{setPageHistory(JSON.parse(localStorage.getItem(HIST_KEY)||"[]"))}catch{}},[page,nb.id])
  const restoreVersion=ver=>{
    if(!confirm("Restaurer cette version ? Les changements non sauvegardés seront perdus."))return
    if(ver.data&&window.__loadStrokes)window.__loadStrokes(ver.data)
    if(ver.elements){
      try{setPlaced(JSON.parse(ver.elements))}catch{}
    }
    pushAction({type:"version_restore",detail:ver.label})
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
    }catch(e){alert('Erreur export PNG. Réessayez.')}
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
        scheduleSaveRef.current?.()
        pushAction({type:"image_import",detail:file.name})
      }
      img.src=ev.target.result
    }
    reader.readAsDataURL(file);e.target.value=""
  }

  // Apple Pencil double-tap / barrel : alterner crayon ↔ gomme
  useEffect(()=>{
    const handlePenTap=e=>{
      if(e.pointerType!=="pen")return
      if(e.buttons===2){
        setTool(t=>t==="eraser"?"pen":"eraser")
        return
      }
      const now=Date.now()
      const last=penTapRef.current
      const dist=Math.hypot(e.clientX-last.x,e.clientY-last.y)
      if(now-last.t<400&&dist<48){
        setTool(t=>t==="eraser"?"pen":"eraser")
        penTapRef.current={t:0,x:0,y:0}
      }else{
        penTapRef.current={t:now,x:e.clientX,y:e.clientY}
      }
    }
    window.addEventListener("pointerdown",handlePenTap)
    return()=>window.removeEventListener("pointerdown",handlePenTap)
  },[])

  useEffect(()=>()=>{saveNowRef.current?.()},[])

  // Keyboard shortcuts for lasso selection + mode focus
  const closeSidePanels=useCallback(()=>{
    setShowLib(false)
    setShowPagePanel(false)
    setShowSearchPanel(false)
    setShowLayers(false)
    setShowHistory(false)
    setShowCalc(false)
    setShowTimer(false)
    setShowConv(false)
    setShowTranslate(false)
    setShowDictation(false)
    setShowFlash(false)
    setToolPopup(null)
  },[])

  const handleToolClick=useCallback((id,hasPopup)=>{
    const resolved=id==="lasso"?(lassoType==="rect"?"lasso-rect":"lasso"):id
    if(tool===resolved&&hasPopup){
      setToolPopup(p=>p===id?null:id)
    }else{
      setTool(resolved)
      setToolPopup(null)
      if(id==="text")setTextToolToast(true)
    }
  },[tool,lassoType])

  const handlePinchPointerDown=useCallback((e)=>{
    if(e.pointerType!=="touch"&&e.pointerType!=="pen")return false
    activePointersRef.current.set(e.pointerId,{x:e.clientX,y:e.clientY})
    if(activePointersRef.current.size>=2){
      e.preventDefault()
      e.stopPropagation()
      pinchModeRef.current=true
      const pts=[...activePointersRef.current.values()]
      pinchRef.current.dist=Math.hypot(pts[1].x-pts[0].x,pts[1].y-pts[0].y)
      pinchRef.current.lastMid={x:(pts[0].x+pts[1].x)/2,y:(pts[0].y+pts[1].y)/2}
      return true
    }
    return false
  },[])

  const handlePinchPointerMove=useCallback((e)=>{
    if(!activePointersRef.current.has(e.pointerId))return false
    activePointersRef.current.set(e.pointerId,{x:e.clientX,y:e.clientY})
    if(activePointersRef.current.size>=2&&pinchModeRef.current){
      e.preventDefault()
      e.stopPropagation()
      const pts=[...activePointersRef.current.values()]
      const dist=Math.hypot(pts[1].x-pts[0].x,pts[1].y-pts[0].y)
      const mid={x:(pts[0].x+pts[1].x)/2,y:(pts[0].y+pts[1].y)/2}
      const r=document.getElementById("canvas-area")?.getBoundingClientRect()
      if(r&&pinchRef.current.dist>0){
        const factor=dist/pinchRef.current.dist
        pinchRef.current.dist=dist
        zoomBy(factor,{x:mid.x-r.left,y:mid.y-r.top})
        if(pinchRef.current.lastMid){
          const v=viewportRef.current
          setPan(v.panX+(mid.x-pinchRef.current.lastMid.x),v.panY+(mid.y-pinchRef.current.lastMid.y))
        }
        pinchRef.current.lastMid=mid
      }
      return true
    }
    return false
  },[zoomBy,setPan,viewportRef])

  const handlePinchPointerUp=useCallback((e)=>{
    activePointersRef.current.delete(e.pointerId)
    if(activePointersRef.current.size<2){
      pinchModeRef.current=false
      pinchRef.current={dist:null,lastMid:null}
    }
  },[])

  useEffect(()=>{
    const tick=()=>{
      setCanUndo(!!window.__hasUndo?.())
      setCanRedo(!!window.__hasRedo?.())
    }
    tick()
    const iv=setInterval(tick,400)
    return()=>clearInterval(iv)
  },[canvasRevision,actionLog.length])
  const exitFocusMode=useCallback(()=>setFocusMode(false),[])
  const toggleFocusMode=useCallback(()=>{
    setFocusMode(v=>{
      if(!v)closeSidePanels()
      return !v
    })
  },[closeSidePanels])

  useEffect(()=>{
    const handleKey=e=>{
      const tag=e.target?.tagName
      const typing=tag==="INPUT"||tag==="TEXTAREA"||tag==="SELECT"||e.target?.isContentEditable
      if(e.key==="Delete"||e.key==="Backspace")window.__deleteSelected?.()
      if(e.key==="Escape"){
        if(canvasSelection?.active){window.__clearSelection?.();setCanvasSelection(null);return}
        if(focusMode){exitFocusMode();return}
        window.__clearSelection?.()
      }
      if(!typing&&(e.key==="f"||e.key==="F")&&!e.metaKey&&!e.ctrlKey&&!e.altKey){
        e.preventDefault()
        toggleFocusMode()
      }
    }
    window.addEventListener("keydown",handleKey)
    return()=>window.removeEventListener("keydown",handleKey)
  },[focusMode,canvasSelection,exitFocusMode,toggleFocusMode])

  useEffect(()=>{
    window.__clearSelection?.()
    setCanvasSelection(null)
    setSelectedObjects({placed:[],images:[]})
  },[page])

  useEffect(()=>{
    try{
      const raw=localStorage.getItem(`forma_ruler_${nb.id}`)
      if(raw){const p=JSON.parse(raw);if(p?.x!=null)setRulerPos({x:p.x,y:p.y});if(p?.rotation!=null)setRulerRotation(p.rotation);if(p?.locked!=null)setRulerLocked(!!p.locked)}
    }catch{}
  },[nb.id])

  useEffect(()=>{
    if(!rulerDrag)return
    const onMove=e=>{
      const dx=(e.clientX-rulerDrag.ptrX)/zoom
      const dy=(e.clientY-rulerDrag.ptrY)/zoom
      setRulerPos({x:Math.max(0,rulerDrag.startX+dx),y:Math.max(0,rulerDrag.startY+dy)})
    }
    const onUp=()=>{
      setRulerDrag(null)
      try{localStorage.setItem(`forma_ruler_${nb.id}`,JSON.stringify({...rulerPosRef.current,rotation:rulerRotation,locked:rulerLocked}))}catch{}
    }
    window.addEventListener("pointermove",onMove)
    window.addEventListener("pointerup",onUp)
    return()=>{window.removeEventListener("pointermove",onMove);window.removeEventListener("pointerup",onUp)}
  },[rulerDrag,zoom,nb.id,rulerRotation,rulerLocked])
  const isPanMode=tool==="hand"||spacePan
  const eraserActive=tool==="eraser"&&!readOnly
  const eraserAuto=eraserActive&&eraserSettings.mode==="auto"
  const cursorDark=useMemo(()=>isDarkSurface(T),[T])
  const showMinimap=useMemo(()=>!focusMode&&!showPresent&&shouldShowMinimap({pageW:displayW,pageH:displayH,viewW:viewSize.w,viewH:viewSize.h,zoom,panX,panY}),[focusMode,showPresent,displayW,displayH,viewSize,zoom,panX,panY])
  const handleMinimapPan=useCallback((x,y)=>setPan(x,y),[setPan])
  const areaCursor=useMemo(()=>{
    if(spacePan)return panActive?"grabbing":"grab"
    if(libPending) return getPlacementCursor(cursorDark)
    if(isPanMode) return getToolCursor("hand",{dark:cursorDark,panning:panActive})
    return "default"
  },[libPending,isPanMode,panActive,cursorDark,spacePan])
  const SCALES_M=["1:1","1:2","1:5","1:10","1:20","1:50","1:100","1:200","1:500","1:1000"]
  const SCALES_I=['1/4"=1\'','3/16"=1\'','1/8"=1\'','3/32"=1\'','1"=10\'','1"=20\'','1"=40\'','1"=100\'']
  const COLLAB_COLORS=["#e94560","#2196f3","#4ade80","#f5a623","#a855f7","#00bcd4"]
  const calcDrawerW=calcDrawerWidth(calc.calcMode,calc.layout,showCalc)
  useEffect(()=>{
    if(saveStatus==="saved"||saveStatus==="saved_local"||saveStatus==="synced"){
      setSaveIndicatorVisible(true)
      const t=setTimeout(()=>setSaveIndicatorVisible(false),2000)
      return()=>clearTimeout(t)
    }
    setSaveIndicatorVisible(true)
  },[saveStatus])

  function handleCanvasAreaClick(e){
    if(!libPending)return
    const r=document.getElementById("canvas-area")?.getBoundingClientRect()
    if(!r)return
    const sc=3.78/50,elW=(libPending.fw||libPending.w)*sc,elH=libPending.h*sc
    const pt=toPageCoords(e.clientX-r.left,e.clientY-r.top,r.width,r.height)
    const x=pt.x-elW/2,y=pt.y-elH/2
    setPlaced(p=>[...p,{id:Date.now(),el:libPending,x:Math.max(0,x),y:Math.max(0,y)}])
    pushAction({type:"element_placed",detail:libPending.l})
    setLibPending(null)
  }

  // Presentation mode
  if(showPresent){
    return(
      <div style={{position:"fixed",inset:0,background:"#000",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}}>
        <div style={{position:"absolute",top:16,right:16,display:"flex",gap:8,zIndex:10}}>
          <button onClick={()=>goToPage(Math.max(1,page-1))}style={{padding:"8px 16px",borderRadius:10,background:`${COLORS.accent}33`,border:"none",color:COLORS.accent,cursor:"pointer",fontSize:18}}>‹</button>
          <span style={{color:"#fff",fontSize:14,padding:"8px 12px"}}>{page}/{pagesCount}</span>
          <button onClick={()=>goToPage(Math.min(pagesCount,page+1))}style={{padding:"8px 16px",borderRadius:10,background:`${COLORS.accent}33`,border:"none",color:COLORS.accent,cursor:"pointer",fontSize:18}}>›</button>
          <button onClick={()=>setShowPresent(false)}style={{padding:"8px 16px",borderRadius:10,background:"rgba(233,69,96,.3)",border:"none",color:"#fff",cursor:"pointer",fontSize:13}}>✕ Quitter</button>
        </div>
        <div style={{transform:"scale(0.9)",transformOrigin:"center",boxShadow:"0 20px 80px rgba(0,0,0,.8)"}}>
          <div style={{width:displayW,height:displayH,position:"relative"}}>
            <div style={{width:PW,height:PH,position:"absolute",left:rotLayout.offsetX,top:rotLayout.offsetY,transform:pageRotation?`rotate(${pageRotation}deg)`:"none",transformOrigin:`${PW/2}px ${PH/2}px`,background:"#fff",boxShadow:"0 20px 80px rgba(0,0,0,.8)"}}>
              <Paper gridStyle={pageGridStyle} tmpl={nb.template||"plan"} T={T} pageColor={pageColor} gridColor={gridColor} PW={PW} PH={PH}/>
              <canvas ref={cRef}width={PW}height={PH}style={{position:"absolute",inset:0,width:"100%",height:"100%"}}/>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return(
    <div className="forma-page-shell" style={{ display: "flex", flexDirection: "column", height: "100dvh", overflow: "hidden" }}>
      {!focusMode&&showPageSettings&&(
        <DraggablePanel T={T} id="editor-page-settings" title="Style de page" open onClose={()=>setShowPageSettings(false)} defaultSide="left" width={320}>
          <PageSettingsBody T={T} pageColor={pageColor} setPageColor={setPageColorLogged} gridColor={gridColor} setGridColor={setGridColorLogged} gridStyle={pageGridStyle} setGridStyle={setPageGridStyleLogged} pageFormat={pageFormat} customMm={customPageMm} onFormatChange={(partial)=>applyPageSettings(page,partial)} onClose={()=>setShowPageSettings(false)}/>
        </DraggablePanel>
      )}
      {showShare&&(
        <ShareModal
          T={T}
          open={showShare}
          onClose={()=>setShowShare(false)}
          resourceType="notebook"
          resourceId={nb.id}
          resourceTitle={nb.title}
          ownerId={user?.id}
          ownerName={collab.profile?.display_name}
          friends={collab.friends}
        />
      )}
      {pageMenu&&pageMenuMeta&&<PageContextMenu T={T} pageNum={pageMenu.pageNum} x={pageMenu.x} y={pageMenu.y} meta={pageMenuMeta} onClose={()=>setPageMenu(null)} onApply={partial=>applyPageSettings(pageMenu.pageNum,partial)} onDuplicate={()=>duplicatePageByNum(pageMenu.pageNum)} onDelete={()=>deletePage(pageMenu.pageNum)} canDelete={pagesCount>1}/>}
      <PagePhotoInsertModal
        T={T}
        open={!!photoInsertPending}
        previewUrl={photoInsertPending?.url}
        fileName={photoInsertPending?.name}
        currentPage={page}
        pagesCount={pagesCount}
        onConfirm={confirmPhotoInsert}
        onClose={()=>setPhotoInsertPending(null)}
      />

      {!focusMode&&showCalc&&isTablet&&(
        <BottomSheet T={T} open onClose={()=>setShowCalc(false)} title="🔢 Calculatrice">
          <CalculatorDrawer T={T} variant="embedded" open onClose={()=>setShowCalc(false)} scale={scale} {...calc} />
        </BottomSheet>
      )}
      {!focusMode&&showCalc&&!isTablet&&(
        <DraggablePanel T={T} id="editor-calculator" title="Calculatrice" open onClose={()=>setShowCalc(false)} defaultSide="right" width={calc.calcMode==="scientific"?380:340}>
          <CalculatorDrawer
            T={T}
            variant="embedded"
            open
            onClose={()=>setShowCalc(false)}
            scale={scale}
            {...calc}
          />
        </DraggablePanel>
      )}
      {!focusMode&&showConv&&isTablet&&(
        <BottomSheet T={T} open onClose={()=>setShowConv(false)} title="📐 Convertisseur">
          <UnitConverter
            T={T}
            variant="embedded"
            open
            value={convValue}
            setValue={setConvValue}
            category={convCategory}
            setCategory={setConvCategory}
            fromUnit={convFromUnit}
            setFromUnit={setConvFromUnit}
            toUnit={convToUnit}
            setToUnit={setConvToUnit}
            scale={scale}
            setScale={setScale}
          />
        </BottomSheet>
      )}
      {!focusMode&&showConv&&!isTablet&&(
        <DraggablePanel T={T} id="editor-converter" title="Convertisseur" open onClose={()=>setShowConv(false)} defaultSide="right" width={300}>
          <UnitConverter
            T={T}
            variant="embedded"
            open
            value={convValue}
            setValue={setConvValue}
            category={convCategory}
            setCategory={setConvCategory}
            fromUnit={convFromUnit}
            setFromUnit={setConvFromUnit}
            toUnit={convToUnit}
            setToUnit={setConvToUnit}
            scale={scale}
            setScale={setScale}
          />
        </DraggablePanel>
      )}
      {!focusMode&&showTranslate&&isTablet&&(
        <BottomSheet T={T} open onClose={()=>setShowTranslate(false)} title="🌐 Traduction">
          <TranslationWidget
            T={T}
            variant="embedded"
            notebooks={notebooks}
            onOpenScan={() => { setShowTranslate(false); navigate('/translate') }}
          />
        </BottomSheet>
      )}
      {!focusMode&&showTranslate&&!isTablet&&(
        <DraggablePanel T={T} id="editor-translate" title="Traduction" open onClose={()=>setShowTranslate(false)} defaultSide="right" width={320}>
          <TranslationWidget
            T={T}
            variant="embedded"
            notebooks={notebooks}
            onOpenScan={() => { setShowTranslate(false); navigate('/translate') }}
          />
        </DraggablePanel>
      )}
      {!focusMode&&showDictation&&(
        <DraggablePanel T={T} id="editor-dictation" title="Dictée vocale" open onClose={()=>setShowDictation(false)} defaultSide="right" width={320}>
          <DictationWidget T={T} variant="embedded" onInsert={insertDictationText} />
        </DraggablePanel>
      )}

      {textEdit&&(
        <CanvasTextEditor
          T={T}
          edit={textEdit}
          onCommit={handleTextCommit}
          onCancel={handleTextCancel}
          onFontChange={setCanvasTextFont}
        />
      )}

      {/* ── POMODORO ──────────────────────────────────── */}
      {!focusMode&&showTimer&&<div style={{position:"fixed",bottom:72,right:20,width:220,background:T.surface,borderRadius:16,boxShadow:"0 8px 36px rgba(0,0,0,.35)",border:`1px solid ${T.border}`,zIndex:89,overflow:"hidden",userSelect:"none"}}>
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

      {/* ── FLASHCARDS ────────────────────────────────── */}
      {!focusMode&&showFlash&&(()=>{
        const flashOffset=20+(showTimer?240:0)
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

      {/* ── HISTORIQUE ────────────────────── */}
      {!focusMode&&showHistory&&(
        <DraggablePanel T={T} id="editor-history" title="Historique" open onClose={()=>setShowHistory(false)} defaultSide="right" width={300}>
          <HistoryPanel
            embedded
            T={T}
            actionLog={actionLog}
            pageHistory={pageHistory}
            onSaveVersion={()=>saveVersion()}
            onRestoreVersion={restoreVersion}
            onClearActions={clearActionLog}
          />
        </DraggablePanel>
      )}

      {!focusMode&&tool==="eraser"&&showEraserPanel&&(
        <DraggablePanel T={T} id="editor-eraser" title="Gomme" open onClose={()=>setShowEraserPanel(false)} defaultSide="left" width={220} zIndexOffset={1}>
          <EraserOptionsPanel T={T} settings={eraserSettings} setSettings={setEraserSettings} unitSys={unitSys} formatDimension={formatDimension}/>
        </DraggablePanel>
      )}

      {focusMode&&(
        <FocusToolbar
          T={T}
          title={nb.title}
          page={page}
          pagesCount={pagesCount}
          tool={tool}
          setTool={setTool}
          color={color}
          setColor={setColor}
          sizeMm={sizeMm}
          setSizeMm={setSizeMm}
          eraserMm={eraserMm}
          unitSys={unitSys}
          formatDimension={formatDimension}
          zoom={zoom}
          zoomBy={zoomBy}
          viewW={viewSize.w}
          viewH={viewSize.h}
          saveStatus={saveStatus}
          timerSec={timerSec}
          timerRunning={timerRunning}
          timerMode={timerMode}
          onUndo={()=>window.__undo?.()}
          onExit={exitFocusMode}
        />
      )}

      <div style={focusMode?{display:"flex",flex:1,overflow:"hidden",minHeight:0}:{height:"100dvh",overflow:"hidden",background:COLORS.bg,display:"flex",flexDirection:"column",flex:1,minHeight:0}}>
        <style>{`@keyframes gnSpin{to{transform:rotate(360deg)}}@keyframes gnPopupIn{from{opacity:0;transform:translateX(-50%) translateY(-4px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
        {!focusMode&&readOnly&&(
          <div style={{height:24,flexShrink:0,background:COLORS.destructive,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600,gap:8,zIndex:50}}>
            <Lock size={12}/> Mode lecture seule
            {!readOnlyLocked&&<button type="button" onClick={()=>setReadOnly(false)} style={{background:"rgba(255,255,255,.2)",border:"none",borderRadius:4,color:"#fff",cursor:"pointer",padding:"0 4px",display:"flex",alignItems:"center"}}><X size={12}/></button>}
          </div>
        )}
        {!focusMode&&(
          <div style={{position:"relative",flexShrink:0,zIndex:30}}>
          <GoodNotesTopBar
            nb={nb}
            navigate={navigate}
            updateNotebook={updateNotebook}
            tool={tool}
            setTool={setTool}
            onToolClick={handleToolClick}
            readOnly={readOnly}
            setReadOnly={setReadOnly}
            readOnlyLocked={readOnlyLocked}
            setShowPresent={setShowPresent}
            setShowShare={setShowShare}
            showPagePanel={showPagePanel}
            setShowPagePanel={setShowPagePanel}
            setShowSearchPanel={setShowSearchPanel}
            setShowPageSettings={setShowPageSettings}
            setShowLayers={setShowLayers}
            setShowHistory={setShowHistory}
            setShowCalc={setShowCalc}
            setShowConv={setShowConv}
            setShowTranslate={setShowTranslate}
            setShowDictation={setShowDictation}
            setShowTimer={setShowTimer}
            setShowFlash={setShowFlash}
            setShowPropsPanel={setShowPropsPanel}
            setPropsCollapsed={setPropsCollapsed}
            showHistory={showHistory}
            showCalc={showCalc}
            showConv={showConv}
            showTranslate={showTranslate}
            showDictation={showDictation}
            showTimer={showTimer}
            showFlash={showFlash}
            showLayers={showLayers}
            infiniteMode={infiniteMode}
            applyPageSettings={applyPageSettings}
            page={page}
            pencilOnly={pencilOnly}
            setPencilOnly={setPencilOnly}
            toggleFocusMode={toggleFocusMode}
            handleImport={handleImport}
            exportPNG={exportPNG}
            exporting={exporting}
            unitSys={unitSys}
            setUnitSys={setUnitSys}
            scale={scale}
            setScale={setScale}
            scalesM={SCALES_M}
            scalesI={SCALES_I}
            actionLogLength={actionLog.length}
            flashCardsLength={flashCards.length}
            timerRunning={timerRunning}
            timerSec={timerSec}
            propsCollapsed={propsCollapsed}
            setShowLib={setShowLib}
            collabCursors={notebookCollab.remoteCursors}
            collabColors={COLLAB_COLORS}
            notebooks={notebooks}
            canUndo={canUndo}
            canRedo={canRedo}
          />
          <GoodNotesToolPopup
            toolPopup={toolPopup}
            onClose={()=>setToolPopup(null)}
            color={color}
            setColor={setColor}
            sizeMm={sizeMm}
            setSizeMm={setSizeMm}
            eraserSettings={eraserSettings}
            setEraserSettings={setEraserSettings}
            unitSys={unitSys}
            canvasTextFont={canvasTextFont}
            setCanvasTextFont={setCanvasTextFont}
            favorites={favorites}
            setFavorites={setFavorites}
            setTool={setTool}
            setPropsCollapsed={setPropsCollapsed}
            setShowPropsPanel={setShowPropsPanel}
            lassoType={lassoType}
            setLassoType={setLassoType}
            lassoInclude={lassoInclude}
            setLassoInclude={setLassoInclude}
            pencilOnly={pencilOnly}
            setPencilOnly={setPencilOnly}
            textSize={Math.round(sizeMm*3.78)}
            setTextSize={px=>setSizeMm(px/3.78)}
          />
          </div>
        )}
        <div style={{display:"flex",flex:1,minHeight:0,...(!focusMode?{height:readOnly?`calc(100dvh - ${TOP_BAR_H}px - ${BOTTOM_BAR_H}px - 24px)`:`calc(100dvh - ${TOP_BAR_H}px - ${BOTTOM_BAR_H}px)`}:{})}}>
          <div style={{flex:1,position:"relative",minWidth:0,display:"flex",flexDirection:"column",minHeight:0}}>
              {!focusMode&&libPending&&<div style={{position:"absolute",bottom:12,left:"50%",transform:"translateX(-50%)",zIndex:50,background:"rgba(28,28,30,.9)",color:"#fff",padding:"7px 14px",borderRadius:20,fontSize:11,pointerEvents:"none",boxShadow:"0 4px 16px rgba(0,0,0,.3)"}}>
                📍 Clic sur la feuille → <strong>{libPending.l}</strong> — Échap pour annuler
              </div>}
              {!focusMode&&saveIndicatorVisible&&(
                <div style={{position:"absolute",bottom:BOTTOM_BAR_H+8,right:16,zIndex:50,display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8,pointerEvents:"none",transition:"opacity .4s ease",opacity:saveIndicatorVisible?1:0}}>
                  {(saveStatus==="saving"||saveStatus==="syncing_cloud"||saveStatus==="dirty")&&(
                    <div style={{background:"rgba(28,28,30,0.92)",borderRadius:10,padding:"7px 14px",fontSize:12,color:C.muted,display:"flex",alignItems:"center",gap:8}}>
                      <span style={{display:"inline-block",width:12,height:12,border:`2px solid ${C.muted}`,borderTopColor:"transparent",borderRadius:"50%",animation:"gnSpin .8s linear infinite"}}/>Sauvegarde…
                    </div>
                  )}
                  {(saveStatus==="saved"||saveStatus==="saved_local"||saveStatus==="synced")&&saveLabel&&(
                    <div style={{background:"rgba(28,28,30,0.92)",borderRadius:10,padding:"7px 14px",fontSize:12,color:C.success}}>Sauvegardé ✓</div>
                  )}
                  {saveStatus!=="saving"&&saveStatus!=="syncing_cloud"&&saveStatus!=="dirty"&&(
                    <div style={{background:C.panel,borderRadius:20,padding:"6px 14px",fontSize:12,color:C.text,display:"flex",alignItems:"center",gap:8}}>
                      <span style={{width:8,height:8,borderRadius:"50%",background:C.success,display:"inline-block"}}/>Prêt
                    </div>
                  )}
                </div>
              )}
              {!focusMode&&tool==="text"&&textToolToast&&(
                <div style={{position:"absolute",bottom:BOTTOM_BAR_H+16,left:"50%",transform:"translateX(-50%)",zIndex:50,background:C.bar,borderRadius:20,padding:"10px 16px",fontSize:13,color:C.text,display:"flex",alignItems:"center",gap:10,maxWidth:"90%",boxShadow:"0 4px 20px rgba(0,0,0,.5)",border:`1px solid ${C.border}`}}>
                  <span>ⓘ Appuyez pour ajouter une zone de texte ou faites un appui prolongé pour commencer à saisir.</span>
                  <button type="button" onClick={()=>setTextToolToast(false)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",padding:0,display:"flex",flexShrink:0}}><X size={16}/></button>
                </div>
              )}
              {!focusMode&&<GoodNotesLibraryDrawer open={showLib} onClose={()=>setShowLib(false)} T={T} libMode={libMode} setLibMode={setLibMode} libSearch={libSearch} setLibSearch={setLibSearch} libCat={libCat} setLibCat={setLibCat} libCats={libCats} libItems={libItems} libPending={libPending} setLibPending={setLibPending} showNewProfile={showNewProfile} setShowNewProfile={setShowNewProfile} addCustomProfile={addCustomProfile} addNotification={addNotification} getLibForMode={getLibForMode} customProfiles={customProfiles} removeCustomProfile={removeCustomProfile} setPlaced={setPlaced} toPageCoords={toPageCoords} pushAction={pushAction} scheduleSave={scheduleSave} renderEl={renderEl} renderSym={renderSym}/>}
              <div style={{flex:1,overflow:"hidden",background:focusMode?T.panel:"#404040",position:"relative",cursor:areaCursor,touchAction:"none",minHeight:0,transition:"background .35s ease"}}
          id="canvas-area"
          data-pan-tool={isPanMode?"1":"0"}
          {...canvasHandlers}
          onPointerDownCapture={(e)=>{
            if(handlePinchPointerDown(e))return
            canvasHandlers.onPointerDownCapture?.(e)
          }}
          onPointerDown={(e)=>{
            if(pinchModeRef.current)return
            swipeToolCycle.onPointerDown(e)
          }}
          onPointerMove={(e)=>{
            if(handlePinchPointerMove(e))return
            swipeToolCycle.onPointerMove(e)
            canvasHandlers.onPointerMove?.(e)
          }}
          onPointerUp={(e)=>{
            handlePinchPointerUp(e)
            if(!pinchModeRef.current){
              swipeToolCycle.onPointerUp(e)
              canvasHandlers.onPointerUp?.(e)
            }
          }}
          onPointerCancel={(e)=>{
            handlePinchPointerUp(e)
            swipeToolCycle.onPointerCancel?.(e)
          }}
          onMouseMove={e=>{
            canvasHandlers.onMouseMove(e)
            if(libPending)setMousePos({x:e.clientX,y:e.clientY})
            const r=document.getElementById("canvas-area")?.getBoundingClientRect()
            if(r){
              const pt=toPageCoords(e.clientX-r.left,e.clientY-r.top,r.width,r.height)
              notebookCollab.broadcastCursor(pt.x,pt.y)
              if(tool==="eraser"&&!readOnly)setEraserCursor({x:e.clientX-r.left,y:e.clientY-r.top})
              else if(eraserCursor)setEraserCursor(null)
            }
          }}
          onMouseDown={e=>{if(libPending){handleCanvasAreaClick(e);return}}}
          onKeyDown={e=>{if(e.key==="Escape")setLibPending(null)}}
          tabIndex={0}>

          {/* Ghost preview */}
          {libPending&&(()=>{
            const r=document.getElementById("canvas-area")?.getBoundingClientRect()
            if(!r)return null
            const sc=3.78/50,elW=(libPending.fw||libPending.w)*sc*zoom,elH=libPending.h*sc*zoom
            return<div style={{position:"absolute",left:mousePos.x-r.left-elW/2,top:mousePos.y-r.top-elH/2,zIndex:50,opacity:.55,pointerEvents:"none",transform:`scale(${zoom})`,transformOrigin:"top left"}}>{renderEl(libPending,1/50)}</div>
          })()}

          {/* Eraser cursor preview */}
          {tool==="eraser"&&!readOnly&&eraserCursor&&(()=>{
            const d=Math.max(4,eraserPx*zoom)
            const big=d>18
            return<div style={{position:"absolute",left:eraserCursor.x-(big?d/2:3),top:eraserCursor.y-(big?d/2:3),width:big?d:6,height:big?d:6,borderRadius:"50%",border:"2px solid rgba(233,69,96,.9)",background:big?"rgba(233,69,96,.18)":"rgba(233,69,96,.55)",pointerEvents:"none",zIndex:70,boxSizing:"border-box"}}/>
          })()}

          {/* Collab cursors */}
          {(Array.isArray(notebookCollab.remoteCursors) ? notebookCollab.remoteCursors : []).map((c,i)=>{
            const r=document.getElementById("canvas-area")?.getBoundingClientRect()
            if(!r)return null
            const pt=pageToScreen({
              px:c.x,py:c.y,
              viewW:r.width,viewH:r.height,
              pageW:displayW,pageH:displayH,
              zoom,panX,panY,
              offsetX:rotLayout.offsetX,offsetY:rotLayout.offsetY,
              baseW:PW,baseH:PH,rotationDeg:infiniteMode?0:pageRotation,
            })
            return<div key={c.userId}style={{position:"absolute",left:pt.sx,top:pt.sy,zIndex:60,pointerEvents:"none"}}>
              <div style={{width:12,height:12,background:COLLAB_COLORS[i%6],clipPath:"polygon(0 0,100% 30%,40% 40%,30% 100%)"}}/>
              <div style={{position:"absolute",top:12,left:8,background:COLLAB_COLORS[i%6],color:"#fff",fontSize:9,padding:"2px 5px",borderRadius:6,whiteSpace:"nowrap",fontWeight:600}}>{c.userName||"?"}</div>
            </div>
          })}

          <div style={{transform:`translate(${panX}px,${panY}px) scale(${zoom})`,transformOrigin:"center center",position:"absolute",top:"50%",left:"50%",marginLeft:-(displayW/2),marginTop:-(displayH/2),willChange:"transform",overflow:"hidden"}}>
            <div style={{width:displayW,height:displayH,position:"relative",overflow:"hidden",background:"transparent"}}>
              <div style={{
                width:PW,
                height:PH,
                position:"absolute",
                left:rotLayout.offsetX,
                top:rotLayout.offsetY,
                transform:pageRotation?`rotate(${pageRotation}deg)`:"none",
                transformOrigin:`${PW/2}px ${PH/2}px`,
                background:infiniteMode?(pageColor||T.paper):(pageColor||T.paper),
                boxShadow:infiniteMode?"none":"0 4px 24px rgba(0,0,0,0.5)",
                borderRadius:infiniteMode?0:2,
                overflow:"hidden",
              }}>
              {infiniteMode&&<svg style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:0}}width={3000}height={3000}><defs><pattern id="inf-grid"width={37.8}height={37.8}patternUnits="userSpaceOnUse"><path d={`M 37.8 0 L 0 0 0 37.8`}fill="none"stroke={gridColor||T.grid}strokeWidth={.6}/></pattern></defs><rect width={3000}height={3000}fill={`url(#inf-grid)`}/></svg>}
              {!infiniteMode&&<Paper gridStyle={pageGridStyle} tmpl={nb.template||"plan"} T={T} pageColor={pageColor} gridColor={gridColor} PW={PW} PH={PH}/>}
              {pageBgImage&&!infiniteMode&&(
                <img src={pageBgImage} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:pageBgOpacity,pointerEvents:"none",zIndex:1}}/>
              )}

              {/* Imported images */}
              {importedImages.map(img=>{
                const imgSel=selectedObjects.images.includes(img.id)
                const rot=img.rotation||0
                return(
                <div key={img.id}style={{position:"absolute",left:img.x,top:img.y,width:img.w,height:img.h,zIndex:imgSel?12:3,cursor:readOnly||eraserActive?"default":"move",userSelect:"none",pointerEvents:eraserActive?"none":"auto",transform:rot?`rotate(${rot}deg)`:"none",transformOrigin:"center center"}}
                  onMouseDown={e=>startObjectGroupDrag(e,{kind:"image",item:img})}>
                  <div style={{width:"100%",height:"100%",outline:imgSel?"2px solid #c8622a":"none",outlineOffset:2,pointerEvents:"none"}}>
                    <img src={img.src}alt=""style={{width:"100%",height:"100%",display:"block",opacity:.88,pointerEvents:"none",objectFit:"fill"}}/>
                  </div>
                  {imgSel&&!readOnly&&!eraserActive&&<button onClick={()=>{setImportedImages(p=>p.filter(i=>i.id!==img.id));setSelectedObjects({placed:[],images:[]});scheduleSave()}}style={{position:"absolute",top:-10,right:-10,width:20,height:20,borderRadius:"50%",background:"#e94560",border:"none",color:"#fff",cursor:"pointer",fontSize:11,fontWeight:700,zIndex:20}}>×</button>}
                </div>
              )})}

              {/* Structural elements */}
              {placed.map(item=>{
                const sel=selected===item.id||selectedObjects.placed.includes(item.id)
                const sx=item.scaleX??1,sy=item.scaleY??1,rot=item.rotation||0
                const { w, h } = getPlacedSize(item)
                return(
                <div key={item.id}style={{
                  position:"absolute",
                  left:item.x,
                  top:item.y,
                  width:w,
                  height:h,
                  cursor:readOnly||eraserActive?"default":"move",
                  pointerEvents:eraserActive?"none":"all",
                  userSelect:"none",
                  zIndex:sel?12:10,
                  transform:rot?`rotate(${rot}deg)`:"none",
                  transformOrigin:"center center",
                }}
                  onMouseDown={e=>startObjectGroupDrag(e,{kind:"placed",item})}>
                  <div style={{width:"100%",height:"100%",outline:sel?"2px solid #c8622a":"none",outlineOffset:2,pointerEvents:"none"}}>
                    {item.el.type==="sym"?renderSym(item.el,1/50,sx,sy):renderEl(item.el,1/50,sx,sy)}
                  </div>
                  {sel&&!readOnly&&!eraserActive&&<button onClick={()=>{pushAction({type:"element_removed",detail:item.el?.l||"élément"});setPlaced(p=>p.filter(e=>e.id!==item.id));setSelected(null);scheduleSave()}}style={{position:"absolute",top:-10,right:-10,width:20,height:20,borderRadius:"50%",background:"#e94560",border:"none",color:"#fff",cursor:"pointer",fontSize:11,fontWeight:700,zIndex:20}}>×</button>}
                </div>
              )})}

              {/* Ruler */}
              {showRuler&&<div style={{position:"absolute",left:rulerPos.x,top:rulerPos.y,width:Math.min(PW,1180),height:28,background:T.surface,border:`1px solid ${T.border}`,zIndex:20,opacity:.95,borderRadius:4,boxShadow:"0 2px 10px rgba(0,0,0,.12)",transform:`rotate(${rulerRotation}deg)`,transformOrigin:"left center",touchAction:"none",pointerEvents:eraserActive?"none":"auto"}}>
                <div data-ruler-handle
                  onPointerDown={e=>{if(rulerLocked)return;e.preventDefault();e.stopPropagation();setRulerDrag({startX:rulerPos.x,startY:rulerPos.y,ptrX:e.clientX,ptrY:e.clientY})}}
                  style={{position:"absolute",left:0,top:0,width:22,height:28,cursor:rulerLocked?"not-allowed":rulerDrag?"grabbing":"grab",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:T.muted,borderRight:`1px solid ${T.border}`,userSelect:"none",touchAction:"none"}}>⠿</div>
                <button type="button" onClick={e=>{e.stopPropagation();setRulerRotation(r=>r+90);try{localStorage.setItem(`forma_ruler_${nb.id}`,JSON.stringify({...rulerPosRef.current,rotation:(rulerRotation+90)%360,locked:rulerLocked}))}catch{}}} title="Rotation 90°" style={{position:"absolute",right:26,top:4,background:T.bg,border:`1px solid ${T.border}`,borderRadius:4,cursor:"pointer",fontSize:9,color:T.muted,padding:"1px 4px",zIndex:2}}>↻</button>
                <button type="button" onClick={e=>{e.stopPropagation();setRulerLocked(v=>!v);try{localStorage.setItem(`forma_ruler_${nb.id}`,JSON.stringify({...rulerPosRef.current,rotation:rulerRotation,locked:!rulerLocked}))}catch{}}} title={rulerLocked?"Déverrouiller":"Verrouiller"} style={{position:"absolute",right:4,top:4,background:rulerLocked?`${T.accent}22`:T.bg,border:`1px solid ${rulerLocked?T.accent:T.border}`,borderRadius:4,cursor:"pointer",fontSize:9,color:rulerLocked?T.accent:T.muted,padding:"1px 4px",zIndex:2}}>{rulerLocked?"🔒":"🔓"}</button>
                <RulerSvg widthPx={Math.min(PW, 1158)} unitSys={unitSys} scale={scale} zoom={zoom} strokeColor={T.muted} />
              </div>}

              {!readOnly&&<DrawCanvas tool={tool} color={color} size={sizePx} eraserSize={eraserPx} cRef={cRef} pageW={PW} pageH={PH} shapeStyle={shapeStyle} canvasTextFont={canvasTextFont} onTextEditRequest={handleTextEditRequest} onStroke={onStroke} onAction={handleCanvasAction} onPickColor={c=>setColor(c)} pencilOnly={pencilOnly} unitSys={unitSys} onEraseAt={eraseObjectsAt} onSelectionChange={handleCanvasSelection} cursorDark={cursorDark} layers={layers} activeLayerId={activeLayerId} eraserMode={eraserSettings.mode} onLassoComplete={handleLassoComplete} onEraseZone={handleEraseZone} canvasZIndex={5}/>}
              {!eraserActive&&canvasSelection?.shapeBounds&&canvasSelection.count===1&&!textEdit&&(
                <ShapeTransformHandles
                  T={T}
                  bounds={canvasSelection.shapeBounds}
                  rotation={canvasSelection.rotation}
                  canvasEl={cRef.current}
                  pageW={PW}
                  pageH={PH}
                  showSideHandles={!["line","arrow","dimline"].includes(canvasSelection.primaryShapeType)}
                  onResize={(x1,y1,x2,y2)=>{window.__resizeSelectedShape?.(x1,y1,x2,y2);scheduleSave()}}
                  onRotate={(deg)=>{window.__setSelectionRotation?.(deg);scheduleSave()}}
                />
              )}
              {!eraserActive&&selectedPlacedItem&&selectedPlacedBounds&&!textEdit&&(
                <ShapeTransformHandles
                  T={T}
                  bounds={selectedPlacedBounds}
                  rotation={selectedPlacedItem.rotation||0}
                  canvasEl={cRef.current}
                  pageW={PW}
                  pageH={PH}
                  showSideHandles
                  onResize={(x1,y1,x2,y2)=>{
                    setPlaced(p=>p.map(it=>it.id===selectedPlacedItem.id?resizePlacedItem(it,x1,y1,x2,y2,{lockRatio:false}):it))
                    scheduleSave()
                  }}
                  onRotate={(deg)=>{
                    setPlaced(p=>p.map(it=>it.id===selectedPlacedItem.id?{...it,rotation:deg}:it))
                    scheduleSave()
                  }}
                />
              )}
              {!eraserActive&&selectedImportedItem&&selectedImportedBounds&&!textEdit&&(
                <ShapeTransformHandles
                  T={T}
                  bounds={selectedImportedBounds}
                  rotation={selectedImportedItem.rotation||0}
                  canvasEl={cRef.current}
                  pageW={PW}
                  pageH={PH}
                  showSideHandles
                  onResize={(x1,y1,x2,y2)=>{
                    setImportedImages(p=>p.map(it=>it.id===selectedImportedItem.id?resizeImportedImage(it,x1,y1,x2,y2,{lockRatio:false}):it))
                    scheduleSave()
                  }}
                  onRotate={(deg)=>{
                    setImportedImages(p=>p.map(it=>it.id===selectedImportedItem.id?{...it,rotation:deg}:it))
                    scheduleSave()
                  }}
                />
              )}
              {canvasSelection&&!readOnly&&!eraserActive&&(
                <FloatingSelectionToolbar
                  T={{...T,...GN_T}}
                  bounds={canvasSelection.bounds}
                  count={canvasSelection.count}
                  pageW={PW}
                  showShapeOpts={!!canvasSelection.shapeBounds&&canvasSelection.primaryShapeType!=="text"}
                  showTextFont={canvasSelection.count===1&&canvasSelection.primaryShapeType==="text"}
                  showRotation={canvasSelection.count===1&&!!canvasSelection.shapeBounds}
                  textFont={canvasSelection.primaryIndex!=null?(window.__getStrokes?.()?.[canvasSelection.primaryIndex]?.fontFamily||canvasTextFont):canvasTextFont}
                  rotation={canvasSelection.rotation}
                  onDelete={()=>window.__deleteSelected?.()}
                  onDuplicate={()=>window.__duplicateSelected?.()}
                  onColor={c=>window.__setSelectionColor?.(c)}
                  onSize={mm=>window.__setSelectionSize?.(mm2px(mm))}
                  onOpacity={o=>window.__setSelectionOpacity?.(o)}
                  onFill={c=>window.__setSelectionFill?.(c)}
                  onFillOpacity={o=>window.__setSelectionFill?.(null,o)}
                  onRotation={deg=>window.__setSelectionRotation?.(deg)}
                  onFont={f=>{window.__setSelectionFont?.(f);scheduleSave()}}
                  onClose={()=>{window.__clearSelection?.();setCanvasSelection(null)}}
                />
              )}
              {readOnly&&<canvas ref={cRef}width={PW}height={PH}style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:1,pointerEvents:"none",zIndex:5}}/>}
              </div>
            </div>
          </div>

          {showMinimap&&<CanvasMinimap T={T} pageW={displayW} pageH={displayH} viewW={viewSize.w} viewH={viewSize.h} zoom={zoom} panX={panX} panY={panY} onPanChange={handleMinimapPan} getStrokes={()=>window.__getStrokes?.()||[]} placed={placed} importedImages={importedImages} revision={canvasRevision} paperColor={pageColor||T.paper}/>}
            {!focusMode&&!propsCollapsed&&showPropsPanel&&(
              <div style={{position:"absolute",top:0,right:0,bottom:0,zIndex:35,pointerEvents:"auto"}}>
                <GoodNotesPropsPanel color={color} setColor={setColor} sizeMm={sizeMm} setSizeMm={setSizeMm} tool={tool} setTool={setTool} eraserMm={eraserMm} setEraserMm={setEraserMm} favorites={favorites} setFavorites={setFavorites} unitSys={unitSys} shapeStyle={shapeStyle} setShapeStyle={setShapeStyle} canvasTextFont={canvasTextFont} setCanvasTextFont={setCanvasTextFont} onClose={()=>setPropsCollapsed(true)}/>
              </div>
            )}
          </div>
        </div>
        {!focusMode&&<GoodNotesBottomBar page={page} pagesCount={pagesCount} goToPage={goToPage} addPage={addPage} pagePhotoInputRef={pagePhotoInputRef} handlePagePhotoPick={handlePagePhotoPick} pages={pages} nb={nb} setPageMenu={setPageMenu} zoom={zoom} zoomBy={zoomBy} resetViewport={resetViewport} viewSize={viewSize} setShowLayers={setShowLayers} setShowPageSettings={setShowPageSettings}/>}
        </div>
      </div>

      {!focusMode&&(
        <GoodNotesPagesSlidePanel
          open={showPagePanel}
          onClose={()=>setShowPagePanel(false)}
          page={page}
          pagesCount={pagesCount}
          pages={pages}
          nb={nb}
          T={T}
          goToPage={goToPage}
          addPage={addPage}
          duplicatePage={duplicatePage}
          setPageMenu={setPageMenu}
          applyPageSettings={applyPageSettings}
          pageFormat={pageFormat}
          customPageMm={customPageMm}
          nextPageFmt={nextPageFmt}
          nextPageCustomMm={nextPageCustomMm}
          setNextPageFmt={setNextPageFmt}
          setNextPageCustomMm={setNextPageCustomMm}
        />
      )}
      {!focusMode&&<GoodNotesSearchPanel open={showSearchPanel} onClose={()=>setShowSearchPanel(false)}/>}

      {!focusMode&&(
        <DraggablePanel T={T} id="editor-layers" title="Calques" open={showLayers} onClose={()=>setShowLayers(false)} width={240} defaultSide="right"
          headerExtra={<button type="button" onClick={()=>{const nl=createLayer(layers.length,layers);setLayers(p=>[...p,nl]);setActiveLayerId(nl.id);scheduleSave()}} style={{background:T.accent,border:"none",cursor:"pointer",color:"#fff",fontSize:13,width:20,height:20,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1,padding:0}}>+</button>}>
          <div style={{padding:"6px 5px",display:"flex",flexDirection:"column",gap:3}}>
            {[...layers].reverse().map(l=>{
              const i=layers.findIndex(x=>x.id===l.id)
              const lc=l.color||T.accent
              const isActive=activeLayerId===l.id
              const strokeCount=(window.__getStrokes?.()||[]).filter(s=>(s.layerId||layers[0]?.id)===l.id).length
              return(
              <div key={l.id} draggable onDragStart={()=>setDragLayerIdx(i)} onDragOver={e=>e.preventDefault()} onDrop={()=>{if(dragLayerIdx===null||dragLayerIdx===i)return;setLayers(p=>reorderLayers(p,dragLayerIdx,i));setDragLayerIdx(null);scheduleSave()}} onClick={()=>setActiveLayerId(l.id)}
                style={{borderRadius:10,background:isActive?`${lc}14`:T.bg,border:`1px solid ${isActive?lc:l.v?lc+"44":T.border}`,overflow:"hidden",cursor:"pointer"}}>
                <div style={{display:"flex",alignItems:"center",gap:6,padding:"7px 8px"}}>
                  <div style={{fontSize:9,color:T.muted,opacity:.7,cursor:"grab",userSelect:"none"}}>⠿</div>
                  <div style={{width:10,height:10,borderRadius:3,background:l.v?lc:T.muted,flexShrink:0}}/>
                  {renamingLayer===l.id?(
                    <input value={renameVal} autoFocus onChange={e=>setRenameVal(e.target.value)} onBlur={commitLayerRename} onKeyDown={e=>{if(e.key==="Enter")commitLayerRename();if(e.key==="Escape")setRenamingLayer(null)}} onClick={e=>e.stopPropagation()}
                      style={{flex:1,minWidth:0,padding:"2px 4px",borderRadius:5,border:`1px solid ${T.accent}`,background:T.bg,color:T.ink,fontSize:10,outline:"none"}}/>
                  ):(
                    <div onDoubleClick={e=>{e.stopPropagation();setRenamingLayer(l.id);setRenameVal(l.n)}} style={{flex:1,fontSize:10,color:l.v?T.ink:T.muted,fontWeight:isActive?800:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.n}</div>
                  )}
                  <span style={{fontSize:8,color:T.muted,flexShrink:0}}>{strokeCount||""}</span>
                  <button type="button" onClick={e=>{e.stopPropagation();setLayers(p=>p.map(x=>x.id===l.id?{...x,v:!x.v}:x));scheduleSave()}} style={{background:"none",border:"none",cursor:"pointer",color:l.v?lc:T.muted+"66",fontSize:11,padding:"0 2px",flexShrink:0}}>{l.v?"◉":"○"}</button>
                  <button type="button" onClick={e=>{e.stopPropagation();setLayers(p=>p.map(x=>x.id===l.id?{...x,locked:!x.locked}:x));scheduleSave()}} style={{background:"none",border:"none",cursor:"pointer",color:l.locked?T.accent:T.muted+"66",fontSize:10,padding:"0 1px",flexShrink:0}}>{l.locked?"🔒":"🔓"}</button>
                  {layers.length>1&&<button type="button" onClick={e=>{e.stopPropagation();handleDeleteLayer(l.id)}} style={{background:"none",border:"none",cursor:"pointer",color:"#e94560",fontSize:10,padding:"0 1px",flexShrink:0}}>×</button>}
                </div>
                <div style={{padding:"0 8px 6px",display:"flex",alignItems:"center",gap:6}} onClick={e=>e.stopPropagation()}>
                  <input type="range" min="0.05" max="1" step="0.05" value={l.opacity??1} onChange={e=>setLayers(p=>p.map(x=>x.id===l.id?{...x,opacity:parseFloat(e.target.value)}:x))} onMouseUp={()=>scheduleSave()} style={{flex:1,accentColor:lc,height:4}}/>
                  <span style={{fontSize:8,color:T.muted,minWidth:26,textAlign:"right"}}>{Math.round((l.opacity??1)*100)}%</span>
                </div>
              </div>
            )})}
          </div>
        </DraggablePanel>
      )}

    </div>
  )
}
