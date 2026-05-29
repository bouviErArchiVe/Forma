import { db } from '../db'
import { persistAudioAsset, putAsset } from '../lib/assets'
import { createId } from '../lib/id'
import type { AudioRecording } from '../types'

export async function getRecordings(notebookId: string): Promise<AudioRecording[]> {
  const all = await db.audio.where('notebookId').equals(notebookId).toArray()
  return all.sort((a, b) => b.createdAt - a.createdAt)
}

export async function saveRecording(
  notebookId: string,
  pageId: string | null,
  blob: Blob,
  duration: number,
  markers: { time: number; pageId: string }[] = [],
  transcript?: string,
): Promise<AudioRecording> {
  const id = createId()
  await putAsset(id, notebookId, blob, blob.type || 'audio/webm')
  const rec: AudioRecording = {
    id,
    notebookId,
    pageId,
    assetId: id,
    duration,
    createdAt: Date.now(),
    markers: markers.length ? markers : pageId ? [{ time: 0, pageId }] : [],
    transcript: transcript?.trim() || undefined,
  }
  await db.audio.add(rec)
  return rec
}

export async function resolveRecordingUrl(rec: AudioRecording): Promise<string> {
  if (rec.dataUrl?.startsWith('data:') || rec.dataUrl?.startsWith('blob:')) {
    return rec.dataUrl
  }
  if (rec.assetId) {
    const { resolveAssetUrl } = await import('../lib/assets')
    return resolveAssetUrl(rec.assetId)
  }
  const hydrated = await persistAudioAsset(rec)
  if (hydrated.dataUrl) return hydrated.dataUrl
  if (hydrated.assetId) {
    const { resolveAssetUrl } = await import('../lib/assets')
    return resolveAssetUrl(hydrated.assetId)
  }
  return ''
}

export async function deleteRecording(id: string): Promise<void> {
  await db.audio.delete(id)
}

