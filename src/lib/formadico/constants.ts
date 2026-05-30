export const FD_LANGS = [
  { id: 'fr', label: 'Français', wiki: 'fr.wiktionary.org' },
  { id: 'en', label: 'English', wiki: 'en.wiktionary.org' },
] as const

export const FD_CACHE_KEY = 'forma-dico-cache-v1'
export const FD_MAX_CACHE = 120
export const FD_MAX_HISTORY = 40
export const FD_MAX_FAVORITES = 80

export interface DicoDefinition {
  pos: string
  text: string
}

export interface DicoEntry {
  word: string
  lang: string
  found: boolean
  definitions?: DicoDefinition[]
  synonyms?: string[]
  antonyms?: string[]
  expressions?: string[]
  conjugation?: string[] | null
  examples?: string[]
  grammar?: {
    pos?: string | null
    gender?: string | null
    plural?: string | null
    feminine?: string | null
  }
  source?: string
  url?: string
  fromCache?: boolean
  error?: string
  suggestions?: string[]
}
