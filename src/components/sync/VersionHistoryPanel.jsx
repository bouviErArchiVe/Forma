import { useState, useEffect, useCallback } from 'react'
import { listVersions, restoreVersion, saveVersionNow, deleteVersion, getAllVersionedResources } from '@/lib/sync/versions'
import { listCloudSnapshots, restoreCloudSnapshot } from '@/lib/sync/cloudSync'
import useSyncStore from '@/stores/useSyncStore'

/** Modal historique — ne rend rien si open=false (évite overlay bloquant). */
export default function VersionHistoryPanel({
  open = false,
  onClose,
  T,
  resourceType,
  resourceId,
  onRestore,
  userId,
  currentPayload,
}) {
  const [tab, setTab] = useState('local')
  const [versions, setVersions] = useState([])
  const [cloudVersions, setCloudVersions] = useState([])
  const [selected, setSelected] = useState(null)
  const cloudEnabled = useSyncStore((s) => s.cloudEnabled)

  const activeType = selected?.resourceType ?? resourceType
  const activeId = selected?.resourceId ?? resourceId
  const browseMode = !resourceType && !resourceId
  const resources = browseMode ? getAllVersionedResources() : []

  const refreshLocal = useCallback(() => {
    if (activeType && activeId) setVersions(listVersions(activeType, activeId))
    else setVersions([])
  }, [activeType, activeId])

  useEffect(() => {
    if (!open) return
    refreshLocal()
    if (browseMode) setSelected(null)
  }, [open, refreshLocal, browseMode])

  useEffect(() => {
    if (!open || !cloudEnabled || !userId || !activeType || !activeId) {
      setCloudVersions([])
      return
    }
    listCloudSnapshots(userId, activeType, activeId).then(setCloudVersions)
  }, [open, cloudEnabled, userId, activeType, activeId])

  if (!open) return null

  const ink = T?.ink || '#e8ecf4'
  const muted = T?.muted || '#8b95a8'
  const surface = T?.surface || '#1a1e28'
  const border = T?.border || '#2a3144'
  const accent = T?.accent || '#6b9fd4'

  const handleClose = () => {
    setSelected(null)
    onClose?.()
  }

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) handleClose()
  }

  const handleRestoreLocal = async (versionId) => {
    const data = await restoreVersion(versionId)
    onRestore?.(data.payload)
    handleClose()
  }

  const handleRestoreCloud = async (snapshotId) => {
    const snap = await restoreCloudSnapshot(snapshotId)
    onRestore?.(snap.payload)
    handleClose()
  }

  const handleCheckpoint = async () => {
    if (!currentPayload || !activeType || !activeId) return
    await saveVersionNow(activeType, activeId, currentPayload, 'Point de restauration manuel')
    refreshLocal()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Historique des versions"
      onClick={handleBackdrop}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.55)',
        zIndex: 4000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        paddingTop: 'max(24px, env(safe-area-inset-top))',
        paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: surface,
          borderRadius: 12,
          border: `1px solid ${border}`,
          width: 'min(520px, 92vw)',
          maxHeight: 'min(70vh, 85dvh)',
          display: 'flex',
          flexDirection: 'column',
          color: ink,
          boxShadow: '0 16px 48px rgba(0,0,0,.35)',
        }}
      >
        <div style={{
          padding: '16px 18px',
          borderBottom: `1px solid ${border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
        }}>
          <h3 style={{ margin: 0, flex: 1, fontSize: 16 }}>
            {browseMode && selected ? 'Versions — ressource' : 'Historique des versions'}
          </h3>
          {browseMode && selected && (
            <button type="button" onClick={() => setSelected(null)} style={btnSm(border, ink)}>← Retour</button>
          )}
          {!browseMode && currentPayload && (
            <button type="button" onClick={handleCheckpoint} style={btnSm(border, ink)}>+ Point de restauration</button>
          )}
          <button type="button" onClick={handleClose} aria-label="Fermer" style={btnSm(border, ink)}>✕</button>
        </div>

        {browseMode && !selected ? (
          <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
            {resources.length === 0 ? (
              <p style={{ color: muted, textAlign: 'center', fontSize: 13, marginTop: 24 }}>
                Aucune version locale enregistrée. Activez les snapshots dans Programmation.
              </p>
            ) : resources.map((r) => (
              <button
                key={`${r.resourceType}:${r.resourceId}`}
                type="button"
                onClick={() => setSelected(r)}
                style={{
                  display: 'flex',
                  width: '100%',
                  textAlign: 'left',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 14px',
                  marginBottom: 6,
                  borderRadius: 8,
                  background: T?.bg || '#151820',
                  border: `1px solid ${border}`,
                  color: ink,
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{r.resourceType}</div>
                  <div style={{ fontSize: 11, color: muted }}>{r.resourceId}</div>
                </div>
                <span style={{ fontSize: 12, color: accent, fontWeight: 700 }}>{r.count} version(s)</span>
              </button>
            ))}
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 4, padding: '8px 12px', borderBottom: `1px solid ${border}`, flexShrink: 0 }}>
              <TabBtn active={tab === 'local'} onClick={() => setTab('local')} accent={accent}>Local ({versions.length})</TabBtn>
              {cloudEnabled && activeType && activeId && (
                <TabBtn active={tab === 'cloud'} onClick={() => setTab('cloud')} accent={accent}>Cloud ({cloudVersions.length})</TabBtn>
              )}
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: 12, WebkitOverflowScrolling: 'touch' }}>
              {tab === 'local' && (
                versions.length === 0 ? (
                  <p style={{ color: muted, textAlign: 'center', fontSize: 13 }}>Aucune version locale.</p>
                ) : versions.map((v) => (
                  <div key={v.id} style={rowStyle(border)}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{v.label}</div>
                      <div style={{ fontSize: 11, color: muted }}>
                        {new Date(v.createdAt).toLocaleString('fr-FR')} · {(v.size / 1024).toFixed(1)} Ko
                      </div>
                    </div>
                    {onRestore && (
                      <button type="button" onClick={() => handleRestoreLocal(v.id)} style={btnPrimary(accent)}>Restaurer</button>
                    )}
                    {activeType && activeId && (
                      <button
                        type="button"
                        onClick={() => { deleteVersion(v.id, activeType, activeId); refreshLocal() }}
                        style={btnMuted(border, muted)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))
              )}
              {tab === 'cloud' && (
                cloudVersions.length === 0 ? (
                  <p style={{ color: muted, textAlign: 'center', fontSize: 13 }}>Aucune version cloud.</p>
                ) : cloudVersions.map((v) => (
                  <div key={v.id} style={rowStyle(border)}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{v.label || 'Snapshot cloud'}</div>
                      <div style={{ fontSize: 11, color: muted }}>{new Date(v.created_at).toLocaleString('fr-FR')}</div>
                    </div>
                    {onRestore && (
                      <button type="button" onClick={() => handleRestoreCloud(v.id)} style={btnPrimary(accent)}>Restaurer</button>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function TabBtn({ active, onClick, children, accent }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: '8px 14px',
      minHeight: 40,
      borderRadius: 6,
      border: 'none',
      cursor: 'pointer',
      touchAction: 'manipulation',
      background: active ? accent : 'transparent',
      color: active ? '#fff' : '#8b95a8',
      fontSize: 12,
      fontWeight: active ? 700 : 500,
    }}>
      {children}
    </button>
  )
}

const rowStyle = (border) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 12px',
  marginBottom: 6,
  borderRadius: 8,
  background: '#151820',
  border: `1px solid ${border}`,
})
const btnPrimary = (accent) => ({
  padding: '8px 12px',
  minHeight: 40,
  borderRadius: 6,
  border: 'none',
  background: accent,
  color: '#fff',
  cursor: 'pointer',
  fontSize: 11,
  fontWeight: 700,
  touchAction: 'manipulation',
})
const btnMuted = (border, muted) => ({
  padding: '8px 10px',
  minHeight: 40,
  borderRadius: 6,
  border: `1px solid ${border}`,
  background: 'transparent',
  color: muted,
  cursor: 'pointer',
  fontSize: 11,
  touchAction: 'manipulation',
})
const btnSm = (border, ink) => ({
  padding: '8px 12px',
  minHeight: 40,
  minWidth: 40,
  borderRadius: 6,
  border: `1px solid ${border}`,
  background: 'transparent',
  color: ink,
  cursor: 'pointer',
  fontSize: 13,
  touchAction: 'manipulation',
})
