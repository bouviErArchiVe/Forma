import { useCallback, useEffect, useRef, useState } from 'react'
import { lookupWord, searchSuggestions } from '../lib/formadico/provider'
import { useFormaDicoStore } from '../stores/formadicoStore'
import type { DicoEntry } from '../lib/formadico/constants'

export function useFormaDicoLookup(initialWord = '') {
  const lang = useFormaDicoStore((s) => s.lang)
  const pushHistory = useFormaDicoStore((s) => s.pushHistory)
  const [query, setQuery] = useState(initialWord || '')
  const [entry, setEntry] = useState<DicoEntry | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(
    async (word: string, overrideLang?: string) => {
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
        const res = (await lookupWord(q, l)) as DicoEntry
        setEntry(res)
        if (res.found) pushHistory(q, l)
        else if (res.suggestions) setSuggestions(res.suggestions)
        if (res.error) setError(res.error)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Recherche impossible.')
        setEntry(null)
      } finally {
        setLoading(false)
      }
    },
    [lang, pushHistory],
  )

  useEffect(() => {
    if (initialWord) {
      setQuery(initialWord)
      void search(initialWord)
    }
  }, [initialWord, search])

  const fetchSuggestions = useCallback(
    (text: string) => {
      if (debRef.current) clearTimeout(debRef.current)
      debRef.current = setTimeout(async () => {
        const list = await searchSuggestions(text, lang).catch(() => [])
        setSuggestions(list as string[])
      }, 280)
    },
    [lang],
  )

  return {
    query,
    setQuery,
    entry,
    suggestions,
    loading,
    error,
    lang,
    search,
    fetchSuggestions,
    setSuggestions,
    setError,
  }
}
