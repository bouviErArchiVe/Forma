/**
 * FormaTab — modèle de données et moteur de formules.
 *
 * Design :
 * - Cellules adressées par "A1", "B2"… (colonne lettre + ligne 1-based)
 * - Max 26 colonnes (A–Z), 200 lignes
 * - Formules : = préfixe, opérateurs +−×÷, fonctions SUM/AVG/MIN/MAX/COUNT
 * - Erreurs : affichées comme #ERR — jamais de throw silencieux
 * - Sérialisation : JSON → Page.tableData (string)
 */

// ─── Types ─────────────────────────────────────────────────────────────────

export interface TabCellStyle {
  bold?: boolean
  italic?: boolean
  align?: 'left' | 'center' | 'right'
  color?: string     // texte — ex. "#dc2626"
  bg?: string        // fond   — ex. "#fef9c3"
}

export interface TabCell {
  /** Valeur brute saisie (peut commencer par = pour formule). */
  value: string
  style?: TabCellStyle
}

export interface TabTable {
  rows: number
  cols: number
  /** Clé = adresse cellule "A1", valeur = TabCell. */
  cells: Record<string, TabCell>
  /** Largeur personnalisée par index de colonne (0-based). */
  colWidths?: Record<number, number>
  /** Hauteur personnalisée par index de ligne (0-based). */
  rowHeights?: Record<number, number>
}

// ─── Constants ─────────────────────────────────────────────────────────────

export const TAB_DEFAULT_ROWS = 12
export const TAB_DEFAULT_COLS = 7
export const TAB_MAX_ROWS = 200
export const TAB_MAX_COLS = 26
export const TAB_DEFAULT_COL_WIDTH = 96
export const TAB_DEFAULT_ROW_HEIGHT = 28
export const TAB_HEADER_WIDTH = 40
export const TAB_HEADER_HEIGHT = 28

// ─── Address helpers ────────────────────────────────────────────────────────

/** Index de colonne 0-based → lettre(s). 0→A, 25→Z. */
export function colIndexToLetter(col: number): string {
  if (col < 0 || col >= TAB_MAX_COLS) return '?'
  return String.fromCharCode(65 + col)
}

/** Lettre(s) → index de colonne 0-based. "A"→0, "Z"→25. */
export function colLetterToIndex(letter: string): number {
  const upper = letter.toUpperCase()
  let idx = 0
  for (let i = 0; i < upper.length; i++) {
    idx = idx * 26 + (upper.charCodeAt(i) - 64)
  }
  return idx - 1
}

/** Construit l'adresse d'une cellule depuis des indices 0-based. */
export function cellAddress(col: number, row: number): string {
  return `${colIndexToLetter(col)}${row + 1}`
}

/** Parse "A1" → { col: 0, row: 0 } (0-based). Retourne null si invalide. */
export function parseCellAddress(addr: string): { col: number; row: number } | null {
  const m = addr.trim().match(/^([A-Z]+)(\d+)$/i)
  if (!m) return null
  const col = colLetterToIndex(m[1])
  const row = parseInt(m[2], 10) - 1
  if (col < 0 || col >= TAB_MAX_COLS || row < 0 || row >= TAB_MAX_ROWS) return null
  return { col, row }
}

/** Parse une plage "A1:C3" → tableau d'adresses. Retourne [] si invalide. */
export function parseCellRange(range: string): string[] {
  const parts = range.trim().split(':')
  if (parts.length !== 2) return []
  const start = parseCellAddress(parts[0])
  const end = parseCellAddress(parts[1])
  if (!start || !end) return []
  const addrs: string[] = []
  const cMin = Math.min(start.col, end.col)
  const cMax = Math.max(start.col, end.col)
  const rMin = Math.min(start.row, end.row)
  const rMax = Math.max(start.row, end.row)
  for (let r = rMin; r <= rMax; r++) {
    for (let c = cMin; c <= cMax; c++) {
      addrs.push(cellAddress(c, r))
    }
  }
  return addrs
}

// ─── Default table ──────────────────────────────────────────────────────────

export function createDefaultTable(
  rows = TAB_DEFAULT_ROWS,
  cols = TAB_DEFAULT_COLS,
): TabTable {
  return { rows, cols, cells: {} }
}

// ─── Serialization ──────────────────────────────────────────────────────────

export function serializeTable(table: TabTable): string {
  return JSON.stringify(table)
}

