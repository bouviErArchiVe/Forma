import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { BrandLogo } from '../BrandLogo'
import { GlassButton } from '../ui/GlassButton'

export type LibrarySidebarTab =
  | 'all'
  | 'favorites'
  | 'recent'
  | 'dashboard'
  | 'subjects'

interface LibraryShellProps {
  activeTab: LibrarySidebarTab
  onTabChange: (tab: LibrarySidebarTab) => void
  children: ReactNode
}

const NAV_ITEMS: { id: LibrarySidebarTab; label: string; emoji: string }[] = [
  { id: 'all', label: 'Carnets', emoji: '📓' },
  { id: 'dashboard', label: 'Tableau', emoji: '📊' },
  { id: 'subjects', label: 'Matières', emoji: '📚' },
  { id: 'favorites', label: 'Favoris', emoji: '★' },
  { id: 'recent', label: 'Récents', emoji: '🕐' },
]

const LINK_ITEMS = [
  { label: 'Moodboard', path: '/moodboard', emoji: '🖼' },
  { label: 'Formules', path: '/formulas', emoji: '📐' },
  { label: 'Modèles', path: '/templates', emoji: '📋' },
  { label: 'Paramètres', path: '/settings', emoji: '⚙️' },
  { label: 'Corbeille', path: '/trash', emoji: '🗑️' },
]

export function LibraryShell({ activeTab, onTabChange, children }: LibraryShellProps) {
  const navigate = useNavigate()

  return (
    <div className="min-h-full flex flex-col lg:flex-row">
      <aside className="forma-glass-panel lg:w-56 shrink-0 border-b lg:border-b-0 lg:border-r border-forma-border/60 p-3 lg:p-4 lg:min-h-[calc(100vh-0px)]">
        <div className="mb-4 px-1">
          <BrandLogo size="sm" subtitle="" />
          <p className="text-[11px] text-forma-muted mt-1 hidden lg:block">Bibliothèque</p>
        </div>

        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm whitespace-nowrap transition-all ${
                activeTab === item.id
                  ? 'bg-forma-accent/15 text-forma-accent ring-1 ring-forma-accent/25 font-medium'
                  : 'text-forma-muted hover:bg-white/40 dark:hover:bg-white/5 hover:text-forma-text'
              }`}
            >
              <span className="text-base leading-none">{item.emoji}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="hidden lg:block my-4 h-px bg-forma-border/50" />

        <div className="hidden lg:flex flex-col gap-1">
          {LINK_ITEMS.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-forma-muted hover:text-forma-text hover:bg-white/40 dark:hover:bg-white/5 transition-all text-left"
            >
              <span>{item.emoji}</span>
              {item.label}
            </button>
          ))}
        </div>

        <div className="hidden lg:block mt-auto pt-6 px-1">
          <GlassButton
            accent
            size="sm"
            className="w-full"
            onClick={() => navigate('/settings')}
            title="Changer le thème visuel"
          >
            🎨 Thème
          </GlassButton>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">{children}</div>
    </div>
  )
}
