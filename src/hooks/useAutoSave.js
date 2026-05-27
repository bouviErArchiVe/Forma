import { useCallback, useRef, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  isLocalNotebookId,
  upsertLocalNotebook,
  saveLocalPage,
  loadLocalPages,
} from '@/lib/projectPersistence'

/**
 * Autosave debounced pour pages carnet (Supabase + fallback local).
 */
export function useAutoSave({
  notebookId,
  pageId,
  pageNum,
  readOnly,
  buildPagePayload,
  onPagesUpdate,
  onNotebookTouch,
}) {
  const timer = useRef(null)
  const [status, setStatus] = useState('idle') // idle | saving | saved | error | offline
  const [lastSavedAt, setLastSavedAt] = useState(null)

  const saveNow = useCallback(async () => {
    if (!pageId || !notebookId || readOnly) return false
    const payload = buildPagePayload?.()
    if (!payload) return false

    setStatus('saving')
    const now = new Date().toISOString()
    const pageRecord = {
      id: pageId,
      page_number: pageNum,
      notebook_id: notebookId,
      elements: payload.elements,
      canvas_data: payload.canvas_data,
      updated_at: now,
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const useCloud = session?.user && !isLocalNotebookId(notebookId)

      if (useCloud) {
        const { error } = await supabase
          .from('pages')
          .update({
            canvas_data: pageRecord.canvas_data,
            elements: pageRecord.elements,
            updated_at: now,
          })
          .eq('id', pageId)
        if (error) throw error
        await supabase.from('notebooks').update({ updated_at: now }).eq('id', notebookId)
        setStatus('saved')
      } else {
        const all = saveLocalPage(notebookId, pageRecord, loadLocalPages(notebookId))
        onPagesUpdate?.(all)
        upsertLocalNotebook({
          id: notebookId,
          updated_at: now,
          pages_count: all.length || pageNum,
          ...(onNotebookTouch?.() || {}),
        })
        setStatus('offline')
      }

      setLastSavedAt(new Date())
      setTimeout(() => setStatus('idle'), 2500)
      return true
    } catch (err) {
      console.warn('Autosave failed, local backup:', err?.message)
      try {
        const all = saveLocalPage(notebookId, pageRecord, loadLocalPages(notebookId))
        onPagesUpdate?.(all)
        upsertLocalNotebook({ id: notebookId, updated_at: now })
        setLastSavedAt(new Date())
        setStatus('offline')
        setTimeout(() => setStatus('idle'), 2500)
        return true
      } catch {
        setStatus('error')
        setTimeout(() => setStatus('idle'), 4000)
        return false
      }
    }
  }, [pageId, notebookId, pageNum, readOnly, buildPagePayload, onPagesUpdate, onNotebookTouch])

  const scheduleSave = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => saveNow(), 900)
  }, [saveNow])

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  return { saveNow, scheduleSave, status, lastSavedAt, setStatus }
}
