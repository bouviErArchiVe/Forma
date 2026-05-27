import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createSafePersistStorage } from '@/lib/storage'
import { DEFAULT_SYNC_SETTINGS, SYNC_STATUS } from '@/lib/sync/constants'

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

      setCloudEnabled: (cloudEnabled) => set({ cloudEnabled }),
      setAutoCloudSync: (autoCloudSync) => set({ autoCloudSync }),
      setVersionSnapshots: (versionSnapshots) => set({ versionSnapshots }),
      setOnline: (online) => set({ online }),
      setGlobalStatus: (globalStatus) => set({ globalStatus }),
      setLastLocalSaveAt: (d) => set({ lastLocalSaveAt: d }),
      setLastCloudSyncAt: (d) => set({ lastCloudSyncAt: d }),
      setCloudQueueCount: (n) => set({ cloudQueueCount: n }),
      setRecoveryItems: (items) => set({ recoveryItems: items }),

      isCloudActive: () => {
        const { cloudEnabled, autoCloudSync, online } = get()
        return cloudEnabled && autoCloudSync && online
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
      }),
    }
  )
)

export default useSyncStore
