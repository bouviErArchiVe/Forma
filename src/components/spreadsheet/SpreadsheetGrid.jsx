import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { colToLetter, cellKey, defaultStyle } from '@/lib/spreadsheet/cells'
import { computeSheet } from '@/lib/spreadsheet/formulas'
import {
  getCell, setCell, addRow, deleteRow, addCol, deleteCol,
  mergeCells, unmergeAt, getMergeAt, isMergeHidden,
  applyStyleToRange, copyRange, pasteRange, sortByColumn,
  swapRows, swapCols, autoFitCol, autoFitRow, applyArchTablePreset,
} from '@/lib/spreadsheet/model'

const MAX_HISTORY = 50

function normalizeSelection(sel) {
  if (!sel) return null
  return {
    r1: Math.min(sel.r1, sel.r2),
    c1: Math.min(sel.c1, sel.c2),
    r2: Math.max(sel.r1, sel.r2),
    c2: Math.max(sel.c1, sel.c2),
  }
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
  const internalRef = useRef(null)
  const tableWrapRef = gridRef || internalRef

  const computed = useMemo(() => computeSheet(sheet), [sheet])
  const selection = normalizeSelection(sel)

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

  const rowVisible = (r) => {
    if (sheet.filterCol === null || sheet.filterCol === undefined || !sheet.filterText) return true
    const v = computed[cellKey(r, sheet.filterCol)]?.value ?? ''
    return String(v).toLowerCase().includes(String(sheet.filterText).toLowerCase())
  }

  const updateCellRaw = (r, c, raw) => {
    let next = { ...sheet, cells: { ...sheet.cells } }
    next = setCell(next, r, c, { raw })
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
      let next = pasteRange(sheet, selection.r1, selection.c1, { data: selection && Array.from({ length: selection.r2 - selection.r1 + 1 }, () => Array(selection.c2 - selection.c1 + 1).fill(null)) })
      commit(next)
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
    if (e.key === 'ArrowDown') selectCell(Math.min(sheet.rows - 1, activeCell.r + 1), activeCell.c)
    if (e.key === 'ArrowUp') selectCell(Math.max(0, activeCell.r - 1), activeCell.c)
    if (e.key === 'ArrowRight') selectCell(activeCell.r, Math.min(sheet.cols - 1, activeCell.c + 1))
    if (e.key === 'ArrowLeft') selectCell(activeCell.r, Math.max(0, activeCell.c - 1))
    if (e.key.length === 1 && !mod) {
      setEditing({ r: activeCell.r, c: activeCell.c })
      setEditVal(e.key)
    }
  }

  const startColResize = (col, e) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startW = sheet.colWidths[col]
    setResizing({ type: 'col', index: col, startX, startW })
  }

  const startRowResize = (row, e) => {
    e.preventDefault()
    e.stopPropagation()
    const startY = e.clientY
    const startH = sheet.rowHeights[row]
    setResizing({ type: 'row', index: row, startY, startH })
  }

  useEffect(() => {
    if (!resizing) return
    const onMove = (e) => {
      if (resizing.type === 'col') {
        const w = Math.max(40, resizing.startW + (e.clientX - resizing.startX))
        const widths = [...sheet.colWidths]
        widths[resizing.index] = w
        onChange({ ...sheet, colWidths: widths, updatedAt: Date.now() })
      } else {
        const h = Math.max(22, resizing.startH + (e.clientY - resizing.startY))
        const heights = [...sheet.rowHeights]
        heights[resizing.index] = h
        onChange({ ...sheet, rowHeights: heights, updatedAt: Date.now() })
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

  const btn = (label, onClick, active = false) => (
    <button type="button" onClick={onClick} disabled={readOnly} style={{
      padding: '5px 8px', fontSize: 11, borderRadius: 6, cursor: readOnly ? 'default' : 'pointer',
      border: `1px solid ${active ? T.accent : T.border}`, background: active ? `${T.accent}18` : T.bg,
      color: T.ink, fontWeight: active ? 700 : 500,
    }}>{label}</button>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }} tabIndex={0} onKeyDown={handleKeyDown}>
      {!readOnly && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 0', borderBottom: `1px solid ${T.border}`, alignItems: 'center' }}>
          {btn('↶', undo)}{btn('↷', redoAction)}
          {btn('B', () => applyStyle({ bold: true }), computed[activeKey]?.style?.bold)}
          {btn('I', () => applyStyle({ italic: true }), computed[activeKey]?.style?.italic)}
          {btn('U', () => applyStyle({ underline: true }), computed[activeKey]?.style?.underline)}
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
          {btn('Z→A', () => selection && commit(sortByColumn(sheet, selection.c1, 'desc')))}
          {btn('Archi', () => commit(applyArchTablePreset(sheet)))}
          {btn('Aj. larg.', () => selection && commit(autoFitCol(sheet, selection.c1)))}
          {btn('Aj. haut.', () => selection && commit(autoFitRow(sheet, selection.r1)))}
          {btn('Gel L1', () => commit({ ...sheet, freezeRow: sheet.freezeRow ? 0 : 1 }))}
          {btn('Gel C1', () => commit({ ...sheet, freezeCol: sheet.freezeCol ? 0 : 1 }))}
          <input
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
            placeholder="Chercher…"
            style={{ padding: '5px 8px', fontSize: 11, borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, color: T.ink, width: 100 }}
          />
        </div>
      )}

      {!readOnly && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 12 }}>
          <span style={{ color: T.muted, fontWeight: 600 }}>{activeKey}</span>
          <input
            value={formulaBar}
            onChange={(e) => setFormulaBar(e.target.value)}
            onBlur={() => updateCellRaw(activeCell.r, activeCell.c, formulaBar)}
            onKeyDown={(e) => { if (e.key === 'Enter') { updateCellRaw(activeCell.r, activeCell.c, formulaBar); e.target.blur() } }}
            style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, color: T.ink, fontFamily: 'monospace' }}
          />
        </div>
      )}

      <div ref={tableWrapRef} style={{ flex: 1, overflow: 'auto', border: `1px solid ${T.border}`, borderRadius: 8, background: '#fff' }}>
        <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: '100%' }}>
          <thead>
            <tr>
              <th style={{ width: 36, position: sheet.freezeCol ? 'sticky' : 'static', left: 0, zIndex: 4, background: '#eef1f5', border: '1px solid #ccd3dc' }} />
              {Array.from({ length: sheet.cols }, (_, c) => (
                <th
                  key={c}
                  onClick={() => !readOnly && setSel({ r1: 0, c1: c, r2: sheet.rows - 1, c2: c })}
                  style={{
                    width: sheet.colWidths[c], minWidth: sheet.colWidths[c],
                    position: c < sheet.freezeCol ? 'sticky' : 'relative',
                    left: c < sheet.freezeCol ? 36 + sheet.colWidths.slice(0, c).reduce((a, b) => a + b, 0) : undefined,
                    top: 0,
                    zIndex: c < sheet.freezeCol ? 3 : 1,
                    background: '#eef1f5', border: '1px solid #ccd3dc', fontSize: 11, fontWeight: 700,
                    cursor: readOnly ? 'default' : 'pointer', userSelect: 'none',
                  }}
                >
                  {colToLetter(c)}
                  {!readOnly && (
                    <span onMouseDown={(e) => startColResize(c, e)} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 4, cursor: 'col-resize' }} />
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
                    onClick={() => !readOnly && setSel({ r1: r, c1: 0, r2: r, c2: sheet.cols - 1 })}
                    style={{
                      width: 36, textAlign: 'center', fontSize: 10, color: '#666',
                      background: '#eef1f5', border: '1px solid #ccd3dc', cursor: readOnly ? 'default' : 'pointer',
                      position: r < sheet.freezeRow ? 'sticky' : 'static',
                      top: r < sheet.freezeRow ? 28 : undefined,
                      left: 0, zIndex: r < sheet.freezeRow ? 3 : 1,
                    }}
                  >
                    {r + 1}
                    {!readOnly && (
                      <span onMouseDown={(e) => startRowResize(r, e)} style={{ display: 'block', height: 3, cursor: 'row-resize' }} />
                    )}
                  </td>
                  {Array.from({ length: sheet.cols }, (_, c) => {
                    if (isMergeHidden(sheet, r, c)) return null
                    const m = getMergeAt(sheet, r, c)
                    const k = cellKey(r, c)
                    const cell = computed[k] || { value: '', raw: '', style: defaultStyle() }
                    const selected = isSelected(r, c)
                    const hit = searchHits.has(k)
                    const isEdit = editing?.r === r && editing?.c === c
                    return (
                      <td
                        key={c}
                        rowSpan={m ? m.r2 - m.r1 + 1 : 1}
                        colSpan={m ? m.c2 - m.c1 + 1 : 1}
                        onClick={(e) => { if (!readOnly) selectCell(r, c, e.shiftKey) }}
                        onDoubleClick={() => { if (!readOnly) { setEditing({ r, c }); setEditVal(cell.raw ?? '') } }}
                        style={{
                          width: sheet.colWidths[c], maxWidth: sheet.colWidths[c],
                          padding: 0, border: '1px solid #d8dee6',
                          background: hit ? '#fff8dc' : (cell.style?.bg || '#fff'),
                          outline: selected ? `2px solid ${T.accent}` : 'none',
                          outlineOffset: -2,
                          fontWeight: cell.style?.bold ? 700 : 400,
                          fontStyle: cell.style?.italic ? 'italic' : 'normal',
                          textDecoration: cell.style?.underline ? 'underline' : 'none',
                          fontSize: cell.style?.fontSize || 11,
                          color: cell.style?.color || '#1c1c24',
                          textAlign: cell.style?.alignH || 'left',
                          verticalAlign: cell.style?.alignV || 'middle',
                          overflow: 'hidden',
                        }}
                      >
                        {isEdit ? (
                          <input
                            autoFocus
                            value={editVal}
                            onChange={(e) => setEditVal(e.target.value)}
                            onBlur={finishEdit}
                            onKeyDown={(e) => { if (e.key === 'Enter') finishEdit(); if (e.key === 'Escape') setEditing(null) }}
                            style={{ width: '100%', height: '100%', border: 'none', outline: 'none', padding: '4px 6px', font: 'inherit', background: 'transparent', boxSizing: 'border-box' }}
                          />
                        ) : (
                          <div style={{ padding: '4px 6px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', minHeight: sheet.rowHeights[r] - 2 }}>
                            {cell.style?.format === 'link' && cell.value ? (
                              <a href={String(cell.raw).startsWith('http') ? cell.raw : `https://${cell.raw}`} target="_blank" rel="noreferrer">{cell.value}</a>
                            ) : cell.value}
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
