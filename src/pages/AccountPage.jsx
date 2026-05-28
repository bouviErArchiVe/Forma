import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTheme } from '@/hooks/useAppearance'
import { useAuth } from '@/hooks/useAuth'
import { useCollaboration } from '@/hooks/useCollaboration'
import useAppStore from '@/stores/useAppStore'
import GlassPanel from '@/components/ui/GlassPanel'
import BrandLogo from '@/components/BrandLogo'
import { rgbaFromHex } from '@/theme/glass'
import { TOKENS } from '@/theme/tokens'
import SyncSettingsSection from '@/components/sync/SyncSettingsSection'
import VisualProfilesSection from '@/components/settings/VisualProfilesSection'
import { updateLocalProfile } from '@/lib/localUser'
import {
  updateProfile,
  uploadAvatar,
  updateUserEmail,
  updateUserPassword,
  searchProfiles,
  sendFriendRequest,
  respondFriendRequest,
  removeFriend,
  shareResource,
  revokeShare,
  updateSharePermission,
  createSharedFolder,
  renameSharedFolder,
  deleteSharedFolder,
  addFolderMember,
  removeFolderMember,
  getFolderItems,
  addToSharedFolder,
  removeFromSharedFolder,
  getComments,
  addComment,
  resolveComment,
  deleteComment,
  markNotificationRead,
  markAllNotificationsRead,
  PERMISSIONS,
  buildShareUrl,
} from '@/lib/collaboration'

const NAV = [
  { id: 'profile', label: 'Mon profil', icon: '👤' },
  { id: 'settings', label: 'Paramètres', icon: '⚙' },
  { id: 'friends', label: 'Amis', icon: '🤝' },
  { id: 'sync', label: 'Sauvegarde', icon: '💾' },
  { id: 'sharing', label: 'Partage', icon: '🔗' },
  { id: 'folders', label: 'Dossiers partagés', icon: '📂' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
]

const PERM_LABELS = { read: 'Lecture', comment: 'Commentaire', edit: 'Édition', owner: 'Propriétaire' }

function Field({ label, children, T }) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, marginBottom: 5, letterSpacing: 0.6 }}>{label}</div>
      {children}
    </label>
  )
}

function inputStyle(T) {
  return {
    width: '100%',
    padding: '10px 12px',
    borderRadius: TOKENS.radius.sm,
    border: `1px solid ${rgbaFromHex(T.border, 0.45)}`,
    background: rgbaFromHex(T.bg, 0.4),
    color: T.ink,
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
  }
}

function LocalProfileSection({ T, localProfile, setLocalProfile, addNotification }) {
  const [pseudo, setPseudo] = useState(localProfile?.pseudo || '')
  const [phone, setPhone] = useState(localProfile?.phone || '')
  const fileRef = useRef()

  useEffect(() => {
    setPseudo(localProfile?.pseudo || '')
    setPhone(localProfile?.phone || '')
  }, [localProfile])

  const save = () => {
    if (!pseudo.trim()) {
      addNotification('Le pseudo ne peut pas être vide', 'error')
      return
    }
    try {
      const updated = updateLocalProfile({ pseudo: pseudo.trim(), phone: phone.trim() })
      setLocalProfile(updated)
      addNotification('Profil local mis à jour', 'success')
    } catch (e) {
      addNotification(e.message, 'error')
    }
  }

  const onAvatar = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const updated = updateLocalProfile({ avatarUrl: reader.result })
        setLocalProfile(updated)
        addNotification('Avatar mis à jour', 'success')
      } catch (err) {
        addNotification(err.message, 'error')
      }
    }
    reader.readAsDataURL(file)
  }

  const letter = (pseudo || '?').charAt(0).toUpperCase()

  return (
    <div>
      <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, color: T.ink, marginBottom: 12 }}>Profil local</h2>
      <p style={{ fontSize: 13, color: T.muted, marginBottom: 20, lineHeight: 1.5 }}>
        Mode local — vos carnets sont sauvegardés sur cet appareil. Connectez un compte cloud pour la sync multi-appareils.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        {localProfile?.avatarUrl ? (
          <img src={localProfile.avatarUrl} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: `linear-gradient(135deg,${T.accent},${T.a2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: '#fff' }}>{letter}</div>
        )}
        <div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onAvatar} />
          <button type="button" onClick={() => fileRef.current?.click()} style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.ink, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Photo (optionnelle)
          </button>
        </div>
      </div>
      <Field label="PSEUDO" T={T}>
        <input value={pseudo} onChange={(e) => setPseudo(e.target.value)} style={inputStyle(T)} />
      </Field>
      <Field label="TÉLÉPHONE (optionnel)" T={T}>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+33 6 12 34 56 78" style={inputStyle(T)} />
      </Field>
      <Field label="ESPACE DE TRAVAIL" T={T}>
        <input value={localProfile?.workspaceId || ''} readOnly style={{ ...inputStyle(T), opacity: 0.7 }} />
      </Field>
      <button type="button" onClick={save} style={{ padding: '11px 22px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${T.accent},${T.a2})`, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
        Enregistrer
      </button>
    </div>
  )
}

