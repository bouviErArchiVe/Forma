const STORAGE_KEY = 'forma-eraser-settings'

export const ERASER_MODES = [
  { id: 'auto', label: 'Auto', desc: 'Supprime l\'élément entier touché' },
  { id: 'precision', label: 'Précision', desc: 'Efface sous le curseur, trait par trait' },
  { id: 'zone', label: 'Zone', desc: 'Dessine une zone — efface uniquement l\'intérieur' },
]

export function loadEraserSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { mode: 'precision', sizeMm: 5, ...JSON.parse(raw) }
  } catch {}
  return { mode: 'precision', sizeMm: 5 }
}

export function saveEraserSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {}
}
