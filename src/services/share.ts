import { db } from '../db'
import { createId } from '../lib/id'
import type { ShareLink } from '../types'

export async function createShareLink(
  notebookId: string,
  permission: 'view' | 'edit' = 'view',
): Promise<ShareLink> {
  const link: ShareLink = {
    id: createId(),
    notebookId,
    token: createId().replace(/-/g, '').slice(0, 16),
    permission,
    createdAt: Date.now(),
  }
  await db.shareLinks.add(link)
  return link
}

export async function getShareLinks(notebookId: string): Promise<ShareLink[]> {
  return db.shareLinks.where('notebookId').equals(notebookId).toArray()
}

export function shareUrl(token: string): string {
  return `${window.location.origin}/share/${token}`
}

export async function deleteShareLink(id: string): Promise<void> {
  await db.shareLinks.delete(id)
}
