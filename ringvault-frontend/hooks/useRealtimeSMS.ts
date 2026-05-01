'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export type SMSLog = {
  id: string; from_number: string; to_number: string; body: string
  otp_code: string | null; service_name: string | null; received_at: string; isNew?: boolean
}

export function useRealtimeSMS(userId: string | undefined) {
  const supabase = createClient()
  const [messages, setMessages]     = useState<SMSLog[]>([])
  const [isConnected, setConnected] = useState(false)

  useEffect(() => {
    if (!userId) return
    supabase.from('sms_logs').select('*').eq('user_id', userId)
      .order('received_at', { ascending: false }).limit(50)
      .then(({ data }) => setMessages(data ?? []))
  }, [userId])

  useEffect(() => {
    if (!userId) return
    const ch = supabase.channel(`sms-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sms_logs', filter: `user_id=eq.${userId}` },
        (payload) => {
          const m = { ...payload.new as SMSLog, isNew: true }
          setMessages(prev => [m, ...prev])
          setTimeout(() => setMessages(prev => prev.map(x => x.id === m.id ? { ...x, isNew: false } : x)), 5000)
        })
      .subscribe(s => setConnected(s === 'SUBSCRIBED'))
    return () => { supabase.removeChannel(ch) }
  }, [userId])

  return { messages, isConnected }
}
