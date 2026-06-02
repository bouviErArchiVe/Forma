/**
 * FMoodboard — tableau de vision libre.
 *
 * Architecture :
 * - Canvas infini via div overflow-auto + positionnement absolu des items
 * - Drag-to-move via mousedown/mousemove/mouseup sur les items
 * - Resize via handles aux coins et bords
 * - Multi-sélection : Shift+click, sélection par rectangle (drag sur fond)
 * - Groupes : Ctrl+G / Ctrl+Maj+G
 * - Layers : avant / arrière
 * - Sauvegarde : débounce 800 ms → schedulePageSave
 * - Export : PNG download + impression
 */
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getNotebook, renameNotebook } from '../services/library'
import { getPages } from '../services/pages'
import { schedulePageSave, subscribeAutosaveStatus } from '../services/autosave'
import { normalizePage } from '../types'
import { useToastStore } from '../stores/toastStore'
import { pushRecent } from '../lib/recent'
import type { Notebook, Page } from '../types'
import {
  type MBItem,
  type MBShapeKind,
  type MoodBoard,
  addItem,
  bringForward,
  bringToFront,
  createDefaultBoard,
  createImageItem,
  createShapeItem,
  createTextItem,
  deserializeBoard,
  downloadBoardPng,
  expandGroupSelection,
  groupItems,
  MB_ACCEPTED_IMAGE_TYPES,
  MB_MAX_IMAGE_BYTES,
  nextZIndex,
  printBoard,
  removeItems,
  sendBackward,
  sendToBack,
  serializeBoard,
  snapToGrid,
  ungroupItems,
  updateItem,
} from '../lib/fmoodboard'

// ─── Resize handle directions ─────────────────────────────────────────────────

type HandleDir = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

