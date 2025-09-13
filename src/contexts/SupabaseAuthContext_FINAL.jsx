import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { getSupabase } from '@/lib/supabase-singleton'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const supabaseRef = useRef(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  if (!supabaseRef.current) {
    supabaseRef.current = getSupabase()
  }

  useEffect(() => {
    const supabase = supabaseRef.current
    
    // 🔐 Defesa: não tente assinar se o client não subiu por algum motivo
    if (!supabase || !supabase.auth || !supabase.auth.onAuthStateChange) {
      console.warn('[Auth] Supabase client ainda não disponível; seguindo sem subscription.')
      setLoading(false)
      return
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess ?? null)
    })

    // Estado inicial
    supabase.auth.getSession().then(({ data }) => {
      setSession(data?.session ?? null)
      setLoading(false)
    })

    return () => {
      try { 
        sub?.subscription?.unsubscribe?.() 
      } catch (e) {
        console.warn('[Auth] Erro ao desinscrever:', e)
      }
    }
  }, [])

  const value = useMemo(() => ({
    session,
    user: session?.user ?? null,
    loading,
    supabase: supabaseRef.current,
  }), [session, loading])

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}