import { useCallback, useRef, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  isLocalNotebookId,
  upsertLocalNotebook,
  saveLocalPage,
  loadLocalPages,
} from '@/lib/projectPersistence'

/**
 * Autosave debounced — idle | dirty | saving | saved | error | offline
 * Ne sauvegarde que si le payload a réellement changé.
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
  const lastPayloadRef = useRef(null)
  const savingRef = useRef(false)
  const [status, setStatus] = useState('idle')
  const [lastSavedAt, setLastSavedAt] = useState(null)

  const markDirty = useCallback(() => {
    setStatus((s) => (s === 'saving' ? 'saving' : 'dirty'))
  }, [])

  const saveNow = useCallback(async () => {
    if (!pageId || !notebookId || readOnly || savingRef.current) return false
    const payload = buildPagePayload?.()
    if (!payload) return false

    const payloadKey = `${payload.elements}|${payload.canvas_data}`
    if (payloadKey === lastPayloadRef.current) {
      setStatus(lastSavedAt ? 'saved' : 'idle')
      return true
    }

    savingRef.current = true
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
        const existing = loadLocalPages(notebookId)
        const all = saveLocalPage(notebookId, pageRecord, existing)
        const prev = existing.find((p) => p.id === pageId)
        const changed = !prev
          || prev.elements !== pageRecord.elements
          || prev.canvas_data !== pageRecord.canvas_data
        if (changed) onPagesUpdate?.(all)
        upsertLocalNotebook({
          id: notebookId,
          updated_at: now,
          pages_count: all.length || pageNum,
          ...(onNotebookTouch?.() || {}),
        })
        setStatus('offline')
      }

      lastPayloadRef.current = payloadKey
      setLastSavedAt(new Date())
      setStatus('saved')
      savingRef.current = false
      return true
    } catch (err) {
      console.warn('Autosave failed, local backup:', err?.message)
      try {
        const all = saveLocalPage(notebookId, pageRecord, loadLocalPages(notebookId))
        onPagesUpdate?.(all)
        upsertLocalNotebook({ id: notebookId, updated_at: now })
        lastPayloadRef.current = payloadKey
        setLastSavedAt(new Date())
        setStatus('offline')
        savingRef.current = false
        return true
      } catch {
        setStatus('error')
        savingRef.current = false
        return false
      }
    }
  }, [pageId, notebookId, pageNum, readOnly, buildPagePayload, onPagesUpdate, onNotebookTouch, lastSavedAt])

  const scheduleSave = useCallback(() => {
    markDirty()
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => saveNow(), 1200)
  }, [saveNow, markDirty])

  useEffect(() => {
    lastPayloadRef.current = null
    setStatus('idle')
  }, [pageId])

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  return { saveNow, scheduleSave, status, lastSavedAt, markDirty }
}
