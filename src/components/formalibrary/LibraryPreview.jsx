import { categoryIcon, categoryLabel, FLB_DARK } from '@/lib/formalibrary/constants'

export default function LibraryPreview({ item, onClose, onToggleFavorite, onDelete }) {
  if (!item) {
    return (
      <div style={{
        width: 280, borderLeft: `1px solid ${FLB_DARK.border}`, background: FLB_DARK.panel,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: FLB_DARK.muted, fontSize: 13,
      }}>
        Sélectionnez un élément
      </div>
    )
  }

  const preview = item.previewUrl || item.dataUrl

  return (
    <div style={{
      width: 300, minWidth: 260, borderLeft: `1px solid ${FLB_DARK.border}`, background: FLB_DARK.panel,
      display: 'flex', flexDirection: 'column', height: '100%',
    }}>
      <div style={{ padding: '12px 14px', borderBottom: `1px solid ${FLB_DARK.border}`, display: 'flex', gap: 8, alignItems: 'center' }}>
        <span>{categoryIcon(item.category)}</span>
        <strong style={{ flex: 1, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</strong>
        <button type="button" onClick={onClose} style={iconBtn}>✕</button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        {preview && (item.mimeType?.includes('pdf') || item.category === 'pdf') ? (
          <iframe title={item.name} src={preview} style={{ width: '100%', height: 320, border: 'none', borderRadius: 8, background: '#fff' }} />
        ) : preview ? (
          <img src={preview} alt={item.name} style={{ width: '100%', borderRadius: 8, objectFit: 'contain', maxHeight: 320, background: '#fff' }} />
        ) : (
          <div style={{
            height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: FLB_DARK.surface, borderRadius: 8, color: FLB_DARK.muted, fontSize: 32,
          }}>
            {categoryIcon(item.category)}
          </div>
        )}

        <div style={{ marginTop: 12, fontSize: 12, color: FLB_DARK.muted }}>
          <div><strong style={{ color: FLB_DARK.ink }}>Type :</strong> {categoryLabel(item.category)}</div>
          {item.pageCount > 0 && <div>Pages : {item.pageCount}</div>}
          {item.size > 0 && <div>Taille : {(item.size / 1024).toFixed(1)} Ko</div>}
          {item.refModule && <div>Lien : {item.refModule} / {item.refId}</div>}
        </div>

        {(item.tags?.length > 0) && (
          <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {item.tags.map((t) => (
              <span key={t} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: `${FLB_DARK.accent}33`, color: FLB_DARK.accent2 }}>#{t}</span>
            ))}
          </div>
        )}

        {item.textContent && (
          <div style={{
            marginTop: 12, padding: 10, borderRadius: 8, background: FLB_DARK.bg,
            fontSize: 11, lineHeight: 1.45, maxHeight: 160, overflow: 'auto', color: FLB_DARK.muted,
          }}>
            {item.textContent.slice(0, 800)}{item.textContent.length > 800 ? '…' : ''}
          </div>
        )}
      </div>

      <div style={{ padding: 12, borderTop: `1px solid ${FLB_DARK.border}`, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Btn onClick={onToggleFavorite}>{item.favorite ? '★ Retirer' : '☆ Favori'}</Btn>
        {preview && <Btn onClick={() => { const a = document.createElement('a'); a.href = preview; a.download = item.name; a.click() }}>Télécharger</Btn>}
        <Btn muted onClick={onDelete}>Supprimer</Btn>
      </div>
    </div>
  )
}

function Btn({ children, onClick, muted }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: '6px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
      border: `1px solid ${FLB_DARK.border}`, background: muted ? 'transparent' : FLB_DARK.surface,
      color: muted ? FLB_DARK.muted : FLB_DARK.ink,
    }}>
      {children}
    </button>
  )
}

const iconBtn = { background: 'none', border: 'none', color: FLB_DARK.muted, cursor: 'pointer' }
