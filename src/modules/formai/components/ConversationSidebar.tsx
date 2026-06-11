/**
 * ConversationSidebar — barre latérale des conversations FormAI.
 *
 * Recherche (titre + contenu), filtres Actives / Favoris / Archives,
 * nouvelle conversation, et actions par conversation : favori, renommer,
 * archiver/restaurer, supprimer.
 */
import { useState } from 'react'
import { Icon } from '../../../components/ui/Icon'
import { confirm } from '../../../stores/confirmStore'
import type { AIConversation } from '../../../services/ai/types'

export type SidebarFilter = 'active' | 'favorites' | 'archived'

function formatDate(ts: number): string {
  const d = new Date(ts)
  const today = new Date()
  const sameDay = d.toDateString() === today.toDateString()
  return sameDay
    ? d.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('fr-CA', { day: '2-digit', month: '2-digit' })
}

export function ConversationSidebar({
  conversations,
  activeId,
  filter,
  query,
  onFilterChange,
  onQueryChange,
  onSelect,
  onNew,
  onToggleFavorite,
  onRename,
  onArchive,
  onUnarchive,
  onDelete,
}: {
  conversations: AIConversation[]
  activeId: string | null
  filter: SidebarFilter
  query: string
  onFilterChange: (f: SidebarFilter) => void
  onQueryChange: (q: string) => void
  onSelect: (id: string) => void
  onNew: () => void
  onToggleFavorite: (id: string) => void
  onRename: (id: string, title: string) => void
  onArchive: (id: string) => void
  onUnarchive: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const startRename = (c: AIConversation) => {
    setRenamingId(c.id)
    setRenameValue(c.title)
  }
  const commitRename = () => {
    if (renamingId && renameValue.trim() !== '') onRename(renamingId, renameValue.trim())
    setRenamingId(null)
  }

  const FILTERS: { id: SidebarFilter; label: string }[] = [
    { id: 'active', label: 'Actives' },
    { id: 'favorites', label: 'Favoris' },
    { id: 'archived', label: 'Archives' },
  ]

  return (
    <aside className="w-64 shrink-0 border-r border-forma-border bg-forma-surface flex flex-col min-h-0">
      {/* Nouvelle conversation */}
      <div className="p-2 shrink-0">
        <button
          type="button"
          onClick={onNew}
          className="w-full py-1.5 bg-forma-accent hover:bg-forma-accent-hover text-white rounded-lg text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors"
        >
          <Icon name="plus" className="w-3.5 h-3.5" />
          Nouvelle conversation
        </button>
      </div>

      {/* Recherche */}
      <div className="px-2 pb-2 shrink-0">
        <div className="relative">
          <Icon name="search" className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-forma-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Rechercher…"
            className="w-full text-xs border border-forma-border rounded-lg pl-7 pr-2 py-1.5 bg-forma-bg focus:outline-none focus:border-forma-accent"
          />
        </div>
      </div>

      {/* Filtres */}
      <div className="px-2 pb-2 flex gap-1 shrink-0">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => onFilterChange(f.id)}
            className={`flex-1 text-[11px] px-1.5 py-1 rounded-lg border transition-colors ${
              filter === f.id
                ? 'border-forma-accent text-forma-accent bg-forma-accent/5'
                : 'border-forma-border text-forma-muted hover:border-forma-accent/50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-y-auto min-h-0 px-2 pb-2 space-y-0.5">
        {conversations.length === 0 && (
          <p className="text-[11px] text-forma-muted text-center py-6">
            {query !== ''
              ? 'Aucune conversation trouvée'
              : filter === 'archived'
                ? 'Aucune conversation archivée'
                : filter === 'favorites'
                  ? 'Aucun favori'
                  : 'Aucune conversation'}
          </p>
        )}
        {conversations.map((c) => {
          const isActive = c.id === activeId
          const msgCount = c.messages.length
          return (
            <div
              key={c.id}
              className={`group rounded-lg border px-2 py-1.5 cursor-pointer transition-colors ${
                isActive
                  ? 'border-forma-accent/60 bg-forma-accent/5'
                  : 'border-transparent hover:border-forma-border hover:bg-forma-bg'
              }`}
              onClick={() => onSelect(c.id)}
            >
              {renamingId === c.id ? (
                <input
                  type="text"
                  value={renameValue}
                  autoFocus
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename()
                    if (e.key === 'Escape') setRenamingId(null)
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full text-xs border border-forma-accent rounded px-1 py-0.5 bg-forma-bg focus:outline-none"
                />
              ) : (
                <div className="flex items-start gap-1">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-forma-text truncate font-medium">
                      {c.favorite && <span className="text-amber-400 mr-0.5">★</span>}
                      {c.title}
                    </p>
                    <p className="text-[10px] text-forma-muted">
                      {msgCount} msg · {formatDate(c.updatedAt)}
                    </p>
                  </div>
                  <div
                    className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      title={c.favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                      onClick={() => onToggleFavorite(c.id)}
                      className="p-0.5 text-forma-muted hover:text-amber-400"
                    >
                      <Icon name={c.favorite ? 'star' : 'star-outline'} className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      title="Renommer"
                      onClick={() => startRename(c)}
                      className="p-0.5 text-forma-muted hover:text-forma-accent"
                    >
                      <Icon name="edit" className="w-3 h-3" />
                    </button>
                    {c.archived ? (
                      <button
                        type="button"
                        title="Restaurer"
                        onClick={() => onUnarchive(c.id)}
                        className="p-0.5 text-forma-muted hover:text-forma-accent"
                      >
                        <Icon name="undo" className="w-3 h-3" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        title="Archiver"
                        onClick={() => onArchive(c.id)}
                        className="p-0.5 text-forma-muted hover:text-forma-accent"
                      >
                        <Icon name="folder" className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      title="Supprimer"
                      onClick={async () => {
                        const ok = await confirm('Supprimer définitivement cette conversation ?', {
                          confirmLabel: 'Supprimer',
                          danger: true,
                        })
                        if (ok) onDelete(c.id)
                      }}
                      className="p-0.5 text-forma-muted hover:text-red-500"
                    >
                      <Icon name="trash" className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </aside>
  )
}
