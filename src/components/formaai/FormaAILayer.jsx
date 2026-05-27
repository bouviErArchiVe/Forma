import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import GlobalSearchModal from '@/components/formaai/GlobalSearchModal'
import FormaAIFab from '@/components/formaai/FormaAIFab'
import { useFormaAIShortcuts } from '@/hooks/useFormaAI'

export default function FormaAILayer() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchOpen, setSearchOpen] = useState(false)
  const openSearch = useCallback(() => setSearchOpen(true), [])
  const openAI = useCallback(() => {
    if (location.pathname !== '/formaai') navigate('/formaai')
  }, [location.pathname, navigate])

  useFormaAIShortcuts({ onSearch: openSearch, onAI: openAI })

  useEffect(() => {
    const onOpenAI = () => openAI()
    const onOpenSearch = () => openSearch()
    window.addEventListener('forma:open-ai', onOpenAI)
    window.addEventListener('forma:open-search', onOpenSearch)
    return () => {
      window.removeEventListener('forma:open-ai', onOpenAI)
      window.removeEventListener('forma:open-search', onOpenSearch)
    }
  }, [openAI, openSearch])

  if (location.pathname === '/formaai') return null

  return (
    <>
      <FormaAIFab onSearch={openSearch} onAI={openAI} />
      <GlobalSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
