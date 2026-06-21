/**
 * AISettingsSection — configuration du fournisseur IA dans les Paramètres.
 *
 * Sécurité :
 * - La clé API est masquée (type="password")
 * - Elle est stockée uniquement dans localStorage via aiStore (Zustand persist)
 * - Un indicateur "cloud actif" prévient l'utilisateur
 * - Le test de connexion ne transmet que "Réponds uniquement ok"
 */
import { useState } from 'react'
import {
  useAIStore,
  PROVIDER_LABELS,
  DEFAULT_MODELS,
  DEFAULT_ENDPOINTS,
  type AIProvider,
} from '../../stores/aiStore'
import { testAIConnection } from '../../lib/ai-service'
import { diagnoseLocalModelConnection, type LocalModelDiagnosis } from '../../services/ai/providers/localmodel'

const PROVIDERS: AIProvider[] = ['local', 'localmodel', 'openai', 'anthropic', 'ollama']

/** Presets de serveur local OpenAI-compatible. */
const LOCAL_PRESETS: { label: string; endpoint: string; model: string }[] = [
  { label: 'LM Studio', endpoint: 'http://localhost:1234/v1', model: 'local-model' },
  { label: 'Ollama', endpoint: 'http://localhost:11434/v1', model: 'llama3.2' },
]

/** Modèles légers conseillés pour une machine de bureau standard. */
const RECOMMENDED_MODELS = ['Phi-3 mini', 'Qwen2 0.5–1.5B', 'Gemma 2B', 'Mistral 7B (Q4) si machine puissante']

