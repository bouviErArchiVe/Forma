import { supabase, uploadFile } from '@/lib/supabase'

const PERMISSIONS = ['read', 'comment', 'edit', 'owner']

function token() {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function errMsg(error) {
  return error?.message || 'Une erreur est survenue'
}

// ─── Profiles ───────────────────────────────────────────────

export async function ensureProfile(user) {
  if (!user?.id) return null
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  if (data) return data
  const payload = {
    id: user.id,
    display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilisateur',
    email: user.email,
  }
  const { data: created, error } = await supabase.from('profiles').upsert(payload).select().single()
  if (error) throw new Error(errMsg(error))
  return created
}

export async function getProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw new Error(errMsg(error))
  return data
}

export async function updateProfile(userId, updates) {
  if (!userId) throw new Error('Non connecté')
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()
  if (error) throw new Error(errMsg(error))
  if (updates.display_name) {
    await supabase.auth.updateUser({ data: { full_name: updates.display_name } })
  }
  return data
}

export async function searchProfiles(query, excludeUserId) {
  const q = String(query || '').trim()
  if (q.length < 2) return []
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, email, avatar_url')
    .or(`email.ilike.%${q}%,display_name.ilike.%${q}%`)
    .neq('id', excludeUserId)
    .limit(12)
  if (error) throw new Error(errMsg(error))
  return data || []
}

export async function uploadAvatar(userId, file) {
  if (!userId || !file) throw new Error('Fichier invalide')
  const ext = file.name.split('.').pop()
  const path = `${userId}/avatar.${ext}`
  const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, {
    upsert: true,
    contentType: file.type,
  })
  if (upErr) {
    const { path: docPath, url } = await uploadFile(userId, file)
    return updateProfile(userId, { avatar_url: url })
  }
  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
  return updateProfile(userId, { avatar_url: publicUrl })
}

export async function updateUserEmail(newEmail) {
  const email = String(newEmail || '').trim()
  if (!email) throw new Error('Adresse e-mail requise')
  const { error } = await supabase.auth.updateUser({ email })
  if (error) throw new Error(errMsg(error))
  return true
}

export async function updateUserPassword(newPassword, confirmPassword) {
  const pwd = String(newPassword || '')
  if (pwd.length < 6) throw new Error('Mot de passe : 6 caractères minimum')
  if (pwd !== confirmPassword) throw new Error('Les mots de passe ne correspondent pas')
  const { error } = await supabase.auth.updateUser({ password: pwd })
  if (error) throw new Error(errMsg(error))
  return true
}

// ─── Notifications ──────────────────────────────────────────

export async function createNotification({ userId, type, title, body, payload = {} }) {
  const { error } = await supabase.from('notifications').insert([{
    user_id: userId,
    type,
    title,
    body,
    payload,
  }])
  if (error) console.warn('Notification insert failed:', error.message)
}

export async function getNotifications(userId, limit = 40) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(errMsg(error))
  return data || []
}

export async function getUnreadCount(userId) {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false)
  if (error) return 0
  return count || 0
}

export async function markNotificationRead(id) {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id)
  if (error) throw new Error(errMsg(error))
}

export async function markAllNotificationsRead(userId) {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', userId)
  if (error) throw new Error(errMsg(error))
}

// ─── Friends ────────────────────────────────────────────────

