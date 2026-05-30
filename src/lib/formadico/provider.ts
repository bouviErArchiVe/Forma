// @ts-nocheck
/** FormaDico — Wiktionary (libre) + cache hors ligne */

import { FD_LANGS } from './constants'
import { parseWiktionaryEntry } from './parse'
import { getCachedEntry, setCachedEntry } from './cache'

function wikiHost(lang) {
  return FD_LANGS.find((l) => l.id === lang)?.wiki || 'fr.wiktionary.org'
}

async function wikiFetch(params, lang = 'fr') {
  const host = wikiHost(lang)
  const qs = new URLSearchParams({ format: 'json', origin: '*', ...params })
  const res = await fetch(`https://${host}/w/api.php?${qs}`)
  if (!res.ok) throw new Error('Dictionnaire indisponible — vérifiez votre connexion.')
  return res.json()
}

export async function searchSuggestions(query, lang = 'fr', limit = 8) {
  const q = String(query || '').trim()
  if (q.length < 2) return []
  const data = await wikiFetch({
    action: 'opensearch',
    search: q,
    limit: String(limit),
    namespace: '0',
  }, lang)
  return Array.isArray(data?.[1]) ? data[1] : []
}

async function fetchWiktionaryWikitext(word, lang = 'fr') {
  const page = word.trim().replace(/ /g, '_')
  const data = await wikiFetch({ action: 'parse', page, prop: 'wikitext', redirects: '1' }, lang)
  const wt = data?.parse?.wikitext?.['*']
  if (!wt) return null
  return parseWiktionaryEntry(wt, word, lang)
}

async function fetchFreeDictionaryEn(word) {
  const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
  if (!res.ok) return null
  const data = await res.json()
  const entry = data?.[0]
  if (!entry) return null
  return {
    word,
    lang: 'en',
    found: true,
    definitions: (entry.meanings || []).flatMap((m) =>
      (m.definitions || []).slice(0, 3).map((d) => ({
        pos: m.partOfSpeech || '—',
        text: d.definition,
      }))
    ).slice(0, 10),
    synonyms: (entry.meanings || []).flatMap((m) => (m.synonyms || [])).slice(0, 12),
    antonyms: (entry.meanings || []).flatMap((m) => (m.antonyms || [])).slice(0, 12),
    examples: (entry.meanings || []).flatMap((m) =>
      (m.definitions || []).map((d) => d.example).filter(Boolean)
    ).slice(0, 8),
    expressions: [],
    conjugation: null,
    grammar: { pos: entry.meanings?.[0]?.partOfSpeech || null, gender: null, plural: null, feminine: null },
    source: 'dictionaryapi.dev',
    url: `https://en.wiktionary.org/wiki/${encodeURIComponent(word)}`,
  }
}

export async function lookupWord(word, lang = 'fr', { useCache = true } = {}) {
  const q = String(word || '').trim().toLowerCase()
  if (!q || q.length < 2) {
    return { word: q, lang, found: false, error: 'Mot trop court.' }
  }

  if (useCache) {
    const cached = getCachedEntry(q, lang)
    if (cached) return { ...cached, fromCache: true }
  }

  let entry = null
  try {
    entry = await fetchWiktionaryWikitext(q, lang)
  } catch (err) {
    return { word: q, lang, found: false, error: err.message || 'Recherche impossible.' }
  }

  if ((!entry || !entry.found) && lang === 'en') {
    try {
      entry = await fetchFreeDictionaryEn(q)
    } catch { /* fallback */ }
  }

  if (!entry || !entry.found) {
    const suggestions = await searchSuggestions(q, lang, 6).catch(() => [])
    return {
      word: q,
      lang,
      found: false,
      suggestions,
      error: suggestions.length
        ? 'Mot introuvable — suggestions ci-dessous.'
        : 'Mot introuvable dans le dictionnaire libre.',
    }
  }

  setCachedEntry(q, lang, entry)
  return entry
}

export function extractWordFromSelection() {
  const sel = window.getSelection?.()
  if (!sel?.toString().trim()) return null
  const raw = sel.toString().trim().split(/\s+/)[0]
  const word = raw.replace(/^[^\p{L}]+|[^\p{L}'-]+$/gu, '')
  return word.length >= 2 ? word.toLowerCase() : null
}

/** API externe future — VITE_DICO_API_URL */
export async function lookupCustomApi(word, lang = 'fr') {
  const base = import.meta.env.VITE_DICO_API_URL
  if (!base) return null
  const res = await fetch(`${base.replace(/\/$/, '')}/lookup?word=${encodeURIComponent(word)}&lang=${lang}`)
  if (!res.ok) return null
  return res.json()
}
