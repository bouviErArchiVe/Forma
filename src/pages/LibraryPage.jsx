import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import useAppStore from "@/stores/useAppStore"
import { supabase } from "@/lib/supabase"
import { safeJsonParse, safeGetLocalStorage } from "@/lib/storage"
import { THEMES } from "@/lib/themes"
import { BRAND, MODULES } from "@/config/branding"
import FocusPanel from "@/components/FocusPanel"
import SpotifyLibraryPanel from "@/components/SpotifyLibraryPanel"
import { BACKGROUNDS } from '@/lib/backgrounds'
import { APP_FONT_CHOICES } from "@/lib/fontUtils"
import { APPEARANCE_MODES, applyAppearanceToTheme } from "@/lib/appearance"
import { optionCardStyle, optionChipStyle, optionPanelStyle } from "@/config/appearance"
import UnitConverter from "@/components/UnitConverter"
import TranslationWidget from "@/components/translation/TranslationWidget"
import CalculatorDrawer from "@/components/CalculatorDrawer"
import { checkEasterEggText } from "@/hooks/useEasterEggTrigger"
import { mapActionError } from "@/lib/userMessages"
import ProfilePanel from "@/components/ProfilePanel"
import NotificationPanel, { NotificationBell } from "@/components/NotificationPanel"
import { useCollaboration } from "@/hooks/useCollaboration"
import { useAuth } from "@/hooks/useAuth"
import { useCalculator } from "@/hooks/useCalculator"
import BrandLogo, { ThemePreviewThumb } from "@/components/BrandLogo"
import { useTheme } from "@/hooks/useAppearance"
import GlassButton from "@/components/ui/GlassButton"
import GlassPanel from "@/components/ui/GlassPanel"
import ModalOverlay from "@/components/ui/ModalOverlay"
import BottomSheet from "@/components/ui/BottomSheet"
import { useTabletLayout } from "@/hooks/useTabletLayout"
import { useLongPress } from "@/hooks/useLongPress"
import { glassStyle, rgbaFromHex } from "@/theme/glass"
import { TOKENS } from "@/theme/tokens"
import { serializePageElements, defaultPageMeta } from "@/lib/pageSettings"
import { serializeCanvasData, DEFAULT_LAYERS, defaultActiveLayerId } from "@/lib/layers"
import CoverPattern from "@/components/CoverPattern"
import { LIBRARY_VIEWS, LIBRARY_SORTS, sortNotebooks, groupNotebooksByMonth } from "@/lib/libraryViews"
import {
  loadLocalNotebooks,
  upsertLocalNotebook,
  deleteLocalNotebook,
  saveLocalPages,
  isLocalNotebookId,
} from "@/lib/projectPersistence"
import {
  loadFolders,
  loadLocalFoldersForScope,
  persistFolderCreate,
  persistFolderDelete,
  persistFolderUpdate,
  syncFoldersToCloud,
  resolveFolderUserId,
} from "@/lib/folderPersistence"
import { getFolderDescendantIds, canCreateChildFolder, MAX_FOLDER_DEPTH } from "@/lib/folders/tree"
import FormaFolderExplorer from "@/components/formafolder/FormaFolderExplorer"
import {
  BookOpen, Star, Users, ShoppingBag, Search, Grid3X3, List, Plus,
  FileText, FolderOpen, ChevronLeft,
} from "lucide-react"

const COLORS = {
  bg: '#000000',
  sidebar: '#1C1C1E',
  sidebarActive: '#2C2C2E',
  header: '#1C1C1E',
  card: '#2C2C2E',
  cardBorder: '#3A3A3C',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  textMuted: '#636366',
  accent: '#0A84FF',
  separator: '#38383A',
  inactive: '#EBEBF5',
  star: '#FFD60A',
  destructive: '#FF453A',
}

const SIDEBAR_NAV = [
  { id: 'documents', label: 'Documents', Icon: BookOpen },
  { id: 'favorites', label: 'Favoris', Icon: Star },
  { id: 'shared', label: 'Partagé', Icon: Users },
  { id: 'marketplace', label: 'Marketplace', Icon: ShoppingBag },
]

const FOLDER_EMOJIS = ["📁","📂","🏗","🏛","📐","⚙","🎨","📚","🌿","🔥","⭐","💡","🎯","🏆","🔬","🌍","🏠","🚀","💎","🗂"]

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

const RECENT_KEY = "forma_recent"
const saveRecent = (id) => {
  try {
    const prev = safeJsonParse(safeGetLocalStorage(RECENT_KEY, '[]'), [])
    const r = [id, ...(Array.isArray(prev) ? prev : []).filter(x => x !== id)].slice(0, 5)
    localStorage.setItem(RECENT_KEY, JSON.stringify(r))
  } catch {}
}

function timeAgo(d){const m=Math.floor((Date.now()-new Date(d).getTime())/60000);if(m<1)return"À l'instant";if(m<60)return`Il y a ${m}min`;const h=Math.floor(m/60);if(h<24)return`Il y a ${h}h`;const days=Math.floor(h/24);if(days===1)return"Hier";return new Date(d).toLocaleDateString("fr-FR")}

