import { useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { glassStyle, rgbaFromHex } from '@/theme/glass'
import { TOKENS } from '@/theme/tokens'

const ITEMS = [
  { id: 'profile', label: 'Mon profil', icon: '👤', path: '/account/profile' },
  { id: 'settings', label: 'Paramètres du compte', icon: '⚙', path: '/account/settings' },
  { id: 'friends', label: 'Amis', icon: '🤝', path: '/account/friends' },
  { id: 'sharing', label: 'Partage', icon: '🔗', path: '/account/sharing' },
  { id: 'folders', label: 'Dossiers partagés', icon: '📂', path: '/account/folders' },
  { id: 'notifications', label: 'Notifications', icon: '🔔', path: '/account/notifications' },
]

export default function AccountMenu({
  T,
  open,
  onClose,
  anchorRef,
  displayName,
  email,
  avatarUrl,
  avatarLetter,
  unreadCount = 0,
  onLogout,
}) {
  const navigate = useNavigate()
  const menuRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      if (menuRef.current?.contains(e.target)) return
      if (anchorRef?.current?.contains(e.target)) return
      onClose()
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open, onClose, anchorRef])

  if (!open) return null

  const rect = anchorRef?.current?.getBoundingClientRect()
  const top = rect ? rect.bottom + 8 : 68
  const right = rect ? Math.max(12, window.innerWidth - rect.right) : 16

  const go = (path) => {
    onClose()
    navigate(path)
  }

  return (
    <div
      ref={menuRef}
      className="forma-animate-in"
      style={{
        position: 'fixed',
        top,
        right,
        width: 280,
        zIndex: TOKENS.zIndex.modal + 2,
        borderRadius: TOKENS.radius.lg,
        overflow: 'hidden',
        boxShadow: TOKENS.shadow.panel,
        border: `1px solid ${rgbaFromHex(T.border, 0.45)}`,
        ...glassStyle(T, { variant: 'panel', blur: TOKENS.blur.lg, opacity: 0.96 }),
      }}
    >
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${rgbaFromHex(T.border, 0.35)}`, display: 'flex', gap: 12, alignItems: 'center' }}>
        {avatarUrl ? (
          <img src={avatarUrl} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: `linear-gradient(135deg,${T.accent},${T.a2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#fff' }}>
            {avatarLetter}
          </div>
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName || 'Mon compte'}</div>
          <div style={{ fontSize: 10, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
        </div>
        {unreadCount > 0 && (
          <span style={{ background: T.accent, color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 999 }}>{unreadCount}</span>
        )}
      </div>

      <div style={{ padding: '6px 8px' }}>
        {ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => go(item.path)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              border: 'none',
              borderRadius: TOKENS.radius.md,
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              color: T.ink,
              textAlign: 'left',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = `${T.accent}12` }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <span style={{ fontSize: 16, width: 22, textAlign: 'center' }}>{item.icon}</span>
            {item.label}
            {item.id === 'notifications' && unreadCount > 0 && (
              <span style={{ marginLeft: 'auto', background: `${T.accent}22`, color: T.accent, fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 999 }}>{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      <div style={{ padding: '8px 10px 12px', borderTop: `1px solid ${rgbaFromHex(T.border, 0.35)}` }}>
        <button
          type="button"
          onClick={() => { onClose(); onLogout?.() }}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: TOKENS.radius.md,
            border: `1px solid ${rgbaFromHex(T.border, 0.45)}`,
            background: '#e9456010',
            color: '#e94560',
            fontWeight: 700,
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Déconnexion
        </button>
      </div>
    </div>
  )
}
