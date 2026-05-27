/** FormaReview — constantes UI et outils */

export const FRV_DARK = {
  bg: '#0d0f14',
  surface: '#151820',
  panel: '#1a1e28',
  border: '#2a3144',
  ink: '#e8ecf4',
  muted: '#8b95a8',
  accent: '#e8a87c',
  accent2: '#ffd4a8',
  prof: '#e85d5d',
  student: '#5d9ee8',
  team: '#7bc96f',
  jury: '#c47de8',
}

export const A4_PX = { width: 794, height: 1123 }

export const REVIEW_TOOLS = {
  select: { id: 'select', label: 'Sélection', icon: '↖' },
  pin: { id: 'pin', label: 'Pin', icon: '📍' },
  highlight: { id: 'highlight', label: 'Surlignage', icon: '🖍' },
  text: { id: 'text', label: 'Texte', icon: 'T' },
  arrow: { id: 'arrow', label: 'Flèche', icon: '→' },
  draw: { id: 'draw', label: 'Dessin', icon: '✎' },
  hand: { id: 'hand', label: 'Déplacer', icon: '✋' },
}

export const REVIEW_MODES = {
  plans: { id: 'plans', label: 'Corrections de plans', icon: '📐' },
  team: { id: 'team', label: 'Révision équipe', icon: '👥' },
  jury: { id: 'jury', label: 'Annotations jury', icon: '⚖' },
  prof: { id: 'prof', label: 'Commentaires prof', icon: '🎓' },
}

export const REVIEW_ROLES = {
  prof: { id: 'prof', label: 'Professeur', color: FRV_DARK.prof },
  student: { id: 'student', label: 'Étudiant', color: FRV_DARK.student },
  team: { id: 'team', label: 'Équipe', color: FRV_DARK.team },
  jury: { id: 'jury', label: 'Jury', color: FRV_DARK.jury },
}

export const MARKUP_COLORS = [
  '#e85d5d', '#e8a87c', '#f4e04d', '#7bc96f', '#5d9ee8', '#c47de8', '#ffffff',
]

export const DEFAULT_MARKUP = {
  highlight: { color: 'rgba(244,224,77,0.35)', stroke: '#f4e04d' },
  text: { color: '#e85d5d', fontSize: 16 },
  arrow: { color: '#e85d5d', width: 3 },
  draw: { color: '#5d9ee8', width: 3 },
}
