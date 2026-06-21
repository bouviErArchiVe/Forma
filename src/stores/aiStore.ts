/**
 * AI configuration store — persisted in localStorage only.
 * IndexedDB is NEVER used for API keys (security).
 *
 * Provider hierarchy (runtime fallback):
 *   configured provider → local (no API call)
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AIProvider = 'local' | 'localmodel' | 'openai' | 'anthropic' | 'ollama'

export const PROVIDER_LABELS: Record<AIProvider, string> = {
  local: 'Local (sans cloud)',
  localmodel: 'Modèle local (LM Studio / Ollama)',
  openai: 'OpenAI',
  anthropic: 'Anthropic (Claude)',
  ollama: 'Ollama (local LLM)',
}

export const DEFAULT_MODELS: Record<AIProvider, string> = {
  local: '',
  localmodel: 'local-model',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-haiku-4-5',
  ollama: 'llama3',
}

export const DEFAULT_ENDPOINTS: Record<AIProvider, string> = {
  local: '',
  localmodel: 'http://localhost:1234/v1',
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com',
  ollama: 'http://localhost:11434/v1',
}

export interface AIConfig {
  provider: AIProvider
  /** API key — stored ONLY in localStorage, never in IndexedDB. */
  apiKey: string
  model: string
  /** Custom endpoint for Ollama or self-hosted OpenAI-compatible servers. */
  endpoint: string
  /** Whether cloud AI features are enabled at all. */
  cloudEnabled: boolean
  /** Max tokens for chat completions. */
  maxTokens: number
  /** Temperature (0–2). */
  temperature: number
  /** Timeout (ms) for local model servers (LM Studio/Ollama). */
  localTimeoutMs: number
}

interface AIState extends AIConfig {
  setProvider: (p: AIProvider) => void
  setApiKey: (k: string) => void
  setModel: (m: string) => void
  setEndpoint: (e: string) => void
  setCloudEnabled: (v: boolean) => void
  setMaxTokens: (v: number) => void
  setTemperature: (v: number) => void
  setLocalTimeoutMs: (v: number) => void
  /** Reset to defaults for the given provider (model + endpoint). */
  applyProviderDefaults: (p: AIProvider) => void
  /** True if a cloud provider is configured with a non-empty key. */
  isCloudReady: () => boolean
}

export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      provider: 'local',
      apiKey: '',
      model: '',
      endpoint: '',
      cloudEnabled: false,
      maxTokens: 1024,
      temperature: 0.7,
      localTimeoutMs: 45000,

      setProvider: (p) => set({ provider: p }),
      setApiKey: (k) => set({ apiKey: k }),
      setModel: (m) => set({ model: m }),
      setEndpoint: (e) => set({ endpoint: e }),
      setCloudEnabled: (v) => set({ cloudEnabled: v }),
      setMaxTokens: (v) => set({ maxTokens: Math.max(64, Math.min(8192, v)) }),
      setTemperature: (v) => set({ temperature: Math.max(0, Math.min(2, v)) }),
      setLocalTimeoutMs: (v) => set({ localTimeoutMs: Math.max(5000, Math.min(300000, v)) }),

      applyProviderDefaults: (p) => set({
        provider: p,
        model: DEFAULT_MODELS[p],
        endpoint: DEFAULT_ENDPOINTS[p],
      }),

      isCloudReady: () => {
        const { provider, apiKey, cloudEnabled } = get()
        if (!cloudEnabled) return false
        if (provider === 'local') return false
        if (provider === 'ollama') return true // no key needed
        return apiKey.trim().length > 0
      },
    }),
    {
      name: 'forma-ai-config',
      // Only persist to localStorage (default for zustand/persist)
    },
  ),
)
