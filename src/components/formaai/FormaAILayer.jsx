import GlobalSearchModal from '@/components/formaai/GlobalSearchModal'
import FormaAIPanel from '@/components/formaai/FormaAIPanel'
import FormaAIFab from '@/components/formaai/FormaAIFab'
import { useFormaAILayer } from '@/hooks/useFormaAI'

export default function FormaAILayer() {
  const {
    searchOpen, setSearchOpen, aiOpen, setAiOpen, aiText, openSearch, openAI,
  } = useFormaAILayer()

  return (
    <>
      <FormaAIFab onSearch={openSearch} onAI={() => openAI('')} />
      <GlobalSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <FormaAIPanel open={aiOpen} onClose={() => setAiOpen(false)} initialText={aiText} />
    </>
  )
}
