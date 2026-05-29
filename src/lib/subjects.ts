import { db } from '../db'
import { createId } from './id'

export interface Subject {
  id: string
  label: string
  color: string
  emoji: string
  custom?: boolean
}

const SETTINGS_KEY = 'library-subjects'

export const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'arch', label: 'Architecture', color: '#c8622a', emoji: '🏛' },
  { id: 'struct', label: 'Structure', color: '#3d6b8c', emoji: '⚙' },
  { id: 'urbanism', label: 'Urbanisme', color: '#5a7a3d', emoji: '🏙' },
  { id: 'history', label: 'Histoire Archi', color: '#7c5c3d', emoji: '📜' },
  { id: 'english', label: 'Anglais', color: '#4a7c59', emoji: '🇬🇧' },
  { id: 'french', label: 'Français', color: '#8c3d6b', emoji: '📖' },
  { id: 'math', label: 'Mathématiques', color: '#3d5c8c', emoji: '📐' },
  { id: 'physics', label: 'Physique', color: '#5c3d8c', emoji: '⚡' },
  { id: 'chemistry', label: 'Chimie', color: '#3d8c5c', emoji: '🧪' },
  { id: 'compute', label: 'Informatique', color: '#2a6b8c', emoji: '💻' },
  { id: 'art', label: 'Arts Plastiques', color: '#8c3d3d', emoji: '🎨' },
  { id: 'music', label: 'Musique', color: '#6b3d8c', emoji: '🎵' },
  { id: 'economy', label: 'Économie', color: '#6b8c3d', emoji: '📊' },
  { id: 'law', label: 'Droit', color: '#8c6b3d', emoji: '⚖' },
  { id: 'env', label: 'Environnement', color: '#2d6a4f', emoji: '🌱' },
  { id: 'design', label: 'Design', color: '#6b3d6b', emoji: '✏' },
  { id: 'geotech', label: 'Géotechnique', color: '#5c7a3d', emoji: '🪨' },
  { id: 'thermal', label: 'Thermique', color: '#e65100', emoji: '🌡' },
  { id: 'acoustic', label: 'Acoustique', color: '#0277bd', emoji: '🔊' },
  { id: 'bim', label: 'BIM / Maquette', color: '#4527a0', emoji: '🏗' },
]

export const FOLDER_EMOJIS = ['📁', '📂', '🗂️', '🏛', '🏗', '📐', '🎨', '📚', '⭐', '🔥', '💎', '🌿', '🎯', '📌']
export const FOLDER_COLORS = ['#c8622a', '#3d6b8c', '#4a7c59', '#8c3d6b', '#4527a0', '#e65100', '#0277bd', '#2d6a4f']

export async function loadSubjects(): Promise<Subject[]> {
  try {
    const row = await db.settings.get(SETTINGS_KEY)
    if (!row?.value) return [...DEFAULT_SUBJECTS]
    const parsed = JSON.parse(row.value) as Subject[]
    if (!Array.isArray(parsed) || !parsed.length) return [...DEFAULT_SUBJECTS]
    return parsed
  } catch {
    return [...DEFAULT_SUBJECTS]
  }
}

export async function saveSubjects(subjects: Subject[]): Promise<void> {
  await db.settings.put({ key: SETTINGS_KEY, value: JSON.stringify(subjects) })
}

export async function addCustomSubject(label: string, emoji: string, color: string): Promise<Subject> {
  const subjects = await loadSubjects()
  const subject: Subject = {
    id: createId(),
    label: label.trim(),
    emoji,
    color,
    custom: true,
  }
  subjects.push(subject)
  await saveSubjects(subjects)
  return subject
}

export function findSubject(subjects: Subject[], id?: string | null): Subject | undefined {
  if (!id) return undefined
  return subjects.find((s) => s.id === id)
}

export function subjectLabel(subjects: Subject[], id?: string | null): string {
  return findSubject(subjects, id)?.label ?? ''
}
