'use client'
import { useState } from 'react'
import { useSession } from '@/hooks/useSession'
import { useRealtimeSMS } from '@/hooks/useRealtimeSMS'
import { SMSItem } from '@/components/inbox/SMSItem'

export default function InboxPage() {
  const { user } = useSession()
  const { messages, isConnected } = useRealtimeSMS(user?.id)
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = messages?.filter(m => {
    const search = searchQuery.toLowerCase()
    return (
      m.body?.toLowerCase().includes(search) ||
      m.to_number?.toLowerCase().includes(search) ||
      m.service_name?.toLowerCase().includes(search)
    )
  }) || []

  return (
    <div className="animate-[fadeSlide_0.3s_ease]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-head font-bold text-xl sm:text-2xl">📥 Live Message Inbox</h1>
          <p className="text-xs text-[#5A6280]">View incoming verification details in real time</p>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${isConnected ? 'bg-[rgba(34,198,122,0.1)] border-[rgba(34,198,122,0.25)] text-[#22C67A]' : 'bg-[#1C2236] border-[#2A3352] text-[#5A6280]'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-[#22C67A] animate-pulse' : 'bg-[#5A6280]'}`} />
          {isConnected ? 'STREAMING' : 'CONNECTING'}
        </div>
      </div>

      <div className="mb-4">
        <input type="text" placeholder="Filter message logs by number or service..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-[#131826] border border-[#2A3352] rounded-xl px-4 py-2.5 text-sm outline-none text-[#EEF0F8] focus:border-[#F5A623] transition-colors" />
      </div>

      <div className="flex flex-col gap-2">
        {filtered.map(m => (
          <SMSItem key={m.id} msg={m} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-[#5A6280]">
            <span className="text-5xl mb-4 opacity-50 block">📭</span>
            <p className="font-head font-bold text-[#8B92B0] mb-1">No matches found</p>
            <p className="text-xs">Incoming messages will show up here as they arrive</p>
          </div>
        )}
      </div>
    </div>
  )
}