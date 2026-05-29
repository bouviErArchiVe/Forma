import { useEffect, useRef, useState } from 'react'
import { PageCanvas, type PageCanvasHandle } from '../../canvas/PageCanvas'
import { usePageCanvasMount } from '../../canvas/page-canvas-pool'
import { PagePlaceholder } from '../../canvas/PagePlaceholder'
import { resolveNotebookPdfSource } from '../../lib/assets'
import {
  CONTINUOUS_UNMOUNT_MS,
  continuousRootMargin,
} from '../../lib/continuous-viewport'
import { defaultPdfDpr, renderPdfPageDataUrl } from '../../lib/pdf-page-render'
import type { DocumentSearchHit } from '../../lib/search'
import type { Notebook, Page } from '../../types'

interface ContinuousPageBlockProps {
  page: Page
  pageIndex: number
  notebook: Notebook
  zoom: number
  isActive: boolean
  pageCount: number
  canvasRef?: React.Ref<PageCanvasHandle>
  onPageChange: (page: Page) => void
  onActivate: () => void
  onUndoRedoChange?: (canUndo: boolean, canRedo: boolean) => void
  onWheelZoom: (delta: number) => void
  onOcrSelection: (text: string) => void
  onAddToStudy: (text: string) => void
  onPdfNavigate: (pageIdx: number) => void
  pageSyncKey: number
  searchHit: DocumentSearchHit | null
  scrollRoot: HTMLElement | null
  registerBlockRef?: (el: HTMLDivElement | null) => void
}

/** Monte le canvas près du viewport ; démontage différé hors écran (Phase 2). */
export function ContinuousPageBlock({
  page,
  pageIndex,
  notebook,
  zoom,
  isActive,
  pageCount,
  canvasRef,
  onPageChange,
  onActivate,
  onUndoRedoChange,
  onWheelZoom,
  onOcrSelection,
  onAddToStudy,
  onPdfNavigate,
  pageSyncKey,
  searchHit,
  scrollRoot,
  registerBlockRef,
}: ContinuousPageBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const unmountTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [mounted, setMounted] = useState(isActive)
  const [intersecting, setIntersecting] = useState(isActive)
  const poolGranted = usePageCanvasMount(page.id, pageIndex, isActive, intersecting, pageCount)
  const showCanvas = mounted && (isActive || poolGranted)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const root = scrollRoot ?? null
    const margin = continuousRootMargin(pageCount)
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.target !== el) continue
          if (e.isIntersecting) {
            if (unmountTimer.current) {
              clearTimeout(unmountTimer.current)
              unmountTimer.current = null
            }
            setIntersecting(true)
            setMounted(true)
          } else {
            setIntersecting(false)
            if (!isActive) {
              if (unmountTimer.current) clearTimeout(unmountTimer.current)
              unmountTimer.current = setTimeout(() => {
                setMounted(false)
                unmountTimer.current = null
              }, CONTINUOUS_UNMOUNT_MS)
            }
          }
        }
      },
      { root, rootMargin: margin, threshold: 0.01 },
    )
    obs.observe(el)
    return () => {
      obs.disconnect()
      if (unmountTimer.current) clearTimeout(unmountTimer.current)
    }
  }, [scrollRoot, page.id, isActive, pageCount])

  useEffect(() => {
    if (isActive) {
      if (unmountTimer.current) {
        clearTimeout(unmountTimer.current)
        unmountTimer.current = null
      }
      setIntersecting(true)
      setMounted(true)
    }
  }, [isActive])

  useEffect(() => {
    if (!mounted || page.pdfPageIndex == null) return
    void (async () => {
      const src = await resolveNotebookPdfSource(notebook)
      if (src == null) return
      const dpr = defaultPdfDpr(false)
      void renderPdfPageDataUrl(src, page.pdfPageIndex!, dpr, notebook.id).catch(() => {})
    })()
  }, [mounted, page.pdfPageIndex, notebook.id, notebook.pdfSourceAssetId, notebook.pdfSourceDataUrl])

  return (
    <div
      ref={(el) => {
        containerRef.current = el
        registerBlockRef?.(el)
      }}
      data-page-id={page.id}
      className={`relative ${isActive ? 'ring-2 ring-forma-accent/50 rounded-sm' : 'opacity-95'}`}
      onClick={onActivate}
    >
      <span className="absolute -top-5 left-0 text-xs text-forma-muted print-hide">
        Page {pageIndex + 1}
      </span>
      {showCanvas ? (
        <PageCanvas
          ref={isActive ? canvasRef : undefined}
          page={page}
          orientation={notebook.orientation}
          scale={zoom}
          pdfSourceDataUrl={notebook.pdfSourceDataUrl}
          notebook={notebook}
          interactive={isActive}
          onPageChange={onPageChange}
          onUndoRedoChange={isActive ? onUndoRedoChange : undefined}
          onWheelZoom={onWheelZoom}
          onOcrSelection={onOcrSelection}
          onAddToStudy={onAddToStudy}
          onPdfNavigate={onPdfNavigate}
          pageSyncKey={isActive ? pageSyncKey : 0}
          searchHighlightTextId={searchHit?.pageId === page.id ? searchHit.textId : undefined}
          searchHighlightSource={
            searchHit?.pageId === page.id ? searchHit.source : undefined
          }
        />
      ) : (
        <PagePlaceholder orientation={notebook.orientation} zoom={zoom} />
      )}
    </div>
  )
}
