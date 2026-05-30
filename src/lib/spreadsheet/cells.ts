/** Utilitaires cellules — coordonnées, clés, fusion. */

export function colToLetter(col: number): string {
  let n = col + 1
  let s = ''
  while (n > 0) {
    const r = (n - 1) % 26
    s = String.fromCharCode(65 + r) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

export function letterToCol(letters: string): number {
  let n = 0
  const u = letters.toUpperCase()
  for (let i = 0; i < u.length; i++) {
    n = n * 26 + (u.charCodeAt(i)! - 64)
  }
  return n - 1
}

export function cellKey(row: number, col: number): string {
  return `${colToLetter(col)}${row + 1}`
}

export function parseCellKey(key: string): { row: number; col: number } | null {
  const m = /^([A-Za-z]+)(\d+)$/.exec(String(key || '').trim())
  if (!m) return null
  return { row: parseInt(m[2]!, 10) - 1, col: letterToCol(m[1]!) }
}

export function parseRange(ref: string): { r1: number; c1: number; r2: number; c2: number } | null {
  const parts = String(ref || '').split(':')
  const a = parseCellKey(parts[0]!)
  const b = parseCellKey(parts[1] || parts[0]!)
  if (!a || !b) return null
  return {
    r1: Math.min(a.row, b.row),
    c1: Math.min(a.col, b.col),
    r2: Math.max(a.row, b.row),
    c2: Math.max(a.col, b.col),
  }
}

export function defaultStyle() {
  return {
    bold: false,
    italic: false,
    underline: false,
    fontSize: 12,
    color: '#000000',
    bg: '#ffffff',
    alignH: 'left' as const,
    alignV: 'middle' as const,
    format: 'text' as const,
    border: true,
  }
}
