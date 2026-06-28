'use client'
import { useTheme } from '@/components/ui/ThemeProvider'
import { Toggle } from '@/components/ui/Toggle'
import { Button } from '@/components/ui/Button'

interface TopbarProps { 
  title: string; 
  balance: number; 
  onTopUp: () => void; 
  onSignOut: () => void; 
}

export function Topbar({ title, balance, onTopUp, onSignOut }: TopbarProps) {
  const { dark, toggle } = useTheme()
  
  return (
    <header className="bg-[#131826] border-b border-[#2A3352] w-full py-4 px-4 sm:px-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0 z-40 relative">
      {/* Title section - scales cleanly down on mobile screens */}
      <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start">
        <h1 className="font-head text-base sm:text-lg font-bold truncate max-w-[200px] xs:max-w-none">
          {title}
        </h1>
        {/* Secondary sign-out layout visual target on tiny devices */}
        <button onClick={onSignOut} className="text-[12px] text-[#5A6280] hover:text-[#EEF0F8] transition-colors sm:hidden">
          Sign out
        </button>
      </div>
      
      {/* Actions Tray - stacks horizontally or rows up cleanly without breaking borders */}
      <div className="flex items-center gap-3 justify-between sm:justify-end w-full sm:w-auto">
        {/* Wallet balance wrapper */}
        <div className="flex items-center gap-2 bg-[#1C2236] border border-[#2A3352] rounded-full px-3 sm:px-4 py-1.5 text-[12px] sm:text-[13px] font-semibold whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-[#22C67A] shadow-[0_0_8px_rgba(34,198,122,0.8)] flex-shrink-0" />
          <span>${typeof balance === 'number' ? balance.toFixed(2) : '0.00'}</span>
        </div>
        
        {/* Core Controls */}
        <div className="flex items-center gap-2.5">
          <Button variant="accent" size="sm" onClick={onTopUp} className="text-[12px] px-3 py-1.5 h-9 font-bold flex items-center justify-center">
            + Top Up
          </Button>
          
          <div className="flex items-center gap-1.5 ml-1">
            <Toggle on={!dark} onChange={toggle} />
            <span className="text-[11px] text-[#5A6280] hidden md:inline">{dark ? 'Dark' : 'Light'}</span>
          </div>
          
          <button onClick={onSignOut} className="text-[12px] text-[#5A6280] hover:text-[#EEF0F8] transition-colors ml-1 border-l border-[#2A3352] pl-3 hidden sm:inline">
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}