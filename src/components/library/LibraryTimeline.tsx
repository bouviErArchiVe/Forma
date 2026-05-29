import type { NotebookMonthGroup } from '../../lib/library-views'
import type { Subject } from '../../lib/subjects'
import { findSubject } from '../../lib/subjects'
import { DocumentCard } from './DocumentCard'
import type { Notebook } from '../../types'

interface LibraryTimelineProps {
  groups: NotebookMonthGroup[]
  subjects: Subject[]
  viewMode: 'grid' | 'list'
  pageCounts: Record<string, number>
  thumbs: Record<string, string>
  selectionMode: boolean
  selectedIds: Set<string>
  pinnedIds: Set<string>
  onOpen: (id: string) => void
  onToggleSelect: (id: string) => void
  onRename: (id: string, name: string) => void
  onCoverColor: (id: string, color: string) => void
  onContextMenu: (e: React.MouseEvent, nb: Notebook) => void
}

export function LibraryTimeline({
  groups,
  subjects,
  viewMode,
  pageCounts,
  thumbs,
  selectionMode,
  selectedIds,
  pinnedIds,
  onOpen,
  onToggleSelect,
  onRename,
  onCoverColor,
  onContextMenu,
}: LibraryTimelineProps) {
  if (groups.length === 0) {
    return (
      <div className="text-center py-12 text-forma-muted">
        <p>Aucun document à afficher</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.key}>
          <h3 className="text-sm font-semibold text-forma-muted capitalize mb-3 sticky top-24 z-[1] py-1 forma-glass-header rounded-lg px-2">
            {group.label}
          </h3>
          <div
            className={
              viewMode === 'list'
                ? 'space-y-2'
                : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'
            }
          >
            {group.items.map((nb) => {
              const subject = findSubject(subjects, nb.subjectId)
              return (
                <div
                  key={nb.id}
                  className="relative group"
                  onContextMenu={(e) => onContextMenu(e, nb)}
                >
                  {subject && (
                    <span
                      className="absolute top-1 left-1 z-10 text-xs px-1.5 py-0.5 rounded-md bg-black/40 text-white"
                      title={subject.label}
                    >
                      {subject.emoji}
                    </span>
                  )}
                  <DocumentCard
                    notebook={nb}
                    viewMode={viewMode === 'list' ? 'list' : 'grid'}
                    selected={selectedIds.has(nb.id)}
                    selectionMode={selectionMode}
                    pageCount={pageCounts[nb.id]}
                    thumbUrl={thumbs[nb.id]}
                    locked={pinnedIds.has(nb.id)}
                    subjectLabel={subject?.label}
                    onClick={() => onOpen(nb.id)}
                    onToggleSelect={() => onToggleSelect(nb.id)}
                    onRename={(name) => onRename(nb.id, name)}
                    onCoverColor={(color) => onCoverColor(nb.id, color)}
                  />
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
