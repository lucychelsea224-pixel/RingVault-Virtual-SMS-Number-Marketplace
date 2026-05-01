'use client'
import { useTheme } from '@/components/ui/ThemeProvider'
import { Toggle } from '@/components/ui/Toggle'
import { Button } from '@/components/ui/Button'

interface TopbarProps { title: string; balance: number; onTopUp: () => void; onSignOut: () => void }

export function Topbar({ title, balance, onTopUp, onSignOut }: TopbarProps) {
  const { dark, toggle } = useTheme()
  return (
    <header className="bg-[#131826] border-b border-[#2A3352] h-[60px] px-7 flex items-center justify-between gap-4 flex-shrink-0">
      <h1 className="font-head text-lg font-bold">{title}</h1>
      <div className="flex items-center gap-3">
        {/* Wallet chip */}
        <div className="flex items-center gap-2 bg-[#1C2236] border border-[#2A3352] rounded-full px-4 py-1.5 text-[13px] font-semibold">
          <span className="w-2 h-2 rounded-full bg-[#22C67A] shadow-[0_0_8px_rgba(34,198,122,0.8)]" />
          ${balance.toFixed(2)}
        </div>
        <Button variant="accent" size="sm" onClick={onTopUp}>+ Top Up</Button>
        <Toggle on={!dark} onChange={toggle} />
        <span className="text-[12px] text-[#5A6280]">{dark ? 'Dark' : 'Light'}</span>
        <button onClick={onSignOut} className="text-[12px] text-[#5A6280] hover:text-[#EEF0F8] transition-colors ml-1">Sign out</button>
      </div>
    </header>
  )
}
