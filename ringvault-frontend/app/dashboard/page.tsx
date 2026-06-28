'use client'
import { useEffect, useState } from 'react'
import { useSession } from '@/hooks/useSession'
import { useWallet } from '@/hooks/useWallet'
import { useRealtimeSMS } from '@/hooks/useRealtimeSMS'
import { StatCard } from '@/components/dashboard/StatCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SMSItem } from '@/components/inbox/SMSItem'
import { getMyNumbers, releaseNumber, resendCode } from '@/lib/api'
import Link from 'next/link'

export default function DashboardPage() {
  const { user, token } = useSession()
  const { balance, transactions } = useWallet(token)
  const { messages, isConnected } = useRealtimeSMS(user?.id)
  const [numbers, setNumbers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [resendMsg, setResendMsg] = useState<{ id: string; msg: string; ok: boolean } | null>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!token) return
    setLoading(true)
    getMyNumbers(token)
      .then(d => setNumbers(d?.numbers || d || []))
      .catch(err => console.error("Failed to load numbers:", err))
      .finally(() => setLoading(false))
  }, [token])

  const totalSpent = transactions?.filter(t => t.type === 'debit').reduce((a: number, t: any) => a + t.amount, 0) || 0

  const handleRelease = async (id: string) => {
    try {
      await releaseNumber(token, id)
      setNumbers(prev => prev.filter(n => n.id !== id))
    } catch (err) {
      console.error("Failed to release number:", err)
    }
  }

  const handleResend = async (numberId: string) => {
    setResendingId(numberId)
    setResendMsg(null)
    try {
      await resendCode(token, numberId)
      setResendMsg({ id: numberId, msg: 'Resend requested! New code coming shortly. ($0.75 charged)', ok: true })
    } catch (err: any) {
      setResendMsg({ id: numberId, msg: err?.message || 'Resend failed.', ok: false })
    } finally {
      setResendingId(null)
      setTimeout(() => setResendMsg(null), 5000)
    }
  }

  return (
    <div className="animate-[fadeSlide_0.3s_ease] px-2 sm:px-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon="📱" value={String(numbers.length)} label="Active Numbers" change={`${numbers.length} total`} up />
        <StatCard icon="✉"  value={String(messages?.length || 0)} label="SMS Received" change="Live" up />
        <StatCard icon="◈"  value={`$${(balance || 0).toFixed(2)}`} label="Wallet Balance" change="Available" up />
        <StatCard icon="💸" value={`$${totalSpent.toFixed(2)}`} label="Total Spent" change="this month" up={false} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* My Numbers Block */}
        <div className="bg-[#131826] border border-[#2A3352] rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-head font-bold text-[15px]">📱 My Numbers</h2>
              <p className="text-[12px] text-[#5A6280]">{numbers.length} virtual numbers</p>
            </div>
            <Link href="/dashboard/buy"><Button variant="accent" size="sm">+ Buy</Button></Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-10 text-xs text-[#5A6280] animate-pulse">
              Syncing numbers...
            </div>
          ) : numbers.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-[#5A6280]">
              <span className="text-4xl mb-3 opacity-60">📵</span>
              <p className="font-head font-bold text-[#8B92B0] mb-1">No numbers yet</p>
              <p className="text-[13px]">Buy your first number to get started</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {numbers.map(n => {
                const isLineLive = n.status === 'active' || n.status === 'rental_active'
                const expirationLabel = mounted && n.expires_at
                  ? `Expires ${new Date(n.expires_at).toLocaleDateString()}`
                  : 'One-time Session'
                const rowId = n.id || n.telnyx_number_id

                return (
                  <div key={rowId} className="bg-[#1C2236] border border-[#2A3352] rounded-xl p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="font-head font-bold text-[13px]">{n.phone_number}</div>
                        <div className="text-[11px] text-[#5A6280]">{expirationLabel}</div>
                      </div>
                      <Badge color={isLineLive ? 'green' : 'accent'}>
                        {isLineLive && <span className="w-1.5 h-1.5 rounded-full bg-[#22C67A] animate-pulse" />}
                        <span className="capitalize">{n.status?.replace('_', ' ')}</span>
                      </Badge>
                    </div>

                    {/* Resend feedback message */}
                    {resendMsg?.id === rowId && (
                      <div className={`text-[11px] px-2 py-1 rounded-lg mb-2 ${resendMsg.ok ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {resendMsg.msg}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2 mt-1">
                      {isLineLive && (
                        <button
                          onClick={() => handleResend(rowId)}
                          disabled={resendingId === rowId}
                          className="flex-1 py-1.5 text-[11px] font-semibold rounded-lg border border-[#F5A623]/40 text-[#F5A623] hover:bg-[#F5A623]/10 transition-all disabled:opacity-50"
                        >
                          {resendingId === rowId ? 'Requesting...' : '🔄 Resend Code ($0.75)'}
                        </button>
                      )}
                      <button
                        onClick={() => handleRelease(rowId)}
                        className="flex-1 py-1.5 text-[11px] font-semibold rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        ✕ Release
                      </button>
                    </div>
                  </div>
                )
              })}
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
