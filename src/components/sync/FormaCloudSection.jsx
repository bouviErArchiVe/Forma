import { useRef, useState } from 'react'
import useFormaCloudStore from '@/stores/useFormaCloudStore'
import { FORMA_CLOUD_PROVIDERS, FORMA_CLOUD_STATUS } from '@/lib/formacloud/constants'
import { listFormaCloudProviders } from '@/lib/formacloud/providers'
import {
  connectFormaCloud,
  disconnectFormaCloud,
  runFormaCloudSync,
  openFormaCloudFolderFromStore,
  exportFormaBundle,
  importFormaBundle,
  getFormaCloudQueueCount,
} from '@/lib/formacloud/sync'
import { isGoogleDriveConfigured } from '@/lib/formacloud/providers/googleDrive'

const STATUS_LABELS = {
  [FORMA_CLOUD_STATUS.idle]: 'Inactif',
  [FORMA_CLOUD_STATUS.saved_local]: 'Sauvegardé localement',
  [FORMA_CLOUD_STATUS.syncing]: 'Synchronisation cloud…',
  [FORMA_CLOUD_STATUS.synced]: 'Cloud à jour',
  [FORMA_CLOUD_STATUS.offline]: 'Hors ligne',
  [FORMA_CLOUD_STATUS.error]: 'Erreur cloud',
  [FORMA_CLOUD_STATUS.conflict]: 'Conflit de version',
}

