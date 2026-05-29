import { GlassPanel } from '../ui/GlassPanel'
import type { LibraryDashboardStats } from '../../lib/library-views'
import { formatRelativeTime } from '../../lib/format-relative'
import type { Notebook } from '../../types'

interface LibraryDashboardProps {
  stats: LibraryDashboardStats
  onOpenNotebook: (id: string) => void
}

function StatTile({ emoji, value, label }: { emoji: string; value: number; label: string }) {
  return (
    <GlassPanel variant="surface" className="p-4 text-center">
      <div className="text-2xl mb-1">{emoji}</div>
      <div className="text-2xl font-bold text-forma-text">{value}</div>
      <div className="text-xs text-forma-muted mt-0.5">{label}</div>
    </GlassPanel>
  )
}

function ActivityRow({
  nb,
  subjectEmoji,
  onOpen,
}: {
  nb: Notebook
  subjectEmoji?: string
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/30 dark:hover:bg-white/5 text-left"
    >
      <div
        className="w-8 h-10 rounded shrink-0"
        style={{ backgroundColor: nb.coverColor }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {subjectEmoji && <span className="mr-1">{subjectEmoji}</span>}
          {nb.name}
        </p>
        <p className="text-xs text-forma-muted">{formatRelativeTime(nb.updatedAt)}</p>
      </div>
    </button>
  )
}

export function LibraryDashboard({ stats, onOpenNotebook }: LibraryDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatTile emoji="📓" value={stats.totalNotebooks} label="Carnets" />
        <StatTile emoji="★" value={stats.favorites} label="Favoris" />
        <StatTile emoji="📄" value={stats.pdfs} label="PDF" />
        <StatTile emoji="🖊" value={stats.whiteboards} label="Whiteboards" />
        <StatTile emoji="🕐" value={stats.recentCount} label="Récents" />
        <StatTile emoji="📚" value={stats.bySubject.length} label="Matières actives" />
      </div>

      {stats.bySubject.length > 0 && (
        <section>
          <h3 className="text-sm font-medium text-forma-muted mb-3">Par matière</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {stats.bySubject.map(({ subject, count }) => (
              <GlassPanel key={subject.id} variant="surface" className="p-3 flex items-center gap-3">
                <span
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
                  style={{ backgroundColor: `${subject.color}22` }}
                >
                  {subject.emoji}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{subject.label}</p>
                  <p className="text-xs text-forma-muted">{count} carnet{count !== 1 ? 's' : ''}</p>
                </div>
                <div
                  className="h-1.5 w-16 rounded-full overflow-hidden bg-forma-border/40"
                  title={`${count} carnets`}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (count / stats.totalNotebooks) * 100)}%`,
                      backgroundColor: subject.color,
                    }}
                  />
                </div>
              </GlassPanel>
            ))}
          </div>
        </section>
      )}

      {stats.recentActivity.length > 0 && (
        <section>
          <h3 className="text-sm font-medium text-forma-muted mb-2">Activité récente</h3>
          <GlassPanel variant="surface" className="p-2 divide-y divide-forma-border/30">
            {stats.recentActivity.map((nb) => {
              const subj = stats.bySubject.find((x) => x.subject.id === nb.subjectId)?.subject
              return (
                <ActivityRow
                  key={nb.id}
                  nb={nb}
                  subjectEmoji={subj?.emoji}
                  onOpen={() => onOpenNotebook(nb.id)}
                />
              )
            })}
          </GlassPanel>
        </section>
      )}
    </div>
  )
}
