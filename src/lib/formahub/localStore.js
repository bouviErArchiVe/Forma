import { FH_STORAGE_KEY, SEED_POSTS } from './constants'

function uid(p = 'fh') {
  return `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function read() {
  try {
    const raw = localStorage.getItem(FH_STORAGE_KEY)
    const data = raw ? JSON.parse(raw) : null
    const posts = Array.isArray(data?.posts) ? data.posts : []
    const comments = Array.isArray(data?.comments) ? data.comments : []
    const saved = Array.isArray(data?.saved) ? data.saved : []
    const liked = Array.isArray(data?.liked) ? data.liked : []
    const follows = data?.follows || { trades: [], users: [] }
    if (posts.length === 0) {
      return { posts: [...SEED_POSTS], comments, saved, liked, follows, seeded: true }
    }
    return { posts, comments, saved, liked, follows, seeded: !!data?.seeded }
  } catch {
    return { posts: [...SEED_POSTS], comments: [], saved: [], liked: [], follows: { trades: [], users: [] }, seeded: true }
  }
}

function write(data) {
  localStorage.setItem(FH_STORAGE_KEY, JSON.stringify({ ...data, updatedAt: Date.now() }))
}

export function listPosts({ feed = 'recent', tradeId, category, query, savedOnly = false, userId = 'local' } = {}) {
  const store = read()
  let posts = [...store.posts]
  if (tradeId) posts = posts.filter((p) => p.tradeId === tradeId)
  if (category) posts = posts.filter((p) => p.category === category)
  if (query) {
    const q = query.toLowerCase()
    posts = posts.filter((p) =>
      (p.title || '').toLowerCase().includes(q)
      || (p.body || '').toLowerCase().includes(q)
      || (p.tags || []).some((t) => t.toLowerCase().includes(q)))
  }
  if (savedOnly) posts = posts.filter((p) => store.saved.includes(p.id))
  if (feed === 'trending') posts.sort((a, b) => (b.likes || 0) - (a.likes || 0))
  else posts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
  return posts
}

export function getPost(id) {
  return read().posts.find((p) => p.id === id) || null
}

export function createPost(partial, authorId = 'local', author = 'Moi') {
  const store = read()
  const post = {
    id: uid('post'),
    author,
    authorId,
    tradeId: partial.tradeId || 'architecte',
    category: partial.category || 'architecture',
    type: partial.type || 'text',
    title: partial.title || 'Sans titre',
    body: partial.body || '',
    imageUrl: partial.imageUrl || null,
    attachment: partial.attachment || null,
    tags: partial.tags || [],
    likes: 0,
    saves: 0,
    createdAt: Date.now(),
    localOnly: true,
  }
  store.posts.unshift(post)
  write(store)
  return post
}

export function toggleLike(postId, userId = 'local') {
  const store = read()
  const liked = new Set(store.liked)
  const post = store.posts.find((p) => p.id === postId)
  if (!post) return null
  if (liked.has(postId)) { liked.delete(postId); post.likes = Math.max(0, (post.likes || 1) - 1) }
  else { liked.add(postId); post.likes = (post.likes || 0) + 1 }
  store.liked = [...liked]
  write(store)
  return post
}

export function toggleSave(postId, userId = 'local') {
  const store = read()
  const saved = new Set(store.saved)
  const post = store.posts.find((p) => p.id === postId)
  if (!post) return null
  if (saved.has(postId)) { saved.delete(postId); post.saves = Math.max(0, (post.saves || 1) - 1) }
  else { saved.add(postId); post.saves = (post.saves || 0) + 1 }
  store.saved = [...saved]
  write(store)
  return post
}

export function isLiked(postId) {
  return read().liked.includes(postId)
}

export function isSaved(postId) {
  return read().saved.includes(postId)
}

export function listComments(postId) {
  return read().comments.filter((c) => c.postId === postId).sort((a, b) => a.createdAt - b.createdAt)
}

export function addComment(postId, body, author = 'Moi', authorId = 'local') {
  const store = read()
  const comment = { id: uid('cmt'), postId, body: String(body || '').trim(), author, authorId, createdAt: Date.now() }
  store.comments.push(comment)
  write(store)
  return comment
}

export function toggleFollowTrade(tradeId) {
  const store = read()
  const set = new Set(store.follows.trades || [])
  if (set.has(tradeId)) set.delete(tradeId)
  else set.add(tradeId)
  store.follows.trades = [...set]
  write(store)
  return store.follows.trades
}

export function isFollowingTrade(tradeId) {
  return (read().follows.trades || []).includes(tradeId)
}

export function getHubStats() {
  const store = read()
  return { posts: store.posts.length, saved: store.saved.length, comments: store.comments.length }
}
