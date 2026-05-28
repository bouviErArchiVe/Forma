import { SYNC_STATUS } from '@/lib/sync/constants'
import { formatTimeShort } from '@/lib/userMessages'

const STATUS_CONFIG = {
  [SYNC_STATUS.idle]: { color: '#888', label: 'Prêt' },
  [SYNC_STATUS.dirty]: { color: '#f5a623', label: 'Modifications…' },
  [SYNC_STATUS.saving]: { color: '#f5a623', label: 'Sauvegarde…' },
  [SYNC_STATUS.saved_local]: { color: '#4ade80', label: 'Sauvegardé' },
  [SYNC_STATUS.syncing_cloud]: { color: '#6b9fd4', label: 'Sync cloud…' },
  [SYNC_STATUS.synced]: { color: '#4ade80', label: 'Synchronisé' },
  [SYNC_STATUS.offline]: { color: '#8b95a8', label: 'Hors ligne' },
  [SYNC_STATUS.error]: { color: '#e94560', label: 'Erreur' },
  saved: { color: '#4ade80', label: 'Sauvegardé' },
}

export default function SyncStatusBadge({ status, lastSavedAt, compact = false }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.idle
  const time = formatTimeShort(lastSavedAt)

  if (compact) {
    return (
      <span title={`${cfg.label}${time ? ` · ${time}` : ''}`} style={{
        display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: cfg.color,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color }} />
      </span>
    )
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: cfg.color }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color }} />
      {cfg.label}{time ? ` · ${time}` : ''}
    </span>
  )
}

export { STATUS_CONFIG }
