export const APP_FONT_CHOICES = [
  { id: '', label: 'Par défaut (thème)' },
  { id: 'Inter', label: 'Inter' },
  { id: 'Poppins', label: 'Poppins' },
  { id: 'Roboto', label: 'Roboto' },
  { id: 'Helvetica Neue', label: 'Helvetica Neue (système)' },
  { id: 'IBM Plex Sans', label: 'IBM Plex Sans' },
  { id: 'JetBrains Mono', label: 'JetBrains Mono' },
  { id: 'Playfair Display', label: 'Playfair Display' },
]

/** Polices manuscrites / annotation pour le texte sur canvas */
export const CANVAS_TEXT_FONTS = [
  { id: 'Nunito', label: 'Nunito' },
  { id: 'Syne', label: 'Syne' },
  { id: 'Architects Daughter', label: 'Architects Daughter' },
  { id: 'Patrick Hand', label: 'Patrick Hand' },
  { id: 'Caveat', label: 'Caveat' },
  { id: 'Kalam', label: 'Kalam' },
  { id: 'Gloria Hallelujah', label: 'Gloria Hallelujah' },
  { id: 'Indie Flower', label: 'Indie Flower' },
  { id: 'Nothing You Could Do', label: 'Nothing You Could Do' },
  { id: 'Reenie Beanie', label: 'Reenie Beanie' },
]

const GOOGLE_FONT_URLS = {
  Inter: 'Inter:wght@400;500;600;700',
  Poppins: 'Poppins:wght@400;500;600;700',
  Roboto: 'Roboto:wght@400;500;700',
  'IBM Plex Sans': 'IBM+Plex+Sans:wght@400;500;600;700',
  'JetBrains Mono': 'JetBrains+Mono:wght@400;500;600;700',
  'Playfair Display': 'Playfair+Display:wght@400;600;700',
}

const CANVAS_FONT_PARTS = [
  'Syne:wght@400;600;700',
  'Nunito:wght@400;600;700',
  'Architects+Daughter',
  'Patrick+Hand',
  'Caveat:wght@400;700',
  'Kalam',
  'Gloria+Hallelujah',
  'Indie+Flower',
  'Nothing+You+Could+Do',
  'Reenie+Beanie',
]

export function canvasFontCss(fontId) {
  const id = fontId || 'Nunito'
  return `'${id}', sans-serif`
}

export function getCanvasFontsHref() {
  return `https://fonts.googleapis.com/css2?${CANVAS_FONT_PARTS.map((p) => `family=${p}`).join('&')}&display=swap`
}

export function ensureCanvasTextFontsLoaded() {
  if (typeof document === 'undefined') return
  if (document.getElementById('forma-canvas-text-fonts')) return
  const link = document.createElement('link')
  link.id = 'forma-canvas-text-fonts'
  link.rel = 'stylesheet'
  link.href = getCanvasFontsHref()
  document.head.appendChild(link)
}

export function getGoogleFontHref(fontName) {
  const fontUrl = GOOGLE_FONT_URLS[fontName]
  if (!fontUrl) return null
  return `https://fonts.googleapis.com/css2?family=${fontUrl}&display=swap`
}

