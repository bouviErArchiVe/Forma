// src/hooks/useSaveCanvas.js
import { useCallback, useRef, useEffect, useState } from 'react'
import { savePage } from '@/lib/supabase'
import useAppStore from '@/stores/useAppStore'

export function useSaveCanvas(pageId) {
  const { activeNotebook, activePage, placedElements, importedFiles } = useAppStore()
  const saveTimer = useRef(null)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)

  const saveNow = useCallback(async (canvasRef) => {
    if (!pageId || !canvasRef?.current) return
    setSaving(true)
    try {
      const canvasData = canvasRef.current.toDataURL('image/webp', 0.8)
      await savePage(pageId, canvasData, placedElements, importedFiles)
      setLastSaved(new Date())
    } catch (err) {
      console.warn('Auto-save failed (offline?):', err.message)
      // Store locally as fallback
      try {
        localStorage.setItem(`archnote_page_${pageId}`, JSON.stringify({
          canvasData: canvasRef.current.toDataURL('image/webp', 0.5),
          elements: placedElements,
          files: importedFiles,
          savedAt: Date.now()
        }))
        setLastSaved(new Date())
      } catch {}
    } finally {
      setSaving(false)
    }
  }, [pageId, placedElements, importedFiles])

  const debouncedSave = useCallback((canvasRef) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveNow(canvasRef), 2000)
  }, [saveNow])

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current) }, [])

  return { saveNow, debouncedSave, saving, lastSaved }
}
