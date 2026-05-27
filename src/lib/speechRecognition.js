/** Wrapper SpeechRecognition (WebKit / standard) — dictée vocale EditorPage */

export function getSpeechRecognitionCtor() {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

export function isSpeechRecognitionSupported() {
  return !!getSpeechRecognitionCtor()
}

export const DICTATION_LANGUAGES = [
  { id: 'fr-FR', label: 'Français' },
  { id: 'en-US', label: 'English (US)' },
  { id: 'en-GB', label: 'English (UK)' },
  { id: 'es-ES', label: 'Español' },
  { id: 'de-DE', label: 'Deutsch' },
]

export function normalizeDictationLang(lang) {
  const ids = DICTATION_LANGUAGES.map((l) => l.id)
  return ids.includes(lang) ? lang : 'fr-FR'
}
