import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BrandLogo } from '../components/BrandLogo'
import { GlassButton } from '../components/ui/GlassButton'
import { HighlightText } from '../components/formaai/HighlightText'
import { searchAll, type SearchResult } from '../lib/formaai/search'
import { invalidateSearchIndex } from '../lib/formaai/indexer'
import { prepareFormulaNavigationFromSearch } from '../lib/formulas/nav'
import {
  getAIProviderLabel,
  isAIChatConfigured,
  isNoApiError,
  runAIAction,
  runAIChat,
  testAIConnection,
  type ChatMessage,
} from '../lib/formaai/provider'
import { AI_ACTIONS, SEARCH_DEBOUNCE_MS, SEARCH_SOURCES, type AiActionId } from '../lib/formaai/constants'

type Tab = 'search' | 'assistant'

const SOURCE_EMOJI: Record<string, string> = {
  notebook: '📓',
  doc: '📄',
  sheet: '📊',
  present: '▶',
  event: '📅',
  review: '💬',
  combine: '📎',
  moodboard: '🖼',
  folder: '📁',
  formula: '📐',
  'formula-history': '🧮',
}

interface ChatEntry extends ChatMessage {
  id: number
}

const HISTORY_KEY = 'forma-ai-chat'

function loadHistory(): ChatEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    const data = raw ? (JSON.parse(raw) as ChatEntry[]) : []
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export function FormaAIPage() {
  const [tab, setTab] = useState<Tab>('search')
  return (
    <div className="min-h-full flex flex-col max-w-5xl mx-auto w-full p-4">
      <header className="forma-glass-header rounded-xl px-4 py-3 mb-4 flex flex-wrap items-center gap-3 border border-forma-border/50">
        <BrandLogo size="sm" subtitle="FormaAI" />
        <div className="flex-1" />
        <Link to="/" className="text-sm text-forma-accent hover:underline">
          ← Bibliothèque
        </Link>
      </header>

      <div className="flex gap-2 mb-4">
        <GlassButton active={tab === 'search'} onClick={() => setTab('search')}>
          🔍 Recherche
        </GlassButton>
        <GlassButton active={tab === 'assistant'} onClick={() => setTab('assistant')}>
          ✦ Assistant
        </GlassButton>
      </div>

      {tab === 'search' ? <SearchPanel /> : <AssistantPanel />}
    </div>
  )
}

