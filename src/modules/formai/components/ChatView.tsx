/**
 * ChatView — zone de conversation FormAI.
 *
 * Messages utilisateur/assistant, citations documentaires, indicateur de
 * frappe, état vide avec suggestions de l'agent actif, zone de saisie.
 */
import { useEffect, useRef, useState } from 'react'
import { Icon, type IconName } from '../../../components/ui/Icon'
import { useToastStore } from '../../../stores/toastStore'
import type { AgentDefinition, StoredChatMessage } from '../../../services/ai/types'

// ─── État vide ────────────────────────────────────────────────────────────────

function EmptyState({
  agent,
  onPrompt,
}: {
  agent: AgentDefinition
  onPrompt: (text: string) => void
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center">
      <div className="w-12 h-12 rounded-2xl bg-forma-accent/10 text-forma-accent flex items-center justify-center mb-3">
        <Icon name={agent.icon as IconName} className="w-6 h-6" />
      </div>
      <h2 className="text-base font-semibold text-forma-text mb-1">{agent.name}</h2>
      <p className="text-xs text-forma-muted max-w-md mb-6">{agent.description}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
        {agent.suggestedPrompts.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPrompt(p)}
            className="text-left text-xs px-3 py-2.5 rounded-xl border border-forma-border hover:border-forma-accent/60 hover:bg-forma-accent/5 text-forma-text transition-colors"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Message ──────────────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  agentName,
  onDelete,
  onSaveToMemory,
}: {
  msg: StoredChatMessage
  agentName: string
  onDelete: (id: string) => void
  onSaveToMemory: (content: string) => void
}) {
  const isUser = msg.role === 'user'

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      <div className="text-[10px] text-forma-muted px-1 mb-0.5">
        {isUser ? 'Vous' : agentName}
        {' · '}
        {new Date(msg.ts).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
        {!isUser && msg.memoryUsed && msg.memoryUsed.length > 0 && (
          <span className="ml-1 text-forma-accent" title={msg.memoryUsed.join('\n')}>
            ⬡ mém. ×{msg.memoryUsed.length}
          </span>
        )}
      </div>
      <div
        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isUser
            ? 'bg-forma-accent text-white rounded-br-md'
            : 'bg-forma-surface border border-forma-border text-forma-text rounded-bl-md'
        }`}
      >
        {msg.content}
      </div>

      {/* Citations documentaires */}
      {!isUser && msg.citations && msg.citations.length > 0 && (
        <div className="max-w-[85%] mt-1 space-y-0.5">
          {msg.citations.map((c) => (
            <div
              key={c.chunkId ?? c.docId}
              className="text-[10px] text-forma-muted border-l-2 border-forma-accent/40 pl-2"
              title={c.snippet}
            >
              <span className="font-medium text-forma-accent">{c.docTitle}</span>
              {' — '}
              {c.snippet.slice(0, 90)}
              {c.snippet.length > 90 ? '…' : ''}
            </div>
          ))}
        </div>
      )}

      {/* Erreur non bloquante */}
      {msg.error && (
        <p className="text-[10px] text-amber-500 px-1 mt-0.5 inline-flex items-center gap-1">
          <Icon name="alert" className="w-3 h-3" />
          {msg.error}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1.5 px-1 mt-0.5">
        <button
          type="button"
          title="Copier"
          onClick={async () => {
            await navigator.clipboard.writeText(msg.content)
            useToastStore.getState().show('Message copié')
          }}
          className="text-forma-muted hover:text-forma-accent"
        >
          <Icon name="copy" className="w-3 h-3" />
        </button>
        {!isUser && (
          <button
            type="button"
            title="Enregistrer dans la mémoire"
            onClick={() => onSaveToMemory(msg.content)}
            className="text-forma-muted hover:text-forma-accent text-[10px]"
          >
            ⬡
          </button>
        )}
        <button
          type="button"
          title="Supprimer le message"
          onClick={() => onDelete(msg.id)}
          className="text-forma-muted hover:text-red-500"
        >
          <Icon name="trash" className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

// ─── ChatView ─────────────────────────────────────────────────────────────────

export function ChatView({
  messages,
  agent,
  loading,
  providerLabel,
  fromCloud,
  onSend,
  onDeleteMessage,
  onSaveToMemory,
}: {
  messages: StoredChatMessage[]
  agent: AgentDefinition
  loading: boolean
  providerLabel: string
  fromCloud: boolean
  onSend: (text: string) => void
  onDeleteMessage: (id: string) => void
  onSaveToMemory: (content: string) => void
}) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = () => {
    const text = input.trim()
    if (text === '' || loading) return
    setInput('')
    onSend(text)
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0">
      {/* Messages */}
      {messages.length === 0 && !loading ? (
        <EmptyState agent={agent} onPrompt={onSend} />
      ) : (
        <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-3">
          {messages.map((m) => (
            <MessageBubble
              key={m.id}
              msg={m}
              agentName={agent.name}
              onDelete={onDeleteMessage}
              onSaveToMemory={onSaveToMemory}
            />
          ))}
          {loading && (
            <div className="flex items-center gap-1 text-forma-muted text-xs px-1 py-2">
              <span className="animate-pulse">●</span>
              <span className="animate-pulse" style={{ animationDelay: '200ms' }}>●</span>
              <span className="animate-pulse" style={{ animationDelay: '400ms' }}>●</span>
              <span className="ml-1">{agent.name} réfléchit…</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Saisie */}
      <div className="shrink-0 border-t border-forma-border bg-forma-surface p-3">
        <div className="flex gap-2 items-end max-w-3xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            placeholder={`Question pour ${agent.name}… (Entrée pour envoyer)`}
            rows={Math.min(4, Math.max(1, input.split('\n').length))}
            disabled={loading}
            className="flex-1 text-sm border border-forma-border rounded-xl px-3 py-2 bg-forma-bg resize-none focus:outline-none focus:border-forma-accent focus:ring-1 focus:ring-forma-accent/30 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={send}
            disabled={loading || input.trim() === ''}
            title="Envoyer (Entrée)"
            className="shrink-0 w-9 h-9 rounded-xl bg-forma-accent text-white hover:bg-forma-accent-hover disabled:opacity-40 transition-colors flex items-center justify-center"
          >
            <Icon name="chevron-up" className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-forma-muted text-center mt-1.5 inline-flex items-center gap-1 w-full justify-center">
          <Icon name={fromCloud ? 'cloud' : 'monitor'} className="w-3 h-3" />
          {providerLabel}
          {fromCloud && ' — vos messages sont envoyés à ce fournisseur'}
        </p>
      </div>
    </div>
  )
}
