'use client'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic' // 1. Added Next.js dynamic utility
import { Topbar } from '@/components/dashboard/Topbar'

// 2. Wrap TopUpModal to prevent the "window is not defined" server pre-render crash
const TopUpModal = dynamic(
  () => import('@/components/wallet/TopUpModal').then((mod) => mod.TopUpModal),
  { ssr: false }
)

// Mock User structure for authentication safety fallbacks
interface UserProfile {
  id: string;
  email: string;
}

export default function WalletPage() {
  const [balance, setBalance] = useState<number>(0)
  const [showTopUp, setShowTopUp] = useState<boolean>(false)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  // Fetch current user authentication profiles & balances
  const fetchWalletData = async () => {
    try {
      // 1. Get user profile details
      const userRes = await fetch('/api/auth/me') 
      const userData = await userRes.json()
      if (userData?.user) {
        setUser(userData.user)
      } else {
        // Fallback placeholder identity for testing environments
        setUser({ id: '00000000-0000-0000-0000-000000000000', email: 'testuser@ringvault.com' })
      }

      // 2. Fetch balance matching state
      const balanceRes = await fetch('/api/wallet/balance')
      const balanceData = await balanceRes.json()
      if (balanceData.success) {
        setBalance(balanceData.balance)
      }
    } catch (err) {
      console.error("Error connecting with API balances:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWalletData()
  }, [])

  const handleSignOut = () => {
    console.log("Signing out user...")
    // Insert your custom logout function here
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0E17] text-white grid place-items-center px-4">
        <p className="text-sm font-semibold text-[#5A6280] animate-pulse">Syncing Wallet Balances...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-[#0B0E17] text-white flex flex-col overflow-x-hidden">
      {/* Top Bar Navigation layout */}
      <Topbar 
        title="My Wallet Storage" 
        balance={balance} 
        onTopUp={() => setShowTopUp(true)} 
        onSignOut={handleSignOut} 
      />

      {/* Main Page Layout Content Display area */}
      <main className="flex-1 p-4 sm:p-7 max-w-5xl w-full mx-auto flex flex-col gap-4 sm:gap-6">
        <div className="bg-[#131826] border border-[#2A3352] rounded-2xl p-6 mb-2">
          <p className="text-xs font-bold text-[#5A6280] uppercase tracking-wider mb-1">Available Funds</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-head text-[#22C67A] break-all">
            ${balance.toFixed(2)} <span className="text-xs sm:text-sm font-medium text-[#5A6280]">USD</span>
          </h2>
        </div>

        <div className="flex-1 min-h-[200px] border border-dashed border-[#2A3352] rounded-2xl p-12 text-center text-sm text-[#5A6280] flex items-center justify-center">
          Transaction details and history items will be rendered below.
        </div>
      </main>

      {/* Complete Connected Modal rendering logic */}
      {showTopUp && user && (
        <TopUpModal
          onClose={() => setShowTopUp(false)}
          email={user.email}
          userId={user.id}
          onSuccessRefresh={fetchWalletData}
        />
      )}
    </div>
  )
}