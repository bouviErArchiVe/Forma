import { FPR_DARK, TRANSITIONS } from '@/lib/formapresent/constants'

export default function PresentSidebar({
  deck, selectedSlideId, onSelectSlide, onAddSlide, onDuplicateSlide, onDeleteSlide,
  onUpdateSlide, onReorder,
}) {
  const slides = deck?.slides || []

  return (
    <div style={{
      width: 200, minWidth: 180, display: 'flex', flexDirection: 'column',
      background: FPR_DARK.surface, borderRight: `1px solid ${FPR_DARK.border}`, height: '100%',
    }}>
      <div style={{
        padding: '10px 12px', borderBottom: `1px solid ${FPR_DARK.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 12, color: FPR_DARK.muted }}>Slides ({slides.length})</span>
        <button type="button" onClick={onAddSlide} style={linkBtn}>+ Ajouter</button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
        {slides.map((sl, i) => (
          <div
            key={sl.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelectSlide(sl.id)}
            onKeyDown={(e) => e.key === 'Enter' && onSelectSlide(sl.id)}
            style={{
              marginBottom: 8, borderRadius: 8, cursor: 'pointer', overflow: 'hidden',
              border: `2px solid ${selectedSlideId === sl.id ? FPR_DARK.accent : FPR_DARK.border}`,
              background: FPR_DARK.panel,
            }}
          >
            <div style={{
              aspectRatio: '16/9', background: sl.bgColor || '#fff',
              backgroundImage: sl.bgImage ? `url(${sl.bgImage})` : undefined,
              backgroundSize: 'cover', position: 'relative', fontSize: 8,
            }}>
              {(sl.elements || []).slice(0, 4).map((el) => (
                <div key={el.id} style={{
                  position: 'absolute',
                  left: `${(el.x / 1920) * 100}%`,
                  top: `${(el.y / 1080) * 100}%`,
                  width: `${(el.w / 1920) * 100}%`,
                  height: `${(el.h / 1080) * 100}%`,
                  background: el.type === 'text' ? 'transparent' : '#ddd',
                  opacity: 0.7,
                  overflow: 'hidden',
                }}>
                  {el.type === 'text' && (
                    <span style={{ fontSize: 6, color: el.color }}>{String(el.content || '').slice(0, 20)}</span>
                  )}
                </div>
              ))}
            </div>
            <div style={{ padding: '6px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {i + 1}. {sl.name}
              </span>
              <button type="button" title="Monter" onClick={(e) => { e.stopPropagation(); if (i > 0) onReorder(i, i - 1) }} style={miniBtn}>↑</button>
              <button type="button" title="Descendre" onClick={(e) => { e.stopPropagation(); if (i < slides.length - 1) onReorder(i, i + 1) }} style={miniBtn}>↓</button>
              <button type="button" title="Dupliquer" onClick={(e) => { e.stopPropagation(); onDuplicateSlide(sl.id) }} style={miniBtn}>⧉</button>
              {slides.length > 1 && (
                <button type="button" title="Supprimer" onClick={(e) => { e.stopPropagation(); onDeleteSlide(sl.id) }} style={miniBtn}>×</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedSlideId && (
        <div style={{ padding: 10, borderTop: `1px solid ${FPR_DARK.border}` }}>
          <label style={{ fontSize: 10, color: FPR_DARK.muted, display: 'block', marginBottom: 4 }}>Notes présentateur</label>
          <textarea
            value={slides.find((s) => s.id === selectedSlideId)?.notes || ''}
            onChange={(e) => onUpdateSlide(selectedSlideId, { notes: e.target.value })}
            rows={3}
            style={{
              width: '100%', boxSizing: 'border-box', fontSize: 11, background: FPR_DARK.bg,
              color: FPR_DARK.ink, border: `1px solid ${FPR_DARK.border}`, borderRadius: 6, padding: 6, resize: 'vertical',
            }}
            placeholder="Notes visibles en mode présentation…"
          />
          <label style={{ fontSize: 10, color: FPR_DARK.muted, display: 'block', marginTop: 8, marginBottom: 4 }}>Transition</label>
          <select
            value={slides.find((s) => s.id === selectedSlideId)?.transition || 'fade'}
            onChange={(e) => onUpdateSlide(selectedSlideId, { transition: e.target.value })}
            style={{
              width: '100%', fontSize: 11, background: FPR_DARK.bg, color: FPR_DARK.ink,
              border: `1px solid ${FPR_DARK.border}`, borderRadius: 6, padding: 4,
            }}
          >
            {Object.values(TRANSITIONS).map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}

const linkBtn = { background: 'none', border: 'none', color: '#9ec5ff', cursor: 'pointer', fontSize: 11 }
const miniBtn = { background: 'none', border: 'none', color: '#8b95a8', cursor: 'pointer', fontSize: 11, padding: '0 2px' }
