/**
 * FormAI — persistance des conversations (table Dexie `aiConversations`).
 *
 * CRUD complet sur les conversations IA : création, listing (tri/filtre/
 * recherche), ajout de messages avec titre automatique, favoris, archivage
 * et suppression. Les contrats viennent de src/services/ai/types.ts.
 *
 * Note index : `favorite` et `archived` sont des booléens, non indexables
 * par IndexedDB — le filtrage se fait en mémoire (volumes faibles).
 */

import { db } from '../../db'
import { createId } from '../../lib/id'
import type { AIConversation, StoredChatMessage } from './types'

/** Titre par défaut d'une conversation fraîchement créée. */
export const NEW_CONVERSATION_TITLE = 'Nouvelle conversation'

/** Agent actif par défaut. */
export const DEFAULT_AGENT_ID = 'general'

/** Longueur max du titre auto dérivé du premier message utilisateur. */
const AUTO_TITLE_MAX_LENGTH = 50

export interface ListConversationsOptions {
  /** Statut d'archivage des conversations retournées (false par défaut). */
  archived?: boolean
  /** Ne retourner que les favorites. */
  favoritesOnly?: boolean
  /** Recherche insensible à la casse dans le titre ET le contenu des messages. */
  query?: string
}

/** Crée une nouvelle conversation vide et la persiste. */
export async function createConversation(agentId: string = DEFAULT_AGENT_ID): Promise<AIConversation> {
  const now = Date.now()
  const conversation: AIConversation = {
    id: createId(),
    title: NEW_CONVERSATION_TITLE,
    agentId,
    messages: [],
    createdAt: now,
    updatedAt: now,
    favorite: false,
    archived: false,
  }
  await db.aiConversations.add(conversation)
  return conversation
}

/** Retourne une conversation par id, ou undefined si absente. */
export async function getConversation(id: string): Promise<AIConversation | undefined> {
  return db.aiConversations.get(id)
}

/**
 * Liste les conversations triées par updatedAt décroissant.
 * Par défaut, seules les conversations non archivées sont retournées.
 */
export async function listConversations(
  opts: ListConversationsOptions = {},
): Promise<AIConversation[]> {
  const archived = opts.archived ?? false
  // Tri via l'index updatedAt ; filtres booléens en mémoire (non indexables).
  const all = await db.aiConversations.orderBy('updatedAt').reverse().toArray()
  let list = all.filter((c) => c.archived === archived)
  if (opts.favoritesOnly) {
    list = list.filter((c) => c.favorite)
  }
  const query = opts.query?.trim().toLowerCase()
  if (query) {
    list = list.filter(
      (c) =>
        c.title.toLowerCase().includes(query) ||
        c.messages.some((m) => m.content.toLowerCase().includes(query)),
    )
  }
  return list
}

/**
 * Ajoute un message à une conversation (id généré ici) et met à jour updatedAt.
 * Si le titre est encore le titre par défaut et que le message vient de
 * l'utilisateur, le titre devient les 50 premiers caractères du contenu.
 * Retourne la conversation mise à jour, ou undefined si elle n'existe pas.
 */
export async function appendMessage(
  conversationId: string,
  message: Omit<StoredChatMessage, 'id'>,
): Promise<AIConversation | undefined> {
  const conversation = await db.aiConversations.get(conversationId)
  if (!conversation) return undefined

  const stored: StoredChatMessage = { ...message, id: createId() }
  let title = conversation.title
  if (title === NEW_CONVERSATION_TITLE && stored.role === 'user') {
    const candidate = stored.content.trim().slice(0, AUTO_TITLE_MAX_LENGTH)
    if (candidate) title = candidate
  }

  const updated: AIConversation = {
    ...conversation,
    title,
    messages: [...conversation.messages, stored],
    updatedAt: Date.now(),
  }
  await db.aiConversations.put(updated)
  return updated
}

/** Renomme une conversation (met à jour updatedAt). */
export async function renameConversation(id: string, title: string): Promise<void> {
  await db.aiConversations.update(id, { title, updatedAt: Date.now() })
}

/**
 * Inverse le statut favori.
 * updatedAt n'est volontairement pas modifié : marquer un favori ne doit pas
 * faire remonter la conversation en tête de liste.
 */
export async function toggleFavorite(id: string): Promise<void> {
  const conversation = await db.aiConversations.get(id)
  if (!conversation) return
  await db.aiConversations.update(id, { favorite: !conversation.favorite })
}

/** Archive une conversation (masquée du listing par défaut). */
export async function archiveConversation(id: string): Promise<void> {
  await db.aiConversations.update(id, { archived: true })
}

/** Désarchive une conversation. */
export async function unarchiveConversation(id: string): Promise<void> {
  await db.aiConversations.update(id, { archived: false })
}

/** Supprime définitivement une conversation. */
export async function deleteConversation(id: string): Promise<void> {
  await db.aiConversations.delete(id)
}

/** Supprime un message d'une conversation (met à jour updatedAt). */
export async function deleteMessage(conversationId: string, messageId: string): Promise<void> {
  const conversation = await db.aiConversations.get(conversationId)
  if (!conversation) return
  const messages = conversation.messages.filter((m) => m.id !== messageId)
  if (messages.length === conversation.messages.length) return
  await db.aiConversations.put({ ...conversation, messages, updatedAt: Date.now() })
}

/** Vide entièrement la table des conversations (utilitaire). */
export async function clearConversations(): Promise<void> {
  await db.aiConversations.clear()
}
