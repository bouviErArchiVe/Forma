import { FCMB_DARK, FCMB_PAGE_TYPES } from '@/lib/formacombine/constants'

export default function CombineSidebar({
  pages, selectedId, onSelect, onReorder, onRename, onDelete, onDuplicate, onRotate,
}) {
  const dragIdx = { current: null }

  const handleDrop = (toIdx) => {
    const from = dragIdx.current
    if (from == null || from === toIdx) return
    onReorder(from, toIdx)
    dragIdx.current = null
  }

  return (
    <aside style={{
      width: 280, flexShrink: 0, borderRight: `1px solid ${FCMB_DARK.border}`,
      background: FCMB_DARK.panel, display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div style={{ padding: '12px 14px', borderBottom: `1px solid ${FCMB_DARK.border}`, fontSize: 13, color: FCMB_DARK.muted }}>
        {pages.length} page{pages.length !== 1 ? 's' : ''}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
        {pages.length === 0 && (
          <p style={{ color: FCMB_DARK.muted, fontSize: 13, padding: 12, textAlign: 'center' }}>
            Importez des fichiers pour commencer
          </p>
        )}
        {pages.map((pg, idx) => (
          <div
            key={pg.id}
            draggable
            onDragStart={() => { dragIdx.current = idx }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(idx)}
            onClick={() => onSelect(pg.id)}
            style={{
              padding: '8px 10px', marginBottom: 4, borderRadius: 8, cursor: 'grab',
              background: selectedId === pg.id ? '#252b3a' : 'transparent',
              border: `1px solid ${selectedId === pg.id ? FCMB_DARK.accent : 'transparent'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: FCMB_DARK.muted, fontSize: 11, minWidth: 18 }}>{idx + 1}</span>
              <input
                value={pg.name}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => onRename(pg.id, e.target.value)}
                style={{
                  flex: 1, background: 'transparent', border: 'none', color: FCMB_DARK.ink,
                  fontSize: 13, outline: 'none',
                }}
              />
            </div>
            <div style={{ fontSize: 11, color: FCMB_DARK.muted, marginTop: 2, paddingLeft: 24 }}>
              {FCMB_PAGE_TYPES[pg.type] || pg.type}
              {pg.rotation ? ` · ${pg.rotation}°` : ''}
              {pg.width && pg.height ? ` · ${pg.width}×${pg.height}` : ''}
            </div>
            <div style={{ display: 'flex', gap: 4, marginTop: 6, paddingLeft: 24 }}>
              <Btn small onClick={(e) => { e.stopPropagation(); onRotate(pg.id) }}>↻</Btn>
              <Btn small onClick={(e) => { e.stopPropagation(); onDuplicate(pg.id) }}>⧉</Btn>
              <Btn small danger onClick={(e) => { e.stopPropagation(); onDelete(pg.id) }}>✕</Btn>
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}

function Btn({ children, onClick, small, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: small ? '2px 6px' : '4px 10px',
        fontSize: 11,
        borderRadius: 4,
        border: `1px solid ${FCMB_DARK.border}`,
        background: danger ? '#3a1f1f' : '#222833',
        color: danger ? '#f88' : FCMB_DARK.ink,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}
