import type { FormaCalCategory, FormaCalViewId } from '../../types'

export const FC_VIEWS: { id: FormaCalViewId; label: string }[] = [
  { id: 'day', label: 'Jour' },
  { id: 'week', label: 'Semaine' },
  { id: 'month', label: 'Mois' },
  { id: 'year', label: 'Année' },
  { id: 'planning', label: 'Planning' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'agenda', label: 'Agenda' },
  { id: 'project', label: 'Projets' },
  { id: 'deadlines', label: 'Remises' },
]

export const FC_CATEGORIES: {
  id: FormaCalCategory
  label: string
  color: string
  icon: string
}[] = [
  { id: 'school', label: 'École', color: '#5b9fd4', icon: '🎓' },
  { id: 'project', label: 'Projet', color: '#c8622a', icon: '📐' },
  { id: 'architecture', label: 'Architecture', color: '#3d6b8c', icon: '🏛' },
  { id: 'work', label: 'Travail', color: '#7c5c3d', icon: '💼' },
  { id: 'personal', label: 'Personnel', color: '#6b3d8c', icon: '👤' },
  { id: 'exam', label: 'Examen', color: '#e94560', icon: '📝' },
  { id: 'deadline', label: 'Remise', color: '#f5a623', icon: '📅' },
  { id: 'reading', label: 'Lecture', color: '#4a7c59', icon: '📖' },
  { id: 'meeting', label: 'Réunion', color: '#2196f3', icon: '🤝' },
  { id: 'homework', label: 'Devoir', color: '#00bcd4', icon: '✏' },
  { id: 'reminder', label: 'Rappel', color: '#888888', icon: '🔔' },
]

export const FC_PRESETS = [
  { id: 'deadline', label: 'Remise de projet', category: 'deadline' as const, icon: '📅', durationMin: 60 },
  { id: 'study', label: 'Étudier', category: 'school' as const, icon: '📚', durationMin: 90 },
  { id: 'read', label: 'Lire pages', category: 'reading' as const, icon: '📖', durationMin: 45 },
  { id: 'homework', label: 'Faire devoir', category: 'homework' as const, icon: '✏', durationMin: 60 },
  { id: 'meeting', label: 'Réunion', category: 'meeting' as const, icon: '🤝', durationMin: 60 },
  { id: 'presentation', label: 'Présentation', category: 'project' as const, icon: '🎤', durationMin: 90 },
  { id: 'plans', label: 'Corriger plans', category: 'architecture' as const, icon: '📐', durationMin: 120 },
  { id: 'team', label: 'Travail équipe', category: 'project' as const, icon: '👥', durationMin: 120 },
  { id: 'break', label: 'Pause', category: 'personal' as const, icon: '☕', durationMin: 15 },
  { id: 'revision', label: 'Révision', category: 'exam' as const, icon: '📝', durationMin: 90 },
  { id: 'final', label: 'Rendu final', category: 'deadline' as const, icon: '🏁', durationMin: 60 },
  { id: 'jury', label: 'Jury / Critique', category: 'architecture' as const, icon: '🏛', durationMin: 180 },
  { id: 'studio', label: 'Session studio', category: 'architecture' as const, icon: '🖊', durationMin: 240 },
  { id: 'site', label: 'Visite chantier', category: 'architecture' as const, icon: '🏗', durationMin: 180 },
]

export const FC_PRIORITIES = [
  { id: 'low' as const, label: 'Basse', color: '#888888' },
  { id: 'normal' as const, label: 'Normale', color: '#c8622a' },
  { id: 'high' as const, label: 'Haute', color: '#f5a623' },
  { id: 'urgent' as const, label: 'Urgente', color: '#e94560' },
]

export const FC_STATUSES = [
  { id: 'todo' as const, label: 'À faire' },
  { id: 'in_progress' as const, label: 'En cours' },
  { id: 'done' as const, label: 'Terminé' },
  { id: 'late' as const, label: 'En retard' },
]

export const FC_REMINDER_OFFSETS = [
  { id: 5, label: '5 min avant' },
  { id: 15, label: '15 min avant' },
  { id: 60, label: '1 h avant' },
  { id: 1440, label: '1 jour avant' },
]

export const DEFAULT_FC_SETTINGS = {
  weekStartsOn: 1 as const,
  defaultView: 'month' as const,
  defaultReminder: 15,
}
