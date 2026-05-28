import { FM_STORAGE_KEY, MSG_STATUS, MSG_TYPES } from './constants'

function uid(p = 'fm') {
  return `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function read() {
  try {
    const raw = localStorage.getItem(FM_STORAGE_KEY)
    const data = raw ? JSON.parse(raw) : null
    return {
      conversations: Array.isArray(data?.conversations) ? data.conversations : [],
      messages: Array.isArray(data?.messages) ? data.messages : [],
    }
  } catch {
    return { conversations: [], messages: [] }
  }
}

function write(data) {
  localStorage.setItem(FM_STORAGE_KEY, JSON.stringify({ ...data, updatedAt: Date.now() }))
}

export function loadMessageStore() {
  return read()
}

export function listConversations() {
  return read().conversations.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
}

export function listMessages(conversationId) {
  return read().messages
    .filter((m) => m.conversationId === conversationId && !m.deletedAt)
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
}

export function createConversation({ title, type = 'direct', memberIds = [], memberNames = [] }) {
  const store = read()
  const conv = {
    id: uid('conv'),
    type,
    title: title || 'Conversation',
    memberIds,
    memberNames,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    unread: 0,
    localOnly: true,
  }
  store.conversations.unshift(conv)
  write(store)
  return conv
}

export function sendMessage({
  conversationId,
  senderId = 'local',
  senderName = 'Moi',
  type = MSG_TYPES.text,
  body = '',
  attachment = null,
  replyTo = null,
}) {
  const store = read()
  const msg = {
    id: uid('msg'),
    conversationId,
    senderId,
    senderName,
    type,
    body,
    attachment,
    replyTo,
    reactions: {},
    status: MSG_STATUS.sent,
    createdAt: Date.now(),
    editedAt: null,
    deletedAt: null,
  }
  store.messages.push(msg)
  const ci = store.conversations.findIndex((c) => c.id === conversationId)
  if (ci >= 0) {
    store.conversations[ci] = {
      ...store.conversations[ci],
      updatedAt: Date.now(),
      lastPreview: previewText(msg),
    }
  }
  write(store)
  return msg
}

function previewText(msg) {
  if (msg.type === MSG_TYPES.voice) return '🎤 Message vocal'
  if (msg.type === MSG_TYPES.image) return '🖼 Photo'
  if (msg.type === MSG_TYPES.file) return `📎 ${msg.attachment?.name || 'Fichier'}`
  if (msg.type === MSG_TYPES.sticker) return msg.body || '😊'
  if (msg.type === MSG_TYPES.share) return `🔗 ${msg.attachment?.label || 'Partage Forma'}`
  return (msg.body || '').slice(0, 80)
}

export function editMessage(messageId, body) {
  const store = read()
  const i = store.messages.findIndex((m) => m.id === messageId)
  if (i < 0) return null
  store.messages[i] = { ...store.messages[i], body, editedAt: Date.now() }
  write(store)
  return store.messages[i]
}

export function deleteMessage(messageId) {
  const store = read()
  const i = store.messages.findIndex((m) => m.id === messageId)
  if (i < 0) return false
  store.messages[i] = { ...store.messages[i], deletedAt: Date.now(), body: '' }
  write(store)
  return true
}

export function toggleReaction(messageId, emoji, userId = 'local') {
  const store = read()
  const i = store.messages.findIndex((m) => m.id === messageId)
  if (i < 0) return null
  const reactions = { ...(store.messages[i].reactions || {}) }
  const list = new Set(reactions[emoji] || [])
  if (list.has(userId)) list.delete(userId)
  else list.add(userId)
  if (list.size) reactions[emoji] = [...list]
  else delete reactions[emoji]
  store.messages[i] = { ...store.messages[i], reactions }
  write(store)
  return store.messages[i]
}

export function markConversationRead(conversationId) {
  const store = read()
  const i = store.conversations.findIndex((c) => c.id === conversationId)
  if (i >= 0) {
    store.conversations[i].unread = 0
    write(store)
  }
}

export function searchConversations(q) {
  const query = String(q || '').trim().toLowerCase()
  if (!query) return listConversations()
  const store = read()
  const hitConvIds = new Set()
  for (const c of store.conversations) {
    if (c.title?.toLowerCase().includes(query)) hitConvIds.add(c.id)
  }
  for (const m of store.messages) {
    if ((m.body || '').toLowerCase().includes(query)) hitConvIds.add(m.conversationId)
  }
  return store.conversations.filter((c) => hitConvIds.has(c.id))
}
