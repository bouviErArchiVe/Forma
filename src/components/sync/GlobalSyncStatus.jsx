import useSyncStore from '@/stores/useSyncStore'
import SyncStatusBadge from '@/components/sync/SyncStatusBadge'

/** Indicateur global de sauvegarde — visible sur toutes les pages */
export default function GlobalSyncStatus() {
  const saveIndicator = useSyncStore((s) => s.saveIndicator)
  const globalStatus = useSyncStore((s) => s.globalStatus)
  const lastLocalSaveAt = useSyncStore((s) => s.lastLocalSaveAt)
  const online = useSyncStore((s) => s.online)
  const offlineQueueCount = useSyncStore((s) => s.offlineQueueCount)
  const cloudQueueCount = useSyncStore((s) => s.cloudQueueCount)
  const syncError = useSyncStore((s) => s.syncError)

  if (!saveIndicator) return null

  const status = syncError ? 'error' : !online ? 'offline' : globalStatus

  return (
    <div
      title={syncError || undefined}
      style={{
        position: 'fixed',
        bottom: 12,
        left: 12,
        zIndex: 9400,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px',
        borderRadius: 20,
        background: 'rgba(20,22,30,.88)',
        border: '1px solid rgba(255,255,255,.12)',
        backdropFilter: 'blur(8px)',
        fontSize: 11,
        color: '#e8ecf4',
        pointerEvents: 'none',
        maxWidth: 'min(320px, calc(100vw - 24px))',
      }}
    >
      <SyncStatusBadge status={status} lastSavedAt={lastLocalSaveAt} />
      {(offlineQueueCount > 0 || cloudQueueCount > 0) && (
        <span style={{ color: '#8b95a8', fontSize: 10 }}>
          {offlineQueueCount > 0 && `⏳ ${offlineQueueCount} local`}
          {offlineQueueCount > 0 && cloudQueueCount > 0 && ' · '}
          {cloudQueueCount > 0 && `☁ ${cloudQueueCount}`}
        </span>
      )}
    </div>
  )
}