export async function getFriends(userId) {
  const { data, error } = await supabase
    .from('friends')
    .select('id, friend_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(errMsg(error))
  if (!data?.length) return []
  const ids = data.map((r) => r.friend_id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, email, avatar_url')
    .in('id', ids)
  const map = Object.fromEntries((profiles || []).map((p) => [p.id, p]))
  return data.map((row) => ({ ...row, profile: map[row.friend_id] }))
}

export async function getFriendRequests(userId) {
  const { data, error } = await supabase
    .from('friend_requests')
    .select('id, from_user_id, to_user_id, status, created_at')
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
    .order('created_at', { ascending: false })
  if (error) throw new Error(errMsg(error))
  if (!data?.length) return []
  const ids = [...new Set(data.flatMap((r) => [r.from_user_id, r.to_user_id]))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, email, avatar_url')
    .in('id', ids)
  const map = Object.fromEntries((profiles || []).map((p) => [p.id, p]))
  return data.map((r) => ({
    ...r,
    from_profile: map[r.from_user_id],
    to_profile: map[r.to_user_id],
  }))
}

export async function sendFriendRequest(fromUserId, toUserId, fromName) {
  if (fromUserId === toUserId) throw new Error('Impossible de s\'ajouter soi-même')
  const { data, error } = await supabase
    .from('friend_requests')
    .insert([{ from_user_id: fromUserId, to_user_id: toUserId, status: 'pending' }])
    .select()
    .single()
  if (error) throw new Error(errMsg(error))
  await createNotification({
    userId: toUserId,
    type: 'friend_request',
    title: 'Demande d\'ami',
    body: `${fromName || 'Quelqu\'un'} souhaite vous ajouter`,
    payload: { request_id: data.id, from_user_id: fromUserId },
  })
  return data
}

export async function respondFriendRequest(request, accept, currentUserId, currentName) {
  const status = accept ? 'accepted' : 'rejected'
  const { error } = await supabase
    .from('friend_requests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', request.id)
  if (error) throw new Error(errMsg(error))

  if (accept) {
    await supabase.from('friends').upsert([
      { user_id: request.from_user_id, friend_id: request.to_user_id },
      { user_id: request.to_user_id, friend_id: request.from_user_id },
    ], { onConflict: 'user_id,friend_id' })
    await createNotification({
      userId: request.from_user_id,
      type: 'friend_accepted',
      title: 'Demande acceptée',
      body: `${currentName || 'Votre ami'} a accepté votre demande`,
      payload: { friend_id: currentUserId },
    })
  }
  return true
}

export async function removeFriend(userId, friendId) {
  await supabase.from('friends').delete().eq('user_id', userId).eq('friend_id', friendId)
  await supabase.from('friends').delete().eq('user_id', friendId).eq('friend_id', userId)
}

// ─── Sharing ────────────────────────────────────────────────

export async function getSharedWithMe(userId) {
  const { data, error } = await supabase
    .from('shared_projects')
    .select('*')
    .eq('shared_with_user_id', userId)
    .order('updated_at', { ascending: false })
  if (error) throw new Error(errMsg(error))
  return attachProfiles(data || [], 'owner_id', 'owner')
}

export async function getSharedByMe(userId) {
  const { data, error } = await supabase
    .from('shared_projects')
    .select('*')
    .eq('owner_id', userId)
    .order('updated_at', { ascending: false })
  if (error) throw new Error(errMsg(error))
  return attachProfiles(data || [], 'shared_with_user_id', 'shared_with')
}

async function attachProfiles(rows, idKey, outKey) {
  const ids = [...new Set(rows.map((r) => r[idKey]).filter(Boolean))]
  if (!ids.length) return rows.map((r) => ({ ...r, [outKey]: null }))
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, email, avatar_url')
    .in('id', ids)
  const map = Object.fromEntries((profiles || []).map((p) => [p.id, p]))
  return rows.map((r) => ({ ...r, [outKey]: map[r[idKey]] || null }))
}

export async function shareResource({
  ownerId,
  resourceType,
  resourceId,
  resourceTitle,
  sharedWithUserId,
  permission = 'read',
  withLink = false,
  ownerName,
}) {
  if (!PERMISSIONS.includes(permission)) throw new Error('Permission invalide')
  const payload = {
    owner_id: ownerId,
    resource_type: resourceType,
    resource_id: resourceId,
    resource_title: resourceTitle || resourceId,
    shared_with_user_id: sharedWithUserId || null,
    permission,
    share_token: withLink ? token() : null,
    is_public_link: !!withLink,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from('shared_projects').insert([payload]).select().single()
  if (error) throw new Error(errMsg(error))

  if (sharedWithUserId) {
    await createNotification({
      userId: sharedWithUserId,
      type: 'share',
      title: 'Fichier partagé',
      body: `${ownerName || 'Quelqu\'un'} a partagé « ${resourceTitle} » avec vous`,
      payload: { shared_project_id: data.id, resource_type: resourceType, resource_id: resourceId },
    })
  }
  return data
}

export async function updateSharePermission(shareId, permission) {
  if (!PERMISSIONS.includes(permission)) throw new Error('Permission invalide')
  const { data, error } = await supabase
    .from('shared_projects')
    .update({ permission, updated_at: new Date().toISOString() })
    .eq('id', shareId)
    .select()
    .single()
  if (error) throw new Error(errMsg(error))
  return data
}

export async function enableShareLink(shareId) {
  const shareToken = token()
  const { data, error } = await supabase
    .from('shared_projects')
    .update({ share_token: shareToken, is_public_link: true, updated_at: new Date().toISOString() })
    .eq('id', shareId)
    .select()
    .single()
  if (error) throw new Error(errMsg(error))
  return data
}

export async function revokeShare(shareId) {
  const { error } = await supabase.from('shared_projects').delete().eq('id', shareId)
  if (error) throw new Error(errMsg(error))
}

export async function getShareByToken(shareToken) {
  const { data, error } = await supabase
    .from('shared_projects')
    .select('*')
    .eq('share_token', shareToken)
    .eq('is_public_link', true)
    .maybeSingle()
  if (error) throw new Error(errMsg(error))
  return data
}

export function buildShareUrl(share) {
  if (!share) return ''
  if (share.share_token) {
    if (share.resource_type === 'notebook') {
      return `${window.location.origin}/editor/${share.resource_id}?share=${share.share_token}`
    }
    return `${window.location.origin}/?share=${share.share_token}`
  }
  if (share.resource_type === 'notebook') {
    return `${window.location.origin}/editor/${share.resource_id}`
  }
  return window.location.origin
}

// ─── Shared folders ─────────────────────────────────────────

export async function getSharedFolders(userId) {
  const { data: owned, error: e1 } = await supabase
    .from('shared_folders')
    .select('*')
    .eq('owner_id', userId)
    .order('updated_at', { ascending: false })
  if (e1) throw new Error(errMsg(e1))

  const { data: memberRows, error: e2 } = await supabase
    .from('shared_folder_members')
    .select('folder_id, permission')
    .eq('user_id', userId)
  if (e2) throw new Error(errMsg(e2))

  const folderIds = (memberRows || []).map((r) => r.folder_id)
  let memberFolders = []
  if (folderIds.length) {
    const { data: folders } = await supabase.from('shared_folders').select('*').in('id', folderIds)
    memberFolders = (folders || [])
      .filter((f) => f.owner_id !== userId)
      .map((f) => ({
        ...f,
        my_permission: memberRows.find((m) => m.folder_id === f.id)?.permission,
      }))
  }

  const ownedWithMembers = await Promise.all((owned || []).map(async (f) => {
    const { data: members } = await supabase
      .from('shared_folder_members')
      .select('id, user_id, permission')
      .eq('folder_id', f.id)
    const ids = (members || []).map((m) => m.user_id)
    let profiles = []
    if (ids.length) {
      const { data: p } = await supabase.from('profiles').select('id, display_name, email, avatar_url').in('id', ids)
      profiles = p || []
    }
    const pmap = Object.fromEntries(profiles.map((p) => [p.id, p]))
    return {
      ...f,
      members: (members || []).map((m) => ({ ...m, profile: pmap[m.user_id] })),
    }
  }))

  return { owned: ownedWithMembers, member: memberFolders }
}

export async function createSharedFolder(ownerId, name) {
  const n = String(name || '').trim()
  if (!n) throw new Error('Nom du dossier requis')
  const { data, error } = await supabase
    .from('shared_folders')
    .insert([{ name: n, owner_id: ownerId }])
    .select()
    .single()
  if (error) throw new Error(errMsg(error))
  return data
}

export async function renameSharedFolder(folderId, name) {
  const n = String(name || '').trim()
  if (!n) throw new Error('Nom requis')
  const { data, error } = await supabase
    .from('shared_folders')
    .update({ name: n, updated_at: new Date().toISOString() })
    .eq('id', folderId)
    .select()
    .single()
  if (error) throw new Error(errMsg(error))
  return data
}

export async function deleteSharedFolder(folderId) {
  const { error } = await supabase.from('shared_folders').delete().eq('id', folderId)
  if (error) throw new Error(errMsg(error))
}

export async function addFolderMember(folderId, userId, permission, inviterName) {
  const { data, error } = await supabase
    .from('shared_folder_members')
    .insert([{ folder_id: folderId, user_id: userId, permission }])
    .select()
    .single()
  if (error) throw new Error(errMsg(error))
  await createNotification({
    userId,
    type: 'folder_invite',
    title: 'Invitation dossier',
    body: `${inviterName || 'Quelqu\'un'} vous a ajouté à un dossier partagé`,
    payload: { folder_id: folderId },
  })
  return data
}

export async function removeFolderMember(memberId) {
  const { error } = await supabase.from('shared_folder_members').delete().eq('id', memberId)
  if (error) throw new Error(errMsg(error))
}

export async function getFolderItems(folderId) {
  const { data, error } = await supabase
    .from('shared_folder_items')
    .select('*')
    .eq('folder_id', folderId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(errMsg(error))
  return data || []
}

export async function addToSharedFolder(folderId, resourceType, resourceId, addedBy) {
  const { data, error } = await supabase
    .from('shared_folder_items')
    .insert([{ folder_id: folderId, resource_type: resourceType, resource_id: resourceId, added_by: addedBy }])
    .select()
    .single()
  if (error) throw new Error(errMsg(error))
  return data
}

export async function removeFromSharedFolder(itemId) {
  const { error } = await supabase.from('shared_folder_items').delete().eq('id', itemId)
  if (error) throw new Error(errMsg(error))
}

// ─── Comments ───────────────────────────────────────────────

export async function getComments(sharedProjectId) {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('shared_project_id', sharedProjectId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(errMsg(error))
  if (!data?.length) return []
  const ids = [...new Set(data.map((c) => c.user_id))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .in('id', ids)
  const map = Object.fromEntries((profiles || []).map((p) => [p.id, p]))
  return data.map((c) => ({ ...c, author: map[c.user_id] }))
}

export async function addComment({ sharedProjectId, userId, content, parentId, mentions = [] }) {
  const text = String(content || '').trim()
  if (!text) throw new Error('Commentaire vide')
  const { data, error } = await supabase
    .from('comments')
    .insert([{
      shared_project_id: sharedProjectId,
      user_id: userId,
      content: text,
      parent_id: parentId || null,
      mentions,
    }])
    .select('*')
    .single()
  if (error) throw new Error(errMsg(error))
  const { data: author } = await supabase.from('profiles').select('id, display_name, avatar_url').eq('id', userId).maybeSingle()

  const { data: share } = await supabase
    .from('shared_projects')
    .select('owner_id, shared_with_user_id, resource_title')
    .eq('id', sharedProjectId)
    .single()

  const notifyId = share?.owner_id === userId ? share?.shared_with_user_id : share?.owner_id
  if (notifyId) {
    await createNotification({
      userId: notifyId,
      type: 'comment',
      title: 'Nouveau commentaire',
      body: `Commentaire sur « ${share?.resource_title || 'un fichier'} »`,
      payload: { shared_project_id: sharedProjectId, comment_id: data.id },
    })
  }
  return { ...data, author: author || null }
}

export async function resolveComment(commentId, resolved) {
  const { error } = await supabase.from('comments').update({ resolved: !!resolved }).eq('id', commentId)
  if (error) throw new Error(errMsg(error))
}

export async function deleteComment(commentId) {
  const { error } = await supabase.from('comments').delete().eq('id', commentId)
  if (error) throw new Error(errMsg(error))
}

export { PERMISSIONS }
