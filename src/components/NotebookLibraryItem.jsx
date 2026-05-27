import CoverPattern from '@/components/CoverPattern'

function timeAgo(d) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (m < 1) return "À l'instant"
  if (m < 60) return `Il y a ${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Il y a ${h}h`
  const days = Math.floor(h / 24)
  if (days === 1) return 'Hier'
  return new Date(d).toLocaleDateString('fr-FR')
}

function NotebookActions({ T, onAssign, onDelete }) {
  return (
    <div className="nb-btn-action" style={{ display: 'flex', gap: 2, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
      <button type="button" onClick={onAssign} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', fontSize: 11, padding: '2px 4px', borderRadius: 4 }} title="Dossier">📁</button>
      <button type="button" onClick={onDelete} style={{ background: 'none', border: 'none', color: '#e94560', cursor: 'pointer', fontSize: 11, padding: '2px 4px', borderRadius: 4 }} title="Supprimer">🗑</button>
    </div>
  )
}

/** Carte / ligne de carnet — grille, liste ou timeline. */
export default function NotebookLibraryItem({
  T,
  nb,
  subject,
  template,
  folder,
  view = 'grid',
  onOpen,
  onStar,
  onAssign,
  onDelete,
}) {
  const pages = nb.pages_count || 1

  if (view === 'list') {
    return (
      <div
        className="nb-card"
        onClick={onOpen}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 12px',
          borderRadius: 12,
          border: `1px solid ${T.border}`,
          background: T.surface,
          cursor: 'pointer',
          boxShadow: '0 1px 6px rgba(0,0,0,.04)',
          transition: 'transform .15s, box-shadow .15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 4px 16px ${subject.c}18` }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 6px rgba(0,0,0,.04)' }}
      >
        <div style={{ width: 5, alignSelf: 'stretch', borderRadius: 4, background: `linear-gradient(to bottom,${subject.c},${subject.c}88)`, flexShrink: 0 }} />
        <div style={{ width: 52, height: 52, flexShrink: 0, borderRadius: 10, overflow: 'hidden', position: 'relative', background: `linear-gradient(145deg,${subject.c}28,${subject.c}08)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CoverPattern tmpl={nb.template} color={subject.c} />
          <span style={{ fontSize: 22, position: 'relative', zIndex: 1 }}>{subject.e}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nb.title}</div>
          <div style={{ fontSize: 10, color: T.muted, marginTop: 3, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ color: subject.c, fontWeight: 700 }}>{subject.l}</span>
            <span>{template?.i} {template?.l}</span>
            <span>{pages} page{pages > 1 ? 's' : ''}</span>
            {folder && <span>{folder.e} {folder.n}</span>}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 72 }}>
          <div style={{ fontSize: 9, color: T.muted }}>{timeAgo(nb.updated_at)}</div>
          <button type="button" onClick={onStar} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: nb.starred ? '#f5a623' : T.muted, marginTop: 4 }}>★</button>
        </div>
        <NotebookActions T={T} onAssign={onAssign} onDelete={onDelete} />
      </div>
    )
  }

  if (view === 'timeline') {
    return (
      <div
        className="nb-card"
        onClick={onOpen}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 10px',
          borderRadius: 10,
          border: `1px solid ${T.border}`,
          background: T.bg,
          cursor: 'pointer',
          marginLeft: 8,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = T.surface }}
        onMouseLeave={(e) => { e.currentTarget.style.background = T.bg }}
      >
        <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: `${subject.c}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{subject.e}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nb.title}</div>
          <div style={{ fontSize: 9, color: T.muted, marginTop: 2 }}>{subject.l} · {pages}p · {timeAgo(nb.updated_at)}</div>
        </div>
        <button type="button" onClick={onStar} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: nb.starred ? '#f5a623' : T.muted }}>★</button>
        <NotebookActions T={T} onAssign={onAssign} onDelete={onDelete} />
      </div>
    )
  }

  // grid (default)
  return (
    <div
      className="nb-card"
      onClick={onOpen}
      style={{
        borderRadius: 16,
        background: T.surface,
        border: `1px solid ${T.border}`,
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,.06)',
      }}
    >
      <div style={{ height: 130, position: 'relative', overflow: 'hidden', background: `linear-gradient(145deg,${subject.c}25,${subject.c}08)` }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, background: `linear-gradient(to bottom,${subject.c},${subject.c}aa)` }} />
        <CoverPattern tmpl={nb.template} color={subject.c} />
        <button type="button" className="star-btn" onClick={onStar} style={{
          position: 'absolute', top: 8, right: 8,
          background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(4px)',
          border: 'none', borderRadius: 8, padding: '4px 6px', cursor: 'pointer',
          fontSize: 14, color: nb.starred ? '#f5a623' : 'rgba(255,255,255,.5)',
        }}>★</button>
        {folder && (
          <div style={{ position: 'absolute', bottom: 7, left: 12, fontSize: 9, color: `${T.ink}66`, background: 'rgba(255,255,255,.2)', borderRadius: 4, padding: '1px 5px', backdropFilter: 'blur(4px)' }}>
            {folder.e} {folder.n}
          </div>
        )}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: 6 }}>
          <div style={{ fontSize: 40, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,.15))' }}>{subject.e}</div>
        </div>
      </div>
      <div style={{ padding: '10px 12px 10px 14px' }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12, color: T.ink, lineHeight: 1.35, marginBottom: 6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{nb.title}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ padding: '2px 7px', borderRadius: 12, background: `${subject.c}20`, color: subject.c, fontSize: 9, fontWeight: 700 }}>{subject.l}</div>
            <div style={{ fontSize: 9, color: T.muted }}>{template?.i} {pages}p</div>
          </div>
          <NotebookActions T={T} onAssign={onAssign} onDelete={onDelete} />
        </div>
        <div style={{ fontSize: 8, color: T.muted, marginTop: 4 }}>{timeAgo(nb.updated_at)}</div>
      </div>
    </div>
  )
}
