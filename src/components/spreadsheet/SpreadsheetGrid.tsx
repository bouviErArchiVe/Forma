import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormaSheet, SheetCellStyle } from '../../types'
import { cellKey, colToLetter, defaultStyle } from '../../lib/spreadsheet/cells'
import { computeSheet } from '../../lib/spreadsheet/formulas'
import {
  addCol,
  addRow,
  applyStyleToRange,
  copyRange,
  deleteCol,
  deleteRow,
  getMergeAt,
  isMergeHidden,
  mergeCells,
  pasteRange,
  sortByColumn,
  sumColWidths,
  sumRowHeights,
  unmergeAt,
  type RangeClip,
} from '../../lib/spreadsheet/model'
import { SpreadsheetFormulaHelp } from './SpreadsheetFormulaHelp'

const MAX_HISTORY = 50
const ROW_HDR_W = 40
const COL_HDR_H = 26
const FONT_SIZES = [10, 11, 12, 13, 14, 16, 18]

interface Selection {
  r1: number
  c1: number
  r2: number
  c2: number
}

interface SpreadsheetGridProps {
  sheet: FormaSheet
  onChange: (sheet: FormaSheet) => void
  readOnly?: boolean
}

function normalizeSelection(sel: Selection | null): Selection | null {
  if (!sel) return null
  return {
    r1: Math.min(sel.r1, sel.r2),
    c1: Math.min(sel.c1, sel.c2),
    r2: Math.max(sel.r1, sel.r2),
    c2: Math.max(sel.c1, sel.c2),
  }
}

