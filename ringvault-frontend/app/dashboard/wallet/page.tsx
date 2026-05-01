'use client'
import { useState } from 'react'
import { useSession } from '@/hooks/useSession'
import { useWallet } from '@/hooks/useWallet'
import { TopUpModal } from '@/components/wallet/TopUpModal'
import { Button } from '@/components/ui/Button'

export default function WalletPage() {
  const { user, token } = useSession()
  const { balance, transactions, loading, topUp } = useWallet(token)
  const [showTopUp, setShowTopUp] = useState(false)

  return (
    <div className="animate-[fadeSlide_0.3s_ease]">
      {/* Wallet hero card */}
      <div className="relative overflow-hidden rounded-2xl p-7 mb-6 border border-[#2A3352]" style={{background:'linear-gradient(135deg,#1a2540,#0e1830)'}}>
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-[rgba(245,166,35,0.08)] pointer-events-none" />
        <div className="absolute -bottom-14 -left-8 w-40 h-40 rounded-full bg-[rgba(79,142,247,0.08)] pointer-events-none" />
        <p className="text-[13px] font-medium text-[#8B92B0]">Available Balance</p>
        <div className="font-head text-[42px] font-extrabold tracking-tight my-3">
          <span className="text-[22px] text-[#8B92B0]">$</span>
          {loading ? '—' : balance.toFixed(2)}
        </div>
        <div className="flex gap-3">
          <Button variant="accent" onClick={() => setShowTopUp(true)}>+ Top Up Wallet</Button>
          <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-[12px] text-[#8B92B0]">💳 Paystack · NGN · USD</div>
        </div>
      </div>

      {/* Transaction history */}
      <div className="bg-[#131826] border border-[#2A3352] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-head font-bold text-[15px]">Transaction History</h2>
          <span className="text-[12px] text-[#5A6280]">{transactions.length} transactions</span>
        </div>
        <div className="flex flex-col gap-2">
          {transactions.map(t => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3 bg-[#1C2236] rounded-xl border border-[#2A3352]">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg grid place-items-center text-sm ${t.type === 'credit' ? 'bg-[rgba(34,198,122,0.12)]' : 'bg-[rgba(247,91,91,0.12)]'}`}>
                  {t.type === 'credit' ? '↑' : '↓'}
                </div>
                <div>
                  <div className="text-[13px] font-medium">{t.description}</div>
                  <div className="text-[11px] text-[#5A6280]">{new Date(t.created_at).toLocaleDateString()}</div>
                </div>
              </div>
              <div className={`font-head text-[14px] font-bold ${t.type === 'credit' ? 'text-[#22C67A]' : 'text-[#F75B5B]'}`}>
                {t.type === 'credit' ? '+' : '-'}${Number(t.amount).toFixed(2)}
              </div>
            </div>
          ))}
          {!loading && transactions.length === 0 && (
            <div className="text-center py-10 text-[#5A6280]">No transactions yet.</div>
          )}
        </div>
      </div>

      {showTopUp && user && (
        <TopUpModal onClose={() => setShowTopUp(false)} onTopUp={amt => topUp(amt, user.email!, user.id)} />
      )}
    </div>
  )
}
