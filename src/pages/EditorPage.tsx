import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { PageCanvas, type PageCanvasHandle } from '../canvas/PageCanvas'
import { addImageToPage } from '../canvas/page-ops'
import { DocumentTabs, useOpenDocument } from '../components/editor/DocumentTabs'
import { NotebookOptions } from '../components/editor/NotebookOptions'
import { PageNavigator } from '../components/editor/PageNavigator'
import { PageSidebar } from '../components/editor/PageSidebar'
import { PinGate } from '../components/editor/PinGate'
import { ScannerModal } from '../components/editor/ScannerModal'
import { ExportMenu } from '../components/editor/ExportMenu'
import { ShortcutsHelp } from '../components/editor/ShortcutsHelp'
import { PerfHud } from '../components/editor/PerfHud'
import { markPageSwitch } from '../lib/perf-monitor'
import { SidePanel, type SidePanelId } from '../components/editor/SidePanel'
import { ContinuousPageBlock } from '../components/editor/ContinuousPageBlock'
import { resolveNotebookPdfSource } from '../lib/assets'
import { computePrefetchIndices } from '../lib/continuous-viewport'
import { prefetchPdfPages } from '../lib/pdf-page-render'
import { Toolbar } from '../components/editor/Toolbar'
import { ToolbarCustomize } from '../components/editor/ToolbarCustomize'
import { useCanvasPanZoom } from '../hooks/useCanvasPanZoom'
import { usePinchZoom } from '../hooks/usePinchZoom'
import { useEditorShortcuts } from '../hooks/useEditorShortcuts'
import { useSwipePage } from '../hooks/useSwipePage'
import { onEditorCommand } from '../lib/editor-commands'
import { buildPageContextText } from '../lib/page-context'
import type { DocumentSearchHit } from '../lib/search'
import { addCard } from '../services/study'
import { computePageStats } from '../lib/page-stats'
import { pushRecent } from '../lib/recent'
import { downloadNotebookMarkdown, downloadPageMarkdown } from '../lib/notebook-markdown'
import { downloadStudyCardsCsv } from '../lib/study-export'
import { pushRecentPage } from '../lib/recent-pages'
import { hasNotebookPin } from '../services/lock'
import { getNotebook, renameNotebook } from '../services/library'
import { createPageSnapshot } from '../services/page-snapshots'
import { indexNotebookInk, indexPageInk } from '../lib/handwriting-index'
import {
  flushAllPending,
  flushPage,
  autosaveErrorButtonLabel,
  getAutosaveErrorKind,
  retryFailedSaves,
  schedulePageSave,
  subscribeAutosaveStatus,
} from '../services/autosave'
import {
  duplicatePage,
  getPage,
  getPages,
  setAllTapesRevealed,
  togglePageFavorite,
  updatePage,
} from '../services/pages'
import { createId } from '../lib/id'
import {
  getDocumentLockTabId,
  isDocumentLockedByOther,
  refreshDocumentLock,
  releaseDocumentLock,
  subscribeDocumentLock,
  tryAcquireDocumentLock,
} from '../lib/document-lock'
import { getNotebookZoom, setNotebookZoom } from '../lib/notebook-zoom'
import { popPageRecovery } from '../lib/save-recovery'
import { useEditorStore } from '../stores/editorStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useTabsStore } from '../stores/tabsStore'
import { useToastStore } from '../stores/toastStore'
import type { Notebook, Page } from '../types'
import { normalizePage } from '../types'

