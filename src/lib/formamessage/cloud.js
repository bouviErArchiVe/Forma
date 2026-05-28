/** FormaMessage — sync Supabase (migration 005) */

import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export async function getCloudMessageStatus(userId) {
  if (!isSupabaseConfigured || !userId) {
    return { available: false, reason: 'Connectez un compte cloud (Supabase) pour la messagerie entre utilisateurs.' }
  }
  const { error } = await supabase.from('forma_conversations').select('id').limit(1)
  if (error) {
    if (error.code === '42P01' || /does not exist|schema cache/i.test(error.message || '')) {
      return {
        available: false,
        reason: 'Tables FormaMessage absentes — exécutez supabase/migrations/005_forma_message.sql',
      }
    }
    return { available: false, reason: 'Messagerie cloud indisponible pour le moment.' }
  }
  return { available: true }
}

export async function fetchCloudConversations(userId) {
  const status = await getCloudMessageStatus(userId)
  if (!status.available) return { ok: false, ...status, conversations: [] }
  const { data, error } = await supabase
    .from('forma_conversation_members')
    .select('conversation_id, forma_conversations(id, type, title, updated_at)')
    .eq('user_id', userId)
  if (error) return { ok: false, reason: error.message, conversations: [] }
  return { ok: true, conversations: (data || []).map((r) => r.forma_conversations).filter(Boolean) }
}

export async function pushMessageToCloud(userId, message) {
  const status = await getCloudMessageStatus(userId)
  if (!status.available) return { ok: false, ...status }
  const { data, error } = await supabase.from('forma_messages').insert([{
    conversation_id: message.conversationId,
    sender_id: userId,
    type: message.type,
    body: message.body,
    attachment: message.attachment,
    reply_to: message.replyTo,
    status: 'sent',
  }]).select().single()
  if (error) return { ok: false, reason: error.message }
  return { ok: true, message: data }
}
