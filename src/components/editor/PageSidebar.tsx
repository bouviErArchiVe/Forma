import { useCallback, useEffect, useRef, useState } from 'react'
import { MovePageModal } from './MovePageModal'
import { PastePageModal } from './PastePageModal'
import { renderFullPage } from '../../lib/page-render'
import { sidebarThumbQueue, THUMB_PRIORITY } from '../../lib/thumb-queue'
import { TEMPLATE_LABELS } from '../../lib/templates'
import {
  copyPageToClipboard,
  hasPageClipboard,
  pastePageToNotebook,
} from '../../services/page-clipboard'
import {
  addPage,
  changePageTemplate,
  deletePage,
  duplicatePage,
  getPages,
  reorderPages,
  rotatePage,
  togglePageFavorite,
} from '../../services/pages'
import { basePageDimensions } from '../../lib/page-dimensions'
import type { Notebook, Orientation, Page, PaperTemplate } from '../../types'

const ADD_TEMPLATES: PaperTemplate[] = [
  'blank',
  'lined',
  'grid',
  'dots',
  'cornell',
  'planner',
  'music',
]

interface PageSidebarProps {
  notebookId: string
  activePageId: string
  orientation?: Orientation
  defaultTemplate: PaperTemplate
  pdfSourceDataUrl?: string
  notebook?: Notebook | null
  refreshKey?: number
  onSelectPage: (pageId: string) => void
  onPagesChange: () => void
  onPageMovedAway?: (targetNotebookId: string) => void
}

