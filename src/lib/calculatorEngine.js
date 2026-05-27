const ALLOWED = /^[\d+\-*/().,%\s^a-zA-Zπ]+$/

const FN = (angleMode) => {
  const rad = (d) => (angleMode === 'deg' ? (d * Math.PI) / 180 : d)
  const deg = (r) => (angleMode === 'deg' ? (r * 180) / Math.PI : r)
  return {
    sin: (x) => Math.sin(rad(x)),
    cos: (x) => Math.cos(rad(x)),
    tan: (x) => Math.tan(rad(x)),
    asin: (x) => deg(Math.asin(x)),
    acos: (x) => deg(Math.acos(x)),
    atan: (x) => deg(Math.atan(x)),
    log: (x) => Math.log10(x),
    ln: (x) => Math.log(x),
    sqrt: (x) => Math.sqrt(x),
    abs: (x) => Math.abs(x),
    round: (x) => Math.round(x),
    floor: (x) => Math.floor(x),
    ceil: (x) => Math.ceil(x),
    pow: (x, y) => Math.pow(x, y),
    mod: (x, y) => x % y,
    exp: (x) => Math.exp(x),
    PI: Math.PI,
    pi: Math.PI,
    E: Math.E,
    e: Math.E,
  }
}

function normalizeExpr(raw) {
  return String(raw || '')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/,/g, '.')
    .replace(/π/g, 'PI')
    .replace(/\^/g, '**')
    .replace(/\bmod\b/gi, '%')
}

/** Évalue une expression scientifique (deg/rad pour trig). */
export function evaluateExpression(raw, { angleMode = 'deg' } = {}) {
  const expr = normalizeExpr(raw)
  if (!expr.trim()) return null
  if (!ALLOWED.test(expr.replace(/\*\*/g, '^'))) return null

  const scope = FN(angleMode)
  const keys = Object.keys(scope)
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function(...keys, `"use strict"; return (${expr})`)
    const r = fn(...keys.map((k) => scope[k]))
    if (typeof r !== 'number' || !isFinite(r)) return null
    return r
  } catch {
    return null
  }
}

export function formatResult(n) {
  if (n === null || n === undefined || !isFinite(n)) return 'Erreur'
  const abs = Math.abs(n)
  if (abs !== 0 && (abs >= 1e12 || abs < 1e-8)) return n.toExponential(8).replace(/\.?0+e/, 'e')
  const s = +n.toFixed(10)
  return String(s)
}

export function percentOf(value, pct) {
  const v = parseFloat(value)
  const p = parseFloat(pct)
  if (!isFinite(v) || !isFinite(p)) return null
  return (v * p) / 100
}
