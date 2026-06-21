/**
 * Registre des providers FormAI.
 *
 * Source des réglages, par priorité :
 *   1. Config utilisateur (aiStore, persistée en localStorage)
 *   2. Variables d'environnement Vite (VITE_*_API_KEY) — jamais de clé en dur
 *   3. Valeurs par défaut du provider
 *
 * Le provider 'mock' est réservé aux tests/démo, 'local' est le fallback
 * universel (aucune configuration requise).
 */
import { useAIStore } from '../../../stores/aiStore'
import type { AIProviderAdapter, AIProviderId, ProviderSettings } from '../types'
import { anthropicProvider } from './anthropic'
import { geminiProvider } from './gemini'
import { localProvider } from './local'
import { localModelProvider } from './localmodel'
import { mockProvider } from './mock'
import { ollamaProvider } from './ollama'
import { openAIProvider } from './openai'

const PROVIDERS: Record<AIProviderId, AIProviderAdapter> = {
  mock: mockProvider,
  local: localProvider,
  localmodel: localModelProvider,
  openai: openAIProvider,
  anthropic: anthropicProvider,
  gemini: geminiProvider,
  ollama: ollamaProvider,
}

/**
 * Providers LOCAUX (réseau localhost, sans cloud) activables par simple
 * sélection — sans avoir à cocher « fournisseur cloud » (opt-in = la sélection).
 */
const LOCAL_NETWORK_PROVIDERS = new Set<AIProviderId>(['localmodel'])

export function getProvider(id: AIProviderId): AIProviderAdapter {
  return PROVIDERS[id] ?? localProvider
}

export function listProviders(): AIProviderAdapter[] {
  return Object.values(PROVIDERS)
}

/** Clés d'environnement Vite par provider (fallback si aiStore vide). */
function envApiKey(id: AIProviderId): string {
  const env = import.meta.env as Record<string, string | undefined>
  switch (id) {
    case 'openai': return env.VITE_OPENAI_API_KEY ?? ''
    case 'anthropic': return env.VITE_ANTHROPIC_API_KEY ?? ''
    case 'gemini': return env.VITE_GEMINI_API_KEY ?? ''
    default: return ''
  }
}

/**
 * Construit les réglages du provider actif à partir de la config
 * utilisateur existante (aiStore) + fallback variables d'environnement.
 * Si le cloud est désactivé ou non configuré, retombe sur 'local'.
 */
export function resolveProviderSettings(): ProviderSettings {
  const cfg = useAIStore.getState()
  // Un provider local (localmodel) s'active par sa seule sélection ; le cloud
  // exige la case « fournisseur cloud ». 'local' = fallback universel.
  const localActivatable = LOCAL_NETWORK_PROVIDERS.has(cfg.provider as AIProviderId)
  const requested: AIProviderId =
    cfg.provider !== 'local' && (cfg.cloudEnabled || localActivatable) ? cfg.provider : 'local'

  const settings: ProviderSettings = {
    providerId: requested,
    apiKey: cfg.apiKey.trim() !== '' ? cfg.apiKey : envApiKey(requested),
    model: cfg.model,
    endpoint: cfg.endpoint,
    maxTokens: cfg.maxTokens,
    temperature: cfg.temperature,
    timeoutMs: cfg.localTimeoutMs,
  }

  if (requested !== 'local' && !getProvider(requested).isConfigured(settings)) {
    return { ...settings, providerId: 'local' }
  }
  return settings
}
