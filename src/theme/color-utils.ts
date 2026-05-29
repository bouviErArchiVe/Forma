export function clamp(v: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, v))
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = (hex || '').replace('#', '').trim()
  if (h.length === 3) {
    return {
      r: parseInt(h[0] + h[0], 16),
      g: parseInt(h[1] + h[1], 16),
      b: parseInt(h[2] + h[2], 16),
    }
  }
  if (h.length !== 6) return null
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

export function rgbaFromHex(hex: string, alpha = 1): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return `rgba(255,255,255,${alpha})`
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`
}

export function mix(aHex: string, bHex: string, t: number): string {
  const a = hexToRgb(aHex)
  const b = hexToRgb(bHex)
  if (!a || !b) return aHex || bHex
  const tt = clamp(t, 0, 1)
  const to = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0')
  return `#${to(a.r + (b.r - a.r) * tt)}${to(a.g + (b.g - a.g) * tt)}${to(a.b + (b.b - a.b) * tt)}`
}
