import { useState } from 'react'
import { extractWordFromSelection } from '@/lib/formadico/provider'
import useAppStore from '@/stores/useAppStore'

/** Menu clic droit — chercher dans FormaDico */
export default function FormaDicoContextMenu({ x, y, word, onClose, onLookup }) {
  if (!word) return null
  const setPendingDicoWord = useAppStore.getState().setPendingDicoWord

  return (
    <div
      style={{
        position: 'fixed', left: x, top: y, zIndex: 9999,
        background: '#1a1e28', border: '1px solid #2a3144', borderRadius: 8,
        boxShadow: '0 8px 24px rgba(0,0,0,.35)', minWidth: 180, overflow: 'hidden',
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button type="button" onClick={() => { setPendingDicoWord(word); onLookup?.(word); onClose?.() }} style={item}>
        📖 Définir « {word} »
      </button>
      <button type="button" onClick={() => { navigator.clipboard?.writeText(word); onClose?.() }} style={item}>
        Copier le mot
      </button>
    </div>
  )
}

export function useFormaDicoContextMenu(onLookup) {
  const [menu, setMenu] = useState(null)

  const onContextMenu = (e) => {
    const sel = window.getSelection?.()
    const word = extractWordFromSelection()
    if (!word) return
    e.preventDefault()
    setMenu({ x: e.clientX, y: e.clientY, word })
  }

  const close = () => setMenu(null)

  const node = menu ? (
    <FormaDicoContextMenu {...menu} onClose={close} onLookup={onLookup} />
  ) : null

  return { onContextMenu, contextMenu: node, closeContextMenu: close }
}

const item = {
  display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px',
  background: 'none', border: 'none', color: '#e8ecf4', fontSize: 12, cursor: 'pointer',
}