function SearchPanel() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [results, setResults] = useState<SearchResult[]>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [searching, setSearching] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reqId = useRef(0)

  useEffect(() => {
    invalidateSearchIndex()
  }, [])

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    const q = query.trim()
    if (!q) {
      setResults([])
      setActiveIdx(0)
      return
    }
    setSearching(true)
    timer.current = setTimeout(() => {
      const id = ++reqId.current
      void searchAll(query, { sourceFilter, limit: 40 }).then((res) => {
        if (id !== reqId.current) return
        setResults(res)
        setActiveIdx(0)
        setSearching(false)
      })
    }, SEARCH_DEBOUNCE_MS)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [query, sourceFilter])

  const goTo = useCallback(
    (item: SearchResult) => {
      prepareFormulaNavigationFromSearch(item)
      if (item.route) navigate(item.route)
    },
    [navigate],
  )

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(results.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter' && results[activeIdx]) {
      e.preventDefault()
      goTo(results[activeIdx])
    }
  }

  return (
    <div className="flex flex-col min-h-0">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKey}
        autoFocus
        placeholder='Rechercher dans tous les modules : "mur coupe-feu", "blondel", "rendu jury"…'
        className="w-full border rounded-lg px-3 py-2.5 text-sm mb-3"
      />

      <div className="flex flex-wrap gap-1.5 mb-4">
        {Object.values(SEARCH_SOURCES).map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSourceFilter(s.id)}
            className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
              sourceFilter === s.id
                ? 'bg-forma-accent/15 text-forma-accent ring-1 ring-forma-accent/30 font-medium'
                : 'text-forma-muted hover:bg-white/40 dark:hover:bg-white/5'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {!query.trim() && (
        <p className="text-sm text-forma-muted text-center py-10 px-4">
          Recherche unifiée locale dans vos carnets, FormaDoc, FormaTab, FormaPresent, FormatCal,
          FormaReview, FormaCombine, moodboards, dossiers et formules.
          <br />
          <span className="text-xs">↑↓ naviguer · Entrée ouvrir · aucune donnée n'est envoyée en ligne</span>
        </p>
      )}

      {query.trim() && !searching && results.length === 0 && (
        <p className="text-sm text-forma-muted text-center py-10">Aucun résultat pour « {query} »</p>
      )}

      <div className="flex flex-col gap-1.5">
        {results.map((item, idx) => (
          <button
            key={item.id}
            type="button"
            onClick={() => goTo(item)}
            onMouseEnter={() => setActiveIdx(idx)}
            className={`text-left p-3 rounded-xl border transition-all ${
              idx === activeIdx
                ? 'border-forma-accent bg-forma-accent/10'
                : 'border-forma-border/40 hover:bg-white/40 dark:hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span>{SOURCE_EMOJI[item.type] ?? '📄'}</span>
              <strong className="text-sm flex-1 min-w-0 truncate">
                <HighlightText text={item.title} query={query} />
              </strong>
              <span className="text-[10px] text-forma-muted shrink-0">
                {SEARCH_SOURCES[item.source]?.label ?? item.type}
              </span>
            </div>
            {item.snippet && (
              <div className="text-xs text-forma-muted leading-relaxed line-clamp-2">
                <HighlightText text={item.snippet} query={query} />
              </div>
            )}
          </button>
        ))}
      </div>

      {results.length > 0 && (
        <div className="text-xs text-forma-muted mt-3 px-1">
          {results.length} résultat(s) · {activeIdx + 1}/{results.length}
        </div>
      )}
    </div>
  )
}

function AssistantPanel() {
  const apiReady = isAIChatConfigured()
  const [messages, setMessages] = useState<ChatEntry[]>(() => loadHistory())
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [action, setAction] = useState<AiActionId>('chat')
  const [error, setError] = useState('')
  const [testBusy, setTestBusy] = useState(false)
  const [testResult, setTestResult] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-80)))
    } catch {
      /* quota */
    }
  }, [messages])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  const runConnectionTest = useCallback(async () => {
    setTestResult('')
    setError('')
    setTestBusy(true)
    try {
      const res = await testAIConnection()
      setTestResult(`Connexion OK (${res.provider}) — ${res.preview}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test de connexion échoué')
    } finally {
      setTestBusy(false)
    }
  }, [])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || busy) return
    setError('')
    setBusy(true)
    const userMsg: ChatEntry = { id: Date.now(), role: 'user', text }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    try {
      const reply = action === 'chat' ? await runAIChat(next) : await runAIAction(action, text)
      setMessages((m) => [...m, { id: Date.now() + 1, role: 'assistant', text: reply }])
    } catch (err) {
      setError(isNoApiError(err) ? 'Connecte une clé API pour activer le chat IA.' : err instanceof Error ? err.message : 'Erreur IA')
    } finally {
      setBusy(false)
    }
  }, [input, busy, action, messages])

  return (
    <div className="flex flex-col min-h-0">
      <div
        className={`rounded-xl p-3 mb-3 text-xs leading-relaxed border ${
          apiReady
            ? 'bg-forma-accent/10 border-forma-accent/30'
            : 'bg-amber-500/10 border-amber-500/30'
        }`}
      >
        <strong className="block mb-1">Configuration API IA (optionnelle)</strong>
        Ajoutez <code>VITE_AI_API_KEY</code>, <code>VITE_AI_PROVIDER</code> et{' '}
        <code>VITE_AI_MODEL</code> dans <code>.env.local</code> pour activer le chat {getAIProviderLabel()}.
        {!apiReady && (
          <p className="mt-1 text-amber-700 dark:text-amber-400">
            Aucune clé détectée — les actions (résumer, corriger…) fonctionnent en mode local, le chat
            libre nécessite une clé.
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <GlassButton size="sm" disabled={testBusy || !apiReady} onClick={() => void runConnectionTest()}>
            {testBusy ? 'Test…' : 'Tester la connexion'}
          </GlassButton>
          {testResult && <span className="text-emerald-600 dark:text-emerald-400">{testResult}</span>}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        <button
          type="button"
          onClick={() => setAction('chat')}
          className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
            action === 'chat'
              ? 'bg-forma-accent/15 text-forma-accent ring-1 ring-forma-accent/30 font-medium'
              : 'text-forma-muted hover:bg-white/40 dark:hover:bg-white/5'
          }`}
        >
          💬 Discussion
        </button>
        {Object.values(AI_ACTIONS).map((a) => (
          <button
            key={a.id}
            type="button"
            title={a.hint}
            onClick={() => setAction(a.id as AiActionId)}
            className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
              action === a.id
                ? 'bg-forma-accent/15 text-forma-accent ring-1 ring-forma-accent/30 font-medium'
                : 'text-forma-muted hover:bg-white/40 dark:hover:bg-white/5'
            }`}
          >
            {a.icon} {a.label}
          </button>
        ))}
      </div>

      <div className="forma-glass-panel rounded-xl border border-forma-border/40 p-3 min-h-[16rem] max-h-[50vh] overflow-auto mb-3">
        {messages.length === 0 && (
          <p className="text-sm text-forma-muted">
            {action === 'chat'
              ? 'Posez une question libre sur vos cours, projets, normes ou outils Forma.'
              : 'Mode outil : collez un texte puis envoyez pour le résumer, corriger, reformuler, etc.'}
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`mb-2 p-2.5 rounded-lg text-sm leading-relaxed whitespace-pre-wrap border border-forma-border/40 ${
              m.role === 'user' ? 'bg-forma-accent/10' : 'bg-white/40 dark:bg-white/5'
            }`}
          >
            <div className="text-[10px] text-forma-muted mb-1">{m.role === 'user' ? 'Vous' : 'FormaAI'}</div>
            {m.text}
          </div>
        ))}
        {busy && <div className="text-xs text-forma-accent">Réflexion…</div>}
        {error && <div className="text-xs text-red-600 dark:text-red-400">{error}</div>}
        <div ref={endRef} />
      </div>

      <div className="flex gap-2 items-end">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void send()
            }
          }}
          rows={2}
          placeholder="Votre message… (Entrée pour envoyer, Maj+Entrée pour un saut de ligne)"
          className="flex-1 border rounded-lg px-3 py-2 text-sm resize-y min-h-[3rem]"
        />
        <GlassButton accent disabled={busy || !input.trim()} onClick={() => void send()}>
          Envoyer
        </GlassButton>
      </div>
    </div>
  )
}
