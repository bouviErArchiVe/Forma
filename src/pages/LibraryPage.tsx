import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DropZone } from '../components/library/DropZone'
import { DocumentCard } from '../components/library/DocumentCard'
import { RecentStrip } from '../components/library/RecentStrip'
import { ShortcutsHelp } from '../components/editor/ShortcutsHelp'
import { MoveFolderModal } from '../components/library/MoveFolderModal'
import { NewNotebookModal } from '../components/library/NewNotebookModal'
import { db } from '../db'
import { downloadSelectedNotebooks, importNotebookZip } from '../lib/backup'
import { exportNotebooksToPdf } from '../lib/bulk-export'
import { exportNotebooksMarkdownZip } from '../lib/bulk-markdown'
import { createNotebookFromMarkdown } from '../lib/markdown-import'
import { getPinnedNotebookIds } from '../lib/pinned-notebooks'
import { buildFolderPath } from '../lib/folder-path'
import { basePageDimensions } from '../lib/page-dimensions'
import { renderFullPage } from '../lib/page-render'
import { libraryThumbQueue, THUMB_PRIORITY } from '../lib/thumb-queue'
import { importPdfFile } from '../lib/pdf-import'
import { openQuickNote } from '../lib/quick-note'
import { getRecentIds } from '../lib/recent'
import { searchInLibraryAsync } from '../lib/search-index'
import { searchHitTypeLabel } from '../lib/search-labels'
import type { SearchHit } from '../lib/search'
import {
  createFolder,
  createNotebook,
  createNotebookFromImage,
  createNotebookFromImages,
  createNotebookFromPdf,
  createFormaDoc,
  createFormaTab,
  createWhiteboard,
  deleteFolder,
  duplicateFolder,
  duplicateNotebook,
  mergeNotebooks,
  getFavorites,
  getFolders,
  getPageCounts,
  getNotebooks,
  renameFolder,
  renameNotebook,
  getNotebooksByIds,
  searchNotebooks,
  softDeleteNotebook,
  sortNotebooks,
  toggleFavorite,
  updateNotebookMetadata,
} from '../services/library'
import { useLibraryStore } from '../stores/libraryStore'
import { useSettingsStore } from '../stores/settingsStore'
import { getPages } from '../services/pages'
import { getLastBackupTime } from '../services/sync'
import { getBrowserStorageEstimate, isStorageNearlyFull } from '../lib/storage-quota'
import { confirm } from '../stores/confirmStore'
import { useToastStore } from '../stores/toastStore'
import type { DocumentType } from '../types'
import { normalizePage } from '../types'
import type { Folder, Notebook, Page } from '../types'

type FilterTab = 'all' | 'favorites' | 'recent'

const FILTER_TAB_KEY = 'forma-library-tab'

function readFilterTab(): FilterTab {
  try {
    const v = localStorage.getItem(FILTER_TAB_KEY)
    if (v === 'favorites' || v === 'recent' || v === 'all') return v
  } catch {
    /* ignore */
  }
  return 'all'
}