export function SpreadsheetGrid({ sheet, onChange, readOnly = false }: SpreadsheetGridProps) {
  const [sel, setSel] = useState<Selection>({ r1: 0, c1: 0, r2: 0, c2: 0 })
  const [editing, setEditing] = useState<{ r: number; c: number } | null>(null)
  const [editVal, setEditVal] = useState('')
  const [formulaBar, setFormulaBar] = useState('')
  const [clipboard, setClipboard] = useState<RangeClip | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const [redoStack, setRedoStack] = useState<string[]>([])
  const [tableSearch, setTableSearch] = useState('')
  const [formulaHelp, setFormulaHelp] = useState(false)
  const dragRef = useRef<{ r: number; c: number } | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const computed = useMemo(() => computeSheet(sheet), [sheet])
  const selection = normalizeSelection(sel)
  const activeCell = selection ? { r: selection.r1, c: selection.c1 } : { r: 0, c: 0 }
  const activeKey = cellKey(activeCell.r, activeCell.c)

  useEffect(() => {
    setFormulaBar(computed[activeKey]?.raw ?? '')
  }, [activeKey, computed])

  useEffect(() => {
    const onUp = () => {
      dragRef.current = null
    }
    window.addEventListener('mouseup', onUp)
    return () => window.removeEventListener('mouseup', onUp)
  }, [])

  const pushHistory = useCallback((prev: FormaSheet) => {
    setHistory((h) => [...h.slice(-MAX_HISTORY + 1), JSON.stringify(prev)])
    setRedoStack([])
  }, [])

  const commit = useCallback(
    (next: FormaSheet) => {
      pushHistory(sheet)
      onChange(next)
    },
    [sheet, onChange, pushHistory],
  )

  const undo = useCallback(() => {
    if (!history.length) return
    const prev = history[history.length - 1]!
    setHistory((h) => h.slice(0, -1))
    setRedoStack((r) => [...r, JSON.stringify(sheet)])
    onChange(JSON.parse(prev) as FormaSheet)
  }, [history, sheet, onChange])

  const redo = useCallback(() => {
    if (!redoStack.length) return
    const next = redoStack[redoStack.length - 1]!
    setRedoStack((r) => r.slice(0, -1))
    setHistory((h) => [...h, JSON.stringify(sheet)])
    onChange(JSON.parse(next) as FormaSheet)
  }, [redoStack, sheet, onChange])

  const updateCellRaw = (r: number, c: number, raw: string) => {
    const cells = { ...sheet.cells }
    const k = cellKey(r, c)
    const prev = cells[k] || { raw: '', style: defaultStyle() }
    cells[k] = { ...prev, raw }
    commit({ ...sheet, cells, updatedAt: Date.now() })
  }

  const finishEdit = () => {
    if (editing) {
      updateCellRaw(editing.r, editing.c, editVal)
      setEditing(null)
    }
  }

  const applyStyle = (style: Partial<SheetCellStyle>) => {
    if (!selection || readOnly) return
    commit(applyStyleToRange(sheet, selection.r1, selection.c1, selection.r2, selection.c2, style))
  }

  const toggleStyle = (key: keyof SheetCellStyle) => {
    const cur = computed[activeKey]?.style?.[key]
    applyStyle({ [key]: !cur })
  }

  const selectCell = (r: number, c: number, extend = false) => {
    if (extend && selection) {
      setSel({ r1: selection.r1, c1: selection.c1, r2: r, c2: c })
    } else {
      setSel({ r1: r, c1: c, r2: r, c2: c })
    }
  }

  const isSelected = (r: number, c: number) => {
    if (!selection) return false
    return r >= selection.r1 && r <= selection.r2 && c >= selection.c1 && c <= selection.c2
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (readOnly) return
    const mod = e.ctrlKey || e.metaKey
    if (mod && e.key === 'z') {
      e.preventDefault()
      undo()
      return
    }
    if (mod && e.key === 'y') {
      e.preventDefault()
      redo()
      return
    }
    if (mod && e.key === 'c' && selection) {
      setClipboard(copyRange(sheet, selection.r1, selection.c1, selection.r2, selection.c2))
      return
    }
    if (mod && e.key === 'v' && clipboard && selection) {
      commit(pasteRange(sheet, selection.r1, selection.c1, clipboard))
      return
    }
    if (editing) return
    if (e.key === 'Enter') {
      e.preventDefault()
      setEditing({ r: activeCell.r, c: activeCell.c })
      setEditVal(computed[activeKey]?.raw ?? '')
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      selectCell(Math.min(sheet.rows - 1, activeCell.r + 1), activeCell.c)
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      selectCell(Math.max(0, activeCell.r - 1), activeCell.c)
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      selectCell(activeCell.r, Math.min(sheet.cols - 1, activeCell.c + 1))
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      selectCell(activeCell.r, Math.max(0, activeCell.c - 1))
    }
    if (e.key.length === 1 && !mod) {
      setEditing({ r: activeCell.r, c: activeCell.c })
      setEditVal(e.key)
    }
  }

  const searchHits = useMemo(() => {
    if (!tableSearch.trim()) return new Set<string>()
    const q = tableSearch.toLowerCase()
    const hits = new Set<string>()
    Object.entries(computed).forEach(([k, cell]) => {
      if (String(cell.value).toLowerCase().includes(q)) hits.add(k)
    })
    return hits
  }, [computed, tableSearch])

  const tableWidth = ROW_HDR_W + sheet.colWidths.reduce((a, b) => a + b, 0)

  const toolbarBtn = (label: string, onClick: () => void, active = false) => (
    <button
      key={label}
      type="button"
      disabled={readOnly}
      onClick={onClick}
      className={`px-2 py-1 text-xs border rounded-lg min-w-[2rem] ${
        active ? 'border-forma-accent bg-forma-accent/10 font-semibold' : 'hover:bg-white/40'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="flex flex-col h-full min-h-0 outline-none" tabIndex={0} onKeyDown={handleKeyDown}>
      {!readOnly && (
        <div className="flex flex-wrap gap-1 mb-2 p-2 forma-glass-panel rounded-xl border border-forma-border/40">
          {toolbarBtn('↶', undo)}
          {toolbarBtn('↷', redo)}
          {toolbarBtn('B', () => toggleStyle('bold'), !!computed[activeKey]?.style?.bold)}
          {toolbarBtn('I', () => toggleStyle('italic'), !!computed[activeKey]?.style?.italic)}
          {toolbarBtn('U', () => toggleStyle('underline'), !!computed[activeKey]?.style?.underline)}
          <select
            value={computed[activeKey]?.style?.fontSize || 12}
            onChange={(e) => applyStyle({ fontSize: parseInt(e.target.value, 10) })}
            className="text-xs border rounded-lg px-1"
          >
            {FONT_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}px
              </option>
            ))}
          </select>
          {toolbarBtn('+ ligne', () => commit(addRow(sheet, sheet.rows)))}
          {toolbarBtn('− ligne', () => selection && commit(deleteRow(sheet, selection.r1)))}
          {toolbarBtn('+ col', () => commit(addCol(sheet, sheet.cols)))}
          {toolbarBtn('− col', () => selection && commit(deleteCol(sheet, selection.c1)))}
          {toolbarBtn('Fusion', () =>
            selection &&
            commit(mergeCells(sheet, selection.r1, selection.c1, selection.r2, selection.c2)),
          )}
          {toolbarBtn('Séparer', () => selection && commit(unmergeAt(sheet, selection.r1, selection.c1)))}
          {toolbarBtn('A→Z', () => selection && commit(sortByColumn(sheet, selection.c1, 'asc')))}
          {toolbarBtn('?', () => setFormulaHelp((v) => !v), formulaHelp)}
          <input
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
            placeholder="Chercher…"
            className="ml-auto border rounded-lg px-2 py-1 text-xs w-28"
          />
        </div>
      )}

      <SpreadsheetFormulaHelp open={formulaHelp && !readOnly} onClose={() => setFormulaHelp(false)} />

      {!readOnly && (
        <div className="flex items-center gap-2 mb-2 text-xs">
          <span className="font-mono text-forma-accent font-bold min-w-[2.5rem]">{activeKey}</span>
          <input
            value={formulaBar}
            onChange={(e) => setFormulaBar(e.target.value)}
            onBlur={() => updateCellRaw(activeCell.r, activeCell.c, formulaBar)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                updateCellRaw(activeCell.r, activeCell.c, formulaBar)
                ;(e.target as HTMLInputElement).blur()
              }
            }}
            placeholder="=SOMME(A1:A5)"
            className="flex-1 border rounded-lg px-2 py-1 font-mono text-sm"
          />
        </div>
      )}

      <div
        ref={wrapRef}
        className="flex-1 overflow-auto border border-forma-border/50 rounded-xl bg-white min-h-[400px]"
      >
        <table
          className="border-separate border-spacing-0 table-fixed"
          style={{ width: tableWidth, minWidth: tableWidth }}
        >
          <thead>
            <tr>
              <th
                className="sticky top-0 left-0 z-20 bg-neutral-100 border-b border-r border-neutral-200"
                style={{ width: ROW_HDR_W, height: COL_HDR_H }}
              />
              {Array.from({ length: sheet.cols }, (_, c) => (
                <th
                  key={c}
                  className="sticky top-0 z-10 bg-neutral-100 border-b border-r border-neutral-200 text-xs font-bold"
                  style={{ width: sheet.colWidths[c], height: COL_HDR_H }}
                  onMouseDown={(e) => {
                    if (readOnly) return
                    e.preventDefault()
                    setSel({ r1: 0, c1: c, r2: sheet.rows - 1, c2: c })
                  }}
                >
                  {colToLetter(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: sheet.rows }, (_, r) => (
              <tr key={r} style={{ height: sheet.rowHeights[r] }}>
                <td
                  className="sticky left-0 z-10 bg-neutral-100 border-b border-r border-neutral-200 text-center text-[10px] text-neutral-500 font-semibold"
                  style={{ width: ROW_HDR_W }}
                  onMouseDown={(e) => {
                    if (readOnly) return
                    e.preventDefault()
                    setSel({ r1: r, c1: 0, r2: r, c2: sheet.cols - 1 })
                  }}
                >
                  {r + 1}
                </td>
                {Array.from({ length: sheet.cols }, (_, c) => {
                  if (isMergeHidden(sheet, r, c)) return null
                  const m = getMergeAt(sheet, r, c)
                  const k = cellKey(r, c)
                  const cell = computed[k] || { value: '', raw: '', style: defaultStyle() }
                  const selected = isSelected(r, c)
                  const hit = searchHits.has(k)
                  const isEdit = editing?.r === r && editing?.c === c
                  const cellW = m ? sumColWidths(sheet.colWidths, m.c1, m.c2) : sheet.colWidths[c]
                  const cellH = m ? sumRowHeights(sheet.rowHeights, m.r1, m.r2) : sheet.rowHeights[r]

                  return (
                    <td
                      key={c}
                      rowSpan={m ? m.r2 - m.r1 + 1 : 1}
                      colSpan={m ? m.c2 - m.c1 + 1 : 1}
                      onMouseDown={(e) => {
                        if (readOnly || e.button !== 0) return
                        e.preventDefault()
                        dragRef.current = { r, c }
                        selectCell(r, c, e.shiftKey)
                      }}
                      onMouseEnter={() => {
                        if (!dragRef.current || readOnly) return
                        setSel({
                          r1: dragRef.current.r,
                          c1: dragRef.current.c,
                          r2: r,
                          c2: c,
                        })
                      }}
                      onDoubleClick={() => {
                        if (!readOnly) {
                          setEditing({ r, c })
                          setEditVal(cell.raw ?? '')
                        }
                      }}
                      className={`border-b border-r border-neutral-200 p-0 align-middle ${
                        selected ? 'bg-forma-accent/10' : hit ? 'bg-yellow-50' : ''
                      } ${activeCell.r === r && activeCell.c === c ? 'ring-2 ring-inset ring-forma-accent' : ''}`}
                      style={{
                        width: cellW,
                        minWidth: cellW,
                        maxWidth: cellW,
                        height: cellH,
                        fontWeight: cell.style?.bold ? 700 : 400,
                        fontStyle: cell.style?.italic ? 'italic' : 'normal',
                        textDecoration: cell.style?.underline ? 'underline' : 'none',
                        fontSize: cell.style?.fontSize || 12,
                        color: cell.style?.color || '#000',
                        textAlign: cell.style?.alignH || 'left',
                      }}
                    >
                      {isEdit ? (
                        <input
                          autoFocus
                          value={editVal}
                          onChange={(e) => setEditVal(e.target.value)}
                          onBlur={finishEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') finishEdit()
                            if (e.key === 'Escape') setEditing(null)
                          }}
                          className="w-full h-full border-none outline-none px-1 text-sm bg-white"
                        />
                      ) : (
                        <div className="px-1 py-0.5 truncate">{cell.value}</div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
