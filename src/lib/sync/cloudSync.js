/** FormaSync — synchronisation cloud Supabase */

import { supabase } from '@/lib/supabase'
import { isLocalNotebookId } from '@/lib/projectPersistence'

export async function syncNotebookPageToCloud(pageId, notebookId, pageRecord) {
  if (!pageId || !notebookId || isLocalNotebookId(notebookId)) return false
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return false

  const now = new Date().toISOString()
  const { error } = await supabase
    .from('pages')
    .update({
      canvas_data: pageRecord.canvas_data,
      elements: pageRecord.elements,
      updated_at: now,
    })
    .eq('id', pageId)
  if (error) throw error

  await supabase.from('notebooks').update({ updated_at: now }).eq('id', notebookId)
  return true
}

export async function saveCloudSnapshot({ userId, resourceType, resourceId, payload, label }) {
  if (!userId) return null
  const { data, error } = await supabase.from('resource_snapshots').insert([{
    user_id: userId,
    resource_type: resourceType,
    resource_id: resourceId,
    label: label || null,
    payload,
  }]).select().single()
  if (error) {
    console.warn('Cloud snapshot failed:', error.message)
    return null
  }
  return data
}

export async function listCloudSnapshots(userId, resourceType, resourceId, limit = 20) {
  if (!userId) return []
  const { data, error } = await supabase
    .from('resource_snapshots')
    .select('id, label, created_at, resource_type, resource_id')
    .eq('user_id', userId)
    .eq('resource_type', resourceType)
    .eq('resource_id', resourceId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) return []
  return data || []
}

export async function getCloudSnapshot(snapshotId) {
  const { data, error } = await supabase
    .from('resource_snapshots')
    .select('*')
    .eq('id', snapshotId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function restoreCloudSnapshot(snapshotId) {
  const snap = await getCloudSnapshot(snapshotId)
  if (!snap?.payload) throw new Error('Snapshot introuvable')
  return snap
}
