import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server' // FIXED: Importing the correct name

export default async function HomePage() {
  // FIXED: Calling the correct function name
  const supabase = createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (session) {
    redirect('/dashboard')
  }
  
  redirect('/auth/login')
}