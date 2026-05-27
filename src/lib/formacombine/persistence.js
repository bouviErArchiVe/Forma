import { createSafePersistStorage } from '@/lib/storage'
import { createProject } from './model'

const KEY = 'forma-combine'

function readAll() {
  try {
    const raw = createSafePersistStorage().getItem(KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function writeAll(list) {
  createSafePersistStorage().setItem(KEY, JSON.stringify(list))
}

export function listProjects() {
  return readAll().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
}

export function getProject(id) {
  return readAll().find((p) => p.id === id) || null
}

export function saveProject(project) {
  const list = readAll()
  const idx = list.findIndex((p) => p.id === project.id)
  const next = { ...project, updatedAt: Date.now() }
  if (idx >= 0) list[idx] = next
  else list.unshift(next)
  writeAll(list)
  return next
}

export function createAndSaveProject(name) {
  return saveProject(createProject(name))
}

export function deleteProject(id) {
  writeAll(readAll().filter((p) => p.id !== id))
}

let timer = null
export function autosaveProject(project, delay = 500) {
  return new Promise((resolve) => {
    clearTimeout(timer)
    timer = setTimeout(() => resolve(saveProject(project)), delay)
  })
}
