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

export default function WalletPage() {
  const { user, token, loading: sessionLoading } = useSession()
  const { balance, transactions, loading: walletLoading, refresh } = useWallet(token)
  const [showTopUp, setShowTopUp] = useState<boolean>(false)

  const handleSignOut = () => {
    console.log("Signing out user...")
  }

  if (sessionLoading || walletLoading) {
    return (
      <div className="min-h-screen bg-[#0B0E17] text-white grid place-items-center px-4">
        <p className="text-sm font-semibold text-[#5A6280] animate-pulse">Syncing Wallet Balances...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-[#0B0E17] text-white flex flex-col overflow-x-hidden">
      <Topbar 
        title="My Wallet Storage" 
        balance={balance} 
        onTopUp={() => setShowTopUp(true)} 
        onSignOut={handleSignOut} 
      />

      <main className="flex-1 p-4 sm:p-7 max-w-5xl w-full mx-auto flex flex-col gap-4 sm:gap-6">
        <div className="bg-[#131826] border border-[#2A3352] rounded-2xl p-6 mb-2">
          <p className="text-xs font-bold text-[#5A6280] uppercase tracking-wider mb-1">Available Funds</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-head text-[#22C67A] break-all">
            ${balance.toFixed(2)} <span className="text-xs sm:text-sm font-medium text-[#5A6280]">USD</span>
          </h2>
        </div>

        <div className="flex-1 min-h-[200px] border border-dashed border-[#2A3352] rounded-2xl p-4 sm:p-6">
          {transactions.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center text-sm text-[#5A6280]">
              Transaction details and history items will be rendered below.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {transactions.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between border-b border-[#2A3352]/50 py-2 text-sm">
                  <div>
                    <p className="font-semibold">{t.description || (t.type === 'credit' ? 'Top up' : 'Charge')}</p>
                    <p className="text-[11px] text-[#5A6280]">{new Date(t.created_at).toLocaleString()}</p>
                  </div>
                  <span className={t.type === 'credit' ? 'text-[#22C67A] font-bold' : 'text-red-400 font-bold'}>
                    {t.type === 'credit' ? '+' : '-'}${Number(t.amount).toFixed(2)}
                  </span>
                </div>
              ))}
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
