import { useCallback, useEffect, useRef, useState } from 'react'
import { runAIChat, isAIChatConfigured, getAIProviderLabel, runAIAction, testAIConnection } from '@/lib/formaai/provider'
import { AI_ACTIONS, FAI_DARK } from '@/lib/formaai/constants'
import FormaModuleHeader from '@/components/FormaModuleHeader'

const HISTORY_KEY = 'forma-ai-chat'

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    const data = raw ? JSON.parse(raw) : []
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

function saveHistory(messages) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-80)))
  } catch { /* quota */ }
}

export default function FormaAIChat({ fullPage = false, embedded = false, onClose, initialText = '' }) {
  const apiReady = isAIChatConfigured()
  const [messages, setMessages] = useState(() => loadHistory())
  const [input, setInput] = useState(initialText)
  const [busy, setBusy] = useState(false)
  const [action, setAction] = useState('chat')
  const [error, setError] = useState('')
  const [testBusy, setTestBusy] = useState(false)
  const [testResult, setTestResult] = useState('')
  const endRef = useRef(null)

  const runConnectionTest = useCallback(async () => {
    setTestResult('')
    setError('')
    setTestBusy(true)
    try {
      const res = await testAIConnection()
      setTestResult(`Connexion OK (${res.provider}) — ${res.preview}`)
    } catch (err) {
      setTestResult('')
      setError(err.message || 'Test de connexion échoué')
    } finally {
      setTestBusy(false)
    }
  }, [])

  useEffect(() => {
    if (initialText) setInput(initialText)
  }, [initialText])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  useEffect(() => {
    saveHistory(messages)
  }, [messages])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || busy) return
    setError('')
    setBusy(true)
    const userMsg = { id: Date.now(), role: 'user', text, at: Date.now() }
    const nextHistory = [...messages, userMsg]
    setMessages(nextHistory)
    setInput('')
    try {
      let reply
      if (action === 'chat') {
        reply = await runAIChat(nextHistory)
      } else {
        reply = await runAIAction(action, text)
      }
      setMessages((m) => [...m, { id: Date.now() + 1, role: 'assistant', text: reply, at: Date.now() }])
    } catch (err) {
      setError(err.code === 'NO_API' || err.message?.includes('clé API')
        ? 'Connecte une clé API pour activer le chat IA.'
        : (err.message || 'Erreur IA'))
    } finally {
      setBusy(false)
    }
  }, [input, busy, action, messages])

  const shellStyle = embedded
    ? { height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', background: FAI_DARK.bg, color: FAI_DARK.ink }
    : fullPage
    ? { minHeight: '100dvh', background: FAI_DARK.bg, color: FAI_DARK.ink, display: 'flex', flexDirection: 'column' }
    : {
      position: 'fixed', bottom: 16, right: 16, width: 'min(380px, calc(100vw - 32px))',
      maxHeight: 'min(520px, calc(100dvh - 32px))', zIndex: 3500,
      background: FAI_DARK.panel, borderRadius: 14, border: `1px solid ${FAI_DARK.border}`,
      boxShadow: '0 12px 48px rgba(0,0,0,.5)', display: 'flex', flexDirection: 'column',
    }

  return (
    <div style={shellStyle}>
      {fullPage && !embedded ? (
        <FormaModuleHeader title="FormaAI" subtitle="Discussion · architecture & cours" dark={FAI_DARK} />
      ) : !embedded ? (
        <div style={{
          padding: '12px 14px',
          borderBottom: `1px solid ${FAI_DARK.border}`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 16 }}>✦</span>
          <strong style={{ flex: 1, fontSize: 14 }}>FormaAI</strong>
          {onClose && <button type="button" onClick={onClose} style={iconBtn}>✕</button>}
        </div>
      ) : null}

      <div style={{
        margin: fullPage ? '12px 16px 0' : '8px 12px 0',
        padding: '12px 14px', borderRadius: 8,
        background: apiReady ? `${FAI_DARK.accent}18` : '#f5a62322',
        border: `1px solid ${apiReady ? `${FAI_DARK.accent}44` : '#f5a62355'}`,
        fontSize: 12, color: FAI_DARK.ink, lineHeight: 1.55,
      }}>
        <strong style={{ display: 'block', marginBottom: 6 }}>Configuration API IA</strong>
        <ol style={{ margin: '0 0 8px 18px', padding: 0 }}>
          <li>Créez une clé API chez {getAIProviderLabel()} (ex. clé secrète <code style={{ fontSize: 11 }}>sk-…</code> pour OpenAI).</li>
          <li>Dans le fichier <code style={{ fontSize: 11 }}>.env.local</code> à la racine du projet, ajoutez&nbsp;:
            <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 6, background: FAI_DARK.bg, fontFamily: 'monospace', fontSize: 11 }}>
              VITE_AI_API_KEY=votre_cle<br />
              VITE_AI_PROVIDER=openai<br />
              VITE_AI_MODEL=gpt-4o-mini
            </div>
          </li>
          <li>Relancez <code style={{ fontSize: 11 }}>npm run dev</code> pour prendre en compte la clé.</li>
          <li>Cliquez sur « Tester la connexion » ci-dessous.</li>
        </ol>
        {!apiReady && (
          <p style={{ margin: '0 0 8px', color: '#f5a623' }}>
            Aucune clé détectée pour l&apos;instant — FormaAI fonctionne en mode local limité sans bloquer l&apos;app.
          </p>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <button type="button" onClick={runConnectionTest} disabled={testBusy || !apiReady} style={testBtn}>
            {testBusy ? 'Test…' : 'Tester la connexion'}
          </button>
          {testResult && <span style={{ fontSize: 11, color: '#6ee7b7' }}>{testResult}</span>}
        </div>
      </div>

      <div style={{ padding: '8px 12px', display: 'flex', flexWrap: 'wrap', gap: 4, borderBottom: fullPage ? `1px solid ${FAI_DARK.border}` : undefined }}>
        <Chip active={action === 'chat'} onClick={() => setAction('chat')}>💬 Discussion</Chip>
        {Object.values(AI_ACTIONS).slice(0, 6).map((a) => (
          <Chip key={a.id} active={action === a.id} onClick={() => setAction(a.id)}>{a.icon} {a.label}</Chip>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', WebkitOverflowScrolling: 'touch', padding: fullPage ? '16px 20px' : '10px 12px', minHeight: fullPage ? 0 : 180 }}>
        {messages.length === 0 && (
          <p style={{ color: FAI_DARK.muted, fontSize: 13, lineHeight: 1.5 }}>
            {action === 'chat'
              ? 'Posez une question libre sur vos cours, projets, normes ou outils Forma.'
              : 'Mode outil : reformulation, résumé, correction… Le mode Discussion est recommandé pour converser.'}
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} style={{
            marginBottom: 10, padding: '10px 12px', borderRadius: 10,
            background: m.role === 'user' ? `${FAI_DARK.accent}22` : FAI_DARK.surface,
            border: `1px solid ${FAI_DARK.border}`, fontSize: 13, lineHeight: 1.55, whiteSpace: 'pre-wrap',
          }}>
            <div style={{ fontSize: 10, color: FAI_DARK.muted, marginBottom: 4 }}>
              {m.role === 'user' ? 'Vous' : 'FormaAI'}
            </div>
            {m.text}
          </div>
        ))}
        {busy && <div style={{ fontSize: 12, color: FAI_DARK.accent2 }}>Réflexion…</div>}
        {error && <div style={{ fontSize: 12, color: '#e94560' }}>{error}</div>}
        <div ref={endRef} />
      </div>

      <div style={{ padding: fullPage ? '12px 16px max(12px, env(safe-area-inset-bottom))' : '10px 12px', borderTop: `1px solid ${FAI_DARK.border}`, display: 'flex', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Votre message… (Entrée pour envoyer)"
          rows={fullPage ? 3 : 2}
          style={{ ...taStyle, flex: 1, minHeight: fullPage ? 72 : 52 }}
        />
        <button type="button" onClick={send} disabled={busy || !input.trim()} style={sendBtn}>
          Envoyer
        </button>
      </div>
    </div>
  )
}

function Chip({ children, active, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: '4px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
      border: `1px solid ${active ? FAI_DARK.accent : FAI_DARK.border}`,
      background: active ? `${FAI_DARK.accent}33` : FAI_DARK.surface,
      color: FAI_DARK.ink,
    }}>
      {children}
    </button>
  )
}

const taStyle = {
  width: '100%', boxSizing: 'border-box', resize: 'vertical',
  background: FAI_DARK.bg, color: FAI_DARK.ink, border: `1px solid ${FAI_DARK.border}`,
  borderRadius: 8, padding: 8, fontSize: 13, fontFamily: 'inherit',
}
const iconBtn = { background: 'none', border: 'none', color: FAI_DARK.muted, cursor: 'pointer', fontSize: 14 }
const sendBtn = {
  padding: '10px 14px', borderRadius: 8, border: 'none', background: FAI_DARK.accent,
  color: '#1a1e28', fontWeight: 700, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap',
}
const testBtn = {
  padding: '7px 12px', borderRadius: 8, border: `1px solid ${FAI_DARK.accent}`,
  background: `${FAI_DARK.accent}33`, color: FAI_DARK.ink, fontSize: 12, fontWeight: 600, cursor: 'pointer',
}
