import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  BookOpen, Star, Search, FolderOpen, LayoutDashboard, Calculator, Ruler,
  Languages, Sparkles, Palette, Gamepad2, Pencil, Image, Table2, FileText,
  CalendarDays, Paperclip, MessageCircle, Presentation, Library, MessagesSquare,
  Globe2, Handshake, Share2,
} from 'lucide-react'
import { BRAND, MODULES } from '@/config/branding'
import { useTheme } from '@/hooks/useAppearance'
import { useAuth } from '@/hooks/useAuth'
import { useCollaboration } from '@/hooks/useCollaboration'
import {
  FormaShellContext,
  getFormaShellColors,
  LIBRARY_SIDEBAR,
  MODULE_LINKS,
  useFormaShellColors,
} from '@/lib/formaShell'

const SIDEBAR_ICONS = {
  BookOpen,
  Star,
  FolderOpen,
  LayoutDashboard,
  Pencil,
  Image,
  Ruler,
  Table2,
  FileText,
  CalendarDays,
  Paperclip,
  MessageCircle,
  Presentation,
  Library,
  Sparkles,
  MessagesSquare,
  Globe2,
  Gamepad2,
  Handshake,
  Share2,
  User,
}

function SidebarSectionLabel({ children }) {
  const C = useFormaShellColors()
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color: C.textSecondary,
      letterSpacing: 0.5, textTransform: 'uppercase', padding: '8px 16px 4px',
    }}>
      {children}
    </div>
  )
}

function SidebarSectionToggle({ children, open, onClick }) {
  const C = useFormaShellColors()
  return (
    <button type="button" onClick={onClick} style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px 4px', color: C.textSecondary, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'left' }}>
      <span style={{ width: 12, color: C.accent }}>{open ? '▾' : '▸'}</span>
      <span>{children}</span>
    </button>
  )
}

function SidebarNavItem({ label, Icon, emoji, active, onClick }) {
  const C = useFormaShellColors()
  const [hover, setHover] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', padding: '8px 12px', borderRadius: 10,
        border: 'none', cursor: 'pointer', textAlign: 'left',
        fontSize: 14, fontWeight: active ? 600 : 500,
        background: active ? C.sidebarActive : (hover ? C.sidebarActive : 'transparent'),
        color: active ? C.accent : C.inactive,
        transition: 'background 120ms ease',
      }}
    >
      {Icon && <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />}
      {emoji && !Icon && <span style={{ fontSize: 16, width: 18, textAlign: 'center' }}>{emoji}</span>}
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
    </button>
  )
}

