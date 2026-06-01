/**
 * FormaTab — éditeur de tableur simple intégré à Forma.
 *
 * Architecture :
 * - Grille virtualisée légère (div CSS grid)
 * - Cellules adressées A1…Z200 via src/lib/formataб.ts
 * - Édition inline : double-clic ou Entrée → input ; Échap → annule ; Tab/Entrée → déplace
 * - Barre de formule montre la valeur brute, grille montre la valeur calculée
 * - Sauvegarde : débounce 800 ms → schedulePageSave (infra existante)
 * - Export : CSV download + impression
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
  type TabTable,
  type TabCell,
  type TabCellStyle,
  cellAddress,
  colIndexToLetter,
  createDefaultTable,
  deserializeTable,
  downloadTableCSV,
  evaluateCell,
  serializeTable,
  TAB_DEFAULT_COL_WIDTH,
  TAB_DEFAULT_ROW_HEIGHT,
  TAB_HEADER_HEIGHT,
  TAB_HEADER_WIDTH,
  TAB_MAX_COLS,
  TAB_MAX_ROWS,
} from '../lib/formataб'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function printFormaTab(table: TabTable, title: string) {
  const rows: string[] = []
  for (let r = 0; r < table.rows; r++) {
    const cells = Array.from({ length: table.cols }, (_, c) => {
      const addr = cellAddress(c, r)
      const val = evaluateCell(addr, table)
      return `<td style="border:1px solid #ccc;padding:4px 8px;white-space:pre">${val.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</td>`
    }).join('')
    rows.push(`<tr>${cells}</tr>`)
  }
  const headers = Array.from({ length: table.cols }, (_, c) =>
    `<th style="border:1px solid #ccc;padding:4px 8px;background:#f3f4f6;font-weight:600">${colIndexToLetter(c)}</th>`
  ).join('')
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:sans-serif;font-size:12px;padding:20px}table{border-collapse:collapse;width:100%}@media print{body{padding:0}}</style>
</head><body><h2 style="margin-bottom:12px">${title}</h2><table><thead><tr><th style="border:1px solid #ccc;padding:4px 8px;background:#f3f4f6"></th>${headers}</tr></thead><tbody>${rows.join('')}</tbody></table></body></html>`
  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(html)
  w.document.close()
  w.focus()
  setTimeout(() => { w.print() }, 300)
}

// ─── Cell position ────────────────────────────────────────────────────────────

interface CellPos { col: number; row: number }

// ─── Component ────────────────────────────────────────────────────────────────

export function FormaTabPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [notebook, setNotebook] = useState<Notebook | null>(null)
  const [page, setPage] = useState<Page | null>(null)
  const [title, setTitle] = useState('')
  const [editingTitle, setEditingTitle] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')
  const [loaded, setLoaded] = useState(false)

  const [table, setTable] = useState<TabTable>(createDefaultTable())
  const [selected, setSelected] = useState<CellPos>({ col: 0, row: 0 })
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [formulaBarValue, setFormulaBarValue] = useState('')

  // Column widths (col index → px)
  const [colWidths, setColWidths] = useState<Record<number, number>>({})
  const [rowHeights, setRowHeights] = useState<Record<number, number>>({})

  const editInputRef = useRef<HTMLInputElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  // ── Load ────────────────────────────────────────────────────────────────────

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

      const t = deserializeTable(p.tableData)
      setTable(t)
      setColWidths(t.colWidths ?? {})
      setRowHeights(t.rowHeights ?? {})
      setLoaded(true)
    })()
  }, [id, navigate])

  // ── Autosave status ──────────────────────────────────────────────────────────

  useEffect(() => subscribeAutosaveStatus((s) => {
    setSaveStatus(s === 'saving' ? 'saving' : s === 'error' ? 'error' : 'saved')
  }), [])

  // ── Debounced save ────────────────────────────────────────────────────────────

  const scheduleSave = useCallback((t: TabTable) => {
    if (!page) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    setSaveStatus('saving')
    saveTimerRef.current = setTimeout(() => {
      if (!page) return
      const updated = normalizePage({ ...page, tableData: serializeTable(t) })
      setPage(updated)
      schedulePageSave(updated)
    }, 800)
  }, [page])

  useEffect(() => () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }, [])

  // ── Table mutations ───────────────────────────────────────────────────────────

  const updateCell = useCallback((col: number, row: number, value: string) => {
    setTable((prev) => {
      const addr = cellAddress(col, row)
      const existing = prev.cells[addr]
      const next: TabTable = {
        ...prev,
        cells: {
          ...prev.cells,
          [addr]: { value, style: existing?.style },
        },
      }
      scheduleSave(next)
      return next
    })
  }, [scheduleSave])

  const updateStyle = useCallback((col: number, row: number, style: Partial<TabCellStyle>) => {
    setTable((prev) => {
      const addr = cellAddress(col, row)
      const existing = prev.cells[addr]
      const next: TabTable = {
        ...prev,
        cells: {
          ...prev.cells,
          [addr]: {
            value: existing?.value ?? '',
            style: { ...existing?.style, ...style },
          },
        },
      }
      scheduleSave(next)
      return next
    })
  }, [scheduleSave])

  const applyStyleToSelected = useCallback((style: Partial<TabCellStyle>) => {
    updateStyle(selected.col, selected.row, style)
  }, [selected, updateStyle])

  // ── Selection ────────────────────────────────────────────────────────────────

  const selectCell = useCallback((col: number, row: number) => {
    if (editing) return
    setSelected({ col, row })
    const addr = cellAddress(col, row)
    setFormulaBarValue(table.cells[addr]?.value ?? '')
  }, [editing, table])

  // ── Editing ───────────────────────────────────────────────────────────────────

  const startEdit = useCallback((col: number, row: number, prefill?: string) => {
    const addr = cellAddress(col, row)
    const val = prefill !== undefined ? prefill : (table.cells[addr]?.value ?? '')
    setEditValue(val)
    setEditing(true)
    setTimeout(() => editInputRef.current?.focus(), 0)
  }, [table])

  const commitEdit = useCallback((moveDir?: 'down' | 'right' | 'up' | 'left') => {
    if (!editing) return
    updateCell(selected.col, selected.row, editValue)
    setFormulaBarValue(editValue)
    setEditing(false)

    if (moveDir === 'down' && selected.row < table.rows - 1) setSelected((s) => ({ ...s, row: s.row + 1 }))
    else if (moveDir === 'right' && selected.col < table.cols - 1) setSelected((s) => ({ ...s, col: s.col + 1 }))
    else if (moveDir === 'up' && selected.row > 0) setSelected((s) => ({ ...s, row: s.row - 1 }))
    else if (moveDir === 'left' && selected.col > 0) setSelected((s) => ({ ...s, col: s.col - 1 }))
  }, [editing, editValue, selected, table, updateCell])

  const cancelEdit = useCallback(() => {
    setEditing(false)
  }, [])

  // ── Keyboard navigation (grid) ────────────────────────────────────────────────

  const handleGridKey = useCallback((e: React.KeyboardEvent) => {
    if (editing) return
    const { col, row } = selected
    switch (e.key) {
      case 'ArrowRight': e.preventDefault(); if (col < table.cols - 1) setSelected({ col: col + 1, row }); break
      case 'ArrowLeft':  e.preventDefault(); if (col > 0) setSelected({ col: col - 1, row }); break
      case 'ArrowDown':  e.preventDefault(); if (row < table.rows - 1) setSelected({ col, row: row + 1 }); break
      case 'ArrowUp':    e.preventDefault(); if (row > 0) setSelected({ col, row: row - 1 }); break
      case 'Tab':
        e.preventDefault()
        if (e.shiftKey) { if (col > 0) setSelected({ col: col - 1, row }) }
        else { if (col < table.cols - 1) setSelected({ col: col + 1, row }) }
        break
      case 'Enter':
        e.preventDefault()
        startEdit(col, row)
        break
      case 'Delete':
      case 'Backspace':
        e.preventDefault()
        updateCell(col, row, '')
        break
      case 'Escape':
        break
      default:
        // Printable character → start editing with that character
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          startEdit(col, row, e.key)
        }
        break
    }
  }, [editing, selected, table, startEdit, updateCell])

  // ── Edit input keyboard ───────────────────────────────────────────────────────

  const handleEditKey = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); commitEdit('down'); gridRef.current?.focus() }
    else if (e.key === 'Tab') { e.preventDefault(); commitEdit(e.shiftKey ? 'left' : 'right'); gridRef.current?.focus() }
    else if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); gridRef.current?.focus() }
  }, [commitEdit, cancelEdit])

  // ── Formula bar keyboard ─────────────────────────────────────────────────────

  const handleFormulaBarKey = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      updateCell(selected.col, selected.row, formulaBarValue)
      setEditing(false)
      gridRef.current?.focus()
    }
    if (e.key === 'Escape') {
      const addr = cellAddress(selected.col, selected.row)
      setFormulaBarValue(table.cells[addr]?.value ?? '')
      gridRef.current?.focus()
    }
  }, [selected, formulaBarValue, updateCell, table])

  // ── Add/remove rows/cols ──────────────────────────────────────────────────────

  const addRow = useCallback(() => {
    if (table.rows >= TAB_MAX_ROWS) { useToastStore.getState().show(`Max ${TAB_MAX_ROWS} lignes`); return }
    setTable((prev) => {
      const next = { ...prev, rows: prev.rows + 1 }
      scheduleSave(next)
      return next
    })
  }, [table, scheduleSave])

  const removeLastRow = useCallback(() => {
    if (table.rows <= 1) return
    setTable((prev) => {
      const next = { ...prev, rows: prev.rows - 1 }
      scheduleSave(next)
      return next
    })
    if (selected.row >= table.rows - 1) setSelected((s) => ({ ...s, row: s.row - 1 }))
  }, [table, scheduleSave, selected])

  const addCol = useCallback(() => {
    if (table.cols >= TAB_MAX_COLS) { useToastStore.getState().show(`Max ${TAB_MAX_COLS} colonnes`); return }
    setTable((prev) => {
      const next = { ...prev, cols: prev.cols + 1 }
      scheduleSave(next)
      return next
    })
  }, [table, scheduleSave])

  const removeLastCol = useCallback(() => {
    if (table.cols <= 1) return
    setTable((prev) => {
      const next = { ...prev, cols: prev.cols - 1 }
      scheduleSave(next)
      return next
    })
    if (selected.col >= table.cols - 1) setSelected((s) => ({ ...s, col: s.col - 1 }))
  }, [table, scheduleSave, selected])

  // ── Column resize ─────────────────────────────────────────────────────────────

  const handleColResizeMouseDown = useCallback((colIdx: number, e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = colWidths[colIdx] ?? TAB_DEFAULT_COL_WIDTH

    const onMove = (me: MouseEvent) => {
      const newW = Math.max(40, startW + me.clientX - startX)
      setColWidths((prev) => {
        const next = { ...prev, [colIdx]: newW }
        // Save widths to table
        setTable((t) => {
          const nt = { ...t, colWidths: next }
          scheduleSave(nt)
          return nt
        })
        return next
      })
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [colWidths, scheduleSave])

  // ── Active cell style ─────────────────────────────────────────────────────────

  const selectedAddr = cellAddress(selected.col, selected.row)
  const selectedCell: TabCell | undefined = table.cells[selectedAddr]
  const selectedStyle = selectedCell?.style ?? {}

  // ── Title rename ──────────────────────────────────────────────────────────────

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

  // ── Export ────────────────────────────────────────────────────────────────────

  const handleExportCSV = () => {
    downloadTableCSV(table, title)
    useToastStore.getState().show('CSV exporté')
  }

  const handlePrint = () => {
    printFormaTab(table, title)
  }

  // ── UI helpers ────────────────────────────────────────────────────────────────

  const colW = (c: number) => colWidths[c] ?? TAB_DEFAULT_COL_WIDTH
  const rowH = (r: number) => rowHeights[r] ?? TAB_DEFAULT_ROW_HEIGHT

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-forma-bg">
        <div className="text-forma-muted text-sm animate-pulse">Chargement du tableau…</div>
      </div>
    )
  }

  const tbBtn = (active: boolean, onClick: () => void, titleText: string, label: string) => (
    <button
      key={titleText}
      type="button"
      title={titleText}
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      className={`px-2 h-7 rounded text-xs font-medium transition-all duration-100 ${
        active
          ? 'bg-forma-accent text-white shadow-sm'
          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-forma-text'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="min-h-screen flex flex-col bg-forma-bg text-forma-text select-none">
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-forma-surface border-b border-forma-border shadow-sm flex items-center gap-2 px-3 py-2">
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

        {/* Export buttons */}
        <button
          type="button"
          onClick={handleExportCSV}
          className="text-xs px-2 h-7 rounded border border-forma-border hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0"
          title="Exporter en CSV"
        >
          CSV
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

      {/* ── Format toolbar ───────────────────────────────────────────────────── */}
      <div className="sticky top-[48px] z-10 bg-forma-surface border-b border-forma-border px-3 py-1.5 flex flex-wrap gap-1 items-center">
        {/* Style buttons */}
        <div className="flex gap-0.5 border-r border-forma-border pr-2 mr-1">
          {tbBtn(!!selectedStyle.bold, () => applyStyleToSelected({ bold: !selectedStyle.bold }), 'Gras', 'B')}
          {tbBtn(!!selectedStyle.italic, () => applyStyleToSelected({ italic: !selectedStyle.italic }), 'Italique', 'I')}
        </div>

        {/* Alignment */}
        <div className="flex gap-0.5 border-r border-forma-border pr-2 mr-1">
          {tbBtn(selectedStyle.align === 'left' || !selectedStyle.align, () => applyStyleToSelected({ align: 'left' }), 'Aligner à gauche', '⇤')}
          {tbBtn(selectedStyle.align === 'center', () => applyStyleToSelected({ align: 'center' }), 'Centrer', '≡')}
          {tbBtn(selectedStyle.align === 'right', () => applyStyleToSelected({ align: 'right' }), 'Aligner à droite', '⇥')}
        </div>

        {/* Colors */}
        <div className="flex gap-1 items-center border-r border-forma-border pr-2 mr-1">
          <label className="text-xs text-forma-muted" title="Couleur du texte">A</label>
          <input
            type="color"
            value={selectedStyle.color ?? '#000000'}
            onChange={(e) => applyStyleToSelected({ color: e.target.value })}
            className="w-6 h-6 rounded cursor-pointer border border-forma-border"
            title="Couleur du texte"
          />
          <label className="text-xs text-forma-muted" title="Couleur de fond">bg</label>
          <input
            type="color"
            value={selectedStyle.bg ?? '#ffffff'}
            onChange={(e) => applyStyleToSelected({ bg: e.target.value })}
            className="w-6 h-6 rounded cursor-pointer border border-forma-border"
            title="Couleur de fond"
          />
        </div>

        {/* Rows/cols */}
        <div className="flex gap-0.5 border-r border-forma-border pr-2 mr-1">
          {tbBtn(false, addRow, 'Ajouter une ligne', '+L')}
          {tbBtn(false, removeLastRow, 'Supprimer dernière ligne', '-L')}
          {tbBtn(false, addCol, 'Ajouter une colonne', '+C')}
          {tbBtn(false, removeLastCol, 'Supprimer dernière colonne', '-C')}
        </div>

        {/* Dimensions info */}
        <span className="text-xs text-forma-muted ml-1">
          {table.rows} × {table.cols}
        </span>
      </div>

      {/* ── Formula bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-1 bg-forma-surface border-b border-forma-border">
        <span className="text-xs font-mono text-forma-accent font-semibold w-10 shrink-0">
          {selectedAddr}
        </span>
        <span className="text-xs text-forma-muted w-2 shrink-0">fx</span>
        <input
          type="text"
          value={editing ? editValue : formulaBarValue}
          onChange={(e) => {
            if (editing) {
              setEditValue(e.target.value)
            } else {
              setFormulaBarValue(e.target.value)
            }
          }}
          onKeyDown={handleFormulaBarKey}
          onFocus={() => {
            if (!editing) {
              const addr = cellAddress(selected.col, selected.row)
              setFormulaBarValue(table.cells[addr]?.value ?? '')
            }
          }}
          className="flex-1 text-xs font-mono bg-transparent border-none outline-none text-forma-text"
          placeholder="Valeur ou formule (=A1+B1, =SUM(A1:A5)…)"
          spellCheck={false}
        />
      </div>

      {/* ── Grid ─────────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        <div
          ref={gridRef}
          tabIndex={0}
          onKeyDown={handleGridKey}
          className="outline-none inline-block"
          style={{ minWidth: '100%' }}
        >
          {/* Column headers */}
          <div className="flex sticky top-0 z-10 bg-forma-surface" style={{ height: TAB_HEADER_HEIGHT }}>
            {/* Corner cell */}
            <div
              className="shrink-0 border-b border-r border-forma-border bg-gray-50 dark:bg-gray-800"
              style={{ width: TAB_HEADER_WIDTH, height: TAB_HEADER_HEIGHT }}
            />
            {Array.from({ length: table.cols }, (_, c) => (
              <div
                key={c}
                className="relative shrink-0 border-b border-r border-forma-border bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-xs font-medium text-forma-muted"
                style={{ width: colW(c), height: TAB_HEADER_HEIGHT }}
              >
                {colIndexToLetter(c)}
                {/* Resize handle */}
                <div
                  className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-forma-accent/50"
                  onMouseDown={(e) => handleColResizeMouseDown(c, e)}
                />
              </div>
            ))}
          </div>

          {/* Rows */}
          {Array.from({ length: table.rows }, (_, r) => (
            <div key={r} className="flex" style={{ height: rowH(r) }}>
              {/* Row header */}
              <div
                className="shrink-0 border-b border-r border-forma-border bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-xs font-medium text-forma-muted sticky left-0 z-[5]"
                style={{ width: TAB_HEADER_WIDTH, height: rowH(r) }}
              >
                {r + 1}
              </div>

              {/* Cells */}
              {Array.from({ length: table.cols }, (_, c) => {
                const addr = cellAddress(c, r)
                const cell = table.cells[addr]
                const isSelected = selected.col === c && selected.row === r
                const isEditing = isSelected && editing
                const displayed = evaluateCell(addr, table)
                const s = cell?.style ?? {}

                const isError = displayed.startsWith('#') && displayed.endsWith('!')

                return (
                  <div
                    key={c}
                    className={`relative shrink-0 border-b border-r border-forma-border overflow-hidden ${
                      isSelected
                        ? 'ring-2 ring-inset ring-forma-accent z-[2]'
                        : 'hover:bg-blue-50/30 dark:hover:bg-blue-900/10'
                    }`}
                    style={{
                      width: colW(c),
                      height: rowH(r),
                      backgroundColor: s.bg && s.bg !== '#ffffff' ? s.bg : undefined,
                    }}
                    onClick={() => {
                      selectCell(c, r)
                      gridRef.current?.focus()
                    }}
                    onDoubleClick={() => startEdit(c, r)}
                  >
                    {isEditing ? (
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => {
                          setEditValue(e.target.value)
                          setFormulaBarValue(e.target.value)
                        }}
                        onKeyDown={handleEditKey}
                        onBlur={() => commitEdit()}
                        className="absolute inset-0 w-full h-full px-1.5 text-xs font-mono bg-white dark:bg-gray-900 outline-none border-none z-10"
                        style={{ color: s.color }}
                        spellCheck={false}
                      />
                    ) : (
                      <div
                        className={`absolute inset-0 flex items-center px-1.5 text-xs overflow-hidden whitespace-nowrap ${
                          isError ? 'text-red-500' : ''
                        }`}
                        style={{
                          fontWeight: s.bold ? 700 : undefined,
                          fontStyle: s.italic ? 'italic' : undefined,
                          color: isError ? undefined : (s.color && s.color !== '#000000' ? s.color : undefined),
                          justifyContent:
                            s.align === 'center' ? 'center' :
                            s.align === 'right' ? 'flex-end' :
                            undefined,
                          textAlign: s.align ?? 'left',
                        }}
                      >
                        {displayed}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
