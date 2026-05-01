'use client'
import { useState } from 'react'
import { useSession } from '@/hooks/useSession'
import { useRealtimeSMS } from '@/hooks/useRealtimeSMS'
import { SMSItem } from '@/components/inbox/SMSItem'

export default function InboxPage() {
  const { user } = useSession()
  const { messages, isConnected } = useRealtimeSMS(user?.id)
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? messages : messages.filter(m => m.to_number === filter)
  const toNumbers = [...new Set(messages.map(m => m.to_number))]

  return (
    <div className="animate-[fadeSlide_0.3s_ease]">
      <div className="bg-[#131826] border border-[#2A3352] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-head font-bold text-[15px]">✉ SMS Inbox</h2>
            <p className="text-[12px] text-[#5A6280]">All incoming OTP messages across your numbers</p>
          </div>
          <div className="flex items-center gap-3">
            <select value={filter} onChange={e => setFilter(e.target.value)}
              className="bg-[#1C2236] border border-[#2A3352] rounded-lg px-3 py-1.5 text-[12px] text-[#EEF0F8] outline-none focus:border-[#F5A623]">
              <option value="all">All Numbers</option>
              {toNumbers.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border ${isConnected ? 'bg-[rgba(34,198,122,0.1)] border-[rgba(34,198,122,0.25)] text-[#22C67A]' : 'bg-[#1C2236] border-[#2A3352] text-[#5A6280]'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-[#22C67A] animate-pulse' : 'bg-[#5A6280]'}`} />
              {isConnected ? 'LIVE' : 'CONNECTING…'}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {filtered.map(m => <SMSItem key={m.id} msg={m} />)}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center py-16 text-[#5A6280]">
              <span className="text-5xl mb-4 opacity-50">📭</span>
              <p className="font-head font-bold text-[#8B92B0] mb-1">No messages yet</p>
              <p className="text-[13px]">Messages will appear here in real-time as they arrive</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
