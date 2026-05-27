import { cellKey, colToLetter, parseCellKey, parseRange } from './cells'
import { getCell } from './model'

function num(v) {
  if (v === null || v === undefined || v === '') return 0
  const n = parseFloat(String(v).replace(/\s/g, '').replace(',', '.').replace('%', ''))
  return Number.isNaN(n) ? 0 : n
}

function formatDisplay(raw, style, computed) {
  if (computed !== undefined && computed !== null && String(raw).trim().startsWith('=')) {
    const v = computed
    if (style?.format === 'percent') return `${(num(v) * 100).toFixed(1)}%`
    if (style?.format === 'number') return Number.isInteger(v) ? String(v) : num(v).toFixed(2)
    return String(v)
  }
  if (style?.format === 'percent') {
    const n = num(raw)
    return `${n.toFixed(1)}%`
  }
  if (style?.format === 'date' && raw) {
    const d = new Date(raw)
    if (!Number.isNaN(d.getTime())) return d.toLocaleDateString('fr-FR')
  }
  return String(raw ?? '')
}

function resolveRef(ref, sheet, getVal, visiting = new Set()) {
  const key = String(ref || '').trim().toUpperCase()
  if (!key) return 0
  const range = parseRange(key)
  if (range && key.includes(':')) {
    const vals = []
    for (let r = range.r1; r <= range.r2; r++) {
      for (let c = range.c1; c <= range.c2; c++) {
        vals.push(getVal(r, c, visiting))
      }
    }
    return vals
  }
  const p = parseCellKey(key)
  if (!p) return 0
  return getVal(p.row, p.col, visiting)
}

function tokenizeFormula(expr) {
  const s = String(expr || '').trim()
  const tokens = []
  let i = 0
  while (i < s.length) {
    const ch = s[i]
    if (/\s/.test(ch)) { i++; continue }
    if ('+-*/(),'.includes(ch)) { tokens.push({ t: ch }); i++; continue }
    if (/[\d.]/.test(ch)) {
      let n = ''
      while (i < s.length && /[\d.]/.test(s[i])) { n += s[i]; i++ }
      tokens.push({ t: 'num', v: parseFloat(n) })
      continue
    }
    if (/[A-Za-z]/.test(ch)) {
      let id = ''
      while (i < s.length && /[A-Za-z0-9_:]/.test(s[i])) { id += s[i]; i++ }
      tokens.push({ t: 'id', v: id.toUpperCase() })
      continue
    }
    i++
  }
  return tokens
}

function parseExpr(tokens, pos = 0) {
  let [left, p] = parseTerm(tokens, pos)
  while (p < tokens.length && (tokens[p].t === '+' || tokens[p].t === '-')) {
    const op = tokens[p].t
    const [right, p2] = parseTerm(tokens, p + 1)
    left = op === '+' ? left + right : left - right
    p = p2
  }
  return [left, p]
}

function parseTerm(tokens, pos = 0) {
  let [left, p] = parseFactor(tokens, pos)
  while (p < tokens.length && (tokens[p].t === '*' || tokens[p].t === '/')) {
    const op = tokens[p].t
    const [right, p2] = parseFactor(tokens, p + 1)
    left = op === '*' ? left * right : (right === 0 ? 0 : left / right)
    p = p2
  }
  return [left, p]
}

function parseFactor(tokens, pos = 0) {
  if (pos >= tokens.length) return [0, pos]
  const tok = tokens[pos]
  if (tok.t === 'num') return [tok.v, pos + 1]
  if (tok.t === 'id') return [0, pos + 1]
  if (tok.t === '(') {
    const [v, p] = parseExpr(tokens, pos + 1)
    return [v, tokens[p]?.t === ')' ? p + 1 : p]
  }
  if (tok.t === '-') {
    const [v, p] = parseFactor(tokens, pos + 1)
    return [-v, p]
  }
  return [0, pos + 1]
}

