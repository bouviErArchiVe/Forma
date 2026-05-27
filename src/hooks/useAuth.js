// src/hooks/useAuth.js
import { useEffect, useState } from 'react'
import { supabase, signInWithGoogle, signInWithApple, signInWithEmail, signUpWithEmail, signOut, isSupabaseConfigured } from '@/lib/supabase'
import useAppStore from '@/stores/useAppStore'
import { loadLocalProfile } from '@/lib/localUser'

export function useAuth() {
  const { user, setUser, localProfile, setLocalProfile, initLocalProfile } = useAppStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initLocalProfile()
    const stored = loadLocalProfile()
    if (stored && !localProfile) setLocalProfile(stored)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return undefined
    }

    let cancelled = false

    const finish = (session) => {
      if (cancelled) return
      setUser(session?.user ?? null)
      setLoading(false)
    }

    const timeout = setTimeout(() => {
      if (!cancelled) setLoading(false)
    }, 8000)

    supabase.auth.getSession()
      .then(({ data: { session } }) => finish(session))
      .catch(() => finish(null))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      finish(session)
    })

    return () => {
      cancelled = true
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [setUser])

  const hasLocalSession = !!localProfile?.pseudo
  const isAuthenticated = !!user || hasLocalSession

  return {
    user,
    localProfile,
    setLocalProfile,
    loading,
    isAuthenticated,
    isCloudUser: !!user,
    isLocalUser: hasLocalSession && !user,
    isSupabaseConfigured,
    signInWithGoogle,
    signInWithApple,
    signInWithEmail,
    signUpWithEmail,
    signOut: async () => {
      await signOut()
      setUser(null)
    },
    signOutLocal: () => setLocalProfile(null),
  }
}