/** Layout shell Forma — sidebar + header + contenu (modules intégrés). */
export default function FormaAppShell({
  title,
  subtitle,
  headerExtra,
  children,
  libraryTab,
  onLibraryTab,
  badgeCount,
  toolStates,
  onOpenTheme,
  onOpenProfile,
  showSidebar = true,
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const { T } = useTheme()
  const { user } = useAuth()
  const collab = useCollaboration()
  const C = useMemo(() => getFormaShellColors(T), [T])
  const [sectionsOpen, setSectionsOpen] = useState({ library: true, modules: true, tools: false, account: false })

  const isHome = location.pathname === '/'
  const avatarLetter = (collab.user?.email || user?.email || 'F')[0]?.toUpperCase() || 'F'
  const userLabel = collab.user?.email || user?.email || 'Invité'

  const goLibraryTab = (tab) => {
    if (isHome && onLibraryTab) onLibraryTab(tab)
    else navigate('/', { state: { libraryTab: tab } })
  }

  const openTheme = () => {
    if (onOpenTheme) onOpenTheme()
    else navigate('/', { state: { openTheme: true } })
  }

  const openProfile = () => {
    if (onOpenProfile) onOpenProfile()
    else navigate('/account')
  }

  const routeActive = (route) => {
    if (!route) return false
    return location.pathname === route || location.pathname.startsWith(`${route}/`)
  }
  const toggleSection = (id) => setSectionsOpen((s) => ({ ...s, [id]: !s[id] }))

  return (
    <FormaShellContext.Provider value={C}>
      <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: C.bg, color: C.text }}>
        {showSidebar && (
          <aside style={{
            width: 260, flexShrink: 0, background: C.sidebar,
            display: 'flex', flexDirection: 'column',
            borderRight: `1px solid ${C.separator}`,
          }}>
            <div style={{ height: 60, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10 }}>
              <button
                type="button"
                onClick={() => navigate('/')}
                title="Accueil Forma"
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
              >
                {T.img && (
                  <img src={T.img} alt={BRAND.appName} style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} />
                )}
                <div style={{ fontSize: 18, fontWeight: 700, color: C.text, lineHeight: 1.1 }}>{BRAND.appName}</div>
              </button>
              {badgeCount > 0 && (
                <span style={{
                  marginLeft: 'auto', padding: '2px 8px', borderRadius: 12,
                  background: `${C.accent}22`, color: C.accent, fontSize: 11, fontWeight: 700,
                }}>
                  {badgeCount}
                </span>
              )}
            </div>
            <div style={{ height: 1, background: C.separator, margin: '0 12px' }} />
            <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 10px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <SidebarSectionToggle open={sectionsOpen.library} onClick={() => toggleSection('library')}>Bibliothèque</SidebarSectionToggle>
              {sectionsOpen.library && LIBRARY_SIDEBAR.map((item) => {
                const Icon = SIDEBAR_ICONS[item.icon]
                return (
                  <SidebarNavItem
                    key={item.id}
                    label={item.label}
                    Icon={Icon}
                    active={isHome && libraryTab === item.tab}
                    onClick={() => goLibraryTab(item.tab)}
                  />
                )
              })}
              <SidebarSectionToggle open={sectionsOpen.modules} onClick={() => toggleSection('modules')}>Modules Forma</SidebarSectionToggle>
              {sectionsOpen.modules && MODULE_LINKS.map((m) => (
                <SidebarNavItem
                  key={m.route}
                  label={m.label}
                  Icon={SIDEBAR_ICONS[m.icon]}
                  active={routeActive(m.route)}
                  onClick={() => navigate(m.route)}
                />
              ))}
              <SidebarSectionToggle open={sectionsOpen.tools} onClick={() => toggleSection('tools')}>Outils</SidebarSectionToggle>
              {sectionsOpen.tools && <>
              <SidebarNavItem
                label="Calculatrice"
                Icon={Calculator}
                active={!!toolStates?.calc?.active}
                onClick={toolStates?.calc?.toggle || (() => navigate('/', { state: { tool: 'calc' } }))}
              />
              <SidebarNavItem
                label="Convertisseur"
                Icon={Ruler}
                active={!!toolStates?.converter?.active}
                onClick={toolStates?.converter?.toggle || (() => navigate('/', { state: { tool: 'converter' } }))}
              />
              <SidebarNavItem
                label="Traduction"
                Icon={Languages}
                active={!!toolStates?.translate?.active}
                onClick={toolStates?.translate?.toggle || (() => navigate('/translate'))}
              />
              <SidebarNavItem
                label="Recherche globale"
                Icon={Search}
                active={false}
                onClick={() => window.dispatchEvent(new CustomEvent('forma:open-search'))}
              />
              <SidebarNavItem
                label={MODULES.formaAI.name}
                Icon={Sparkles}
                active={routeActive(MODULES.formaAI.route)}
                onClick={() => navigate(MODULES.formaAI.route)}
              />
              <SidebarNavItem
                label={MODULES.fTheme.name}
                Icon={Palette}
                active={false}
                onClick={openTheme}
              />
              <SidebarNavItem
                label={MODULES.fPause.name}
                Icon={Gamepad2}
                active={routeActive(MODULES.fPause.route)}
                onClick={() => navigate(MODULES.fPause.route)}
              />
              </>}
            </nav>
            <div
              role="button"
              tabIndex={0}
              onClick={openProfile}
              onKeyDown={(e) => e.key === 'Enter' && openProfile()}
              style={{
                height: 60, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 12,
                borderTop: `1px solid ${C.separator}`, cursor: 'pointer',
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: collab.profile?.avatar_url ? `url(${collab.profile.avatar_url}) center/cover` : C.accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: '#fff',
              }}>
                {!collab.profile?.avatar_url && avatarLetter}
              </div>
              <div style={{ fontSize: 14, color: C.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userLabel}
              </div>
            </div>
          </aside>
        )}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {(title || headerExtra) && (
            <header style={{
              height: 52, flexShrink: 0, background: C.header,
              borderBottom: `1px solid ${C.separator}`,
              display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12,
            }}>
              <div style={{ minWidth: 0, flex: headerExtra ? '0 1 auto' : 1 }}>
                {title && (
                  <div style={{ fontSize: 17, fontWeight: 600, color: C.text, lineHeight: 1.2 }}>{title}</div>
                )}
                {subtitle && (
                  <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>{subtitle}</div>
                )}
              </div>
              {headerExtra && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', minWidth: 0 }}>
                  {headerExtra}
                </div>
              )}
            </header>
          )}
          <main style={{ flex: 1, overflow: 'auto', minHeight: 0, background: C.contentBg || C.bg }}>
            {children}
          </main>
        </div>
      </div>
    </FormaShellContext.Provider>
  )
}
