/** FormaDico — dictionnaire (source libre Wiktionary) */

export const FD_LANGS = [
  { id: 'fr', label: 'Français', wiki: 'fr.wiktionary.org' },
  { id: 'en', label: 'English', wiki: 'en.wiktionary.org' },
]

export const FD_SECTIONS = [
  { id: 'definitions', label: 'Définitions', icon: '📖' },
  { id: 'synonyms', label: 'Synonymes', icon: '≈' },
  { id: 'antonyms', label: 'Antonymes', icon: '≠' },
  { id: 'expressions', label: 'Expressions', icon: '💬' },
  { id: 'conjugation', label: 'Conjugaison', icon: '🔤' },
  { id: 'grammar', label: 'Grammaire', icon: '📚' },
  { id: 'examples', label: 'Exemples', icon: '✎' },
]

export const FD_CACHE_KEY = 'forma-dico-cache-v1'
export const FD_MAX_CACHE = 120
export const FD_MAX_HISTORY = 40
export const FD_MAX_FAVORITES = 80

export const FD_DARK = {
  bg: '#0f1118',
  surface: '#151724',
  panel: '#1a1e28',
  ink: '#e8ecf4',
  muted: '#8b95a8',
  border: '#2a3144',
  accent: '#6b9fd4',
}