export function EditorPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  useOpenDocument(id)

  const [notebook, setNotebook] = useState<Notebook | null>(null)
  const [pages, setPages] = useState<Page[]>([])
  const [activePage, setActivePage] = useState<Page | null>(null)
  const [editingTitle, setEditingTitle] = useState(false)
  const [title, setTitle] = useState('')
  const defaultZoom = useSettingsStore((s) => s.defaultZoom)
  const setDefaultZoom = useSettingsStore((s) => s.setDefaultZoom)
  const [zoom, setZoom] = useState(defaultZoom)
  const [pageSyncKey, setPageSyncKey] = useState(0)
  const [exporting, setExporting] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const forceScrollPageRef = useRef(false)
  const [showToolbarCustom, setShowToolbarCustom] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [presentation, setPresentation] = useState(false)
  const [presenterLaser, setPresenterLaser] = useState(true)
  const [searchHit, setSearchHit] = useState<DocumentSearchHit | null>(null)
  const [sideOpenPanel, setSideOpenPanel] = useState<SidePanelId>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem('forma-sidebar-collapsed') === '1',
  )
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')
  const [locked, setLocked] = useState<boolean | null>(null)
  const [unlocked, setUnlocked] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const canvasRef = useRef<PageCanvasHandle>(null)
  const [ocrAppend, setOcrAppend] = useState('')
  const [thumbRefresh, setThumbRefresh] = useState(0)
  const [studySnippet, setStudySnippet] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const pageBlockRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const snapshotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lockTabIdRef = useRef(getDocumentLockTabId())
  const [docLockBlocked, setDocLockBlocked] = useState(false)
  const pageViewMode = useSettingsStore((s) => s.pageViewMode)
  const readMode = useEditorStore((s) => s.readMode)
  const autoSnapshot = useSettingsStore((s) => s.autoSnapshot)
  const showRuler = useSettingsStore((s) => s.showRuler)
  const showPerfHud = useSettingsStore((s) => s.showPerfHud)
  const setShowRuler = useSettingsStore((s) => s.setShowRuler)
  const continuous = pageViewMode === 'continuous' && !presentation
  const { pan, cursor } = useCanvasPanZoom(scrollRef, !continuous)
  usePinchZoom(scrollRef, (d) => setZoom((z) => Math.min(1.6, Math.max(0.35, z + d))))

  const pageIndex = activePage ? pages.findIndex((p) => p.id === activePage.id) : 0

  const pageStatsLine = useMemo(() => {
    if (!activePage) return undefined
    const s = computePageStats(activePage)
    return `${s.strokes} traits · ${s.words} mots`
  }, [activePage])

  useEffect(() => {
    if (!notebook || !activePage || pageIndex < 0) return
    pushRecentPage({
      notebookId: notebook.id,
      pageId: activePage.id,
      notebookName: notebook.name,
      pageIndex: pageIndex + 1,
    })
  }, [notebook?.id, notebook?.name, activePage?.id, pageIndex])

  useEffect(() => {
    if (!activePage) return
    const t0 = performance.now()
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => markPageSwitch(performance.now() - t0))
    })
    return () => cancelAnimationFrame(id)
  }, [activePage?.id])

  const load = useCallback(
    async (keepPageId?: string) => {
      if (!id) return
      const nb = await getNotebook(id)
      if (!nb || nb.deletedAt) {
        navigate('/')
        return
      }
      let activeNb = nb
      if (nb.type === 'pdf') {
        const { migrateNotebookPdfSource } = await import('../lib/assets')
        await migrateNotebookPdfSource(nb.id)
        activeNb = (await getNotebook(id)) ?? nb
      }
      setNotebook(activeNb)
      setTitle(activeNb.name)
      pushRecent(id)
      const p = await getPages(id)
      setPages(p)
      const targetId =
        keepPageId && p.find((x) => x.id === keepPageId) ? keepPageId : p[0]?.id
      if (targetId) {
        let fresh = await getPage(targetId)
        const recovered = popPageRecovery(targetId)
        if (
          fresh &&
          recovered &&
          recovered.strokes.length > fresh.strokes.length
        ) {
          await updatePage(recovered)
          fresh = recovered
          useToastStore.getState().show('Brouillon récupéré après interruption', 5000)
        }
        if (fresh) setActivePage(fresh)
      }
      const pin = await hasNotebookPin(id)
      setLocked(pin)
      if (!pin) setUnlocked(true)
      setPageSyncKey((k) => k + 1)
    },
    [id, navigate],
  )

  const defaultPenWidth = useSettingsStore((s) => s.defaultPenWidth)

  useEffect(() => {
    useEditorStore.setState({ penWidth: defaultPenWidth })
  }, [defaultPenWidth])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    return subscribeAutosaveStatus((s) => {
      if (s === 'saving') setSaveStatus('saving')
      else if (s === 'saved') setSaveStatus('saved')
      else if (s === 'error') setSaveStatus('error')
    })
  }, [])

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') void flushAllPending()
    }
    const onUnload = () => {
      void flushAllPending()
    }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', onUnload)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', onUnload)
      void flushAllPending()
    }
  }, [id])

  useEffect(() => {
    if (!id) return
    setZoom(getNotebookZoom(id, defaultZoom))
  }, [id, defaultZoom])

  useEffect(() => {
    if (!id) return
    const tabId = lockTabIdRef.current
    const applyLockState = (blocked: boolean) => {
      setDocLockBlocked(blocked)
      if (blocked) useEditorStore.setState({ readMode: true })
    }
    applyLockState(!tryAcquireDocumentLock(id, tabId))
    const unsubStorage = subscribeDocumentLock(id, tabId, applyLockState)
    const interval = window.setInterval(() => {
      refreshDocumentLock(id, tabId)
      applyLockState(isDocumentLockedByOther(id, tabId))
    }, 5000)
    return () => {
      window.clearInterval(interval)
      unsubStorage()
      releaseDocumentLock(id, tabId)
    }
  }, [id])

  useEffect(() => {
    if (!id) return
    const t = window.setTimeout(() => setNotebookZoom(id, zoom), 400)
    return () => clearTimeout(t)
  }, [id, zoom])

  useEffect(() => {
    if (!continuous || !scrollRef.current) return
    const root = scrollRef.current
    const obs = new IntersectionObserver(
      (entries) => {
        let best: { id: string; ratio: number } | null = null
        for (const e of entries) {
          if (!e.isIntersecting) continue
          const id = (e.target as HTMLElement).dataset.pageId
          if (!id) continue
          if (!best || e.intersectionRatio > best.ratio) {
            best = { id, ratio: e.intersectionRatio }
          }
        }
        if (best && best.id !== activePage?.id) {
          const found = pages.find((p) => p.id === best!.id)
          if (found) void getPage(found.id).then((p) => p && setActivePage(p))
        }
      },
      { root, threshold: [0.35, 0.55, 0.75] },
    )
    for (const el of pageBlockRefs.current.values()) obs.observe(el)
    return () => obs.disconnect()
  }, [continuous, pages, activePage?.id])

  useEffect(() => {
    if (!continuous || !notebook || notebook.type !== 'pdf' || pages.length === 0) return
    const pdfIndices = computePrefetchIndices(pageIndex, pages.length, 2).map(
      (i) => pages[i]?.pdfPageIndex ?? i,
    )
    void resolveNotebookPdfSource(notebook).then((src) => {
      if (src) {
        const centerPdf = pages[pageIndex]?.pdfPageIndex ?? pageIndex
        prefetchPdfPages(src, pdfIndices, notebook.id, undefined, centerPdf)
      }
    })
  }, [continuous, notebook, pageIndex, pages])

  useEffect(() => {
    const pageId = searchParams.get('page')
    if (!pageId || !id) return
    getPage(pageId).then((p) => {
      if (p && p.notebookId === id) setActivePage(p)
    })
  }, [searchParams, id])

  const goPage = async (delta: number) => {
    if (activePage) await flushPage(activePage.id)
    const idx = pageIndex + delta
    if (idx < 0 || idx >= pages.length) return
    const p = await getPage(pages[idx].id)
    if (p) {
      forceScrollPageRef.current = true
      setActivePage(p)
    }
  }

  useSwipePage(
    scrollRef,
    !continuous && !presentation && !focusMode,
    () => void goPage(-1),
    () => void goPage(1),
  )

  useEffect(() => {
    if (!continuous || !activePage || !forceScrollPageRef.current) return
    forceScrollPageRef.current = false
    requestAnimationFrame(() => {
      pageBlockRefs.current.get(activePage.id)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
  }, [activePage?.id, continuous])

  useEditorShortcuts({
    onPrevPage: () => goPage(-1),
    onNextPage: () => goPage(1),
    onPrint: () => window.print(),
    onShowHelp: () => setShowShortcuts(true),
    onDuplicatePage: async () => {
      if (!activePage) return
      const dup = await duplicatePage(activePage.id)
      if (dup) {
        await load(dup.id)
        setThumbRefresh((v) => v + 1)
      }
    },
    onSaveSnapshot: async () => {
      if (!activePage) return
      await createPageSnapshot(activePage)
    },
    onFind: () => setSideOpenPanel('search'),
    onFirstPage: () => {
      if (pages[0]) void getPage(pages[0].id).then((p) => p && setActivePage(p))
    },
    onLastPage: () => {
      const last = pages[pages.length - 1]
      if (last) void getPage(last.id).then((p) => p && setActivePage(p))
    },
    onFocusMode: () => setFocusMode((v) => !v),
  })

  const scheduleAutoSnapshot = useCallback(
    (page: Page) => {
      if (!autoSnapshot) return
      if (snapshotTimerRef.current) clearTimeout(snapshotTimerRef.current)
      snapshotTimerRef.current = setTimeout(() => {
        void createPageSnapshot(page, 'Auto')
      }, 90_000)
    },
    [autoSnapshot],
  )

  const handlePageChange = useCallback(
    (page: Page) => {
      setPages((prev) => prev.map((p) => (p.id === page.id ? page : p)))
      if (activePage?.id === page.id) setActivePage(page)
      schedulePageSave(page)
      setThumbRefresh((v) => v + 1)
      scheduleAutoSnapshot(page)
      if (page.strokes.length >= 8 && !page.inkText?.trim()) {
        void indexPageInk(page).then((text) => {
          if (text.trim()) {
            const patched = { ...page, inkText: text }
            setPages((prev) =>
              prev.map((p) => (p.id === page.id ? { ...p, inkText: text } : p)),
            )
            schedulePageSave(patched)
          }
        })
      }
    },
    [activePage?.id, scheduleAutoSnapshot],
  )

  const restoreStickyTool = useEditorStore((s) => s.restoreStickyTool)

  const handleInsertImage = async (dataUrl: string) => {
    if (!activePage) return
    // Detect real image dimensions for proper placement
    const dims = await new Promise<{ width: number; height: number }>((resolve) => {
      const img = new Image()
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
      img.onerror = () => resolve({ width: 240, height: 180 })
      img.src = dataUrl
    })
    const next = addImageToPage(normalizePage(activePage), dataUrl, 397, 561, dims)
    handlePageChange(next)
    restoreStickyTool()
  }

  const handleAddStudy = async (front: string, back?: string) => {
    if (!notebook || !front.trim()) return
    await addCard(notebook.id, front.trim(), (back ?? front).trim())
    setStudySnippet(front.trim())
  }

  const handleOcrText = async (text: string) => {
    if (!activePage || !text.trim()) return
    setOcrAppend(text)
    const block = {
      id: createId(),
      x: 48,
      y: 48,
      width: 400,
      height: 200,
      content: text,
      fontSize: 14,
      color: '#1a1a1a',
      align: 'left' as const,
      pageId: activePage.id,
    }
    handlePageChange({
      ...normalizePage(activePage),
      texts: [...activePage.texts, block],
    })
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen()
    else document.exitFullscreen()
  }

  const enterPresentation = () => {
    setPresentation(true)
    setZoom(1)
    void containerRef.current?.requestFullscreen?.().catch(() => {})
  }

  const exitPresentation = () => {
    setPresentation(false)
    if (document.fullscreenElement) void document.exitFullscreen()
  }

  useEffect(() => {
    if (!presentation) return
    const onKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        exitPresentation()
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goPage(-1)
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        goPage(1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [presentation, pageIndex, pages.length])

  useEffect(() => {
    return onEditorCommand((cmd) => {
      switch (cmd) {
        case 'search':
          setSideOpenPanel('search')
          break
        case 'outline':
          setSideOpenPanel('outline')
          break
        case 'history':
          setSideOpenPanel('history')
          break
        case 'presentation':
          if (presentation) exitPresentation()
          else enterPresentation()
          break
        case 'toggle-continuous':
          useSettingsStore
            .getState()
            .setPageViewMode(
              useSettingsStore.getState().pageViewMode === 'continuous' ? 'single' : 'continuous',
            )
          break
        case 'shortcuts':
          setShowShortcuts(true)
          break
        case 'scanner':
          setShowScanner(true)
          break
        case 'prev-page':
          void goPage(-1)
          break
        case 'next-page':
          void goPage(1)
          break
        case 'toggle-sidebar':
          setSidebarCollapsed((v) => {
            const next = !v
            localStorage.setItem('forma-sidebar-collapsed', next ? '1' : '0')
            return next
          })
          break
        case 'focus-mode':
          setFocusMode((v) => !v)
          break
        case 'index-ink':
          if (activePage) {
            void indexPageInk(activePage).then((text) => {
              useToastStore.getState().show(
                text.trim() ? 'Encre indexée pour la recherche' : "Pas assez d'encre à indexer",
              )
            })
          }
          break
        case 'index-notebook':
          if (notebook) {
            useToastStore.getState().show('Indexation du carnet…', 3000)
            void indexNotebookInk(notebook.id, (d, t) =>
              useToastStore.getState().show(`Indexation ${d}/${t}`, 1500),
            ).then((n) => useToastStore.getState().show(`${n} page(s) indexée(s)`))
          }
          break
        case 'duplicate-page':
          if (activePage) {
            void duplicatePage(activePage.id).then(async (dup) => {
              if (!dup) return
              await load(dup.id)
              useToastStore.getState().show('Page dupliquée')
            })
          }
          break
        case 'print':
          window.print()
          break
        case 'panel-ai':
          setSideOpenPanel('ai')
          break
        case 'panel-study':
          setSideOpenPanel('study')
          break
        case 'panel-ocr':
          setSideOpenPanel('ocr')
          break
        case 'panel-share':
          setSideOpenPanel('share')
          break
        case 'panel-audio':
          setSideOpenPanel('audio')
          break
        case 'export-markdown-page':
          if (activePage && notebook) {
            downloadPageMarkdown(activePage, notebook.name, pageIndex + 1)
            useToastStore.getState().show('Markdown téléchargé')
          }
          break
        case 'export-markdown-notebook':
          if (notebook) {
            void getPages(notebook.id).then((p) => {
              downloadNotebookMarkdown(notebook, p)
              useToastStore.getState().show('Markdown carnet téléchargé')
            })
          }
          break
        case 'close-other-tabs':
          if (notebook) {
            useTabsStore.getState().closeOtherTabs(notebook.id)
          }
          break
        case 'export-study-csv':
          if (notebook) {
            void downloadStudyCardsCsv(notebook.id, notebook.name)
              .then((n) => useToastStore.getState().show(`${n} carte(s) exportée(s) (CSV)`))
              .catch((err) =>
                useToastStore.getState().show(
                  err instanceof Error ? err.message : 'Export Study échoué',
                  5000,
                ),
              )
          }
          break
        case 'toggle-read-mode':
          useEditorStore.getState().toggleReadMode()
          break
        case 'toggle-page-favorite':
          if (activePage) {
            void togglePageFavorite(activePage.id).then(async () => {
              const fresh = await getPage(activePage.id)
              if (fresh) {
                setActivePage(fresh)
                setPages((prev) => prev.map((p) => (p.id === fresh.id ? fresh : p)))
                setThumbRefresh((v) => v + 1)
              }
              useToastStore.getState().show(fresh?.favorite ? 'Page en favori ★' : 'Favori retiré')
            })
          }
          break
        case 'toggle-fullscreen':
          toggleFullscreen()
          break
      }
    })
  }, [presentation, activePage, notebook, load, pageIndex])

  const pageText = activePage ? buildPageContextText(activePage, ocrAppend) : ''

  if (locked === null || !notebook) {
    return (
      <div className="flex items-center justify-center h-full text-forma-muted">
        Chargement…
      </div>
    )
  }

  if (locked && !unlocked) {
    return <PinGate notebookId={notebook.id} onUnlock={() => setUnlocked(true)} />
  }

  if (!activePage) {
    return (
      <div className="flex items-center justify-center h-full text-forma-muted">
        Aucune page
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`h-full flex flex-col print:bg-white ${presentation ? 'bg-gray-950' : 'bg-forma-bg'}`}
    >
      {!presentation && !focusMode && <DocumentTabs />}
      {docLockBlocked && !presentation && (
        <div
          data-testid="document-lock-banner"
          className="shrink-0 text-center text-xs py-1.5 bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-100 border-b border-amber-300/60"
          role="status"
        >
          Ce carnet est ouvert dans un autre onglet — édition désactivée (lecture seule)
        </div>
      )}
      {!presentation && !focusMode && (
        <header className="flex items-center gap-2 px-4 py-2 bg-forma-surface border-b border-forma-border shrink-0 flex-wrap print-hide">
          <Link to="/" className="text-sm text-forma-muted hover:text-forma-accent shrink-0">
            ← Bibliothèque
          </Link>
          {editingTitle ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={async () => {
                setEditingTitle(false)
                if (title.trim() && title !== notebook.name) {
                  await renameNotebook(notebook.id, title.trim())
                  setNotebook({ ...notebook, name: title.trim() })
                }
              }}
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
              className="forma-input font-semibold max-w-[200px]"
              autoFocus
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingTitle(true)}
              className="font-semibold truncate max-w-[160px]"
            >
              {notebook.name}
            </button>
          )}
          {locked && (
            <span className="text-xs text-amber-600 dark:text-amber-400" title="Carnet verrouillé par code">
              🔒
            </span>
          )}
          {activePage.favorite && (
            <span className="text-xs text-amber-400" title="Page favorite">
              ★
            </span>
          )}
          {readMode && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-medium">
              📖 Lecture
            </span>
          )}
          <button
            type="button"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-xs text-forma-muted hover:text-forma-accent hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            onClick={() => setShowOptions(true)}
            title="Options du carnet"
          >
            ⚙
          </button>
          <div className="flex-1" />
          {saveStatus === 'error' ? (
            <button
              type="button"
              className="text-xs text-red-600 hover:text-red-700 hidden sm:inline font-medium"
              onClick={() => {
                void retryFailedSaves().then((ok) => {
                  if (ok) useToastStore.getState().show('Enregistrement réussi')
                  else {
                    const kind = getAutosaveErrorKind()
                    useToastStore.getState().show(
                      kind === 'quota'
                        ? "Espace toujours insuffisant — libérez de l'espace dans Paramètres"
                        : 'Échec — réessayez',
                      6000,
                    )
                  }
                })
              }}
            >
              {autosaveErrorButtonLabel(getAutosaveErrorKind())}
            </button>
          ) : (
            <span className={`text-xs hidden sm:inline transition-colors ${saveStatus === 'saving' ? 'text-forma-accent' : 'text-forma-muted'}`}>
              {saveStatus === 'saving' ? '● Enregistrement…' : '✓ Enregistré'}
            </span>
          )}
          <PageNavigator
            index={pageIndex}
            total={pages.length}
            onPrev={() => goPage(-1)}
            onNext={() => goPage(1)}
            onGoTo={(idx) => void goPage(idx - pageIndex)}
            statsLine={pageStatsLine}
            pageFavorites={pages.map((p) => !!p.favorite)}
          />
          <button
            type="button"
            onClick={() => {
              const next = Math.max(0.35, zoom - 0.1)
              setZoom(next)
              setDefaultZoom(next)
            }}
            className="w-8 h-8 rounded hover:bg-gray-100"
          >
            −
          </button>
          <span className="text-xs w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            onClick={() => {
              const next = Math.min(1.6, zoom + 0.1)
              setZoom(next)
              setDefaultZoom(next)
            }}
            className="w-8 h-8 rounded hover:bg-gray-100"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setShowRuler(!showRuler)}
            className={`text-sm px-2 py-1 border rounded-lg ${showRuler ? 'bg-forma-accent/10 border-forma-accent' : ''}`}
            title="Règle mm"
          >
            📐
          </button>
          <button
            type="button"
            onClick={() =>
              useSettingsStore
                .getState()
                .setPageViewMode(continuous ? 'single' : 'continuous')
            }
            className={`text-sm px-2 py-1 border rounded-lg ${
              continuous ? 'bg-forma-accent/10 border-forma-accent' : ''
            }`}
            title={continuous ? 'Vue page unique' : 'Défilement continu'}
          >
            {continuous ? '▥' : '▤'}
          </button>
          <button
            type="button"
            onClick={enterPresentation}
            className="text-sm px-2 py-1 border rounded-lg"
            title="Présentation"
          >
            ▶
          </button>
          <button type="button" onClick={toggleFullscreen} className="text-sm px-2 py-1 border rounded-lg">
            ⛶
          </button>
          <button
            type="button"
            onClick={() => setFocusMode(true)}
            className="text-sm px-2 py-1 border rounded-lg"
            title="Mode focus (`)"
          >
            ◻
          </button>
          <button type="button" onClick={() => setShowShortcuts(true)} className="text-sm px-2 py-1 border rounded-lg" title="Aide ?">
            ?
          </button>
          <ExportMenu
            notebook={notebook}
            activePage={activePage}
            pageIndex={pageIndex}
            pageCount={pages.length}
            onExporting={setExporting}
            onAppendPdf={async (n) => {
              await load(activePage.id)
              setThumbRefresh((v) => v + 1)
              useToastStore.getState().show(`${n} page(s) PDF ajoutée(s)`)
            }}
            onImportJson={async (merged) => {
              handlePageChange(merged)
              canvasRef.current?.reload(merged)
            }}
          />
          {exporting && (
            <span className="text-xs text-forma-muted animate-pulse">Export…</span>
          )}
        </header>
      )}

      {presentation && (
        <div className="absolute top-3 right-3 z-20 flex gap-2 print-hide">
          <button
            type="button"
            onClick={() => setPresenterLaser((v) => !v)}
            className={`px-3 py-1 rounded-lg text-sm ${
              presenterLaser ? 'bg-red-500/80 text-white' : 'bg-white/10 text-white'
            }`}
            title="Pointeur laser"
          >
            🔴
          </button>
          <button
            type="button"
            onClick={() => goPage(-1)}
            className="px-3 py-1 bg-white/10 text-white rounded-lg text-sm"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => goPage(1)}
            className="px-3 py-1 bg-white/10 text-white rounded-lg text-sm"
          >
            ›
          </button>
          <button
            type="button"
            onClick={exitPresentation}
            className="px-3 py-1 bg-white/20 text-white rounded-lg text-sm"
          >
            Quitter
          </button>
        </div>
      )}

      {focusMode && (
        <div className="print-hide absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-black/60 text-white rounded-full px-4 py-2 text-sm shadow-lg">
          <PageNavigator
            index={pageIndex}
            total={pages.length}
            onPrev={() => goPage(-1)}
            onNext={() => goPage(1)}
            onGoTo={(idx) => void goPage(idx - pageIndex)}
            statsLine={pageStatsLine}
            pageFavorites={pages.map((p) => !!p.favorite)}
          />
          <button type="button" className="px-2 py-0.5 rounded bg-white/20" onClick={() => setFocusMode(false)}>
            Quitter (`)
          </button>
        </div>
      )}
      {!presentation && !focusMode && (
        <div className="print-hide overflow-x-auto shrink-0 border-b border-forma-border">
        <Toolbar
          readOnlyLocked={docLockBlocked}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={() => canvasRef.current?.undo()}
          onRedo={() => canvasRef.current?.redo()}
          onInsertImage={handleInsertImage}
          onScanner={() => setShowScanner(true)}
          onElements={() => canvasRef.current?.openStickerPicker()}
          onCustomize={() => setShowToolbarCustom(true)}
          onRevealAllTapes={
            notebook
              ? async () => {
                  await setAllTapesRevealed(notebook.id, true)
                  await load(activePage.id)
                }
              : undefined
          }
          onHideAllTapes={
            notebook
              ? async () => {
                  await setAllTapesRevealed(notebook.id, false)
                  await load(activePage.id)
                }
              : undefined
          }
        />
        </div>
      )}

      <div className="flex flex-1 min-h-0 print:block relative">
        {!presentation && !focusMode && !sidebarCollapsed && (
          <div className="print-hide">
            <PageSidebar
              notebookId={notebook.id}
              activePageId={activePage.id}
              orientation={notebook.orientation}
              defaultTemplate={notebook.paperTemplate}
              pdfSourceDataUrl={notebook.pdfSourceDataUrl}
              notebook={notebook}
              refreshKey={thumbRefresh}
              onSelectPage={async (pageId) => {
                const p = await getPage(pageId)
                if (p) setActivePage(p)
              }}
              onPagesChange={() => load(activePage.id)}
              onPageMovedAway={(targetId) => navigate(`/document/${targetId}`)}
            />
          </div>
        )}
        {!presentation && !focusMode && (
          <button
            type="button"
            className="print-hide absolute left-0 top-1/2 -translate-y-1/2 z-10 w-5 h-12 bg-forma-surface border border-forma-border rounded-r text-xs text-forma-muted hover:text-forma-text"
            title={sidebarCollapsed ? 'Afficher les pages' : 'Masquer les pages'}
            onClick={() => {
              setSidebarCollapsed((v) => {
                const next = !v
                localStorage.setItem('forma-sidebar-collapsed', next ? '1' : '0')
                return next
              })
            }}
          >
            {sidebarCollapsed ? '›' : '‹'}
          </button>
        )}
        <div
          ref={scrollRef}
          className={`flex-1 overflow-auto flex justify-center ${
            presentation ? 'items-center p-0 bg-gray-950' : 'items-start p-6'
          }`}
          style={{ cursor: presentation ? 'default' : cursor }}
        >
          {continuous ? (
            <div className="flex flex-col items-center gap-10 py-4 w-full max-w-4xl mx-auto">
              {pages.map((p, idx) => (
                <ContinuousPageBlock
                  key={p.id}
                  page={p}
                  pageIndex={idx}
                  pageCount={pages.length}
                  notebook={notebook}
                  zoom={zoom}
                  isActive={p.id === activePage.id}
                  canvasRef={p.id === activePage.id ? canvasRef : undefined}
                  scrollRoot={scrollRef.current}
                  onPageChange={handlePageChange}
                  onActivate={() => void getPage(p.id).then((fp) => fp && setActivePage(fp))}
                  onUndoRedoChange={(u, r) => {
                    setCanUndo(u)
                    setCanRedo(r)
                  }}
                  onWheelZoom={(d) => setZoom((z) => Math.min(1.6, Math.max(0.35, z + d)))}
                  onOcrSelection={handleOcrText}
                  onAddToStudy={(t) => {
                    setStudySnippet(t)
                    void handleAddStudy(t.slice(0, 120), t)
                  }}
                  onPdfNavigate={async (pageIdx) => {
                    const target = pages[pageIdx]
                    if (target) {
                      const fresh = await getPage(target.id)
                      if (fresh) setActivePage(fresh)
                    }
                  }}
                  pageSyncKey={p.id === activePage.id ? pageSyncKey : 0}
                  searchHit={searchHit}
                  registerBlockRef={(el) => {
                    if (el) pageBlockRefs.current.set(p.id, el)
                    else pageBlockRefs.current.delete(p.id)
                  }}
                />
              ))}
            </div>
          ) : (
            <div style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}>
              <PageCanvas
                ref={canvasRef}
                key={activePage.id}
                page={activePage}
                orientation={notebook.orientation}
                scale={zoom}
                pdfSourceDataUrl={notebook.pdfSourceDataUrl}
                notebook={notebook}
                onPageChange={handlePageChange}
                onUndoRedoChange={(u, r) => {
                  setCanUndo(u)
                  setCanRedo(r)
                }}
                onWheelZoom={(d) => setZoom((z) => Math.min(1.6, Math.max(0.35, z + d)))}
                onOcrSelection={handleOcrText}
                onAddToStudy={(t) => {
                  setStudySnippet(t)
                  void handleAddStudy(t.slice(0, 120), t)
                }}
                onPdfNavigate={async (idx) => {
                  const p = pages[idx]
                  if (p) {
                    const fresh = await getPage(p.id)
                    if (fresh) setActivePage(fresh)
                  }
                }}
                laserPointer={presentation && presenterLaser}
                pageSyncKey={pageSyncKey}
                searchHighlightTextId={
                  searchHit?.pageId === activePage.id ? searchHit.textId : undefined
                }
                searchHighlightSource={
                  searchHit?.pageId === activePage.id ? searchHit.source : undefined
                }
              />
            </div>
          )}
        </div>
        {!presentation && !focusMode && (
          <div className="print-hide">
            <SidePanel
              notebookId={notebook.id}
              page={activePage}
              pageIndex={pageIndex + 1}
              pageText={pageText}
              studySnippet={studySnippet}
              onOcrText={handleOcrText}
              onAddStudy={handleAddStudy}
              onSelectPage={async (pageId) => {
                const p = await getPage(pageId)
                if (p) {
                  forceScrollPageRef.current = true
                  setActivePage(p)
                }
              }}
              onPageRestored={(p) => {
                setActivePage(p)
                canvasRef.current?.reload(p)
                setThumbRefresh((n) => n + 1)
                setPageSyncKey((k) => k + 1)
              }}
              onSearchHighlight={(hit) => {
                setSearchHit(hit)
                if (hit) {
                  forceScrollPageRef.current = true
                  if (hit.pageId !== activePage.id) {
                    void getPage(hit.pageId).then((p) => p && setActivePage(p))
                  }
                }
              }}
              openPanel={sideOpenPanel}
            />
          </div>
        )}
      </div>

      {showToolbarCustom && <ToolbarCustomize onClose={() => setShowToolbarCustom(false)} />}
      {showScanner && <ScannerModal onCapture={handleInsertImage} onClose={() => setShowScanner(false)} />}
      {showShortcuts && <ShortcutsHelp onClose={() => setShowShortcuts(false)} />}
      {showOptions && (
        <NotebookOptions
          notebook={notebook}
          onClose={() => setShowOptions(false)}
          onUpdated={(nb) => setNotebook(nb)}
        />
      )}
      {showPerfHud && <PerfHud />}
    </div>
  )
}
