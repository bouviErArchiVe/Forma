import { FRV_DARK, REVIEW_MODES } from '@/lib/formareview/constants'

export default function ReviewSidebar({
  session, selectedPageId, onSelectPage, onAddPages, onDeletePage,
}) {
  const mode = REVIEW_MODES[session.mode] || REVIEW_MODES.plans

  return (
    <div style={{
      width: 220, minWidth: 200, display: 'flex', flexDirection: 'column',
      background: FRV_DARK.surface, borderRight: `1px solid ${FRV_DARK.border}`,
      height: '100%',
    }}>
      <div style={{ padding: '12px 14px', borderBottom: `1px solid ${FRV_DARK.border}` }}>
        <div style={{ fontSize: 11, color: FRV_DARK.muted }}>{mode.icon} {mode.label}</div>
        <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{session.title}</div>
        {session.description && (
          <div style={{ fontSize: 11, color: FRV_DARK.muted, marginTop: 4 }}>{session.description}</div>
        )}
      </div>

      <div style={{
        padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${FRV_DARK.border}`,
      }}>
        <span style={{ fontSize: 12, color: FRV_DARK.muted }}>Pages ({session.pages?.length || 0})</span>
        <label style={{ fontSize: 11, color: FRV_DARK.accent2, cursor: 'pointer' }}>
          + Importer
          <input
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files?.length) onAddPages?.(e.target.files)
              e.target.value = ''
            }}
          />
        </label>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
        {(session.pages || []).map((pg, i) => (
          <button
            key={pg.id}
            type="button"
            onClick={() => onSelectPage(pg.id)}
            style={{
              display: 'block', width: '100%', textAlign: 'left', marginBottom: 6,
              padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
              background: selectedPageId === pg.id ? `${FRV_DARK.accent}33` : FRV_DARK.panel,
              border: `1px solid ${selectedPageId === pg.id ? FRV_DARK.accent : FRV_DARK.border}`,
              color: FRV_DARK.ink,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600 }}>Page {i + 1}</div>
            <div style={{ fontSize: 10, color: FRV_DARK.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {pg.name}
            </div>
            {pg.dataUrl && (
              <img
                src={pg.dataUrl}
                alt=""
                style={{ width: '100%', height: 60, objectFit: 'cover', borderRadius: 4, marginTop: 6, opacity: 0.85 }}
              />
            )}
            {onDeletePage && (session.pages?.length || 0) > 1 && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); onDeletePage(pg.id) }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onDeletePage(pg.id) } }}
                style={{ fontSize: 10, color: FRV_DARK.muted, marginTop: 4, display: 'block' }}
              >
                Supprimer
              </span>
            )}
          </button>
        ))}
      </div>

      <div style={{ padding: 10, borderTop: `1px solid ${FRV_DARK.border}`, fontSize: 10, color: FRV_DARK.muted }}>
        {(session.pins || []).length} pin(s) · {(session.markups || []).length} annotation(s) · {(session.comments || []).length} commentaire(s)
      </div>
    </div>
  )
}
