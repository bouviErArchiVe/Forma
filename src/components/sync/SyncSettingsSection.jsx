import { useState } from 'react'
import useSyncStore from '@/stores/useSyncStore'
import { getCloudQueueCount } from '@/lib/sync/cloudQueue'
import { getAllVersionedResources } from '@/lib/sync/versions'
import { PERMISSION_LABELS } from '@/lib/sync/constants'
import { CLOUD_PROVIDERS, resolveSyncModeLabel } from '@/lib/sync/cloudProviders'
import { isSupabaseConfigured } from '@/lib/supabase'
import useAppStore from '@/stores/useAppStore'
import LocalStorageSection from '@/components/settings/LocalStorageSection'
import VersionHistoryPanel from '@/components/sync/VersionHistoryPanel'
import FormaCloudSection from '@/components/sync/FormaCloudSection'

const TABS = [
  { id: 'cloud', label: 'Cloud', icon: '☁' },
  { id: 'local', label: 'Local', icon: '💾' },
  { id: 'schedule', label: 'Programmation', icon: '⏱' },
]

function formatDateTime(value) {
  if (value == null || value === '') return '—'
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('fr-FR')
}

export default function SyncSettingsSection({ T }) {
  const [activeTab, setActiveTab] = useState('cloud')
  const [showHistory, setShowHistory] = useState(false)
  const [busy, setBusy] = useState(null)
  const addNotification = useAppStore((s) => s.addNotification)

  const cloudEnabled = useSyncStore((s) => s.cloudEnabled)
  const autoCloudSync = useSyncStore((s) => s.autoCloudSync)
  const versionSnapshots = useSyncStore((s) => s.versionSnapshots)
  const cloudProvider = useSyncStore((s) => s.cloudProvider)
  const online = useSyncStore((s) => s.online)
  const globalStatus = useSyncStore((s) => s.globalStatus)
  const lastLocalSaveAt = useSyncStore((s) => s.lastLocalSaveAt)
  const lastCloudSyncAt = useSyncStore((s) => s.lastCloudSyncAt)
  const cloudQueueCount = useSyncStore((s) => s.cloudQueueCount)
  const syncError = useSyncStore((s) => s.syncError)
  const syncConflict = useSyncStore((s) => s.syncConflict)
  const setCloudEnabled = useSyncStore((s) => s.setCloudEnabled)
  const setAutoCloudSync = useSyncStore((s) => s.setAutoCloudSync)
  const setVersionSnapshots = useSyncStore((s) => s.setVersionSnapshots)
  const tryConnectProvider = useSyncStore((s) => s.tryConnectProvider)
  const clearSyncError = useSyncStore((s) => s.clearSyncError)

  const versioned = (() => {
    try {
      return getAllVersionedResources()
    } catch {
      return []
    }
  })()
  const totalVersions = versioned.reduce((n, r) => n + r.count, 0)
  const mode = resolveSyncModeLabel({ cloudProvider, cloudEnabled, online, globalStatus, syncError })

  const notify = (msg, type = 'info') => addNotification?.(msg, type)

  const connectICloud = async () => {
    setBusy('icloud')
    try {
      const res = await tryConnectProvider('icloud')
      notify(res.message || 'iCloud — fonction bientôt disponible. Export manuel FormaCloud disponible.', res.ok ? 'success' : 'info')
    } finally {
      setBusy(null)
    }
  }

  const connectSupabase = async () => {
    if (!isSupabaseConfigured) {
      notify('Supabase non configuré — ajoutez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.', 'error')
      return
    }
    setBusy('supabase')
    try {
      const res = await tryConnectProvider('supabase')
      if (res.ok) notify('Supabase connecté — sync multi-appareils activable ci-dessous.', 'success')
      else notify(res.message || 'Connexion Supabase impossible', 'error')
    } finally {
      setBusy(null)
    }
  }

  const selectLocal = async () => {
    setBusy('local')
    try {
      await tryConnectProvider('local')
      notify('Mode local seulement — sauvegarde sur cet appareil.', 'success')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <h2 style={{ margin: '0 0 6px', fontSize: 20, color: T.ink }}>Sauvegarde & synchronisation</h2>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: T.muted, lineHeight: 1.5 }}>
        Priorité à la sauvegarde sur votre appareil. Le cloud est optionnel.
      </p>

      <div style={{
        display: 'flex',
        gap: 6,
        marginBottom: 16,
        flexWrap: 'wrap',
        position: 'relative',
        zIndex: 2,
      }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className="forma-btn-glass"
            style={tabBtn(T, activeTab === t.id)}
          >
            {t.icon} {t.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowHistory(true)}
          className="forma-btn-glass"
          style={{ ...tabBtn(T, false), marginLeft: 'auto' }}
        >
          🕐 Historique ({totalVersions})
        </button>
      </div>

      <div style={card(T)}>
        <StatRow label="Mode" value={mode.label} T={T} />
        <StatRow label="Réseau" value={online ? 'En ligne' : 'Hors ligne'} T={T} />
        <StatRow label="Dernière sauvegarde locale" value={formatDateTime(lastLocalSaveAt)} T={T} />
        {(syncError || syncConflict?.message) && (
          <div style={{ marginTop: 10, padding: 10, borderRadius: 8, background: '#e9456015', border: '1px solid #e9456044', fontSize: 12, color: '#e94560' }}>
            {syncError || syncConflict.message}
            <button type="button" onClick={clearSyncError} style={linkBtn(T)}>OK</button>
          </div>
        )}
      </div>

      {activeTab === 'cloud' && (
        <>
          <FormaCloudSection T={T} />
          <div style={card(T)}>
            <h3 style={sectionTitle}>FormaSync — cloud Supabase</h3>
            <p style={hint}>Sync base de données (optionnel, distinct de FormaCloud Drive).</p>
            {Object.values(CLOUD_PROVIDERS).filter((p) => p.id !== 'local').map((p) => (
              <div key={p.id} style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 8, border: `1px solid ${cloudProvider === p.id ? T.accent : T.border}`, background: cloudProvider === p.id ? `${T.accent}10` : T.bg }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{p.label}</div>
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{p.description}</div>
                    {p.comingSoon && <div style={{ fontSize: 10, color: '#f5a623', marginTop: 4 }}>Bientôt disponible</div>}
                  </div>
                  {p.id === 'supabase' && (
                    <ActionBtn T={T} active={cloudProvider === 'supabase' && cloudEnabled} busy={busy === 'supabase'} onClick={connectSupabase}>
                      {isSupabaseConfigured ? 'Connecter' : 'Configurer .env'}
                    </ActionBtn>
                  )}
                  {p.id === 'icloud' && (
                    <ActionBtn T={T} active={cloudProvider === 'icloud'} busy={busy === 'icloud'} onClick={connectICloud}>
                      Connecter iCloud
                    </ActionBtn>
                  )}
                </div>
              </div>
            ))}
            <Toggle T={T} label="Activer sync Supabase" checked={cloudEnabled} onChange={setCloudEnabled}
              hint="Multi-appareils via Supabase." disabled={cloudProvider === 'local' || cloudProvider === 'icloud' || !isSupabaseConfigured} />
            <StatRow label="Dernière sync Supabase" value={formatDateTime(lastCloudSyncAt)} T={T} />
            <StatRow label="File en attente" value={String(getCloudQueueCount() || cloudQueueCount)} T={T} />
          </div>
        </>
      )}

      {activeTab === 'local' && (
        <>
          <LocalStorageSection T={T} />
          <div style={card(T)}>
            <h3 style={sectionTitle}>Mode local prioritaire</h3>
            <p style={hint}>Toutes les données restent sur cet appareil. Aucune connexion cloud requise.</p>
            <ActionBtn T={T} active={cloudProvider === 'local' || !cloudEnabled} busy={busy === 'local'} onClick={selectLocal}>
              Utiliser le stockage local
            </ActionBtn>
            <StatRow label="Versions locales" value={`${totalVersions} sur ${versioned.length} ressource(s)`} T={T} />
          </div>
        </>
      )}

      {activeTab === 'schedule' && (
        <div style={card(T)}>
          <h3 style={sectionTitle}>Programmation & automatisation</h3>
          <p style={hint}>Contrôlez quand et comment Forma sauvegarde vos données.</p>
          <Toggle T={T} label="Snapshots de versions locales" checked={versionSnapshots} onChange={setVersionSnapshots}
            hint="Jusqu'à 15 versions par document (toutes les 5 min max)." />
          <Toggle T={T} label="Sync Supabase automatique" checked={autoCloudSync} onChange={setAutoCloudSync}
            hint="Synchronise en arrière-plan quand en ligne." disabled={!cloudEnabled} />
          <p style={{ ...hint, marginTop: 12, marginBottom: 0 }}>
            FormaCloud (Google Drive) : sync auto configurable dans l&apos;onglet Cloud.
          </p>
        </div>
      )}

      <div style={card(T)}>
        <h3 style={sectionTitle}>Partage</h3>
        <p style={hint}>
          Partagez depuis l&apos;éditeur ou l&apos;onglet Partage.
          Permissions : {Object.values(PERMISSION_LABELS).join(' · ')}.
        </p>
      </div>

      <VersionHistoryPanel T={T} open={showHistory} onClose={() => setShowHistory(false)} />
    </div>
  )
}

