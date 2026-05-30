import { useCallback, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import type { FormaReviewSession, FormaReviewTool } from '../types'
import {
  addCommentToSession,
  deleteCommentFromSession,
  editCommentInSession,
  resolveCommentInSession,
  resolvePinInSession,
} from '../lib/formareview/comments'
import { DEFAULT_MARKUP, MARKUP_COLORS } from '../lib/formareview/constants'
import { createMarkup, createPin, getMarkupsForPage, getPinsForPage } from '../lib/formareview/model'

interface DraftState {
  type: string
  start: { x: number; y: number }
  end?: { x: number; y: number }
  points?: { x: number; y: number }[]
}

export function useReviewEditor(
  session: FormaReviewSession | null,
  setSession: Dispatch<SetStateAction<FormaReviewSession | null>>,
) {
  const [tool, setTool] = useState<FormaReviewTool>('draw')
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null)
  const [color, setColor] = useState(MARKUP_COLORS[0]!)
  const draftRef = useRef<DraftState | null>(null)

  const settings = session?.settings

  const addPin = useCallback(
    (pageId: string, x: number, y: number) => {
      if (!session) return null
      const pin = createPin({
        pageId,
        x,
        y,
        authorId: settings?.authorId || 'local',
        authorName: settings?.authorName || 'Anonyme',
        role: settings?.authorRole || 'prof',
      })
      setSession((prev) =>
        prev
          ? { ...prev, pins: [...prev.pins, pin], updatedAt: Date.now() }
          : prev,
      )
      setSelectedPinId(pin.id)
      return pin
    },
    [session, settings, setSession],
  )

  const addMarkup = useCallback(
    (pageId: string, type: FormaReviewSession['markups'][number]['type'], data: Record<string, unknown>) => {
      if (!session) return null
      const markup = createMarkup({
        pageId,
        type,
        data,
        authorId: settings?.authorId || 'local',
        authorName: settings?.authorName || 'Anonyme',
        role: settings?.authorRole || 'prof',
      })
      setSession((prev) =>
        prev
          ? { ...prev, markups: [...prev.markups, markup], updatedAt: Date.now() }
          : prev,
      )
      return markup
    },
    [session, settings, setSession],
  )

  const startDraft = (type: string, start: { x: number; y: number }) => {
    draftRef.current = { type, start, points: type === 'draw' ? [start] : undefined }
  }

  const updateDraft = (point: { x: number; y: number }) => {
    if (!draftRef.current) return
    if (draftRef.current.type === 'draw') {
      draftRef.current.points = [...(draftRef.current.points || []), point]
    } else {
      draftRef.current.end = point
    }
  }

  const commitDraft = (pageId: string) => {
    const d = draftRef.current
    draftRef.current = null
    if (!d) return null
    const { type, start, end, points } = d
    if (type === 'highlight' && start && end) {
      const x = Math.min(start.x, end.x)
      const y = Math.min(start.y, end.y)
      const w = Math.abs(end.x - start.x)
      const h = Math.abs(end.y - start.y)
      if (w < 4 || h < 4) return null
      return addMarkup(pageId, 'highlight', { x, y, w, h, color: DEFAULT_MARKUP.highlight.color })
    }
    if (type === 'arrow' && start && end) {
      return addMarkup(pageId, 'arrow', {
        x1: start.x,
        y1: start.y,
        x2: end.x,
        y2: end.y,
        color,
        width: DEFAULT_MARKUP.arrow.width,
      })
    }
    if (type === 'rect' && start && end) {
      const x = Math.min(start.x, end.x)
      const y = Math.min(start.y, end.y)
      const w = Math.abs(end.x - start.x)
      const h = Math.abs(end.y - start.y)
      if (w < 4 || h < 4) return null
      return addMarkup(pageId, 'rect', { x, y, w, h, color, width: DEFAULT_MARKUP.arrow.width })
    }
    if (type === 'circle' && start && end) {
      const x = Math.min(start.x, end.x)
      const y = Math.min(start.y, end.y)
      const w = Math.abs(end.x - start.x)
      const h = Math.abs(end.y - start.y)
      if (w < 4 || h < 4) return null
      return addMarkup(pageId, 'circle', { x, y, w, h, color, width: DEFAULT_MARKUP.arrow.width })
    }
    if (type === 'draw' && points && points.length > 1) {
      return addMarkup(pageId, 'draw', { points, color, width: DEFAULT_MARKUP.draw.width })
    }
    return null
  }

  const eraseAt = useCallback(
    (pageId: string, x: number, y: number, radius = 28) => {
      setSession((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          markups: prev.markups.filter((m) => {
            if (m.pageId !== pageId) return true
            const d = m.data
            if (m.type === 'draw' && Array.isArray(d.points)) {
              return !(d.points as { x: number; y: number }[]).some(
                (p) => Math.hypot(p.x - x, p.y - y) < radius,
              )
            }
            if (['highlight', 'rect', 'circle'].includes(m.type)) {
              const dx = Number(d.x)
              const dy = Number(d.y)
              const dw = Number(d.w)
              const dh = Number(d.h)
              return !(x >= dx && x <= dx + dw && y >= dy && y <= dy + dh)
            }
            if (m.type === 'arrow') {
              const x1 = Number(d.x1)
              const y1 = Number(d.y1)
              const x2 = Number(d.x2)
              const y2 = Number(d.y2)
              return Math.hypot((x1 + x2) / 2 - x, (y1 + y2) / 2 - y) > radius
            }
            if (m.type === 'text') {
              return Math.hypot(Number(d.x || 0) - x, Number(d.y || 0) - y) > radius
            }
            return true
          }),
          updatedAt: Date.now(),
        }
      })
    },
    [setSession],
  )

  const addTextMarkup = (pageId: string, x: number, y: number, text: string) => {
    if (!text.trim()) return null
    return addMarkup(pageId, 'text', {
      x,
      y,
      text: text.trim(),
      color,
      fontSize: DEFAULT_MARKUP.text.fontSize,
    })
  }

  const addComment = useCallback(
    (opts: Parameters<typeof addCommentToSession>[1]) => {
      setSession((prev) => (prev ? addCommentToSession(prev, opts) : prev))
    },
    [setSession],
  )

  const editComment = useCallback(
    (commentId: string, content: string) => {
      setSession((prev) => (prev ? editCommentInSession(prev, commentId, content) : prev))
    },
    [setSession],
  )

  const resolveComment = useCallback(
    (commentId: string, resolved: boolean) => {
      setSession((prev) => (prev ? resolveCommentInSession(prev, commentId, resolved) : prev))
    },
    [setSession],
  )

  const deleteComment = useCallback(
    (commentId: string) => {
      setSession((prev) => (prev ? deleteCommentFromSession(prev, commentId) : prev))
    },
    [setSession],
  )

  const resolvePin = useCallback(
    (pinId: string) => {
      setSession((prev) => (prev ? resolvePinInSession(prev, pinId, 'resolved') : prev))
    },
    [setSession],
  )

  const getPageData = useCallback(
    (pageId: string) => ({
      pins: session ? getPinsForPage(session, pageId) : [],
      markups: session ? getMarkupsForPage(session, pageId) : [],
    }),
    [session],
  )

  return {
    tool,
    setTool,
    selectedPinId,
    setSelectedPinId,
    color,
    setColor,
    draftRef,
    addPin,
    addMarkup,
    addTextMarkup,
    startDraft,
    updateDraft,
    commitDraft,
    addComment,
    editComment,
    resolveComment,
    deleteComment,
    resolvePin,
    eraseAt,
    getPageData,
  }
}
