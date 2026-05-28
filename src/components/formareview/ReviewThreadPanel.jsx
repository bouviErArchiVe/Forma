import { useState } from 'react'
import { buildCommentTree } from '@/lib/formareview/comments'
import { REVIEW_ROLES, FRV_DARK } from '@/lib/formareview/constants'

function formatDate(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function RoleBadge({ role }) {
  const r = REVIEW_ROLES[role] || REVIEW_ROLES.prof
  return (
    <span style={{
      fontSize: 10, padding: '1px 6px', borderRadius: 4,
      background: `${r.color}33`, color: r.color, fontWeight: 600,
    }}>
      {r.label}
    </span>
  )
}

function CommentItem({
  comment, replies = [], onReply, onEdit, onResolve, onDelete, onShowHistory,
}) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(comment.content)
  const [replyText, setReplyText] = useState('')
  const [showReply, setShowReply] = useState(false)
  const [showHist, setShowHist] = useState(false)

  return (
    <div style={{
      padding: 10, marginBottom: 8, borderRadius: 8,
      background: comment.resolved ? `${FRV_DARK.surface}88` : FRV_DARK.surface,
      border: `1px solid ${comment.resolved ? FRV_DARK.border : FRV_DARK.accent}44`,
      opacity: comment.resolved ? 0.75 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <strong style={{ fontSize: 13 }}>{comment.authorName}</strong>
        <RoleBadge role={comment.role} />
        <span style={{ fontSize: 10, color: FRV_DARK.muted, marginLeft: 'auto' }}>{formatDate(comment.createdAt)}</span>
      </div>

      {editing ? (
        <div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            style={inputStyle}
          />
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <SmallBtn onClick={() => { onEdit(comment.id, text); setEditing(false) }}>Enregistrer</SmallBtn>
            <SmallBtn muted onClick={() => { setText(comment.content); setEditing(false) }}>Annuler</SmallBtn>
          </div>
        </div>
      ) : (
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
          {comment.content}
        </p>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <SmallBtn onClick={() => setShowReply((v) => !v)}>Répondre</SmallBtn>
        <SmallBtn onClick={() => setEditing(true)}>Modifier</SmallBtn>
        <SmallBtn onClick={() => onResolve(comment.id, !comment.resolved)}>
          {comment.resolved ? 'Rouvrir' : 'Résoudre'}
        </SmallBtn>
        {(comment.history?.length > 0) && (
          <SmallBtn muted onClick={() => setShowHist((v) => !v)}>
            Historique ({comment.history.length})
          </SmallBtn>
        )}
        <SmallBtn muted onClick={() => onDelete(comment.id)}>Supprimer</SmallBtn>
      </div>

      {showHist && (
        <div style={{ marginTop: 8, padding: 8, background: FRV_DARK.bg, borderRadius: 6 }}>
          <div style={{ fontSize: 11, color: FRV_DARK.muted, marginBottom: 4 }}>Historique des modifications</div>
          {(comment.history || []).map((h, i) => (
            <div key={i} style={{ fontSize: 12, marginBottom: 4, color: FRV_DARK.muted }}>
              <span style={{ fontSize: 10 }}>{formatDate(h.editedAt)} — </span>
              {h.content}
            </div>
          ))}
        </div>
      )}

      {showReply && (
        <div style={{ marginTop: 8 }}>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Votre réponse…"
            rows={2}
            style={inputStyle}
          />
          <SmallBtn onClick={() => {
            if (replyText.trim()) {
              onReply(comment.id, replyText)
              setReplyText('')
              setShowReply(false)
            }
          }}>
            Envoyer
          </SmallBtn>
        </div>
      )}

      {replies.length > 0 && (
        <div style={{ marginTop: 10, marginLeft: 12, borderLeft: `2px solid ${FRV_DARK.border}`, paddingLeft: 10 }}>
          {replies.map((r) => (
            <CommentItem
              key={r.id}
              comment={r}
              onReply={onReply}
              onEdit={onEdit}
              onResolve={onResolve}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ReviewThreadPanel({
  session, selectedPinId, pins = [], onAddComment, onReply, onEdit, onResolve, onDelete,   onResolvePin,
  embedded = false,
}) {
  const [newComment, setNewComment] = useState('')
  const selectedPin = pins.find((p) => p.id === selectedPinId)
  const pinComments = selectedPinId
    ? (session.comments || []).filter((c) => c.pinId === selectedPinId)
    : []
  const tree = buildCommentTree(pinComments)
  const allTree = buildCommentTree(session.comments || [])
  const openPins = pins.filter((p) => p.status !== 'resolved').length

  const handleAdd = () => {
    if (!newComment.trim()) return
    onAddComment({
      pinId: selectedPinId || null,
      pageId: selectedPin?.pageId || session.pages?.[0]?.id || null,
      content: newComment,
    })
    setNewComment('')
  }

  return (
    <div style={{
      width: embedded ? '100%' : 300,
      minWidth: embedded ? undefined : 260,
      display: 'flex',
      flexDirection: 'column',
      background: FRV_DARK.panel,
      borderLeft: embedded ? 'none' : `1px solid ${FRV_DARK.border}`,
      height: embedded ? 'auto' : '100%',
      maxHeight: embedded ? 'min(70vh, 520px)' : undefined,
    }}>
      <div style={{ padding: '12px 14px', borderBottom: `1px solid ${FRV_DARK.border}` }}>
        <h3 style={{ margin: 0, fontSize: 14 }}>Commentaires</h3>
        <div style={{ fontSize: 11, color: FRV_DARK.muted, marginTop: 4 }}>
          {openPins} pin(s) ouvert(s) · {allTree.filter((c) => !c.resolved).length} commentaire(s) actif(s)
        </div>
      </div>

      {selectedPin && (
        <div style={{
          padding: '8px 14px', background: `${FRV_DARK.accent}22`,
          borderBottom: `1px solid ${FRV_DARK.border}`, fontSize: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span>Pin #{pins.indexOf(selectedPin) + 1} — {selectedPin.status === 'resolved' ? '✓ Résolu' : 'Ouvert'}</span>
          {selectedPin.status !== 'resolved' && (
            <SmallBtn onClick={() => onResolvePin(selectedPin.id)}>Marquer résolu</SmallBtn>
          )}
        </div>
      )}

      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        {(selectedPinId ? tree : allTree).length === 0 ? (
          <p style={{ color: FRV_DARK.muted, fontSize: 13, textAlign: 'center', marginTop: 24 }}>
            {selectedPinId ? 'Aucun commentaire sur ce pin.' : 'Placez un pin ou ajoutez un commentaire général.'}
          </p>
        ) : (
          (selectedPinId ? tree : allTree).map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              replies={c.replies}
              onReply={onReply}
              onEdit={onEdit}
              onResolve={onResolve}
              onDelete={onDelete}
            />
          ))
        )}
      </div>

      <div style={{ padding: 12, borderTop: `1px solid ${FRV_DARK.border}` }}>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={selectedPinId ? 'Commentaire sur ce pin…' : 'Commentaire général…'}
          rows={3}
          style={inputStyle}
        />
        <button type="button" onClick={handleAdd} style={{
          marginTop: 8, width: '100%', padding: '8px 12px', borderRadius: 8,
          background: FRV_DARK.accent, color: '#1a1e28', border: 'none',
          cursor: 'pointer', fontWeight: 600, fontSize: 13,
        }}>
          Ajouter
        </button>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box', background: FRV_DARK.bg,
  color: FRV_DARK.ink, border: `1px solid ${FRV_DARK.border}`,
  borderRadius: 6, padding: 8, fontSize: 13, resize: 'vertical', fontFamily: 'inherit',
}

function SmallBtn({ children, onClick, muted }) {
  return (
    <button type="button" onClick={onClick} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      color: muted ? FRV_DARK.muted : FRV_DARK.accent2,
      fontSize: 11, padding: 0,
    }}>
      {children}
    </button>
  )
}