export function PageSidebar({
  notebookId,
  activePageId,
  orientation = 'portrait',
  defaultTemplate,
  pdfSourceDataUrl,
  notebook = null,
  refreshKey = 0,
  onSelectPage,
  onPagesChange,
  onPageMovedAway,
}: PageSidebarProps) {
  const [pages, setPages] = useState<Page[]>([])
  const [thumbs, setThumbs] = useState<Record<string, string>>({})
  const [dragId, setDragId] = useState<string | null>(null)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [favoritesOnly, setFavoritesOnly] = useState(
    () => localStorage.getItem('forma-pages-fav-only') === '1',
  )

  useEffect(() => {
    localStorage.setItem('forma-pages-fav-only', favoritesOnly ? '1' : '0')
  }, [favoritesOnly])
  const [movePage, setMovePage] = useState<Page | null>(null)
  const [pasteAfterOrder, setPasteAfterOrder] = useState<number | undefined>(undefined)
  const [showPasteModal, setShowPasteModal] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const thumbSize = useCallback(() => {
    const { width, height } = basePageDimensions(orientation)
    const tw = 120
    return { tw, th: Math.round((height / width) * tw) }
  }, [orientation])

  const requestThumb = useCallback(
    (page: Page, priority: number) => {
      const cached = sidebarThumbQueue.peek(page.id)
      if (cached) {
        setThumbs((prev) => (prev[page.id] === cached ? prev : { ...prev, [page.id]: cached }))
        return
      }
      const { tw, th } = thumbSize()
      void sidebarThumbQueue
        .enqueue(page.id, priority, async () => {
          const full = await renderFullPage(page, tw, th, {
            pdfSourceDataUrl,
            notebook,
          })
          return full.toDataURL('image/jpeg', 0.65)
        })
        .then((url) => {
          setThumbs((prev) => (prev[page.id] === url ? prev : { ...prev, [page.id]: url }))
        })
        .catch(() => {})
    },
    [thumbSize, pdfSourceDataUrl, notebook],
  )

  const load = useCallback(async () => {
    setPages(await getPages(notebookId))
  }, [notebookId])

  useEffect(() => {
    sidebarThumbQueue.clear()
    setThumbs({})
  }, [notebookId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const page = pages.find((p) => p.id === activePageId)
    if (page) requestThumb(page, THUMB_PRIORITY.active)
  }, [activePageId, pages, requestThumb])

  useEffect(() => {
    if (pages.length === 0) return
    const idx = pages.findIndex((p) => p.id === activePageId)
    if (idx < 0) return
    for (let d = 1; d <= 2; d++) {
      for (const i of [idx - d, idx + d]) {
        if (i >= 0 && i < pages.length) {
          requestThumb(pages[i], THUMB_PRIORITY.background)
        }
      }
    }
  }, [activePageId, pages, requestThumb])

  useEffect(() => {
    const root = scrollRef.current
    if (!root) return
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          const id = e.target.getAttribute('data-page-id')
          if (!id) continue
          const page = pages.find((p) => p.id === id)
          if (!page) continue
          requestThumb(
            page,
            id === activePageId ? THUMB_PRIORITY.active : THUMB_PRIORITY.visible,
          )
        }
      },
      { root, rootMargin: '48px', threshold: 0.05 },
    )
    for (const el of itemRefs.current.values()) obs.observe(el)
    return () => obs.disconnect()
  }, [pages, activePageId, requestThumb, favoritesOnly])

  useEffect(() => {
    if (!refreshKey) return
    sidebarThumbQueue.invalidate(activePageId)
    const page = pages.find((p) => p.id === activePageId)
    if (page) requestThumb(page, THUMB_PRIORITY.active)
  }, [refreshKey, activePageId, pages, requestThumb])

  useEffect(() => {
    itemRefs.current.get(activePageId)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [activePageId, favoritesOnly])

  const handleReorder = async (targetId: string) => {
    if (!dragId || dragId === targetId) return
    const ids = pages.map((p) => p.id)
    const from = ids.indexOf(dragId)
    const to = ids.indexOf(targetId)
    ids.splice(from, 1)
    ids.splice(to, 0, dragId)
    await reorderPages(notebookId, ids)
    setDragId(null)
    await load()
    onPagesChange()
  }

  const addWithTemplate = async (template: PaperTemplate) => {
    const p = await addPage(notebookId, template)
    setShowAddMenu(false)
    onSelectPage(p.id)
    onPagesChange()
    requestThumb(p, THUMB_PRIORITY.active)
    setPages(await getPages(notebookId))
  }

  return (
    <aside className="w-44 shrink-0 bg-forma-surface border-r border-forma-border flex flex-col overflow-hidden">
      <div className="p-2 border-b border-forma-border flex flex-col gap-1 relative">
        <div className="flex gap-1">
          <button
            type="button"
            className="flex-1 text-xs py-1.5 bg-forma-accent text-white rounded hover:bg-forma-accent-hover"
            onClick={() => setShowAddMenu(!showAddMenu)}
            title="Choisir le modèle"
          >
            + Page ▾
          </button>
          <button
            type="button"
            className="text-xs px-2 py-1.5 border border-forma-border rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Dupliquer la page active (Ctrl+Shift+D)"
            onClick={async () => {
              const dup = await duplicatePage(activePageId)
              if (dup) {
                onSelectPage(dup.id)
                onPagesChange()
                await load()
              }
            }}
          >
            ⧉
          </button>
        </div>
        {showAddMenu && (
          <div className="absolute left-2 right-2 top-full z-30 mt-1 bg-forma-surface border border-forma-border rounded-lg shadow-lg py-1 max-h-48 overflow-y-auto">
            <button
              type="button"
              className="block w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-800 font-medium text-forma-accent"
              onClick={() => addWithTemplate(defaultTemplate)}
            >
              {TEMPLATE_LABELS[defaultTemplate]} (défaut)
            </button>
            {ADD_TEMPLATES.filter((t) => t !== defaultTemplate).map((t) => (
              <button
                key={t}
                type="button"
                className="block w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => addWithTemplate(t)}
              >
                {TEMPLATE_LABELS[t]}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="px-2 pb-1 space-y-1">
        <p className="text-[10px] text-forma-muted">
          {pages.length} page(s)
          {pages.filter((p) => p.favorite).length > 0 &&
            ` · ${pages.filter((p) => p.favorite).length} ★`}
        </p>
        <label className="flex items-center gap-1.5 text-[10px] text-forma-muted cursor-pointer">
          <input
            type="checkbox"
            checked={favoritesOnly}
            onChange={(e) => setFavoritesOnly(e.target.checked)}
          />
          Pages ★ seulement
        </label>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-2">
        {pages
          .filter((p) => !favoritesOnly || p.favorite)
          .map((page) => {
            const pageNum = pages.findIndex((p) => p.id === page.id) + 1
            return (
          <div
            key={page.id}
            ref={(el) => {
              if (el) itemRefs.current.set(page.id, el)
              else itemRefs.current.delete(page.id)
            }}
            data-page-id={page.id}
            draggable
            onDragStart={() => setDragId(page.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleReorder(page.id)}
            className={`group relative rounded border-2 cursor-pointer transition ${
              activePageId === page.id
                ? 'border-forma-accent shadow-md'
                : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            onClick={() => onSelectPage(page.id)}
          >
            {thumbs[page.id] ? (
              <img src={thumbs[page.id]} alt="" className="w-full rounded-sm bg-forma-paper" />
            ) : (
              <div className="w-full aspect-[120/170] bg-forma-paper rounded-sm animate-pulse" />
            )}
            <span className="absolute bottom-1 left-1 text-[10px] bg-black/50 text-white px-1 rounded">
              {pageNum}
            </span>
            {page.favorite && (
              <span className="absolute top-1 left-1 text-[10px]" title="Page favorite">
                ★
              </span>
            )}
            <div className="absolute top-1 right-1 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100">
              <PageMenu
                page={page}
                canDelete={pages.length > 1}
                onMove={() => setMovePage(page)}
                onPasteOther={() => {
                  setPasteAfterOrder(page.order)
                  setShowPasteModal(true)
                }}
                onDone={async () => {
                  await load()
                  onPagesChange()
                }}
              />
            </div>
          </div>
            )
          })}
      </div>
      {showPasteModal && (
        <PastePageModal
          afterOrder={pasteAfterOrder}
          excludeNotebookId={notebookId}
          onClose={() => setShowPasteModal(false)}
          onPasted={(targetId, pageId) => {
            setShowPasteModal(false)
            if (targetId === notebookId) {
              onSelectPage(pageId)
              void load().then(onPagesChange)
            } else {
              onPageMovedAway?.(targetId)
            }
          }}
        />
      )}
      {movePage && (
        <MovePageModal
          page={movePage}
          onClose={() => setMovePage(null)}
          onMoved={(targetId) => {
            setMovePage(null)
            if (movePage.id === activePageId) {
              onPageMovedAway?.(targetId)
            } else {
              void load().then(onPagesChange)
            }
          }}
        />
      )}
    </aside>
  )
}

function PageMenu({
  page,
  canDelete,
  onMove,
  onPasteOther,
  onDone,
}: {
  page: Page
  canDelete: boolean
  onMove: () => void
  onPasteOther: () => void
  onDone: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        className="text-[10px] bg-forma-surface shadow px-1 rounded border border-forma-border"
        onClick={(e) => {
          e.stopPropagation()
          setOpen(!open)
        }}
      >
        ⋮
      </button>
      {open && (
        <div
          className="absolute right-0 top-full z-20 bg-forma-surface shadow-lg rounded border border-forma-border text-xs py-1 min-w-[120px]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="block w-full text-left px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={async () => {
              copyPageToClipboard(page)
              setOpen(false)
            }}
          >
            Copier page
          </button>
          {hasPageClipboard() && (
            <button
              type="button"
              className="block w-full text-left px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={async () => {
                await pastePageToNotebook(page.notebookId, page.order)
                setOpen(false)
                onDone()
              }}
            >
              Coller page après
            </button>
          )}
          {hasPageClipboard() && (
            <button
              type="button"
              className="block w-full text-left px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => {
                onPasteOther()
                setOpen(false)
              }}
            >
              Coller dans autre carnet…
            </button>
          )}
          <button
            type="button"
            className="block w-full text-left px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={async () => {
              await duplicatePage(page.id)
              setOpen(false)
              onDone()
            }}
          >
            Dupliquer
          </button>
          <button
            type="button"
            className="block w-full text-left px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => {
              onMove()
              setOpen(false)
            }}
          >
            Déplacer vers…
          </button>
          <button
            type="button"
            className="block w-full text-left px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={async () => {
              await togglePageFavorite(page.id)
              setOpen(false)
              onDone()
            }}
          >
            {page.favorite ? 'Retirer favori' : 'Page favorite'}
          </button>
          <button
            type="button"
            className="block w-full text-left px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={async () => {
              await rotatePage(page.id)
              setOpen(false)
              onDone()
            }}
          >
            Rotation 90°
          </button>
          {canDelete && (
            <button
              type="button"
              className="block w-full text-left px-2 py-1 hover:bg-red-50 dark:hover:bg-red-950 text-red-600"
              onClick={async () => {
                await deletePage(page.id)
                setOpen(false)
                onDone()
              }}
            >
              Supprimer
            </button>
          )}
          <div className="border-t border-forma-border my-1" />
          <p className="px-2 py-0.5 text-forma-muted">Modèle</p>
          {(Object.keys(TEMPLATE_LABELS) as PaperTemplate[]).map((t) => (
            <button
              key={t}
              type="button"
              className={`block w-full text-left px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                page.template === t ? 'font-medium text-forma-accent' : ''
              }`}
              onClick={async () => {
                await changePageTemplate(page.id, t)
                setOpen(false)
                onDone()
              }}
            >
              {TEMPLATE_LABELS[t]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
