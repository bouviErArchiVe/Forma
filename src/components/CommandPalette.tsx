import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { dispatchEditorCommand, type EditorCommand } from '../lib/editor-commands'
import { globalHitSourceLabel, searchGlobalPages, type GlobalPageHit } from '../lib/global-search'
import { getRecentPages } from '../lib/recent-pages'
import { openQuickNote } from '../lib/quick-note'
import { getRecentIds } from '../lib/recent'
import { useLibraryStore } from '../stores/libraryStore'
import { getAllNotebooks, getNotebooksByIds } from '../services/library'
import { useTabsStore } from '../stores/tabsStore'
import type { Notebook } from '../types'

type Action = {
  id: string
  label: string
  hint?: string
  run: () => void
}

export function CommandPalette() {
  const navigate = useNavigate()
  const location = useLocation()
  const inEditor = /^\/document\/[^/]+/.test(location.pathname)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [notebooks, setNotebooks] = useState<Notebook[]>([])
  const [idx, setIdx] = useState(0)
  const [pageHits, setPageHits] = useState<GlobalPageHit[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const openIds = useTabsStore((s) => s.openIds)

  const loadNotebooks = useCallback(async () => {
    const all = await getAllNotebooks()
    const recent = await getNotebooksByIds(getRecentIds())
    const byId = new Map<string, Notebook>()
    for (const nb of all) if (!nb.deletedAt) byId.set(nb.id, nb)
    for (const nb of recent) if (!nb.deletedAt) byId.set(nb.id, nb)
    setNotebooks([...byId.values()].sort((a, b) => b.updatedAt - a.updatedAt))
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (!typing && e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) {
      setQuery('')
      setIdx(0)
      setPageHits([])
      void loadNotebooks()
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open, loadNotebooks])

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setPageHits([])
      return
    }
    const t = setTimeout(() => {
      void searchGlobalPages(query).then(setPageHits)
    }, 280)
    return () => clearTimeout(t)
  }, [query, open])

  const nav = (path: string) => {
    setOpen(false)
    navigate(path)
  }

  const editorCmd = (cmd: EditorCommand, label: string, hint?: string): Action => ({
    id: `ed-${cmd}`,
    label,
    hint,
    run: () => {
      setOpen(false)
      dispatchEditorCommand(cmd)
    },
  })

  const editorActions: Action[] = useMemo(() => {
    if (!inEditor) return []
    return [
      editorCmd('search', 'Recherche dans le document', 'Ctrl+F'),
      editorCmd('outline', 'Plan de la page', 'Panneau'),
      editorCmd('history', 'Versions de la page', 'Historique'),
      editorCmd('presentation', 'Mode présentation', '▶'),
      editorCmd('toggle-continuous', 'Basculer vue continue / page', '▤'),
      editorCmd('toggle-sidebar', 'Masquer / afficher les pages', '‹ ›'),
      editorCmd('scanner', 'Scanner une image', 'Caméra'),
      editorCmd('shortcuts', 'Raccourcis clavier', '?'),
      editorCmd('prev-page', 'Page précédente', 'Alt+←'),
      editorCmd('next-page', 'Page suivante', 'Alt+→'),
      editorCmd('focus-mode', 'Mode focus (zen)', '`'),
      editorCmd('index-ink', 'Indexer l’encre — page active', 'OCR'),
      editorCmd('index-notebook', 'Indexer tout le carnet (encre)', 'OCR'),
      editorCmd('duplicate-page', 'Dupliquer la page', 'Ctrl+Shift+D'),
      editorCmd('print', 'Imprimer le carnet', 'Ctrl+P'),
      editorCmd('panel-ai', 'Panneau IA', 'IA'),
      editorCmd('panel-study', 'Panneau révision', 'Study'),
      editorCmd('panel-ocr', 'Panneau OCR', 'OCR'),
      editorCmd('panel-share', 'Panneau partage', 'Lien'),
      editorCmd('panel-audio', 'Panneau audio', 'Micro'),
      editorCmd('export-markdown-page', 'Exporter page en Markdown', '.md'),
      editorCmd('export-markdown-notebook', 'Exporter carnet en Markdown', '.md'),
      editorCmd('export-study-csv', 'Exporter cartes Study (CSV)', 'CSV'),
      editorCmd('toggle-read-mode', 'Mode lecture', 'Shift+R'),
      editorCmd('toggle-page-favorite', 'Favori page ★', 'Sidebar'),
      editorCmd('toggle-fullscreen', 'Plein écran', 'F11'),
      {
        id: 'close-tabs',
        label: 'Fermer tous les onglets',
        hint: 'Bibliothèque',
        run: () => {
          useTabsStore.getState().closeAllTabs()
          nav('/')
        },
      },
      {
        id: 'close-other',
        label: 'Fermer les autres onglets',
        run: () => {
          const id = location.pathname.match(/\/document\/([^/]+)/)?.[1]
          if (id) useTabsStore.getState().closeOtherTabs(id)
        },
      },
    ]
  }, [inEditor, location.pathname])

  const staticActions: Action[] = useMemo(
    () => [
      {
        id: 'quick',
        label: 'Note rapide',
        hint: '⚡',
        run: () => {
          const folderId = useLibraryStore.getState().currentFolderId
          void openQuickNote(folderId).then((id) => nav(`/document/${id}`))
        },
      },
      { id: 'lib', label: 'Bibliothèque', hint: '/', run: () => nav('/') },
      { id: 'settings', label: 'Paramètres', hint: '/settings', run: () => nav('/settings') },
      { id: 'templates', label: 'Modèles de page', run: () => nav('/templates') },
      { id: 'trash', label: 'Corbeille', run: () => nav('/trash') },
      { id: 'plans', label: 'Offres Forma', run: () => nav('/plans') },
      {
        id: 'new-nb',
        label: 'Nouveau carnet',
        hint: 'Bibliothèque',
        run: () => nav('/'),
      },
    ],
    [],
  )

  const notebookActions: Action[] = useMemo(() => {
    const q = query.toLowerCase().trim()
    const list = q
      ? notebooks.filter((nb) => nb.name.toLowerCase().includes(q))
      : notebooks.slice(0, 20)
    return list.map((nb) => ({
      id: `nb-${nb.id}`,
      label: nb.name,
      hint: 'Ouvrir le carnet',
      run: () => nav(`/document/${nb.id}`),
    }))
  }, [notebooks, query])

  const tabActions: Action[] = useMemo(() => {
    if (query.trim()) return []
    return openIds
      .map((id) => notebooks.find((n) => n.id === id))
      .filter((n): n is Notebook => !!n)
      .map((nb) => ({
        id: `tab-${nb.id}`,
        label: `Onglet : ${nb.name}`,
        hint: 'Document ouvert',
        run: () => nav(`/document/${nb.id}`),
      }))
  }, [openIds, notebooks, query])

  const pageActions: Action[] = useMemo(
    () =>
      pageHits.map((h, i) => ({
        id: `page-${h.pageId || h.notebookId}-${i}`,
        label: h.pageId
          ? `${h.notebookName} — p.${h.pageIndex}`
          : h.notebookName,
        hint: `${globalHitSourceLabel(h.source)} · ${h.snippet.slice(0, 36)}`,
        run: () =>
          nav(
            h.pageId
              ? `/document/${h.notebookId}?page=${h.pageId}`
              : `/document/${h.notebookId}`,
          ),
      })),
    [pageHits],
  )

  const recentPageActions: Action[] = useMemo(() => {
    if (query.trim()) return []
    return getRecentPages().slice(0, 6).map((e) => ({
      id: `rp-${e.pageId}`,
      label: `${e.notebookName} — p.${e.pageIndex}`,
      hint: 'Page récente',
      run: () => nav(`/document/${e.notebookId}?page=${e.pageId}`),
    }))
  }, [query])

  const items = useMemo(() => {
    const q = query.toLowerCase().trim()
    const matchEditor = editorActions.filter((a) => !q || a.label.toLowerCase().includes(q))
    const matchStatic = staticActions.filter((a) => !q || a.label.toLowerCase().includes(q))
    if (!q.trim()) {
      return [
        ...(inEditor ? matchEditor : []),
        ...recentPageActions,
        ...tabActions,
        ...matchStatic,
        ...notebookActions,
      ]
    }
    return [...pageActions, ...matchEditor, ...notebookActions, ...matchStatic]
  }, [
    tabActions,
    staticActions,
    notebookActions,
    editorActions,
    pageActions,
    recentPageActions,
    query,
    inEditor,
  ])

  useEffect(() => setIdx(0), [query, open])

  const run = (action: Action) => {
    action.run()
    setOpen(false)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[110] flex items-start justify-center pt-[12vh] bg-black/40 p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-forma-surface dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-forma-border"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            inEditor
              ? 'Carnet, pages (2+ car.), action…'
              : 'Carnet, pages (2+ car.), navigation…'
          }
          className="w-full px-4 py-3 border-b border-forma-border bg-transparent outline-none text-base"
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setIdx((i) => Math.min(i + 1, items.length - 1))
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault()
              setIdx((i) => Math.max(i - 1, 0))
            }
            if (e.key === 'Enter' && items[idx]) {
              e.preventDefault()
              run(items[idx])
            }
          }}
        />
        <ul className="max-h-72 overflow-y-auto py-1">
          {items.length === 0 && (
            <li className="px-4 py-3 text-sm text-forma-muted">Aucun résultat</li>
          )}
          {items.map((item, i) => (
            <li key={item.id}>
              <button
                type="button"
                className={`w-full text-left px-4 py-2 text-sm flex justify-between gap-2 ${
                  i === idx ? 'bg-forma-accent/15 text-forma-accent' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                onMouseEnter={() => setIdx(i)}
                onClick={() => run(item)}
              >
                <span>{item.label}</span>
                {item.hint && <span className="text-forma-muted text-xs shrink-0">{item.hint}</span>}
              </button>
            </li>
          ))}
        </ul>
        <p className="px-4 py-2 text-[10px] text-forma-muted border-t border-forma-border">
          ↑↓ · Entrée · Échap · Ctrl+K · /{inEditor ? ' · actions éditeur' : ''}
        </p>
      </div>
    </div>
  )
}
