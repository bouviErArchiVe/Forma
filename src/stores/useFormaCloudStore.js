import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createSafePersistStorage } from '@/lib/storage'
import { FORMA_CLOUD_STATUS } from '@/lib/formacloud/constants'

const useFormaCloudStore = create(
  persist(
    (set, get) => ({
      connected: false,
      provider: null,
      accessToken: null,
      rootId: null,
      rootUrl: null,
      driveTree: null,
      fileMap: {},
      status: FORMA_CLOUD_STATUS.idle,
      lastSyncAt: null,
      error: null,
      conflict: null,
      autoSync: true,

      setStatus: (status) => set({ status }),
      setError: (error) => set({ error }),
      setConflict: (conflict) => set({ conflict }),
      setLastSyncAt: (d) => set({ lastSyncAt: d }),
      setDriveTree: (driveTree) => set({ driveTree }),
      setFileMap: (fileMap) => set({ fileMap }),
      setRootUrl: (rootUrl) => set({ rootUrl }),
      setAutoSync: (autoSync) => set({ autoSync }),

      connect: ({ provider, accessToken, rootId, rootUrl, driveTree }) => set({
        connected: true,
        provider,
        accessToken,
        rootId,
        rootUrl,
        driveTree,
        status: FORMA_CLOUD_STATUS.syncing,
        error: null,
        conflict: null,
      }),

      disconnect: () => set({
        connected: false,
        provider: null,
        accessToken: null,
        rootId: null,
        rootUrl: null,
        driveTree: null,
        fileMap: {},
        status: FORMA_CLOUD_STATUS.idle,
        error: null,
        conflict: null,
      }),
    }),
    {
      name: 'forma-cloud-store',
      storage: createJSONStorage(createSafePersistStorage),
      partialize: (s) => ({
        connected: s.connected,
        provider: s.provider,
        rootId: s.rootId,
        rootUrl: s.rootUrl,
        driveTree: s.driveTree,
        fileMap: s.fileMap,
        autoSync: s.autoSync,
        lastSyncAt: s.lastSyncAt,
      }),
    }
  )
)

export default useFormaCloudStore
