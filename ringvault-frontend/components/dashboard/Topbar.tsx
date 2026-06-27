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
    <header className="bg-[#131826] border-b border-[#2A3352] min-h-[60px] py-3 px-4 sm:px-7 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
      {/* Title */}
      <h1 className="font-head text-base sm:text-lg font-bold truncate">{title}</h1>
      
      {/* Control Actions Tray */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-between sm:justify-end w-full sm:w-auto">
        {/* Wallet chip */}
        <div className="flex items-center gap-2 bg-[#1C2236] border border-[#2A3352] rounded-full px-3 sm:px-4 py-1 sm:py-1.5 text-[12px] sm:text-[13px] font-semibold">
          <span className="w-2 h-2 rounded-full bg-[#22C67A] shadow-[0_0_8px_rgba(34,198,122,0.8)]" />
          {/* Formats safely to 2 decimal places */}
          ${typeof balance === 'number' ? balance.toFixed(2) : '0.00'}
        </div>
        
        {/* Quick action controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="accent" size="sm" onClick={onTopUp} className="text-[12px] px-3 py-1.5 h-auto">+ Top Up</Button>
          
          <div className="flex items-center gap-1.5 ml-1">
            <Toggle on={!dark} onChange={toggle} />
            <span className="text-[11px] text-[#5A6280] hidden xs:inline">{dark ? 'Dark' : 'Light'}</span>
          </div>
          
          <button onClick={onSignOut} className="text-[11px] sm:text-[12px] text-[#5A6280] hover:text-[#EEF0F8] transition-colors ml-2 border-l border-[#2A3352] pl-2 sm:pl-3">
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}