'use client'
import { useSession } from '@/hooks/useSession'
import { createClient } from '@/lib/supabase/client'

interface TopbarProps {
  title: string
  balance?: number
  onTopUp?: () => void
  onSignOut?: () => void
}

export function Topbar({ title, balance, onTopUp }: TopbarProps) {
  const { user } = useSession()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.replace('/auth/login')
  }

  return (
    <header className="flex items-center justify-between px-5 py-4 border-b border-[#2A3352] bg-[#0B0F1A] sticky top-0 z-30">
      <h1 className="font-head font-bold text-[16px]">{title}</h1>
      <div className="flex items-center gap-3">
        {balance !== undefined && (
          <div className="hidden sm:flex items-center gap-2 bg-[#1C2236] border border-[#2A3352] rounded-lg px-3 py-1.5">
            <span className="text-[11px] text-[#5A6280]">Balance</span>
            <span className="text-[13px] font-bold text-[#22C67A]">${balance.toFixed(2)}</span>
          </div>
        )}
        {onTopUp && (
          <button onClick={onTopUp}
            className="text-[12px] bg-[#F5A623] hover:bg-[#E8891A] text-black font-bold px-3 py-1.5 rounded-lg transition-all">
            + Top Up
          </button>
        )}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#2A3352] grid place-items-center text-[12px] font-bold text-[#F5A623]">
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <button onClick={handleSignOut}
            className="text-[12px] text-[#5A6280] hover:text-red-400 font-semibold transition-colors hidden sm:block">
            Sign Out
          </button>
        </div>
      </div>
    </header>
  )
}
