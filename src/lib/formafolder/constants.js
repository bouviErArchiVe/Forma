/** FormaFolder — constantes modes, MasterFormat, types */

export const FF_DARK = {
  bg: '#0d0f14', surface: '#151820', panel: '#1a1e28',
  border: '#2a3144', ink: '#e8ecf4', muted: '#8b95a8', accent: '#7a9fd4', accent2: '#9ec5ff',
}

export const FOLDER_MODES = [
  { id: 'general', label: 'Général', icon: '📁' },
  { id: 'fiches', label: 'Fiches techniques', icon: '📋' },
]

export const MASTERFORMAT_SECTIONS = [
  { code: '00', label: '00 — Procurement' },
  { code: '01', label: '01 — Exigences générales' },
  { code: '03', label: '03 — Béton' },
  { code: '04', label: '04 — Maçonnerie' },
  { code: '05', label: '05 — Métaux' },
  { code: '06', label: '06 — Bois & plastiques' },
  { code: '07', label: '07 — Étanchéité / enveloppe' },
  { code: '08', label: '08 — Ouvertures' },
  { code: '09', label: '09 — Finitions' },
  { code: '10', label: '10 — Spécialités' },
  { code: '11', label: '11 — Équipements' },
  { code: '12', label: '12 — Aménagements' },
  { code: '13', label: '13 — Spéciales' },
  { code: '14', label: '14 — Ascenseurs' },
  { code: '21', label: '21 — CVC' },
  { code: '22', label: '22 — Plomberie' },
  { code: '23', label: '23 — Électricité' },
  { code: '26', label: '26 — Réseaux' },
  { code: '31', label: '31 — Terrassements' },
  { code: '32', label: '32 — VRD / paysage' },
]

export const ASSET_TYPES = {
  pdf: { label: 'PDF', icon: '📕' },
  image: { label: 'Image', icon: '🖼' },
  text: { label: 'Texte', icon: '📝' },
  fiche: { label: 'Fiche technique', icon: '📋' },
  norm: { label: 'Norme', icon: '📜' },
  doc: { label: 'FormaDoc', icon: '📄' },
  sheet: { label: 'FormaTab', icon: '📊' },
  notebook: { label: 'Carnet Forma', icon: '📓' },
  export: { label: 'Export', icon: '📤' },
  asset: { label: 'Asset', icon: '📦' },
  library: { label: 'Bibliothèque', icon: '📚' },
}

export const TYPE_FILTERS = [
  { id: 'all', label: 'Tout' },
  { id: 'folders', label: 'Dossiers' },
  { id: 'notebooks', label: 'Carnets' },
  { id: 'assets', label: 'Fichiers' },
  { id: 'favorites', label: 'Favoris' },
]

export function masterFormatLabel(code) {
  if (!code) return '—'
  return MASTERFORMAT_SECTIONS.find((s) => s.code === code)?.label || code
}

export function modeLabel(id) {
  return FOLDER_MODES.find((m) => m.id === id)?.label || id
}

export function assetTypeLabel(type) {
  return ASSET_TYPES[type]?.label || type
}

export function assetTypeIcon(type) {
  return ASSET_TYPES[type]?.icon || '📄'
}
