import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/hooks/useAppearance'
import { useAuth } from '@/hooks/useAuth'
import { useCollaboration } from '@/hooks/useCollaboration'
import useAppStore from '@/stores/useAppStore'
import FormaModuleHeader from '@/components/FormaModuleHeader'
import MessageList from '@/components/formamessage/MessageList'
import MessageComposer from '@/components/formamessage/MessageComposer'
import { CONNECTION_MODES } from '@/lib/formamessage/constants'
import {
  listConversations, listMessages, createConversation, sendMessage,
  editMessage, deleteMessage, toggleReaction, markConversationRead, searchConversations,
} from '@/lib/formamessage/localStore'
import { getCloudMessageStatus } from '@/lib/formamessage/cloud'
import {
  saveToFormaLibrary, addToMoodboard, sendTextToNotebook,
  openInFormaReview, openInFormaCombine,
} from '@/lib/formamessage/integrations'
import { loadLocalNotebooks } from '@/lib/projectPersistence'

export default function FormaMessagePage() {
  const navigate = useNavigate()
  const { T } = useTheme()
  const { user, isCloudUser, isLocalUser } = useAuth()
  const { friends } = useCollaboration()
  const addNotification = useAppStore((s) => s.addNotification)
  const setPendingFormulaNote = useAppStore((s) => s.setPendingFormulaNote)
  const setActiveNotebook = useAppStore((s) => s.setActiveNotebook)

  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState([])
  const [search, setSearch] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [cloudStatus, setCloudStatus] = useState({ available: false, reason: '' })
  const [showNew, setShowNew] = useState(false)

  const userId = user?.id || 'local'
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Moi'

  const connectionMode = useMemo(() => {
    if (cloudStatus.available) return CONNECTION_MODES.cloud
    if (isCloudUser) return CONNECTION_MODES.cloud_pending
    return CONNECTION_MODES.local
  }, [cloudStatus.available, isCloudUser])

  const refresh = useCallback(() => {
    setConversations(search ? searchConversations(search) : listConversations())
    if (activeId) setMessages(listMessages(activeId))
  }, [search, activeId])

  useEffect(() => { refresh() }, [refresh])

  useEffect(() => {
    if (!user?.id) {
      setCloudStatus({ available: false, reason: 'Compte cloud requis pour la messagerie entre utilisateurs.' })
      return
    }
    getCloudMessageStatus(user.id).then(setCloudStatus)
  }, [user?.id])

  useEffect(() => {
    if (conversations.length === 0) {
      const draft = createConversation({
        title: 'Brouillons Forma',
        type: 'direct',
        memberIds: [userId],
        memberNames: [userName],
      })
      setConversations(listConversations())
      setActiveId(draft.id)
    } else if (!activeId) {
      setActiveId(conversations[0].id)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeId) {
      setMessages(listMessages(activeId))
      markConversationRead(activeId)
      refresh()
    }
  }, [activeId, refresh])

  const activeConv = conversations.find((c) => c.id === activeId)

  const handleSend = (payload) => {
    if (!activeId) return
    sendMessage({
      conversationId: activeId,
      senderId: userId,
      senderName: userName,
      ...payload,
    })
    refresh()
  }

  const handleAttachmentAction = async (action, msg) => {
    const att = msg.attachment
    if (action === 'preview' && att?.dataUrl) {
      window.open(att.dataUrl, '_blank')
      return
    }
    if (action === 'download' && att?.dataUrl) {
      const a = document.createElement('a')
      a.href = att.dataUrl
      a.download = att.name || 'fichier'
      a.click()
      return
    }
    if (action === 'library') await saveToFormaLibrary(att, addNotification)
    if (action === 'moodboard') addToMoodboard(att, addNotification)
    if (action === 'notebook') sendTextToNotebook(msg.body || att?.name, {
      setPendingFormulaNote, setActiveNotebook, navigate,
      notebooks: loadLocalNotebooks(), addNotification,
    })
    if (action === 'review') openInFormaReview(att, navigate, addNotification)
    if (action === 'combine') openInFormaCombine(att, navigate, addNotification)
  }

  const startChatWithFriend = (friend) => {
    const name = friend.profile?.display_name || friend.profile?.email || 'Ami'
    const conv = createConversation({
      title: name,
      type: 'direct',
      memberIds: [userId, friend.friend_id],
      memberNames: [userName, name],
    })
    setShowNew(false)
    setActiveId(conv.id)
    refresh()
    addNotification(`Conversation avec ${name} (brouillon local)`, 'info')
  }

  const bannerText = {
    [CONNECTION_MODES.local]: isLocalUser
      ? 'Mode brouillon local — messages sauvegardés sur cet appareil. Connectez un compte cloud pour échanger avec vos amis.'
      : 'Mode brouillon local — la messagerie temps réel nécessite Supabase + migration FormaMessage.',
    [CONNECTION_MODES.cloud_pending]: cloudStatus.reason || 'Messagerie cloud en attente de configuration.',
    [CONNECTION_MODES.cloud]: 'Messagerie cloud connectée — sync Supabase active.',
  }[connectionMode]

  return (
    <div className="forma-page-shell" style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: T.bg }}>
      <FormaModuleHeader title="FormaMessage" subtitle="Messages · fichiers · collaboration" sticky />

      <div style={{
        padding: '8px 16px', fontSize: 11, lineHeight: 1.45,
        background: connectionMode === CONNECTION_MODES.cloud ? `${T.accent}15` : '#f5a62318',
        color: connectionMode === CONNECTION_MODES.cloud ? T.accent : '#c4841d',
        borderBottom: `1px solid ${T.border}`,
      }}>
        {bannerText}
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <aside style={{
          width: 280, flexShrink: 0, borderRight: `1px solid ${T.border}`,
          display: 'flex', flexDirection: 'column', background: T.surface,
        }}>
          <div style={{ padding: 12, borderBottom: `1px solid ${T.border}` }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher…"
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.ink, fontSize: 12, boxSizing: 'border-box' }}
            />
            <button type="button" onClick={() => setShowNew((v) => !v)} style={{ marginTop: 8, width: '100%', padding: 8, borderRadius: 8, border: `1px solid ${T.accent}`, background: `${T.accent}12`, color: T.accent, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
              + Nouvelle conversation
            </button>
          </div>

          {showNew && (
            <div style={{ padding: '8px 12px', borderBottom: `1px solid ${T.border}`, maxHeight: 180, overflowY: 'auto' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, marginBottom: 6 }}>Amis</div>
              {friends.length === 0 ? (
                <div style={{ fontSize: 11, color: T.muted }}>
                  {isCloudUser ? 'Aucun ami — ' : 'Compte cloud requis — '}
                  <button type="button" onClick={() => navigate('/account/friends')} style={{ background: 'none', border: 'none', color: T.accent, cursor: 'pointer', padding: 0 }}>Ajouter des amis</button>
                </div>
              ) : friends.map((f) => (
                <button key={f.friend_id} type="button" onClick={() => startChatWithFriend(f)} style={convBtn(T)}>
                  {f.profile?.display_name || f.profile?.email || 'Ami'}
                </button>
              ))}
            </div>
          )}

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {conversations.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveId(c.id)}
                style={{
                  ...convBtn(T),
                  background: activeId === c.id ? `${T.accent}18` : 'transparent',
                  borderLeft: activeId === c.id ? `3px solid ${T.accent}` : '3px solid transparent',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 13 }}>{c.title}</div>
                <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>{c.lastPreview || '—'}</div>
              </button>
            ))}
          </div>
        </aside>

        <section style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}`, background: T.surface }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>{activeConv?.title || 'Conversation'}</div>
            <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>
              {activeConv?.type === 'group' ? 'Groupe · ' : ''}Sauvegarde locale · statuts cloud si connecté
            </div>
          </div>

          <MessageList
            T={T}
            messages={messages}
            userId={userId}
            onReply={setReplyTo}
            onEdit={(m) => {
              const next = window.prompt('Modifier le message :', m.body)
              if (next != null && next.trim()) { editMessage(m.id, next.trim()); refresh() }
            }}
            onDelete={(id) => { if (window.confirm('Supprimer ce message ?')) { deleteMessage(id); refresh() } }}
            onReact={(id, emoji) => { toggleReaction(id, emoji, userId); refresh() }}
            onAttachmentAction={handleAttachmentAction}
          />

          <MessageComposer
            T={T}
            disabled={!activeId}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            onSend={handleSend}
            onSendVoice={(p) => {
              if (p.error) addNotification(p.error, 'error')
              else handleSend(p)
            }}
          />
        </section>
      </div>
    </div>
  )
}

const convBtn = (T) => ({
  display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px',
  border: 'none', borderBottom: `1px solid ${T.border}22`, cursor: 'pointer', color: T.ink,
})
