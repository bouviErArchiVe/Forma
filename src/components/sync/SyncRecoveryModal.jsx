import { dismissRecovery, markRecoveryRestored } from '@/lib/sync/journal'
import useSyncStore from '@/stores/useSyncStore'

export default function SyncRecoveryModal({ onRestored }) {
  const recoveryItems = useSyncStore((s) => s.recoveryItems)
  const setRecoveryItems = useSyncStore((s) => s.setRecoveryItems)

  if (!recoveryItems?.length) return null

  const handleDismiss = (id) => {
    dismissRecovery(id)
    setRecoveryItems(recoveryItems.filter((r) => r.id !== id))
  }

  const handleRestore = (item) => {
    markRecoveryRestored(item.id)
    setRecoveryItems(recoveryItems.filter((r) => r.id !== item.id))
    onRestored?.(item)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', zIndex: 5000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        background: '#1a1e28', borderRadius: 14, border: '1px solid #2a3144',
        maxWidth: 480, width: '100%', padding: 24, color: '#e8ecf4',
      }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>Récupération après interruption</h2>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#8b95a8', lineHeight: 1.5 }}>
          Forma a détecté des sauvegardes locales non finalisées. Vos données sont sur cet appareil — rien n&apos;a été perdu.
        </p>
        {recoveryItems.map((item) => (
          <div key={item.id} style={{
            padding: 12, marginBottom: 8, borderRadius: 8, background: '#151820',
            border: '1px solid #2a3144', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{item.label || item.resourceId}</div>
              <div style={{ fontSize: 11, color: '#8b95a8' }}>
                {item.resourceType} · {new Date(item.createdAt).toLocaleString('fr-FR')}
              </div>
            </div>
            <button type="button" onClick={() => handleRestore(item)} style={btnPrimary}>Conserver</button>
            <button type="button" onClick={() => handleDismiss(item.id)} style={btnMuted}>Ignorer</button>
          </div>
        ))}
      </div>
    </div>
  )
}

const btnPrimary = {
  padding: '6px 12px', borderRadius: 6, border: 'none', background: '#6b9fd4',
  color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600,
}
const btnMuted = {
  padding: '6px 12px', borderRadius: 6, border: '1px solid #2a3144', background: 'transparent',
  color: '#8b95a8', cursor: 'pointer', fontSize: 12,
}
