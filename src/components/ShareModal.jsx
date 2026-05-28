import { useState, useEffect } from 'react'
import ModalOverlay from '@/components/ui/ModalOverlay'
import BottomSheet from '@/components/ui/BottomSheet'
import GlassPanel from '@/components/ui/GlassPanel'
import { rgbaFromHex } from '@/theme/glass'
import { useTabletLayout } from '@/hooks/useTabletLayout'
import useAppStore from '@/stores/useAppStore'
import {
  shareResource,
  updateSharePermission,
  enableShareLink,
  revokeShare,
  buildShareUrl,
  getSharedByMe,
  PERMISSIONS,
} from '@/lib/collaboration'
import { mapActionError } from '@/lib/userMessages'

const PERM_LABELS = {
  read: 'Lecture seule',
  comment: 'Commentaire',
  edit: 'Édition',
  owner: 'Propriétaire',
}

export default function ShareModal({
  T,
  open,
  onClose,
  resourceType = 'notebook',
  resourceId,
  resourceTitle,
  ownerId,
  ownerName,
  friends = [],
}) {
  const addNotification = useAppStore((s) => s.addNotification)
  const isTablet = useTabletLayout()
  const [permission, setPermission] = useState('read')
  const [selectedFriend, setSelectedFriend] = useState('')
  const [existing, setExisting] = useState([])
  const [loading, setLoading] = useState(false)
  const [shareLink, setShareLink] = useState('')

  useEffect(() => {
    if (!open || !ownerId) return
    getSharedByMe(ownerId)
      .then((rows) => setExisting(rows.filter((r) => r.resource_id === resourceId && r.resource_type === resourceType)))
      .catch(() => setExisting([]))
  }, [open, ownerId, resourceId, resourceType])

  if (!open) return null

  const shareWithFriend = async () => {
    if (!selectedFriend) {
      addNotification('Sélectionnez un ami', 'warning')
      return
    }
    if (!ownerId) {
      addNotification('Connectez-vous pour partager en ligne', 'error')
      return
    }
    setLoading(true)
    try {
      await shareResource({
        ownerId,
        resourceType,
        resourceId,
        resourceTitle,
        sharedWithUserId: selectedFriend,
        permission,
        ownerName,
      })
      addNotification('Partage envoyé', 'success')
      const rows = await getSharedByMe(ownerId)
      setExisting(rows.filter((r) => r.resource_id === resourceId && r.resource_type === resourceType))
      setSelectedFriend('')
    } catch (e) {
      addNotification(mapActionError(e), 'error')
    } finally {
      setLoading(false)
    }
  }

  const createLink = async () => {
    if (!ownerId) {
      addNotification('Connectez-vous pour créer un lien', 'error')
      return
    }
    setLoading(true)
    try {
      let row = existing.find((r) => r.is_public_link)
      if (!row) {
        row = await shareResource({
          ownerId,
          resourceType,
          resourceId,
          resourceTitle,
          permission,
          withLink: true,
          ownerName,
        })
      } else {
        row = await enableShareLink(row.id)
      }
      const url = buildShareUrl(row)
      setShareLink(url)
      await navigator.clipboard.writeText(url)
      addNotification('Lien copié', 'success')
      const rows = await getSharedByMe(ownerId)
      setExisting(rows.filter((r) => r.resource_id === resourceId && r.resource_type === resourceType))
    } catch (e) {
      addNotification(mapActionError(e), 'error')
    } finally {
      setLoading(false)
    }
  }

  const changePerm = async (shareId, perm) => {
    try {
      await updateSharePermission(shareId, perm)
      addNotification('Permission mise à jour', 'success')
      const rows = await getSharedByMe(ownerId)
      setExisting(rows.filter((r) => r.resource_id === resourceId && r.resource_type === resourceType))
    } catch (e) {
      addNotification(mapActionError(e), 'error')
    }
  }

  const revoke = async (shareId) => {
    if (!confirm('Retirer cet accès ?')) return
    try {
      await revokeShare(shareId)
      addNotification('Accès retiré', 'success')
      setExisting((prev) => prev.filter((r) => r.id !== shareId))
    } catch (e) {
      addNotification(mapActionError(e), 'error')
    }
  }

  const fallbackUrl = `${window.location.origin}/editor/${resourceId}`

  const body = (
    <>
      <div style={{ padding: 12, borderRadius: 10, background: `${T.accent}10`, border: `1px solid ${T.accent}33`, marginBottom: 16, fontSize: 12, color: T.ink }}>
        <strong>{resourceTitle}</strong>
      </div>

      {!ownerId && (
        <div style={{ fontSize: 11, color: T.muted, marginBottom: 14, lineHeight: 1.5 }}>
          Mode local : seul le lien direct est disponible. Connectez-vous pour inviter des amis et gérer les permissions.
        </div>
      )}

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, marginBottom: 6 }}>PERMISSION</div>
        <select
          value={permission}
          onChange={(e) => setPermission(e.target.value)}
          style={{ width: '100%', padding: '9px 10px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.ink, fontSize: 12 }}
        >
          {PERMISSIONS.filter((p) => p !== 'owner').map((p) => (
            <option key={p} value={p}>{PERM_LABELS[p]}</option>
          ))}
        </select>
      </div>

      {ownerId && friends.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, marginBottom: 6 }}>PARTAGER AVEC UN AMI</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              value={selectedFriend}
              onChange={(e) => setSelectedFriend(e.target.value)}
              style={{ flex: 1, padding: '9px 10px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.ink, fontSize: 12 }}
            >
              <option value="">Choisir un ami…</option>
              {friends.map((f) => (
                <option key={f.friend_id} value={f.friend_id}>{f.profile?.display_name || f.profile?.email}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={shareWithFriend}
              disabled={loading}
              style={{ padding: '9px 14px', borderRadius: 8, background: T.accent, border: 'none', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
            >
              Envoyer
            </button>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, marginBottom: 6 }}>LIEN DE PARTAGE</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            readOnly
            value={shareLink || fallbackUrl}
            style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 10, background: T.bg, color: T.muted }}
          />
          <button
            type="button"
            onClick={ownerId ? createLink : () => { navigator.clipboard.writeText(fallbackUrl); addNotification('Lien copié', 'success') }}
            disabled={loading}
            style={{ padding: '8px 14px', borderRadius: 8, background: T.accent, border: 'none', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
          >
            Copier
          </button>
        </div>
      </div>

      {existing.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, marginBottom: 8 }}>ACCÈS ACTUELS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflowY: 'auto' }}>
            {existing.map((row) => (
              <div key={row.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: rgbaFromHex(T.bg, 0.45), border: `1px solid ${rgbaFromHex(T.border, 0.35)}` }}>
                <div style={{ flex: 1, minWidth: 0, fontSize: 11, color: T.ink }}>
                  {row.shared_with?.display_name || row.shared_with?.email || (row.is_public_link ? 'Lien public' : '—')}
                </div>
                <select
                  value={row.permission}
                  onChange={(e) => changePerm(row.id, e.target.value)}
                  style={{ fontSize: 10, padding: '4px 6px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, color: T.ink }}
                >
                  {PERMISSIONS.filter((p) => p !== 'owner').map((p) => (
                    <option key={p} value={p}>{PERM_LABELS[p]}</option>
                  ))}
                </select>
                <button type="button" onClick={() => revoke(row.id)} style={{ background: 'none', border: 'none', color: '#e94560', cursor: 'pointer', fontSize: 14 }}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isTablet && (
        <button type="button" onClick={onClose} style={{ width: '100%', padding: 11, borderRadius: 10, background: T.bg, border: `1px solid ${T.border}`, color: T.muted, fontSize: 13, cursor: 'pointer' }}>
          Fermer
        </button>
      )}
    </>
  )

  if (!open) return null

  if (isTablet) {
    return (
      <BottomSheet T={T} open={open} onClose={onClose} title="🤝 Partager">
        {body}
      </BottomSheet>
    )
  }

  return (
    <ModalOverlay onClose={onClose}>
      <GlassPanel T={T} variant="modal" style={{ padding: 24, width: 420, maxWidth: '94vw' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 16, color: T.ink }}>🤝 Partager</div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 20 }}>×</button>
        </div>
        {body}
      </GlassPanel>
    </ModalOverlay>
  )
}
