'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Session, User } from '@supabase/supabase-js'

export function useSession() {
  const supabase = createClient()
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser]       = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    
    // Fixed the line below with explicit types
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e: any, s: Session | null) => {
      setSession(s)
      setUser(s?.user ?? null)
    })
    
    return () => subscription.unsubscribe()
  }, [])

  return { 
    session, 
    user, 
    token: session?.access_token ?? '', 
    loading, 
    signOut: () => createClient().auth.signOut() 
  }
}