const HANDLE_CURSORS: Record<HandleDir, string> = {
  nw: 'nw-resize', n: 'n-resize', ne: 'ne-resize',
  e: 'e-resize', se: 'se-resize', s: 's-resize',
  sw: 'sw-resize', w: 'w-resize',
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FMoodboardPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const [notebook, setNotebook] = useState<Notebook | null>(null)
  const [page, setPage] = useState<Page | null>(null)
  const [title, setTitle] = useState('')
  const [editingTitle, setEditingTitle] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')
  const [loaded, setLoaded] = useState(false)

  const [board, setBoard] = useState<MoodBoard>(createDefaultBoard())
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [snapEnabled, setSnapEnabled] = useState(false)
  const [zoom, setZoom] = useState(1)

  // Drag state
  const dragRef = useRef<{
    type: 'move'
    startX: number; startY: number
    items: { id: string; x: number; y: number }[]
  } | {
    type: 'resize'
    id: string; dir: HandleDir
    startX: number; startY: number
    origX: number; origY: number; origW: number; origH: number
  } | {
    type: 'marquee'
    startX: number; startY: number
  } | null>(null)

  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null)

  // Text editing
  const [editingTextId, setEditingTextId] = useState<string | null>(null)
  const [editingTextValue, setEditingTextValue] = useState('')

  // ── Load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!id) return
    void (async () => {
      const nb = await getNotebook(id)
      if (!nb || nb.deletedAt) { navigate('/'); return }
      setNotebook(nb)
      setTitle(nb.name)
      pushRecent(id)
      const pages = await getPages(id)
      const p = pages[0]
      if (!p) { navigate('/'); return }
      setPage(p)
      setBoard(deserializeBoard(p.moodboardData))
      setLoaded(true)
    })()
  }, [id, navigate])

  // ── Autosave status ───────────────────────────────────────────────────────

  useEffect(() => subscribeAutosaveStatus((s) => {
    setSaveStatus(s === 'saving' ? 'saving' : s === 'error' ? 'error' : 'saved')
  }), [])

  // ── Debounced save ────────────────────────────────────────────────────────

  const scheduleSave = useCallback((b: MoodBoard) => {
    if (!page) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    setSaveStatus('saving')
    saveTimerRef.current = setTimeout(() => {
      if (!page) return
      const updated = normalizePage({ ...page, moodboardData: serializeBoard(b) })
      setPage(updated)
      schedulePageSave(updated)
    }, 800)
  }, [page])

  useEffect(() => () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }, [])

  // ── Board mutations ───────────────────────────────────────────────────────

  const mutate = useCallback((fn: (b: MoodBoard) => MoodBoard) => {
    setBoard((prev) => {
      const next = fn(prev)
      scheduleSave(next)
      return next
    })
  }, [scheduleSave])

  // ── Image import ──────────────────────────────────────────────────────────

  const handleImageFiles = useCallback((files: FileList | null) => {
    if (!files) return
    let x = 80; let y = 80
    Array.from(files).forEach((file) => {
      if (!MB_ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        useToastStore.getState().show(`Format non supporté : ${file.type}`, 4000)
        return
      }
      if (file.size > MB_MAX_IMAGE_BYTES) {
        const mb = (file.size / 1024 / 1024).toFixed(1)
        useToastStore.getState().show(`Image trop volumineuse (${mb} Mo, max 10 Mo)`, 4000)
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        const img = new Image()
        img.onload = () => {
          const MAX = 400
          const ratio = Math.min(1, MAX / img.naturalWidth, MAX / img.naturalHeight)
          const w = Math.round(img.naturalWidth * ratio)
          const h = Math.round(img.naturalHeight * ratio)
          mutate((b) => {
            const item = createImageItem(dataUrl, x, y, w, h, nextZIndex(b))
            x += 20; y += 20
            return addItem(b, item)
          })
        }
        img.onerror = () => {
          mutate((b) => {
            const item = createImageItem(dataUrl, x, y, 200, 200, nextZIndex(b))
            return addItem(b, item)
          })
        }
        img.src = dataUrl
      }
      reader.onerror = () => useToastStore.getState().show("Impossible de lire l'image", 4000)
      reader.readAsDataURL(file)
    })
  }, [mutate])

  const handlePasteImage = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          e.preventDefault()
          const list = new DataTransfer()
          list.items.add(file)
          handleImageFiles(list.files)
          return
        }
      }
    }
  }, [handleImageFiles])

  useEffect(() => {
    window.addEventListener('paste', handlePasteImage)
    return () => window.removeEventListener('paste', handlePasteImage)
  }, [handlePasteImage])

  // ── Add items ─────────────────────────────────────────────────────────────

  const addText = useCallback(() => {
    mutate((b) => {
      const item = createTextItem(100, 100, nextZIndex(b))
      setSelectedIds(new Set([item.id]))
      setEditingTextId(item.id)
      setEditingTextValue(item.text ?? '')
      return addItem(b, item)
    })
  }, [mutate])

  const addShape = useCallback((shapeKind: MBShapeKind) => {
    mutate((b) => {
      const item = createShapeItem(shapeKind, 120, 120, nextZIndex(b))
      setSelectedIds(new Set([item.id]))
      return addItem(b, item)
    })
  }, [mutate])

  // ── Delete ────────────────────────────────────────────────────────────────

  const deleteSelected = useCallback(() => {
    if (!selectedIds.size) return
    mutate((b) => removeItems(b, selectedIds))
    setSelectedIds(new Set())
  }, [selectedIds, mutate])

  // ── Keyboard ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (editingTextId) return
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.size) {
        e.preventDefault()
        deleteSelected()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault()
        if (e.shiftKey) {
          mutate((b) => ungroupItems(b, selectedIds))
        } else {
          mutate((b) => groupItems(b, selectedIds))
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault()
        setSelectedIds(new Set(board.items.map((it) => it.id)))
      }
      if (e.key === 'Escape') {
        setSelectedIds(new Set())
        setEditingTextId(null)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [editingTextId, selectedIds, board, deleteSelected, mutate])

  // ── Drag helpers ──────────────────────────────────────────────────────────

  const canvasCoords = useCallback((clientX: number, clientY: number): { x: number; y: number } => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return {
      x: (clientX - rect.left) / zoom,
      y: (clientY - rect.top) / zoom,
    }
  }, [zoom])

  // ── Item mousedown → start drag/move ──────────────────────────────────────

  const handleItemMouseDown = useCallback((
    e: React.MouseEvent,
    item: MBItem,
  ) => {
    e.stopPropagation()
    if (editingTextId && editingTextId !== item.id) {
      // Commit text edit first
      mutate((b) => updateItem(b, editingTextId, { text: editingTextValue }))
      setEditingTextId(null)
    }

    // Selection
    let newSelected: Set<string>
    if (e.shiftKey) {
      newSelected = new Set(selectedIds)
      if (newSelected.has(item.id)) newSelected.delete(item.id)
      else newSelected.add(item.id)
    } else {
      if (!selectedIds.has(item.id)) {
        newSelected = new Set([item.id])
      } else {
        newSelected = selectedIds
      }
    }
    // Expand groups
    newSelected = expandGroupSelection(board, newSelected)
    setSelectedIds(newSelected)

    // Bring to front on click
    mutate((b) => bringToFront(b, item.id))

    // Start move drag
    const { x, y } = canvasCoords(e.clientX, e.clientY)
    const dragItems = [...newSelected].map((sid) => {
      const it = board.items.find((i) => i.id === sid)!
      return { id: sid, x: it.x, y: it.y }
    })
    dragRef.current = { type: 'move', startX: x, startY: y, items: dragItems }

    const onMove = (me: MouseEvent) => {
      if (!dragRef.current || dragRef.current.type !== 'move') return
      const cur = canvasCoords(me.clientX, me.clientY)
      const dx = cur.x - dragRef.current.startX
      const dy = cur.y - dragRef.current.startY
      setBoard((prev) => {
        const next = {
          ...prev,
          items: prev.items.map((it) => {
            const base = (dragRef.current as typeof dragRef.current & { type: 'move' })?.items.find((d) => d.id === it.id)
            if (!base) return it
            return {
              ...it,
              x: snapToGrid(base.x + dx, snapEnabled),
              y: snapToGrid(base.y + dy, snapEnabled),
            }
          }),
        }
        return next
      })
    }
    const onUp = () => {
      if (dragRef.current?.type === 'move') {
        // Flush final state to save
        setBoard((prev) => {
          scheduleSave(prev)
          return prev
        })
      }
      dragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [editingTextId, editingTextValue, selectedIds, board, canvasCoords, snapEnabled, mutate, scheduleSave])

  // ── Resize handle mousedown ────────────────────────────────────────────────

  const handleResizeMouseDown = useCallback((
    e: React.MouseEvent,
    item: MBItem,
    dir: HandleDir,
  ) => {
    e.stopPropagation()
    e.preventDefault()
    const { x, y } = canvasCoords(e.clientX, e.clientY)
    dragRef.current = {
      type: 'resize', id: item.id, dir,
      startX: x, startY: y,
      origX: item.x, origY: item.y,
      origW: item.width, origH: item.height,
    }

    const onMove = (me: MouseEvent) => {
      if (!dragRef.current || dragRef.current.type !== 'resize') return
      const d = dragRef.current
      const cur = canvasCoords(me.clientX, me.clientY)
      const dx = cur.x - d.startX
      const dy = cur.y - d.startY

      let nx = d.origX, ny = d.origY, nw = d.origW, nh = d.origH
      if (d.dir.includes('e')) nw = Math.max(40, d.origW + dx)
      if (d.dir.includes('s')) nh = Math.max(20, d.origH + dy)
      if (d.dir.includes('w')) { nw = Math.max(40, d.origW - dx); nx = d.origX + d.origW - nw }
      if (d.dir.includes('n')) { nh = Math.max(20, d.origH - dy); ny = d.origY + d.origH - nh }

      setBoard((prev) => ({
        ...prev,
        items: prev.items.map((it) =>
          it.id === d.id ? { ...it, x: snapToGrid(nx, snapEnabled), y: snapToGrid(ny, snapEnabled), width: snapToGrid(nw, snapEnabled) || 40, height: snapToGrid(nh, snapEnabled) || 20 } : it
        ),
      }))
    }
    const onUp = () => {
      if (dragRef.current?.type === 'resize') {
        setBoard((prev) => { scheduleSave(prev); return prev })
      }
      dragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [canvasCoords, snapEnabled, scheduleSave])

  // ── Canvas mousedown → marquee selection ──────────────────────────────────

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target !== canvasRef.current) return
    if (editingTextId) {
      mutate((b) => updateItem(b, editingTextId, { text: editingTextValue }))
      setEditingTextId(null)
    }
    if (!e.shiftKey) setSelectedIds(new Set())

    const { x, y } = canvasCoords(e.clientX, e.clientY)
    dragRef.current = { type: 'marquee', startX: x, startY: y }
    setMarquee({ x, y, w: 0, h: 0 })

    const onMove = (me: MouseEvent) => {
      if (!dragRef.current || dragRef.current.type !== 'marquee') return
      const d = dragRef.current
      const cur = canvasCoords(me.clientX, me.clientY)
      const mx = Math.min(d.startX, cur.x)
      const my = Math.min(d.startY, cur.y)
      const mw = Math.abs(cur.x - d.startX)
      const mh = Math.abs(cur.y - d.startY)
      setMarquee({ x: mx, y: my, w: mw, h: mh })
    }
    const onUp = (me: MouseEvent) => {
      if (!dragRef.current || dragRef.current.type !== 'marquee') {
        setMarquee(null)
        dragRef.current = null
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
        return
      }
      const d = dragRef.current
      const cur = canvasCoords(me.clientX, me.clientY)
      const mx = Math.min(d.startX, cur.x)
      const my = Math.min(d.startY, cur.y)
      const mw = Math.abs(cur.x - d.startX)
      const mh = Math.abs(cur.y - d.startY)
      if (mw > 4 || mh > 4) {
        // Select items whose bounds intersect the marquee
        const hit = new Set<string>()
        board.items.forEach((it) => {
          if (it.x < mx + mw && it.x + it.width > mx && it.y < my + mh && it.y + it.height > my) {
            hit.add(it.id)
          }
        })
        setSelectedIds((prev) => {
          const combined = new Set([...prev, ...hit])
          return expandGroupSelection(board, combined)
        })
      }
      dragRef.current = null
      setMarquee(null)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [editingTextId, editingTextValue, canvasCoords, board, mutate])

  // ── Text editing ──────────────────────────────────────────────────────────

  const startTextEdit = useCallback((item: MBItem) => {
    if (item.kind !== 'text') return
    setEditingTextId(item.id)
    setEditingTextValue(item.text ?? '')
  }, [])

  const commitTextEdit = useCallback(() => {
    if (!editingTextId) return
    mutate((b) => updateItem(b, editingTextId, { text: editingTextValue }))
    setEditingTextId(null)
  }, [editingTextId, editingTextValue, mutate])

  // ── Title rename ──────────────────────────────────────────────────────────

  const commitTitle = useCallback(async () => {
    const trimmed = title.trim()
    if (!trimmed || !notebook || trimmed === notebook.name) {
      setTitle(notebook?.name ?? '')
      setEditingTitle(false)
      return
    }
    await renameNotebook(notebook.id, trimmed)
    setNotebook((n) => n ? { ...n, name: trimmed } : n)
    setEditingTitle(false)
  }, [title, notebook])

  // ── Export ────────────────────────────────────────────────────────────────

  const handleExportPng = () => {
    downloadBoardPng(board, title)
    useToastStore.getState().show('PNG exporté')
  }

  const handlePrint = () => printBoard(board, title)

  // ── Selected item(s) properties ───────────────────────────────────────────

  const firstSelected = board.items.find((it) => selectedIds.has(it.id))

  // ── UI ────────────────────────────────────────────────────────────────────

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-forma-bg">
        <div className="text-forma-muted text-sm animate-pulse">Chargement du moodboard…</div>
      </div>
    )
  }

  const tbBtn = (active: boolean, onClick: () => void, titleText: string, label: string) => (
    <button
      key={titleText}
      type="button"
      title={titleText}
      onClick={onClick}
      className={`px-2 h-7 rounded text-xs font-medium transition-all duration-100 ${
        active
          ? 'bg-forma-accent text-white shadow-sm'
          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-forma-text'
      }`}
    >
      {label}
    </button>
  )

  // Sorted items for rendering (z-index ascending)
  const sortedItems = [...board.items].sort((a, b) => a.zIndex - b.zIndex)

  return (
    <div className="h-screen flex flex-col bg-forma-bg text-forma-text overflow-hidden">
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header className="shrink-0 z-20 bg-forma-surface border-b border-forma-border shadow-sm flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          onClick={() => navigate('/')}
          title="Retour à la bibliothèque"
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 text-forma-muted hover:text-forma-text transition-colors shrink-0"
        >
          ←
        </button>

        <div className="flex-1 min-w-0">
          {editingTitle ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void commitTitle()
                if (e.key === 'Escape') { setTitle(notebook?.name ?? ''); setEditingTitle(false) }
              }}
              className="forma-input w-full max-w-xs text-sm"
              autoFocus
            />
          ) : (
            <button
              type="button"
              className="text-sm font-semibold truncate max-w-xs text-left hover:text-forma-accent transition-colors"
              onClick={() => setEditingTitle(true)}
              title="Cliquer pour renommer"
            >
              {notebook?.name ?? ''}
            </button>
          )}
        </div>

        <span className={`text-xs shrink-0 ${
          saveStatus === 'error' ? 'text-red-500' :
          saveStatus === 'saving' ? 'text-amber-500' :
          'text-forma-muted'
        }`}>
          {saveStatus === 'error' ? '⚠ Erreur' : saveStatus === 'saving' ? '…' : '✓'}
        </span>

        <span className="text-xs text-forma-muted shrink-0 hidden sm:inline">
          {board.items.length} élément{board.items.length !== 1 ? 's' : ''}
        </span>

        <button
          type="button"
          onClick={handleExportPng}
          className="text-xs px-2 h-7 rounded border border-forma-border hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0"
          title="Exporter en PNG"
        >
          PNG
        </button>
        <button
          type="button"
          onClick={handlePrint}
          className="text-xs px-2 h-7 rounded border border-forma-border hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0"
          title="Imprimer / Exporter en PDF"
        >
          🖨
        </button>
      </header>

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 z-10 bg-forma-surface border-b border-forma-border px-3 py-1.5 flex flex-wrap gap-1 items-center">
        {/* Add items */}
        <div className="flex gap-0.5 border-r border-forma-border pr-2 mr-1">
          <button
            type="button"
            title="Insérer image(s)"
            onClick={() => imageInputRef.current?.click()}
            className="px-2 h-7 rounded text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-700 text-forma-text transition-colors"
          >
            🖼 Image
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleImageFiles(e.target.files)}
          />
          {tbBtn(false, addText, 'Ajouter un texte', 'T Texte')}
          {tbBtn(false, () => addShape('rect'), 'Ajouter un rectangle', '□ Rect')}
          {tbBtn(false, () => addShape('ellipse'), 'Ajouter une ellipse', '○ Ellipse')}
        </div>

        {/* Selection actions */}
        {selectedIds.size > 0 && (
          <div className="flex gap-0.5 border-r border-forma-border pr-2 mr-1">
            {tbBtn(false, deleteSelected, 'Supprimer la sélection (Suppr)', '🗑')}
            {selectedIds.size > 1 && tbBtn(false, () => mutate((b) => groupItems(b, selectedIds)), 'Grouper (Ctrl+G)', '⊞ Groupe')}
            {selectedIds.size >= 1 && firstSelected?.groupId && tbBtn(false, () => mutate((b) => ungroupItems(b, selectedIds)), 'Dégrouper (Ctrl+Maj+G)', '⊟ Dégrouper')}
          </div>
        )}

        {/* Layer order */}
        {selectedIds.size === 1 && (
          <div className="flex gap-0.5 border-r border-forma-border pr-2 mr-1">
            {tbBtn(false, () => mutate((b) => bringToFront(b, [...selectedIds][0])), 'Mettre au premier plan', '⬆⬆')}
            {tbBtn(false, () => mutate((b) => bringForward(b, [...selectedIds][0])), 'Avancer', '⬆')}
            {tbBtn(false, () => mutate((b) => sendBackward(b, [...selectedIds][0])), 'Reculer', '⬇')}
            {tbBtn(false, () => mutate((b) => sendToBack(b, [...selectedIds][0])), 'Mettre en arrière-plan', '⬇⬇')}
          </div>
        )}

        {/* Item style (when image selected) */}
        {selectedIds.size === 1 && firstSelected?.kind === 'image' && (
          <div className="flex gap-0.5 items-center border-r border-forma-border pr-2 mr-1">
            <label className="text-xs text-forma-muted">Fit</label>
            <select
              value={firstSelected.objectFit ?? 'cover'}
              onChange={(e) => mutate((b) => updateItem(b, firstSelected.id, { objectFit: e.target.value as 'cover' | 'contain' }))}
              className="text-xs border border-forma-border rounded px-1 h-7 bg-forma-surface"
            >
              <option value="cover">Couvrir</option>
              <option value="contain">Contenir</option>
            </select>
          </div>
        )}

        {/* Item style (when shape selected) */}
        {selectedIds.size === 1 && firstSelected?.kind === 'shape' && (
          <div className="flex gap-1 items-center border-r border-forma-border pr-2 mr-1">
            <label className="text-xs text-forma-muted">Fond</label>
            <input
              type="color"
              value={firstSelected.fillColor ?? '#bfdbfe'}
              onChange={(e) => mutate((b) => updateItem(b, firstSelected.id, { fillColor: e.target.value }))}
              className="w-6 h-6 rounded border border-forma-border cursor-pointer"
              title="Couleur de fond"
            />
            <label className="text-xs text-forma-muted">Bordure</label>
            <input
              type="color"
              value={firstSelected.strokeColor ?? '#3b82f6'}
              onChange={(e) => mutate((b) => updateItem(b, firstSelected.id, { strokeColor: e.target.value }))}
              className="w-6 h-6 rounded border border-forma-border cursor-pointer"
              title="Couleur de bordure"
            />
          </div>
        )}

        {/* Item style (when text selected) */}
        {selectedIds.size === 1 && firstSelected?.kind === 'text' && (
          <div className="flex gap-1 items-center border-r border-forma-border pr-2 mr-1">
            <input
              type="color"
              value={firstSelected.color ?? '#1e293b'}
              onChange={(e) => mutate((b) => updateItem(b, firstSelected.id, { color: e.target.value }))}
              className="w-6 h-6 rounded border border-forma-border cursor-pointer"
              title="Couleur du texte"
            />
            <input
              type="number"
              value={firstSelected.fontSize ?? 18}
              min={8}
              max={120}
              onChange={(e) => mutate((b) => updateItem(b, firstSelected.id, { fontSize: Number(e.target.value) }))}
              className="w-14 text-xs border border-forma-border rounded px-1 h-7 bg-forma-surface"
              title="Taille police"
            />
            {tbBtn(firstSelected.fontWeight === 'bold', () => mutate((b) => updateItem(b, firstSelected.id, { fontWeight: firstSelected.fontWeight === 'bold' ? 'normal' : 'bold' })), 'Gras', 'B')}
            {tbBtn(!!firstSelected.italic, () => mutate((b) => updateItem(b, firstSelected.id, { italic: !firstSelected.italic })), 'Italique', 'I')}
          </div>
        )}

        {/* Opacity */}
        {selectedIds.size === 1 && firstSelected && (
          <div className="flex gap-1 items-center border-r border-forma-border pr-2 mr-1">
            <label className="text-xs text-forma-muted">Opacité</label>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={Math.round((firstSelected.opacity ?? 1) * 100)}
              onChange={(e) => mutate((b) => updateItem(b, firstSelected.id, { opacity: Number(e.target.value) / 100 }))}
              className="w-20"
              title="Opacité"
            />
            <span className="text-xs text-forma-muted w-8">{Math.round((firstSelected.opacity ?? 1) * 100)}%</span>
          </div>
        )}

        {/* Snap */}
        {tbBtn(snapEnabled, () => setSnapEnabled((v) => !v), 'Aligner sur la grille', snapEnabled ? '⊞ Snap ✓' : '⊞ Snap')}

        {/* Zoom */}
        <div className="flex gap-0.5 items-center ml-1">
          <button type="button" onClick={() => setZoom((z) => Math.max(0.25, +(z - 0.25).toFixed(2)))} className="px-2 h-7 rounded text-xs hover:bg-gray-100 dark:hover:bg-gray-700">-</button>
          <span className="text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))} className="px-2 h-7 rounded text-xs hover:bg-gray-100 dark:hover:bg-gray-700">+</button>
          <button type="button" onClick={() => setZoom(1)} className="px-2 h-7 rounded text-xs hover:bg-gray-100 dark:hover:bg-gray-700" title="Zoom 100%">1:1</button>
        </div>
      </div>

      {/* ── Canvas area ──────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto bg-gray-200 dark:bg-gray-700">
        <div
          style={{
            width: board.canvasWidth * zoom,
            height: board.canvasHeight * zoom,
            minWidth: '100%',
            minHeight: '100%',
            position: 'relative',
          }}
          onMouseDown={handleCanvasMouseDown}
        >
          {/* Board canvas (inner, scaled) */}
          <div
            ref={canvasRef}
            className="absolute top-0 left-0"
            style={{
              width: board.canvasWidth,
              height: board.canvasHeight,
              background: board.background,
              transform: `scale(${zoom})`,
              transformOrigin: '0 0',
              boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
            }}
          >
            {/* Grid dots (when snap enabled) */}
            {snapEnabled && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                  opacity: 0.4,
                }}
              />
            )}

            {/* Marquee selection */}
            {marquee && marquee.w > 4 && marquee.h > 4 && (
              <div
                className="absolute pointer-events-none border-2 border-forma-accent bg-forma-accent/10"
                style={{ left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h }}
              />
            )}

            {/* Items */}
            {sortedItems.map((item) => (
              <BoardItem
                key={item.id}
                item={item}
                selected={selectedIds.has(item.id)}
                editingText={editingTextId === item.id}
                editingTextValue={editingTextValue}
                onMouseDown={(e) => handleItemMouseDown(e, item)}
                onResizeMouseDown={(e, dir) => handleResizeMouseDown(e, item, dir)}
                onDoubleClick={() => {
                  if (item.kind === 'text') startTextEdit(item)
                }}
                onTextChange={setEditingTextValue}
                onTextBlur={commitTextEdit}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── BoardItem ────────────────────────────────────────────────────────────────

interface BoardItemProps {
  item: MBItem
  selected: boolean
  editingText: boolean
  editingTextValue: string
  onMouseDown: (e: React.MouseEvent) => void
  onResizeMouseDown: (e: React.MouseEvent, dir: HandleDir) => void
  onDoubleClick: () => void
  onTextChange: (v: string) => void
  onTextBlur: () => void
}

function BoardItem({
  item, selected, editingText, editingTextValue,
  onMouseDown, onResizeMouseDown, onDoubleClick,
  onTextChange, onTextBlur,
}: BoardItemProps) {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: item.x,
    top: item.y,
    width: item.width,
    height: item.height,
    zIndex: item.zIndex,
    opacity: item.opacity ?? 1,
    cursor: 'move',
    userSelect: 'none',
  }

  return (
    <div
      style={style}
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      className={selected ? 'outline outline-2 outline-forma-accent outline-offset-1' : ''}
    >
      {/* Content */}
      {item.kind === 'image' && item.dataUrl && (
        <img
          src={item.dataUrl}
          alt=""
          draggable={false}
          className="w-full h-full select-none pointer-events-none"
          style={{
            objectFit: item.objectFit ?? 'cover',
            borderRadius: item.borderRadius ?? 0,
            display: 'block',
          }}
        />
      )}

      {item.kind === 'shape' && (
        <div
          className="w-full h-full"
          style={{
            backgroundColor: item.fillColor ?? 'transparent',
            border: `${item.strokeWidth ?? 1}px solid ${item.strokeColor ?? 'transparent'}`,
            borderRadius: item.shapeKind === 'ellipse' ? '50%' : (item.borderRadius ?? 0),
          }}
        />
      )}

      {item.kind === 'text' && (
        editingText ? (
          <textarea
            autoFocus
            value={editingTextValue}
            onChange={(e) => onTextChange(e.target.value)}
            onBlur={onTextBlur}
            onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); onTextBlur() } }}
            onClick={(e) => e.stopPropagation()}
            className="w-full h-full resize-none border-none outline-none bg-transparent p-1 text-inherit"
            style={{
              fontSize: item.fontSize ?? 18,
              color: item.color ?? '#1e293b',
              textAlign: item.textAlign ?? 'left',
              fontWeight: item.fontWeight ?? 'normal',
              fontStyle: item.italic ? 'italic' : 'normal',
              cursor: 'text',
            }}
          />
        ) : (
          <div
            className="w-full h-full p-1 overflow-hidden whitespace-pre-wrap break-words select-none"
            style={{
              fontSize: item.fontSize ?? 18,
              color: item.color ?? '#1e293b',
              textAlign: item.textAlign ?? 'left',
              fontWeight: item.fontWeight ?? 'normal',
              fontStyle: item.italic ? 'italic' : 'normal',
            }}
          >
            {item.text || <span className="text-gray-400 italic">Double-clic pour éditer</span>}
          </div>
        )
      )}

      {/* Resize handles */}
      {selected && !editingText && (
        <ResizeHandles item={item} onResizeMouseDown={onResizeMouseDown} />
      )}
    </div>
  )
}

