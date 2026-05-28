import { create } from 'zustand'
import { normalizeSpotifyUrl, spotifyLinkLabel, SPOTIFY_LINK_MAX } from '@/lib/spotifyLinks'
import { persist, createJSONStorage } from 'zustand/middleware'
import { THEMES } from '@/lib/themes'
import { applyAppearanceToTheme } from '@/lib/appearance'
import { normalizeCanvasTextFont } from '@/lib/fontUtils'
import { normalizeDictationLang } from '@/lib/speechRecognition'
import { createSafePersistStorage } from '@/lib/storage'
import {
  createVisualProfile as buildVisualProfile,
  duplicateVisualProfile as cloneVisualProfile,
  applyVisualProfileSettings,
  seedVisualProfiles,
} from '@/lib/visualProfiles'
import { loadLocalProfile, saveLocalProfile, clearLocalProfile } from '@/lib/localUser'

const useAppStore = create(
  persist(
    (set, get) => ({
      // ── Auth ─────────────────────────────────────────────
      user: null,
      setUser: (user) => set({ user }),

      // ── Theme ────────────────────────────────────────────
      themeId: 'horizon',
      setTheme: (themeId) => set({ themeId }),
      appearanceMode: 'dark',
      setAppearanceMode: (appearanceMode) => set({ appearanceMode }),
      getTheme: () => {
        const base = THEMES.find(t => t.id === get().themeId) || THEMES[0]
        return applyAppearanceToTheme(base, get().appearanceMode)
      },

      // ── Global font (app-wide override) ───────────────────
      appFont: '',
      setAppFont: (appFont) => set({ appFont }),

      // ── Canvas text font (outil Texte dans l'éditeur) ─────
      canvasTextFont: 'Patrick Hand',
      setCanvasTextFont: (canvasTextFont) => set({ canvasTextFont: normalizeCanvasTextFont(canvasTextFont) }),

      libraryView: 'grid',
      setLibraryView: (libraryView) => set({ libraryView: ['grid', 'list', 'timeline'].includes(libraryView) ? libraryView : 'grid' }),
      librarySort: 'updated',
      setLibrarySort: (librarySort) => set({ librarySort }),

      folderView: 'grid',
      setFolderView: (folderView) => set({ folderView: ['grid', 'list', 'details'].includes(folderView) ? folderView : 'grid' }),
      folderSort: 'updated',
      setFolderSort: (folderSort) => set({ folderSort: ['updated', 'created', 'name', 'type', 'size', 'manual'].includes(folderSort) ? folderSort : 'updated' }),
      folderIconSize: 64,
      setFolderIconSize: (folderIconSize) => set({ folderIconSize: [48, 64, 80, 96].includes(folderIconSize) ? folderIconSize : 64 }),
      folderContentFilter: 'all',
      setFolderContentFilter: (folderContentFilter) => set({ folderContentFilter: ['all', 'folders', 'notebooks'].includes(folderContentFilter) ? folderContentFilter : 'all' }),

      pendingFormulaNote: null,
      setPendingFormulaNote: (pendingFormulaNote) => set({ pendingFormulaNote }),

      pendingHubPublish: null,
      setPendingHubPublish: (pendingHubPublish) => set({ pendingHubPublish }),

      pendingSpreadsheetInsert: null,
      setPendingSpreadsheetInsert: (pendingSpreadsheetInsert) => set({ pendingSpreadsheetInsert }),

      pendingDocInsert: null,
      setPendingDocInsert: (pendingDocInsert) => set({ pendingDocInsert }),

      easterEggsEnabled: true,
      setEasterEggsEnabled: (easterEggsEnabled) => set({ easterEggsEnabled }),
      easterEggBurst: null,
      triggerEasterEgg: (type) => set({ easterEggBurst: { type, id: Date.now() } }),
      clearEasterEgg: () => set({ easterEggBurst: null }),

      translationSourceLang: 'en',
      translationTargetLang: 'fr',
      translationMode: 'standard',
      setTranslationSourceLang: (translationSourceLang) => set({ translationSourceLang }),
      setTranslationTargetLang: (translationTargetLang) => set({ translationTargetLang }),
      setTranslationMode: (translationMode) => set({ translationMode }),

      pendingTranslationSourceText: '',
      setPendingTranslationSourceText: (pendingTranslationSourceText) => set({
        pendingTranslationSourceText: String(pendingTranslationSourceText || '').slice(0, 12000),
      }),
      consumePendingTranslationSourceText: () => {
        const text = get().pendingTranslationSourceText
        set({ pendingTranslationSourceText: '' })
        return text
      },

      pendingDicoWord: '',
      setPendingDicoWord: (pendingDicoWord) => set({
        pendingDicoWord: String(pendingDicoWord || '').trim().slice(0, 120),
      }),
      consumePendingDicoWord: () => {
        const word = get().pendingDicoWord
        set({ pendingDicoWord: '' })
        return word
      },

      dictationLang: 'fr-FR',
      setDictationLang: (dictationLang) => set({ dictationLang: normalizeDictationLang(dictationLang) }),

      lastActiveDate: '',
      activityStreak: 0,
      recordAppActivity: () => {
        const today = new Date().toISOString().slice(0, 10)
        const { lastActiveDate, activityStreak } = get()
        if (lastActiveDate === today) return activityStreak || 1
        let next = 1
        if (lastActiveDate) {
          const y = new Date()
          y.setDate(y.getDate() - 1)
          const yesterday = y.toISOString().slice(0, 10)
          if (lastActiveDate === yesterday) next = (activityStreak || 0) + 1
        }
        set({ lastActiveDate: today, activityStreak: next })
        return next
      },

      customProfiles: [],
      addCustomProfile: (profile) => set((s) => ({
        customProfiles: [profile, ...s.customProfiles.filter((p) => p.id !== profile.id)],
      })),
      removeCustomProfile: (id) => set((s) => ({
        customProfiles: s.customProfiles.filter((p) => p.id !== id),
      })),

      // ── Profil local (pseudo sans backend) ───────────────
      localProfile: null,
      setLocalProfile: (localProfile) => {
        const saved = localProfile ? saveLocalProfile(localProfile) : null
        if (!localProfile) clearLocalProfile()
        set({ localProfile: saved })
        return saved
      },
      initLocalProfile: () => {
        const loaded = loadLocalProfile()
        if (loaded) set({ localProfile: loaded })
        return loaded
      },

      // ── Profils d'apparence visuelle ────────────────────
      visualProfiles: [],
      activeVisualProfileId: null,
      initVisualProfiles: () => set((s) => {
        const seeded = seedVisualProfiles(s.visualProfiles)
        const defaultId = seeded.find((p) => p.isDefault)?.id || seeded[0]?.id || null
        return {
          visualProfiles: seeded,
          activeVisualProfileId: s.activeVisualProfileId || defaultId,
        }
      }),
      createVisualProfile: (name) => {
        const profile = buildVisualProfile(name, get())
        set((s) => ({ visualProfiles: [profile, ...s.visualProfiles] }))
        return profile
      },
      renameVisualProfile: (id, name) => set((s) => ({
        visualProfiles: s.visualProfiles.map((p) => (
          p.id === id ? { ...p, name: name.trim().slice(0, 48) } : p
        )),
      })),
      duplicateVisualProfile: (id) => {
        const src = get().visualProfiles.find((p) => p.id === id)
        if (!src) return null
        const copy = cloneVisualProfile(src)
        set((s) => ({ visualProfiles: [copy, ...s.visualProfiles] }))
        return copy
      },
      applyVisualProfile: (id) => {
        const profile = get().visualProfiles.find((p) => p.id === id)
        if (!profile) return false
        applyVisualProfileSettings(profile, get())
        set({ activeVisualProfileId: id })
        return true
      },
      deleteVisualProfile: (id) => set((s) => ({
        visualProfiles: s.visualProfiles.filter((p) => p.id !== id),
        activeVisualProfileId: s.activeVisualProfileId === id ? null : s.activeVisualProfileId,
      })),
      setDefaultVisualProfile: (id) => set((s) => ({
        visualProfiles: s.visualProfiles.map((p) => ({ ...p, isDefault: p.id === id })),
        activeVisualProfileId: id,
      })),
      saveCurrentAsVisualProfile: (name) => {
        const profile = buildVisualProfile(name, get())
        set((s) => ({ visualProfiles: [profile, ...s.visualProfiles], activeVisualProfileId: profile.id }))
        return profile
      },

      // ── Notebooks ────────────────────────────────────────
      notebooks: [],
      setNotebooks: (notebooks) => set({ notebooks }),
      addNotebook: (nb) => set(s => ({ notebooks: [nb, ...s.notebooks] })),
      updateNotebook: (id, updates) => set(s => ({
        notebooks: s.notebooks.map(n => n.id === id ? { ...n, ...updates } : n),
        activeNotebook: s.activeNotebook?.id === id
          ? { ...s.activeNotebook, ...updates }
          : s.activeNotebook,
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
      setRemoteCursors: (cursorsOrFn) => set((s) => ({
        remoteCursors: typeof cursorsOrFn === 'function'
          ? cursorsOrFn(Array.isArray(s.remoteCursors) ? s.remoteCursors : [])
          : (Array.isArray(cursorsOrFn) ? cursorsOrFn : []),
      })),

      // ── Ambiance ─────────────────────────────────────────
      animationsEnabled: true,
      setAnimationsEnabled: (v) => set({ animationsEnabled: v }),
      animType: 'pencil',
      setAnimType: (v) => set({ animType: v }),
      animSpeed: 1,           // multiplier: 0.3 | 0.6 | 1 | 1.8 | 3
      setAnimSpeed: (v) => set({ animSpeed: v }),
      bgId: 'villa-savoye',
      setBgId: (v) => set({ bgId: v }),
      customBg: '',           // data URL or '' for user-uploaded background
      setCustomBg: (v) => set({ customBg: v }),
      spotifyLinks: [],
      activeSpotifyId: null,
      addSpotifyLink: (url, label = '') => {
        const normalized = normalizeSpotifyUrl(url)
        if (!normalized) return false
        const state = get()
        if (state.spotifyLinks.length >= SPOTIFY_LINK_MAX) return false
        if (state.spotifyLinks.some((l) => l.url === normalized)) return false
        const id = String(Date.now())
        const link = { id, url: normalized, label: (label || '').trim() || spotifyLinkLabel(normalized) }
        set({
          spotifyLinks: [...state.spotifyLinks, link],
          activeSpotifyId: id,
        })
        return true
      },
      removeSpotifyLink: (id) => set((s) => {
        const links = s.spotifyLinks.filter((l) => l.id !== id)
        let activeSpotifyId = s.activeSpotifyId
        if (activeSpotifyId === id) activeSpotifyId = links[0]?.id ?? null
        return { spotifyLinks: links, activeSpotifyId }
      }),
      setActiveSpotifyLink: (id) => set({ activeSpotifyId: id }),
      getActiveSpotifyUrl: () => {
        const s = get()
        const link = s.spotifyLinks.find((l) => l.id === s.activeSpotifyId) || s.spotifyLinks[0]
        return link?.url ?? ''
      },

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
      storage: createJSONStorage(createSafePersistStorage),
      merge: (persisted, current) => {
        const merged = { ...current, ...persisted }
        const legacyUrl = persisted?.spotifyUrl
        const links = Array.isArray(persisted?.spotifyLinks) ? persisted.spotifyLinks : []
        if (legacyUrl && links.length === 0) {
          const id = String(Date.now())
          merged.spotifyLinks = [{ id, url: legacyUrl, label: spotifyLinkLabel(legacyUrl) }]
          merged.activeSpotifyId = persisted?.activeSpotifyId || id
        }
        merged.visualProfiles = seedVisualProfiles(persisted?.visualProfiles)
        merged.localProfile = persisted?.localProfile || loadLocalProfile()
        return merged
      },
      partialize: (state) => ({
        themeId: state.themeId,
        appFont: state.appFont,
        canvasTextFont: state.canvasTextFont,
        libraryView: state.libraryView,
        librarySort: state.librarySort,
        folderView: state.folderView,
        folderSort: state.folderSort,
        folderIconSize: state.folderIconSize,
        folderContentFilter: state.folderContentFilter,
        appearanceMode: state.appearanceMode,
        unitSystem: state.unitSystem,
        scale: state.scale,
        brushPreset: state.brushPreset,
        colorPalette: state.colorPalette,
        hlPalette: state.hlPalette,
        color: state.color,
        hlColor: state.hlColor,
        zoom: state.zoom,
        animationsEnabled: state.animationsEnabled,
        animType: state.animType,
        animSpeed: state.animSpeed,
        bgId: state.bgId,
        customBg: typeof state.customBg === 'string' ? state.customBg.slice(0, 400000) : '',
        spotifyLinks: state.spotifyLinks,
        activeSpotifyId: state.activeSpotifyId,
        easterEggsEnabled: state.easterEggsEnabled,
        translationSourceLang: state.translationSourceLang,
        translationTargetLang: state.translationTargetLang,
        translationMode: state.translationMode,
        dictationLang: state.dictationLang,
        customProfiles: state.customProfiles,
        localProfile: state.localProfile,
        visualProfiles: state.visualProfiles,
        activeVisualProfileId: state.activeVisualProfileId,
        lastActiveDate: state.lastActiveDate,
        activityStreak: state.activityStreak,
      }),
    }
  )
)

export default useAppStore
