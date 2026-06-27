'use client'
import { useEffect, useState } from 'react'
import { useSession } from '@/hooks/useSession'
import { useWallet } from '@/hooks/useWallet'
import { useRealtimeSMS } from '@/hooks/useRealtimeSMS'
import { StatCard } from '@/components/dashboard/StatCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SMSItem } from '@/components/inbox/SMSItem'
import { getMyNumbers, releaseNumber } from '@/lib/api'
import Link from 'next/link'

// Force the Edge runtime compatibility for Cloudflare Pages compilation
export const runtime = 'edge'

export default function DashboardPage() {
  const { user, token } = useSession()
  const { balance, transactions } = useWallet(token)
  const { messages, isConnected } = useRealtimeSMS(user?.id)
  const [numbers, setNumbers] = useState<any[]>([])

  useEffect(() => {
    if (!token) return
    getMyNumbers(token).then(d => setNumbers(d.numbers)).catch(() => {})
  }, [token])

  const totalSpent = transactions.filter(t => t.type === 'debit').reduce((a: number, t: any) => a + t.amount, 0)

  const handleRelease = async (id: string) => {
    await releaseNumber(token, id)
    setNumbers(prev => prev.filter(n => n.id !== id))
  }

  return (
    <div className="animate-[fadeSlide_0.3s_ease]">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard icon="📱" value={String(numbers.length)} label="Active Numbers" change={`${numbers.length} total`} up />
        <StatCard icon="✉"  value={String(messages.length)} label="SMS Received"  change="Live" up />
        <StatCard icon="◈"  value={`$${balance.toFixed(2)}`} label="Wallet Balance" change="Available" up />
        <StatCard icon="💸" value={`$${totalSpent.toFixed(2)}`} label="Total Spent" change="this month" up={false} />
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* My Numbers */}
        <div className="bg-[#131826] border border-[#2A3352] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-head font-bold text-[15px]">📱 My Numbers</h2>
              <p className="text-[12px] text-[#5A6280]">{numbers.length} active virtual numbers</p>
            </div>
            <Link href="/dashboard/buy"><Button variant="accent" size="sm">+ Buy</Button></Link>
          </div>
          {numbers.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-[#5A6280]">
              <span className="text-4xl mb-3 opacity-60">📵</span>
              <p className="font-head font-bold text-[#8B92B0] mb-1">No numbers yet</p>
              <p className="text-[13px]">Buy your first number to get started</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-[11px] font-semibold text-[#5A6280] uppercase tracking-wide">
                  <th className="text-left pb-3">Number</th>
                  <th className="text-left pb-3">Country</th>
                  <th className="text-left pb-3">Status</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody>
                {numbers.map(n => (
                  <tr key={n.id} className="border-t border-[#2A3352] hover:bg-[#1C2236] transition-colors">
                    <td className="py-3 pr-3">
                      <div className="font-head font-bold text-[13px]">{n.phone_number}</div>
                      <div className="text-[11px] text-[#5A6280]">{n.expires_at ? `Expires ${new Date(n.expires_at).toLocaleDateString()}` : ''}</div>
                    </td>
                    <td className="py-3 pr-3 text-[13px]">{n.country_code}</td>
                    <td className="py-3 pr-3">
                      <Badge color={n.status === 'active' ? 'green' : 'accent'}>
                        {n.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-[#22C67A] animate-pulse" />}
                        {n.status}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <Button variant="danger" size="sm" onClick={() => handleRelease(n.id)}>Release</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent SMS */}
        <div className="bg-[#131826] border border-[#2A3352] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-head font-bold text-[15px]">✉ Recent SMS</h2>
              <p className="text-[12px] text-[#5A6280]">Supabase Realtime</p>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${isConnected ? 'bg-[rgba(34,198,122,0.1)] border-[rgba(34,198,122,0.25)] text-[#22C67A]' : 'bg-[#1C2236] border-[#2A3352] text-[#5A6280]'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-[#22C67A] animate-pulse' : 'bg-[#5A6280]'}`} />
              {isConnected ? 'LIVE' : 'CONNECTING'}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {messages.slice(0, 4).map(m => <SMSItem key={m.id} msg={m} />)}
            {messages.length === 0 && (
              <div className="text-center py-8 text-[#5A6280]">
                <div className="text-3xl mb-2 opacity-60">📭</div>
                <p>No messages yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}