import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useMoodboardStore = create(
  persist(
    (set, get) => ({
      boards: [],
      images: [],

      addBoard: (name, emoji, color) => {
        const board = { id: Date.now().toString(), name, emoji, color, archived: false, created_at: new Date().toISOString() }
        set(s => ({ boards: [board, ...s.boards] }))
        return board
      },

      updateBoard: (id, updates) => set(s => ({
        boards: s.boards.map(b => b.id === id ? { ...b, ...updates } : b)
      })),

      deleteBoard: (id) => set(s => ({
        boards: s.boards.filter(b => b.id !== id),
        images: s.images.filter(i => i.board_id !== id)
      })),

      archiveBoard: (id) => set(s => ({
        boards: s.boards.map(b => b.id === id ? { ...b, archived: !b.archived } : b)
      })),

      addImage: (boardId, data) => {
        const imgs = get().images.filter(i => i.board_id === boardId)
        const maxZ = imgs.reduce((m, i) => Math.max(m, i.zIndex || 0), 0)
        const img = {
          id: Date.now().toString(),
          board_id: boardId,
          url: '',
          name: '',
          tags: [],
          description: '',
          starred: false,
          x: 40,
          y: 40,
          w: 260,
          h: 180,
          rotation: 0,
          zIndex: maxZ + 1,
          created_at: new Date().toISOString(),
          ...data
        }
        set(s => ({ images: [...s.images, img] }))
        return img
      },

      updateImage: (id, updates) => set(s => ({
        images: s.images.map(i => i.id === id ? { ...i, ...updates } : i)
      })),

      deleteImage: (id) => set(s => ({
        images: s.images.filter(i => i.id !== id)
      })),

      toggleStar: (id) => set(s => ({
        images: s.images.map(i => i.id === id ? { ...i, starred: !i.starred } : i)
      })),

      bringToFront: (id, boardId) => {
        const imgs = get().images.filter(i => i.board_id === boardId)
        const maxZ = imgs.reduce((m, i) => Math.max(m, i.zIndex || 0), 0)
        set(s => ({
          images: s.images.map(i => i.id === id ? { ...i, zIndex: maxZ + 1 } : i)
        }))
      },
    }),
    {
      name: 'forma-moodboard',
      partialize: (state) => ({
        boards: state.boards,
        images: state.images.map(img => ({
          ...img,
          url: typeof img.url === 'string' ? img.url.slice(0, 200000) : img.url
        }))
      })
    }
  )
)

export default useMoodboardStore
