// Schéma SQL (profiles, amis, partage) : supabase/migrations/001_account_sharing.sql
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://YOUR_PROJECT.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: { eventsPerSecond: 10 }
  }
})

// ─── Auth helpers ────────────────────────────────────────────
export const signInWithGoogle = () =>
  supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })

export const signInWithApple = () =>
  supabase.auth.signInWithOAuth({ provider: 'apple', options: { redirectTo: window.location.origin } })

export const signInWithEmail = (email, password) =>
  supabase.auth.signInWithPassword({ email, password })

export const signUpWithEmail = (email, password, fullName) =>
  supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })

export const signOut = () => supabase.auth.signOut()

export const getUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// ─── Notebooks CRUD ─────────────────────────────────────────
export const getNotebooks = async (userId) => {
  const { data, error } = await supabase
    .from('notebooks')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data
}

export const createNotebook = async (notebook) => {
  const { data, error } = await supabase
    .from('notebooks')
    .insert([notebook])
    .select()
    .single()
  if (error) throw error
  return data
}

export const updateNotebook = async (id, updates) => {
  const { data, error } = await supabase
    .from('notebooks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteNotebook = async (id) => {
  const { error } = await supabase.from('notebooks').delete().eq('id', id)
  if (error) throw error
}

// ─── Pages CRUD ─────────────────────────────────────────────
export const getPages = async (notebookId) => {
  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .eq('notebook_id', notebookId)
    .order('page_number', { ascending: true })
  if (error) throw error
  return data
}

export const savePage = async (pageId, canvasData, elements, textItems) => {
  const { data, error } = await supabase
    .from('pages')
    .upsert({
      id: pageId,
      canvas_data: canvasData,
      elements,
      text_items: textItems,
      updated_at: new Date().toISOString()
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── File Storage ────────────────────────────────────────────
export const uploadFile = async (userId, file) => {
  const ext = file.name.split('.').pop()
  const path = `${userId}/${Date.now()}.${ext}`
  const { data, error } = await supabase.storage
    .from('documents')
    .upload(path, file, { contentType: file.type, upsert: false })
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path)
  return { path: data.path, url: publicUrl }
}

// ─── Realtime Collaboration ──────────────────────────────────
export const subscribeToNotebook = (notebookId, onCursorUpdate, onPageUpdate) => {
  const channel = supabase.channel(`notebook:${notebookId}`)

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      onCursorUpdate(Object.values(state).flat())
    })
    .on('broadcast', { event: 'cursor' }, ({ payload }) => {
      onCursorUpdate(payload)
    })
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'pages',
      filter: `notebook_id=eq.${notebookId}`
    }, ({ new: page }) => {
      onPageUpdate(page)
    })
    .subscribe()

  return channel
}

export const broadcastCursor = (channel, userId, userName, x, y) => {
  channel.track({ user_id: userId, user_name: userName, cursor: { x, y }, timestamp: Date.now() })
}