// ─── ResizeHandles ────────────────────────────────────────────────────────────

const HANDLE_POSITIONS: { dir: HandleDir; style: React.CSSProperties }[] = [
  { dir: 'nw', style: { top: -5, left: -5 } },
  { dir: 'n',  style: { top: -5, left: '50%', transform: 'translateX(-50%)' } },
  { dir: 'ne', style: { top: -5, right: -5 } },
  { dir: 'e',  style: { top: '50%', right: -5, transform: 'translateY(-50%)' } },
  { dir: 'se', style: { bottom: -5, right: -5 } },
  { dir: 's',  style: { bottom: -5, left: '50%', transform: 'translateX(-50%)' } },
  { dir: 'sw', style: { bottom: -5, left: -5 } },
  { dir: 'w',  style: { top: '50%', left: -5, transform: 'translateY(-50%)' } },
]

function ResizeHandles({ onResizeMouseDown }: {
  item: MBItem
  onResizeMouseDown: (e: React.MouseEvent, dir: HandleDir) => void
}) {
  return (
    <>
      {HANDLE_POSITIONS.map(({ dir, style }) => (
        <div
          key={dir}
          style={{
            ...style,
            position: 'absolute',
            width: 10,
            height: 10,
            background: '#fff',
            border: '2px solid #6366f1',
            borderRadius: 2,
            cursor: HANDLE_CURSORS[dir],
            zIndex: 9999,
          }}
          onMouseDown={(e) => onResizeMouseDown(e, dir)}
        />
      ))}
    </>
  )
}
