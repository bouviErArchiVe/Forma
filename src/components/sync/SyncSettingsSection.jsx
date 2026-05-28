import useSyncStore from '@/stores/useSyncStore'
import { getCloudQueueCount } from '@/lib/sync/cloudQueue'
import { getAllVersionedResources } from '@/lib/sync/versions'
import { PERMISSION_LABELS } from '@/lib/sync/constants'
import { CLOUD_PROVIDERS, resolveSyncModeLabel } from '@/lib/sync/cloudProviders'
import { isSupabaseConfigured } from '@/lib/supabase'
import LocalStorageSection from '@/components/settings/LocalStorageSection'
import VersionHistoryPanel from '@/components/sync/VersionHistoryPanel'
import FormaCloudSection from '@/components/sync/FormaCloudSection'

export default function SyncSettingsSection({ T }) {
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

  const versioned = getAllVersionedResources()
  const totalVersions = versioned.reduce((n, r) => n + r.count, 0)
  const mode = resolveSyncModeLabel({ cloudProvider, cloudEnabled, online, globalStatus, syncError })

  const connectICloud = async () => {
    const res = await tryConnectProvider('icloud')
    if (!res.ok) clearSyncError()
  }

  const connectSupabase = async () => {
    const res = await tryConnectProvider('supabase')
    if (res.ok && !isSupabaseConfigured) return
  }

  return (
    <div>
      <h2 style={{ margin: '0 0 6px', fontSize: 20, color: T.ink }}>Sauvegarde & synchronisation</h2>
      <p style={{ margin: '0 0 20px', fontSize: 13, color: T.muted, lineHeight: 1.5 }}>
        Priorité à la sauvegarde sur votre appareil. Le cloud est optionnel.
      </p>

      <FormaCloudSection T={T} />

      <div style={card(T)}>
        <h3 style={sectionTitle}>État FormaSync</h3>
        <StatRow label="Mode" value={mode.label} T={T} />
        <StatRow label="Détail" value={mode.detail} T={T} />
        <StatRow label="Connexion réseau" value={online ? 'En ligne' : 'Hors ligne — mode local actif'} T={T} />
        <StatRow label="Dernière sauvegarde locale" value={lastLocalSaveAt ? lastLocalSaveAt.toLocaleString('fr-FR') : '—'} T={T} />
        <StatRow label="Dernière sync cloud" value={lastCloudSyncAt ? lastCloudSyncAt.toLocaleString('fr-FR') : '—'} T={T} />
        <StatRow label="File cloud en attente" value={String(getCloudQueueCount() || cloudQueueCount)} T={T} />
        <StatRow label="Versions locales" value={`${totalVersions} sur ${versioned.length} ressource(s)`} T={T} />
        {(syncError || syncConflict?.message) && (
          <div style={{ marginTop: 10, padding: 10, borderRadius: 8, background: '#e9456015', border: '1px solid #e9456044', fontSize: 12, color: '#e94560' }}>
            {syncError || syncConflict.message}
            <button type="button" onClick={clearSyncError} style={{ marginLeft: 8, background: 'none', border: 'none', color: T.accent, cursor: 'pointer', fontSize: 11 }}>OK</button>
          </div>
        )}
      </div>

      <LocalStorageSection T={T} />

      <div style={card(T)}>
        <h3 style={sectionTitle}>Sauvegarde locale (prioritaire)</h3>
        <p style={hint}>Sauvegarde automatique continue pendant le travail. Fonctionne hors ligne sur PC, iPad et mobile (PWA).</p>
        <Toggle T={T} label="Snapshots de versions locales" checked={versionSnapshots} onChange={setVersionSnapshots}
          hint="Conserve jusqu'à 15 versions par document (toutes les 5 min max)." />
      </div>

      <div style={card(T)}>
        <h3 style={sectionTitle}>Cloud (optionnel)</h3>
        <p style={hint}>Choisissez un fournisseur. Sans cloud, tout reste sur cet appareil.</p>

        {Object.values(CLOUD_PROVIDERS).map((p) => (
          <div key={p.id} style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 8, border: `1px solid ${cloudProvider === p.id ? T.accent : T.border}`, background: cloudProvider === p.id ? `${T.accent}10` : T.bg }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{p.label}</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{p.description}</div>
              </div>
              {p.id === 'local' && (
                <button type="button" onClick={() => tryConnectProvider('local')} style={chipBtn(T, cloudProvider === 'local')}>Actif</button>
              )}
              {p.id === 'supabase' && (
                <button type="button" onClick={connectSupabase} disabled={!p.available} style={chipBtn(T, cloudProvider === 'supabase' && cloudEnabled)}>
                  {isSupabaseConfigured ? 'Connecter Supabase' : 'Non configuré'}
                </button>
              )}
              {p.id === 'icloud' && (
                <button type="button" onClick={connectICloud} style={chipBtn(T, cloudProvider === 'icloud')}>
                  Connecter iCloud
                </button>
              )}
            </div>
            {p.comingSoon && (
              <div style={{ fontSize: 10, color: '#f5a623', marginTop: 6 }}>Préparation CloudKit — mode local conservé.</div>
            )}
          </div>
        ))}

        <Toggle T={T} label="Activer la synchronisation cloud" checked={cloudEnabled} onChange={setCloudEnabled}
          hint="Sync multi-appareils (Supabase si connecté)." disabled={cloudProvider === 'local' || cloudProvider === 'icloud'} />
        <Toggle T={T} label="Sync automatique quand en ligne" checked={autoCloudSync} onChange={setAutoCloudSync}
          hint="Synchronise en arrière-plan après chaque sauvegarde locale." disabled={!cloudEnabled} />
      </div>

      <VersionHistoryPanel T={T} />

      <div style={card(T)}>
        <h3 style={sectionTitle}>Partage</h3>
        <p style={hint}>
          Partagez dossiers, documents et projets depuis l&apos;éditeur ou l&apos;onglet Partage.
          Permissions : {Object.values(PERMISSION_LABELS).join(' · ')}.
        </p>
      </div>
    </div>
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
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14, opacity: disabled ? 0.5 : 1, cursor: disabled ? 'default' : 'pointer' }}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} style={{ marginTop: 3 }} />
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
})
const chipBtn = (T, active) => ({
  padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
  border: `1px solid ${active ? T.accent : T.border}`,
  background: active ? `${T.accent}22` : T.surface,
  color: active ? T.accent : T.ink,
})
