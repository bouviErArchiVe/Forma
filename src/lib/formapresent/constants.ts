export const SLIDE_SIZE = { width: 1920, height: 1080 } as const

export const TRANSITIONS = {
  none: { id: 'none', label: 'Aucune' },
  fade: { id: 'fade', label: 'Fondu' },
  slide: { id: 'slide', label: 'Glissement' },
  zoom: { id: 'zoom', label: 'Zoom' },
} as const

export const ANIMATIONS = {
  none: { id: 'none', label: 'Aucune' },
  fadeIn: { id: 'fadeIn', label: 'Apparition' },
  slideUp: { id: 'slideUp', label: 'Monter' },
  zoomIn: { id: 'zoomIn', label: 'Zoom' },
} as const

export const TEMPLATE_IDS = {
  blank: { id: 'blank', label: 'Vierge', emoji: '📄' },
  architecture: { id: 'architecture', label: 'Architecture', emoji: '🏛' },
  portfolio: { id: 'portfolio', label: 'Portfolio', emoji: '📁' },
  jury: { id: 'jury', label: 'Jury', emoji: '⚖' },
  scolaire: { id: 'scolaire', label: 'Scolaire', emoji: '🎓' },
  concept: { id: 'concept', label: 'Planche concept', emoji: '💡' },
} as const

export const PRESENT_TEMPLATE_LIST = Object.values(TEMPLATE_IDS)
