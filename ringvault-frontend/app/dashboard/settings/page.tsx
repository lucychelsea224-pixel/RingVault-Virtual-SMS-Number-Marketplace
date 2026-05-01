'use client'
import { useState } from 'react'
import { useSession } from '@/hooks/useSession'
import { useTheme } from '@/components/ui/ThemeProvider'
import { Toggle } from '@/components/ui/Toggle'
import { Button } from '@/components/ui/Button'

export default function SettingsPage() {
  const { user } = useSession()
  const { dark, toggle } = useTheme()
  const [notifs, setNotifs] = useState({ sms: true, expiry: true, lowBalance: false })

  return (
    <div className="animate-[fadeSlide_0.3s_ease] grid grid-cols-2 gap-5">
      {/* Profile */}
      <div className="bg-[#131826] border border-[#2A3352] rounded-2xl p-5">
        <h2 className="font-head font-bold text-[15px] mb-5">👤 Profile</h2>
        {[['Full Name', user?.user_metadata?.full_name ?? ''], ['Email', user?.email ?? ''], ['Phone', '+234 000 000 0000']].map(([label, val]) => (
          <div key={label} className="mb-4">
            <label className="block text-[11px] font-semibold text-[#8B92B0] uppercase tracking-wide mb-1.5">{label}</label>
            <input defaultValue={val} className="w-full bg-[#1C2236] border border-[#2A3352] rounded-lg px-4 py-2.5 text-[14px] text-[#EEF0F8] outline-none focus:border-[#F5A623] transition-colors" />
          </div>
        ))}
        <Button variant="accent">Save Changes</Button>
      </div>

      {/* Notifications + Appearance */}
      <div className="flex flex-col gap-5">
        <div className="bg-[#131826] border border-[#2A3352] rounded-2xl p-5">
          <h2 className="font-head font-bold text-[15px] mb-4">🔔 Notifications</h2>
          {([['sms','SMS received','Notify when a new SMS arrives'],['expiry','Number expiring','Remind 3 days before expiry'],['lowBalance','Low balance','Alert when balance is below $5']] as [keyof typeof notifs, string, string][]).map(([key, title, desc]) => (
            <div key={key} className="flex items-center justify-between py-3 border-b border-[#2A3352] last:border-0">
              <div>
                <div className="text-[13px] font-medium">{title}</div>
                <div className="text-[11px] text-[#5A6280]">{desc}</div>
              </div>
              <Toggle on={notifs[key]} onChange={() => setNotifs(p => ({ ...p, [key]: !p[key] }))} />
            </div>
          ))}
        </div>

        <div className="bg-[#131826] border border-[#2A3352] rounded-2xl p-5">
          <h2 className="font-head font-bold text-[15px] mb-4">🎨 Appearance</h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px] font-medium">Dark Mode</div>
              <div className="text-[11px] text-[#5A6280]">Toggle light / dark theme</div>
            </div>
            <Toggle on={dark} onChange={toggle} />
          </div>
        </div>

        <div className="bg-[#131826] border border-[#2A3352] rounded-2xl p-5">
          <h2 className="font-head font-bold text-[15px] mb-4">🔑 Webhook Config</h2>
          <div className="mb-3">
            <label className="block text-[11px] font-semibold text-[#8B92B0] uppercase tracking-wide mb-1.5">Telnyx Webhook URL</label>
            <input readOnly value="https://yourapp.com/webhook/sms" className="w-full bg-[#1C2236] border border-[#2A3352] rounded-lg px-4 py-2.5 text-[12px] font-mono text-[#8B92B0] outline-none" />
          </div>
          <Button variant="ghost" size="sm">Copy URL</Button>
        </div>
      </div>
    </div>
  )
}
