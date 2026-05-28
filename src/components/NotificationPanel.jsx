import { useState } from 'react'
import GlassPanel from '@/components/ui/GlassPanel'
import { rgbaFromHex } from '@/theme/glass'
import { TOKENS } from '@/theme/tokens'
import { markNotificationRead, markAllNotificationsRead } from '@/lib/collaboration'
import useAppStore from '@/stores/useAppStore'
import { mapActionError } from '@/lib/userMessages'

const TYPE_ICON = {
  friend_request: '🤝',
  friend_accepted: '✅',
  share: '🔗',
  comment: '💬',
  folder_invite: '📂',
}

export default function NotificationPanel({ T, open, onClose, notifications, unreadCount, onRefresh }) {
  const addNotification = useAppStore((s) => s.addNotification)
  const [busy, setBusy] = useState(null)

  if (!open) return null

  const markRead = async (n) => {
    if (n.read) return
    setBusy(n.id)
    try {
      await markNotificationRead(n.id)
      onRefresh?.()
    } catch (e) {
      addNotification(mapActionError(e), 'error')
    } finally {
      setBusy(null)
    }
  }

  const markAll = async () => {
    setBusy('all')
    try {
      const uid = notifications[0]?.user_id
      if (uid) await markAllNotificationsRead(uid)
      onRefresh?.()
      addNotification('Toutes les notifications lues', 'success')
    } catch (e) {
      addNotification(mapActionError(e), 'error')
    } finally {
      setBusy(null)
    }
  }

  return (
    <GlassPanel
      T={T}
      variant="float"
      animate
      style={{
        position: 'fixed',
        top: 68,
        right: 16,
        width: 340,
        maxHeight: 'min(70vh, 520px)',
        zIndex: TOKENS.zIndex.modal + 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: `1px solid ${rgbaFromHex(T.border, 0.35)}` }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 14, color: T.ink }}>Notifications</div>
          {unreadCount > 0 && <div style={{ fontSize: 10, color: T.muted }}>{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</div>}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {unreadCount > 0 && (
            <button type="button" onClick={markAll} disabled={busy === 'all'} style={{ fontSize: 10, color: T.accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
              Tout lire
            </button>
          )}
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 18 }}>×</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: T.muted, fontSize: 12 }}>Aucune notification</div>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => markRead(n)}
              disabled={busy === n.id}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '10px 12px',
                marginBottom: 6,
                borderRadius: TOKENS.radius.md,
                border: `1px solid ${n.read ? rgbaFromHex(T.border, 0.25) : `${T.accent}44`}`,
                background: n.read ? rgbaFromHex(T.bg, 0.3) : `${T.accent}08`,
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 16 }}>{TYPE_ICON[n.type] || '🔔'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.ink }}>{n.title}</div>
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 2, lineHeight: 1.4 }}>{n.body}</div>
                  <div style={{ fontSize: 9, color: T.muted, marginTop: 4 }}>{new Date(n.created_at).toLocaleString('fr-FR')}</div>
                </div>
                {!n.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: T.accent, flexShrink: 0, marginTop: 4 }} />}
              </div>
            </button>
          ))
        )}
      </div>
    </GlassPanel>
  )
}

export function NotificationBell({ T, unreadCount, onClick, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Notifications"
      className="forma-btn-glass"
      style={{
        position: 'relative',
        width: 34,
        height: 34,
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
        flexShrink: 0,
        border: `1px solid ${active ? T.accent : T.border}`,
        background: active ? `${T.accent}18` : 'transparent',
        borderRadius: TOKENS.radius.sm,
        cursor: 'pointer',
      }}
    >
      🔔
      {unreadCount > 0 && (
        <span style={{
          position: 'absolute',
          top: -4,
          right: -4,
          minWidth: 16,
          height: 16,
          padding: '0 4px',
          borderRadius: 999,
          background: T.accent,
          color: '#fff',
          fontSize: 9,
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  )
}
