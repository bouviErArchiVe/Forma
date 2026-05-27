import { useState, useEffect, useCallback } from 'react'

/** Raccourcis globaux FormaAI : Ctrl+K recherche, Alt+A assistant */
export function useFormaAIShortcuts({ onSearch, onAI }) {
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        onSearch?.()
        return
      }
      if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault()
        onAI?.()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onSearch, onAI])
}

export function useFormaAILayer() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiText, setAiText] = useState('')

  const openSearch = useCallback(() => setSearchOpen(true), [])
  const openAI = useCallback((text = '') => {
    setAiText(text)
    setAiOpen(true)
  }, [])

  useFormaAIShortcuts({ onSearch: openSearch, onAI: () => openAI('') })

  useEffect(() => {
    const onOpenAI = () => openAI('')
    const onOpenSearch = () => openSearch()
    window.addEventListener('forma:open-ai', onOpenAI)
    window.addEventListener('forma:open-search', onOpenSearch)
    return () => {
      window.removeEventListener('forma:open-ai', onOpenAI)
      window.removeEventListener('forma:open-search', onOpenSearch)
    }
  }, [openAI, openSearch])

  return {
    searchOpen,
    setSearchOpen,
    aiOpen,
    setAiOpen,
    aiText,
    openSearch,
    openAI,
  }
}
