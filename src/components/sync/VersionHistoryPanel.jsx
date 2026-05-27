import { useState, useEffect } from 'react'
import { listVersions, restoreVersion, saveVersionNow, deleteVersion } from '@/lib/sync/versions'
import { listCloudSnapshots, restoreCloudSnapshot } from '@/lib/sync/cloudSync'
import useSyncStore from '@/stores/useSyncStore'

export default function VersionHistoryPanel({
  resourceType, resourceId, onRestore, onClose, userId, currentPayload,
}) {
  const [tab, setTab] = useState('local')
  const [versions, setVersions] = useState([])
  const [cloudVersions, setCloudVersions] = useState([])
  const cloudEnabled = useSyncStore((s) => s.cloudEnabled)

  useEffect(() => {
    if (resourceType && resourceId) {
      setVersions(listVersions(resourceType, resourceId))
    }
  }, [resourceType, resourceId])

  useEffect(() => {
    if (cloudEnabled && userId && resourceType && resourceId) {
      listCloudSnapshots(userId, resourceType, resourceId).then(setCloudVersions)
    }
  }, [cloudEnabled, userId, resourceType, resourceId])

  const handleRestoreLocal = (versionId) => {
    const data = restoreVersion(versionId)
    onRestore?.(data.payload)
    onClose?.()
  }

  const handleRestoreCloud = async (snapshotId) => {
    const snap = await restoreCloudSnapshot(snapshotId)
    onRestore?.(snap.payload)
    onClose?.()
  }

  const handleCheckpoint = () => {
    if (!currentPayload) return
    saveVersionNow(resourceType, resourceId, currentPayload, 'Point de restauration manuel')
    setVersions(listVersions(resourceType, resourceId))
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 4000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        background: '#1a1e28', borderRadius: 12, border: '1px solid #2a3144',
        width: 'min(520px, 92vw)', maxHeight: '70vh', display: 'flex', flexDirection: 'column', color: '#e8ecf4',
      }}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid #2a3144', display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 style={{ margin: 0, flex: 1, fontSize: 16 }}>Historique des versions</h3>
          <button type="button" onClick={handleCheckpoint} style={btnSm}>+ Point de restauration</button>
          <button type="button" onClick={onClose} style={btnSm}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: 4, padding: '8px 12px', borderBottom: '1px solid #2a3144' }}>
          <TabBtn active={tab === 'local'} onClick={() => setTab('local')}>Local ({versions.length})</TabBtn>
          {cloudEnabled && (
            <TabBtn active={tab === 'cloud'} onClick={() => setTab('cloud')}>Cloud ({cloudVersions.length})</TabBtn>
          )}
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
          {tab === 'local' && (
            versions.length === 0 ? (
              <p style={{ color: '#8b95a8', textAlign: 'center', fontSize: 13 }}>Aucune version locale enregistrée.</p>
            ) : versions.map((v) => (
              <div key={v.id} style={rowStyle}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{v.label}</div>
                  <div style={{ fontSize: 11, color: '#8b95a8' }}>
                    {new Date(v.createdAt).toLocaleString('fr-FR')} · {(v.size / 1024).toFixed(1)} Ko
                  </div>
                </div>
                <button type="button" onClick={() => handleRestoreLocal(v.id)} style={btnPrimary}>Restaurer</button>
                <button type="button" onClick={() => { deleteVersion(v.id, resourceType, resourceId); setVersions(listVersions(resourceType, resourceId)) }} style={btnMuted}>×</button>
              </div>
            ))
          )}
          {tab === 'cloud' && (
            cloudVersions.length === 0 ? (
              <p style={{ color: '#8b95a8', textAlign: 'center', fontSize: 13 }}>Aucune version cloud.</p>
            ) : cloudVersions.map((v) => (
              <div key={v.id} style={rowStyle}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{v.label || 'Snapshot cloud'}</div>
                  <div style={{ fontSize: 11, color: '#8b95a8' }}>{new Date(v.created_at).toLocaleString('fr-FR')}</div>
                </div>
                <button type="button" onClick={() => handleRestoreCloud(v.id)} style={btnPrimary}>Restaurer</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function TabBtn({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
      background: active ? '#6b9fd4' : '#222833', color: active ? '#fff' : '#8b95a8', fontSize: 12,
    }}>
      {children}
    </button>
  )
}

const rowStyle = {
  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', marginBottom: 6,
  borderRadius: 8, background: '#151820', border: '1px solid #2a3144',
}
const btnPrimary = { padding: '5px 10px', borderRadius: 6, border: 'none', background: '#6b9fd4', color: '#fff', cursor: 'pointer', fontSize: 11 }
const btnMuted = { padding: '5px 8px', borderRadius: 6, border: '1px solid #2a3144', background: 'transparent', color: '#8b95a8', cursor: 'pointer', fontSize: 11 }
const btnSm = { padding: '5px 10px', borderRadius: 6, border: '1px solid #2a3144', background: '#222833', color: '#e8ecf4', cursor: 'pointer', fontSize: 11 }
