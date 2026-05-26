// src/stores/useAppStore.js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { THEMES } from '@/lib/themes'

const useAppStore = create(
  persist(
    (set, get) => ({
      // ── Auth ─────────────────────────────────────────────
      user: null,
      setUser: (user) => set({ user }),

      // ── Theme ────────────────────────────────────────────
      themeId: 'horizon',
      setTheme: (themeId) => set({ themeId }),
      getTheme: () => THEMES.find(t => t.id === get().themeId) || THEMES[0],

      // ── Notebooks ────────────────────────────────────────
      notebooks: [],
      setNotebooks: (notebooks) => set({ notebooks }),
      addNotebook: (nb) => set(s => ({ notebooks: [nb, ...s.notebooks] })),
      updateNotebook: (id, updates) => set(s => ({
        notebooks: s.notebooks.map(n => n.id === id ? { ...n, ...updates } : n)
      })),
      deleteNotebook: (id) => set(s => ({
        notebooks: s.notebooks.filter(n => n.id !== id)
      })),
      toggleStar: (id) => set(s => ({
        notebooks: s.notebooks.map(n => n.id === id ? { ...n, starred: !n.starred } : n)
      })),

      // ── Active Notebook / Editor ──────────────────────────
      activeNotebook: null,
      setActiveNotebook: (nb) => set({ activeNotebook: nb }),

      activePage: 1,
      setActivePage: (p) => set({ activePage: p }),

      // ── Editor State ─────────────────────────────────────
      tool: 'pen',
      setTool: (tool) => set({ tool }),

      color: '#1c1c24',
      setColor: (color) => set({ color }),

      brushPreset: 'stylo',
      setBrushPreset: (brushPreset) => set({ brushPreset }),

      customBrushSize: 3,
      setCustomBrushSize: (s) => set({ customBrushSize: s }),

      colorPalette: 'Basique',
      setColorPalette: (p) => set({ colorPalette: p }),

      hlColor: '#ffff00',
      setHlColor: (c) => set({ hlColor: c }),

      hlPalette: 'Standards',
      setHlPalette: (p) => set({ hlPalette: p }),

      unitSystem: 'metric',
      setUnitSystem: (u) => set({ unitSystem: u }),

      scale: '1:50',
      setScale: (s) => set({ scale: s }),

      zoom: 0.85,
      setZoom: (z) => set({ zoom: Math.max(0.25, Math.min(3, z)) }),

      showLibrary: false,
      setShowLibrary: (v) => set({ showLibrary: v }),

      showLayers: false,
      setShowLayers: (v) => set({ showLayers: v }),

      layers: [
        { id: 'sketch', name: 'Esquisse', visible: true, locked: false, opacity: 1 },
        { id: 'annotations', name: 'Annotations', visible: true, locked: false, opacity: 1 },
        { id: 'structure', name: 'Structure', visible: true, locked: false, opacity: 1 },
      ],
      setLayers: (layers) => set({ layers }),
      addLayer: () => set(s => ({
        layers: [...s.layers, { id: Date.now().toString(), name: `Calque ${s.layers.length + 1}`, visible: true, locked: false, opacity: 1 }]
      })),
      toggleLayerVisibility: (id) => set(s => ({
        layers: s.layers.map(l => l.id === id ? { ...l, visible: !l.visible } : l)
      })),
      toggleLayerLock: (id) => set(s => ({
        layers: s.layers.map(l => l.id === id ? { ...l, locked: !l.locked } : l)
      })),

      // ── Placed structural elements ────────────────────────
      placedElements: [],
      addElement: (el) => set(s => ({ placedElements: [...s.placedElements, el] })),
      moveElement: (id, x, y) => set(s => ({
        placedElements: s.placedElements.map(e => e.id === id ? { ...e, x, y } : e)
      })),
      deleteElement: (id) => set(s => ({
        placedElements: s.placedElements.filter(e => e.id !== id)
      })),
      selectedElementId: null,
      setSelectedElementId: (id) => set({ selectedElementId: id }),

      // ── Imported files ────────────────────────────────────
      importedFiles: [],
      addImportedFile: (f) => set(s => ({ importedFiles: [...s.importedFiles, f] })),
      moveImportedFile: (id, x, y) => set(s => ({
        importedFiles: s.importedFiles.map(f => f.id === id ? { ...f, x, y } : f)
      })),
      resizeImportedFile: (id, w, h) => set(s => ({
        importedFiles: s.importedFiles.map(f => f.id === id ? { ...f, w, h } : f)
      })),
      deleteImportedFile: (id) => set(s => ({
        importedFiles: s.importedFiles.filter(f => f.id !== id)
      })),

      // ── Collab cursors ────────────────────────────────────
      remoteCursors: [],
      setRemoteCursors: (cursors) => set({ remoteCursors: cursors }),

      // ── Ambiance ─────────────────────────────────────────
      animationsEnabled: true,
      setAnimationsEnabled: (v) => set({ animationsEnabled: v }),
      bgEnabled: false,
      setBgEnabled: (v) => set({ bgEnabled: v }),
      spotifyUrl: '',
      setSpotifyUrl: (v) => set({ spotifyUrl: v }),

      // ── Notifications ─────────────────────────────────────
      notifications: [],
      addNotification: (msg, type = 'info') => {
        const id = Date.now()
        set(s => ({ notifications: [...s.notifications, { id, msg, type }] }))
        setTimeout(() => set(s => ({ notifications: s.notifications.filter(n => n.id !== id) })), 3500)
      },
    }),
    {
      name: 'forma-store',
      partialize: (state) => ({
        themeId: state.themeId,
        unitSystem: state.unitSystem,
        scale: state.scale,
        brushPreset: state.brushPreset,
        colorPalette: state.colorPalette,
        hlPalette: state.hlPalette,
        color: state.color,
        hlColor: state.hlColor,
        zoom: state.zoom,
        animationsEnabled: state.animationsEnabled,
        bgEnabled: state.bgEnabled,
        spotifyUrl: state.spotifyUrl,
      }),
    }
  )
)

export default useAppStore
