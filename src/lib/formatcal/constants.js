/** FORMATCAL — thème et constantes */

import { FORMA_THEME_VARS } from '@/lib/formaShell'

export const FC_DARK = {
  ...FORMA_THEME_VARS,
}

export const FC_VIEWS = [
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

export const FC_CATEGORIES = [
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
  { id: 'reminder', label: 'Rappel', color: '#888', icon: '🔔' },
]

export const FC_PRESETS = [
  { id: 'deadline', label: 'Remise de projet', category: 'deadline', icon: '📅', durationMin: 60 },
  { id: 'study', label: 'Étudier', category: 'school', icon: '📚', durationMin: 90 },
  { id: 'read', label: 'Lire pages', category: 'reading', icon: '📖', durationMin: 45 },
  { id: 'homework', label: 'Faire devoir', category: 'homework', icon: '✏', durationMin: 60 },
  { id: 'meeting', label: 'Réunion', category: 'meeting', icon: '🤝', durationMin: 60 },
  { id: 'presentation', label: 'Présentation', category: 'project', icon: '🎤', durationMin: 90 },
  { id: 'plans', label: 'Corriger plans', category: 'architecture', icon: '📐', durationMin: 120 },
  { id: 'team', label: 'Travail équipe', category: 'project', icon: '👥', durationMin: 120 },
  { id: 'break', label: 'Pause', category: 'personal', icon: '☕', durationMin: 15 },
  { id: 'revision', label: 'Révision', category: 'exam', icon: '📝', durationMin: 90 },
  { id: 'final', label: 'Rendu final', category: 'deadline', icon: '🏁', durationMin: 60 },
  { id: 'jury', label: 'Jury / Critique', category: 'architecture', icon: '🏛', durationMin: 180 },
  { id: 'studio', label: 'Session studio', category: 'architecture', icon: '🖊', durationMin: 240 },
  { id: 'site', label: 'Visite chantier', category: 'architecture', icon: '🏗', durationMin: 180 },
]

export const FC_PRIORITIES = [
  { id: 'low', label: 'Basse', color: '#888' },
  { id: 'normal', label: 'Normale', color: FC_DARK.accent },
  { id: 'high', label: 'Haute', color: FC_DARK.warning },
  { id: 'urgent', label: 'Urgente', color: FC_DARK.danger },
]

export const FC_STATUSES = [
  { id: 'todo', label: 'À faire' },
  { id: 'in_progress', label: 'En cours' },
  { id: 'done', label: 'Terminé' },
  { id: 'late', label: 'En retard' },
]

export const FC_REMINDER_OFFSETS = [
  { id: 5, label: '5 min avant' },
  { id: 15, label: '15 min avant' },
  { id: 60, label: '1 h avant' },
  { id: 1440, label: '1 jour avant' },
]

export const FC_AUTOSAVE_MS = 500
