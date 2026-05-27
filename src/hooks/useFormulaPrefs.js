import { useCallback, useEffect, useState } from 'react'

const FAV_KEY = 'forma-formula-favorites'
const RECENT_KEY = 'forma-recent-formulas'
const UNIT_KEY = 'forma-formula-length-unit'

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch { /* quota */ }
}

export function useFormulaPrefs() {
  const [favorites, setFavorites] = useState(() => readJson(FAV_KEY, []))
  const [recent, setRecent] = useState(() => readJson(RECENT_KEY, []))
  const [lengthUnit, setLengthUnitState] = useState(() => localStorage.getItem(UNIT_KEY) || 'cm')

  useEffect(() => { writeJson(FAV_KEY, favorites) }, [favorites])
  useEffect(() => { writeJson(RECENT_KEY, recent) }, [recent])
  useEffect(() => {
    try { localStorage.setItem(UNIT_KEY, lengthUnit) } catch { /* ignore */ }
  }, [lengthUnit])

  const toggleFavorite = useCallback((id) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }, [])

  const touchRecent = useCallback((id) => {
    setRecent((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, 12))
  }, [])

  const setLengthUnit = useCallback((unit) => {
    setLengthUnitState(unit)
  }, [])

  return { favorites, recent, lengthUnit, setLengthUnit, toggleFavorite, touchRecent }
}
