/**
 * FormAI — contrats partagés (types).
 *
 * Ce fichier est la source de vérité des interfaces FormAI :
 * conversations, messages, mémoire, agents spécialisés, providers.
 * Les implémentations vivent dans :
 *   - src/services/ai/providers/  (couche providers)
 *   - src/services/ai/agents.ts   (agents spécialisés)
 *   - src/services/ai/conversations.ts / memory.ts (persistance Dexie)
 *   - src/lib/rag/                (RAG / base documentaire)
 */

// ─── Messages ────────────────────────────────────────────────────────────────

export type AIRole = 'system' | 'user' | 'assistant'

/** Message en cours d'échange avec un provider (format API). */
export interface AIChatMessage {
  role: AIRole
  content: string
}

/** Citation d'une source documentaire dans une réponse IA. */
export interface AICitation {
  docId: string
  docTitle: string
  chunkId?: string
  snippet: string
  score?: number
}

/**
 * Source STRUCTURÉE d'une réponse assistant (Sprint #19), issue UNIQUEMENT des
 * données de grounding/retrieval connues (fiche seeds, chunk pack), JAMAIS d'un
 * parsing du texte généré. Sert à afficher des chips de provenance.
 */
export interface AssistantSource {
  /** Origine : fiche Knowledge seeds ou extrait du pack documentaire PDF. */
  kind: 'seed' | 'pack'
  /** Libellé court (terme de la fiche, ou nom du document). */
  label: string
  /** Document PDF (sources pack). */
  document?: string
  /** Page (sources pack). */
  page?: number
  /** Gate de la source — jamais 'quarantine' (exclue en amont). */
  gate?: 'clean' | 'review'
  /** true si à vérifier (review / confidence à-vérifier / normatif). */
  toVerify?: boolean
  /** Slug de fiche seeds → lien /dictionary?slug=… (sources seed). */
  slug?: string
}

/** Message persisté dans une conversation FormAI. */
export interface StoredChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  ts: number
  /** Agent actif au moment du message (réponses assistant). */
  agentId?: string
  /** Provider ayant produit la réponse ('mock', 'local', 'openai'…). */
  providerId?: string
  /** Citations documentaires utilisées pour produire la réponse. */
  citations?: AICitation[]
  /** Sources structurées (seeds/pack) pour l'affichage en chips (#19). */
  sources?: AssistantSource[]
  /** Extraits de mémoire injectés dans le contexte de cette réponse. */
  memoryUsed?: string[]
  /** Erreur non bloquante associée (ex. fallback local après échec cloud). */
  error?: string
}

// ─── Conversations ───────────────────────────────────────────────────────────

export interface AIConversation {
  id: string
  title: string
  /** Agent spécialisé actif ('general' par défaut). */
  agentId: string
  /** Messages de la conversation (le prompt système n'est jamais persisté). */
  messages: StoredChatMessage[]
  createdAt: number
  updatedAt: number
  favorite: boolean
  archived: boolean
}

// ─── Mémoire locale ──────────────────────────────────────────────────────────

export type AIMemorySource = 'manual' | 'message' | 'auto'

export interface AIMemoryEntry {
  id: string
  content: string
  tags: string[]
  createdAt: number
  /** Poids de pertinence (1 = normal). */
  importance: number
  source: AIMemorySource
}

// ─── Agents spécialisés ──────────────────────────────────────────────────────

export interface AgentDefinition {
  id: string
  name: string
  /** Nom d'icône du composant ui/Icon. */
  icon: string
  description: string
  /** Rôle en une phrase (affiché dans l'UI). */
  role: string
  systemPrompt: string
  capabilities: string[]
  limits: string[]
  /** Indication de format de sortie attendu (markdown, liste, tableau…). */
  outputFormat?: string
  /** Exemples de prompts proposés dans l'état vide. */
  suggestedPrompts: string[]
  temperature?: number
}

// ─── Providers ───────────────────────────────────────────────────────────────

export type AIProviderId =
  | 'mock'
  | 'local'
  | 'localmodel'
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'ollama'

/** Réglages d'un provider — aucune clé en dur, uniquement saisie utilisateur
 *  (aiStore/localStorage) ou variables d'environnement Vite (VITE_*). */
export interface ProviderSettings {
  providerId: AIProviderId
  apiKey: string
  model: string
  /** URL de base (OpenAI compatible, Ollama, LM Studio, backend Forma…). */
  endpoint: string
  maxTokens: number
  temperature: number
  /** Délai max (ms) pour les serveurs locaux lents. Optionnel. */
  timeoutMs?: number
}

export interface ProviderChatRequest {
  messages: AIChatMessage[]
  settings: ProviderSettings
  signal?: AbortSignal
}

export interface ProviderChatResult {
  text: string
  providerId: AIProviderId
  /** true si la réponse vient d'un service distant. */
  fromCloud: boolean
  /** true si la réponse vient d'un modèle local (LM Studio/Ollama via localmodel). */
  fromLocalModel?: boolean
  /** true si la génération en streaming a été interrompue (stop/abort utilisateur). */
  interrupted?: boolean
  /** Sources structurées de la réponse (chemin extractif local — #19). */
  sources?: AssistantSource[]
  error?: string
}

/** Reçoit chaque fragment de texte au fil d'un streaming (delta OpenAI-compatible). */
export type StreamChunkHandler = (delta: string) => void

/** Couche abstraite provider — chaque implémentation est sans état. */
export interface AIProviderAdapter {
  id: AIProviderId
  label: string
  /** true si les réglages permettent d'appeler ce provider. */
  isConfigured(settings: ProviderSettings): boolean
  chat(request: ProviderChatRequest): Promise<ProviderChatResult>
}
