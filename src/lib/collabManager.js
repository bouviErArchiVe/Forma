/** Collaboration temps réel — canal unique par carnet. */

import { supabase } from '@/lib/supabase'

const EDIT_PERMISSIONS = new Set(['edit', 'owner'])
const CURSOR_STALE_MS = 5000

export async function resolveNotebookAccess(notebookId, userId, ownerId) {
  if (!userId || !notebookId) {
    return {
      permission: 'edit',
      readOnly: false,
      forcedReadOnly: false,
      isOwner: true,
      isShared: false,
    }
  }

  if (ownerId && ownerId === userId) {
    return {
      permission: 'owner',
      readOnly: false,
      forcedReadOnly: false,
      isOwner: true,
      isShared: false,
    }
  }

  try {
    const { data, error } = await supabase
      .from('shared_projects')
      .select('permission, owner_id')
      .eq('resource_type', 'notebook')
      .eq('resource_id', notebookId)
      .eq('shared_with_user_id', userId)
      .maybeSingle()

    if (error || !data) {
      return {
        permission: 'edit',
        readOnly: false,
        forcedReadOnly: false,
        isOwner: !ownerId || ownerId === userId,
        isShared: false,
      }
    }

    const canEdit = EDIT_PERMISSIONS.has(data.permission)
    return {
      permission: data.permission,
      readOnly: !canEdit,
      forcedReadOnly: !canEdit,
      isOwner: false,
      isShared: true,
      ownerId: data.owner_id,
    }
  } catch {
    return {
      permission: 'edit',
      readOnly: false,
      forcedReadOnly: false,
      isOwner: true,
      isShared: false,
    }
  }
}

function normalizeCursors(raw, selfUserId) {
  const list = Array.isArray(raw) ? raw : raw ? [raw] : []
  const now = Date.now()
  return list
    .flat()
    .filter(Boolean)
    .map((c) => ({
      userId: c.userId || c.user_id,
      userName: c.userName || c.user_name || '?',
      x: c.x ?? c.cursor?.x ?? 0,
      y: c.y ?? c.cursor?.y ?? 0,
      color: c.color || '#4ade80',
      ts: c.ts || c.timestamp || now,
    }))
    .filter((c) => c.userId && c.userId !== selfUserId && now - c.ts < CURSOR_STALE_MS)
}

export function createCollabChannel({
  notebookId,
  userId,
  userName,
  onCursors,
  onPageUpdate,
}) {
  if (!notebookId || !userId) {
    return { broadcastCursor: () => {}, destroy: () => {} }
  }

  const channel = supabase.channel(`notebook:${notebookId}`, {
    config: { presence: { key: userId } },
  })

  const pushCursors = (payload) => {
    onCursors?.(normalizeCursors(payload, userId))
  }

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      pushCursors(Object.values(state).flat())
    })
    .on('broadcast', { event: 'cursor' }, ({ payload }) => {
      pushCursors(payload)
    })
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'pages',
      filter: `notebook_id=eq.${notebookId}`,
    }, ({ new: page }) => {
      if (page?.updated_at) onPageUpdate?.(page)
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: userId,
          user_name: userName,
          online_at: new Date().toISOString(),
        })
      }
    })

  return {
    broadcastCursor(x, y, color) {
      channel.send({
        type: 'broadcast',
        event: 'cursor',
        payload: {
          userId,
          userName,
          x,
          y,
          color,
          ts: Date.now(),
        },
      })
    },
    destroy() {
      channel.unsubscribe()
    },
  }
}
