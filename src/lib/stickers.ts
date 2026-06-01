export interface StickerDef {
  id: string
  label: string
  emoji: string
  category: 'marks' | 'study' | 'fun' | 'arrows'
}

export const STICKER_CATALOG: StickerDef[] = [
  // marks
  { id: 'star', label: 'Étoile', emoji: '⭐', category: 'marks' },
  { id: 'check', label: 'OK', emoji: '✅', category: 'marks' },
  { id: 'cross', label: 'Non', emoji: '❌', category: 'marks' },
  { id: 'important', label: 'Important', emoji: '❗', category: 'marks' },
  { id: 'warning', label: 'Attention', emoji: '⚠️', category: 'marks' },
  { id: 'pin', label: 'Épingler', emoji: '📌', category: 'marks' },
  { id: 'flag', label: 'Drapeau', emoji: '🚩', category: 'marks' },
  { id: 'bookmark', label: 'Signet', emoji: '🔖', category: 'marks' },
  // study
  { id: 'question', label: 'Question', emoji: '❓', category: 'study' },
  { id: 'idea', label: 'Idée', emoji: '💡', category: 'study' },
  { id: 'book', label: 'Cours', emoji: '📚', category: 'study' },
  { id: 'brain', label: 'Mémo', emoji: '🧠', category: 'study' },
  { id: 'target', label: 'Objectif', emoji: '🎯', category: 'study' },
  { id: 'pencil', label: 'Note', emoji: '✏️', category: 'study' },
  { id: 'magnify', label: 'Recherche', emoji: '🔍', category: 'study' },
  { id: 'clock', label: 'Délai', emoji: '⏰', category: 'study' },
  // arrows
  { id: 'arrow-r', label: '→', emoji: '➡️', category: 'arrows' },
  { id: 'arrow-l', label: '←', emoji: '⬅️', category: 'arrows' },
  { id: 'arrow-u', label: '↑', emoji: '⬆️', category: 'arrows' },
  { id: 'arrow-d', label: '↓', emoji: '⬇️', category: 'arrows' },
  { id: 'arrow-ne', label: '↗', emoji: '↗️', category: 'arrows' },
  { id: 'arrow-cycle', label: '↻', emoji: '🔄', category: 'arrows' },
  // fun
  { id: 'heart', label: 'Cœur', emoji: '❤️', category: 'fun' },
  { id: 'fire', label: 'Top', emoji: '🔥', category: 'fun' },
  { id: 'smile', label: 'Smile', emoji: '😊', category: 'fun' },
  { id: 'music', label: 'Musique', emoji: '🎵', category: 'fun' },
  { id: 'trophy', label: 'Trophée', emoji: '🏆', category: 'fun' },
  { id: 'rocket', label: 'Rapide', emoji: '🚀', category: 'fun' },
]

export function getSticker(id: string): StickerDef | undefined {
  return STICKER_CATALOG.find((s) => s.id === id)
}
