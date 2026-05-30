import type { FormaReviewMode, FormaReviewRole, FormaReviewTool } from '../../types'

export const A4_PX = { width: 794, height: 1123 }

export const REVIEW_TOOLS: Record<
  FormaReviewTool,
  { id: FormaReviewTool; label: string; icon: string }
> = {
  select: { id: 'select', label: 'Sélection', icon: '↖' },
  hand: { id: 'hand', label: 'Déplacer', icon: '✋' },
  draw: { id: 'draw', label: 'Crayon', icon: '✎' },
  eraser: { id: 'eraser', label: 'Gomme', icon: '◻' },
  highlight: { id: 'highlight', label: 'Surligneur', icon: '🖍' },
  text: { id: 'text', label: 'Texte', icon: 'T' },
  arrow: { id: 'arrow', label: 'Flèche', icon: '→' },
  rect: { id: 'rect', label: 'Rectangle', icon: '▭' },
  circle: { id: 'circle', label: 'Cercle', icon: '○' },
  pin: { id: 'pin', label: 'Pin', icon: '📍' },
}

export const REVIEW_MODES: Record<
  FormaReviewMode,
  { id: FormaReviewMode; label: string; icon: string }
> = {
  plans: { id: 'plans', label: 'Corrections de plans', icon: '📐' },
  team: { id: 'team', label: 'Révision équipe', icon: '👥' },
  jury: { id: 'jury', label: 'Annotations jury', icon: '⚖' },
  prof: { id: 'prof', label: 'Commentaires prof', icon: '🎓' },
}

export const REVIEW_ROLES: Record<FormaReviewRole, { id: FormaReviewRole; label: string; color: string }> = {
  prof: { id: 'prof', label: 'Professeur', color: '#e85d5d' },
  student: { id: 'student', label: 'Étudiant', color: '#5d9ee8' },
  team: { id: 'team', label: 'Équipe', color: '#7bc96f' },
  jury: { id: 'jury', label: 'Jury', color: '#c47de8' },
}

export const MARKUP_COLORS = [
  '#e85d5d',
  '#e8a87c',
  '#f4e04d',
  '#7bc96f',
  '#5d9ee8',
  '#c47de8',
  '#ffffff',
]

export const DEFAULT_MARKUP = {
  highlight: { color: 'rgba(244,224,77,0.35)', stroke: '#f4e04d' },
  text: { color: '#e85d5d', fontSize: 16 },
  arrow: { color: '#e85d5d', width: 3 },
  draw: { color: '#5d9ee8', width: 3 },
}

export const REVIEW_MODE_LIST = Object.values(REVIEW_MODES)