function formatDocDate(d) {
  if (!d) return '—'
  const date = new Date(d)
  return `${date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })} à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
}

function MacFolderIcon({ width = 120, color = COLORS.accent }) {
  return (
    <svg width={width} height={width * 0.75} viewBox="0 0 120 90" fill="none" aria-hidden>
      <path d="M8 22C8 16.477 12.477 12 18 12H46L54 20H102C107.523 20 112 24.477 112 30V76C112 81.523 107.523 86 102 86H18C12.477 86 8 81.523 8 76V22Z" fill={color} />
      <path d="M8 28C8 22.477 12.477 18 18 18H44L52 26H102C107.523 26 112 30.477 112 36V76C112 81.523 107.523 86 102 86H18C12.477 86 8 81.523 8 76V28Z" fill={color} opacity="0.88" />
      <path d="M8 34H112V76C112 81.523 107.523 86 102 86H18C12.477 86 8 81.523 8 76V34Z" fill={color} opacity="0.72" />
    </svg>
  )
}

function IOSContextMenu({ x, y, items, onClose }) {
  useEffect(() => {
    const close = () => onClose()
    window.addEventListener('pointerdown', close)
    window.addEventListener('scroll', close, true)
    return () => {
      window.removeEventListener('pointerdown', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [onClose])

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        left: x,
        top: y,
        zIndex: 9600,
        minWidth: 200,
        background: COLORS.card,
        borderRadius: 14,
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        overflow: 'hidden',
        border: `1px solid ${COLORS.cardBorder}`,
      }}
    >
      {items.map((item, i) => (
        <div key={item.label}>
          {i > 0 && <div style={{ height: 1, background: COLORS.cardBorder }} />}
          <button
            type="button"
            onClick={() => { item.action?.(); onClose() }}
            style={{
              display: 'block',
              width: '100%',
              height: 44,
              padding: '0 16px',
              border: 'none',
              background: 'transparent',
              color: item.destructive ? COLORS.destructive : COLORS.text,
              fontSize: 15,
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            {item.label}
          </button>
        </div>
      ))}
    </div>
  )
}

function SidebarNavItem({ item, active, onClick }) {
  const [hover, setHover] = useState(false)
  const Icon = item.Icon
  const isActive = active
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        height: 44,
        padding: '0 16px',
        border: 'none',
        borderRadius: 10,
        cursor: 'pointer',
        background: isActive ? COLORS.sidebarActive : (hover ? COLORS.sidebarActive : 'transparent'),
        color: isActive ? COLORS.accent : COLORS.inactive,
        transition: 'background-color 150ms ease',
      }}
    >
      <Icon size={20} strokeWidth={2} />
      <span style={{ fontSize: 14, fontWeight: 500 }}>{item.label}</span>
    </button>
  )
}

function GoodNotesFolderCard({ folder, onOpen, onContextMenu, onStar }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onContextMenu={onContextMenu}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        cursor: 'pointer',
        opacity: hover ? 0.8 : 1,
        transition: 'opacity 150ms ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {folder.starred && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onStar?.(e) }}
          style={{ position: 'absolute', top: 0, right: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 4, zIndex: 2 }}
        >
          <Star size={16} fill={COLORS.star} color={COLORS.star} />
        </button>
      )}
      <MacFolderIcon width={120} color={folder.color || COLORS.accent} />
      <div style={{ fontSize: 13, fontWeight: 500, color: COLORS.text, marginTop: 8, textAlign: 'center', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {folder.e ? `${folder.e} ` : ''}{folder.n}
      </div>
      <div style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' }}>
        {formatDocDate(folder.updated_at || folder.created_at)}
      </div>
    </div>
  )
}

function GoodNotesDocumentCard({ nb, subject, onOpen, onStar, onContextMenu, selectionMode, selected, onToggleSelect, onLongPress, view = 'grid' }) {
  const [hover, setHover] = useState(false)
  const thumb = nb.thumbnail || nb.cover_url || nb.cover_image

  const lp = useLongPress({
    onLongPress: () => onLongPress?.(),
    onClick: (e) => {
      if (selectionMode) {
        e?.stopPropagation?.()
        onToggleSelect?.()
      } else {
        onOpen?.()
      }
    },
  })

  if (view === 'list') {
    return (
      <div
        {...lp}
        onContextMenu={onContextMenu}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '10px 12px',
          borderRadius: 12,
          background: COLORS.card,
          border: `1px solid ${selected ? COLORS.accent : COLORS.cardBorder}`,
          cursor: 'pointer',
          transform: hover ? 'scale(1.01)' : 'none',
          boxShadow: hover ? '0 4px 20px rgba(0,0,0,0.4)' : 'none',
          transition: 'transform 150ms ease, box-shadow 150ms ease',
        }}
      >
        <div style={{ width: 48, height: 64, borderRadius: 8, background: COLORS.sidebar, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {thumb ? <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <FileText size={22} color={COLORS.textSecondary} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: COLORS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nb.title}</div>
          <div style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 4 }}>{formatDocDate(nb.updated_at)}</div>
        </div>
        <button type="button" onClick={onStar} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <Star size={16} fill={nb.starred ? COLORS.star : 'none'} color={nb.starred ? COLORS.star : COLORS.textSecondary} />
        </button>
      </div>
    )
  }

  return (
    <div
      {...lp}
      onContextMenu={onContextMenu}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        background: COLORS.card,
        border: `1px solid ${selected ? COLORS.accent : COLORS.cardBorder}`,
        cursor: 'pointer',
        transform: hover ? 'scale(1.02)' : 'none',
        boxShadow: hover ? '0 4px 20px rgba(0,0,0,0.4)' : 'none',
        transition: 'transform 150ms ease, box-shadow 150ms ease',
        position: 'relative',
      }}
    >
      {selectionMode && selected && (
        <div style={{ position: 'absolute', top: 8, left: 8, width: 22, height: 22, borderRadius: '50%', background: COLORS.accent, color: '#fff', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}>✓</div>
      )}
      <div style={{ position: 'relative', aspectRatio: '3/4', background: COLORS.sidebar, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {thumb ? (
          <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CoverPattern tmpl={nb.template} color={subject?.c || COLORS.accent} />
            <FileText size={40} color={COLORS.textSecondary} style={{ position: 'relative', zIndex: 1 }} />
          </div>
        )}
        <button
          type="button"
          onClick={onStar}
          style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 4, zIndex: 2 }}
        >
          <Star size={16} fill={nb.starred ? COLORS.star : 'none'} color={nb.starred ? COLORS.star : COLORS.textSecondary} />
        </button>
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: COLORS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nb.title}</div>
        <div style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 4 }}>{formatDocDate(nb.updated_at)}</div>
      </div>
    </div>
  )
}

function StatChip({e, v, l, tab, activeTab, setActiveTab, T, action}) {
  const isActive = tab && activeTab === tab
  const clickable = !!(tab || action)
  return (
    <div
      className={`forma-stat-chip ${clickable ? 'forma-stat-chip--clickable' : ''}`}
      onClick={() => action ? action() : (tab && setActiveTab(tab))}
      style={{
        background: isActive ? `${T.accent}18` : T.surface,
        border:`1px solid ${isActive ? T.accent : T.border}`,
        cursor: clickable ? "pointer" : "default",
      }}
      onMouseEnter={e2 => { if (clickable) e2.currentTarget.style.borderColor = T.accent + "66" }}
      onMouseLeave={e2 => { if (clickable) e2.currentTarget.style.borderColor = isActive ? T.accent : T.border }}
    >
      <span style={{fontSize:13}}>{e}</span>
      <span style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:14,color:isActive?T.accent:T.ink,lineHeight:1}}>{v}</span>
      <span style={{fontSize:10,color:T.muted,lineHeight:1}}>{l}</span>
    </div>
  )
}

const ANIM_TYPES = [
  {id:'',          emoji:'🎭', label:'Défaut thème'},
  {id:'fireflies', emoji:'✨', label:'Lucioles'},
  {id:'leaves',    emoji:'🍃', label:'Feuilles'},
  {id:'sparkles',  emoji:'⭐', label:'Éclats'},
  {id:'geometry',  emoji:'⬡', label:'Géométrie'},
  {id:'waves',     emoji:'〰', label:'Vagues'},
  {id:'drops',     emoji:'💧', label:'Gouttes'},
  {id:'pulses',    emoji:'◎', label:'Pulsations'},
  {id:'pencil',    emoji:'✏', label:'Crayon'},
]

const SPEED_OPTIONS = [
  {v:0.3, l:'Lente'},
  {v:0.6, l:'Douce'},
  {v:1,   l:'Normale'},
  {v:1.8, l:'Rapide'},
  {v:3,   l:'Frénétique'},
]

function ThemePicker({ onClose }) {
  const {
    themeId,
    setTheme,
    appFont,
    setAppFont,
    appearanceMode,
    setAppearanceMode,
    animationsEnabled,
    setAnimationsEnabled,
    easterEggsEnabled,
    setEasterEggsEnabled,
    animType,
    setAnimType,
    animSpeed,
    setAnimSpeed,
    bgId,
    setBgId,
    customBg,
    setCustomBg,
    addNotification,
  } = useAppStore()

  const [tab, setTab] = useState("theme")
  const modalRef = useRef()
  const TABS=[["theme","🎨 FTheme"],["appearance","🌗 Apparence"],["animation","✨ Animation"],["fond","🖼 Fond"],["font","🔤 Polices"]]
  const switchTab = (id) => { setTab(id); setTimeout(() => modalRef.current?.scrollTo({top:0, behavior:'auto'}), 0) }

  // Draft state: nothing is persisted/applied until user validates
  const [draftThemeId, setDraftThemeId] = useState(themeId)
  const [draftAppearanceMode, setDraftAppearanceMode] = useState(appearanceMode || "light")
  const [draftAnimationsEnabled, setDraftAnimationsEnabled] = useState(animationsEnabled)
  const [draftEasterEggsEnabled, setDraftEasterEggsEnabled] = useState(easterEggsEnabled !== false)
  const [draftAnimType, setDraftAnimType] = useState(animType)
  const [draftAnimSpeed, setDraftAnimSpeed] = useState(animSpeed)
  const [draftBgId, setDraftBgId] = useState(bgId)
  const [draftCustomBg, setDraftCustomBg] = useState(customBg)
  const [draftAppFont, setDraftAppFont] = useState(appFont || "")

  const draftBaseTheme = THEMES.find(t => t.id === draftThemeId) || THEMES[0]
  const T = applyAppearanceToTheme(draftBaseTheme, draftAppearanceMode || "light")
  const ink = T.ink
  const muted = T.muted
  const accent = T.accent
  const draftTheme = draftBaseTheme

  const handleCustomBg = (e) => {
    const f = e.target.files?.[0]; if (!f) return
    const r = new FileReader()
    r.onload = ev => { setDraftCustomBg(ev.target.result); setDraftBgId('') }
    r.readAsDataURL(f)
  }

  const applyDraft = () => {
    setTheme(draftThemeId)
    setAppearanceMode(draftAppearanceMode || "light")
    setAnimationsEnabled(draftAnimationsEnabled)
    setEasterEggsEnabled(draftEasterEggsEnabled)
    setAnimType(draftAnimType)
    setAnimSpeed(draftAnimSpeed)
    setBgId(draftBgId)
    setCustomBg(draftCustomBg || "")
    setAppFont(draftAppFont || "")

    if (draftThemeId !== themeId) addNotification("FTheme appliqué", "success")
    if ((draftAppearanceMode || "light") !== (appearanceMode || "light")) addNotification("Apparence appliquée", "success")
    if (draftBgId !== bgId || (draftCustomBg || "") !== (customBg || "")) addNotification("Fond appliqué", "success")
    if (draftAnimType !== animType || draftAnimSpeed !== animSpeed || draftAnimationsEnabled !== animationsEnabled) addNotification("Animation appliquée", "success")
    if (draftEasterEggsEnabled !== (easterEggsEnabled !== false)) addNotification("Easter eggs mis à jour", "success")
    if ((draftAppFont || "") !== (appFont || "")) addNotification("Police appliquée", "success")

    onClose?.()
  }

  const resetDraft = () => {
    setDraftThemeId("horizon")
    setDraftAppearanceMode("light")
    setDraftAnimationsEnabled(true)
    setDraftEasterEggsEnabled(true)
    setDraftAnimType("")
    setDraftAnimSpeed(1)
    setDraftBgId("")
    setDraftCustomBg("")
    setDraftAppFont("")
  }

  return (
    <ModalOverlay onClose={onClose} zIndex={9000} variant="sheet">
      <GlassPanel
        T={T}
        variant="modal"
        style={{ padding: 22, width: 600, maxWidth: "95vw", maxHeight: "88vh", overflowY: "auto" }}
        ref={modalRef}
      >
        <div style={{ position: "relative", marginBottom: 14, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", padding: "2px 40px 0", boxSizing: "border-box" }}>
          <button
            onClick={onClose}
            className="forma-btn-glass"
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 22,
              color: muted,
              padding: "2px 6px",
              zIndex: 1,
              lineHeight: 1,
            }}
          >
            ×
          </button>
          <BrandLogo
            src={draftTheme.img}
            alt={draftTheme.n}
            size="md"
            subtitle="Ambiance · FTheme & personnalisation"
            accent={accent}
            ink={ink}
            muted={muted}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: muted, lineHeight: 1.35 }}>
            Prévisualise, puis clique sur <b>Valider et appliquer</b> pour enregistrer.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <GlassButton T={T} size="md" onClick={resetDraft}>Réinitialiser</GlassButton>
            <button onClick={applyDraft} className="forma-btn-glass" style={{ padding: "9px 12px", borderRadius: TOKENS.radius.sm, border: "none", background: accent, cursor: "pointer", fontWeight: 800, fontSize: 12, color: "#fff", boxShadow: `0 6px 18px ${accent}44` }}>
              Valider et appliquer
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 4, marginBottom: 18, background: rgbaFromHex(T.bg, 0.45), borderRadius: TOKENS.radius.md, padding: 4, border: `1px solid ${rgbaFromHex(T.border, 0.35)}` }}>
          {TABS.map(([id,l])=>(
            <button key={id} onClick={()=>switchTab(id)} className="forma-btn-glass"
              style={{ flex: 1, padding: "7px 0", borderRadius: TOKENS.radius.sm, border: "none", background: tab===id ? rgbaFromHex(T.surface, 0.9) : "transparent", color: tab===id ? ink : muted, fontWeight: tab===id ? 700 : 400, fontSize: 12, cursor: "pointer", boxShadow: tab===id ? TOKENS.shadow.sm : "none" }}>
              {l}
            </button>
          ))}
        </div>

        {tab==="theme"&&(
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:9}}>
            {THEMES.map(th=>(
              <ThemePreviewThumb
                key={th.id}
                theme={th}
                selected={draftThemeId===th.id}
                onSelect={()=>setDraftThemeId(th.id)}
                selectedLabel="✓ Prévu"
              />
            ))}
          </div>
        )}

        {tab==="appearance"&&(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{fontSize:11,color:muted}}>
              L’<b>apparence</b> gère la luminosité (clair/sombre) sans changer l’identité du thème.
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8}}>
              {APPEARANCE_MODES.map(m => {
                const active = (draftAppearanceMode || "light") === m.id
                return (
                  <button key={m.id} onClick={()=>setDraftAppearanceMode(m.id)} style={optionCardStyle(T, active)}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
                      <div>
                        <div style={{fontSize:12,fontWeight:900,color:active?T.accent:ink}}>{m.label}</div>
                        <div style={{fontSize:10,color:muted,marginTop:2}}>{m.desc}</div>
                      </div>
                      {active && <div style={{fontSize:11,fontWeight:900,color:T.accent}}>✓</div>}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {tab==="animation"&&(
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={optionPanelStyle(T)}>
              <div>
                <div style={{fontWeight:700,fontSize:13,color:ink}}>Animations de fond</div>
                <div style={{fontSize:11,color:muted,marginTop:2}}>Particules animées en arrière-plan</div>
              </div>
              <button onClick={()=>setDraftAnimationsEnabled(!draftAnimationsEnabled)}
                style={{width:44,height:24,borderRadius:12,background:draftAnimationsEnabled?T.accent:T.border,border:"none",cursor:"pointer",position:"relative",transition:"background .2s"}}>
                <div style={{position:"absolute",top:2,left:draftAnimationsEnabled?22:2,width:20,height:20,borderRadius:"50%",background:T.surface,transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,.2)"}}/>
              </button>
            </div>

            <div style={optionPanelStyle(T)}>
              <div>
                <div style={{fontWeight:700,fontSize:13,color:ink}}>Easter eggs 🎉</div>
                <div style={{fontSize:11,color:muted,marginTop:2}}>Animations « caca » et « chat » (non bloquantes)</div>
              </div>
              <button onClick={()=>setDraftEasterEggsEnabled(!draftEasterEggsEnabled)}
                style={{width:44,height:24,borderRadius:12,background:draftEasterEggsEnabled?T.accent:T.border,border:"none",cursor:"pointer",position:"relative",transition:"background .2s"}}>
                <div style={{position:"absolute",top:2,left:draftEasterEggsEnabled?22:2,width:20,height:20,borderRadius:"50%",background:T.surface,transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,.2)"}}/>
              </button>
            </div>

            <div>
              <div style={{fontSize:10,fontWeight:700,color:muted,marginBottom:8,letterSpacing:.8}}>TYPE D'ANIMATION</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
                {ANIM_TYPES.map(({id,emoji,label})=>{
                  const active = draftAnimType===id
                  return (
                    <button key={id||'none'} onClick={()=>setDraftAnimType(id)} style={optionChipStyle(T, active)}>
                      <div style={{fontSize:18}}>{emoji}</div>
                      <div style={{fontSize:9,fontWeight:active?700:400,color:active?T.accent:muted,textAlign:"center",lineHeight:1.2}}>{label}</div>
                    </button>
                  )
                })}
              </div>
              <div style={{fontSize:10,color:muted,marginTop:8}}>
                {draftAnimType===''
                  ? `Suit le thème prévu · ${ANIM_TYPES.find(a=>a.id===(draftTheme?.anim||'fireflies'))?.label||'Lucioles'}`
                  : <span>Animation indépendante du thème · <button onClick={()=>setDraftAnimType('')} style={{background:"none",border:"none",color:T.accent,cursor:"pointer",fontSize:10,padding:0,fontFamily:"inherit"}}>Revenir au défaut</button></span>
                }
              </div>
            </div>

            <div>
              <div style={{fontSize:10,fontWeight:700,color:muted,marginBottom:8,letterSpacing:.8}}>VITESSE</div>
              <div style={{display:"flex",gap:6}}>
                {SPEED_OPTIONS.map(({v,l})=>(
                  <button key={v} onClick={()=>setDraftAnimSpeed(v)}
                    style={{...optionChipStyle(T, draftAnimSpeed===v), flex:1, padding:"8px 4px", flexDirection:"row", justifyContent:"center"}}>
                    <span style={{fontSize:10,fontWeight:draftAnimSpeed===v?700:400,color:draftAnimSpeed===v?T.accent:muted}}>{l}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab==="fond"&&(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{fontSize:11,color:muted}}>Fond en filigrane derrière l'interface (visible après validation).</div>
            {(draftBgId||draftCustomBg)&&(
              <div style={{height:48,borderRadius:10,border:`1px solid ${T.border}`,overflow:"hidden",position:"relative",background:T.surface,color:T.accent}}>
                {draftCustomBg
                  ?<img src={draftCustomBg} alt="" style={{width:"100%",height:"100%",objectFit:"cover",opacity:.55}}/>
                  :<div style={{width:"100%",height:"100%",opacity:.7}} dangerouslySetInnerHTML={{__html:(BACKGROUNDS.find(b=>b.id===draftBgId)?.svg||'').replace('<svg ','<svg style="width:100%;height:100%;" preserveAspectRatio="xMidYMid slice" ')}}/>}
              </div>
            )}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
              <button onClick={()=>{setDraftBgId('');setDraftCustomBg('')}}
                style={{padding:0,border:`2px solid ${draftBgId===''&&!draftCustomBg?T.accent:T.border}`,borderRadius:11,overflow:"hidden",cursor:"pointer",background:"none",transition:"all .15s"}}>
                <div style={{height:70,background:T.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <div style={{fontSize:22,color:muted}}>✕</div>
                </div>
                <div style={{padding:"5px 8px",background:T.surface,textAlign:"center",borderTop:`1px solid ${T.border}`}}>
                  <div style={{fontSize:10,fontWeight:draftBgId===''&&!draftCustomBg?700:400,color:draftBgId===''&&!draftCustomBg?T.accent:muted}}>Aucun fond</div>
                </div>
              </button>
              <label style={{padding:0,border:`2px solid ${draftCustomBg?T.accent:T.border}`,borderRadius:11,overflow:"hidden",cursor:"pointer",background:"none",transition:"all .15s",display:"block"}}>
                <div style={{height:70,background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",position:"relative"}}>
                  {draftCustomBg
                    ?<img src={draftCustomBg} alt="" style={{width:"100%",height:"100%",objectFit:"cover",opacity:.7}}/>
                    :<div style={{fontSize:22,color:muted}}>📷</div>}
                </div>
                <div style={{padding:"5px 8px",background:T.surface,textAlign:"center",borderTop:`1px solid ${T.border}`}}>
                  <div style={{fontSize:10,fontWeight:draftCustomBg?700:400,color:draftCustomBg?T.accent:muted}}>{draftCustomBg?"Ma photo ✓":"Ma photo"}</div>
                </div>
                <input type="file" accept="image/*" style={{display:"none"}} onChange={handleCustomBg}/>
              </label>
              {BACKGROUNDS.map(b=>(
                <button key={b.id} onClick={()=>{setDraftBgId(b.id); setDraftCustomBg('')}}
                  style={{padding:0,border:`2px solid ${draftBgId===b.id?T.accent:T.border}`,borderRadius:11,overflow:"hidden",cursor:"pointer",background:"none",transition:"all .15s"}}>
                  <div style={{height:70,overflow:"hidden",position:"relative",background:T.bg,color:T.accent}}
                    dangerouslySetInnerHTML={{__html:b.svg.replace('<svg ','<svg style="width:100%;height:100%;position:absolute;top:0;left:0;" preserveAspectRatio="xMidYMid slice" ')}}/>
                  <div style={{padding:"5px 8px",background:T.surface,borderTop:`1px solid ${T.border}`}}>
                    <div style={{fontSize:10,fontWeight:draftBgId===b.id?700:400,color:draftBgId===b.id?T.accent:ink,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.n}</div>
                    <div style={{fontSize:8,color:muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab==="font"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div style={{fontSize:11,color:muted}}>
              La police globale est appliquée à toute l'application via <code>--app-font</code>.
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8}}>
              {APP_FONT_CHOICES.map(f => {
                const active = (draftAppFont || "") === (f.id || "")
                return (
                  <button key={f.id || "default"} onClick={()=>setDraftAppFont(f.id)} style={optionCardStyle(T, active)}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,width:"100%"}}>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-start",gap:2}}>
                        <div style={{fontSize:12,fontWeight:800,color:active?T.accent:ink}}>{f.label}</div>
                        <div style={{fontSize:10,color:muted,fontFamily: f.id ? `'${f.id}', var(--app-font), sans-serif` : "var(--app-font)"}}>
                          Aa Bb Cc 0123
                        </div>
                      </div>
                      {active && <div style={{fontSize:11,fontWeight:900,color:T.accent}}>✓</div>}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </GlassPanel>
    </ModalOverlay>
  )
}

export default function LibraryPage() {
  const navigate = useNavigate()
  const {
    setActiveNotebook,
    spotifyLinks,
    activeSpotifyId,
    addSpotifyLink,
    removeSpotifyLink,
    setActiveSpotifyLink,
    addNotification,
    libraryView,
    setLibraryView,
    librarySort,
    setLibrarySort,
    activityStreak,
  } = useAppStore()
  const { T } = useTheme()
  const isTablet = useTabletLayout()
  const [showFocus, setShowFocus] = useState(false)
  const [showSpotify, setShowSpotify] = useState(false)
  const spotifyIframeRef = useRef(null)

  const [notebooks, setNotebooks] = useState([])
  const [folders, setFolders] = useState(() => loadLocalFoldersForScope(null))
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

  const [showCalc, setShowCalc] = useState(false)
  const [showConverter, setShowConverter] = useState(false)
  const [showTranslate, setShowTranslate] = useState(false)
  const [showProfilePanel, setShowProfilePanel] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showModuleMenu, setShowModuleMenu] = useState(false)
  const [sidebarSection, setSidebarSection] = useState('documents')
  const [ctxMenu, setCtxMenu] = useState(null)
  const [gridVisible, setGridVisible] = useState(false)
  const avatarRef = useRef(null)
  const { signOut: authSignOut } = useAuth()
  const collab = useCollaboration()
  const calc = useCalculator()
  const [convValue, setConvValue] = useState("")
  const [convCategory, setConvCategory] = useState("length")
  const [convFrom, setConvFrom] = useState("m")
  const [convTo, setConvTo] = useState("cm")

  // Modals
  const [showNew, setShowNew] = useState(false)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [showNewSubject, setShowNewSubject] = useState(false)
  const [showFolderAssign, setShowFolderAssign] = useState(null)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState(() => new Set())

  // New notebook
  const [newTitle, setNewTitle] = useState("")
  const [newSubj, setNewSubj] = useState("arch")
  const [newTmpl, setNewTmpl] = useState("plan")
  const [newFolder, setNewFolder] = useState("none")
  const [saving, setSaving] = useState(false)

  // New folder
  const [folderName, setFolderName] = useState("")
  const [folderEmoji, setFolderEmoji] = useState("📁")
  const [folderColor, setFolderColor] = useState("#3d6b8c")
  const [newFolderParentId, setNewFolderParentId] = useState(null)

  // Edit folder
  const [showEditFolder, setShowEditFolder] = useState(false)
  const [editFolderId, setEditFolderId] = useState(null)
  const [editFolderName, setEditFolderName] = useState("")
  const [editFolderEmoji, setEditFolderEmoji] = useState("📁")
  const [editFolderColor, setEditFolderColor] = useState("#3d6b8c")
  const [foldersCloudOk, setFoldersCloudOk] = useState(null)
  const [syncingFolders, setSyncingFolders] = useState(false)

  // New subject
  const [subjName, setSubjName] = useState("")
  const [subjEmoji, setSubjEmoji] = useState("⭐")
  const [subjColor, setSubjColor] = useState("#c8622a")

  useEffect(() => {
    const init = async () => {
      let uid = null
      try {
        const local = loadLocalNotebooks()
        const { data: { session } } = await supabase.auth.getSession()
        uid = session?.user?.id || null

        if (uid) {
          setUserId(uid)
          const uname = session.user.user_metadata?.full_name || session.user.email || ""
          setUserName(uname)
        }

        // Dossiers : chargement indépendant (ne jamais écraser à [] si les carnets échouent)
        try {
          const folderRes = uid ? await loadFolders(uid) : { folders: loadLocalFoldersForScope(null), cloudOk: false }
          setFolders(folderRes.folders || [])
          setFoldersCloudOk(folderRes.cloudOk ?? false)
        } catch {
          setFolders(loadLocalFoldersForScope(uid))
          setFoldersCloudOk(false)
        }

        // Carnets
        if (uid) {
          try {
            const { data, error } = await supabase
              .from("notebooks")
              .select("*")
              .eq("user_id", uid)
              .order("updated_at", { ascending: false })
            if (error) throw error
            const cloud = data || []
            const merged = [...cloud]
            local.forEach((ln) => {
              if (!merged.some((n) => n.id === ln.id)) merged.push(ln)
            })
            merged.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
            setNotebooks(merged)
          } catch {
            setNotebooks(local.length ? local : loadLocalNotebooks())
            addNotification("Carnets cloud indisponibles — mode local", "error")
          }
        } else {
          setNotebooks(local)
        }
      } catch {
        setNotebooks(loadLocalNotebooks())
        setFolders(loadLocalFoldersForScope(uid))
      } finally {
        setLoading(false)
      }
    }
    init()
    setRecentIds(safeJsonParse(safeGetLocalStorage(RECENT_KEY, '[]'), []))
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
    const mf = folderFilt === "all"
      || (folderFilt === "none" ? !n.folder_id : (
        n.folder_id === folderFilt
        || getFolderDescendantIds(folders, folderFilt).includes(n.folder_id)
      ))
    const mstar = activeTab !== "favorites" || n.starred
    return ms && msj && mf && mstar
  }), [notebooks, search, subjFilt, folderFilt, activeTab, folders])

  const sortedFiltered = useMemo(
    () => sortNotebooks(filtered, librarySort, subjects),
    [filtered, librarySort, subjects],
  )

  const visibleFolders = useMemo(() => {
    if (activeTab !== 'notebooks' || folderFilt === 'none') return []
    const parentId = folderFilt === 'all' ? null : folderFilt
    return folders.filter((f) => (f.parentId || null) === parentId)
  }, [folders, folderFilt, activeTab])

  const currentFolder = useMemo(() => {
    if (folderFilt === 'all' || folderFilt === 'none') return null
    return folders.find((f) => f.id === folderFilt) || null
  }, [folders, folderFilt])

  const sectionTitle = useMemo(() => {
    if (activeTab === 'favorites') return 'Favoris'
    if (currentFolder) return currentFolder.n
    return 'Documents'
  }, [activeTab, currentFolder])

  useEffect(() => {
    setGridVisible(false)
    const t = requestAnimationFrame(() => setGridVisible(true))
    return () => cancelAnimationFrame(t)
  }, [activeTab, folderFilt, libraryView, sortedFiltered.length])

  const handleSidebarNav = (id) => {
    setSidebarSection(id)
    if (id === 'documents') {
      setActiveTab('notebooks')
      return
    }
    if (id === 'favorites') {
      setActiveTab('favorites')
      return
    }
    if (id === 'shared') navigate('/account/folders')
    if (id === 'marketplace') navigate(MODULES.formaHub.route)
  }

  const openContextMenu = (e, payload) => {
    e.preventDefault()
    e.stopPropagation()
    setCtxMenu({ x: e.clientX, y: e.clientY, ...payload })
  }

  const open = nb => {
    saveRecent(nb.id)
    setRecentIds(safeJsonParse(safeGetLocalStorage(RECENT_KEY, '[]'), []))
    setActiveNotebook(nb)
    navigate(`/editor/${nb.id}`)
  }

  const toggleStar = async (id, e) => {
    e.stopPropagation()
    const nb = notebooks.find(n => n.id === id); if (!nb) return
    const next = { ...nb, starred: !nb.starred }
    setNotebooks(ns => ns.map(n => n.id === id ? next : n))
    if (isLocalNotebookId(id)) upsertLocalNotebook(next)
    if (userId && !isLocalNotebookId(id)) await supabase.from("notebooks").update({ starred: next.starred }).eq("id", id)
  }

  const create = async () => {
    if (!newTitle.trim()) return
    setSaving(true)
    const subj = subjects.find(s => s.id === newSubj)
    const now = new Date().toISOString()
    const pageMeta = serializePageElements(defaultPageMeta(newTmpl))
    const emptyCanvas = serializeCanvasData([], DEFAULT_LAYERS, defaultActiveLayerId())
    const localNb = {
      id: `local-${Date.now()}`,
      title: newTitle.trim(),
      subject: newSubj,
      template: newTmpl,
      pages_count: 1,
      starred: false,
      color: subj?.c || "#c8622a",
      folder_id: newFolder === "none" ? null : newFolder,
      created_at: now,
      updated_at: now,
    }

    const finishCreate = (notebook, { persistLocal = false } = {}) => {
      if (persistLocal || isLocalNotebookId(notebook.id)) {
        upsertLocalNotebook(notebook)
        const pageMeta = serializePageElements(defaultPageMeta(notebook.template || newTmpl))
        const emptyCanvas = serializeCanvasData([], DEFAULT_LAYERS, defaultActiveLayerId())
        saveLocalPages(notebook.id, [{
          id: `local-${notebook.id}-p1`,
          page_number: 1,
          notebook_id: notebook.id,
          elements: JSON.stringify(pageMeta),
          canvas_data: emptyCanvas,
          updated_at: notebook.updated_at || now,
        }])
      }
      setNotebooks(p => [notebook, ...p.filter(n => n.id !== notebook.id)])
      setShowNew(false)
      setNewTitle("")
      setNewTmpl("plan")
      setNewSubj("arch")
      setNewFolder("none")
      addNotification(`Carnet « ${notebook.title} » créé`, "success")
      open(notebook)
    }

    try {
      if (userId) {
        const { id: _, ...nbPayload } = localNb
        const { data, error } = await supabase.from("notebooks").insert([{ ...nbPayload, user_id: userId }]).select().single()
        if (error) throw error

        const { error: pageError } = await supabase.from("pages").insert([{
          notebook_id: data.id,
          page_number: 1,
          user_id: userId,
          elements: JSON.stringify(pageMeta),
          canvas_data: emptyCanvas,
        }])
        if (pageError) throw pageError

        finishCreate(data)
      } else {
        finishCreate(localNb, { persistLocal: true })
      }
    } catch (err) {
      console.error("Notebook creation error:", err)
      addNotification(mapActionError(err, 'Impossible de créer le carnet en ligne — mode local utilisé'), 'error')
      finishCreate(localNb, { persistLocal: true })
    } finally {
      setSaving(false)
    }
  }

  const deleteNB = async (id, e) => {
    e?.stopPropagation?.()
    if (!confirm("Supprimer ce carnet définitivement ?")) return
    setNotebooks(ns => ns.filter(n => n.id !== id))
    if (isLocalNotebookId(id)) deleteLocalNotebook(id)
    if (userId && !isLocalNotebookId(id)) await supabase.from("notebooks").delete().eq("id", id)
  }

  const clearSelection = useCallback(() => {
    setSelectionMode(false)
    setSelectedIds(new Set())
  }, [])

  const enterSelection = useCallback((id) => {
    setSelectionMode(true)
    setSelectedIds(new Set([id]))
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10)
  }, [])

  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      if (next.size === 0) setSelectionMode(false)
      return next
    })
  }, [])

  const deleteSelected = async () => {
    const ids = [...selectedIds]
    if (!ids.length) return
    if (!confirm(`Supprimer ${ids.length} carnet(s) définitivement ?`)) return
    setNotebooks(ns => ns.filter(n => !ids.includes(n.id)))
    for (const id of ids) {
      if (isLocalNotebookId(id)) deleteLocalNotebook(id)
      else if (userId) await supabase.from("notebooks").delete().eq("id", id)
    }
    addNotification(`${ids.length} carnet(s) supprimé(s)`, "success")
    clearSelection()
  }

  const renderNotebook = useCallback((nb, view = libraryView) => {
    const subject = subjects.find(s => s.id === nb.subject) || subjects[0]
    return (
      <GoodNotesDocumentCard
        key={nb.id}
        nb={nb}
        subject={subject}
        view={view === 'timeline' ? 'list' : view}
        selectionMode={selectionMode}
        selected={selectedIds.has(nb.id)}
        onLongPress={() => enterSelection(nb.id)}
        onToggleSelect={() => toggleSelect(nb.id)}
        onOpen={() => open(nb)}
        onStar={(e) => toggleStar(nb.id, e)}
        onContextMenu={(e) => openContextMenu(e, {
          type: 'notebook',
          item: nb,
          items: [
            { label: 'Ouvrir', action: () => open(nb) },
            { label: nb.starred ? 'Retirer des favoris' : 'Ajouter aux favoris', action: () => toggleStar(nb.id, { stopPropagation: () => {} }) },
            { label: 'Déplacer…', action: () => setShowFolderAssign(nb.id) },
            { label: 'Supprimer', destructive: true, action: () => deleteNB(nb.id, { stopPropagation: () => {} }) },
          ],
        })}
      />
    )
  }, [subjects, libraryView, toggleStar, selectionMode, selectedIds, enterSelection, toggleSelect, open])

  const assignFolder = async (nbId, folderId) => {
    const next = notebooks.map(n => n.id === nbId ? {...n, folder_id: folderId || null, updated_at: new Date().toISOString()} : n)
    setNotebooks(next)
    const nb = next.find(n => n.id === nbId)
    if (nb && isLocalNotebookId(nbId)) upsertLocalNotebook(nb)
    if (userId && nb && !isLocalNotebookId(nbId)) {
      try {
        await supabase.from("notebooks").update({ folder_id: folderId || null }).eq("id", nbId)
      } catch {
        addNotification("Erreur lors de l'assignation du dossier", "error")
        return
      }
    }
    addNotification(folderId ? "Carnet déplacé dans le dossier" : "Carnet retiré du dossier", "success")
    setShowFolderAssign(null)
  }

  const assignFolderBatch = async (ids, folderId) => {
    const idSet = new Set(ids)
    const now = new Date().toISOString()
    const next = notebooks.map(n => idSet.has(n.id) ? { ...n, folder_id: folderId || null, updated_at: now } : n)
    setNotebooks(next)
    for (const id of ids) {
      const nb = next.find(n => n.id === id)
      if (!nb) continue
      if (isLocalNotebookId(id)) upsertLocalNotebook(nb)
      else if (userId) {
        try {
          await supabase.from("notebooks").update({ folder_id: folderId || null }).eq("id", id)
        } catch {
          addNotification("Erreur lors du déplacement groupé", "error")
          return
        }
      }
    }
    addNotification(`${ids.length} carnet(s) déplacé(s)`, "success")
    setShowFolderAssign(null)
    clearSelection()
  }

  const notifyFolderResult = (res, successMsg) => {
    if (!res.ok) {
      addNotification(res.error || "Erreur de sauvegarde du dossier", "error")
      return false
    }
    setFolders(res.folders)
    if (res.cloudOk) setFoldersCloudOk(true)
    addNotification(
      res.warning ? `${successMsg} (local) — ${res.warning}` : successMsg,
      res.warning ? "error" : "success",
    )
    return true
  }

  const createFolder = async () => {
    if (!folderName.trim()) return
    if (newFolderParentId && !canCreateChildFolder(folders, newFolderParentId)) {
      addNotification(`Profondeur max ${MAX_FOLDER_DEPTH} niveaux atteinte`, "error")
      return
    }
    const uid = userId || await resolveFolderUserId()
    if (uid && uid !== userId) setUserId(uid)
    const res = await persistFolderCreate(uid, {
      name: folderName.trim(),
      icon: folderEmoji,
      color: folderColor,
      parentId: newFolderParentId,
    })
    if (!notifyFolderResult(res, "Dossier créé")) return
    setShowNewFolder(false)
    setFolderName("")
    setFolderEmoji("📁")
    setFolderColor("#3d6b8c")
    setNewFolderParentId(null)
  }

  const openEditFolder = (folder) => {
    setEditFolderId(folder.id)
    setEditFolderName(folder.name || folder.n || "")
    setEditFolderEmoji(folder.icon || folder.e || "📁")
    setEditFolderColor(folder.color || "#3d6b8c")
    setShowEditFolder(true)
  }

  const saveEditFolder = async () => {
    if (!editFolderId || !editFolderName.trim()) return
    const uid = userId || await resolveFolderUserId()
    const res = await persistFolderUpdate(uid, editFolderId, {
      name: editFolderName.trim(),
      icon: editFolderEmoji,
      color: editFolderColor,
    })
    if (!notifyFolderResult(res, "Dossier mis à jour")) return
    setShowEditFolder(false)
    setEditFolderId(null)
  }

  const syncFolders = async () => {
    const uid = userId || await resolveFolderUserId()
    if (!uid) {
      addNotification("Connectez-vous pour synchroniser les dossiers", "error")
      return
    }
    setSyncingFolders(true)
    try {
      const res = await syncFoldersToCloud(uid)
      if (res.ok) {
        setFolders(res.folders)
        setFoldersCloudOk(true)
        addNotification("Dossiers synchronisés avec le cloud", "success")
      } else {
        setFoldersCloudOk(false)
        addNotification(res.error || "Synchronisation échouée", "error")
      }
    } finally {
      setSyncingFolders(false)
    }
  }

  const removeFolder = async (folderId) => {
    const target = folders.find((f) => f.id === folderId)
    const parentId = target?.parentId || null
    const res = await persistFolderDelete(userId, folderId)
    if (!res.ok) {
      addNotification(res.error || "Erreur de suppression du dossier", "error")
      return
    }
    setFolders(res.folders)
    const affected = notebooks.filter((n) => n.folder_id === folderId)
    const nextNotebooks = notebooks.map((n) => (
      n.folder_id === folderId ? { ...n, folder_id: parentId, updated_at: new Date().toISOString() } : n
    ))
    setNotebooks(nextNotebooks)
    affected.forEach((nb) => {
      const updated = nextNotebooks.find((n) => n.id === nb.id)
      if (updated && isLocalNotebookId(updated.id)) upsertLocalNotebook(updated)
    })
    if (userId) {
      try {
        await supabase.from("notebooks").update({ folder_id: null }).eq("folder_id", folderId)
      } catch {
        addNotification("Dossier supprimé localement — erreur sync carnets", "error")
      }
    }
    if (folderFilt === folderId) setFolderFilt("all")
    addNotification(res.warning ? `Dossier supprimé — ${res.warning}` : "Dossier supprimé", "success")
  }

  const createSubject = () => {
    if (!subjName.trim()) return
    setSubjects(p => [...p, {id:Date.now().toString(), l:subjName, c:subjColor, e:subjEmoji, custom:true}])
    setShowNewSubject(false); setSubjName(""); setSubjEmoji("⭐"); setSubjColor("#c8622a")
  }

  const usedSubjects = subjects.filter(s => notebooks.some(n => n.subject === s.id))
  const starredCount = notebooks.filter(n => n.starred).length
  const recentNotebooks = recentIds.map(id => notebooks.find(n => n.id === id)).filter(Boolean).slice(0, 4)

  const logout = async () => {
    await authSignOut()
    setUserId(null)
    setUserName("")
    setNotebooks([])
    setShowProfilePanel(false)
  }

  const avatarLetter = (collab.profile?.display_name || userName || "?").charAt(0).toUpperCase()
  const displayName = collab.profile?.display_name || userName
  const sharedCount = (collab.sharedFolders.owned?.length || 0) + (collab.sharedFolders.member?.length || 0)
  const openProfilePanel = () => {
    setShowProfilePanel(true)
    setShowNotifications(false)
  }

  return (
    <div className="forma-page-shell">

      {showTheme && <ThemePicker onClose={() => setShowTheme(false)}/>}

      {/* FOCUS PANEL */}
      {showFocus && <FocusPanel T={T} onClose={() => setShowFocus(false)} spotifyIframeRef={spotifyIframeRef}/>}

      {/* SPOTIFY WIDGET */}
      <SpotifyLibraryPanel
        T={T}
        open={showSpotify}
        onClose={() => setShowSpotify(false)}
        links={spotifyLinks}
        activeId={activeSpotifyId}
        onSelect={setActiveSpotifyLink}
        onAdd={(url, label) => addSpotifyLink(url, label)}
        onRemove={removeSpotifyLink}
        onNotify={addNotification}
        iframeRef={spotifyIframeRef}
      />

      {/* CALCULATOR PANEL */}
      {showCalc && isTablet && (
        <BottomSheet T={T} open onClose={() => setShowCalc(false)} title="🔢 Calculatrice">
          <CalculatorDrawer T={T} variant="embedded" open onClose={() => setShowCalc(false)} scale="1:50" {...calc} />
        </BottomSheet>
      )}
      {showCalc && !isTablet && (
        <CalculatorDrawer
          T={T}
          open={showCalc}
          onClose={() => setShowCalc(false)}
          stackOffset={0}
          scale="1:50"
          {...calc}
        />
      )}

      {/* CONVERTER PANEL */}
      {showConverter && isTablet && (
        <BottomSheet T={T} open onClose={() => setShowConverter(false)} title="📐 Convertisseur">
          <UnitConverter
            T={T}
            variant="embedded"
            value={convValue}
            setValue={setConvValue}
            category={convCategory}
            setCategory={setConvCategory}
            fromUnit={convFrom}
            setFromUnit={setConvFrom}
            toUnit={convTo}
            setToUnit={setConvTo}
          />
        </BottomSheet>
      )}
      {showConverter && !isTablet && (
        <UnitConverter
          T={T}
          variant="float"
          value={convValue}
          setValue={setConvValue}
          category={convCategory}
          setCategory={setConvCategory}
          fromUnit={convFrom}
          setFromUnit={setConvFrom}
          toUnit={convTo}
          setToUnit={setConvTo}
          onClose={() => setShowConverter(false)}
        />
      )}

      {showTranslate && isTablet && (
        <BottomSheet T={T} open onClose={() => setShowTranslate(false)} title="🌐 Traduction">
          <TranslationWidget
            T={T}
            variant="embedded"
            open
            onClose={() => setShowTranslate(false)}
            notebooks={notebooks}
            onOpenScan={() => { setShowTranslate(false); navigate("/translate") }}
          />
        </BottomSheet>
      )}
      {showTranslate && !isTablet && (
        <TranslationWidget
          T={T}
          open
          onClose={() => setShowTranslate(false)}
          notebooks={notebooks}
          onOpenScan={() => { setShowTranslate(false); navigate("/translate") }}
        />
      )}

      <ProfilePanel
        T={T}
        open={showProfilePanel}
        onClose={() => setShowProfilePanel(false)}
        displayName={displayName}
        email={collab.user?.email || userName}
        avatarUrl={collab.profile?.avatar_url}
        avatarLetter={avatarLetter}
        notebooks={notebooks}
        folders={folders}
        friends={collab.friends}
        sharedCount={sharedCount}
        unreadCount={collab.unreadCount}
        streak={activityStreak}
        isLoggedIn={!!userId}
        onLogout={logout}
      />

      {userId && (
        <NotificationPanel
          T={T}
          open={showNotifications}
          onClose={() => setShowNotifications(false)}
          notifications={collab.notifications}
          unreadCount={collab.unreadCount}
          onRefresh={collab.refresh}
        />
      )}

      {/* FLOATING BUTTONS — Spotify + Focus */}
      <div style={{position:"fixed",bottom:24,left:24,zIndex:180,display:"flex",gap:8}}>
        <button onClick={()=>setShowSpotify(v=>!v)} title="Bibliothèque Spotify"
          style={{width:44,height:44,borderRadius:"50%",background:showSpotify?"#1db954":T.surface,border:`1px solid ${showSpotify?"#1db954":T.border}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 3px 14px rgba(0,0,0,.15)",transition:"all .2s"}}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill={showSpotify?"#fff":"#1db954"}><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
        </button>
        <button onClick={()=>setShowFocus(v=>!v)} title="Mode Focus"
          style={{width:44,height:44,borderRadius:"50%",background:showFocus?T.accent:T.surface,border:`1px solid ${showFocus?T.accent:T.border}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 3px 14px rgba(0,0,0,.15)",transition:"all .2s",fontSize:18}}>
          ⚡
        </button>
      </div>

      {/* NEW NOTEBOOK */}
      {showNew && (
        <ModalOverlay onClose={() => setShowNew(false)} variant="sheet">
          <GlassPanel T={T} variant="modal" style={{ padding: 26, width: 520, maxWidth: "94vw", maxHeight: "88vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 19, color: T.ink }}>Nouveau carnet</div>
              <button onClick={() => setShowNew(false)} className="forma-btn-glass" style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, fontSize: 22, padding: "2px 6px" }}>×</button>
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
              className="forma-btn-glass"
              style={{ width: "100%", padding: 12, borderRadius: TOKENS.radius.md, background: newTitle.trim() ? `linear-gradient(135deg,${T.accent},${T.a2})` : T.border, border: "none", color: "#fff", fontWeight: 700, fontSize: 14, cursor: newTitle.trim() ? "pointer" : "not-allowed" }}>
              {saving ? "Création..." : "Créer le carnet →"}
            </button>
          </GlassPanel>
        </ModalOverlay>
      )}

      {/* NEW FOLDER */}
      {showNewFolder && (
        <ModalOverlay onClose={() => setShowNewFolder(false)} variant="sheet">
          <GlassPanel T={T} variant="modal" style={{ padding: 24, width: 380, maxWidth: "94vw" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 17, color: T.ink }}>📁 Nouveau dossier</div>
              <button onClick={() => setShowNewFolder(false)} className="forma-btn-glass" style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, fontSize: 20, padding: "2px 6px" }}>×</button>
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
                {FOLDER_EMOJIS.map(e => (
                  <button key={e} onClick={() => setFolderEmoji(e)}
                    style={{width:32,height:32,borderRadius:8,background:folderEmoji===e?`${T.accent}18`:T.bg,border:`1px solid ${folderEmoji===e?T.accent:T.border}`,cursor:"pointer",fontSize:16}}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div style={{marginBottom:18}}>
              <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:5}}>COULEUR</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                {COLOR_LIST.slice(0, 16).map(c => (
                  <button key={c} type="button" onClick={() => setFolderColor(c)}
                    style={{width:26,height:26,borderRadius:"50%",background:c,border:`2px solid ${folderColor===c?T.ink:"transparent"}`,cursor:"pointer"}}/>
                ))}
              </div>
            </div>
            <button onClick={createFolder} disabled={!folderName.trim()}
              className="forma-btn-glass"
              style={{ width: "100%", padding: 12, borderRadius: TOKENS.radius.md, background: folderName.trim() ? T.accent : T.border, border: "none", color: "#fff", fontWeight: 700, fontSize: 14, cursor: folderName.trim() ? "pointer" : "not-allowed" }}>
              Créer le dossier →
            </button>
          </GlassPanel>
        </ModalOverlay>
      )}

      {/* EDIT FOLDER */}
      {showEditFolder && (
        <ModalOverlay onClose={() => setShowEditFolder(false)} variant="sheet">
          <GlassPanel T={T} variant="modal" style={{ padding: 24, width: 380, maxWidth: "94vw" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 17, color: T.ink }}>✏ Modifier le dossier</div>
              <button onClick={() => setShowEditFolder(false)} className="forma-btn-glass" style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, fontSize: 20, padding: "2px 6px" }}>×</button>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:5}}>NOM</div>
              <input value={editFolderName} onChange={e => setEditFolderName(e.target.value)} placeholder="Nom du dossier" autoFocus
                onKeyDown={e => e.key === "Enter" && saveEditFolder()}
                style={{width:"100%",padding:"10px 12px",borderRadius:10,border:`1px solid ${T.border}`,fontSize:14,outline:"none",color:T.ink,background:T.bg,boxSizing:"border-box"}}/>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:5}}>EMOJI</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                {FOLDER_EMOJIS.map(e => (
                  <button key={e} type="button" onClick={() => setEditFolderEmoji(e)}
                    style={{width:32,height:32,borderRadius:8,background:editFolderEmoji===e?`${T.accent}18`:T.bg,border:`1px solid ${editFolderEmoji===e?T.accent:T.border}`,cursor:"pointer",fontSize:16}}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div style={{marginBottom:18}}>
              <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:5}}>COULEUR</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                {COLOR_LIST.slice(0, 16).map(c => (
                  <button key={c} type="button" onClick={() => setEditFolderColor(c)}
                    style={{width:26,height:26,borderRadius:"50%",background:c,border:`2px solid ${editFolderColor===c?T.ink:"transparent"}`,cursor:"pointer"}}/>
                ))}
              </div>
            </div>
            <button onClick={saveEditFolder} disabled={!editFolderName.trim()}
              className="forma-btn-glass"
              style={{ width: "100%", padding: 12, borderRadius: TOKENS.radius.md, background: editFolderName.trim() ? T.accent : T.border, border: "none", color: "#fff", fontWeight: 700, fontSize: 14, cursor: editFolderName.trim() ? "pointer" : "not-allowed" }}>
              Enregistrer
            </button>
          </GlassPanel>
        </ModalOverlay>
      )}

      {/* NEW SUBJECT */}
      {showNewSubject && (
        <ModalOverlay onClose={() => setShowNewSubject(false)} variant="sheet">
          <GlassPanel T={T} variant="modal" style={{ padding: 24, width: 400, maxWidth: "94vw", maxHeight: "88vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 17, color: T.ink }}>✏ Nouvelle matière</div>
              <button onClick={() => setShowNewSubject(false)} className="forma-btn-glass" style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, fontSize: 20, padding: "2px 6px" }}>×</button>
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
              className="forma-btn-glass"
              style={{ width: "100%", padding: 12, borderRadius: TOKENS.radius.md, background: subjName.trim() ? subjColor : T.border, border: "none", color: "#fff", fontWeight: 700, fontSize: 14, cursor: subjName.trim() ? "pointer" : "not-allowed" }}>
              Créer la matière →
            </button>
          </GlassPanel>
        </ModalOverlay>
      )}

      {/* ASSIGN FOLDER */}
      {showFolderAssign && (
        <ModalOverlay onClose={() => setShowFolderAssign(null)} variant="sheet">
          <GlassPanel T={T} variant="modal" style={{ padding: 22, width: 340, maxWidth: "94vw" }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, color: T.ink, marginBottom: 16 }}>
              📁 {Array.isArray(showFolderAssign) ? `Déplacer ${showFolderAssign.length} carnets` : "Assigner à un dossier"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <GlassButton T={T} size="md" onClick={() => Array.isArray(showFolderAssign) ? assignFolderBatch(showFolderAssign, null) : assignFolder(showFolderAssign, null)} style={{ width: "100%", textAlign: "left", justifyContent: "flex-start" }}>
                ❌ Aucun dossier
              </GlassButton>
              {folders.map(f => (
                <GlassButton key={f.id} T={T} size="md" onClick={() => Array.isArray(showFolderAssign) ? assignFolderBatch(showFolderAssign, f.id) : assignFolder(showFolderAssign, f.id)} style={{ width: "100%", textAlign: "left", justifyContent: "flex-start", display: "flex", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{f.e}</span>{f.n}
                </GlassButton>
              ))}
            </div>
            <GlassButton T={T} size="md" onClick={() => setShowFolderAssign(null)} style={{ width: "100%", marginTop: 14 }}>Annuler</GlassButton>
          </GlassPanel>
        </ModalOverlay>
      )}

      {selectionMode && selectedIds.size > 0 && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9500,
          padding: "12px 16px", paddingBottom: "max(12px, env(safe-area-inset-bottom))",
          background: T.surface, borderTop: `1px solid ${T.border}`,
          display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
          boxShadow: "0 -8px 32px rgba(0,0,0,.12)",
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.ink, flex: 1, minWidth: 100 }}>{selectedIds.size} sélectionné{selectedIds.size > 1 ? "s" : ""}</span>
          <button onClick={() => setShowFolderAssign([...selectedIds])} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.ink, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>📁 Déplacer</button>
          <button onClick={deleteSelected} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #e9456044", background: "#e9456012", color: "#e94560", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>🗑 Supprimer</button>
          <button onClick={clearSelection} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 12, cursor: "pointer" }}>Annuler</button>
        </div>
      )}

      {ctxMenu && (
        <IOSContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          items={ctxMenu.items}
          onClose={() => setCtxMenu(null)}
        />
      )}

      <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: COLORS.bg, color: COLORS.text }}>
        {/* Sidebar */}
        <aside style={{
          width: 260,
          flexShrink: 0,
          background: COLORS.sidebar,
          display: 'flex',
          flexDirection: 'column',
          borderRight: `1px solid ${COLORS.separator}`,
        }}>
          <div style={{ height: 60, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10 }}>
            {T.img && (
              <img src={T.img} alt={BRAND.ecosystemName} style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover' }} />
            )}
            <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.text }}>{BRAND.ecosystemName}</div>
          </div>
          <div style={{ height: 1, background: COLORS.separator, margin: '0 12px' }} />
          <nav style={{ padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {SIDEBAR_NAV.map((item) => (
              <SidebarNavItem
                key={item.id}
                item={item}
                active={
                  (item.id === 'documents' && sidebarSection === 'documents' && activeTab === 'notebooks')
                  || (item.id === 'favorites' && activeTab === 'favorites')
                }
                onClick={() => handleSidebarNav(item.id)}
              />
            ))}
          </nav>
          <div style={{ flex: 1 }} />
          <div
            role="button"
            tabIndex={0}
            onClick={openProfilePanel}
            onKeyDown={(e) => e.key === 'Enter' && openProfilePanel()}
            style={{
              height: 60,
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              borderTop: `1px solid ${COLORS.separator}`,
              cursor: 'pointer',
            }}
          >
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: collab.profile?.avatar_url ? `url(${collab.profile.avatar_url}) center/cover` : COLORS.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 700,
              color: '#fff',
              flexShrink: 0,
            }}>
              {!collab.profile?.avatar_url && avatarLetter}
            </div>
            <div style={{ fontSize: 14, color: COLORS.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {collab.user?.email || userName || 'Invité'}
            </div>
          </div>
        </aside>

        {/* Main column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Header 64px */}
          <header style={{
            height: 64,
            flexShrink: 0,
            background: COLORS.header,
            borderBottom: `1px solid ${COLORS.separator}`,
            display: 'flex',
            alignItems: 'center',
            padding: '0 20px',
            gap: 12,
          }}>
            {currentFolder && activeTab === 'notebooks' && (
              <button
                type="button"
                onClick={() => setFolderFilt(currentFolder.parentId || 'all')}
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: COLORS.accent, fontSize: 15, cursor: 'pointer', padding: 0 }}
              >
                <ChevronLeft size={18} />
                {folders.find((f) => f.id === currentFolder.parentId)?.n || 'Documents'}
              </button>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 600, color: COLORS.text, lineHeight: 1.2 }}>{sectionTitle}</div>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                title="Recherche"
                onClick={() => window.dispatchEvent(new CustomEvent('forma:open-search'))}
                style={{ width: 40, height: 40, borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.accent }}
              >
                <Search size={24} />
              </button>
              <button
                type="button"
                title={libraryView === 'list' ? 'Vue grille' : 'Vue liste'}
                onClick={() => setLibraryView(libraryView === 'list' ? 'grid' : 'list')}
                style={{ width: 40, height: 40, borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.accent }}
              >
                {libraryView === 'list' ? <Grid3X3 size={24} /> : <List size={24} />}
              </button>
              <button
                type="button"
                onClick={() => setShowNew(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 10,
                  border: 'none',
                  background: COLORS.accent,
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Plus size={16} />
                Nouveau
              </button>
            </div>
          </header>

          {/* Scrollable content */}
          <main style={{ flex: 1, overflowY: 'auto', padding: 20, background: COLORS.bg }}>
            {!userId && !loading && notebooks.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
                <FolderOpen size={64} color={COLORS.cardBorder} strokeWidth={1.5} />
                <div style={{ fontSize: 17, color: COLORS.textSecondary, marginTop: 20 }}>Aucun document</div>
                <div style={{ fontSize: 14, color: COLORS.textMuted, marginTop: 8 }}>Appuyez sur + Nouveau pour commencer</div>
                <button
                  type="button"
                  onClick={() => navigate('/auth')}
                  style={{ marginTop: 24, padding: '10px 20px', borderRadius: 10, background: COLORS.accent, border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  Se connecter
                </button>
              </div>
            ) : (
              <>
                {!userId && (
                  <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 10, background: `${COLORS.accent}18`, border: `1px solid ${COLORS.accent}44`, fontSize: 12, color: COLORS.text }}>
                    Mode local — tes carnets restent sur cet appareil.{' '}
                    <button type="button" onClick={() => navigate('/auth')} style={{ background: 'none', border: 'none', color: COLORS.accent, fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                      Se connecter
                    </button>{' '}
                    pour la synchro cloud.
                  </div>
                )}

                {(activeTab === 'notebooks' || activeTab === 'favorites') && (
                  <div style={{ opacity: gridVisible ? 1 : 0, transition: 'opacity 200ms ease' }}>
                    {loading ? (
                      <div style={{ textAlign: 'center', padding: '80px 0', color: COLORS.textSecondary }}>Chargement…</div>
                    ) : visibleFolders.length === 0 && sortedFiltered.length === 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', textAlign: 'center' }}>
                        <FolderOpen size={64} color={COLORS.cardBorder} strokeWidth={1.5} />
                        <div style={{ fontSize: 17, color: COLORS.textSecondary, marginTop: 20 }}>Aucun document</div>
                        <div style={{ fontSize: 14, color: COLORS.textMuted, marginTop: 8 }}>Appuyez sur + Nouveau pour commencer</div>
                      </div>
                    ) : (
                      <>
                        {visibleFolders.length > 0 && (
                          <div style={{ marginBottom: 24 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12 }}>
                              Dossiers
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 20 }}>
                              {visibleFolders.map((folder) => (
                                <GoodNotesFolderCard
                                  key={folder.id}
                                  folder={folder}
                                  onOpen={() => setFolderFilt(folder.id)}
                                  onContextMenu={(e) => openContextMenu(e, {
                                    type: 'folder',
                                    item: folder,
                                    items: [
                                      { label: 'Ouvrir', action: () => setFolderFilt(folder.id) },
                                      { label: 'Modifier', action: () => openEditFolder(folder) },
                                      { label: 'Supprimer', destructive: true, action: () => removeFolder(folder.id) },
                                    ],
                                  })}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {sortedFiltered.length > 0 && (
                          <div>
                            {visibleFolders.length > 0 && (
                              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12 }}>
                                Documents
                              </div>
                            )}
                            {libraryView === 'list' ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {sortedFiltered.map((nb) => renderNotebook(nb, 'list'))}
                              </div>
                            ) : (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 20 }}>
                                {sortedFiltered.map((nb) => renderNotebook(nb, 'grid'))}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Legacy tabs — logique conservée, masquée sauf navigation interne */}
                {activeTab === 'folders' && (
                  <FormaFolderExplorer
                    T={T}
                    folders={folders}
                    setFolders={setFolders}
                    notebooks={notebooks}
                    setNotebooks={setNotebooks}
                    subjects={subjects}
                    userId={userId}
                    foldersCloudOk={foldersCloudOk}
                    syncingFolders={syncingFolders}
                    onSyncFolders={syncFolders}
                    onCreateFolder={(parentId) => { setNewFolderParentId(parentId || null); setShowNewFolder(true) }}
                    onEditFolder={openEditFolder}
                    onAssignNotebooks={assignFolderBatch}
                    onOpenNotebook={(nb) => { setActiveNotebook(nb); navigate(`/editor/${nb.id}`) }}
                    renderNotebook={renderNotebook}
                    addNotification={addNotification}
                    showHeader={false}
                  />
                )}
                {activeTab === 'subjects' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <div style={{ fontWeight: 700, fontSize: 17, color: COLORS.text }}>Matières ({subjects.length})</div>
                      <button type="button" onClick={() => setShowNewSubject(true)} style={{ padding: '7px 14px', borderRadius: 8, background: COLORS.accent, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ Nouvelle matière</button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
                      {subjects.map((s) => (
                        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 22, background: `${s.c}22`, border: `1px solid ${s.c}44` }}>
                          <span style={{ fontSize: 18 }}>{s.e}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: s.c }}>{s.l}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {activeTab === 'dashboard' && (
                  <div style={{ color: COLORS.textSecondary, fontSize: 14 }}>
                    Tableau de bord — utilise les filtres internes ou rouvrez via les raccourcis existants.
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
