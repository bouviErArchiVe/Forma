/** Palette visuelle FTheme — adaptée depuis legacy ArchNote (20 thèmes). */
export interface FormaVisualTheme {
  id: string
  name: string
  emoji: string
  fontFamily: string
  bg: string
  surface: string
  panel: string
  accent: string
  accent2: string
  ink: string
  muted: string
  border: string
  paper: string
}

export const DEFAULT_VISUAL_THEME_ID = 'horizon'

export const FORMA_THEMES: FormaVisualTheme[] = [
  { id: 'horizon', name: 'Horizon', emoji: '🌅', fontFamily: 'Georgia, serif', bg: '#faf4ee', surface: '#ffffff', panel: '#2a1a10', accent: '#d4714a', accent2: '#e8a070', ink: '#2a1a10', muted: '#a07860', border: '#ecdcc8', paper: '#fdf8f2' },
  { id: 'atelier', name: 'Atelier', emoji: '🎨', fontFamily: 'system-ui, sans-serif', bg: '#f4f4f0', surface: '#ffffff', panel: '#141428', accent: '#1e40b0', accent2: '#d42020', ink: '#1a1a1a', muted: '#888888', border: '#e0e0dc', paper: '#fafafa' },
  { id: 'esquisse', name: 'Esquisse', emoji: '✏️', fontFamily: 'Georgia, serif', bg: '#f7f2e8', surface: '#fdfaf4', panel: '#1a1820', accent: '#2a3050', accent2: '#e07060', ink: '#1a1820', muted: '#888278', border: '#e0d8c8', paper: '#faf4e8' },
  { id: 'module', name: 'Module', emoji: '📦', fontFamily: 'system-ui, sans-serif', bg: '#f0ebe0', surface: '#faf6ee', panel: '#1a2230', accent: '#1e3058', accent2: '#d86050', ink: '#1a2230', muted: '#8a8070', border: '#dcd4c0', paper: '#f6f0e4' },
  { id: 'flux', name: 'Flux', emoji: '🌊', fontFamily: 'system-ui, sans-serif', bg: '#f2f0ea', surface: '#fafaf6', panel: '#141c28', accent: '#1a2840', accent2: '#8aaa88', ink: '#141c28', muted: '#8a8880', border: '#dcdad0', paper: '#f8f6f0' },
  { id: 'lumiere', name: 'Lumière', emoji: '🌟', fontFamily: 'Georgia, serif', bg: '#faf6ee', surface: '#fefcf8', panel: '#2a2010', accent: '#c89848', accent2: '#e0c078', ink: '#2a2010', muted: '#b0a088', border: '#ece0cc', paper: '#fefcf6' },
  { id: 'perspective', name: 'Perspective', emoji: '🔭', fontFamily: 'system-ui, sans-serif', bg: '#eeecea', surface: '#f8f6f4', panel: '#182040', accent: '#1a4898', accent2: '#d06840', ink: '#182040', muted: '#8a8c9a', border: '#d8d8e0', paper: '#f4f2f0' },
  { id: 'matiere', name: 'Matière', emoji: '🪨', fontFamily: 'Georgia, serif', bg: '#f0ece0', surface: '#f8f4ea', panel: '#0e0c08', accent: '#b83010', accent2: '#8a7860', ink: '#0e0c08', muted: '#988a78', border: '#dcd4bc', paper: '#f4f0e4' },
  { id: 'jardin', name: 'Jardin', emoji: '🌿', fontFamily: 'system-ui, sans-serif', bg: '#f2ede4', surface: '#faf6ee', panel: '#182010', accent: '#3a6838', accent2: '#c87878', ink: '#182010', muted: '#8a9078', border: '#d8d4c4', paper: '#f8f4ec' },
  { id: 'infini', name: 'Infini', emoji: '∞', fontFamily: 'system-ui, sans-serif', bg: '#f0eef8', surface: '#faf8ff', panel: '#161428', accent: '#6868c8', accent2: '#9888d0', ink: '#161428', muted: '#8888a8', border: '#d8d4ea', paper: '#f6f4fc' },
  { id: 'couleur', name: 'Couleur', emoji: '🎭', fontFamily: 'system-ui, sans-serif', bg: '#f2f0f8', surface: '#ffffff', panel: '#0e1428', accent: '#1840b0', accent2: '#e04830', ink: '#0e1428', muted: '#7878a0', border: '#d8d4e8', paper: '#f8f6fc' },
  { id: 'balance', name: 'Balance', emoji: '⚖️', fontFamily: 'Georgia, serif', bg: '#f4f0e4', surface: '#faf8f0', panel: '#101820', accent: '#184858', accent2: '#487840', ink: '#101820', muted: '#8a8878', border: '#dcd8c8', paper: '#f8f4e8' },
  { id: 'origine', name: 'Origine', emoji: '🏜️', fontFamily: 'Georgia, serif', bg: '#f5e8d8', surface: '#fef4e8', panel: '#280e08', accent: '#b83810', accent2: '#d87030', ink: '#280e08', muted: '#a07058', border: '#e0ccb0', paper: '#faf0e0' },
  { id: 'trace', name: 'Trace', emoji: '✒️', fontFamily: 'Georgia, serif', bg: '#f8f4ea', surface: '#fefcf4', panel: '#0c0a06', accent: '#181808', accent2: '#484840', ink: '#0c0a06', muted: '#9a9888', border: '#e0dcd0', paper: '#fefcf6' },
  { id: 'volume', name: 'Volume', emoji: '📐', fontFamily: 'system-ui, sans-serif', bg: '#eeeadf', surface: '#f8f4ea', panel: '#0a1440', accent: '#1838c0', accent2: '#3060d8', ink: '#0a1440', muted: '#7080a8', border: '#d0d4e0', paper: '#f4f0e4' },
  { id: 'rythme', name: 'Rythme', emoji: '♩', fontFamily: 'system-ui, sans-serif', bg: '#f0f4f2', surface: '#fafcf8', panel: '#182828', accent: '#388080', accent2: '#d86858', ink: '#182828', muted: '#788a80', border: '#d4dad8', paper: '#f6faf6' },
  { id: 'reverie', name: 'Rêverie', emoji: '🌙', fontFamily: 'Georgia, serif', bg: '#f0edf8', surface: '#f8f5ff', panel: '#100c28', accent: '#7850b8', accent2: '#a880d0', ink: '#100c28', muted: '#7870a0', border: '#d8d0ec', paper: '#f4f0fc' },
  { id: 'structure', name: 'Structure', emoji: '⊞', fontFamily: 'system-ui, sans-serif', bg: '#f6f2e8', surface: '#fefcf4', panel: '#181410', accent: '#c01808', accent2: '#e04040', ink: '#181410', muted: '#9a9080', border: '#e0d8c8', paper: '#faf6ec' },
  { id: 'elevation', name: 'Élévation', emoji: '▲', fontFamily: 'Georgia, serif', bg: '#faeee0', surface: '#fef6ec', panel: '#280e04', accent: '#c85010', accent2: '#e07020', ink: '#280e04', muted: '#a07048', border: '#e8d0b0', paper: '#fcf0e0' },
  { id: 'harmonie', name: 'Harmonie', emoji: '🌸', fontFamily: 'Georgia, serif', bg: '#f0f2ec', surface: '#fafaf6', panel: '#182018', accent: '#386040', accent2: '#d07070', ink: '#182018', muted: '#7a8870', border: '#d4dac8', paper: '#f6f8f2' },
]

export function getThemeById(id: string): FormaVisualTheme {
  return FORMA_THEMES.find((t) => t.id === id) ?? FORMA_THEMES[0]
}