export function LibraryPage() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const formaRef = useRef<HTMLInputElement>(null)
  const [folders, setFolders] = useState<Awaited<ReturnType<typeof getFolders>>>([])
  const [notebooks, setNotebooks] = useState<Notebook[]>([])
  const [showNewNotebook, setShowNewNotebook] = useState(false)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [showMove, setShowMove] = useState(false)
  const [filterTab, setFilterTab] = useState<FilterTab>(readFilterTab)

  useEffect(() => {
    localStorage.setItem(FILTER_TAB_KEY, filterTab)
  }, [filterTab])
  const [globalHits, setGlobalHits] = useState<SearchHit[]>([])
  const [searching, setSearching] = useState(false)
  const [folderPath, setFolderPath] = useState<Folder[]>([])
  const [focusIdx, setFocusIdx] = useState(-1)
  const [pageCounts, setPageCounts] = useState<Record<string, number>>({})
  const [thumbs, setThumbs] = useState<Record<string, string>>({})
  const [renamingFolder, setRenamingFolder] = useState<Folder | null>(null)
  const [renameFolderName, setRenameFolderName] = useState('')
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [listRefresh, setListRefresh] = useState(0)
  const [folderCounts, setFolderCounts] = useState<Record<string, number>>({})
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set())
  const [storageWarning, setStorageWarning] = useState(false)
  const [importBusy, setImportBusy] = useState(false)
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null)
  const importAbortRef = useRef<AbortController | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const {
    currentFolderId,
    viewMode,
    sortBy,
    sortOrder,
    searchQuery,
    selectionMode,
    selectedIds,
    setFolder,
    setViewMode,
    setSort,
    setSearch,
    toggleSelection,
    clearSelection,
    setSelectionMode,
    selectAll,
    typeFilter,
    setTypeFilter,
  } = useLibraryStore()

  const navCount =
    (filterTab === 'all' ? folders.length : 0) + notebooks.length

  // Vérification quota stockage au montage
  useEffect(() => {
    getBrowserStorageEstimate().then((est) => {
      setStorageWarning(isStorageNearlyFull(est.percent, 85))
    })
  }, [])

  useEffect(() => {
    setFocusIdx(-1)
  }, [currentFolderId, filterTab, searchQuery])

  const requestCoverThumb = useCallback((nb: Notebook, priority: number) => {
    const cached = libraryThumbQueue.peek(nb.id)
    if (cached) {
      setThumbs((prev) => (prev[nb.id] === cached ? prev : { ...prev, [nb.id]: cached }))
      return
    }
    void libraryThumbQueue
      .enqueue(nb.id, priority, async () => {
        const pages = await getPages(nb.id)
        const first = pages[0]
        if (!first) return ''
        const { width, height } = basePageDimensions(nb.orientation)
        const tw = 160
        const th = Math.round((height / width) * tw)
        const canvas = await renderFullPage(first, tw, th, {
          pdfSourceDataUrl: nb.pdfSourceDataUrl,
          notebook: nb,
        })
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6)
        // Release canvas GPU memory immediately after encoding
        canvas.width = 0
        canvas.height = 0
        return dataUrl
      })
      .then((url) => {
        if (url) setThumbs((prev) => ({ ...prev, [nb.id]: url }))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    for (const nb of notebooks) {
      const cached = libraryThumbQueue.peek(nb.id)
      if (cached) {
        setThumbs((prev) => (prev[nb.id] ? prev : { ...prev, [nb.id]: cached }))
      }
    }
  }, [notebooks])

  useEffect(() => {
    if (notebooks.length === 0) return
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          const id = e.target.getAttribute('data-notebook-id')
          if (!id) continue
          const nb = notebooks.find((n) => n.id === id)
          if (nb) requestCoverThumb(nb, THUMB_PRIORITY.visible)
        }
      },
      { root: null, rootMargin: '120px', threshold: 0.05 },
    )
    for (const el of cardRefs.current.values()) obs.observe(el)
    return () => obs.disconnect()
  }, [notebooks, requestCoverThumb])

  useEffect(() => {
    if (!listRefresh) return
    libraryThumbQueue.invalidateMany(notebooks.map((nb) => nb.id))
    setThumbs({})
  }, [listRefresh, notebooks])

  const load = useCallback(async () => {
    const f = await getFolders(currentFolderId)
    let n: Notebook[] = []

    if (filterTab === 'favorites') {
      n = await getFavorites()
    } else if (filterTab === 'recent') {
      const ids = getRecentIds()
      n = await getNotebooksByIds(ids)
    } else if (searchQuery.trim()) {
      n = await searchNotebooks(searchQuery)
      n = n.filter((nb) => nb.folderId === currentFolderId)
      const all = await searchNotebooks('')
      const map = new Map<string, Page[]>()
      for (const nb of all) map.set(nb.id, [])
      const allPages = await db.pages.toArray()
      for (const raw of allPages) {
        const list = map.get(raw.notebookId)
        if (list) list.push(normalizePage(raw))
      }
      setSearching(true)
      searchInLibraryAsync(all, map, searchQuery)
        .then(setGlobalHits)
        .finally(() => setSearching(false))
    } else {
      n = await getNotebooks(currentFolderId)
    }

    setFolders(f)
    const counts: Record<string, number> = {}
    await Promise.all(
      f.map(async (folder) => {
        counts[folder.id] = await db.notebooks
          .filter((nb) => !nb.deletedAt && nb.folderId === folder.id)
          .count()
      }),
    )
    setFolderCounts(counts)
    setPinnedIds(await getPinnedNotebookIds())
    let sorted = sortNotebooks(n, sortBy, sortOrder)
    if (typeFilter !== 'all') sorted = sorted.filter((nb) => nb.type === typeFilter)
    setNotebooks(sorted)
    if (sorted.length) setPageCounts(await getPageCounts(sorted.map((nb) => nb.id)))
    else setPageCounts({})
    if (!searchQuery.trim()) setGlobalHits([])
    setListRefresh((k) => k + 1)
  }, [currentFolderId, searchQuery, sortBy, sortOrder, filterTab, typeFilter])

  useEffect(() => {
    const t = setTimeout(() => load(), 280)
    return () => clearTimeout(t)
  }, [load])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (showNewNotebook || showMove || showNewFolder) return
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      if (selectionMode && e.key === 'Escape') {
        e.preventDefault()
        clearSelection()
        return
      }
      if (selectionMode || navCount === 0) return

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        setFocusIdx((i) => (i < 0 ? 0 : (i + 1) % navCount))
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusIdx((i) => (i <= 0 ? navCount - 1 : i - 1))
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        setShowNewNotebook(true)
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        if (!selectionMode) setSelectionMode(true)
        selectAll(notebooks.map((n) => n.id))
      } else if (e.key === 'Escape') {
        setSearch('')
      } else if (e.key === 'Delete' && focusIdx >= 0) {
        const ni = focusIdx - (filterTab === 'all' ? folders.length : 0)
        const nb = notebooks[ni]
        if (nb) {
          e.preventDefault()
          void confirm(`Mettre « ${nb.name} » en corbeille ?`, {
            danger: true,
            confirmLabel: 'Supprimer',
          }).then((ok) => {
            if (ok) {
              void softDeleteNotebook(nb.id).then(() => {
                useToastStore.getState().show('Déplacé en corbeille')
                void load()
              })
            }
          })
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && focusIdx >= 0) {
        const ni = focusIdx - (filterTab === 'all' ? folders.length : 0)
        const nb = notebooks[ni]
        if (nb) {
          e.preventDefault()
          void duplicateNotebook(nb.id).then((d) => {
            if (d) {
              useToastStore.getState().show('Carnet dupliqué')
              navigate(`/document/${d.id}`)
            }
          })
        }
      } else if (e.key === 'Enter' && focusIdx >= 0) {
        e.preventDefault()
        if (filterTab === 'all' && focusIdx < folders.length) {
          setFolder(folders[focusIdx].id)
        } else {
          const ni = focusIdx - (filterTab === 'all' ? folders.length : 0)
          const nb = notebooks[ni]
          if (nb) navigate(`/document/${nb.id}`)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    selectionMode,
    showNewNotebook,
    showMove,
    showNewFolder,
    navCount,
    focusIdx,
    filterTab,
    folders,
    notebooks,
    navigate,
    setFolder,
    clearSelection,
    setSearch,
    load,
    setSelectionMode,
    selectAll,
  ])

  useEffect(() => {
    buildFolderPath(currentFolderId).then(setFolderPath)
  }, [currentFolderId])

  const handleImportPdf = async (file: File) => {
    const abortController = new AbortController()
    importAbortRef.current = abortController
    setImportBusy(true)
    setImportProgress(null)
    try {
      const { pages, pdfSourceDataUrl } = await importPdfFile(file, {
        lazy: true,
        signal: abortController.signal,
        onProgress: (current, total) => setImportProgress({ current, total }),
      })
      const name = file.name.replace(/\.pdf$/i, '')
      const nb = await createNotebookFromPdf(name, currentFolderId, pages, pdfSourceDataUrl)
      navigate(`/document/${nb.id}`)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        useToastStore.getState().show('Import PDF annulé')
      } else {
        useToastStore.getState().show(
          err instanceof Error ? `Import PDF échoué : ${err.message}` : 'Import PDF échoué',
          6000,
        )
      }
    } finally {
      setImportBusy(false)
      setImportProgress(null)
      importAbortRef.current = null
    }
  }

  const MAX_IMAGE_IMPORT_BYTES = 20 * 1024 * 1024 // 20 MB per image
  const ACCEPTED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']

  const validateImageFile = (file: File): string | null => {
    if (!ACCEPTED_IMAGE_MIMES.includes(file.type)) {
      return `Format non supporté : ${file.type || 'inconnu'} (JPEG, PNG, GIF, WebP, SVG)`
    }
    if (file.size > MAX_IMAGE_IMPORT_BYTES) {
      return `Image trop volumineuse (${(file.size / (1024 * 1024)).toFixed(1)} Mo, max 20 Mo)`
    }
    return null
  }

  const handleImportImage = async (file: File) => {
    const err = validateImageFile(file)
    if (err) {
      useToastStore.getState().show(err, 5000)
      return
    }
    try {
      const nb = await createNotebookFromImage(file.name, currentFolderId, file)
      navigate(`/document/${nb.id}`)
    } catch {
      useToastStore.getState().show("Impossible d'importer l'image", 5000)
    }
  }

  const handleImportImages = async (files: File[]) => {
    const valid = files.filter((f) => {
      const err = validateImageFile(f)
      if (err) useToastStore.getState().show(err, 4000)
      return !err
    })
    if (!valid.length) return
    try {
      const name = valid[0].name.replace(/\.[^.]+$/, '') || 'Album'
      const nb = await createNotebookFromImages(name, currentFolderId, valid)
      navigate(`/document/${nb.id}`)
    } catch {
      useToastStore.getState().show("Impossible d'importer les images", 5000)
    }
  }

  const handleDeleteSelected = async () => {
    for (const id of selectedIds) await softDeleteNotebook(id)
    clearSelection()
    load()
  }

  const openSelected = () => {
    const first = [...selectedIds][0]
    if (first) navigate(`/document/${first}`)
  }

  return (
    <DropZone
      onDropPdf={handleImportPdf}
      onDropImage={handleImportImage}
      onDropImages={handleImportImages}
      onDropMarkdown={async (file) => {
        try {
          const template = useSettingsStore.getState().defaultPaperTemplate
          const id = await createNotebookFromMarkdown(file, currentFolderId, template)
          navigate(`/document/${id}`)
          useToastStore.getState().show('Markdown importé')
        } catch (err) {
          useToastStore.getState().show(
            err instanceof Error ? err.message : 'Import Markdown échoué',
            6000,
          )
        }
      }}
      onDropFormaZip={async (file) => {
        try {
          const nbId = await importNotebookZip(file, currentFolderId)
          navigate(`/document/${nbId}`)
          useToastStore.getState().show('Carnet importé')
        } catch (err) {
          useToastStore.getState().show(
            err instanceof Error ? err.message : 'Import échoué',
            6000,
          )
        }
      }}
    >
    {/* PDF Import progress overlay */}
    {importBusy && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-forma-surface rounded-2xl shadow-xl p-6 max-w-xs w-full mx-4 text-center" style={{ animation: 'zoom-in 150ms cubic-bezier(0.16,1,0.3,1)' }}>
          <div className="text-3xl mb-3">📄</div>
          <h3 className="font-semibold text-sm mb-1">Import PDF en cours…</h3>
          {importProgress ? (
            <>
              <p className="text-xs text-forma-muted mb-3">
                Page {importProgress.current} / {importProgress.total}
              </p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-forma-accent h-full rounded-full transition-all duration-200"
                  style={{ width: `${Math.round((importProgress.current / importProgress.total) * 100)}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-xs text-forma-muted">Lecture du fichier…</p>
          )}
          <button
            type="button"
            className="mt-4 text-xs text-forma-muted hover:text-red-500 transition-colors"
            onClick={() => importAbortRef.current?.abort()}
          >
            Annuler
          </button>
        </div>
      </div>
    )}
    <div className="min-h-full flex flex-col">
      <header className="sticky top-0 z-10 bg-forma-surface border-b border-forma-border shadow-sm" style={{ boxShadow: 'var(--shadow-forma-sm)' }}>
        {/* Row 1 — Brand + search + controls */}
        <div className="flex items-center gap-2.5 px-4 py-2.5 flex-wrap max-w-6xl mx-auto">
          <div className="flex items-center gap-2 shrink-0">
            <h1 className="text-lg font-bold tracking-tight text-forma-accent">Forma</h1>
            <span className="text-[10px] text-forma-muted hidden sm:inline font-medium uppercase tracking-wider">Beta</span>
          </div>

          {storageWarning && (
            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="text-xs text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/50 font-medium hover:bg-red-200 dark:hover:bg-red-950 transition-colors"
              title="Espace de stockage presque plein — libérez de l'espace"
            >
              ⚠ Stockage presque plein
            </button>
          )}
          {!storageWarning && (() => {
            const last = getLastBackupTime()
            const stale = last && Date.now() - last > 7 * 86400000
            if (!stale) return null
            return (
              <button
                type="button"
                onClick={() => navigate('/settings')}
                className="text-xs text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/50 hover:bg-amber-200 transition-colors"
                title="Configurer la sauvegarde auto"
              >
                Sauvegarde &gt; 7 j
              </button>
            )
          })()}

          {/* Breadcrumb */}
          {folderPath.length > 0 && (
            <nav className="flex items-center gap-1 text-sm text-forma-muted min-w-0">
              <button type="button" onClick={() => setFolder(null)} className="hover:text-forma-accent transition-colors shrink-0">
                ⌂
              </button>
              {folderPath.map((f) => (
                <span key={f.id} className="flex items-center gap-1 shrink-0">
                  <span className="text-forma-border">/</span>
                  <button
                    type="button"
                    className="hover:text-forma-accent transition-colors truncate max-w-[100px]"
                    onClick={() => setFolder(f.id)}
                    title={f.name}
                  >
                    {f.name}
                  </button>
                </span>
              ))}
            </nav>
          )}

          <div className="flex-1" />

          {/* Search */}
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-forma-muted text-xs pointer-events-none">🔍</span>
            <input
              type="search"
              placeholder="Rechercher…"
              value={searchQuery}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') setSearch('') }}
              className="w-40 sm:w-56 border border-forma-border rounded-xl pl-7 pr-3 py-1.5 text-sm bg-forma-bg focus:outline-none focus:border-forma-accent focus:ring-1 focus:ring-forma-accent/30 transition-all"
            />
          </div>

          {/* Sort + type */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [by, ord] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder]
              setSort(by, ord)
            }}
            className="text-xs border border-forma-border rounded-lg px-2 py-1.5 bg-forma-surface hidden sm:block"
          >
            <option value="modified-desc">Modifié ↓</option>
            <option value="modified-asc">Modifié ↑</option>
            <option value="name-asc">Nom A→Z</option>
            <option value="name-desc">Nom Z→A</option>
            <option value="created-desc">Créé ↓</option>
            <option value="created-asc">Créé ↑</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | DocumentType)}
            className="text-xs border border-forma-border rounded-lg px-2 py-1.5 bg-forma-surface hidden sm:block"
            title="Filtrer par type"
          >
            <option value="all">Tous types</option>
            <option value="notebook">Carnets</option>
            <option value="pdf">PDF</option>
            <option value="whiteboard">Whiteboards</option>
            <option value="formadoc">Documents</option>
            <option value="formataб">Tableaux</option>
          </select>

          {/* View mode */}
          <div className="flex border border-forma-border rounded-lg overflow-hidden">
            {(['grid', 'list'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setViewMode(m)}
                className={`px-2.5 py-1.5 text-sm transition-colors ${
                  viewMode === m
                    ? 'bg-forma-accent text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-forma-muted'
                }`}
                title={m === 'grid' ? 'Grille' : 'Liste'}
              >
                {m === 'grid' ? '▦' : '☰'}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2 — Filter tabs + actions */}
        <div className="max-w-6xl mx-auto px-4 pb-2 flex flex-wrap gap-1.5 items-center">
          {/* Filter tabs */}
          <div className="flex gap-1 p-0.5 bg-gray-100 dark:bg-gray-800 rounded-full">
            {(['all', 'favorites', 'recent'] as FilterTab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFilterTab(t)}
                className={`text-xs px-3 py-1 rounded-full transition-all font-medium ${
                  filterTab === t
                    ? 'bg-white dark:bg-gray-700 text-forma-text shadow-sm'
                    : 'text-forma-muted hover:text-forma-text'
                }`}
              >
                {t === 'all' ? 'Tous' : t === 'favorites' ? '★ Favoris' : 'Récents'}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {/* Secondary nav */}
          <div className="flex items-center gap-1 flex-wrap">
            <button type="button" onClick={async () => navigate(`/document/${await openQuickNote(currentFolderId)}`)}
              className="text-xs px-2.5 py-1 bg-amber-400 hover:bg-amber-500 text-amber-950 rounded-lg font-medium transition-colors"
              title="Ouvre toujours le même carnet rapide">
              ⚡
            </button>
            <button type="button" onClick={() => setSelectionMode(!selectionMode)}
              className={`text-xs px-2.5 py-1 border rounded-lg transition-colors ${selectionMode ? 'border-forma-accent text-forma-accent' : 'border-forma-border text-forma-muted hover:border-forma-accent hover:text-forma-accent'}`}>
              {selectionMode ? '✕ Annuler' : 'Sélection'}
            </button>
            <button type="button" onClick={() => setShowNewNotebook(true)}
              className="text-xs px-2.5 py-1 bg-forma-accent hover:bg-forma-accent-hover text-white rounded-lg font-medium transition-colors shadow-sm">
              + Carnet
            </button>
            <button type="button" onClick={() => fileRef.current?.click()}
              className="text-xs px-2.5 py-1 border border-forma-border rounded-lg text-forma-muted hover:text-forma-accent hover:border-forma-accent transition-colors">
              PDF
            </button>
            <button type="button" onClick={() => formaRef.current?.click()}
              className="text-xs px-2.5 py-1 border border-forma-border rounded-lg text-forma-muted hover:text-forma-accent hover:border-forma-accent transition-colors">
              .forma
            </button>
            <button type="button" onClick={() => navigate('/settings')}
              className="text-xs text-forma-muted hover:text-forma-accent transition-colors px-1" title="Paramètres">
              ⚙
            </button>
            <button type="button" onClick={() => navigate('/trash')}
              className="text-xs text-forma-muted hover:text-red-500 transition-colors px-1" title="Corbeille">
              🗑
            </button>
          </div>
          <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleImportPdf(f)
            e.target.value = ''
          }} />
          <input
            ref={formaRef}
            type="file"
            accept=".zip,application/zip"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0]
              if (f) {
                try {
                  const nbId = await importNotebookZip(f, currentFolderId)
                  navigate(`/document/${nbId}`)
                } catch (err) {
                  useToastStore.getState().show(
                    err instanceof Error ? err.message : 'Import échoué',
                    6000,
                  )
                }
              }
              e.target.value = ''
            }}
          />
        </div>

        {selectionMode && selectedIds.size > 0 && (
          <div className="max-w-6xl mx-auto mt-2 flex flex-wrap gap-3 text-sm items-center">
            <span>{selectedIds.size} sélectionné(s)</span>
            <button
              type="button"
              className="text-forma-accent"
              onClick={() => selectAll(notebooks.map((n) => n.id))}
            >
              Tout sélectionner
            </button>
            <button type="button" onClick={openSelected} className="text-forma-accent">
              Ouvrir
            </button>
            <button type="button" onClick={() => setShowMove(true)}>
              Déplacer
            </button>
            <button type="button" onClick={async () => {
              for (const id of selectedIds) {
                const d = await duplicateNotebook(id)
                if (d) navigate(`/document/${d.id}`)
              }
              clearSelection()
            }}>
              Dupliquer
            </button>
            {selectedIds.size === 2 && (
              <button
                type="button"
                className="text-forma-accent"
                onClick={async () => {
                  const [a, b] = [...selectedIds]
                  const targetName = notebooks.find((n) => n.id === a)?.name ?? 'carnet'
                  if (
                    !(await confirm(
                      `Fusionner dans « ${targetName} » ? L’autre carnet ira en corbeille.`,
                      { title: 'Fusionner les carnets', confirmLabel: 'Fusionner' },
                    ))
                  )
                    return
                  const ok = await mergeNotebooks(a, b)
                  if (ok) {
                    clearSelection()
                    load()
                    navigate(`/document/${a}`)
                    useToastStore.getState().show('Carnets fusionnés')
                  } else useToastStore.getState().show('Fusion impossible', 5000)
                }}
              >
                Fusionner (2)
              </button>
            )}
            <button
              type="button"
              onClick={() => void downloadSelectedNotebooks([...selectedIds])}
            >
              Exporter .forma
            </button>
            <button
              type="button"
              onClick={async () => {
                const ids = [...selectedIds]
                useToastStore.getState().show(`Export PDF de ${ids.length} carnet(s)…`, 3000)
                const n = await exportNotebooksToPdf(ids, (name, i, t) =>
                  useToastStore.getState().show(`${name} (${i}/${t})`, 2500),
                )
                useToastStore.getState().show(`${n} PDF téléchargé(s)`)
              }}
            >
              Exporter PDF
            </button>
            <button
              type="button"
              onClick={async () => {
                const ids = [...selectedIds]
                try {
                  useToastStore.getState().show(`Markdown ZIP (${ids.length})…`, 3000)
                  const n = await exportNotebooksMarkdownZip(ids, (name, i, t) =>
                    useToastStore.getState().show(`${name} (${i}/${t})`, 2500),
                  )
                  useToastStore.getState().show(`${n} carnet(s) en .zip Markdown`)
                } catch (err) {
                  useToastStore.getState().show(
                    err instanceof Error ? err.message : 'Export Markdown échoué',
                    6000,
                  )
                }
              }}
            >
              Markdown ZIP
            </button>
            <button type="button" onClick={handleDeleteSelected} className="text-red-600">
              Supprimer
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 p-4 max-w-6xl mx-auto w-full">
        {filterTab === 'all' && !searchQuery.trim() && <RecentStrip refreshKey={listRefresh} />}
        {searching && <p className="text-sm text-forma-muted mb-4">Recherche…</p>}
        {globalHits.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-medium text-forma-muted mb-2">
              Résultats ({globalHits.length}) — texte, PDF, encre
            </h2>
            <ul className="space-y-1">
              {globalHits.map((h, i) => (
                <li key={i}>
                  <button
                    type="button"
                    className="text-sm text-left w-full p-2 hover:bg-white rounded border border-transparent hover:border-forma-border"
                    onClick={() =>
                      navigate(
                        h.pageId
                          ? `/document/${h.notebookId}?page=${h.pageId}`
                          : `/document/${h.notebookId}`,
                      )
                    }
                  >
                    <strong>{h.notebookName}</strong>
                    <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded bg-forma-accent/10 text-forma-accent">
                      {searchHitTypeLabel(h.type)}
                    </span>
                    <span className="block text-forma-muted truncate">{h.snippet}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="flex justify-between mb-3">
          <h2 className="text-sm font-medium text-forma-muted">
            {folderPath.length ? folderPath[folderPath.length - 1].name : 'Bibliothèque'}
            <span className="font-normal text-forma-muted/80 ml-2">
              {folders.length > 0 && `${folders.length} dossier${folders.length > 1 ? 's' : ''}`}
              {folders.length > 0 && notebooks.length > 0 && ' · '}
              {notebooks.length > 0 &&
                `${notebooks.length} document${notebooks.length > 1 ? 's' : ''}`}
            </span>
          </h2>
          <button type="button" onClick={() => setShowNewFolder(true)} className="text-xs text-forma-accent">
            + Dossier
          </button>
        </div>

        {renamingFolder && (
          <div className="mb-4 flex gap-2">
            <input
              value={renameFolderName}
              onChange={(e) => setRenameFolderName(e.target.value)}
              placeholder="Nom du dossier"
              className="border rounded px-3 py-1.5 text-sm max-w-xs"
              autoFocus
            />
            <button
              type="button"
              className="text-sm px-3 bg-forma-accent text-white rounded-lg"
              onClick={async () => {
                if (renameFolderName.trim()) {
                  await renameFolder(renamingFolder.id, renameFolderName.trim())
                  setRenamingFolder(null)
                  load()
                }
              }}
            >
              OK
            </button>
            <button type="button" className="text-sm px-2" onClick={() => setRenamingFolder(null)}>
              Annuler
            </button>
          </div>
        )}

        {showNewFolder && (
          <div className="mb-4 flex gap-2">
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Nom du dossier"
              className="border rounded px-3 py-1.5 text-sm max-w-xs"
            />
            <button
              type="button"
              className="text-sm px-3 bg-forma-accent text-white rounded-lg"
              onClick={async () => {
                if (newFolderName.trim()) {
                  await createFolder(newFolderName.trim(), currentFolderId)
                  setNewFolderName('')
                  setShowNewFolder(false)
                  load()
                }
              }}
            >
              Créer
            </button>
          </div>
        )}

        {filterTab === 'all' && folders.length > 0 && (
          <div
            ref={gridRef}
            className={`mb-6 ${viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-4 gap-3' : 'space-y-2'}`}
          >
            {folders.map((folder, fi) => (
              <div key={folder.id} className="relative group">
                <button
                  type="button"
                  onClick={() => setFolder(folder.id)}
                  className={`w-full p-4 rounded-xl border text-left hover:shadow ${
                    focusIdx === fi
                      ? 'ring-2 ring-forma-accent border-forma-accent bg-amber-50/80 dark:bg-amber-950/40'
                      : 'bg-amber-50/80 dark:bg-amber-950/30 border-forma-border'
                  }`}
                >
                  <span className="text-2xl">📁</span>
                  <span className="block font-medium mt-1">{folder.name}</span>
                  <span className="text-xs text-forma-muted">
                    {folderCounts[folder.id] ?? 0} carnet{(folderCounts[folder.id] ?? 0) !== 1 ? 's' : ''}
                  </span>
                </button>
                <div className="absolute top-2 right-2 flex gap-0.5 opacity-0 group-hover:opacity-100">
                  <button
                    type="button"
                    title="Renommer"
                    className="text-xs bg-white/90 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-forma-border"
                    onClick={(e) => {
                      e.stopPropagation()
                      setRenamingFolder(folder)
                      setRenameFolderName(folder.name)
                    }}
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    title="Dupliquer le dossier"
                    className="text-xs bg-white/90 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-forma-border"
                    onClick={async (e) => {
                      e.stopPropagation()
                      await duplicateFolder(folder.id)
                      load()
                    }}
                  >
                    ⧉
                  </button>
                  <button
                    type="button"
                    title="Supprimer le dossier"
                    className="text-xs bg-white/90 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-forma-border text-red-600"
                    onClick={async (e) => {
                      e.stopPropagation()
                      if (
                        !(await confirm(
                          `Les carnets de « ${folder.name} » iront en corbeille.`,
                          {
                            title: `Supprimer le dossier`,
                            danger: true,
                            confirmLabel: 'Supprimer',
                          },
                        ))
                      )
                        return
                      await deleteFolder(folder.id)
                      useToastStore.getState().show('Dossier supprimé')
                      load()
                    }}
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {notebooks.length === 0 ? (
          <div className="text-center py-16 text-forma-muted">
            <p className="text-4xl mb-3">📓</p>
            <p>Aucun document ici</p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              <button
                type="button"
                onClick={() => setShowNewNotebook(true)}
                className="px-4 py-2 bg-forma-accent text-white rounded-lg"
              >
                Créer un carnet
              </button>
              <button
                type="button"
                onClick={() =>
                  void openQuickNote(currentFolderId).then((id) => navigate(`/document/${id}`))
                }
                className="px-4 py-2 border border-forma-border rounded-lg"
              >
                Note rapide
              </button>
            </div>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4' : 'space-y-2'}>
            {notebooks.map((nb, ni) => {
              const itemIdx = (filterTab === 'all' ? folders.length : 0) + ni
              return (
              <div
                key={nb.id}
                className="relative group"
                data-notebook-id={nb.id}
                ref={(el) => {
                  if (el) cardRefs.current.set(nb.id, el)
                  else cardRefs.current.delete(nb.id)
                }}
              >
                <DocumentCard
                  notebook={nb}
                  viewMode={viewMode}
                  selected={selectedIds.has(nb.id)}
                  selectionMode={selectionMode}
                  focused={!selectionMode && focusIdx === itemIdx}
                  pageCount={pageCounts[nb.id]}
                  thumbUrl={thumbs[nb.id]}
                  locked={pinnedIds.has(nb.id)}
                  onClick={() => navigate(`/document/${nb.id}`)}
                  onToggleSelect={() => toggleSelection(nb.id)}
                  onRename={async (name) => {
                    await renameNotebook(nb.id, name)
                    load()
                  }}
                  onCoverColor={async (color) => {
                    await updateNotebookMetadata(nb.id, { coverColor: color })
                    load()
                  }}
                />
                {!selectionMode && (
                  <div className="absolute top-2 right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition">
                    <button
                      type="button"
                      title="Dupliquer"
                      className="text-xs bg-white/90 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-forma-border"
                      onClick={async (e) => {
                        e.stopPropagation()
                        const d = await duplicateNotebook(nb.id)
                        if (d) {
                          useToastStore.getState().show('Carnet dupliqué')
                          navigate(`/document/${d.id}`)
                        }
                      }}
                    >
                      ⧉
                    </button>
                    <button
                      type="button"
                      className="text-lg leading-none"
                      onClick={async (e) => {
                        e.stopPropagation()
                        await toggleFavorite(nb.id)
                        load()
                      }}
                    >
                      {nb.favorite ? '★' : '☆'}
                    </button>
                  </div>
                )}
              </div>
            )})}
          </div>
        )}
      </main>

      {showNewNotebook && (
        <NewNotebookModal
          onClose={() => setShowNewNotebook(false)}
          onCreate={async (kind, opts) => {
            const nb =
              kind === 'whiteboard'
                ? await createWhiteboard(opts.name, currentFolderId)
                : kind === 'formadoc'
                  ? await createFormaDoc(opts.name, currentFolderId)
                  : kind === 'formataб'
                    ? await createFormaTab(opts.name, currentFolderId)
                    : await createNotebook({ ...opts, folderId: currentFolderId })
            setShowNewNotebook(false)
            navigate(`/document/${nb.id}`)
          }}
        />
      )}

      {showMove && (
        <MoveFolderModal
          notebookIds={[...selectedIds]}
          onClose={() => setShowMove(false)}
          onDone={() => {
            clearSelection()
            load()
          }}
        />
      )}
    </div>
      {showShortcuts && <ShortcutsHelp onClose={() => setShowShortcuts(false)} />}
    </DropZone>
  )
}
