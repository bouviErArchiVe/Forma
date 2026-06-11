/**
 * FormAI — store Zustand pour l'état UI du module IA.
 *
 * Persisté dans localStorage (clé 'formai-settings'), même pattern que
 * settingsStore. Aucune donnée de conversation ici : la persistance des
 * conversations/mémoire vit dans Dexie (src/services/ai/).
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface FormAIState {
  /** Conversation actuellement ouverte (null = aucune). */
  activeConversationId: string | null
  /** Agent spécialisé actif ('general' par défaut). */
  activeAgentId: string
  /** Visibilité de la barre latérale des conversations. */
  sidebarOpen: boolean
  /** Injection de la mémoire locale dans les prompts. */
  memoryEnabled: boolean
  /** Recherche documentaire (RAG) activée. */
  ragEnabled: boolean
  setActiveConversationId: (id: string | null) => void
  setActiveAgentId: (id: string) => void
  setSidebarOpen: (open: boolean) => void
  setMemoryEnabled: (enabled: boolean) => void
  setRagEnabled: (enabled: boolean) => void
}

export const useFormAIStore = create<FormAIState>()(
  persist(
    (set) => ({
      activeConversationId: null,
      activeAgentId: 'general',
      sidebarOpen: true,
      memoryEnabled: true,
      ragEnabled: false,
      setActiveConversationId: (activeConversationId) => set({ activeConversationId }),
      setActiveAgentId: (activeAgentId) => set({ activeAgentId }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setMemoryEnabled: (memoryEnabled) => set({ memoryEnabled }),
      setRagEnabled: (ragEnabled) => set({ ragEnabled }),
    }),
    {
      name: 'formai-settings',
    },
  ),
)
