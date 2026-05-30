const ALLOWED = /^[\d+\-*/().,%\s^a-zA-Zπ]+$/

const FN = (angleMode: 'deg' | 'rad') => {
  const rad = (d: number) => (angleMode === 'deg' ? (d * Math.PI) / 180 : d)
  const deg = (r: number) => (angleMode === 'deg' ? (r * 180) / Math.PI : r)
  return {
    sin: (x: number) => Math.sin(rad(x)),
    cos: (x: number) => Math.cos(rad(x)),
    tan: (x: number) => Math.tan(rad(x)),
    asin: (x: number) => deg(Math.asin(x)),
    acos: (x: number) => deg(Math.acos(x)),
    atan: (x: number) => deg(Math.atan(x)),
    log: (x: number) => Math.log10(x),
    ln: (x: number) => Math.log(x),
    sqrt: (x: number) => Math.sqrt(x),
    abs: (x: number) => Math.abs(x),
    round: (x: number) => Math.round(x),
    floor: (x: number) => Math.floor(x),
    ceil: (x: number) => Math.ceil(x),
    pow: (x: number, y: number) => Math.pow(x, y),
    mod: (x: number, y: number) => x % y,
    exp: (x: number) => Math.exp(x),
    PI: Math.PI,
    pi: Math.PI,
    E: Math.E,
    e: Math.E,
  }
}

function normalizeExpr(raw: string): string {
  return String(raw || '')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/,/g, '.')
    .replace(/π/g, 'PI')
    .replace(/\^/g, '**')
    .replace(/\bmod\b/gi, '%')
}

export function evaluateExpression(
  raw: string,
  { angleMode = 'deg' }: { angleMode?: 'deg' | 'rad' } = {},
): number | null {
  const expr = normalizeExpr(raw)
  if (!expr.trim()) return null
  if (!ALLOWED.test(expr.replace(/\*\*/g, '^'))) return null

  const scope = FN(angleMode)
  const keys = Object.keys(scope) as (keyof ReturnType<typeof FN>)[]
  try {
    const fn = new Function(...keys, `"use strict"; return (${expr})`) as (
      ...args: number[]
    ) => number
    const r = fn(...keys.map((k) => scope[k] as number))
    if (typeof r !== 'number' || !isFinite(r)) return null
    return r
  } catch {
    return null
  }
}

export function formatResult(n: number | null | undefined): string {
  if (n === null || n === undefined || !isFinite(n)) return 'Erreur'
  const abs = Math.abs(n)
  if (abs !== 0 && (abs >= 1e12 || abs < 1e-8)) return n.toExponential(8).replace(/\.?0+e/, 'e')
  return String(+n.toFixed(10))
}
