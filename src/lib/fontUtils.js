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

const GOOGLE_FONT_URLS = {
  Inter: 'Inter:wght@400;500;600;700',
  Poppins: 'Poppins:wght@400;500;600;700',
  Roboto: 'Roboto:wght@400;500;700',
  'IBM Plex Sans': 'IBM+Plex+Sans:wght@400;500;600;700',
  'JetBrains Mono': 'JetBrains+Mono:wght@400;500;600;700',
  'Playfair Display': 'Playfair+Display:wght@400;600;700',
}

export function getGoogleFontHref(fontName) {
  const fontUrl = GOOGLE_FONT_URLS[fontName]
  if (!fontUrl) return null
  return `https://fonts.googleapis.com/css2?family=${fontUrl}&display=swap`
}

