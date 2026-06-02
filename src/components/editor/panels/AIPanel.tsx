/**
 * AIPanel v2 — Panneau assistant IA.
 *
 * - Chat contextuel multi-tours
 * - Prompts prédéfinis (résumé, reformulation, CNB/CCQ/RMU…)
 * - Indicateur clair : local vs cloud
 * - Aucune donnée envoyée sans action explicite de l'utilisateur (bouton Send)
 * - Fallback local si pas de clé API ou erreur réseau
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToastStore } from '../../../stores/toastStore'
import { useAIStore } from '../../../stores/aiStore'
import { aiChat, PRESET_PROMPTS, SYSTEM_PROMPTS, type AIMessage, type AIMode } from '../../../lib/ai-service'
import { buildPageContext, buildSystemMessageWithContext, summarizeContext } from '../../../lib/ai-context'
import type { Page } from '../../../types'

// ─── Chat message ─────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  fromCloud: boolean
  error?: string
  ts: number
}

let msgSeq = 0
function mkId() { return `m${++msgSeq}` }

// ─── Component ────────────────────────────────────────────────────────────────

export function AIPanel({
  page,
  notebookName = 'Document',
  contextText,        // legacy prop still accepted (fallback if no page)
  onAddStudyPairs: _onAddStudyPairs,
}: {
  page?: Page
  notebookName?: string
  contextText?: string
  onAddStudyPairs?: (pairs: { front: string; back: string }[]) => void
}) {
  const navigate = useNavigate()
  const config = useAIStore()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeMode, setActiveMode] = useState<AIMode>('chat')
  const [activeSysKey, setActiveSysKey] = useState<string>('default')
  const bottomRef = useRef<HTMLDivElement>(null)

  // Build context from page or legacy contextText
  const pageCtx = page ? buildPageContext(page) : { text: contextText ?? '', sources: [], rawLength: (contextText ?? '').length }
  const contextSummary = summarizeContext(pageCtx)
  const isCloudReady = config.isCloudReady()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Send a message ──────────────────────────────────────────────────────────

  const send = useCallback(async (userText: string, mode: AIMode = activeMode, sysKey = activeSysKey) => {
    const trimmed = userText.trim()
    if (!trimmed || loading) return

    const userMsg: ChatMessage = {
      id: mkId(), role: 'user', content: trimmed, fromCloud: false, ts: Date.now(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    const systemPrompt = buildSystemMessageWithContext(
      SYSTEM_PROMPTS[sysKey] ?? SYSTEM_PROMPTS.default,
      pageCtx,
      notebookName,
    )

    const apiMessages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      // include recent conversation (last 6 turns)
      ...messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: trimmed },
    ]

    const result = await aiChat(apiMessages, config, mode, pageCtx.text)
    setLoading(false)

    const assistantMsg: ChatMessage = {
      id: mkId(),
      role: 'assistant',
      content: result.text,
      fromCloud: result.fromCloud,
      error: result.error,
      ts: Date.now(),
    }
    setMessages((prev) => [...prev, assistantMsg])
  }, [loading, activeMode, activeSysKey, messages, pageCtx, notebookName, config])

  // ── Preset prompt ───────────────────────────────────────────────────────────

  const runPreset = useCallback(async (presetId: string, extra?: string) => {
    const preset = PRESET_PROMPTS.find((p) => p.id === presetId)
    if (!preset) return
    setActiveMode(preset.mode)
    setActiveSysKey(preset.systemKey ?? 'default')
    const userPrompt = preset.buildUserPrompt(
      pageCtx.text || '(pas de contenu sur cette page)',
      extra,
    )
    await send(userPrompt, preset.mode, preset.systemKey ?? 'default')
  }, [pageCtx, send])

  // ── Clear ───────────────────────────────────────────────────────────────────

  const clear = () => setMessages([])

  // ─── UI ─────────────────────────────────────────────────────────────────────

  const cloudBadge = isCloudReady ? (
    <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-medium">
      ☁ {config.provider}
    </span>
  ) : (
    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
      💻 local
    </span>
  )

  return (
    <div className="flex flex-col h-full text-sm overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between mb-2">
        <h3 className="font-semibold text-forma-text">Forma IA</h3>
        <div className="flex items-center gap-1.5">
          {cloudBadge}
          <button
            type="button"
            onClick={() => navigate('/settings#ai')}
            className="text-xs text-forma-muted hover:text-forma-accent"
            title="Configurer l'IA"
          >
            ⚙
          </button>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={clear}
              className="text-xs text-forma-muted hover:text-red-500"
              title="Effacer la conversation"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Context indicator ───────────────────────────────────────────────── */}
      <div className="shrink-0 text-[10px] text-forma-muted mb-2 px-1">
        Contexte : {contextSummary}
      </div>

      {/* ── Cloud warning ───────────────────────────────────────────────────── */}
      {isCloudReady && (
        <div className="shrink-0 mb-2 px-2 py-1.5 rounded bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-[10px] text-blue-700 dark:text-blue-300">
          ☁ Les messages sont envoyés à {config.provider}. Ne partagez pas de données confidentielles.
        </div>
      )}

      {/* ── Preset prompt chips ─────────────────────────────────────────────── */}
      <div className="shrink-0 flex flex-wrap gap-1 mb-2">
        {PRESET_PROMPTS.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={loading}
            onClick={() => runPreset(p.id)}
            className="text-[11px] px-2 py-0.5 rounded-full border border-forma-border hover:border-forma-accent/50 hover:bg-forma-accent/5 text-forma-muted hover:text-forma-accent transition-colors disabled:opacity-40"
            title={p.label}
          >
            {p.icon} {p.label}
          </button>
        ))}
      </div>

      {/* ── Message list ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
        {messages.length === 0 && (
          <p className="text-xs text-forma-muted text-center py-6">
            Posez une question sur vos notes ou utilisez un raccourci ci-dessus.
          </p>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} msg={m} />
        ))}
        {loading && (
          <div className="flex gap-1 items-center text-xs text-forma-muted py-1">
            <span className="animate-pulse">●</span>
            <span className="animate-pulse" style={{ animationDelay: '200ms' }}>●</span>
            <span className="animate-pulse" style={{ animationDelay: '400ms' }}>●</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ───────────────────────────────────────────────────────────── */}
      <div className="shrink-0 mt-2 flex gap-1.5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(input) }
          }}
          placeholder="Question sur vos notes…"
          disabled={loading}
          className="flex-1 text-xs border border-forma-border rounded-lg px-2 py-1.5 bg-forma-bg focus:outline-none focus:border-forma-accent focus:ring-1 focus:ring-forma-accent/30 disabled:opacity-50"
        />
        <button
          type="button"
          disabled={loading || !input.trim()}
          onClick={() => send(input)}
          className="shrink-0 px-2.5 py-1.5 rounded-lg bg-forma-accent text-white text-xs font-medium hover:bg-forma-accent/90 disabled:opacity-40 transition-colors"
          title="Envoyer (Entrée)"
        >
          ↑
        </button>
      </div>
    </div>
  )
}

// ─── MessageBubble ────────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user'

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[90%] rounded-xl px-2.5 py-1.5 text-xs leading-relaxed whitespace-pre-wrap break-words ${
          isUser
            ? 'bg-forma-accent text-white'
            : 'bg-gray-100 dark:bg-gray-800 text-forma-text'
        }`}
      >
        {msg.content}
      </div>
      {/* Error / source indicator */}
      <div className="flex items-center gap-1.5 mt-0.5 px-1">
        {msg.error && (
          <span className="text-[10px] text-amber-500">⚠ {msg.error}</span>
        )}
        {!isUser && (
          <span className="text-[10px] text-forma-muted">
            {msg.fromCloud ? '☁' : '💻'}
            {/* Copy button */}
          </span>
        )}
        {!isUser && (
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(msg.content)
              useToastStore.getState().show('Copié')
            }}
            className="text-[10px] text-forma-muted hover:text-forma-accent"
            title="Copier"
          >
            ⎘
          </button>
        )}
      </div>
    </div>
  )
}
