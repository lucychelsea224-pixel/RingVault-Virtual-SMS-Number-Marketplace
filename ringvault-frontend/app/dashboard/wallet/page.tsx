'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Topbar } from '@/components/dashboard/Topbar'
import { useSession } from '@/hooks/useSession'
import { useWallet } from '@/hooks/useWallet'

const TopUpModal = dynamic(
  () => import('@/components/wallet/TopUpModal').then((mod) => mod.TopUpModal),
  { ssr: false }
)

const STATUS_STYLES: Record<string, string> = {
  credit: 'bg-green-500/10 text-green-400 border border-green-500/20',
  debit:  'bg-red-500/10 text-red-400 border border-red-500/20',
}

const TX_ICONS: Record<string, string> = {
  credit: '⬆',
  debit:  '⬇',
}

export default function WalletPage() {
  const { user, token, loading: sessionLoading } = useSession()
  const { balance, transactions, loading: walletLoading, refresh } = useWallet(token)
  const [showTopUp, setShowTopUp] = useState<boolean>(false)

  const handleSignOut = () => { console.log("Signing out...") }

  if (sessionLoading || walletLoading) {
    return (
      <div className="min-h-screen bg-[#0B0E17] text-white grid place-items-center px-4">
        <p className="text-sm font-semibold text-[#5A6280] animate-pulse">Syncing Wallet...</p>
      </div>
    )
  }

  const credits = transactions.filter(t => t.type === 'credit').reduce((a: number, t: any) => a + Number(t.amount), 0)
  const debits  = transactions.filter(t => t.type === 'debit').reduce((a: number, t: any) => a + Number(t.amount), 0)

  return (
    <div className="min-h-screen w-full bg-[#0B0E17] text-white flex flex-col overflow-x-hidden">
      <Topbar
        title="My Wallet"
        balance={balance}
        onTopUp={() => setShowTopUp(true)}
        onSignOut={handleSignOut}
      />

      <main className="flex-1 p-4 sm:p-7 max-w-5xl w-full mx-auto flex flex-col gap-5">

        {/* Balance Card */}
        <div className="bg-[#131826] border border-[#2A3352] rounded-2xl p-6">
          <p className="text-xs font-bold text-[#5A6280] uppercase tracking-wider mb-1">Available Balance</p>
          <h2 className="text-3xl sm:text-4xl font-bold font-head text-[#22C67A] break-all">
            ${balance.toFixed(2)} <span className="text-sm font-medium text-[#5A6280]">USD</span>
          </h2>
          <button
            onClick={() => setShowTopUp(true)}
            className="mt-4 px-5 py-2 bg-[#F5A623] text-black text-xs font-bold rounded-lg hover:bg-[#E8891A] transition-all"
          >
            + Top Up Wallet
          </button>
        </div>

        {/* Summary Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#131826] border border-[#2A3352] rounded-2xl p-4">
            <p className="text-[11px] text-[#5A6280] uppercase font-semibold mb-1">Total Credited</p>
            <p className="text-lg font-bold text-[#22C67A]">+${credits.toFixed(2)}</p>
          </div>
          <div className="bg-[#131826] border border-[#2A3352] rounded-2xl p-4">
            <p className="text-[11px] text-[#5A6280] uppercase font-semibold mb-1">Total Spent</p>
            <p className="text-lg font-bold text-red-400">-${debits.toFixed(2)}</p>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-[#131826] border border-[#2A3352] rounded-2xl p-4 sm:p-6">
          <h3 className="font-head font-bold text-[15px] mb-4">Transaction History</h3>

          {transactions.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-[#5A6280]">
              <div className="text-4xl mb-3 opacity-50">🧾</div>
              <p className="font-semibold text-[#8B92B0] mb-1">No transactions yet</p>
              <p className="text-[13px]">Top up your wallet to get started</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {transactions.map((t: any) => {
                const isCredit = t.type === 'credit'
                return (
                  <div key={t.id} className="flex items-center gap-3 p-3 bg-[#1C2236] border border-[#2A3352] rounded-xl hover:border-[#354060] transition-all">
                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0 ${isCredit ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {TX_ICONS[t.type] || '•'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[13px] truncate">
                        {t.description || (isCredit ? 'Wallet Top-up' : 'Service Charge')}
                      </p>
                      <p className="text-[11px] text-[#5A6280]">
                        {new Date(t.created_at).toLocaleString()}
                      </p>
                    </div>

                    {/* Status badge */}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLES[t.type] || 'bg-[#2A3352] text-[#8B92B0]'}`}>
                      {t.type === 'credit' ? 'CREDIT' : 'DEBIT'}
                    </span>

                    {/* Amount */}
                    <span className={`font-bold text-[13px] shrink-0 ${isCredit ? 'text-[#22C67A]' : 'text-red-400'}`}>
                      {isCredit ? '+' : '-'}${Number(t.amount).toFixed(2)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {showTopUp && user && (
        <TopUpModal
          onClose={() => setShowTopUp(false)}
          email={user.email || ''}
          userId={user.id}
          token={token}
          onSuccessRefresh={refresh}
        />
      )}
    </div>
  )
}
