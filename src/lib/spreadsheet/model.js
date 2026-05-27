import { cellKey, defaultStyle, parseCellKey } from './cells'

const DEFAULT_ROWS = 20
const DEFAULT_COLS = 8
const DEFAULT_ROW_H = 28
const DEFAULT_COL_W = 96

export function createSheet(name = 'Nouveau tableau') {
  const now = Date.now()
  return {
    id: `sheet_${now}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    createdAt: now,
    updatedAt: now,
    rows: DEFAULT_ROWS,
    cols: DEFAULT_COLS,
    rowHeights: Array(DEFAULT_ROWS).fill(DEFAULT_ROW_H),
    colWidths: Array(DEFAULT_COLS).fill(DEFAULT_COL_W),
    cells: {},
    merges: [],
    freezeRow: 0,
    freezeCol: 0,
    filterCol: null,
    filterText: '',
    sortCol: null,
    sortDir: 'asc',
  }
}

export function cloneSheet(sheet, { name } = {}) {
  const now = Date.now()
  return {
    ...JSON.parse(JSON.stringify(sheet)),
    id: `sheet_${now}_${Math.random().toString(36).slice(2, 8)}`,
    name: name || `${sheet.name} (copie)`,
    createdAt: now,
    updatedAt: now,
  }
}

export function getCell(sheet, row, col) {
  const k = cellKey(row, col)
  const raw = sheet.cells[k]
  if (!raw) return { raw: '', value: '', style: defaultStyle() }
  return {
    raw: raw.raw ?? raw.v ?? '',
    value: raw.value ?? raw.raw ?? raw.v ?? '',
    style: { ...defaultStyle(), ...(raw.style || {}) },
  }
}

export function setCell(sheet, row, col, patch) {
  const k = cellKey(row, col)
  const prev = sheet.cells[k] || { raw: '', style: defaultStyle() }
  const next = {
    raw: patch.raw !== undefined ? patch.raw : prev.raw,
    style: patch.style ? { ...defaultStyle(), ...prev.style, ...patch.style } : { ...defaultStyle(), ...prev.style },
  }
  if (!next.raw && JSON.stringify(next.style) === JSON.stringify(defaultStyle())) {
    delete sheet.cells[k]
  } else {
    sheet.cells[k] = next
  }
  sheet.updatedAt = Date.now()
  return sheet
}

export function addRow(sheet, at = sheet.rows) {
  const idx = Math.max(0, Math.min(at, sheet.rows))
  const newHeights = [...sheet.rowHeights]
  newHeights.splice(idx, 0, DEFAULT_ROW_H)
  const newCells = {}
  Object.entries(sheet.cells).forEach(([k, v]) => {
    const p = parseCellKey(k)
    if (!p) return
    if (p.row >= idx) newCells[cellKey(p.row + 1, p.col)] = v
    else newCells[k] = v
  })
  const newMerges = sheet.merges.map((m) => ({
    ...m,
    r1: m.r1 >= idx ? m.r1 + 1 : m.r1,
    r2: m.r2 >= idx ? m.r2 + 1 : m.r2,
  }))
  return {
    ...sheet,
    rows: sheet.rows + 1,
    rowHeights: newHeights,
    cells: newCells,
    merges: newMerges,
    updatedAt: Date.now(),
  }
}

export function deleteRow(sheet, at) {
  if (sheet.rows <= 1) return sheet
  const newHeights = sheet.rowHeights.filter((_, i) => i !== at)
  const newCells = {}
  Object.entries(sheet.cells).forEach(([k, v]) => {
    const p = parseCellKey(k)
    if (!p || p.row === at) return
    newCells[cellKey(p.row > at ? p.row - 1 : p.row, p.col)] = v
  })
  const newMerges = sheet.merges
    .filter((m) => !(m.r1 <= at && m.r2 >= at))
    .map((m) => ({
      ...m,
      r1: m.r1 > at ? m.r1 - 1 : m.r1,
      r2: m.r2 > at ? m.r2 - 1 : m.r2,
    }))
  return {
    ...sheet,
    rows: sheet.rows - 1,
    rowHeights: newHeights,
    cells: newCells,
    merges: newMerges,
    updatedAt: Date.now(),
  }
}

export function addCol(sheet, at = sheet.cols) {
  const idx = Math.max(0, Math.min(at, sheet.cols))
  const newWidths = [...sheet.colWidths]
  newWidths.splice(idx, 0, DEFAULT_COL_W)
  const newCells = {}
  Object.entries(sheet.cells).forEach(([k, v]) => {
    const p = parseCellKey(k)
    if (!p) return
    if (p.col >= idx) newCells[cellKey(p.row, p.col + 1)] = v
    else newCells[k] = v
  })
  const newMerges = sheet.merges.map((m) => ({
    ...m,
    c1: m.c1 >= idx ? m.c1 + 1 : m.c1,
    c2: m.c2 >= idx ? m.c2 + 1 : m.c2,
  }))
  return {
    ...sheet,
    cols: sheet.cols + 1,
    colWidths: newWidths,
    cells: newCells,
    merges: newMerges,
    updatedAt: Date.now(),
  }
}

export function deleteCol(sheet, at) {
  if (sheet.cols <= 1) return sheet
  const newWidths = sheet.colWidths.filter((_, i) => i !== at)
  const newCells = {}
  Object.entries(sheet.cells).forEach(([k, v]) => {
    const p = parseCellKey(k)
    if (!p || p.col === at) return
    newCells[cellKey(p.row, p.col > at ? p.col - 1 : p.col)] = v
  })
  const newMerges = sheet.merges
    .filter((m) => !(m.c1 <= at && m.c2 >= at))
    .map((m) => ({
      ...m,
      c1: m.c1 > at ? m.c1 - 1 : m.c1,
      c2: m.c2 > at ? m.c2 - 1 : m.c2,
    }))
  return {
    ...sheet,
    cols: sheet.cols - 1,
    colWidths: newWidths,
    cells: newCells,
    merges: newMerges,
    updatedAt: Date.now(),
  }
}

export function swapRows(sheet, a, b) {
  if (a === b) return sheet
  const swapCellRows = (cells) => {
    const out = {}
    Object.entries(cells).forEach(([k, v]) => {
      const p = parseCellKey(k)
      if (!p) return
      let row = p.row
      if (row === a) row = b
      else if (row === b) row = a
      out[cellKey(row, p.col)] = v
    })
    return out
  }
  const heights = [...sheet.rowHeights]
  ;[heights[a], heights[b]] = [heights[b], heights[a]]
  return { ...sheet, rowHeights: heights, cells: swapCellRows(sheet.cells), updatedAt: Date.now() }
}

export function swapCols(sheet, a, b) {
  if (a === b) return sheet
  const swapCellCols = (cells) => {
    const out = {}
    Object.entries(cells).forEach(([k, v]) => {
      const p = parseCellKey(k)
      if (!p) return
      let col = p.col
      if (col === a) col = b
      else if (col === b) col = a
      out[cellKey(p.row, col)] = v
    })
    return out
  }
  const widths = [...sheet.colWidths]
  ;[widths[a], widths[b]] = [widths[b], widths[a]]
  return { ...sheet, colWidths: widths, cells: swapCellCols(sheet.cells), updatedAt: Date.now() }
}

export function mergeCells(sheet, r1, c1, r2, c2) {
  const a = { r1: Math.min(r1, r2), c1: Math.min(c1, c2), r2: Math.max(r1, r2), c2: Math.max(c1, c2) }
  const k = cellKey(a.r1, a.c1)
  const master = sheet.cells[k] || { raw: '', style: defaultStyle() }
  const texts = []
  for (let r = a.r1; r <= a.r2; r++) {
    for (let c = a.c1; c <= a.c2; c++) {
      const key = cellKey(r, c)
      const raw = sheet.cells[key]?.raw
      if (raw?.trim()) texts.push(raw.trim())
    }
  }
  const combinedRaw = master.raw?.trim() || texts.join(' ')
  const mergedMaster = { ...master, raw: combinedRaw }
  const cells = { ...sheet.cells }
  for (let r = a.r1; r <= a.r2; r++) {
    for (let c = a.c1; c <= a.c2; c++) {
      const key = cellKey(r, c)
      if (r === a.r1 && c === a.c1) cells[key] = mergedMaster
      else delete cells[key]
    }
  }
  const merges = [...sheet.merges.filter((m) => !rangesOverlap(m, a)), a]
  return { ...sheet, cells, merges, updatedAt: Date.now() }
}

export function unmergeAt(sheet, row, col) {
  const m = sheet.merges.find((mg) => row >= mg.r1 && row <= mg.r2 && col >= mg.c1 && col <= mg.c2)
  if (!m) return sheet
  return { ...sheet, merges: sheet.merges.filter((mg) => mg !== m), updatedAt: Date.now() }
}

function rangesOverlap(a, b) {
  return !(a.r2 < b.r1 || a.r1 > b.r2 || a.c2 < b.c1 || a.c1 > b.c2)
}

export function getMergeAt(sheet, row, col) {
  return sheet.merges.find((m) => row >= m.r1 && row <= m.r2 && col >= m.c1 && col <= m.c2) || null
}

export function isMergeHidden(sheet, row, col) {
  const m = getMergeAt(sheet, row, col)
  if (!m) return false
  return !(row === m.r1 && col === m.c1)
}

export function applyStyleToRange(sheet, r1, c1, r2, c2, style) {
  let next = { ...sheet, cells: { ...sheet.cells } }
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      if (isMergeHidden(next, r, c)) continue
      const k = cellKey(r, c)
      const prev = next.cells[k] || { raw: '', style: defaultStyle() }
      next.cells[k] = { ...prev, style: { ...defaultStyle(), ...prev.style, ...style } }
    }
  }
  next.updatedAt = Date.now()
  return next
}

export function copyRange(sheet, r1, c1, r2, c2) {
  const data = []
  for (let r = r1; r <= r2; r++) {
    const row = []
    for (let c = c1; c <= c2; c++) {
      const k = cellKey(r, c)
      row.push(sheet.cells[k] ? JSON.parse(JSON.stringify(sheet.cells[k])) : null)
    }
    data.push(row)
  }
  return { data, rows: r2 - r1 + 1, cols: c2 - c1 + 1 }
}

export function pasteRange(sheet, startRow, startCol, clip) {
  if (!clip?.data) return sheet
  let next = { ...sheet, cells: { ...sheet.cells } }
  clip.data.forEach((row, ri) => {
    row.forEach((cell, ci) => {
      const r = startRow + ri
      const c = startCol + ci
      if (r >= next.rows || c >= next.cols) return
      const k = cellKey(r, c)
      if (cell) next.cells[k] = JSON.parse(JSON.stringify(cell))
      else delete next.cells[k]
    })
  })
  next.updatedAt = Date.now()
  return next
}

export function sortByColumn(sheet, col, dir = 'asc') {
  const indices = Array.from({ length: sheet.rows }, (_, i) => i)
  const val = (row) => {
    const c = getCell(sheet, row, col)
    const n = parseFloat(String(c.value).replace(',', '.'))
    if (!Number.isNaN(n) && String(c.value).trim() !== '') return n
    return String(c.value).toLowerCase()
  }
  indices.sort((a, b) => {
    const va = val(a)
    const vb = val(b)
    if (typeof va === 'number' && typeof vb === 'number') return dir === 'asc' ? va - vb : vb - va
    const cmp = String(va).localeCompare(String(vb), 'fr')
    return dir === 'asc' ? cmp : -cmp
  })
  let next = { ...sheet, cells: {}, merges: [] }
  const newHeights = indices.map((i) => sheet.rowHeights[i])
  indices.forEach((srcRow, dstRow) => {
    for (let c = 0; c < sheet.cols; c++) {
      const k = cellKey(srcRow, c)
      if (sheet.cells[k]) next.cells[cellKey(dstRow, c)] = JSON.parse(JSON.stringify(sheet.cells[k]))
    }
  })
  next.rowHeights = newHeights
  next.sortCol = col
  next.sortDir = dir
  next.updatedAt = Date.now()
  return next
}

export function autoFitCol(sheet, col) {
  const widths = [...sheet.colWidths]
  let max = 48
  for (let r = 0; r < sheet.rows; r++) {
    const c = getCell(sheet, r, col)
    max = Math.max(max, Math.min(280, String(c.value || c.raw || '').length * 8 + 24))
  }
  widths[col] = max
  return { ...sheet, colWidths: widths, updatedAt: Date.now() }
}

export function autoFitRow(sheet, row) {
  const heights = [...sheet.rowHeights]
  let max = 28
  for (let c = 0; c < sheet.cols; c++) {
    const cell = getCell(sheet, row, c)
    const len = String(cell.value || cell.raw || '').length
    if (len > 30) max = Math.max(max, 40)
    if (len > 80) max = Math.max(max, 56)
  }
  heights[row] = max
  return { ...sheet, rowHeights: heights, updatedAt: Date.now() }
}

export function applyArchTablePreset(sheet) {
  let next = { ...sheet }
  for (let c = 0; c < next.cols; c++) {
    const k = cellKey(0, c)
    next.cells[k] = {
      raw: getCell(next, 0, c).raw || `Col ${c + 1}`,
      style: { ...defaultStyle(), bold: true, bg: '#e8eef4', alignH: 'center', format: 'title' },
    }
  }
  for (let r = 1; r < next.rows; r++) {
    for (let c = 0; c < next.cols; c++) {
      const k = cellKey(r, c)
      const prev = next.cells[k] || { raw: '', style: defaultStyle() }
      next.cells[k] = {
        ...prev,
        style: { ...defaultStyle(), ...prev.style, border: true, alignH: c === 0 ? 'left' : 'center' },
      }
    }
  }
  next.updatedAt = Date.now()
  return next
}
