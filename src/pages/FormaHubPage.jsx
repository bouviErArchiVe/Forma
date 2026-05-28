import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/hooks/useAppearance'
import { useAuth } from '@/hooks/useAuth'
import useAppStore from '@/stores/useAppStore'
import FormaModuleHeader from '@/components/FormaModuleHeader'
import HubPostCard from '@/components/formahub/HubPostCard'
import ModalOverlay from '@/components/ui/ModalOverlay'
import GlassButton from '@/components/ui/GlassButton'
import { FH_CATEGORIES, FH_TRADES, FH_FEEDS, POST_TYPES, getTradeMeta } from '@/lib/formahub/constants'
import {
  listPosts, getPost, createPost, toggleLike, toggleSave,
  listComments, addComment, toggleFollowTrade, isFollowingTrade,
  toggleFollowUser, isFollowingUser, getHubStats,
} from '@/lib/formahub/localStore'
import { savePostToLibrary, sendPostToNotebook, sharePost } from '@/lib/formahub/integrations'
import { loadLocalNotebooks } from '@/lib/projectPersistence'
import { isSupabaseConfigured } from '@/lib/supabase'

export default function FormaHubPage() {
  const navigate = useNavigate()
  const { T } = useTheme()
  const { user, isCloudUser } = useAuth()
  const addNotification = useAppStore((s) => s.addNotification)
  const setPendingFormulaNote = useAppStore((s) => s.setPendingFormulaNote)
  const setActiveNotebook = useAppStore((s) => s.setActiveNotebook)
  const pendingHubPublish = useAppStore((s) => s.pendingHubPublish)
  const setPendingHubPublish = useAppStore((s) => s.setPendingHubPublish)

  const [tab, setTab] = useState('feed')
  const [feed, setFeed] = useState('recent')
  const [category, setCategory] = useState('')
  const [tradeFilter, setTradeFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selectedTrade, setSelectedTrade] = useState(null)
  const [activePost, setActivePost] = useState(null)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [showPublish, setShowPublish] = useState(false)
  const [tick, setTick] = useState(0)

  const authorName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Étudiant Forma'
  const stats = getHubStats()

  const posts = useMemo(() => listPosts({
    feed,
    tradeId: tradeFilter || selectedTrade?.id,
    category: category || undefined,
    query: search,
    savedOnly: feed === 'saved',
  }), [feed, tradeFilter, selectedTrade, category, search, tick])

  const refresh = useCallback(() => setTick((n) => n + 1), [])

  useEffect(() => {
    if (!pendingHubPublish) return
    setDraft({
      title: pendingHubPublish.title || '',
      body: pendingHubPublish.body || '',
      tradeId: pendingHubPublish.tradeId || 'architecte',
      type: pendingHubPublish.type || 'text',
      tags: (pendingHubPublish.tags || []).join(', '),
      imageUrl: pendingHubPublish.imageUrl || null,
    })
    setShowPublish(true)
    setPendingHubPublish(null)
  }, [pendingHubPublish, setPendingHubPublish])

  const openPost = (post) => {
    setActivePost(getPost(post.id) || post)
    setComments(listComments(post.id))
  }

  const handleLike = (id) => { toggleLike(id); refresh(); if (activePost?.id === id) setActivePost(getPost(id)) }
  const handleSave = (id) => { toggleSave(id); refresh(); if (activePost?.id === id) setActivePost(getPost(id)) }

  const handleComment = () => {
    if (!activePost || !commentText.trim()) return
    addComment(activePost.id, commentText.trim(), authorName)
    setCommentText('')
    setComments(listComments(activePost.id))
  }

  const [draft, setDraft] = useState({ title: '', body: '', tradeId: 'architecte', type: 'text', tags: '' })

  const publish = () => {
    if (!draft.title.trim()) { addNotification('Titre requis', 'error'); return }
    createPost({
      ...draft,
      tags: draft.tags.split(',').map((t) => t.trim()).filter(Boolean),
      category: FH_TRADES.find((t) => t.id === draft.tradeId)?.category || 'architecture',
      imageUrl: draft.imageUrl || null,
    }, user?.id || 'local', authorName)
    setShowPublish(false)
    setDraft({ title: '', body: '', tradeId: 'architecte', type: 'text', tags: '' })
    refresh()
    addNotification('Publication créée (locale)', 'success')
  }

  const onImagePick = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setDraft((d) => ({ ...d, imageUrl: reader.result, type: POST_TYPES.image }))
    reader.readAsDataURL(file)
  }

  return (
    <div className="forma-page-shell" style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: T.bg }}>
      <FormaModuleHeader title="FormaHub" subtitle={`Communauté · ${stats.posts} publications`} sticky>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher métiers, posts…"
          style={{ flex: 1, minWidth: 160, maxWidth: 280, padding: '8px 12px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.bg, color: T.ink, fontSize: 12 }}
        />
        <GlassButton T={T} onClick={() => setShowPublish(true)}>+ Publier</GlassButton>
      </FormaModuleHeader>

      <div style={{ padding: '8px 16px', fontSize: 11, background: `${T.accent}10`, color: T.muted, borderBottom: `1px solid ${T.border}` }}>
        {isCloudUser && isSupabaseConfigured
          ? 'Mode local — publications sauvegardées sur cet appareil. Sync communautaire cloud à venir.'
          : 'Espace communautaire local — connectez un compte cloud pour le réseau étudiant complet.'}
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '10px 16px', borderBottom: `1px solid ${T.border}`, flexWrap: 'wrap' }}>
        {[['feed', 'Feed'], ['trades', 'Métiers']].map(([id, label]) => (
          <button key={id} type="button" onClick={() => { setTab(id); setSelectedTrade(null) }} style={tabBtn(T, tab === id)}>{label}</button>
        ))}
        {FH_FEEDS.map((f) => (
          <button key={f.id} type="button" onClick={() => { setTab('feed'); setFeed(f.id) }} style={tabBtn(T, tab === 'feed' && feed === f.id)}>{f.label}</button>
        ))}
      </div>

      {tab === 'feed' && (
        <div style={{ display: 'flex', gap: 8, padding: '8px 16px', overflowX: 'auto', borderBottom: `1px solid ${T.border}` }}>
          <button type="button" onClick={() => setCategory('')} style={chip(T, !category)}>Tout</button>
          {FH_CATEGORIES.map((c) => (
            <button key={c.id} type="button" onClick={() => setCategory(c.id)} style={chip(T, category === c.id)}>{c.icon} {c.label}</button>
          ))}
        </div>
      )}

      <main style={{ flex: 1, overflowY: 'auto', padding: '16px', maxWidth: 1200, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {tab === 'trades' && !selectedTrade && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {FH_TRADES.map((t) => (
              <button key={t.id} type="button" onClick={() => setSelectedTrade(t)} style={{
                textAlign: 'left', padding: 16, borderRadius: 12, border: `1px solid ${T.border}`,
                background: T.surface, cursor: 'pointer', color: T.ink,
              }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{t.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{t.label}</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 6, lineHeight: 1.45 }}>{t.desc}</div>
              </button>
            ))}
          </div>
        )}

        {tab === 'trades' && selectedTrade && (
          <div>
            <button type="button" onClick={() => setSelectedTrade(null)} style={{ background: 'none', border: 'none', color: T.accent, cursor: 'pointer', marginBottom: 12 }}>← Métiers</button>
            <div style={{ padding: 20, borderRadius: 14, background: T.surface, border: `1px solid ${T.border}`, marginBottom: 16 }}>
              <div style={{ fontSize: 36 }}>{selectedTrade.icon}</div>
              <h2 style={{ margin: '8px 0', fontSize: 22 }}>{selectedTrade.label}</h2>
              <p style={{ color: T.muted, fontSize: 13, lineHeight: 1.5 }}>{selectedTrade.desc}</p>
              <button type="button" onClick={() => { toggleFollowTrade(selectedTrade.id); refresh() }} style={chip(T, isFollowingTrade(selectedTrade.id))}>
                {isFollowingTrade(selectedTrade.id) ? '✓ Suivi' : '+ Suivre ce métier'}
              </button>
              {(() => {
                const meta = getTradeMeta(selectedTrade.id)
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 16 }}>
                    {[['Outils', meta.tools], ['Logiciels', meta.software], ['Ressources', meta.resources]].map(([label, items]) => (
                      <div key={label}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: T.accent, marginBottom: 6 }}>{label}</div>
                        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: T.muted, lineHeight: 1.6 }}>
                          {(items || []).map((item) => <li key={item}>{item}</li>)}
                        </ul>
                      </div>
                    ))}
                    {meta.links?.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: T.accent, marginBottom: 6 }}>Liens</div>
                        {meta.links.map((l) => (
                          <a key={l.url} href={l.url} target="_blank" rel="noreferrer" style={{ display: 'block', fontSize: 12, color: T.accent, marginBottom: 4 }}>{l.label}</a>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {listPosts({ tradeId: selectedTrade.id }).map((p) => (
                <HubPostCard key={p.id} post={p} T={T} onOpen={openPost} onLike={handleLike} onSave={handleSave}
                  onShare={(post) => sharePost(post, addNotification)} />
              ))}
            </div>
          </div>
        )}

        {tab === 'feed' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {posts.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', color: T.muted, padding: 40 }}>
                {feed === 'following' ? 'Suivez des métiers ou auteurs pour voir leurs publications ici.' : 'Aucune publication — soyez le premier à publier !'}
              </div>
            ) : posts.map((p) => (
              <HubPostCard key={p.id} post={p} T={T} onOpen={openPost} onLike={handleLike} onSave={handleSave}
                onShare={(post) => sharePost(post, addNotification)}
                onFollowAuthor={(post) => { toggleFollowUser(post.authorId); refresh() }}
                followingAuthor={isFollowingUser(p.authorId)} />
            ))}
          </div>
        )}
      </main>

      {activePost && (
        <ModalOverlay onClose={() => setActivePost(null)}>
          <div style={{ background: T.surface, borderRadius: 16, padding: 20, width: 'min(560px, 94vw)', maxHeight: '85vh', overflowY: 'auto', border: `1px solid ${T.border}` }}>
            {activePost.imageUrl && <img src={activePost.imageUrl} alt="" style={{ width: '100%', borderRadius: 10, marginBottom: 12, maxHeight: 280, objectFit: 'cover' }} />}
            <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>{activePost.title}</h2>
            <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{activePost.body}</p>
            <div style={{ display: 'flex', gap: 8, margin: '14px 0', flexWrap: 'wrap' }}>
              <GlassButton T={T} onClick={() => handleLike(activePost.id)}>♥ {activePost.likes}</GlassButton>
              <GlassButton T={T} onClick={() => handleSave(activePost.id)}>★ Enregistrer</GlassButton>
              <GlassButton T={T} onClick={() => sharePost(activePost, addNotification)}>↗ Partager</GlassButton>
              <GlassButton T={T} onClick={() => { toggleFollowUser(activePost.authorId); refresh() }}>
                {isFollowingUser(activePost.authorId) ? '✓ Auteur suivi' : '+ Suivre auteur'}
              </GlassButton>
              <GlassButton T={T} onClick={() => savePostToLibrary(activePost, addNotification)}>📚 Library</GlassButton>
              <GlassButton T={T} onClick={() => sendPostToNotebook(activePost, { setPendingFormulaNote, setActiveNotebook, navigate, notebooks: loadLocalNotebooks(), addNotification })}>📓 Carnet</GlassButton>
            </div>
            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8 }}>Commentaires ({comments.length})</div>
              {comments.map((c) => (
                <div key={c.id} style={{ fontSize: 12, padding: '6px 0', borderBottom: `1px solid ${T.border}22` }}>
                  <strong>{c.author}</strong> — {c.body}
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Commenter…" style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.ink, fontSize: 12 }} />
                <GlassButton T={T} onClick={handleComment}>Envoyer</GlassButton>
              </div>
            </div>
          </div>
        </ModalOverlay>
      )}

      {showPublish && (
        <ModalOverlay onClose={() => setShowPublish(false)}>
          <div style={{ background: T.surface, borderRadius: 16, padding: 20, width: 'min(480px, 94vw)', border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px' }}>Nouvelle publication</h3>
            <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Titre" style={field(T)} />
            <textarea value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} placeholder="Description, conseil, question…" rows={4} style={{ ...field(T), marginTop: 8, resize: 'vertical' }} />
            <select value={draft.tradeId} onChange={(e) => setDraft({ ...draft, tradeId: e.target.value })} style={{ ...field(T), marginTop: 8 }}>
              {FH_TRADES.map((t) => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
            </select>
            <input value={draft.tags} onChange={(e) => setDraft({ ...draft, tags: e.target.value })} placeholder="Tags (séparés par virgule)" style={{ ...field(T), marginTop: 8 }} />
            <label style={{ display: 'block', marginTop: 10, fontSize: 12, color: T.accent, cursor: 'pointer' }}>
              + Ajouter une image<input type="file" accept="image/*" hidden onChange={onImagePick} />
            </label>
            {draft.imageUrl && <img src={draft.imageUrl} alt="" style={{ width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 8, marginTop: 8 }} />}
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <GlassButton T={T} onClick={publish}>Publier</GlassButton>
              <GlassButton T={T} onClick={() => setShowPublish(false)}>Annuler</GlassButton>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  )
}

const tabBtn = (T, active) => ({
  padding: '6px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: 'pointer',
  border: `1px solid ${active ? T.accent : T.border}`, background: active ? `${T.accent}18` : 'transparent', color: active ? T.accent : T.ink,
})
const chip = (T, active) => ({
  padding: '5px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
  border: `1px solid ${active ? T.accent : T.border}`, background: active ? `${T.accent}18` : T.surface, color: active ? T.accent : T.muted,
})
const field = (T) => ({
  width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.ink, fontSize: 13, boxSizing: 'border-box',
})
