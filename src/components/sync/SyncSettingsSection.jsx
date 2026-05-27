import useSyncStore from '@/stores/useSyncStore'
import { getCloudQueueCount } from '@/lib/sync/cloudQueue'
import { getAllVersionedResources } from '@/lib/sync/versions'
import { PERMISSION_LABELS } from '@/lib/sync/constants'

export default function SyncSettingsSection({ T }) {
  const cloudEnabled = useSyncStore((s) => s.cloudEnabled)
  const autoCloudSync = useSyncStore((s) => s.autoCloudSync)
  const versionSnapshots = useSyncStore((s) => s.versionSnapshots)
  const online = useSyncStore((s) => s.online)
  const lastLocalSaveAt = useSyncStore((s) => s.lastLocalSaveAt)
  const lastCloudSyncAt = useSyncStore((s) => s.lastCloudSyncAt)
  const cloudQueueCount = useSyncStore((s) => s.cloudQueueCount)
  const setCloudEnabled = useSyncStore((s) => s.setCloudEnabled)
  const setAutoCloudSync = useSyncStore((s) => s.setAutoCloudSync)
  const setVersionSnapshots = useSyncStore((s) => s.setVersionSnapshots)

  const versioned = getAllVersionedResources()
  const totalVersions = versioned.reduce((n, r) => n + r.count, 0)

  return (
    <div>
      <h2 style={{ margin: '0 0 6px', fontSize: 20, color: T.ink }}>Sauvegarde & synchronisation</h2>
      <p style={{ margin: '0 0 20px', fontSize: 13, color: T.muted, lineHeight: 1.5 }}>
        Priorité à la sauvegarde sur votre appareil. Le cloud est optionnel pour la sync multi-appareils et les sauvegardes distantes.
      </p>

      <div style={card(T)}>
        <h3 style={sectionTitle}>État</h3>
        <StatRow label="Connexion" value={online ? 'En ligne' : 'Hors ligne — mode local actif'} T={T} />
        <StatRow label="Dernière sauvegarde locale" value={lastLocalSaveAt ? lastLocalSaveAt.toLocaleString('fr-FR') : '—'} T={T} />
        <StatRow label="Dernière sync cloud" value={lastCloudSyncAt ? lastCloudSyncAt.toLocaleString('fr-FR') : '—'} T={T} />
        <StatRow label="File cloud en attente" value={String(getCloudQueueCount() || cloudQueueCount)} T={T} />
        <StatRow label="Versions locales" value={`${totalVersions} sur ${versioned.length} ressource(s)`} T={T} />
      </div>

      <div style={card(T)}>
        <h3 style={sectionTitle}>Sauvegarde locale (prioritaire)</h3>
        <p style={hint}>Sauvegarde automatique continue pendant le travail. Fonctionne hors ligne sur PC, iPad, tablette et mobile (PWA).</p>
        <Toggle T={T} label="Snapshots de versions locales" checked={versionSnapshots} onChange={setVersionSnapshots}
          hint="Conserve jusqu'à 15 versions par document (toutes les 5 min max)." />
      </div>

      <div style={card(T)}>
        <h3 style={sectionTitle}>Cloud (optionnel)</h3>
        <Toggle T={T} label="Activer la synchronisation cloud" checked={cloudEnabled} onChange={setCloudEnabled}
          hint="Sync multi-appareils et sauvegarde distante via Supabase." />
        <Toggle T={T} label="Sync automatique quand en ligne" checked={autoCloudSync} onChange={setAutoCloudSync}
          hint="Synchronise en arrière-plan après chaque sauvegarde locale." disabled={!cloudEnabled} />
      </div>

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
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, borderBottom: `1px solid ${T.border}22` }}>
      <span style={{ color: T.muted }}>{label}</span>
      <span style={{ color: T.ink, fontWeight: 500 }}>{value}</span>
    </div>
  )
}

function Toggle({ label, hint, checked, onChange, disabled, T }) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14, opacity: disabled ? 0.5 : 1, cursor: disabled ? 'default' : 'pointer' }}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} style={{ marginTop: 3 }} />
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{hint}</div>}
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