function ProfileSection({ T, profile, user, refresh }) {
  const addNotification = useAppStore((s) => s.addNotification)
  const [name, setName] = useState(profile?.display_name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [saving, setSaving] = useState(false)
  const fileRef = useRef()

  useEffect(() => {
    setName(profile?.display_name || '')
    setPhone(profile?.phone || '')
  }, [profile])

  const save = async () => {
    if (!name.trim()) {
      addNotification('Le nom ne peut pas être vide', 'error')
      return
    }
    setSaving(true)
    try {
      await updateProfile(user.id, { display_name: name.trim(), phone: phone.trim() || null })
      addNotification('Profil mis à jour', 'success')
      refresh()
    } catch (e) {
      addNotification(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const onAvatar = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSaving(true)
    try {
      await uploadAvatar(user.id, file)
      addNotification('Photo mise à jour', 'success')
      refresh()
    } catch (err) {
      addNotification(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const letter = (name || user.email || '?').charAt(0).toUpperCase()

  return (
    <div>
      <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, color: T.ink, marginBottom: 20 }}>Mon profil</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: `linear-gradient(135deg,${T.accent},${T.a2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: '#fff' }}>{letter}</div>
        )}
        <div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onAvatar} />
          <button type="button" onClick={() => fileRef.current?.click()} style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.ink, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Changer la photo
          </button>
        </div>
      </div>
      <Field label="NOM AFFICHÉ" T={T}>
        <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle(T)} />
      </Field>
      <Field label="E-MAIL" T={T}>
        <input value={user.email || ''} readOnly style={{ ...inputStyle(T), opacity: 0.7 }} />
      </Field>
      <Field label="TÉLÉPHONE" T={T}>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+33 6 12 34 56 78" style={inputStyle(T)} />
      </Field>
      <button type="button" onClick={save} disabled={saving} style={{ padding: '11px 22px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${T.accent},${T.a2})`, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
        {saving ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </div>
  )
}

function SettingsSection({ T, profile, user, refresh, isLocalUser }) {
  const { appearanceMode, setAppearanceMode } = useAppStore()
  const addNotification = useAppStore((s) => s.addNotification)
  const [email, setEmail] = useState(user.email || '')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [pwd, setPwd] = useState('')
  const [pwd2, setPwd2] = useState('')
  const [lang, setLang] = useState(profile?.language || 'fr')
  const [notifEmail, setNotifEmail] = useState(profile?.notification_prefs?.email !== false)
  const [notifApp, setNotifApp] = useState(profile?.notification_prefs?.in_app !== false)

  const savePrefs = async () => {
    if (isLocalUser) {
      addNotification('Préférences enregistrées localement', 'success')
      return
    }
    try {
      await updateProfile(user.id, {
        language: lang,
        notification_prefs: { email: notifEmail, in_app: notifApp },
      })
      addNotification('Préférences enregistrées', 'success')
      refresh()
    } catch (e) {
      addNotification(e.message, 'error')
    }
  }

  const changeEmail = async () => {
    if (!email.trim()) {
      addNotification('E-mail requis', 'error')
      return
    }
    if (email !== confirmEmail) {
      addNotification('Confirmez la même adresse e-mail', 'error')
      return
    }
    if (!confirm('Un e-mail de confirmation sera envoyé. Continuer ?')) return
    try {
      await updateUserEmail(email.trim())
      addNotification('E-mail de confirmation envoyé', 'success')
    } catch (e) {
      addNotification(e.message, 'error')
    }
  }

  const changePwd = async () => {
    if (!pwd) {
      addNotification('Mot de passe requis', 'error')
      return
    }
    if (!confirm('Changer votre mot de passe ?')) return
    try {
      await updateUserPassword(pwd, pwd2)
      addNotification('Mot de passe mis à jour', 'success')
      setPwd('')
      setPwd2('')
    } catch (e) {
      addNotification(e.message, 'error')
    }
  }

  return (
    <div>
      <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, color: T.ink, marginBottom: 20 }}>Paramètres du compte</h2>

      <VisualProfilesSection T={T} />

      <GlassPanel T={T} style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: T.ink, marginBottom: 12 }}>Apparence</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {['light', 'soft-gray', 'dark', 'black'].map((m) => (
            <button key={m} type="button" onClick={() => setAppearanceMode(m)}
              style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${appearanceMode === m ? T.accent : T.border}`, background: appearanceMode === m ? `${T.accent}18` : T.bg, color: appearanceMode === m ? T.accent : T.ink, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              {m}
            </button>
          ))}
        </div>
        <Field label="LANGUE" T={T}>
          <select value={lang} onChange={(e) => setLang(e.target.value)} style={inputStyle(T)}>
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </Field>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.ink, marginBottom: 8 }}>
          <input type="checkbox" checked={notifEmail} onChange={(e) => setNotifEmail(e.target.checked)} /> Notifications e-mail
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.ink, marginBottom: 12 }}>
          <input type="checkbox" checked={notifApp} onChange={(e) => setNotifApp(e.target.checked)} /> Notifications in-app
        </label>
        <button type="button" onClick={savePrefs} style={{ padding: '9px 16px', borderRadius: 8, background: T.accent, border: 'none', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Enregistrer préférences</button>
      </GlassPanel>

      {!isLocalUser && (
      <>
      <GlassPanel T={T} style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: T.ink, marginBottom: 12 }}>Changer l'e-mail</div>
        <Field label="NOUVEL E-MAIL" T={T}><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle(T)} /></Field>
        <Field label="CONFIRMER E-MAIL" T={T}><input type="email" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} style={inputStyle(T)} /></Field>
        <button type="button" onClick={changeEmail} style={{ padding: '9px 16px', borderRadius: 8, background: T.bg, border: `1px solid ${T.border}`, color: T.ink, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Mettre à jour l'e-mail</button>
      </GlassPanel>

      <GlassPanel T={T} style={{ padding: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: T.ink, marginBottom: 12 }}>Changer le mot de passe</div>
        <Field label="NOUVEAU MOT DE PASSE" T={T}><input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} style={inputStyle(T)} /></Field>
        <Field label="CONFIRMER" T={T}><input type="password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} style={inputStyle(T)} /></Field>
        <button type="button" onClick={changePwd} style={{ padding: '9px 16px', borderRadius: 8, background: T.bg, border: `1px solid ${T.border}`, color: T.ink, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Mettre à jour le mot de passe</button>
      </GlassPanel>
      </>
      )}
    </div>
  )
}

function FriendsSection({ T, userId, profile, friends, friendRequests, refresh }) {
  const addNotification = useAppStore((s) => s.addNotification)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)

  const search = async () => {
    if (query.trim().length < 2) return
    setSearching(true)
    try {
      const rows = await searchProfiles(query, userId)
      setResults(rows)
    } catch (e) {
      addNotification(e.message, 'error')
    } finally {
      setSearching(false)
    }
  }

  const invite = async (toId) => {
    try {
      await sendFriendRequest(userId, toId, profile?.display_name)
      addNotification('Demande envoyée', 'success')
      refresh()
    } catch (e) {
      addNotification(e.message, 'error')
    }
  }

  const respond = async (req, accept) => {
    try {
      await respondFriendRequest(req, accept, userId, profile?.display_name)
      addNotification(accept ? 'Ami ajouté' : 'Demande refusée', 'success')
      refresh()
    } catch (e) {
      addNotification(e.message, 'error')
    }
  }

  const unfriend = async (friendId) => {
    if (!confirm('Retirer cet ami ?')) return
    try {
      await removeFriend(userId, friendId)
      addNotification('Ami retiré', 'success')
      refresh()
    } catch (e) {
      addNotification(e.message, 'error')
    }
  }

  const pendingIn = friendRequests.filter((r) => r.status === 'pending' && r.to_user_id === userId)
  const pendingOut = friendRequests.filter((r) => r.status === 'pending' && r.from_user_id === userId)

  return (
    <div>
      <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, color: T.ink, marginBottom: 20 }}>Amis</h2>

      <GlassPanel T={T} style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, marginBottom: 8 }}>RECHERCHER PAR E-MAIL OU NOM</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search()} placeholder="email@exemple.com" style={{ ...inputStyle(T), flex: 1 }} />
          <button type="button" onClick={search} disabled={searching} style={{ padding: '10px 16px', borderRadius: 8, background: T.accent, border: 'none', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Chercher</button>
        </div>
        {results.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {results.map((p) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: rgbaFromHex(T.bg, 0.4), border: `1px solid ${rgbaFromHex(T.border, 0.35)}` }}>
                <div style={{ flex: 1, fontSize: 12, color: T.ink }}>{p.display_name || p.email}</div>
                <button type="button" onClick={() => invite(p.id)} style={{ padding: '6px 10px', borderRadius: 6, background: `${T.accent}18`, border: 'none', color: T.accent, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Inviter</button>
              </div>
            ))}
          </div>
        )}
      </GlassPanel>

      {pendingIn.length > 0 && (
        <SectionList T={T} title="Demandes reçues">
          {pendingIn.map((r) => (
            <Row key={r.id} T={T} title={r.from_profile?.display_name || r.from_profile?.email} sub="En attente">
              <button type="button" onClick={() => respond(r, true)} style={okBtn(T)}>Accepter</button>
              <button type="button" onClick={() => respond(r, false)} style={noBtn()}>Refuser</button>
            </Row>
          ))}
        </SectionList>
      )}

      {pendingOut.length > 0 && (
        <SectionList T={T} title="Invitations envoyées">
          {pendingOut.map((r) => (
            <Row key={r.id} T={T} title={r.to_profile?.display_name || r.to_profile?.email} sub="En attente" />
          ))}
        </SectionList>
      )}

      <SectionList T={T} title={`Mes amis (${friends.length})`}>
        {friends.length === 0 ? <div style={{ fontSize: 12, color: T.muted, padding: 8 }}>Aucun ami pour l'instant</div> : friends.map((f) => (
          <Row key={f.id} T={T} title={f.profile?.display_name || f.profile?.email} sub={f.profile?.email}>
            <button type="button" onClick={() => unfriend(f.friend_id)} style={noBtn()}>Retirer</button>
          </Row>
        ))}
      </SectionList>
    </div>
  )
}

function SharingSection({ T, userId, profile, sharedWithMe, sharedByMe, refresh }) {
  const addNotification = useAppStore((s) => s.addNotification)
  const [commentShareId, setCommentShareId] = useState(null)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')

  const loadComments = async (id) => {
    setCommentShareId(id)
    try {
      const rows = await getComments(id)
      setComments(rows)
    } catch (e) {
      addNotification(e.message, 'error')
    }
  }

  const postComment = async () => {
    if (!commentShareId || !commentText.trim()) return
    try {
      await addComment({ sharedProjectId: commentShareId, userId, content: commentText })
      setCommentText('')
      loadComments(commentShareId)
      addNotification('Commentaire ajouté', 'success')
      refresh()
    } catch (e) {
      addNotification(e.message, 'error')
    }
  }

  const revoke = async (id) => {
    if (!confirm('Retirer ce partage ?')) return
    try {
      await revokeShare(id)
      addNotification('Partage retiré', 'success')
      refresh()
    } catch (e) {
      addNotification(e.message, 'error')
    }
  }

  return (
    <div>
      <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, color: T.ink, marginBottom: 20 }}>Partage</h2>

      <SectionList T={T} title="Partagés avec moi">
        {sharedWithMe.length === 0 ? <div style={{ fontSize: 12, color: T.muted, padding: 8 }}>Rien pour l'instant</div> : sharedWithMe.map((s) => (
          <Row key={s.id} T={T} title={s.resource_title} sub={`${PERM_LABELS[s.permission]} · par ${s.owner?.display_name || '—'}`}>
            <button type="button" onClick={() => loadComments(s.id)} style={okBtn(T)}>Commentaires</button>
          </Row>
        ))}
      </SectionList>

      <SectionList T={T} title="Mes partages">
        {sharedByMe.length === 0 ? <div style={{ fontSize: 12, color: T.muted, padding: 8 }}>Aucun partage actif</div> : sharedByMe.map((s) => (
          <Row key={s.id} T={T} title={s.resource_title} sub={`${PERM_LABELS[s.permission]} · ${s.shared_with?.display_name || (s.is_public_link ? 'Lien' : '—')}`}>
            <button type="button" onClick={() => { navigator.clipboard.writeText(buildShareUrl(s)); addNotification('Lien copié', 'success') }} style={okBtn(T)}>Lien</button>
            <button type="button" onClick={() => loadComments(s.id)} style={okBtn(T)}>💬</button>
            <button type="button" onClick={() => revoke(s.id)} style={noBtn()}>×</button>
          </Row>
        ))}
      </SectionList>

      {commentShareId && (
        <GlassPanel T={T} style={{ padding: 16, marginTop: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: T.ink, marginBottom: 10 }}>Commentaires</div>
          <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 10 }}>
            {comments.map((c) => (
              <div key={c.id} style={{ padding: '8px 0', borderBottom: `1px solid ${rgbaFromHex(T.border, 0.25)}`, fontSize: 12 }}>
                <strong>{c.author?.display_name || 'Utilisateur'}</strong>
                {c.resolved && <span style={{ color: '#4ade80', fontSize: 10, marginLeft: 6 }}>✓ résolu</span>}
                <div style={{ color: T.muted, marginTop: 4 }}>{c.content}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  {!c.resolved && <button type="button" onClick={() => resolveComment(c.id, true).then(() => loadComments(commentShareId))} style={{ fontSize: 10, background: 'none', border: 'none', color: T.accent, cursor: 'pointer' }}>Résoudre</button>}
                  {c.user_id === userId && <button type="button" onClick={() => deleteComment(c.id).then(() => loadComments(commentShareId))} style={{ fontSize: 10, background: 'none', border: 'none', color: '#e94560', cursor: 'pointer' }}>Supprimer</button>}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Ajouter un commentaire…" style={{ ...inputStyle(T), flex: 1 }} />
            <button type="button" onClick={postComment} style={{ padding: '10px 14px', borderRadius: 8, background: T.accent, border: 'none', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Envoyer</button>
          </div>
        </GlassPanel>
      )}
    </div>
  )
}

function SharedFoldersSection({ T, userId, profile, sharedFolders, friends, refresh }) {
  const addNotification = useAppStore((s) => s.addNotification)
  const [name, setName] = useState('')
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [items, setItems] = useState([])
  const [memberFriend, setMemberFriend] = useState('')
  const [memberPerm, setMemberPerm] = useState('read')
  const [resId, setResId] = useState('')
  const [resType, setResType] = useState('notebook')

  const create = async () => {
    if (!name.trim()) {
      addNotification('Nom requis', 'error')
      return
    }
    try {
      await createSharedFolder(userId, name.trim())
      setName('')
      addNotification('Dossier créé', 'success')
      refresh()
    } catch (e) {
      addNotification(e.message, 'error')
    }
  }

  const openFolder = async (folder) => {
    setSelectedFolder(folder)
    try {
      const rows = await getFolderItems(folder.id)
      setItems(rows)
    } catch (e) {
      addNotification(e.message, 'error')
    }
  }

  const addMember = async () => {
    if (!selectedFolder || !memberFriend) return
    try {
      await addFolderMember(selectedFolder.id, memberFriend, memberPerm, profile?.display_name)
      addNotification('Membre ajouté', 'success')
      refresh()
    } catch (e) {
      addNotification(e.message, 'error')
    }
  }

  const addItem = async () => {
    if (!selectedFolder || !resId.trim()) return
    try {
      await addToSharedFolder(selectedFolder.id, resType, resId.trim(), userId)
      const rows = await getFolderItems(selectedFolder.id)
      setItems(rows)
      addNotification('Élément ajouté', 'success')
    } catch (e) {
      addNotification(e.message, 'error')
    }
  }

  const allFolders = [...(sharedFolders.owned || []), ...(sharedFolders.member || [])]

  return (
    <div>
      <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, color: T.ink, marginBottom: 20 }}>Dossiers partagés</h2>

      <GlassPanel T={T} style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom du dossier partagé" style={{ ...inputStyle(T), flex: 1 }} />
          <button type="button" onClick={create} style={{ padding: '10px 16px', borderRadius: 8, background: T.accent, border: 'none', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Créer</button>
        </div>
      </GlassPanel>

      <SectionList T={T} title="Mes dossiers">
        {allFolders.length === 0 ? <div style={{ fontSize: 12, color: T.muted, padding: 8 }}>Aucun dossier partagé</div> : allFolders.map((f) => (
          <Row key={f.id} T={T} title={f.name} sub={f.owner_id === userId ? 'Propriétaire' : `Membre · ${f.my_permission || 'read'}`}>
            <button type="button" onClick={() => openFolder(f)} style={okBtn(T)}>Ouvrir</button>
            {f.owner_id === userId && (
              <>
                <button type="button" onClick={async () => { const n = prompt('Nouveau nom', f.name); if (n) { await renameSharedFolder(f.id, n); refresh() } }} style={okBtn(T)}>Renommer</button>
                <button type="button" onClick={async () => { if (confirm('Supprimer ?')) { await deleteSharedFolder(f.id); refresh() } }} style={noBtn()}>Suppr.</button>
              </>
            )}
          </Row>
        ))}
      </SectionList>

      {selectedFolder && (
        <GlassPanel T={T} style={{ padding: 16, marginTop: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.ink, marginBottom: 12 }}>{selectedFolder.name}</div>

          {selectedFolder.owner_id === userId && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, marginBottom: 6 }}>AJOUTER UN AMI</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <select value={memberFriend} onChange={(e) => setMemberFriend(e.target.value)} style={{ ...inputStyle(T), flex: 1 }}>
                  <option value="">Ami…</option>
                  {friends.map((fr) => <option key={fr.friend_id} value={fr.friend_id}>{fr.profile?.display_name || fr.profile?.email}</option>)}
                </select>
                <select value={memberPerm} onChange={(e) => setMemberPerm(e.target.value)} style={{ ...inputStyle(T), width: 120 }}>
                  {PERMISSIONS.filter((p) => p !== 'owner').map((p) => <option key={p} value={p}>{PERM_LABELS[p]}</option>)}
                </select>
                <button type="button" onClick={addMember} style={okBtn(T)}>Ajouter</button>
              </div>

              {(selectedFolder.members || []).length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  {selectedFolder.members.map((m) => (
                    <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '4px 0', color: T.ink }}>
                      <span>{m.profile?.display_name || m.user_id}</span>
                      <button type="button" onClick={() => removeFolderMember(m.id).then(refresh)} style={noBtn()}>Retirer</button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, marginBottom: 6 }}>AJOUTER CARNET / MOODBOARD</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <select value={resType} onChange={(e) => setResType(e.target.value)} style={{ ...inputStyle(T), width: 130 }}>
              <option value="notebook">Carnet</option>
              <option value="moodboard">FMoodboard</option>
            </select>
            <input value={resId} onChange={(e) => setResId(e.target.value)} placeholder="ID ressource" style={{ ...inputStyle(T), flex: 1 }} />
            <button type="button" onClick={addItem} style={okBtn(T)}>+</button>
          </div>

          <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, marginBottom: 6 }}>CONTENU</div>
          {items.length === 0 ? <div style={{ fontSize: 11, color: T.muted }}>Vide</div> : items.map((it) => (
            <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '6px 0', borderBottom: `1px solid ${rgbaFromHex(T.border, 0.2)}`, color: T.ink }}>
              <span>{it.resource_type} · {it.resource_id}</span>
              <button type="button" onClick={() => removeFromSharedFolder(it.id).then(() => openFolder(selectedFolder))} style={noBtn()}>Retirer</button>
            </div>
          ))}
        </GlassPanel>
      )}
    </div>
  )
}

function NotificationsSection({ T, notifications, refresh }) {
  const addNotification = useAppStore((s) => s.addNotification)

  const markAll = async () => {
    const uid = notifications[0]?.user_id
    if (!uid) return
    try {
      await markAllNotificationsRead(uid)
      addNotification('Toutes lues', 'success')
      refresh()
    } catch (e) {
      addNotification(e.message, 'error')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, color: T.ink, margin: 0 }}>Notifications</h2>
        <button type="button" onClick={markAll} style={{ fontSize: 11, color: T.accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Tout marquer lu</button>
      </div>
      {notifications.length === 0 ? (
        <div style={{ fontSize: 13, color: T.muted }}>Aucune notification</div>
      ) : notifications.map((n) => (
        <div key={n.id} onClick={() => !n.read && markNotificationRead(n.id).then(refresh)} style={{ padding: '12px 14px', marginBottom: 8, borderRadius: 10, border: `1px solid ${n.read ? rgbaFromHex(T.border, 0.3) : `${T.accent}44`}`, background: n.read ? rgbaFromHex(T.bg, 0.3) : `${T.accent}08`, cursor: 'pointer' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: T.ink }}>{n.title}</div>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>{n.body}</div>
          <div style={{ fontSize: 10, color: T.muted, marginTop: 6 }}>{new Date(n.created_at).toLocaleString('fr-FR')}</div>
        </div>
      ))}
    </div>
  )
}

function SectionList({ title, children, T }) {
  return (
    <GlassPanel T={T} style={{ padding: 16, marginBottom: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: T.ink, marginBottom: 10 }}>{title}</div>
      {children}
    </GlassPanel>
  )
}

function Row({ title, sub, children, T }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: `1px solid ${rgbaFromHex(T.border, 0.2)}` }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.ink }}>{title}</div>
        {sub && <div style={{ fontSize: 10, color: T.muted }}>{sub}</div>}
      </div>
      {children}
    </div>
  )
}

function okBtn(T) {
  return { padding: '6px 10px', borderRadius: 6, background: `${T.accent}18`, border: 'none', color: T.accent, fontSize: 10, fontWeight: 700, cursor: 'pointer' }
}

function noBtn() {
  return { padding: '6px 10px', borderRadius: 6, background: '#e9456010', border: 'none', color: '#e94560', fontSize: 10, fontWeight: 700, cursor: 'pointer' }
}

export default function AccountPage() {
  const navigate = useNavigate()
  const { tab = 'profile' } = useParams()
  const { T } = useTheme()
  const {
    user, signOut, signOutLocal, isAuthenticated, isLocalUser, isCloudUser,
    loading: authLoading, localProfile, setLocalProfile,
  } = useAuth()
  const collab = useCollaboration()
  const addNotification = useAppStore((s) => s.addNotification)

  const localNav = NAV.filter((n) => ['profile', 'settings', 'sync'].includes(n.id))
  const navItems = isCloudUser ? NAV : localNav

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/auth')
  }, [authLoading, isAuthenticated, navigate])

  useEffect(() => {
    if (tab === 'profile' || NAV.some((n) => n.id === tab)) return
    navigate('/account/profile', { replace: true })
  }, [tab, navigate])

  if (authLoading || (!user && !localProfile)) {
    return <div className="forma-app-loading">Chargement…</div>
  }

  const sectionProps = {
    T,
    user,
    userId: user?.id,
    profile: collab.profile,
    refresh: collab.refresh,
    isLocalUser,
    localProfile,
    setLocalProfile,
    addNotification,
    ...collab,
  }

  let content = null
  switch (tab) {
    case 'settings': content = <SettingsSection {...sectionProps} />; break
    case 'friends': content = isCloudUser ? <FriendsSection {...sectionProps} /> : null; break
    case 'sync': content = <SyncSettingsSection T={T} />; break
    case 'sharing': content = isCloudUser ? <SharingSection {...sectionProps} /> : null; break
    case 'folders': content = isCloudUser ? <SharedFoldersSection {...sectionProps} /> : null; break
    case 'notifications': content = isCloudUser ? <NotificationsSection {...sectionProps} /> : null; break
    default:
      content = isLocalUser
        ? <LocalProfileSection T={T} localProfile={localProfile} setLocalProfile={setLocalProfile} addNotification={addNotification} />
        : <ProfileSection {...sectionProps} />
  }

  if (!content && tab !== 'profile' && tab !== 'settings' && tab !== 'sync') {
    content = <div style={{ color: T.muted, fontSize: 13 }}>Connectez un compte cloud pour accéder à cette section.</div>
  }

  return (
    <div className="forma-page-shell" style={{ display: 'flex', minHeight: '100dvh' }}>
      <aside style={{ width: 240, borderRight: `1px solid ${T.border}`, background: T.surface, padding: '20px 12px', flexShrink: 0 }}>
        <button type="button" onClick={() => navigate('/')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginBottom: 16 }}>
          <BrandLogo T={T} size="sm" showText={false} />
        </button>
        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, color: T.ink, marginBottom: 20, padding: '0 8px' }}>Mon compte</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(`/account/${item.id}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: TOKENS.radius.md,
                border: 'none',
                background: tab === item.id ? `${T.accent}18` : 'transparent',
                color: tab === item.id ? T.accent : T.ink,
                fontWeight: tab === item.id ? 700 : 500,
                fontSize: 12,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span>{item.icon}</span>
              {item.label}
              {item.id === 'notifications' && collab.unreadCount > 0 && (
                <span style={{ marginLeft: 'auto', background: T.accent, color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 999 }}>{collab.unreadCount}</span>
              )}
            </button>
          ))}
        </nav>
        <button type="button" onClick={() => {
          if (isLocalUser) { signOutLocal(); navigate('/auth') }
          else signOut().then(() => navigate('/'))
        }} style={{ marginTop: 24, width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${T.border}`, background: '#e9456010', color: '#e94560', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
          {isLocalUser ? 'Quitter le profil local' : 'Déconnexion'}
        </button>
      </aside>

      <main style={{ flex: 1, padding: '28px 32px max(28px, env(safe-area-inset-bottom))', maxWidth: 720, overflowY: 'auto', WebkitOverflowScrolling: 'touch', position: 'relative', zIndex: 1 }}>
        {collab.error && tab !== 'sync' && (
          <div style={{ padding: 12, marginBottom: 16, borderRadius: 10, background: '#4a1a1a22', color: '#f87171', fontSize: 12 }}>
            {collab.error} — Fonctionnalités sociales indisponibles. La sauvegarde locale reste active.
          </div>
        )}
        {content}
      </main>
    </div>
  )
}