export function AISettingsSection() {
  const {
    provider, apiKey, model, endpoint, cloudEnabled,
    maxTokens, temperature, localTimeoutMs,
    setProvider, setApiKey, setModel, setEndpoint,
    setCloudEnabled, setMaxTokens, setTemperature, setLocalTimeoutMs,
    applyProviderDefaults, isCloudReady,
  } = useAIStore()

  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; detail?: string; error?: string } | null>(null)
  const [diag, setDiag] = useState<LocalModelDiagnosis | null>(null)
  const [showKey, setShowKey] = useState(false)

  const isLocalModel = provider === 'localmodel'
  const detectedModels = diag?.models ?? []

  const handleProviderChange = (p: AIProvider) => {
    applyProviderDefaults(p)
    setTestResult(null)
    setDiag(null)
  }

  const applyPreset = (preset: { endpoint: string; model: string }) => {
    setProvider('localmodel')
    setEndpoint(preset.endpoint)
    setModel(preset.model)
    setTestResult(null)
    setDiag(null)
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    setDiag(null)
    const cfg = useAIStore.getState()
    if (cfg.provider === 'localmodel') {
      const d = await diagnoseLocalModelConnection({
        providerId: 'localmodel', apiKey: cfg.apiKey, model: cfg.model,
        endpoint: cfg.endpoint || DEFAULT_ENDPOINTS.localmodel,
        maxTokens: cfg.maxTokens, temperature: cfg.temperature, timeoutMs: cfg.localTimeoutMs,
      })
      setDiag(d)
    } else {
      const result = await testAIConnection(cfg)
      setTestResult({ ok: result.ok, detail: result.ok ? `${result.latencyMs} ms` : undefined, error: result.error })
    }
    setTesting(false)
  }

  /** Apparence du badge d'état localmodel selon le diagnostic. */
  const diagTone = (status: LocalModelDiagnosis['status']): string => {
    if (status === 'ok' || status === 'no-models') return 'text-green-600'
    if (status === 'model-missing') return 'text-amber-600'
    return 'text-red-500'
  }

  const needsKey = provider === 'openai' || provider === 'anthropic'
  const needsEndpoint = provider === 'ollama'
  // localmodel : configurable SANS activer le cloud (opt-in = la sélection).
  const showConfig = isLocalModel || (cloudEnabled && provider !== 'local')
  const ready = isCloudReady()

  return (
    <section id="ai" className="mb-8 space-y-3">
      <h2 className="panel-section-title">IA & Assistant</h2>
      <p className="text-xs text-forma-muted">
        L'IA locale fonctionne sans réseau. Activez un fournisseur cloud pour des réponses plus riches.{' '}
        <strong>Aucune donnée n'est envoyée sans action explicite de votre part.</strong>
      </p>

      {/* Cloud toggle */}
      <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
        <input
          type="checkbox"
          checked={cloudEnabled}
          onChange={(e) => setCloudEnabled(e.target.checked)}
          className="w-4 h-4 accent-forma-accent"
        />
        Activer le fournisseur cloud
        {ready && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            ☁ actif
          </span>
        )}
      </label>

      {/* Provider selector */}
      <label className="block text-sm">
        Fournisseur
        <select
          value={provider}
          onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
          className="forma-input w-full mt-1"
        >
          {PROVIDERS.map((p) => (
            <option key={p} value={p}>{PROVIDER_LABELS[p]}</option>
          ))}
        </select>
      </label>

      {/* API Key */}
      {cloudEnabled && needsKey && (
        <label className="block text-sm">
          Clé API
          <div className="relative mt-1">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={`Clé ${PROVIDER_LABELS[provider]}…`}
              className="forma-input w-full pr-10"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-forma-muted hover:text-forma-text"
              title={showKey ? 'Masquer' : 'Afficher'}
            >
              {showKey ? '🙈' : '👁'}
            </button>
          </div>
          <p className="text-[10px] text-forma-muted mt-1">
            Stockée uniquement dans votre navigateur (localStorage). Jamais envoyée à nos serveurs.
          </p>
        </label>
      )}

      {/* Presets serveur local (LM Studio / Ollama) */}
      {isLocalModel && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-forma-muted">Presets :</span>
          {LOCAL_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p)}
              className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                endpoint === p.endpoint
                  ? 'border-forma-accent/60 bg-forma-accent/10 text-forma-accent'
                  : 'border-forma-border text-forma-muted hover:text-forma-text'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Endpoint (localmodel / Ollama / custom) */}
      {(isLocalModel || (cloudEnabled && (needsEndpoint || provider === 'openai'))) && (
        <label className="block text-sm">
          URL de base {isLocalModel && <span className="text-[10px] text-forma-muted">(LM Studio : http://localhost:1234/v1 · Ollama : http://localhost:11434/v1)</span>}
          <input
            type="url"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder={DEFAULT_ENDPOINTS[provider]}
            className="forma-input w-full mt-1"
          />
        </label>
      )}

      {/* Model — sélection depuis la liste détectée (si dispo) + saisie libre */}
      {showConfig && (
        <label className="block text-sm">
          Modèle
          {isLocalModel && detectedModels.length > 0 && (
            <select
              value={detectedModels.includes(model) ? model : ''}
              onChange={(e) => { if (e.target.value) setModel(e.target.value) }}
              className="forma-input w-full mt-1"
              aria-label="Modèles détectés"
            >
              <option value="">— Modèles détectés ({detectedModels.length}) —</option>
              {detectedModels.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          )}
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={DEFAULT_MODELS[provider]}
            className="forma-input w-full mt-1"
          />
        </label>
      )}

      {/* Timeout (localmodel — serveurs locaux parfois lents) */}
      {isLocalModel && (
        <label className="block text-sm">
          Délai max ({(localTimeoutMs / 1000).toFixed(0)} s)
          <input
            type="range"
            min={5000}
            max={120000}
            step={5000}
            value={localTimeoutMs}
            onChange={(e) => setLocalTimeoutMs(Number(e.target.value))}
            className="w-full mt-0.5"
          />
        </label>
      )}

      {/* Advanced */}
      {showConfig && (
        <details className="text-sm">
          <summary className="cursor-pointer text-forma-muted hover:text-forma-text text-xs">Paramètres avancés</summary>
          <div className="mt-2 space-y-2 pl-2 border-l border-forma-border">
            <label className="block text-xs">
              Tokens max ({maxTokens})
              <input
                type="range"
                min={64}
                max={4096}
                step={64}
                value={maxTokens}
                onChange={(e) => setMaxTokens(Number(e.target.value))}
                className="w-full mt-0.5"
              />
            </label>
            <label className="block text-xs">
              Température ({temperature.toFixed(1)})
              <input
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full mt-0.5"
              />
            </label>
          </div>
        </details>
      )}

      {/* Test connection */}
      {showConfig && (
        <div className="space-y-1">
          <button
            type="button"
            disabled={testing}
            onClick={handleTest}
            className="w-full py-1.5 border border-forma-border rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {testing ? 'Test en cours…' : 'Tester la connexion'}
          </button>
          {/* Diagnostic localmodel (statut classé + message actionnable) */}
          {isLocalModel && diag && (
            <p className={`text-xs ${diagTone(diag.status)}`}>
              {diag.ok ? '✓ ' : (diag.status === 'model-missing' ? '⚠ ' : '✗ ')}{diag.message}
            </p>
          )}
          {/* Résultat test cloud */}
          {!isLocalModel && testResult && (
            <p className={`text-xs ${testResult.ok ? 'text-green-600' : 'text-red-500'}`}>
              {testResult.ok
                ? `✓ Connexion OK${testResult.detail ? ` (${testResult.detail})` : ''}`
                : `✗ Non connecté : ${testResult.error ?? 'Inconnu'}`}
            </p>
          )}
        </div>
      )}

      {/* Info local mode */}
      {provider === 'local' && (
        <p className="text-xs text-forma-muted">
          💻 Mode local : résumé, mots-clés, reformulation et Q&R sur vos notes et la base Knowledge — sans réseau, sans cloud.
        </p>
      )}

      {/* Info + guide local model */}
      {isLocalModel && (
        <div className="text-xs text-forma-muted space-y-2">
          <p>
            🖥️ Modèle local : génération via votre serveur LM Studio ou Ollama (OpenAI-compatible), sans cloud ni clé.
            Les fiches Knowledge pertinentes sont injectées en contexte (réponses ancrées + source). Si le serveur ne
            répond pas, Forma bascule automatiquement sur le mode local extractif.
          </p>
          <details>
            <summary className="cursor-pointer hover:text-forma-text">Guide de configuration</summary>
            <ol className="list-decimal pl-5 mt-1 space-y-0.5">
              <li>Installez et lancez <strong>LM Studio</strong> ou <strong>Ollama</strong>.</li>
              <li>Activez le <strong>serveur local</strong> (LM Studio : onglet « Local Server » ; Ollama : <code>ollama serve</code>).</li>
              <li>Vérifiez l'<strong>URL de base</strong> (preset ci-dessus) et testez la connexion.</li>
              <li>Autorisez l'origine si besoin (<strong>CORS</strong>) — Ollama : variable <code>OLLAMA_ORIGINS</code> ; LM Studio : activer CORS dans les options du serveur.</li>
              <li>Chargez un <strong>modèle léger</strong> et sélectionnez-le ci-dessus.</li>
            </ol>
            <p className="mt-1">Modèles conseillés : {RECOMMENDED_MODELS.join(' · ')}.</p>
          </details>
        </div>
      )}

      {/* Prompts référence */}
      <div className="pt-2 border-t border-forma-border">
        <p className="text-xs text-forma-muted font-medium mb-1">Sources de référence disponibles</p>
        <ul className="text-xs text-forma-muted space-y-0.5">
          <li>🏛️ <strong>CNB</strong> — Code national du bâtiment du Canada</li>
          <li>⚖️ <strong>CCQ</strong> — Code de construction du Québec</li>
          <li>🗺️ <strong>Urbanisme</strong> — Réglementation municipale (Québec)</li>
        </ul>
        <p className="text-[10px] text-forma-muted mt-1">
          Ces modes utilisent des prompts spécialisés. Les codes officiels ne sont pas inclus — l'IA guide l'interprétation de vos notes.
        </p>
      </div>
    </section>
  )
}
