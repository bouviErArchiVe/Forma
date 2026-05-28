/** FormaPresent — constantes UI */

import { FORMA_THEME_VARS } from '@/lib/formaShell'

export const FPR_DARK = {
  ...FORMA_THEME_VARS,
}

export const SLIDE_SIZE = { width: 1920, height: 1080 }

export const TRANSITIONS = {
  none: { id: 'none', label: 'Aucune' },
  fade: { id: 'fade', label: 'Fondu' },
  slide: { id: 'slide', label: 'Glissement' },
  zoom: { id: 'zoom', label: 'Zoom' },
}

export const ANIMATIONS = {
  none: { id: 'none', label: 'Aucune' },
  fadeIn: { id: 'fadeIn', label: 'Apparition' },
  slideUp: { id: 'slideUp', label: 'Monter' },
  zoomIn: { id: 'zoomIn', label: 'Zoom' },
}

export const ELEMENT_TYPES = {
  text: { id: 'text', label: 'Texte', icon: 'T' },
  image: { id: 'image', label: 'Image', icon: '🖼' },
  video: { id: 'video', label: 'Vidéo', icon: '▶' },
  embed: { id: 'embed', label: 'Embed', icon: '🔗' },
}

export const TEMPLATE_IDS = {
  architecture: { id: 'architecture', label: 'Architecture', icon: '🏛' },
  portfolio: { id: 'portfolio', label: 'Portfolio', icon: '📁' },
  jury: { id: 'jury', label: 'Jury', icon: '⚖' },
  scolaire: { id: 'scolaire', label: 'Présentation scolaire', icon: '🎓' },
  concept: { id: 'concept', label: 'Planche concept', icon: '💡' },
}

export const ALIGNMENTS = ['left', 'center', 'right', 'top', 'middle', 'bottom']

export const DEFAULT_GRID = 20
