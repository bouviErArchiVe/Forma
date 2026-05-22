// src/hooks/useAuth.js
import { useEffect, useState } from 'react'
import { supabase, signInWithGoogle, signInWithApple, signInWithEmail, signUpWithEmail, signOut } from '@/lib/supabase'
import useAppStore from '@/stores/useAppStore'

export function useAuth() {
  const { user, setUser } = useAppStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
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
