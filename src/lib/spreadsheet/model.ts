import { createId } from '../id'
import type { FormaSheet, SheetCellData, SheetCellStyle } from '../../types'
import { cellKey, defaultStyle, parseCellKey } from './cells'

const DEFAULT_ROWS = 20
const DEFAULT_COLS = 26
const DEFAULT_ROW_H = 28
const DEFAULT_COL_W = 96

export function createSheet(name = 'Nouveau tableau'): FormaSheet {
  const now = Date.now()
  return {
    id: createId(),
    name,
    createdAt: now,
    updatedAt: now,
    rows: DEFAULT_ROWS,
    cols: DEFAULT_COLS,
    rowHeights: Array(DEFAULT_ROWS).fill(DEFAULT_ROW_H),
    colWidths: Array(DEFAULT_COLS).fill(DEFAULT_COL_W),
    cells: {},
    merges: [],
    sortCol: null,
    sortDir: 'asc',
    locked: false,
  }
}

export function cloneSheet(sheet: FormaSheet, name?: string): FormaSheet {
  const now = Date.now()
  return {
    ...structuredClone(sheet),
    id: createId(),
    name: name ?? `${sheet.name} (copie)`,
    createdAt: now,
    updatedAt: now,
  }
}

export function getCell(sheet: FormaSheet, row: number, col: number) {
  const k = cellKey(row, col)
  const raw = sheet.cells[k]
  if (!raw) return { raw: '', value: '', style: defaultStyle() }
  return {
    raw: raw.raw ?? '',
    value: raw.raw ?? '',
    style: { ...defaultStyle(), ...(raw.style || {}) },
  }
}

export function addRow(sheet: FormaSheet, at = sheet.rows): FormaSheet {
  const idx = Math.max(0, Math.min(at, sheet.rows))
  const newHeights = [...sheet.rowHeights]
  newHeights.splice(idx, 0, DEFAULT_ROW_H)
  const newCells: Record<string, SheetCellData> = {}
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

export function deleteRow(sheet: FormaSheet, at: number): FormaSheet {
  if (sheet.rows <= 1) return sheet
  const newHeights = sheet.rowHeights.filter((_, i) => i !== at)
  const newCells: Record<string, SheetCellData> = {}
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

export function addCol(sheet: FormaSheet, at = sheet.cols): FormaSheet {
  const idx = Math.max(0, Math.min(at, sheet.cols))
  const newWidths = [...sheet.colWidths]
  newWidths.splice(idx, 0, DEFAULT_COL_W)
  const newCells: Record<string, SheetCellData> = {}
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

export function deleteCol(sheet: FormaSheet, at: number): FormaSheet {
  if (sheet.cols <= 1) return sheet
  const newWidths = sheet.colWidths.filter((_, i) => i !== at)
  const newCells: Record<string, SheetCellData> = {}
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

function rangesOverlap(
  a: { r1: number; c1: number; r2: number; c2: number },
  b: { r1: number; c1: number; r2: number; c2: number },
): boolean {
  return !(a.r2 < b.r1 || a.r1 > b.r2 || a.c2 < b.c1 || a.c1 > b.c2)
}

export function getMergeAt(sheet: FormaSheet, row: number, col: number) {
  return sheet.merges.find((m) => row >= m.r1 && row <= m.r2 && col >= m.c1 && col <= m.c2) || null
}

export function isMergeHidden(sheet: FormaSheet, row: number, col: number): boolean {
  const m = getMergeAt(sheet, row, col)
  if (!m) return false
  return !(row === m.r1 && col === m.c1)
}

export function mergeCells(sheet: FormaSheet, r1: number, c1: number, r2: number, c2: number): FormaSheet {
  const a = { r1: Math.min(r1, r2), c1: Math.min(c1, c2), r2: Math.max(r1, r2), c2: Math.max(c1, c2) }
  const k = cellKey(a.r1, a.c1)
  const master = sheet.cells[k] || { raw: '', style: defaultStyle() }
  const texts: string[] = []
  for (let r = a.r1; r <= a.r2; r++) {
    for (let c = a.c1; c <= a.c2; c++) {
      const raw = sheet.cells[cellKey(r, c)]?.raw
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

export function unmergeAt(sheet: FormaSheet, row: number, col: number): FormaSheet {
  const m = sheet.merges.find((mg) => row >= mg.r1 && row <= mg.r2 && col >= mg.c1 && col <= mg.c2)
  if (!m) return sheet
  return { ...sheet, merges: sheet.merges.filter((mg) => mg !== m), updatedAt: Date.now() }
}

export function applyStyleToRange(
  sheet: FormaSheet,
  r1: number,
  c1: number,
  r2: number,
  c2: number,
  style: Partial<SheetCellStyle>,
): FormaSheet {
  const cells = { ...sheet.cells }
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      if (isMergeHidden(sheet, r, c)) continue
      const k = cellKey(r, c)
      const prev = cells[k] || { raw: '', style: defaultStyle() }
      cells[k] = { ...prev, style: { ...defaultStyle(), ...prev.style, ...style } }
    }
  }
  return { ...sheet, cells, updatedAt: Date.now() }
}

export interface RangeClip {
  data: (SheetCellData | null)[][]
  rows: number
  cols: number
}

export function copyRange(sheet: FormaSheet, r1: number, c1: number, r2: number, c2: number): RangeClip {
  const data: (SheetCellData | null)[][] = []
  for (let r = r1; r <= r2; r++) {
    const row: (SheetCellData | null)[] = []
    for (let c = c1; c <= c2; c++) {
      const k = cellKey(r, c)
      row.push(sheet.cells[k] ? structuredClone(sheet.cells[k]) : null)
    }
    data.push(row)
  }
  return { data, rows: r2 - r1 + 1, cols: c2 - c1 + 1 }
}

export function pasteRange(sheet: FormaSheet, startRow: number, startCol: number, clip: RangeClip): FormaSheet {
  if (!clip?.data) return sheet
  const cells = { ...sheet.cells }
  clip.data.forEach((row, ri) => {
    row.forEach((cell, ci) => {
      const r = startRow + ri
      const c = startCol + ci
      if (r >= sheet.rows || c >= sheet.cols) return
      const k = cellKey(r, c)
      if (cell) cells[k] = structuredClone(cell)
      else delete cells[k]
    })
  })
  return { ...sheet, cells, updatedAt: Date.now() }
}

export function sortByColumn(sheet: FormaSheet, col: number, dir: 'asc' | 'desc' = 'asc'): FormaSheet {
  const indices = Array.from({ length: sheet.rows }, (_, i) => i)
  const val = (row: number) => {
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
  const cells: Record<string, SheetCellData> = {}
  const newHeights = indices.map((i) => sheet.rowHeights[i]!)
  indices.forEach((srcRow, dstRow) => {
    for (let c = 0; c < sheet.cols; c++) {
      const k = cellKey(srcRow, c)
      if (sheet.cells[k]) cells[cellKey(dstRow, c)] = structuredClone(sheet.cells[k])
    }
  })
  return {
    ...sheet,
    cells,
    merges: [],
    rowHeights: newHeights,
    sortCol: col,
    sortDir: dir,
    updatedAt: Date.now(),
  }
}

export function sumColWidths(colWidths: number[], c1: number, c2: number): number {
  let t = 0
  for (let c = c1; c <= c2; c++) t += colWidths[c] || DEFAULT_COL_W
  return t
}

export function sumRowHeights(rowHeights: number[], r1: number, r2: number): number {
  let t = 0
  for (let r = r1; r <= r2; r++) t += rowHeights[r] || DEFAULT_ROW_H
  return t
}
