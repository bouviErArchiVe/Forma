import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ModalOverlay from '@/components/ui/ModalOverlay'
import BottomSheet from '@/components/ui/BottomSheet'
import GlassPanel from '@/components/ui/GlassPanel'
import { useTabletLayout } from '@/hooks/useTabletLayout'
import FormaDicoPanel from '@/components/formadico/FormaDicoPanel'
import useAppStore from '@/stores/useAppStore'

export default function FormaDicoWidget({ T, variant = 'drawer', open = true, onClose, stackOffset = 0 }) {
  const navigate = useNavigate()
  const isTablet = useTabletLayout()
  const consumePendingDicoWord = useAppStore((s) => s.consumePendingDicoWord)
  const [initialWord, setInitialWord] = useState('')

  useEffect(() => {
    if (!open) return
    const w = consumePendingDicoWord?.()
    if (w) setInitialWord(w)
  }, [open, consumePendingDicoWord])

  if (!open) return null

  const panel = (
        <FormaDicoPanel T={T} compact initialWord={initialWord} key={initialWord || 'dico'} onClose={onClose} />
  )

  if (variant === 'page') {
    return panel
  }

  const header = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <div>
        <div style={{ fontWeight: 800, fontSize: 14, color: T.ink }}>FormaDico</div>
        <div style={{ fontSize: 10, color: T.muted }}>Dictionnaire libre · Wiktionary</div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button type="button" onClick={() => navigate('/formadico')} style={iconBtn(T)} title="Ouvrir module">↗</button>
        {onClose && <button type="button" onClick={onClose} style={iconBtn(T)}>✕</button>}
      </div>
    </div>
  )

  if (variant === 'sheet' || isTablet) {
    return (
      <BottomSheet T={T} open={open} onClose={onClose} title="FormaDico" stackOffset={stackOffset}>
        {panel}
      </BottomSheet>
    )
  }

  return (
    <ModalOverlay onClose={onClose}>
      <GlassPanel T={T} style={{ width: 'min(520px, 96vw)', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: 16 }}>
        {header}
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>{panel}</div>
      </GlassPanel>
    </ModalOverlay>
  )
}

const iconBtn = (T) => ({
  background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8,
  width: 32, height: 32, cursor: 'pointer', color: T.ink, fontSize: 14,
})
