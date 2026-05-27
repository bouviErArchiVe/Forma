const STORAGE_KEY = 'forma_favorites'
export const FAVORITE_SLOTS = 12

export const emptyFavorite = () => ({
  label: '',
  color: '#1c1c24',
  sizeMm: 0.5,
  tool: 'pen',
  eraserMm: 5,
})

export function loadFavorites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return Array(FAVORITE_SLOTS).fill(null)
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return Array(FAVORITE_SLOTS).fill(null)
    return Array.from({ length: FAVORITE_SLOTS }, (_, i) => parsed[i] || null)
  } catch {
    return Array(FAVORITE_SLOTS).fill(null)
  }
}

export function saveFavorites(favorites) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites.slice(0, FAVORITE_SLOTS)))
  } catch {}
}

export function favoriteFromEditor({ color, sizeMm, tool, eraserMm, label }) {
  return {
    label: label || tool || 'Favori',
    color,
    sizeMm,
    tool,
    eraserMm: eraserMm ?? 5,
  }
}
