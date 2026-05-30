import { useState } from 'react'
import type { FormaReviewComment, FormaReviewPin, FormaReviewSession } from '../../types'
import { buildCommentTree } from '../../lib/formareview/comments'
import { REVIEW_ROLES } from '../../lib/formareview/constants'
import { GlassButton } from '../ui/GlassButton'

interface ReviewThreadPanelProps {
  session: FormaReviewSession
  selectedPinId: string | null
  pins: FormaReviewPin[]
  onAddComment: (opts: { pinId?: string | null; pageId?: string | null; content: string; parentId?: string | null }) => void
  onReply: (parentId: string, content: string) => void
  onEdit: (commentId: string, content: string) => void
  onResolve: (commentId: string, resolved: boolean) => void
  onDelete: (commentId: string) => void
  onResolvePin: (pinId: string) => void
}

function formatDate(ts: number): string {
  if (!ts) return ''
  return new Date(ts).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function RoleBadge({ role }: { role: FormaReviewComment['role'] }) {
  const r = REVIEW_ROLES[role] || REVIEW_ROLES.prof
  return (
    <span
      className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
      style={{ background: `${r.color}33`, color: r.color }}
    >
      {r.label}
    </span>
  )
}

function CommentItem({
  comment,
  replies = [],
  onReply,
  onEdit,
  onResolve,
  onDelete,
}: {
  comment: FormaReviewComment & { replies?: FormaReviewComment[] }
  replies?: FormaReviewComment[]
  onReply: (parentId: string, content: string) => void
  onEdit: (commentId: string, content: string) => void
  onResolve: (commentId: string, resolved: boolean) => void
  onDelete: (commentId: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(comment.content)
  const [replyText, setReplyText] = useState('')
  const [showReply, setShowReply] = useState(false)
  const [showHist, setShowHist] = useState(false)

  return (
    <div
      className={`p-2.5 mb-2 rounded-lg border ${comment.resolved ? 'opacity-75 bg-forma-surface/50' : 'bg-forma-surface border-forma-accent/30'}`}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <strong className="text-sm">{comment.authorName}</strong>
        <RoleBadge role={comment.role} />
        <span className="text-[10px] text-forma-muted ml-auto">{formatDate(comment.createdAt)}</span>
      </div>

      {editing ? (
        <div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="w-full px-2 py-1.5 rounded border border-forma-border bg-forma-bg text-sm"
          />
          <div className="flex gap-1.5 mt-1.5">
            <GlassButton
              size="sm"
              onClick={() => {
                onEdit(comment.id, text)
                setEditing(false)
              }}
            >
              Enregistrer
            </GlassButton>
            <button
              type="button"
              className="text-xs text-forma-muted"
              onClick={() => {
                setText(comment.content)
                setEditing(false)
              }}
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm leading-relaxed whitespace-pre-wrap mb-2">{comment.content}</p>
      )}

      <div className="flex gap-2 flex-wrap text-[11px]">
        <button type="button" className="text-forma-accent" onClick={() => setShowReply((v) => !v)}>
          Répondre
        </button>
        <button type="button" className="text-forma-accent" onClick={() => setEditing(true)}>
          Modifier
        </button>
        <button
          type="button"
          className="text-forma-accent"
          onClick={() => onResolve(comment.id, !comment.resolved)}
        >
          {comment.resolved ? 'Rouvrir' : 'Résoudre'}
        </button>
        {comment.history.length > 0 && (
          <button type="button" className="text-forma-muted" onClick={() => setShowHist((v) => !v)}>
            Historique ({comment.history.length})
          </button>
        )}
        <button type="button" className="text-red-500" onClick={() => onDelete(comment.id)}>
          Supprimer
        </button>
      </div>

      {showHist && (
        <div className="mt-2 p-2 bg-forma-bg rounded-md">
          {comment.history.map((h, i) => (
            <div key={i} className="text-xs text-forma-muted mb-1">
              <span className="text-[10px]">{formatDate(h.editedAt)} — </span>
              {h.content}
            </div>
          ))}
        </div>
      )}

      {showReply && (
        <div className="mt-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Votre réponse…"
            rows={2}
            className="w-full px-2 py-1.5 rounded border border-forma-border bg-forma-bg text-sm"
          />
          <GlassButton
            size="sm"
            className="mt-1.5"
            onClick={() => {
              if (replyText.trim()) {
                onReply(comment.id, replyText)
                setReplyText('')
                setShowReply(false)
              }
            }}
          >
            Envoyer
          </GlassButton>
        </div>
      )}

      {replies.length > 0 && (
        <div className="mt-2.5 ml-3 border-l-2 border-forma-border pl-2.5">
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

export function ReviewThreadPanel({
  session,
  selectedPinId,
  pins,
  onAddComment,
  onReply,
  onEdit,
  onResolve,
  onDelete,
  onResolvePin,
}: ReviewThreadPanelProps) {
  const [newComment, setNewComment] = useState('')
  const selectedPin = pins.find((p) => p.id === selectedPinId)
  const pinComments = selectedPinId
    ? session.comments.filter((c) => c.pinId === selectedPinId)
    : []
  const tree = buildCommentTree(pinComments)
  const allTree = buildCommentTree(session.comments)
  const openPins = pins.filter((p) => p.status !== 'resolved').length

  const handleAdd = () => {
    if (!newComment.trim()) return
    onAddComment({
      pinId: selectedPinId,
      pageId: selectedPin?.pageId || session.pages[0]?.id || null,
      content: newComment,
    })
    setNewComment('')
  }

  return (
    <aside className="w-[300px] shrink-0 flex flex-col bg-forma-panel border-l border-forma-border/50 h-full">
      <div className="p-3 border-b border-forma-border/50">
        <h3 className="text-sm font-semibold m-0">Commentaires</h3>
        <div className="text-[11px] text-forma-muted mt-1">
          {openPins} pin(s) ouvert(s) · {allTree.filter((c) => !c.resolved).length} commentaire(s) actif(s)
        </div>
      </div>

      {selectedPin && (
        <div className="px-3 py-2 bg-forma-accent/15 border-b border-forma-border/50 text-xs flex items-center justify-between">
          <span>
            Pin #{pins.indexOf(selectedPin) + 1} —{' '}
            {selectedPin.status === 'resolved' ? '✓ Résolu' : 'Ouvert'}
          </span>
          {selectedPin.status !== 'resolved' && (
            <button type="button" className="text-forma-accent text-[11px]" onClick={() => onResolvePin(selectedPin.id)}>
              Marquer résolu
            </button>
          )}
        </div>
      )}

      <div className="flex-1 overflow-auto p-3">
        {(selectedPinId ? tree : allTree).length === 0 ? (
          <p className="text-forma-muted text-sm text-center mt-6">
            {selectedPinId
              ? 'Aucun commentaire sur ce pin.'
              : 'Placez un pin ou ajoutez un commentaire général.'}
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

      <div className="p-3 border-t border-forma-border/50">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={selectedPinId ? 'Commentaire sur ce pin…' : 'Commentaire général…'}
          rows={3}
          className="w-full px-2 py-1.5 rounded border border-forma-border bg-forma-bg text-sm resize-y"
        />
        <GlassButton accent className="w-full mt-2" onClick={handleAdd}>
          Ajouter
        </GlassButton>
      </div>
    </aside>
  )
}
