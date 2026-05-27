/** Profil utilisateur local (mode sans backend obligatoire) */

import { safeGetLocalStorage, safeSetLocalStorage, safeJsonParse } from '@/lib/storage'
import { isSupabaseConfigured } from '@/lib/supabase'

const KEY = 'forma-local-profile'

export function isBackendAuthAvailable() {
  return isSupabaseConfigured
}

export function loadLocalProfile() {
  const data = safeJsonParse(safeGetLocalStorage(KEY, 'null'), null)
  if (!data?.pseudo?.trim()) return null
  return data
}

export function saveLocalProfile(profile) {
  if (!profile?.pseudo?.trim()) return null
  const next = {
    id: profile.id || `local-${Date.now()}`,
    pseudo: profile.pseudo.trim().slice(0, 32),
    avatarUrl: profile.avatarUrl || '',
    phone: profile.phone || '',
    workspaceId: profile.workspaceId || `ws-${Date.now()}`,
    preferences: profile.preferences || {},
    createdAt: profile.createdAt || Date.now(),
    updatedAt: Date.now(),
  }
  safeSetLocalStorage(KEY, JSON.stringify(next))
  return next
}

export function createLocalProfile({ pseudo, avatarUrl = '', phone = '' }) {
  if (!pseudo?.trim()) throw new Error('Un pseudo est requis.')
  return saveLocalProfile({ pseudo, avatarUrl, phone })
}

export function updateLocalProfile(updates) {
  const current = loadLocalProfile()
  if (!current) throw new Error('Aucun profil local.')
  return saveLocalProfile({ ...current, ...updates, pseudo: (updates.pseudo ?? current.pseudo).trim() })
}

export function clearLocalProfile() {
  try { localStorage.removeItem(KEY) } catch { /* ignore */ }
}

export function getDisplayIdentity({ supabaseUser, localProfile, collabProfile }) {
  if (collabProfile?.display_name) {
    return {
      name: collabProfile.display_name,
      avatarUrl: collabProfile.avatar_url || '',
      mode: 'cloud',
      email: supabaseUser?.email || '',
      phone: collabProfile.phone || '',
    }
  }
  if (supabaseUser?.email) {
    return {
      name: supabaseUser.user_metadata?.full_name || supabaseUser.email.split('@')[0],
      avatarUrl: '',
      mode: 'cloud',
      email: supabaseUser.email,
      phone: '',
    }
  }
  if (localProfile?.pseudo) {
    return {
      name: localProfile.pseudo,
      avatarUrl: localProfile.avatarUrl || '',
      mode: 'local',
      email: '',
      phone: localProfile.phone || '',
    }
  }
  return { name: '', avatarUrl: '', mode: 'guest', email: '', phone: '' }
}
