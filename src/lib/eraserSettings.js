const STORAGE_KEY = 'forma-eraser-settings'

export const ERASER_MODES = [
  { id: 'auto', label: 'Auto', desc: 'Supprime l\'élément entier touché' },
  { id: 'precision', label: 'Précision', desc: 'Efface progressivement les traits' },
  { id: 'zone', label: 'Zone', desc: 'Supprime tout dans la zone dessinée' },
]

export function loadEraserSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { mode: 'auto', sizeMm: 5, ...JSON.parse(raw) }
  } catch {}
  return { mode: 'auto', sizeMm: 5 }
}

export function saveEraserSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {}
}
