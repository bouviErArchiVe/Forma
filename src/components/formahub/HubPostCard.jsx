import { FH_TRADES } from '@/lib/formahub/constants'
import { isLiked, isSaved } from '@/lib/formahub/localStore'

export default function HubPostCard({ post, T, onOpen, onLike, onSave, onShare, onFollowAuthor, followingAuthor }) {
  const trade = FH_TRADES.find((t) => t.id === post.tradeId)
  const liked = isLiked(post.id)
  const saved = isSaved(post.id)

  return (
    <article
      onClick={() => onOpen(post)}
      style={{
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14,
        overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column',
      }}
    >
      {post.imageUrl && (
        <div style={{ height: 180, background: '#111', overflow: 'hidden' }}>
          <img src={post.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
          {trade && <span style={tag(T)}>{trade.icon} {trade.label}</span>}
          <span style={{ fontSize: 10, color: T.muted }}>{post.author} · {timeAgo(post.createdAt)}</span>
        </div>
        <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 800, color: T.ink, lineHeight: 1.3 }}>{post.title}</h3>
        <p style={{ margin: 0, fontSize: 12, color: T.muted, lineHeight: 1.5, flex: 1 }}>{(post.body || '').slice(0, 140)}{(post.body?.length > 140 ? '…' : '')}</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
          <ActionBtn active={liked} onClick={() => onLike(post.id)} T={T}>♥ {post.likes || 0}</ActionBtn>
          <ActionBtn active={saved} onClick={() => onSave(post.id)} T={T}>★ {post.saves || 0}</ActionBtn>
          <ActionBtn onClick={() => onShare?.(post)} T={T} title="Partager">↗</ActionBtn>
          {onFollowAuthor && post.authorId !== 'local' && (
            <ActionBtn active={followingAuthor} onClick={() => onFollowAuthor(post)} T={T} title="Suivre auteur">
              {followingAuthor ? '✓' : '+'}
            </ActionBtn>
          )}
        </div>
      </div>
    </article>
  )
}

function ActionBtn({ children, onClick, T, active }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: 'pointer',
      border: `1px solid ${active ? T.accent : T.border}`,
      background: active ? `${T.accent}18` : T.bg, color: active ? T.accent : T.muted,
    }}>
      {children}
    </button>
  )
}

const tag = (T) => ({
  fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
  background: `${T.accent}15`, color: T.accent,
})

function timeAgo(ts) {
  if (!ts) return ''
  const d = Math.max(1, Math.round((Date.now() - ts) / 60000))
  if (d < 60) return `${d} min`
  if (d < 1440) return `${Math.round(d / 60)} h`
  return `${Math.round(d / 1440)} j`
}
