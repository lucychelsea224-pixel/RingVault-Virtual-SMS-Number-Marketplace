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



export default function DashboardPage() {
  const { user, token } = useSession()
  const { balance, transactions } = useWallet(token)
  const { messages, isConnected } = useRealtimeSMS(user?.id)
  const [numbers, setNumbers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!token) return
    setLoading(true)
    getMyNumbers(token)
      .then(d => {
        setNumbers(d?.numbers || d || [])
      })
      .catch((err) => {
        console.error("Failed to parse operational number history state:", err)
      })
      .finally(() => setLoading(false))
  }, [token])

  const totalSpent = transactions?.filter(t => t.type === 'debit').reduce((a: number, t: any) => a + t.amount, 0) || 0

  const handleRelease = async (id: string) => {
    try {
      await releaseNumber(token, id)
      setNumbers(prev => prev.filter(n => n.id !== id))
    } catch (err) {
      console.error("Failed to execute line release:", err)
    }
  }

  return (
    <div className="animate-[fadeSlide_0.3s_ease] px-2 sm:px-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon="📱" value={String(numbers.length)} label="Active Numbers" change={`${numbers.length} total`} up />
        <StatCard icon="✉"  value={String(messages?.length || 0)} label="SMS Received"  change="Live" up />
        <StatCard icon="◈"  value={`$${(balance || 0).toFixed(2)}`} label="Wallet Balance" change="Available" up />
        <StatCard icon="💸" value={`$${totalSpent.toFixed(2)}`} label="Total Spent" change="this month" up={false} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* My Numbers Block */}
        <div className="bg-[#131826] border border-[#2A3352] rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-head font-bold text-[15px]">📱 My Numbers</h2>
              <p className="text-[12px] text-[#5A6280]">{numbers.length} active virtual numbers</p>
            </div>
            <Link href="/dashboard/buy"><Button variant="accent" size="sm">+ Buy</Button></Link>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-10 text-xs text-[#5A6280] tracking-wide animate-pulse">
              Syncing dynamic line registry parameters...
            </div>
          ) : numbers.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-[#5A6280]">
              <span className="text-4xl mb-3 opacity-60">📵</span>
              <p className="font-head font-bold text-[#8B92B0] mb-1">No numbers yet</p>
              <p className="text-[13px]">Buy your first number to get started</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[450px]">
                <thead>
                  <tr className="text-[11px] font-semibold text-[#5A6280] uppercase tracking-wide">
                    <th className="text-left pb-3">Number</th>
                    <th className="text-left pb-3">Country</th>
                    <th className="text-left pb-3">Status</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {numbers.map(n => {
                    const isLineLive = n.status === 'active' || n.status === 'rental_active';
                    const expirationLabel = mounted && n.expires_at 
                      ? `Expires ${new Date(n.expires_at).toLocaleDateString()}` 
                      : 'One-time Session';
                    
                    return (
                      <tr key={n.id || n.telnyx_number_id} className="border-t border-[#2A3352] hover:bg-[#1C2236] transition-colors">
                        <td className="py-3 pr-3">
                          <div className="font-head font-bold text-[13px] whitespace-nowrap">{n.phone_number}</div>
                          <div className="text-[11px] text-[#5A6280] whitespace-nowrap">{expirationLabel}</div>
                        </td>
                        <td className="py-3 pr-3 text-[13px] uppercase">{n.country_code || n.state_code || 'any'}</td>
                        <td className="py-3 pr-3">
                          <Badge color={isLineLive ? 'green' : 'accent'}>
                            {isLineLive && <span className="w-1.5 h-1.5 rounded-full bg-[#22C67A] animate-pulse" />}
                            <span className="capitalize">{n.status?.replace('_', ' ')}</span>
                          </Badge>
                        </td>
                        <td className="py-3 text-right">
                          <Button variant="danger" size="sm" onClick={() => handleRelease(n.id || n.telnyx_number_id)}>
                            Release
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent SMS Block */}
        <div className="bg-[#131826] border border-[#2A3352] rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4 gap-2">
            <div>
              <h2 className="font-head font-bold text-[15px]">✉ Recent SMS</h2>
              <p className="text-[12px] text-[#5A6280]">Supabase Realtime</p>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border shrink-0 ${isConnected ? 'bg-[rgba(34,198,122,0.1)] border-[rgba(34,198,122,0.25)] text-[#22C67A]' : 'bg-[#1C2236] border-[#2A3352] text-[#5A6280]'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-[#22C67A] animate-pulse' : 'bg-[#5A6280]'}`} />
              {isConnected ? 'LIVE' : 'CONNECTING'}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {messages?.slice(0, 4).map((m: any) => <SMSItem key={m.id} msg={m} />)}
            {(!messages || messages.length === 0) && (
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