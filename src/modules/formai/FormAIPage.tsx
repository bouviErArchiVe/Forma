/**
 * FormAIPage — le cerveau IA de Forma.
 *
 * Assistant spécialisé architecture/construction : conversations persistantes
 * (Dexie), agents spécialisés, mémoire locale, archives, export/import JSON.
 * La logique IA vit dans src/services/ai/ ; cette page orchestre l'UI.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../../components/ui/Icon'
import { FORMAI_AGENTS, getAgent } from '../../services/ai/agents'
import { sendFormAIMessage } from '../../services/ai/chat'
import {
  archiveConversation,
  createConversation,
  deleteConversation,
  deleteMessage,
  getConversation,
  listConversations,
  renameConversation,
  toggleFavorite,
  unarchiveConversation,
} from '../../services/ai/conversations'
import { addMemory } from '../../services/ai/memory'
import { getProvider, resolveProviderSettings } from '../../services/ai/providers'
import { downloadFormAIExport, importFormAIData } from '../../services/ai/transfer'
import type { AIConversation } from '../../services/ai/types'
import { useFormAIStore } from '../../stores/formaiStore'
import { useToastStore } from '../../stores/toastStore'
import { ChatView } from './components/ChatView'
import { ConversationSidebar, type SidebarFilter } from './components/ConversationSidebar'
import { MemoryPanel } from './components/MemoryPanel'

export function FormAIPage() {
  const navigate = useNavigate()
  const { conversationId: routeConversationId } = useParams<{ conversationId: string }>()

  const activeConversationId = useFormAIStore((s) => s.activeConversationId)
  const setActiveConversationId = useFormAIStore((s) => s.setActiveConversationId)
  const activeAgentId = useFormAIStore((s) => s.activeAgentId)
  const setActiveAgentId = useFormAIStore((s) => s.setActiveAgentId)
  const sidebarOpen = useFormAIStore((s) => s.sidebarOpen)
  const setSidebarOpen = useFormAIStore((s) => s.setSidebarOpen)
  const memoryEnabled = useFormAIStore((s) => s.memoryEnabled)
  const setMemoryEnabled = useFormAIStore((s) => s.setMemoryEnabled)
  const ragEnabled = useFormAIStore((s) => s.ragEnabled)
  const setRagEnabled = useFormAIStore((s) => s.setRagEnabled)

  const [conversations, setConversations] = useState<AIConversation[]>([])
  const [conversation, setConversation] = useState<AIConversation | null>(null)
  const [filter, setFilter] = useState<SidebarFilter>('active')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [showMemory, setShowMemory] = useState(false)
  const importInputRef = useRef<HTMLInputElement>(null)

  const agent = getAgent(conversation?.agentId ?? activeAgentId)

  // Provider actif (affichage local/cloud)
  const settings = resolveProviderSettings()
  const provider = getProvider(settings.providerId)
  const fromCloud = settings.providerId !== 'local' && settings.providerId !== 'mock' && settings.providerId !== 'ollama' && settings.providerId !== 'localmodel'

  // ── Chargements ─────────────────────────────────────────────────────────────

  const reloadList = useCallback(async () => {
    const list = await listConversations({
      archived: filter === 'archived',
      favoritesOnly: filter === 'favorites',
      ...(query.trim() !== '' ? { query: query.trim() } : {}),
    })
    setConversations(list)
  }, [filter, query])

  useEffect(() => {
    // setState après await (jamais synchrone dans le corps de l'effet)
    void Promise.resolve().then(reloadList)
  }, [reloadList])

  // Conversation depuis l'URL (lien direct) puis store
  useEffect(() => {
    const id = routeConversationId ?? activeConversationId
    void Promise.resolve().then(async () => {
      if (!id) {
        setConversation(null)
        return
      }
      const c = await getConversation(id)
      setConversation(c ?? null)
      if (c && routeConversationId) setActiveConversationId(c.id)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeConversationId, activeConversationId])

  // ── Actions conversations ───────────────────────────────────────────────────

  const openConversation = (id: string) => {
    setActiveConversationId(id)
    navigate(`/formai/${id}`, { replace: true })
  }

  const handleNew = async () => {
    const c = await createConversation(activeAgentId)
    setConversation(c)
    openConversation(c.id)
    await reloadList()
  }

  const handleSend = async (text: string) => {
    setLoading(true)
    try {
      let id = conversation?.id
      if (!id) {
        const c = await createConversation(activeAgentId)
        id = c.id
        setConversation(c)
        openConversation(c.id)
      }
      // Affichage optimiste du message utilisateur
      setConversation((prev) =>
        prev
          ? {
              ...prev,
              messages: [
                ...prev.messages,
                { id: 'optimistic', role: 'user' as const, content: text, ts: Date.now() },
              ],
            }
          : prev,
      )
      const result = await sendFormAIMessage(id, text, { memoryEnabled, ragEnabled })
      if (result) setConversation(result.conversation)
      await reloadList()
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!conversation) return
    await deleteMessage(conversation.id, messageId)
    const fresh = await getConversation(conversation.id)
    setConversation(fresh ?? null)
  }

  const handleSaveToMemory = async (content: string) => {
    await addMemory(content, { source: 'message' })
    useToastStore.getState().show('Ajouté à la mémoire locale')
  }

  const handleImport = async (file: File) => {
    try {
      const json = await file.text()
      const res = await importFormAIData(json)
      useToastStore
        .getState()
        .show(`Import : ${res.conversations} conversation(s), ${res.memories} mémoire(s), ${res.documents} document(s)`)
      await reloadList()
    } catch {
      useToastStore.getState().show('Fichier d’import invalide')
    }
  }

  // ── Rendu ───────────────────────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col bg-forma-bg text-forma-text overflow-hidden">
      {/* Header */}
      <header className="shrink-0 z-20 bg-forma-surface border-b border-forma-border shadow-sm flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          onClick={() => navigate('/')}
          title="Retour à la bibliothèque"
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 text-forma-muted hover:text-forma-text transition-colors shrink-0"
        >
          <Icon name="chevron-left" className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          title={sidebarOpen ? 'Masquer les conversations' : 'Afficher les conversations'}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 text-forma-muted hover:text-forma-text transition-colors shrink-0"
        >
          <Icon name="layout" className="w-4 h-4" />
        </button>

        <h1 className="text-sm font-semibold inline-flex items-center gap-1.5 shrink-0">
          <Icon name="sparkles" className="w-4 h-4 text-forma-accent" />
          FormAI
        </h1>

        {/* Sélecteur d'agent */}
        <select
          value={conversation?.agentId ?? activeAgentId}
          onChange={(e) => {
            setActiveAgentId(e.target.value)
            // L'agent d'une conversation existante ne change pas : on démarre
            // une nouvelle conversation avec le nouvel agent.
            if (conversation) {
              setActiveConversationId(null)
              setConversation(null)
              navigate('/formai', { replace: true })
            }
          }}
          title="Agent spécialisé"
          className="text-xs border border-forma-border rounded-lg px-2 py-1.5 bg-forma-bg focus:outline-none focus:border-forma-accent max-w-44"
        >
          {FORMAI_AGENTS.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>

        <div className="flex-1" />

        {/* Options contexte */}
        <label className="text-[10px] text-forma-muted inline-flex items-center gap-1 cursor-pointer select-none shrink-0" title="Injecter la mémoire locale pertinente dans les réponses">
          <input
            type="checkbox"
            checked={memoryEnabled}
            onChange={(e) => setMemoryEnabled(e.target.checked)}
            className="w-3 h-3 accent-forma-accent"
          />
          Mémoire
        </label>
        <label className="text-[10px] text-forma-muted inline-flex items-center gap-1 cursor-pointer select-none shrink-0" title="Chercher dans la base documentaire et citer les sources">
          <input
            type="checkbox"
            checked={ragEnabled}
            onChange={(e) => setRagEnabled(e.target.checked)}
            className="w-3 h-3 accent-forma-accent"
          />
          Documents
        </label>

        <button
          type="button"
          onClick={() => setShowMemory((v) => !v)}
          title="Panneau mémoire"
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
            showMemory ? 'text-forma-accent bg-forma-accent/10' : 'text-forma-muted hover:text-forma-text hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          ⬡
        </button>
        <button
          type="button"
          onClick={() => void downloadFormAIExport()}
          title="Exporter les données FormAI (JSON)"
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 text-forma-muted hover:text-forma-text transition-colors shrink-0"
        >
          <Icon name="upload" className="w-4 h-4 rotate-180" />
        </button>
        <button
          type="button"
          onClick={() => importInputRef.current?.click()}
          title="Importer des données FormAI (JSON)"
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 text-forma-muted hover:text-forma-text transition-colors shrink-0"
        >
          <Icon name="upload" className="w-4 h-4" />
        </button>
        <input
          ref={importInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void handleImport(f)
            e.target.value = ''
          }}
        />
        <button
          type="button"
          onClick={() => navigate('/settings#ai')}
          title="Configurer le fournisseur IA"
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 text-forma-muted hover:text-forma-text transition-colors shrink-0"
        >
          <Icon name="settings" className="w-4 h-4" />
        </button>
      </header>

      {/* Corps */}
      <div className="flex-1 flex min-h-0">
        {sidebarOpen && (
          <ConversationSidebar
            conversations={conversations}
            activeId={conversation?.id ?? null}
            filter={filter}
            query={query}
            onFilterChange={setFilter}
            onQueryChange={setQuery}
            onSelect={openConversation}
            onNew={() => void handleNew()}
            onToggleFavorite={async (id) => {
              await toggleFavorite(id)
              await reloadList()
              if (conversation?.id === id) {
                const fresh = await getConversation(id)
                setConversation(fresh ?? null)
              }
            }}
            onRename={async (id, title) => {
              await renameConversation(id, title)
              await reloadList()
              if (conversation?.id === id) {
                const fresh = await getConversation(id)
                setConversation(fresh ?? null)
              }
            }}
            onArchive={async (id) => {
              await archiveConversation(id)
              if (conversation?.id === id) {
                setConversation(null)
                setActiveConversationId(null)
              }
              await reloadList()
            }}
            onUnarchive={async (id) => {
              await unarchiveConversation(id)
              await reloadList()
            }}
            onDelete={async (id) => {
              await deleteConversation(id)
              if (conversation?.id === id) {
                setConversation(null)
                setActiveConversationId(null)
                navigate('/formai', { replace: true })
              }
              await reloadList()
            }}
          />
        )}

        <ChatView
          messages={conversation?.messages ?? []}
          agent={agent}
          loading={loading}
          providerLabel={provider.label}
          fromCloud={fromCloud}
          onSend={(text) => void handleSend(text)}
          onDeleteMessage={(id) => void handleDeleteMessage(id)}
          onSaveToMemory={(content) => void handleSaveToMemory(content)}
        />

        {showMemory && <MemoryPanel onClose={() => setShowMemory(false)} />}
      </div>
    </div>
  )
}