function ActionBtn({ children, onClick, disabled, busy, active, T }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      className="forma-btn-glass forma-tap-target"
      style={{
        ...chipBtn(T, active),
        opacity: busy ? 0.7 : 1,
        cursor: busy ? 'wait' : 'pointer',
        touchAction: 'manipulation',
        position: 'relative',
        zIndex: 1,
      }}
    >
      {busy ? '…' : children}
    </button>
  )
}

function StatRow({ label, value, T }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, borderBottom: `1px solid ${T.border}22`, gap: 12 }}>
      <span style={{ color: T.muted, flexShrink: 0 }}>{label}</span>
      <span style={{ color: T.ink, fontWeight: 500, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

function Toggle({ label, hint: hintText, checked, onChange, disabled, T }) {
  return (
    <label style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      marginBottom: 14,
      opacity: disabled ? 0.55 : 1,
      cursor: disabled ? 'default' : 'pointer',
      touchAction: 'manipulation',
    }}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} style={{ marginTop: 3, minWidth: 18, minHeight: 18 }} />
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{label}</div>
        {hintText && <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{hintText}</div>}
      </div>
    </label>
  )
}

const sectionTitle = { margin: '0 0 12px', fontSize: 14, fontWeight: 700 }
const hint = { margin: '0 0 12px', fontSize: 12, color: '#8b95a8', lineHeight: 1.45 }
const card = (T) => ({
  background: T.surface || '#151820',
  border: `1px solid ${T.border || '#2a3144'}`,
  borderRadius: 12,
  padding: 16,
  marginBottom: 16,
  position: 'relative',
  zIndex: 1,
})
const chipBtn = (T, active) => ({
  padding: '8px 14px',
  minHeight: 44,
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 700,
  border: `1px solid ${active ? T.accent : T.border}`,
  background: active ? `${T.accent}22` : T.surface,
  color: active ? T.accent : T.ink,
})
const tabBtn = (T, active) => ({
  ...chipBtn(T, active),
  touchAction: 'manipulation',
})
const linkBtn = (T) => ({
  marginLeft: 8,
  background: 'none',
  border: 'none',
  color: T.accent,
  cursor: 'pointer',
  fontSize: 11,
  touchAction: 'manipulation',
  minHeight: 32,
  padding: '4px 8px',
})
