export interface StickerDef {
  id: string
  label: string
  emoji: string
  category: 'marks' | 'study' | 'fun' | 'arrows'
}

export const STICKER_CATALOG: StickerDef[] = [
  { id: 'star', label: 'Étoile', emoji: '⭐', category: 'marks' },
  { id: 'check', label: 'OK', emoji: '✅', category: 'marks' },
  { id: 'cross', label: 'Non', emoji: '❌', category: 'marks' },
  { id: 'important', label: 'Important', emoji: '❗', category: 'marks' },
  { id: 'question', label: 'Question', emoji: '❓', category: 'study' },
  { id: 'idea', label: 'Idée', emoji: '💡', category: 'study' },
  { id: 'book', label: 'Cours', emoji: '📚', category: 'study' },
  { id: 'brain', label: 'Mémo', emoji: '🧠', category: 'study' },
  { id: 'arrow-r', label: '→', emoji: '➡️', category: 'arrows' },
  { id: 'arrow-u', label: '↑', emoji: '⬆️', category: 'arrows' },
  { id: 'heart', label: 'Cœur', emoji: '❤️', category: 'fun' },
  { id: 'fire', label: 'Top', emoji: '🔥', category: 'fun' },
  { id: 'smile', label: 'Smile', emoji: '😊', category: 'fun' },
  { id: 'music', label: 'Musique', emoji: '🎵', category: 'fun' },
]

export function getSticker(id: string): StickerDef | undefined {
  return STICKER_CATALOG.find((s) => s.id === id)
}
