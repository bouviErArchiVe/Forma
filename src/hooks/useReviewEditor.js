import { useCallback, useRef, useState } from 'react'
import {
  createPin, createMarkup, getPinsForPage, getMarkupsForPage,
} from '@/lib/formareview/model'
import {
  addCommentToSession, resolvePinInSession, resolveCommentInSession,
  editCommentInSession, deleteCommentFromSession,
} from '@/lib/formareview/comments'
import { DEFAULT_MARKUP, MARKUP_COLORS } from '@/lib/formareview/constants'

export function useReviewEditor(session, setSession) {
  const [tool, setTool] = useState('select')
  const [selectedPinId, setSelectedPinId] = useState(null)
  const [color, setColor] = useState(MARKUP_COLORS[0])
  const draftRef = useRef(null)

  const update = useCallback((patch) => {
    setSession((prev) => ({ ...prev, ...patch, updatedAt: Date.now() }))
  }, [setSession])

  const addPin = useCallback((pageId, x, y) => {
    const pin = createPin({
      pageId, x, y,
      authorId: session.settings?.authorId || 'local',
      authorName: session.settings?.authorName || 'Anonyme',
      role: session.settings?.authorRole || 'prof',
    })
    setSession((prev) => ({
      ...prev,
      pins: [...(prev.pins || []), pin],
      updatedAt: Date.now(),
    }))
    setSelectedPinId(pin.id)
    return pin
  }, [session.settings, setSession])

  const addMarkup = useCallback((pageId, type, data) => {
    const markup = createMarkup({
      pageId, type, data,
      authorId: session.settings?.authorId || 'local',
      authorName: session.settings?.authorName || 'Anonyme',
      role: session.settings?.authorRole || 'prof',
    })
    setSession((prev) => ({
      ...prev,
      markups: [...(prev.markups || []), markup],
      updatedAt: Date.now(),
    }))
    return markup
  }, [session.settings, setSession])

  const startDraft = (type, start) => {
    draftRef.current = { type, start, points: type === 'draw' ? [start] : null }
  }

  const updateDraft = (point) => {
    if (!draftRef.current) return
    if (draftRef.current.type === 'draw') {
      draftRef.current.points.push(point)
    } else {
      draftRef.current.end = point
    }
  }

  const commitDraft = (pageId) => {
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
        x1: start.x, y1: start.y, x2: end.x, y2: end.y,
        color, width: DEFAULT_MARKUP.arrow.width,
      })
    }
    if (type === 'draw' && points?.length > 1) {
      return addMarkup(pageId, 'draw', { points, color, width: DEFAULT_MARKUP.draw.width })
    }
    return null
  }

  const addTextMarkup = (pageId, x, y, text) => {
    if (!text?.trim()) return null
    return addMarkup(pageId, 'text', {
      x, y, text: text.trim(), color, fontSize: DEFAULT_MARKUP.text.fontSize,
    })
  }

  const addComment = useCallback((opts) => {
    setSession((prev) => addCommentToSession(prev, opts))
  }, [setSession])

  const editComment = useCallback((commentId, content) => {
    setSession((prev) => editCommentInSession(prev, commentId, content))
  }, [setSession])

  const resolveComment = useCallback((commentId, resolved) => {
    setSession((prev) => resolveCommentInSession(prev, commentId, resolved))
  }, [setSession])

  const deleteComment = useCallback((commentId) => {
    setSession((prev) => deleteCommentFromSession(prev, commentId))
  }, [setSession])

  const resolvePin = useCallback((pinId) => {
    setSession((prev) => resolvePinInSession(prev, pinId, 'resolved'))
  }, [setSession])

  const getPageData = useCallback((pageId) => ({
    pins: getPinsForPage(session, pageId),
    markups: getMarkupsForPage(session, pageId),
  }), [session])

  return {
    tool, setTool,
    selectedPinId, setSelectedPinId,
    color, setColor,
    draftRef,
    update,
    addPin, addMarkup, addTextMarkup,
    startDraft, updateDraft, commitDraft,
    addComment, editComment, resolveComment, deleteComment, resolvePin,
    getPageData,
  }
}
