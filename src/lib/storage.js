/** Accès localStorage sécurisé — ne doit jamais faire crasher l'app au démarrage. */

export function safeJsonParse(value, fallback) {
  if (value == null || value === '') return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

export function safeGetLocalStorage(key, fallback = null) {
  if (typeof localStorage === 'undefined') return fallback
  try {
    return localStorage.getItem(key)
  } catch {
    return fallback
  }
}

export function safeSetLocalStorage(key, value) {
  if (typeof localStorage === 'undefined') return false
  try {
    localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

/** Storage zustand persist — ignore JSON corrompu au lieu de crasher. */
export function createSafePersistStorage() {
  return {
    getItem: (name) => {
      const raw = safeGetLocalStorage(name)
      if (!raw) return null
      try {
        JSON.parse(raw)
        return raw
      } catch {
        try { localStorage.removeItem(name) } catch { /* ignore */ }
        return null
      }
    },
    setItem: (name, value) => {
      safeSetLocalStorage(name, value)
    },
    removeItem: (name) => {
      try { localStorage.removeItem(name) } catch { /* ignore */ }
    },
  }
}

/** Réinitialise toutes les données locales Forma / ArchNote. */
export function resetFormaLocalData() {
  if (typeof localStorage === 'undefined') return
  try {
    const keys = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k) continue
      if (
        k.startsWith('forma_') ||
        k.startsWith('forma-') ||
        k.startsWith('forma_pages_') ||
        k.startsWith('archnote')
      ) {
        keys.push(k)
      }
    }
    keys.forEach((k) => localStorage.removeItem(k))
  } catch { /* ignore */ }
}
