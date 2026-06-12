/**
 * SubjectModule — Matière V2.
 *
 * Une matière regroupe les documents d'un cours : description, couleur,
 * liste des documents liés (notebook.subjectId), liaison/déliaison,
 * et statistiques simples (total, répartition par type, dernière activité).
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../../components/ui/Icon'
import { db } from '../../db'
import { getKindMeta } from '../../lib/document-kinds'
import { formatRelativeTime } from '../../lib/format-relative'
import { COVER_COLORS, type Notebook } from '../../types'
import type { ModuleProps } from '../ModuleHost'

interface SubjectState {
  v: 1
  color: string
  description: string
}

function parseState(json: string, fallbackColor: string): SubjectState {
  const empty: SubjectState = { v: 1, color: fallbackColor, description: '' }
  if (json.trim() === '') return empty
  try {
    const parsed = JSON.parse(json) as Partial<SubjectState>
    return {
      v: 1,
      color: typeof parsed.color === 'string' ? parsed.color : fallbackColor,
      description: typeof parsed.description === 'string' ? parsed.description : '',
    }
  } catch {
    return empty
  }
}

export function SubjectModule({ notebook, data, onDataChange }: ModuleProps) {
  const navigate = useNavigate()
  const [state, setState] = useState<SubjectState>(() => parseState(data, notebook.coverColor))
  const [linked, setLinked] = useState<Notebook[]>([])
  const [showLinkPanel, setShowLinkPanel] = useState(false)
  const [candidates, setCandidates] = useState<Notebook[]>([])

  const update = (next: SubjectState) => {
    setState(next)
    onDataChange(JSON.stringify(next))
  }

  const reload = useCallback(async () => {
    const docs = await db.notebooks
      .filter((n) => n.subjectId === notebook.id && !n.deletedAt)
      .toArray()
    docs.sort((a, b) => b.updatedAt - a.updatedAt)
    setLinked(docs)
  }, [notebook.id])

  useEffect(() => {
    void Promise.resolve().then(reload)
  }, [reload])

  const openLinkPanel = async () => {
    const all = await db.notebooks
      .filter((n) => !n.deletedAt && n.type !== 'subject' && n.subjectId !== notebook.id)
      .toArray()
    all.sort((a, b) => b.updatedAt - a.updatedAt)
    setCandidates(all)
    setShowLinkPanel(true)
  }

  const link = async (id: string) => {
    await db.notebooks.update(id, { subjectId: notebook.id })
    setCandidates((prev) => prev.filter((c) => c.id !== id))
    await reload()
  }

  const unlink = async (id: string) => {
    await db.notebooks.update(id, { subjectId: undefined })
    await reload()
  }

  // ── Statistiques ─────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const byType = new Map<string, number>()
    let lastActivity = 0
    for (const doc of linked) {
      byType.set(doc.type, (byType.get(doc.type) ?? 0) + 1)
      if (doc.updatedAt > lastActivity) lastActivity = doc.updatedAt
    }
    return { total: linked.length, byType: [...byType.entries()], lastActivity }
  }, [linked])

  return (
    <div className="h-full overflow-y-auto min-h-0">
      <div className="max-w-3xl mx-auto p-6">
        {/* ── En-tête : couleur + stats ──────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="flex-1 min-w-48 p-3 rounded-xl border border-forma-border bg-forma-surface">
            <p className="text-2xl font-semibold text-forma-text">{stats.total}</p>
            <p className="text-xs text-forma-muted">document{stats.total !== 1 ? 's' : ''} lié{stats.total !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex-1 min-w-48 p-3 rounded-xl border border-forma-border bg-forma-surface">
            <p className="text-sm text-forma-text">
              {stats.byType.length === 0
                ? '—'
                : stats.byType.map(([t, n]) => `${n} ${getKindMeta(t).badge}`).join(' · ')}
            </p>
            <p className="text-xs text-forma-muted">répartition par type</p>
          </div>
          <div className="flex-1 min-w-48 p-3 rounded-xl border border-forma-border bg-forma-surface">
            <p className="text-sm text-forma-text">
              {stats.lastActivity > 0 ? formatRelativeTime(stats.lastActivity) : '—'}
            </p>
            <p className="text-xs text-forma-muted">dernière activité</p>
          </div>
        </div>

        {/* ── Description + couleur ──────────────────────────────────────────── */}
        <div className="mb-5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-forma-muted mb-1">Description</p>
          <textarea
            value={state.description}
            onChange={(e) => update({ ...state, description: e.target.value })}
            placeholder="Décrivez cette matière (objectifs, enseignant, session…)"
            rows={2}
            className="w-full text-sm border border-forma-border rounded-lg px-3 py-2 bg-forma-surface resize-y focus:outline-none focus:border-forma-accent"
          />
          <div className="flex items-center gap-1.5 mt-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-forma-muted mr-1">Couleur</p>
            {COVER_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  update({ ...state, color: c })
                  void db.notebooks.update(notebook.id, { coverColor: c })
                }}
                className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                  state.color === c ? 'border-forma-accent scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>

        {/* ── Documents liés ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-forma-text">Documents de la matière</h3>
          <button
            type="button"
            onClick={() => (showLinkPanel ? setShowLinkPanel(false) : void openLinkPanel())}
            className="text-xs px-2.5 py-1 rounded-lg border border-forma-border hover:border-forma-accent/60 text-forma-muted hover:text-forma-accent transition-colors inline-flex items-center gap-1"
          >
            <Icon name={showLinkPanel ? 'close' : 'plus'} className="w-3 h-3" />
            {showLinkPanel ? 'Fermer' : 'Lier des documents'}
          </button>
        </div>

        {/* Panneau de liaison */}
        {showLinkPanel && (
          <div className="mb-3 p-2 rounded-xl border border-forma-accent/30 bg-forma-accent/5 max-h-56 overflow-y-auto">
            {candidates.length === 0 ? (
              <p className="text-xs text-forma-muted text-center py-3">Aucun document à lier</p>
            ) : (
              candidates.map((c) => {
                const meta = getKindMeta(c.type)
                return (
                  <div key={c.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-forma-surface">
                    <span
                      className="text-[10px] font-medium px-1 py-px rounded shrink-0"
                      style={{ backgroundColor: `${meta.color}1a`, color: meta.color }}
                    >
                      {meta.badge}
                    </span>
                    <span className="text-xs text-forma-text truncate flex-1">{c.name}</span>
                    <button
                      type="button"
                      title="Lier à cette matière"
                      onClick={() => void link(c.id)}
                      className="p-1 text-forma-muted hover:text-forma-accent shrink-0"
                    >
                      <Icon name="plus" className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Liste des liés */}
        {linked.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-forma-border rounded-xl">
            <Icon name="folder" className="w-8 h-8 mx-auto text-forma-muted mb-2" />
            <p className="text-xs text-forma-muted">
              Aucun document lié. Utilisez « Lier des documents » pour rattacher carnets, PDF et notes à cette matière.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {linked.map((doc) => {
              const meta = getKindMeta(doc.type)
              return (
                <div
                  key={doc.id}
                  className="group flex items-center gap-2.5 px-3 py-2 rounded-xl border border-forma-border bg-forma-surface hover:border-forma-accent/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/document/${doc.id}`)}
                >
                  <Icon name={meta.icon} className="w-4 h-4 shrink-0" style={{ color: meta.color }} />
                  <span className="text-sm text-forma-text truncate flex-1">{doc.name}</span>
                  <span
                    className="text-[10px] font-medium px-1 py-px rounded shrink-0"
                    style={{ backgroundColor: `${meta.color}1a`, color: meta.color }}
                  >
                    {meta.badge}
                  </span>
                  <span className="text-[10px] text-forma-muted shrink-0">{formatRelativeTime(doc.updatedAt)}</span>
                  <button
                    type="button"
                    title="Retirer de la matière"
                    onClick={(e) => {
                      e.stopPropagation()
                      void unlink(doc.id)
                    }}
                    className="p-1 text-forma-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  >
                    <Icon name="close" className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
