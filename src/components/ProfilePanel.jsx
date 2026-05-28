import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, FolderOpen, Handshake, Settings, Share2, User } from 'lucide-react'
import { glassStyle, rgbaFromHex } from '@/theme/glass'
import { TOKENS } from '@/theme/tokens'
import { ELEVATION, TYPE } from '@/lib/design'
import { computeProfileStats, streakLabel } from '@/lib/profileStats'
import GlassButton from '@/components/ui/GlassButton'

const QUICK_LINKS = [
  { id: 'profile', label: 'Mon profil', Icon: User, path: '/account/profile' },
  { id: 'friends', label: 'Amis', Icon: Handshake, path: '/account/friends' },
  { id: 'sharing', label: 'Partage', Icon: Share2, path: '/account/sharing' },
  { id: 'folders', label: 'Dossiers partagés', Icon: FolderOpen, path: '/account/folders' },
  { id: 'notifications', label: 'Notifications', Icon: Bell, path: '/account/notifications' },
  { id: 'settings', label: 'Paramètres', Icon: Settings, path: '/account/settings' },
]

function StatCard({ T, emoji, value, label }) {
  return (
    <div style={{
      padding: '12px 10px',
      borderRadius: TOKENS.radius.lg,
      background: rgbaFromHex(T.bg, 0.45),
      border: `1px solid ${rgbaFromHex(T.border, 0.35)}`,
      textAlign: 'center',
      boxShadow: ELEVATION.sm,
    }}>
      <div style={{ fontSize: 18, marginBottom: 4 }}>{emoji}</div>
      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, color: T.ink, lineHeight: 1 }}>{value}</div>
      <div style={{ ...TYPE.micro, color: T.muted, marginTop: 4 }}>{label}</div>
    </div>
  )
}

export default function ProfilePanel({
  T,
  open,
  onClose,
  displayName,
  email,
  avatarUrl,
  avatarLetter,
  notebooks = [],
  folders = [],
  friends = [],
  sharedCount = 0,
  unreadCount = 0,
  streak = 0,
  isLoggedIn = false,
  onLogout,
}) {
  const navigate = useNavigate()
  const panelRef = useRef(null)

  const stats = computeProfileStats(notebooks, {
    friendsCount: friends.length,
    streak,
    foldersCount: folders.length,
  })

  const go = (path) => {
    onClose?.()
    navigate(path)
  }

  return (
    <>
      <div
        className={`forma-profile-backdrop ${open ? 'forma-profile-backdrop--open' : ''}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside
        ref={panelRef}
        className={`forma-profile-panel ${open ? 'forma-profile-panel--open' : ''}`}
        style={{
          ...glassStyle(T, { variant: 'panel', blur: TOKENS.blur.lg, opacity: 0.96 }),
          borderLeft: `1px solid ${rgbaFromHex(T.border, 0.4)}`,
          boxShadow: ELEVATION.panel,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ ...TYPE.display, fontSize: 17 }}>Profil</div>
          <button
            type="button"
            onClick={onClose}
            className="forma-btn-glass"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 22, padding: '2px 8px' }}
          >
            ×
          </button>
        </div>

        <div style={{
          display: 'flex',
          gap: 14,
          alignItems: 'center',
          marginBottom: 18,
          padding: '14px 12px',
          borderRadius: TOKENS.radius.lg,
          background: `${T.accent}0c`,
          border: `1px solid ${rgbaFromHex(T.accent, 0.2)}`,
        }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: `linear-gradient(135deg,${T.accent},${T.a2})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 800,
              color: '#fff',
              flexShrink: 0,
            }}>
              {avatarLetter || '?'}
            </div>
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName || 'Étudiant FORMA'}
            </div>
            <div style={{ ...TYPE.caption, color: T.muted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {email || 'Mode local'}
            </div>
            <div style={{ ...TYPE.micro, color: T.accent, marginTop: 6, fontWeight: 700 }}>
              🔥 {streakLabel(streak)}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 18 }}>
          <StatCard T={T} emoji="📓" value={stats.notebookCount} label="Carnets" />
          <StatCard T={T} emoji="📄" value={stats.pageCount} label="Pages" />
          <StatCard T={T} emoji="⭐" value={stats.starredCount} label="Favoris" />
          <StatCard T={T} emoji="🤝" value={stats.friendsCount} label="Amis" />
        </div>

        {(stats.foldersCount > 0 || sharedCount > 0) && (
          <div style={{ ...TYPE.caption, color: T.muted, marginBottom: 14, lineHeight: 1.45 }}>
            {stats.foldersCount} dossier{stats.foldersCount > 1 ? 's' : ''} · {sharedCount} partage{sharedCount > 1 ? 's' : ''} actif{sharedCount > 1 ? 's' : ''}
          </div>
        )}

        {isLoggedIn && friends.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ ...TYPE.micro, color: T.muted, marginBottom: 8 }}>AMIS RÉCENTS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {friends.slice(0, 4).map((f) => (
                <button
                  key={f.friend_id}
                  type="button"
                  onClick={() => go('/account/friends')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: `1px solid ${rgbaFromHex(T.border, 0.35)}`,
                    background: rgbaFromHex(T.bg, 0.35),
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: `${T.accent}22`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 800,
                    color: T.accent,
                  }}>
                    {(f.profile?.display_name || f.profile?.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.profile?.display_name || f.profile?.email || 'Ami'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ ...TYPE.micro, color: T.muted, marginBottom: 8 }}>RACCOURCIS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
          {QUICK_LINKS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => go(item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: TOKENS.radius.md,
                border: 'none',
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
              <item.Icon size={18} strokeWidth={1.9} style={{ width: 22, flexShrink: 0 }} />
              {item.label}
              {item.id === 'notifications' && unreadCount > 0 && (
                <span style={{ marginLeft: 'auto', background: T.accent, color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 999 }}>
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {!isLoggedIn ? (
          <GlassButton T={T} accent onClick={() => go('/auth')} style={{ width: '100%', padding: '11px 0', fontSize: 12, fontWeight: 800 }}>
            Se connecter / Créer un compte
          </GlassButton>
        ) : (
          <button
            type="button"
            onClick={() => { onClose?.(); onLogout?.() }}
            style={{
              width: '100%',
              padding: '10px 0',
              borderRadius: TOKENS.radius.md,
              border: `1px solid ${rgbaFromHex(T.border, 0.45)}`,
              background: 'transparent',
              color: '#e94560',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            Déconnexion
          </button>
        )}
      </aside>
    </>
  )
}
