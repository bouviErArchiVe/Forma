/**
 * ModuleHost — hôte commun des modules V2 (calendar, formula, presence…).
 *
 * Fournit à chaque module : chargement du notebook + première page,
 * shell standard (retour bibliothèque, titre renommable, badge de type),
 * et persistance debouncée de `page.moduleData` (+ updatedAt notebook).
 *
 * Contrat module : un composant React qui reçoit { notebook, data,
 * onDataChange } — `data` est la chaîne JSON du module ('' si vierge),
 * `onDataChange(json)` persiste (debounce 600 ms + flush au démontage).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import { db } from '../db'
import { getKindMeta } from '../lib/document-kinds'
import { getNotebook, renameNotebook } from '../services/library'
import type { Notebook, Page } from '../types'

// ─── Contrat des composants module ───────────────────────────────────────────

export interface ModuleProps {
  notebook: Notebook
  /** JSON du module ('' si jamais sauvegardé). */
  data: string
  /** Persiste le nouvel état JSON (debounce géré par l'hôte). */
  onDataChange: (json: string) => void
}

type ModuleComponent = React.ComponentType<ModuleProps>

// Chargement paresseux par type — chaque module est un chunk séparé.
const MODULE_COMPONENTS: Record<string, React.LazyExoticComponent<ModuleComponent>> = {
  subject: React.lazy(() => import('./subject/SubjectModule').then((m) => ({ default: m.SubjectModule }))),
  formula: React.lazy(() => import('./formula/FormulaModule').then((m) => ({ default: m.FormulaModule }))),
  translator: React.lazy(() => import('./translator/TranslatorModule').then((m) => ({ default: m.TranslatorModule }))),
  dictionary: React.lazy(() => import('./dictionary/DictionaryModule').then((m) => ({ default: m.DictionaryModule }))),
  calendar: React.lazy(() => import('./calendar/CalendarModule').then((m) => ({ default: m.CalendarModule }))),
  presence: React.lazy(() => import('./presence/PresenceModule').then((m) => ({ default: m.PresenceModule }))),
  combine: React.lazy(() => import('./combine/CombineModule').then((m) => ({ default: m.CombineModule }))),
  pause: React.lazy(() => import('./pause/PauseModule').then((m) => ({ default: m.PauseModule }))),
}

const SAVE_DEBOUNCE_MS = 600

export function ModuleHost() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [notebook, setNotebook] = useState<Notebook | null>(null)
  const [page, setPage] = useState<Page | null>(null)
  const [title, setTitle] = useState('')
  const [editingTitle, setEditingTitle] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved')

  const saveTimerRef = useRef<number | null>(null)
  const pendingRef = useRef<string | null>(null)
  const pageIdRef = useRef<string | null>(null)

  // ── Chargement ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return
    void Promise.resolve().then(async () => {
      const nb = await getNotebook(id)
      if (!nb) {
        navigate('/', { replace: true })
        return
      }
      const firstPage = await db.pages.where('notebookId').equals(id).first()
      setNotebook(nb)
      setTitle(nb.name)
      setPage(firstPage ?? null)
      pageIdRef.current = firstPage?.id ?? null
    })
  }, [id, navigate])

  // ── Persistance debouncée de moduleData ─────────────────────────────────────
  const flush = useCallback(async () => {
    const json = pendingRef.current
    const pageId = pageIdRef.current
    if (json === null || !pageId) return
    pendingRef.current = null
    await db.pages.update(pageId, { moduleData: json, updatedAt: Date.now() })
    if (id) await db.notebooks.update(id, { updatedAt: Date.now() })
    setSaveStatus('saved')
  }, [id])

  const onDataChange = useCallback(
    (json: string) => {
      pendingRef.current = json
      setSaveStatus('saving')
      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current)
      saveTimerRef.current = window.setTimeout(() => {
        saveTimerRef.current = null
        void flush()
      }, SAVE_DEBOUNCE_MS)
    },
    [flush],
  )

  // Flush au démontage / fermeture onglet
  useEffect(() => {
    const onBeforeUnload = () => {
      // Best-effort synchrone impossible avec Dexie — flush immédiat async
      void flush()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current)
      void flush()
    }
  }, [flush])

  if (!notebook || !page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-forma-bg text-forma-muted text-sm">
        Chargement…
      </div>
    )
  }

  const meta = getKindMeta(notebook.type)
  const Module = MODULE_COMPONENTS[notebook.type]

  const commitTitle = async () => {
    setEditingTitle(false)
    const trimmed = title.trim()
    if (trimmed && trimmed !== notebook.name) {
      await renameNotebook(notebook.id, trimmed)
      setNotebook({ ...notebook, name: trimmed })
    } else {
      setTitle(notebook.name)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-forma-bg text-forma-text overflow-hidden">
      {/* ── Header standard module ─────────────────────────────────────────── */}
      <header className="shrink-0 z-20 bg-forma-surface border-b border-forma-border shadow-sm flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          onClick={() => navigate('/')}
          title="Retour à la bibliothèque"
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 text-forma-muted hover:text-forma-text transition-colors shrink-0"
        >
          <Icon name="chevron-left" className="w-4 h-4" />
        </button>

        <span
          className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0"
          style={{ backgroundColor: `${meta.color}1a`, color: meta.color }}
        >
          {meta.badge}
        </span>

        {editingTitle ? (
          <input
            type="text"
            value={title}
            autoFocus
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => void commitTitle()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void commitTitle()
              if (e.key === 'Escape') {
                setTitle(notebook.name)
                setEditingTitle(false)
              }
            }}
            className="text-sm font-semibold bg-forma-bg border border-forma-accent rounded px-1.5 py-0.5 focus:outline-none min-w-0 flex-1 max-w-sm"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingTitle(true)}
            title="Renommer"
            className="text-sm font-semibold truncate hover:text-forma-accent transition-colors min-w-0"
          >
            {notebook.name}
          </button>
        )}

        <div className="flex-1" />

        <span className="text-[10px] text-forma-muted inline-flex items-center gap-1 shrink-0">
          {saveStatus === 'saved' ? (
            <>
              <Icon name="check" className="w-3 h-3 text-green-500" />
              Enregistré
            </>
          ) : (
            'Enregistrement…'
          )}
        </span>
      </header>

      {/* ── Contenu du module ──────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {Module ? (
          <React.Suspense
            fallback={
              <div className="flex items-center justify-center h-full text-forma-muted text-sm">
                Chargement du module…
              </div>
            }
          >
            <Module notebook={notebook} data={page.moduleData ?? ''} onDataChange={onDataChange} />
          </React.Suspense>
        ) : (
          <div className="flex items-center justify-center h-full text-forma-muted text-sm">
            Type de module inconnu : {notebook.type}
          </div>
        )}
      </div>
    </div>
  )
}
