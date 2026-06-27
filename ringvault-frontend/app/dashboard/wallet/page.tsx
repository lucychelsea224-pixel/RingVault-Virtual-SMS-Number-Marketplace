'use client'
import { useState, useEffect } from 'react'
import { Topbar } from '@/components/dashboard/Topbar'
import { TopUpModal } from '@/components/TopUpModal'

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
      // 1. Get user profile details (Adjust URL path to match your layout setup)
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
      <div className="min-h-screen bg-[#0B0E17] text-white grid place-items-center">
        <p className="text-sm font-semibold text-[#5A6280] animate-pulse">Syncing Wallet Balances...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0B0E17] text-white flex flex-col">
      {/* Top Bar Navigation layout */}
      <Topbar 
        title="My Wallet Storage" 
        balance={balance} 
        onTopUp={() => setShowTopUp(true)} 
        onSignOut={handleSignOut} 
      />

      {/* Main Page Layout Content Display area */}
      <main className="flex-1 p-4 sm:p-7 max-w-5xl w-full mx-auto">
        <div className="bg-[#131826] border border-[#2A3352] rounded-2xl p-6 mb-6">
          <p className="text-xs font-bold text-[#5A6280] uppercase tracking-wider mb-1">Available Funds</p>
          <h2 className="text-3xl font-bold font-head text-[#22C67A]">${balance.toFixed(2)} USD</h2>
        </div>

        <div className="border border-dashed border-[#2A3352] rounded-2xl p-12 text-center text-sm text-[#5A6280]">
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