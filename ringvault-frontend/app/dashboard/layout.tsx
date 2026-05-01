'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { Topbar } from '@/components/dashboard/Topbar'
import { TopUpModal } from '@/components/wallet/TopUpModal'
import { useSession } from '@/hooks/useSession'
import { useWallet } from '@/hooks/useWallet'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, token, loading, signOut } = useSession()
  const { balance, topUp } = useWallet(token)
  const [showTopUp, setShowTopUp] = useState(false)
  const [pageTitle, setPageTitle] = useState('Dashboard')

  useEffect(() => { if (!loading && !user) router.push('/auth/login') }, [loading, user])

  if (loading || !user) return <div className="min-h-screen bg-[#0B0F1A] grid place-items-center text-[#5A6280]">Loading…</div>

  const handleSignOut = async () => { await signOut(); router.push('/auth/login') }

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Topbar title={pageTitle} balance={balance} onTopUp={() => setShowTopUp(true)} onSignOut={handleSignOut} />
        <div className="flex-1 overflow-y-auto p-7">
          {children}
        </div>
      </main>
      {showTopUp && (
        <TopUpModal onClose={() => setShowTopUp(false)} onTopUp={(amt) => topUp(amt, user.email!, user.id)} />
      )}
    </div>
  )
}
