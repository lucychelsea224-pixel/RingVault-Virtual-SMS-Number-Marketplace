'use client'
import { useState, useEffect } from 'react'
import { clsx } from 'clsx'

interface SMSLog {
  id: string;
  service_name?: string | null;
  to_number: string;
  body: string;
  otp_code?: string | null;
  received_at: string;
  isNew?: boolean;
}

const SERVICE_ICONS: Record<string, string> = {
  whatsapp: '💬', facebook: '📘', telegram: '✈️', google: '🔵',
  instagram: '📷', twitter: '🐦', tiktok: '🎵', uber: '⚫', unknown: '📩',
}

const URL_REGEX = new RegExp('https?:' + String.fromCharCode(47, 47) + '\\S+')

export function SMSItem({ msg }: { msg: SMSLog }) {
  const [mounted, setMounted] = useState(false)
  const [showFull, setShowFull] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const icon = SERVICE_ICONS[msg.service_name?.toLowerCase() ?? ''] ?? '📩'
  const formattedTime = mounted ? new Date(msg.received_at).toLocaleTimeString() : ''

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.body || msg.otp_code || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const linkMatch = msg.body ? msg.body.match(URL_REGEX) : null

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

        {!showFull && (
          <div className="text-[13px] mt-1 line-clamp-2">{msg.body}</div>
        )}

        {msg.otp_code && (
          <div className="font-head text-[22px] font-extrabold text-[#F5A623] tracking-[4px] mt-2">{msg.otp_code}</div>
        )}

        {showFull && (
          <div className="mt-3 bg-[#0B0F1A] border border-[#2A3352] rounded-lg p-3">
            <p className="text-[13px] whitespace-pre-wrap text-[#EEF0F8]">{msg.body}</p>
            {linkMatch && (
              
                href={linkMatch[0]}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-[12px] text-[#4F8EF7] hover:underline break-all"
              >
                🔗 {linkMatch[0]}
              </a>
            )}
          </div>
        )}

        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setShowFull(s => !s)}
            className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-[#22C67A]/10 text-[#22C67A] border border-[#22C67A]/30 hover:bg-[#22C67A]/20 transition-all"
          >
            {showFull ? 'Hide' : 'Full SMS'}
          </button>
          <button
            onClick={handleCopy}
            className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-[#1C2236] text-[#8B92B0] border border-[#2A3352] hover:border-[#F5A623]/40 hover:text-[#F5A623] transition-all"
          >
            {copied ? '✓ Copied' : 'Copy full code'}
          </button>
        </div>
      </div>
    </div>
  )
}