export function deserializeTable(json: string | undefined): TabTable {
  if (!json) return createDefaultTable()
  try {
    const parsed = JSON.parse(json) as TabTable
    return {
      rows: typeof parsed.rows === 'number' ? Math.max(1, Math.min(TAB_MAX_ROWS, parsed.rows)) : TAB_DEFAULT_ROWS,
      cols: typeof parsed.cols === 'number' ? Math.max(1, Math.min(TAB_MAX_COLS, parsed.cols)) : TAB_DEFAULT_COLS,
      cells: typeof parsed.cells === 'object' && parsed.cells ? parsed.cells : {},
      colWidths: parsed.colWidths ?? {},
      rowHeights: parsed.rowHeights ?? {},
    }
  } catch {
    return createDefaultTable()
  }
}

// ─── Formula engine ─────────────────────────────────────────────────────────

const ERR_DIV = '#DIV/0!'
const ERR_REF = '#REF!'
const ERR_VAL = '#VAL!'
const ERR_FORM = '#ERR!'

/** Évalue la valeur affichée d'une cellule (résout les formules). */
export function evaluateCell(
  addr: string,
  table: TabTable,
  depth = 0,
): string {
  if (depth > 32) return ERR_FORM  // cycle guard

  const cell = table.cells[addr]
  if (!cell || cell.value === '') return ''
  const raw = cell.value.trim()
  if (!raw.startsWith('=')) return raw

  try {
    const result = evalFormula(raw.slice(1).trim(), table, depth)
    if (typeof result === 'number') {
      // Format: remove trailing zeros for integers
      return Number.isInteger(result)
        ? String(result)
        : String(Math.round(result * 1e10) / 1e10)
    }
    return String(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : ''
    if (msg === ERR_DIV || msg === ERR_REF || msg === ERR_VAL) return msg
    return ERR_FORM
  }
}

/** Retourne la valeur numérique d'une cellule ou NaN si non numérique. */
function numericValue(addr: string, table: TabTable, depth: number): number {
  const str = evaluateCell(addr, table, depth + 1)
  const n = parseFloat(str.replace(',', '.'))
  return isNaN(n) ? NaN : n
}

// ─── Expression evaluator ───────────────────────────────────────────────────

/** Tokenizer token kinds. */
type TokenKind = 'num' | 'ref' | 'range' | 'op' | 'lparen' | 'rparen' | 'comma' | 'fn' | 'str'

interface Token { kind: TokenKind; value: string }

function tokenize(expr: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  const s = expr.toUpperCase()

  while (i < s.length) {
    const ch = s[i]

    // Skip whitespace
    if (ch === ' ' || ch === '\t') { i++; continue }

    // Number (including decimals and negatives handled by unary)
    if (ch >= '0' && ch <= '9' || ch === '.') {
      let num = ''
      while (i < s.length && (s[i] >= '0' && s[i] <= '9' || s[i] === '.')) {
        num += s[i++]
      }
      tokens.push({ kind: 'num', value: num })
      continue
    }

    // Function name or cell reference
    if (ch >= 'A' && ch <= 'Z') {
      let word = ''
      while (i < s.length && ((s[i] >= 'A' && s[i] <= 'Z') || (s[i] >= '0' && s[i] <= '9'))) {
        word += s[i++]
      }
      // Check for range (e.g. A1:B3 — continue collecting after colon)
      if (i < s.length && s[i] === ':') {
        let range = word + ':'
        i++
        while (i < s.length && ((s[i] >= 'A' && s[i] <= 'Z') || (s[i] >= '0' && s[i] <= '9'))) {
          range += s[i++]
        }
        tokens.push({ kind: 'range', value: range })
        continue
      }
      // Function if followed by (
      if (i < s.length && s[i] === '(') {
        tokens.push({ kind: 'fn', value: word })
        continue
      }
      // Otherwise, cell reference or invalid
      tokens.push({ kind: 'ref', value: word })
      continue
    }

    // Operators
    if ('+-*/'.includes(ch)) { tokens.push({ kind: 'op', value: ch }); i++; continue }
    if (ch === '(') { tokens.push({ kind: 'lparen', value: '(' }); i++; continue }
    if (ch === ')') { tokens.push({ kind: 'rparen', value: ')' }); i++; continue }
    if (ch === ',') { tokens.push({ kind: 'comma', value: ',' }); i++; continue }

    // Unknown — skip
    i++
  }
  return tokens
}

/** Simple recursive-descent evaluator (handles +, -, *, /, unary -, functions). */
function evalFormula(expr: string, table: TabTable, depth: number): number {
  const tokens = tokenize(expr)
  let pos = 0

  function peek(): Token | undefined { return tokens[pos] }
  function consume(): Token { return tokens[pos++] }

  function parseExpr(): number {
    let left = parseTerm()
    while (peek()?.kind === 'op' && (peek()!.value === '+' || peek()!.value === '-')) {
      const op = consume().value
      const right = parseTerm()
      left = op === '+' ? left + right : left - right
    }
    return left
  }

  function parseTerm(): number {
    let left = parseUnary()
    while (peek()?.kind === 'op' && (peek()!.value === '*' || peek()!.value === '/')) {
      const op = consume().value
      const right = parseUnary()
      if (op === '/' && right === 0) throw new Error(ERR_DIV)
      left = op === '*' ? left * right : left / right
    }
    return left
  }

  function parseUnary(): number {
    if (peek()?.kind === 'op' && peek()!.value === '-') {
      consume()
      return -parsePrimary()
    }
    if (peek()?.kind === 'op' && peek()!.value === '+') {
      consume()
      return parsePrimary()
    }
    return parsePrimary()
  }

  function parsePrimary(): number {
    const t = peek()
    if (!t) throw new Error(ERR_FORM)

    if (t.kind === 'num') {
      consume()
      return parseFloat(t.value)
    }

    if (t.kind === 'ref') {
      consume()
      const parsed = parseCellAddress(t.value)
      if (!parsed) throw new Error(ERR_REF)
      const n = numericValue(t.value, table, depth)
      if (isNaN(n)) throw new Error(ERR_VAL)
      return n
    }

    if (t.kind === 'fn') {
      const name = consume().value
      // Consume opening paren
      if (peek()?.kind !== 'lparen') throw new Error(ERR_FORM)
      consume()
      // Collect arguments (ranges, refs, or expressions)
      const args: Array<string | number> = []
      while (peek() && peek()!.kind !== 'rparen') {
        const arg = peek()
        if (arg?.kind === 'range') {
          args.push(consume().value)
        } else if (arg?.kind === 'comma') {
          consume()
        } else {
          args.push(parseExpr())
        }
      }
      if (peek()?.kind === 'rparen') consume()
      return applyFunction(name, args, table, depth)
    }

    if (t.kind === 'lparen') {
      consume()
      const val = parseExpr()
      if (peek()?.kind === 'rparen') consume()
      return val
    }

    throw new Error(ERR_FORM)
  }

  const result = parseExpr()
  return result
}

function applyFunction(
  name: string,
  args: Array<string | number>,
  table: TabTable,
  depth: number,
): number {
  // Flatten args: expand ranges and refs into numbers
  const nums: number[] = []
  for (const arg of args) {
    if (typeof arg === 'number') {
      nums.push(arg)
    } else {
      // Range or ref
      const addrs = arg.includes(':') ? parseCellRange(arg) : [arg]
      for (const addr of addrs) {
        const n = numericValue(addr, table, depth)
        if (!isNaN(n)) nums.push(n)
      }
    }
  }

  switch (name) {
    case 'SUM':
      return nums.reduce((a, b) => a + b, 0)
    case 'AVG':
    case 'AVERAGE':
      if (!nums.length) throw new Error(ERR_VAL)
      return nums.reduce((a, b) => a + b, 0) / nums.length
    case 'MIN':
      if (!nums.length) throw new Error(ERR_VAL)
      return Math.min(...nums)
    case 'MAX':
      if (!nums.length) throw new Error(ERR_VAL)
      return Math.max(...nums)
    case 'COUNT':
      return nums.length
    case 'ROUND':
      if (nums.length < 1) throw new Error(ERR_VAL)
      return Math.round(nums[0] * Math.pow(10, nums[1] ?? 0)) / Math.pow(10, nums[1] ?? 0)
    case 'ABS':
      if (!nums.length) throw new Error(ERR_VAL)
      return Math.abs(nums[0])
    case 'SQRT':
      if (!nums.length) throw new Error(ERR_VAL)
      if (nums[0] < 0) throw new Error(ERR_VAL)
      return Math.sqrt(nums[0])
    default:
      throw new Error(ERR_FORM)
  }
}

// ─── CSV export ──────────────────────────────────────────────────────────────

export function tableToCSV(table: TabTable): string {
  const lines: string[] = []
  for (let r = 0; r < table.rows; r++) {
    const row: string[] = []
    for (let c = 0; c < table.cols; c++) {
      const addr = cellAddress(c, r)
      const displayed = evaluateCell(addr, table)
      // Quote cells that contain commas, quotes, or newlines
      const needs = displayed.includes(',') || displayed.includes('"') || displayed.includes('\n')
      row.push(needs ? `"${displayed.replace(/"/g, '""')}"` : displayed)
    }
    lines.push(row.join(','))
  }
  return lines.join('\r\n')
}

export function downloadTableCSV(table: TabTable, title: string): void {
  const csv = tableToCSV(table)
  const blob = new Blob(['﻿' + csv], { type: 'text/csv; charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title.replace(/[<>:"/\\|?*]/g, '_') || 'tableau'}.csv`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
