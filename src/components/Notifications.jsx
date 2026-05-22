// src/components/Notifications.jsx
import useAppStore from '@/stores/useAppStore'

const TYPE_STYLES = {
  info:    { bg: '#1c1c24', color: '#fff' },
  success: { bg: '#1a4a2a', color: '#4ade80' },
  error:   { bg: '#4a1a1a', color: '#f87171' },
  warning: { bg: '#4a3a10', color: '#fbbf24' },
}

export default function Notifications() {
  const { notifications } = useAppStore()
  if (!notifications.length) return null
  return (
    <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
      {notifications.map(n => {
        const s = TYPE_STYLES[n.type] || TYPE_STYLES.info
        return (
          <div key={n.id} className="fade-up" style={{ padding: '10px 20px', borderRadius: 10, background: s.bg, color: s.color, fontSize: 13, fontFamily: 'Nunito, sans-serif', fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,.25)', whiteSpace: 'nowrap' }}>
            {n.msg}
          </div>
        )
      })}
    </div>
  )
}