function evalArithmetic(expr, sheet, getVal) {
  const tokens = tokenizeFormula(expr).map((t) => {
    if (t.t !== 'id') return t
    const refVal = resolveRef(t.v, sheet, getVal)
    if (Array.isArray(refVal)) return { t: 'num', v: refVal.reduce((a, b) => a + num(b), 0) }
    return { t: 'num', v: num(refVal) }
  })
  const [v] = parseExpr(tokens)
  return v
}

function evalFormula(raw, sheet, getVal) {
  const s = String(raw || '').trim()
  if (!s.startsWith('=')) return s
  const body = s.slice(1).trim()

  const fnMatch = /^([A-ZÀÉÈÊËÏÎÔÙÛÇ]+)\s*\((.*)\)$/i.exec(body)
  if (fnMatch) {
    const fn = fnMatch[1].toUpperCase()
      .replace('SOMME', 'SUM')
      .replace('MOYENNE', 'AVERAGE')
      .replace('COMPTER', 'COUNT')
    const args = fnMatch[2].split(';').map((a) => a.trim())
    const flat = []
    args.forEach((arg) => {
      const v = resolveRef(arg, sheet, getVal)
      if (Array.isArray(v)) flat.push(...v)
      else flat.push(v)
    })
    const nums = flat.map(num)
    if (fn === 'SUM' || fn === 'SOMME') return nums.reduce((a, b) => a + b, 0)
    if (fn === 'AVERAGE' || fn === 'MOYENNE') return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0
    if (fn === 'MIN') return nums.length ? Math.min(...nums) : 0
    if (fn === 'MAX') return nums.length ? Math.max(...nums) : 0
    if (fn === 'COUNT' || fn === 'COMPTER') return flat.filter((x) => x !== '' && x !== null && x !== undefined).length
  }

  try {
    return evalArithmetic(body.replace(/;/g, ','), sheet, getVal)
  } catch {
    return '#ERR'
  }
}

export function computeSheet(sheet) {
  const cache = new Map()

  function getVal(row, col, visiting = new Set()) {
    const k = cellKey(row, col)
    if (cache.has(k)) return cache.get(k)
    if (visiting.has(k)) return '#REF'
    visiting.add(k)
    const cell = getCell(sheet, row, col)
    const raw = cell.raw || ''
    let value
    if (String(raw).trim().startsWith('=')) {
      value = evalFormula(raw, sheet, getVal)
    } else if (cell.style?.format === 'number' || cell.style?.format === 'percent') {
      value = num(raw)
    } else {
      value = raw
    }
    visiting.delete(k)
    cache.set(k, value)
    return value
  }

  const computed = {}
  for (let r = 0; r < sheet.rows; r++) {
    for (let c = 0; c < sheet.cols; c++) {
      const k = cellKey(r, c)
      const cell = getCell(sheet, r, c)
      const value = getVal(r, c)
      computed[k] = {
        ...cell,
        value: formatDisplay(cell.raw, cell.style, value),
        computed: value,
      }
    }
  }
  return computed
}

export function searchInSheet(sheet, query) {
  const q = String(query || '').trim().toLowerCase()
  if (!q) return []
  const computed = computeSheet(sheet)
  const hits = []
  Object.entries(computed).forEach(([k, cell]) => {
    if (String(cell.value).toLowerCase().includes(q) || String(cell.raw).toLowerCase().includes(q)) {
      hits.push(k)
    }
  })
  return hits
}

export function sheetToCsv(sheet) {
  const computed = computeSheet(sheet)
  const lines = []
  for (let r = 0; r < sheet.rows; r++) {
    const row = []
    for (let c = 0; c < sheet.cols; c++) {
      const v = computed[cellKey(r, c)]?.value ?? ''
      const esc = String(v).includes('"') || String(v).includes(',') || String(v).includes('\n')
      row.push(esc ? `"${String(v).replace(/"/g, '""')}"` : String(v))
    }
    lines.push(row.join(','))
  }
  return lines.join('\n')
}

export { colToLetter, cellKey }