export default function FormaCloudSection({ T }) {
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)

  const connected = useFormaCloudStore((s) => s.connected)
  const provider = useFormaCloudStore((s) => s.provider)
  const status = useFormaCloudStore((s) => s.status)
  const lastSyncAt = useFormaCloudStore((s) => s.lastSyncAt)
  const error = useFormaCloudStore((s) => s.error)
  const conflict = useFormaCloudStore((s) => s.conflict)
  const autoSync = useFormaCloudStore((s) => s.autoSync)
  const setAutoSync = useFormaCloudStore((s) => s.setAutoSync)
  const setError = useFormaCloudStore((s) => s.setError)
  const setConflict = useFormaCloudStore((s) => s.setConflict)

  const providerInfo = provider ? FORMA_CLOUD_PROVIDERS[provider] : null
  const queueCount = getFormaCloudQueueCount()

  const handleConnect = async (providerId) => {
    setBusy(true)
    setError(null)
    try {
      await connectFormaCloud(useFormaCloudStore, providerId)
    } finally {
      setBusy(false)
    }
  }

  const handleDisconnect = async () => {
    if (!window.confirm('Déconnecter FormaCloud ? Vos données locales et cloud ne seront pas supprimées.')) return
    setBusy(true)
    try {
      await disconnectFormaCloud(useFormaCloudStore)
    } finally {
      setBusy(false)
    }
  }

  const handleSyncNow = async (force = false) => {
    setBusy(true)
    try {
      await runFormaCloudSync(useFormaCloudStore, { force })
    } finally {
      setBusy(false)
    }
  }

  const handleOpenFolder = () => {
    openFormaCloudFolderFromStore(useFormaCloudStore)
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      const check = await importFormaBundle(file, { confirmOverwrite: false })
      if (check.needsConfirm) {
        const ok = window.confirm(
          `Importer ${check.fileCount} fichier(s) depuis la sauvegarde ? Les données locales seront remplacées.`
        )
        if (ok) {
          await importFormaBundle(file, { confirmOverwrite: true })
          window.alert('Import terminé. Rechargez la page pour appliquer.')
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }

  return (
    <div style={card(T)}>
      <h3 style={sectionTitle}>FormaCloud — stockage connecté</h3>
      <p style={hint}>
        Connectez Google Drive, iCloud (bientôt) ou exportez manuellement.
        La sauvegarde locale reste prioritaire ; le cloud est optionnel.
      </p>

      <div style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 8, background: `${T.accent}10`, border: `1px solid ${T.accent}33` }}>
        <StatRow T={T} label="Statut" value={STATUS_LABELS[status] || status} />
        {connected && providerInfo && (
          <StatRow T={T} label="Fournisseur" value={`${providerInfo.icon} ${providerInfo.label}`} />
        )}
        <StatRow T={T} label="Dernière sync cloud" value={lastSyncAt ? new Date(lastSyncAt).toLocaleString('fr-FR') : '—'} />
        <StatRow T={T} label="File d'attente" value={queueCount ? `${queueCount} en attente` : 'Vide'} />
      </div>

      {(error || conflict?.message) && (
        <div style={{ marginBottom: 12, padding: 10, borderRadius: 8, background: '#e9456015', border: '1px solid #e9456044', fontSize: 12, color: '#e94560' }}>
          {error || conflict.message}
          {conflict && (
            <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => handleSyncNow(true)} disabled={busy} style={chipBtn(T, false)}>
                Envoyer ma version locale
              </button>
              <button type="button" onClick={() => setConflict(null)} style={chipBtn(T, false)}>Ignorer</button>
            </div>
          )}
          {!conflict && (
            <button type="button" onClick={() => setError(null)} style={{ marginLeft: 8, background: 'none', border: 'none', color: T.accent, cursor: 'pointer', fontSize: 11 }}>OK</button>
          )}
        </div>
      )}

      {!connected && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.ink }}>Connecter un stockage cloud</div>
          {listFormaCloudProviders().map((p) => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{p.icon} {p.label}</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{p.description}</div>
                {p.comingSoon && <div style={{ fontSize: 10, color: '#f5a623', marginTop: 4 }}>Bientôt</div>}
                {p.id === 'google_drive' && !isGoogleDriveConfigured() && (
                  <div style={{ fontSize: 10, color: '#f5a623', marginTop: 4 }}>VITE_GOOGLE_CLIENT_ID requis</div>
                )}
              </div>
              <button
                type="button"
                disabled={busy || p.comingSoon || (p.id === 'google_drive' && !p.available())}
                onClick={() => handleConnect(p.id)}
                style={chipBtn(T, false)}
              >
                Connecter
              </button>
            </div>
          ))}
        </div>
      )}

      {connected && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          <button type="button" disabled={busy} onClick={() => handleSyncNow(false)} style={chipBtn(T, true)}>↻ Synchroniser maintenant</button>
          <button type="button" disabled={busy} onClick={handleOpenFolder} style={chipBtn(T, false)}>Ouvrir dossier Forma</button>
          <button type="button" disabled={busy} onClick={handleDisconnect} style={{ ...chipBtn(T, false), color: '#e94560', borderColor: '#e9456044' }}>Déconnecter</button>
        </div>
      )}

      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14, cursor: 'pointer' }}>
        <input type="checkbox" checked={autoSync} onChange={(e) => setAutoSync(e.target.checked)} style={{ marginTop: 3 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>Sync cloud automatique</div>
          <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>Après chaque sauvegarde locale (délai 8 s).</div>
        </div>
      </label>

      <div style={{ borderTop: `1px solid ${T.border}44`, paddingTop: 12, marginTop: 4 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.ink, marginBottom: 8 }}>iCloud / transfert manuel</div>
        <p style={{ ...hint, marginBottom: 10 }}>
          Exportez ou importez un fichier Forma (JSON). Utile sans Google Drive ou en attendant iCloud natif.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => exportFormaBundle()} style={chipBtn(T, false)}>⬇ Exporter Forma</button>
          <button type="button" onClick={() => fileRef.current?.click()} style={chipBtn(T, false)}>⬆ Importer Forma</button>
          <input ref={fileRef} type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={handleImport} />
        </div>
      </div>

      <div style={{ fontSize: 10, color: T.muted, marginTop: 12, lineHeight: 1.45 }}>
        Structure cloud : /Forma → projects, notebooks, documents, tables, library, exports, settings + forma-index.json
      </div>
    </div>
  )
}

function StatRow({ label, value, T }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12, gap: 12 }}>
      <span style={{ color: T.muted }}>{label}</span>
      <span style={{ color: T.ink, fontWeight: 500, textAlign: 'right' }}>{value}</span>
    </div>
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
const chipBtn = (T, primary) => ({
  padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
  border: `1px solid ${primary ? T.accent : T.border}`,
  background: primary ? `${T.accent}22` : T.surface,
  color: primary ? T.accent : T.ink,
})
