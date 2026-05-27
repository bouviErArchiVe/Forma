import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { colToLetter, cellKey, defaultStyle } from '@/lib/spreadsheet/cells'
import { computeSheet } from '@/lib/spreadsheet/formulas'
import {
  addRow, deleteRow, addCol, deleteCol,
  mergeCells, unmergeAt, getMergeAt, isMergeHidden,
  applyStyleToRange, copyRange, pasteRange, sortByColumn,
  autoFitCol, autoFitRow, applyArchTablePreset,
} from '@/lib/spreadsheet/model'
import SpreadsheetFormulaHelp from '@/components/spreadsheet/SpreadsheetFormulaHelp'

const MAX_HISTORY = 50
const ROW_HDR_W = 40
const COL_HDR_H = 26
const FONT_SIZES = [10, 11, 12, 13, 14, 16, 18]

function normalizeSelection(sel) {
  if (!sel) return null
  return {
    r1: Math.min(sel.r1, sel.r2),
    c1: Math.min(sel.c1, sel.c2),
    r2: Math.max(sel.r1, sel.r2),
    c2: Math.max(sel.c1, sel.c2),
  }
}

function cellTextColor(style, fallback = '#000000') {
  return style?.color && style.color !== '#1c1c24' ? style.color : (style?.color || fallback)
}

