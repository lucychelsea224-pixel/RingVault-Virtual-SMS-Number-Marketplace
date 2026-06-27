import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Explicitly declare edge runtime compatibility for Cloudflare Pages compilation
export const runtime = 'edge'

export default async function HomePage() {
  const supabase = createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (session) {
    redirect('/dashboard')
  }
  
  redirect('/auth/login')
}