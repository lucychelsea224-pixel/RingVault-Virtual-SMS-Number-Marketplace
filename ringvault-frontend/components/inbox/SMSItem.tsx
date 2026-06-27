'use client'
import { useState, useEffect } from 'react'
import { clsx } from 'clsx'

interface SMSLog {
  id: string;
  service_name?: string | null; // Safe for null
  to_number: string;
  body: string;
  otp_code?: string | null;     // Fixed: Added | null to resolve the build error!
  received_at: string;
  isNew?: boolean;
}

const SERVICE_ICONS: Record<string, string> = {
  whatsapp: '💬', facebook: '📘', telegram: '✈️', google: '🔵',
  instagram: '📷', twitter: '🐦', tiktok: '🎵', uber: '⚫', unknown: '📩',
}

export function SMSItem({ msg }: { msg: SMSLog }) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const icon = SERVICE_ICONS[msg.service_name?.toLowerCase() ?? ''] ?? '📩'
  const formattedTime = mounted ? new Date(msg.received_at).toLocaleTimeString() : ''

  return (
    <div className={clsx('flex gap-4 p-4 rounded-xl border transition-all', msg.isNew ? 'border-[#F5A623] bg-[rgba(245,166,35,0.05)]' : 'border-[#2A3352] bg-[#1C2236]')}>
      <div className="w-10 h-10 rounded-xl bg-[rgba(79,142,247,0.12)] border border-[rgba(79,142,247,0.2)] grid place-items-center text-lg flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-[#8B92B0]">{msg.service_name ?? 'Unknown'}</span>
            {msg.isNew && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[rgba(245,166,35,0.15)] text-[#F5A623]">NEW</span>}
          </div>
          <span className="text-[11px] text-[#5A6280] whitespace-nowrap">{formattedTime}</span>
        </div>
        <div className="text-[11px] text-[#5A6280]">→ {msg.to_number}</div>
        <div className="text-[13px] mt-1">{msg.body}</div>
        {msg.otp_code && (
          <div className="font-head text-[22px] font-extrabold text-[#F5A623] tracking-[4px] mt-2">{msg.otp_code}</div>
        )}
      </div>
    </div>
  )
}