// src/hooks/useAuth.js
import { useEffect, useState } from 'react'
import { supabase, signInWithGoogle, signInWithApple, signInWithEmail, signUpWithEmail, signOut } from '@/lib/supabase'
import useAppStore from '@/stores/useAppStore'

export function useAuth() {
  const { user, setUser } = useAppStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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

  return {
    user,
    loading,
    isAuthenticated: !!user,
    signInWithGoogle,
    signInWithApple,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  }
}
