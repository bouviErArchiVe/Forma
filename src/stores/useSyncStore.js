import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createSafePersistStorage } from '@/lib/storage'
import { DEFAULT_SYNC_SETTINGS, SYNC_STATUS } from '@/lib/sync/constants'
import { connectCloudProvider } from '@/lib/sync/cloudProviders'

const useSyncStore = create(
  persist(
    (set, get) => ({
      ...DEFAULT_SYNC_SETTINGS,
      online: typeof navigator !== 'undefined' ? navigator.onLine !== false : true,
      globalStatus: SYNC_STATUS.idle,
      lastLocalSaveAt: null,
      lastCloudSyncAt: null,
      cloudQueueCount: 0,
      recoveryItems: [],
      syncError: null,
      syncConflict: null,

      setCloudEnabled: (cloudEnabled) => set({ cloudEnabled }),
      setAutoCloudSync: (autoCloudSync) => set({ autoCloudSync }),
      setVersionSnapshots: (versionSnapshots) => set({ versionSnapshots }),
      setCloudProvider: (cloudProvider) => set({ cloudProvider }),
      setIcloudLinked: (icloudLinked) => set({ icloudLinked }),
      setOnline: (online) => set({ online }),
      setGlobalStatus: (globalStatus) => set({ globalStatus }),
      setLastLocalSaveAt: (d) => set({ lastLocalSaveAt: d }),
      setLastCloudSyncAt: (d) => set({ lastCloudSyncAt: d }),
      setCloudQueueCount: (n) => set({ cloudQueueCount: n }),
      setRecoveryItems: (items) => set({ recoveryItems: items }),
      setSyncError: (syncError) => set({ syncError }),
      setSyncConflict: (syncConflict) => set({ syncConflict }),
      clearSyncError: () => set({ syncError: null, syncConflict: null }),

      isCloudActive: () => {
        const { cloudEnabled, autoCloudSync, online, cloudProvider } = get()
        return cloudEnabled && autoCloudSync && online && cloudProvider !== 'local'
      },

      async tryConnectProvider(providerId) {
        const res = await connectCloudProvider(providerId)
        if (res.ok && providerId === 'supabase') {
          set({ cloudProvider: 'supabase', cloudEnabled: true, syncError: null })
        } else if (res.ok && providerId === 'local') {
          set({ cloudProvider: 'local', cloudEnabled: false, syncError: null })
        } else if (providerId === 'icloud') {
          set({ cloudProvider: 'icloud', icloudLinked: false, syncError: res.message || null })
        } else {
          set({ syncError: res.message || 'Connexion cloud impossible' })
        }
        return res
      },
    }),
    {
      name: 'forma-sync-store',
      storage: createJSONStorage(createSafePersistStorage),
      partialize: (s) => ({
        cloudEnabled: s.cloudEnabled,
        autoCloudSync: s.autoCloudSync,
        versionSnapshots: s.versionSnapshots,
        saveIndicator: s.saveIndicator,
        cloudProvider: s.cloudProvider,
        icloudLinked: s.icloudLinked,
      }),
    }
  )
)

export default useSyncStore
