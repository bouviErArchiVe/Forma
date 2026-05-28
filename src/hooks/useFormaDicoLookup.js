import { useCallback, useEffect, useRef, useState } from 'react'
import { lookupWord, searchSuggestions } from '@/lib/formadico/provider'
import useFormaDicoStore from '@/stores/useFormaDicoStore'

export function useFormaDicoLookup(initialWord = '') {
  const lang = useFormaDicoStore((s) => s.lang)
  const pushHistory = useFormaDicoStore((s) => s.pushHistory)
  const [query, setQuery] = useState(initialWord || '')
  const [entry, setEntry] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const debRef = useRef(null)

  const search = useCallback(async (word, overrideLang) => {
    const q = String(word || '').trim()
    if (q.length < 2) {
      setEntry(null)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const l = overrideLang || lang
      const res = await lookupWord(q, l)
      setEntry(res)
      if (res.found) pushHistory(q, l)
      else if (res.suggestions) setSuggestions(res.suggestions)
      if (res.error) setError(res.error)
    } catch (err) {
      setError(err.message || 'Recherche impossible.')
      setEntry(null)
    } finally {
      setLoading(false)
    }
  }, [lang, pushHistory])

  useEffect(() => {
    if (initialWord) {
      setQuery(initialWord)
      search(initialWord)
    }
  }, [initialWord]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSuggestions = useCallback((text) => {
    clearTimeout(debRef.current)
    debRef.current = setTimeout(async () => {
      const list = await searchSuggestions(text, lang).catch(() => [])
      setSuggestions(list)
    }, 280)
  }, [lang])

  return {
    query, setQuery, entry, suggestions, loading, error, lang,
    search, fetchSuggestions, setSuggestions, setError,
  }
}
