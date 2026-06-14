/**
 * LinkedDocuments — section « documents liés » réutilisable (matière, projet).
 *
 * Affiche les documents rattachés et un panneau pour en lier/délier. Le
 * rattachement passe par un champ du notebook (subjectId ou projectId) géré
 * par `link`/`unlink` fournis par le parent.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { getKindMeta } from '../../lib/document-kinds'
import { formatRelativeTime } from '../../lib/format-relative'
import type { Notebook } from '../../types'

export function LinkedDocuments({
  linked,
  /** Notebooks candidats au rattachement (déjà filtrés : non liés, hors corbeille). */
  loadCandidates,
  onLink,
  onUnlink,
  onChanged,
}: {
  linked: Notebook[]
  loadCandidates: () => Promise<Notebook[]>
  onLink: (notebookId: string) => Promise<void>
  onUnlink: (notebookId: string) => Promise<void>
  onChanged: () => void
}) {
  const navigate = useNavigate()
  const [showPanel, setShowPanel] = useState(false)
  const [candidates, setCandidates] = useState<Notebook[]>([])

  const openPanel = async () => {
    setCandidates(await loadCandidates())
    setShowPanel(true)
  }

  useEffect(() => {
    if (showPanel) void loadCandidates().then(setCandidates)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linked])

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-forma-text">Documents liés ({linked.length})</h3>
        <button
          type="button"
          onClick={() => (showPanel ? setShowPanel(false) : void openPanel())}
          className="text-xs px-2.5 py-1 rounded-lg border border-forma-border hover:border-forma-accent/60 text-forma-muted hover:text-forma-accent transition-colors inline-flex items-center gap-1"
        >
          <Icon name={showPanel ? 'close' : 'plus'} className="w-3 h-3" />
          {showPanel ? 'Fermer' : 'Lier des documents'}
        </button>
      </div>

      {showPanel && (
        <div className="mb-3 p-2 rounded-xl border border-forma-accent/30 bg-forma-accent/5 max-h-56 overflow-y-auto">
          {candidates.length === 0 ? (
            <p className="text-xs text-forma-muted text-center py-3">Aucun document à lier</p>
          ) : (
            candidates.map((c) => {
              const meta = getKindMeta(c.type)
              return (
                <div key={c.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-forma-surface">
                  <Icon name={meta.icon} className="w-4 h-4 shrink-0" style={{ color: meta.color }} />
                  <span className="text-xs text-forma-text truncate flex-1">{c.name}</span>
                  <button type="button" title="Lier" onClick={async () => { await onLink(c.id); onChanged() }} className="p-1 text-forma-muted hover:text-forma-accent shrink-0">
                    <Icon name="plus" className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })
          )}
        </div>
      )}

      {linked.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-forma-border rounded-xl">
          <Icon name="folder" className="w-7 h-7 mx-auto text-forma-muted mb-1.5" />
          <p className="text-xs text-forma-muted">Aucun document lié. Utilisez « Lier des documents ».</p>
        </div>
      ) : (
        <div className="space-y-1">
          {linked.map((doc) => {
            const meta = getKindMeta(doc.type)
            return (
              <div key={doc.id} className="group flex items-center gap-2.5 px-3 py-2 rounded-xl border border-forma-border bg-forma-surface hover:border-forma-accent/50 cursor-pointer transition-colors" onClick={() => navigate(`/document/${doc.id}`)}>
                <Icon name={meta.icon} className="w-4 h-4 shrink-0" style={{ color: meta.color }} />
                <span className="text-sm text-forma-text truncate flex-1">{doc.name}</span>
                <span className="text-[10px] font-medium px-1 py-px rounded shrink-0" style={{ backgroundColor: `${meta.color}1a`, color: meta.color }}>{meta.badge}</span>
                <span className="text-[10px] text-forma-muted shrink-0">{formatRelativeTime(doc.updatedAt)}</span>
                <button type="button" title="Retirer du lien" onClick={async (e) => { e.stopPropagation(); await onUnlink(doc.id); onChanged() }} className="p-1 text-forma-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Icon name="close" className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
