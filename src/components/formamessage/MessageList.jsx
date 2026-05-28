import { MSG_TYPES, MSG_STATUS } from '@/lib/formamessage/constants'

export default function MessageList({
  T, messages, userId, onReply, onEdit, onDelete, onReact, onAttachmentAction,
}) {
  if (!messages.length) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.muted, fontSize: 13, padding: 24 }}>
        Aucun message — commencez la conversation
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {messages.map((m) => {
        const mine = m.senderId === userId || m.senderId === 'local'
        return (
          <div key={m.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: 'min(85%, 420px)' }}>
            <div style={{
              padding: '10px 12px', borderRadius: mine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
              background: mine ? `${T.accent}28` : T.surface,
              border: `1px solid ${mine ? `${T.accent}44` : T.border}`,
            }}>
              {!mine && <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, marginBottom: 4 }}>{m.senderName}</div>}
              {renderBody(m, T, onAttachmentAction)}
              {m.editedAt && <div style={{ fontSize: 9, color: T.muted, marginTop: 4 }}>modifié</div>}
              <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <StatusBadge status={m.status} T={T} />
                {['👍', '❤️', '😂'].map((e) => (
                  <button key={e} type="button" onClick={() => onReact(m.id, e)} style={reactBtn(T)}>
                    {e}{(m.reactions?.[e]?.length) ? ` ${m.reactions[e].length}` : ''}
                  </button>
                ))}
                <button type="button" onClick={() => onReply(m)} style={reactBtn(T)} title="Répondre">↩</button>
                {mine && m.type === MSG_TYPES.text && (
                  <button type="button" onClick={() => onEdit(m)} style={reactBtn(T)} title="Modifier">✎</button>
                )}
                {mine && <button type="button" onClick={() => onDelete(m.id)} style={reactBtn(T)} title="Supprimer">🗑</button>}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function renderBody(m, T, onAttachmentAction) {
  if (m.type === MSG_TYPES.sticker) return <div style={{ fontSize: 36, lineHeight: 1 }}>{m.body}</div>
  if (m.type === MSG_TYPES.image && m.attachment?.dataUrl) {
    return (
      <div>
        <img src={m.attachment.dataUrl} alt="" style={{ maxWidth: '100%', borderRadius: 8, maxHeight: 220, cursor: 'pointer' }} onClick={() => onAttachmentAction?.('preview', m)} />
        <AttachmentActions m={m} T={T} onAction={onAttachmentAction} />
      </div>
    )
  }
  if (m.type === MSG_TYPES.voice && m.attachment?.dataUrl) {
    return (
      <div>
        <audio controls src={m.attachment.dataUrl} style={{ maxWidth: '100%' }} />
        <div style={{ fontSize: 10, color: T.muted, marginTop: 4 }}>🎤 {m.attachment.durationSec || '?'} s</div>
      </div>
    )
  }
  if ((m.type === MSG_TYPES.file || m.type === MSG_TYPES.share) && m.attachment) {
    return (
      <div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>📎 {m.attachment.name || m.attachment.label || 'Fichier'}</div>
        {m.body && <div style={{ fontSize: 12, marginTop: 4 }}>{m.body}</div>}
        <AttachmentActions m={m} T={T} onAction={onAttachmentAction} />
      </div>
    )
  }
  return <div style={{ fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{m.body}</div>
}

function AttachmentActions({ m, T, onAction }) {
  const actions = m.type === MSG_TYPES.share
    ? [['open', '↗ Ouvrir'], ['library', '📚 Library'], ['notebook', '📓 Carnet']]
    : [['library', '📚 Library'], ['notebook', '📓 Carnet'], ['moodboard', '🎭 Moodboard'], ['review', '💬 Review'], ['combine', '📎 Combine'], ['download', '⬇']]
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
      {actions.map(([id, label]) => (
        <button key={id} type="button" onClick={() => onAction?.(id, m)} style={reactBtn(T)}>{label}</button>
      ))}
    </div>
  )
}

function StatusBadge({ status, T }) {
  const label = { [MSG_STATUS.sent]: '✓', [MSG_STATUS.delivered]: '✓✓', [MSG_STATUS.read]: '✓✓ lu' }[status] || '•'
  return <span style={{ fontSize: 9, color: T.muted }}>{label}</span>
}

const reactBtn = (T) => ({
  background: 'none', border: `1px solid ${T.border}`, borderRadius: 6,
  padding: '2px 6px', fontSize: 10, cursor: 'pointer', color: T.muted,
})