export default function SpreadsheetGrid({ sheet, onChange, T, readOnly = false, gridRef }) {
  const [sel, setSel] = useState({ r1: 0, c1: 0, r2: 0, c2: 0 })
  const [editing, setEditing] = useState(null)
  const [editVal, setEditVal] = useState('')
  const [formulaBar, setFormulaBar] = useState('')
  const [clipboard, setClipboard] = useState(null)
  const [history, setHistory] = useState([])
  const [redo, setRedo] = useState([])
  const [tableSearch, setTableSearch] = useState('')
  const [resizing, setResizing] = useState(null)
  const [formulaHelp, setFormulaHelp] = useState(false)
  const dragRef = useRef(null)
  const internalRef = useRef(null)
  const tableWrapRef = gridRef || internalRef

  const computed = useMemo(() => computeSheet(sheet), [sheet])
  const selection = normalizeSelection(sel)

  const tableWidth = useMemo(
    () => ROW_HDR_W + sheet.colWidths.reduce((a, b) => a + b, 0),
    [sheet.colWidths],
  )

  const pushHistory = useCallback((prev) => {
    setHistory((h) => [...h.slice(-MAX_HISTORY + 1), JSON.stringify(prev)])
    setRedo([])
  }, [])

  const commit = useCallback((next) => {
    pushHistory(sheet)
    onChange(next)
  }, [sheet, onChange, pushHistory])

  const undo = useCallback(() => {
    if (!history.length) return
    const prev = history[history.length - 1]
    setHistory((h) => h.slice(0, -1))
    setRedo((r) => [...r, JSON.stringify(sheet)])
    onChange(JSON.parse(prev))
  }, [history, sheet, onChange])

  const redoAction = useCallback(() => {
    if (!redo.length) return
    const next = redo[redo.length - 1]
    setRedo((r) => r.slice(0, -1))
    setHistory((h) => [...h, JSON.stringify(sheet)])
    onChange(JSON.parse(next))
  }, [redo, sheet, onChange])

  const activeCell = selection ? { r: selection.r1, c: selection.c1 } : { r: 0, c: 0 }
  const activeKey = cellKey(activeCell.r, activeCell.c)

  useEffect(() => {
    const c = computed[activeKey]
    setFormulaBar(c?.raw ?? '')
  }, [activeKey, computed])

  useEffect(() => {
    const onUp = () => { dragRef.current = null }
    window.addEventListener('mouseup', onUp)
    return () => window.removeEventListener('mouseup', onUp)
  }, [])

  const selectCell = (r, c, extend = false) => {
    if (extend && selection) {
      setSel({ r1: selection.r1, c1: selection.c1, r2: r, c2: c })
    } else {
      setSel({ r1: r, c1: c, r2: r, c2: c })
    }
  }

  const isSelected = (r, c) => {
    if (!selection) return false
    return r >= selection.r1 && r <= selection.r2 && c >= selection.c1 && c <= selection.c2
  }

  const isActiveCell = (r, c) => selection && r === selection.r1 && c === selection.c1

  const selectionEdge = (r, c) => {
    if (!selection || !isSelected(r, c)) return {}
    return {
      borderTop: r === selection.r1 ? `2px solid ${T.accent}` : undefined,
      borderBottom: r === selection.r2 ? `2px solid ${T.accent}` : undefined,
      borderLeft: c === selection.c1 ? `2px solid ${T.accent}` : undefined,
      borderRight: c === selection.c2 ? `2px solid ${T.accent}` : undefined,
    }
  }

  const rowVisible = (r) => {
    if (sheet.filterCol === null || sheet.filterCol === undefined || !sheet.filterText) return true
    const v = computed[cellKey(r, sheet.filterCol)]?.value ?? ''
    return String(v).toLowerCase().includes(String(sheet.filterText).toLowerCase())
  }

  const updateCellRaw = (r, c, raw) => {
    let next = { ...sheet, cells: { ...sheet.cells } }
    const k = cellKey(r, c)
    const prev = next.cells[k] || { raw: '', style: defaultStyle() }
    next.cells[k] = { ...prev, raw }
    commit(next)
  }

  const finishEdit = () => {
    if (editing) {
      updateCellRaw(editing.r, editing.c, editVal)
      setEditing(null)
    }
  }

  const applyStyle = (style) => {
    if (!selection || readOnly) return
    commit(applyStyleToRange(sheet, selection.r1, selection.c1, selection.r2, selection.c2, style))
  }

  const toggleStyle = (key) => {
    const cur = computed[activeKey]?.style?.[key]
    applyStyle({ [key]: !cur })
  }

  const handleKeyDown = (e) => {
    if (readOnly) return
    const mod = e.ctrlKey || e.metaKey
    if (mod && e.key === 'z') { e.preventDefault(); undo(); return }
    if (mod && e.key === 'y') { e.preventDefault(); redoAction(); return }
    if (mod && e.key === 'c' && selection) {
      setClipboard(copyRange(sheet, selection.r1, selection.c1, selection.r2, selection.c2))
      return
    }
    if (mod && e.key === 'x' && selection) {
      setClipboard(copyRange(sheet, selection.r1, selection.c1, selection.r2, selection.c2))
      commit(pasteRange(sheet, selection.r1, selection.c1, {
        data: Array.from({ length: selection.r2 - selection.r1 + 1 }, () => Array(selection.c2 - selection.c1 + 1).fill(null)),
      }))
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
    if (e.key === 'ArrowDown') { e.preventDefault(); selectCell(Math.min(sheet.rows - 1, activeCell.r + 1), activeCell.c) }
    if (e.key === 'ArrowUp') { e.preventDefault(); selectCell(Math.max(0, activeCell.r - 1), activeCell.c) }
    if (e.key === 'ArrowRight') { e.preventDefault(); selectCell(activeCell.r, Math.min(sheet.cols - 1, activeCell.c + 1)) }
    if (e.key === 'ArrowLeft') { e.preventDefault(); selectCell(activeCell.r, Math.max(0, activeCell.c - 1)) }
    if (e.key.length === 1 && !mod) {
      setEditing({ r: activeCell.r, c: activeCell.c })
      setEditVal(e.key)
    }
  }

  const onCellMouseDown = (r, c, e) => {
    if (readOnly || e.button !== 0) return
    e.preventDefault()
    dragRef.current = { r, c }
    selectCell(r, c, e.shiftKey)
  }

  const onCellMouseEnter = (r, c) => {
    if (!dragRef.current || readOnly) return
    setSel({ r1: dragRef.current.r, c1: dragRef.current.c, r2: r, c2: c })
  }

  const startColResize = (col, e) => {
    e.preventDefault()
    e.stopPropagation()
    setResizing({ type: 'col', index: col, startX: e.clientX, startW: sheet.colWidths[col] })
  }

  const startRowResize = (row, e) => {
    e.preventDefault()
    e.stopPropagation()
    setResizing({ type: 'row', index: row, startY: e.clientY, startH: sheet.rowHeights[row] })
  }

  useEffect(() => {
    if (!resizing) return
    const onMove = (e) => {
      if (resizing.type === 'col') {
        const w = Math.max(40, resizing.startW + (e.clientX - resizing.startX))
        onChange({ ...sheet, colWidths: sheet.colWidths.map((cw, i) => (i === resizing.index ? w : cw)), updatedAt: Date.now() })
      } else {
        const h = Math.max(22, resizing.startH + (e.clientY - resizing.startY))
        onChange({ ...sheet, rowHeights: sheet.rowHeights.map((rh, i) => (i === resizing.index ? h : rh)), updatedAt: Date.now() })
      }
    }
    const onUp = () => setResizing(null)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [resizing, sheet, onChange])

  const searchHits = useMemo(() => {
    if (!tableSearch.trim()) return new Set()
    const q = tableSearch.toLowerCase()
    const hits = new Set()
    Object.entries(computed).forEach(([k, cell]) => {
      if (String(cell.value).toLowerCase().includes(q)) hits.add(k)
    })
    return hits
  }, [computed, tableSearch])

  const hdrBg = T.surface || '#eef1f5'
  const gridBg = '#ffffff'
  const gridBorder = T.border || '#ccd3dc'

  const btn = (label, onClick, active = false, title = '') => (
    <button type="button" title={title} onClick={onClick} disabled={readOnly} style={{
      padding: '5px 8px', fontSize: 11, borderRadius: 6, cursor: readOnly ? 'default' : 'pointer',
      border: `1px solid ${active ? T.accent : T.border}`, background: active ? `${T.accent}18` : T.bg,
      color: T.ink, fontWeight: active ? 700 : 500,
    }}>{label}</button>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }} tabIndex={0} onKeyDown={handleKeyDown}>
      {!readOnly && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 0', borderBottom: `1px solid ${T.border}`, alignItems: 'center' }}>
          {btn('↶', undo, false, 'Annuler')}{btn('↷', redoAction, false, 'Rétablir')}
          {btn('B', () => toggleStyle('bold'), computed[activeKey]?.style?.bold, 'Gras')}
          {btn('I', () => toggleStyle('italic'), computed[activeKey]?.style?.italic, 'Italique')}
          {btn('U', () => toggleStyle('underline'), computed[activeKey]?.style?.underline, 'Souligné')}
          <select
            value={computed[activeKey]?.style?.fontSize || 12}
            onChange={(e) => applyStyle({ fontSize: parseInt(e.target.value, 10) })}
            disabled={readOnly}
            title="Taille police"
            style={{ padding: '4px 6px', fontSize: 11, borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, color: T.ink }}
          >
            {FONT_SIZES.map((s) => <option key={s} value={s}>{s}px</option>)}
          </select>
          {btn('⬅', () => applyStyle({ alignH: 'left' }))}
          {btn('⬌', () => applyStyle({ alignH: 'center' }))}
          {btn('➡', () => applyStyle({ alignH: 'right' }))}
          {btn('+ ligne', () => commit(addRow(sheet, sheet.rows)))}
          {btn('− ligne', () => selection && commit(deleteRow(sheet, selection.r1)))}
          {btn('+ col', () => commit(addCol(sheet, sheet.cols)))}
          {btn('− col', () => selection && commit(deleteCol(sheet, selection.c1)))}
          {btn('Fusionner', () => selection && commit(mergeCells(sheet, selection.r1, selection.c1, selection.r2, selection.c2)))}
          {btn('Séparer', () => selection && commit(unmergeAt(sheet, selection.r1, selection.c1)))}
          {btn('A→Z', () => selection && commit(sortByColumn(sheet, selection.c1, 'asc')))}
          {btn('Archi', () => commit(applyArchTablePreset(sheet)))}
          {btn('Aj. larg.', () => selection && commit(autoFitCol(sheet, selection.c1)))}
          {btn('? Formules', () => setFormulaHelp((v) => !v), formulaHelp, 'Aide formules')}
          <input
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
            placeholder="Chercher…"
            style={{ padding: '5px 8px', fontSize: 11, borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, color: T.ink, width: 100 }}
          />
        </div>
      )}

      <SpreadsheetFormulaHelp T={T} open={formulaHelp && !readOnly} onClose={() => setFormulaHelp(false)} />

      {!readOnly && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 12 }}>
          <span style={{ color: T.accent, fontWeight: 700, minWidth: 36, fontFamily: 'monospace' }}>{activeKey}</span>
          <input
            value={formulaBar}
            onChange={(e) => setFormulaBar(e.target.value)}
            onBlur={() => updateCellRaw(activeCell.r, activeCell.c, formulaBar)}
            onKeyDown={(e) => { if (e.key === 'Enter') { updateCellRaw(activeCell.r, activeCell.c, formulaBar); e.target.blur() } }}
            placeholder="=SOMME(A1:A5) ou texte…"
            style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, color: '#000', fontFamily: 'monospace', fontSize: 12 }}
          />
        </div>
      )}

      <div
        ref={tableWrapRef}
        style={{
          flex: 1, overflow: 'auto', border: `1px solid ${gridBorder}`, borderRadius: 8,
          background: gridBg, minHeight: 0, userSelect: 'none',
        }}
      >
        <table style={{ borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed', width: tableWidth, minWidth: tableWidth }}>
          <thead>
            <tr>
              <th
                style={{
                  width: ROW_HDR_W, minWidth: ROW_HDR_W, height: COL_HDR_H,
                  position: 'sticky', top: 0, left: 0, zIndex: 5,
                  background: hdrBg, borderBottom: `1px solid ${gridBorder}`, borderRight: `1px solid ${gridBorder}`,
                }}
              />
              {Array.from({ length: sheet.cols }, (_, c) => (
                <th
                  key={c}
                  onMouseDown={(e) => { if (!readOnly) { e.preventDefault(); setSel({ r1: 0, c1: c, r2: sheet.rows - 1, c2: c }) } }}
                  style={{
                    width: sheet.colWidths[c], minWidth: sheet.colWidths[c], height: COL_HDR_H,
                    position: 'sticky', top: 0, zIndex: 4,
                    background: hdrBg, borderBottom: `1px solid ${gridBorder}`, borderRight: `1px solid ${gridBorder}`,
                    fontSize: 11, fontWeight: 700, color: T.ink,
                    cursor: readOnly ? 'default' : 'pointer', userSelect: 'none',
                    boxShadow: '0 1px 0 rgba(0,0,0,.06)',
                  }}
                >
                  {colToLetter(c)}
                  {!readOnly && (
                    <span
                      onMouseDown={(e) => startColResize(c, e)}
                      style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 5, cursor: 'col-resize' }}
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: sheet.rows }, (_, r) => {
              if (!rowVisible(r)) return null
              return (
                <tr key={r} style={{ height: sheet.rowHeights[r] }}>
                  <td
                    onMouseDown={(e) => { if (!readOnly) { e.preventDefault(); setSel({ r1: r, c1: 0, r2: r, c2: sheet.cols - 1 }) } }}
                    style={{
                      width: ROW_HDR_W, minWidth: ROW_HDR_W, height: sheet.rowHeights[r],
                      textAlign: 'center', fontSize: 10, fontWeight: 600, color: T.muted,
                      background: hdrBg, borderBottom: `1px solid ${gridBorder}`, borderRight: `1px solid ${gridBorder}`,
                      cursor: readOnly ? 'default' : 'pointer', userSelect: 'none',
                      position: 'sticky', left: 0, zIndex: 3,
                    }}
                  >
                    {r + 1}
                    {!readOnly && (
                      <span onMouseDown={(e) => startRowResize(r, e)} style={{ display: 'block', height: 4, cursor: 'row-resize' }} />
                    )}
                  </td>
                  {Array.from({ length: sheet.cols }, (_, c) => {
                    if (isMergeHidden(sheet, r, c)) return null
                    const m = getMergeAt(sheet, r, c)
                    const k = cellKey(r, c)
                    const cell = computed[k] || { value: '', raw: '', style: defaultStyle() }
                    const selected = isSelected(r, c)
                    const active = isActiveCell(r, c)
                    const hit = searchHits.has(k)
                    const isEdit = editing?.r === r && editing?.c === c
                    const edges = selectionEdge(r, c)
                    return (
                      <td
                        key={c}
                        rowSpan={m ? m.r2 - m.r1 + 1 : 1}
                        colSpan={m ? m.c2 - m.c1 + 1 : 1}
                        onMouseDown={(e) => onCellMouseDown(r, c, e)}
                        onMouseEnter={() => onCellMouseEnter(r, c)}
                        onDoubleClick={() => { if (!readOnly) { setEditing({ r, c }); setEditVal(cell.raw ?? '') } }}
                        style={{
                          width: sheet.colWidths[c], minWidth: sheet.colWidths[c],
                          height: sheet.rowHeights[r],
                          padding: 0, borderBottom: `1px solid #e2e6ec`, borderRight: `1px solid #e2e6ec`,
                          background: hit ? '#fff8dc' : selected ? `${T.accent}14` : (cell.style?.bg || gridBg),
                          boxShadow: active ? `inset 0 0 0 2px ${T.accent}` : undefined,
                          ...edges,
                          fontWeight: cell.style?.bold ? 700 : 400,
                          fontStyle: cell.style?.italic ? 'italic' : 'normal',
                          textDecoration: cell.style?.underline ? 'underline' : 'none',
                          fontSize: cell.style?.fontSize || 12,
                          color: cellTextColor(cell.style, '#000000'),
                          textAlign: cell.style?.alignH || 'left',
                          verticalAlign: cell.style?.alignV || 'middle',
                          overflow: 'hidden', cursor: readOnly ? 'default' : 'cell',
                        }}
                      >
                        {isEdit ? (
                          <input
                            autoFocus
                            value={editVal}
                            onChange={(e) => setEditVal(e.target.value)}
                            onBlur={finishEdit}
                            onKeyDown={(e) => { if (e.key === 'Enter') finishEdit(); if (e.key === 'Escape') setEditing(null) }}
                            style={{
                              width: '100%', height: '100%', border: 'none', outline: 'none',
                              padding: '4px 6px', font: 'inherit', color: '#000', background: '#fff',
                              boxSizing: 'border-box',
                            }}
                          />
                        ) : (
                          <div style={{
                            padding: '4px 6px', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                            minHeight: sheet.rowHeights[r] - 2, color: 'inherit',
                          }}>
                            {cell.value}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
