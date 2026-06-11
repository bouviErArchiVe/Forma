import { getFolder } from '../services/library'
import type { Folder } from '../types'

export async function buildFolderPath(folderId: string | null): Promise<Folder[]> {
  const path: Folder[] = []
  let id = folderId
  while (id) {
    const f = await getFolder(id)
    if (!f) break
    path.unshift(f)
    id = f.parentId
  }
  return path
}
