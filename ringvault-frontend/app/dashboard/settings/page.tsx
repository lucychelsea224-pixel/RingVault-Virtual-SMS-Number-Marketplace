'use client'
import { useState } from 'react'
import { useSession } from '@/hooks/useSession'
import { useTheme } from '@/components/ui/ThemeProvider'
import { Toggle } from '@/components/ui/Toggle'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const { user } = useSession()
  const { dark, toggle } = useTheme()
  const [notifs, setNotifs] = useState({ sms: true, expiry: true, lowBalance: false })
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  const [fullName, setFullName] = useState(user?.user_metadata?.full_name ?? '')
  const [phone, setPhone] = useState(user?.user_metadata?.phone ?? user?.phone ?? '')

  const handleSave = async () => {
    setSaving(true)
    setSaveMsg('')
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName, phone }
      })
      if (error) throw error
      setSaveMsg('✅ Profile saved successfully!')
    } catch (err: any) {
      setSaveMsg('❌ ' + (err.message || 'Failed to save'))
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMsg(''), 4000)
    }
  }

  return (
    <div className="animate-[fadeSlide_0.3s_ease] grid grid-cols-1 lg:grid-cols-2 gap-5">

      {/* Profile */}
      <div className="bg-[#131826] border border-[#2A3352] rounded-2xl p-5">
        <h2 className="font-head font-bold text-[15px] mb-5">👤 Profile</h2>

        {saveMsg && (
          <div className={`mb-4 p-3 rounded-xl text-[13px] ${saveMsg.startsWith('✅') ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {saveMsg}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-[11px] font-semibold text-[#8B92B0] uppercase tracking-wide mb-1.5">Full Name</label>
          <input
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Enter your full name"
            className="w-full bg-[#1C2236] border border-[#2A3352] rounded-lg px-4 py-2.5 text-[14px] text-[#EEF0F8] outline-none focus:border-[#F5A623] transition-colors"
          />
        </div>

        <div className="mb-4">
          <label className="block text-[11px] font-semibold text-[#8B92B0] uppercase tracking-wide mb-1.5">Email</label>
          <input
            readOnly
            value={user?.email ?? ''}
            className="w-full bg-[#1C2236] border border-[#2A3352] rounded-lg px-4 py-2.5 text-[14px] text-[#8B92B0] outline-none cursor-not-allowed"
          />
          <p className="text-[11px] text-[#5A6280] mt-1">Email cannot be changed</p>
        </div>

        <div className="mb-6">
          <label className="block text-[11px] font-semibold text-[#8B92B0] uppercase tracking-wide mb-1.5">Phone Number</label>
          <input
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="e.g. +2348012345678"
            className="w-full bg-[#1C2236] border border-[#2A3352] rounded-lg px-4 py-2.5 text-[14px] text-[#EEF0F8] outline-none focus:border-[#F5A623] transition-colors"
          />
          <p className="text-[11px] text-[#5A6280] mt-1">Used for account recovery only</p>
        </div>

        <Button variant="accent" onClick={handleSave} loading={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Right Column */}
      <div className="flex flex-col gap-5">

        {/* Notifications */}
        <div className="bg-[#131826] border border-[#2A3352] rounded-2xl p-5">
          <h2 className="font-head font-bold text-[15px] mb-4">🔔 Notifications</h2>
          {([
            ['sms', 'SMS received', 'Notify when a new SMS arrives'],
            ['expiry', 'Number expiring', 'Remind 3 days before expiry'],
            ['lowBalance', 'Low balance', 'Alert when balance is below $5'],
          ] as [keyof typeof notifs, string, string][]).map(([key, title, desc]) => (
            <div key={key} className="flex items-center justify-between py-3 border-b border-[#2A3352] last:border-0">
              <div>
                <div className="text-[13px] font-medium">{title}</div>
                <div className="text-[11px] text-[#5A6280]">{desc}</div>
              </div>
              <Toggle on={notifs[key]} onChange={() => setNotifs(p => ({ ...p, [key]: !p[key] }))} />
            </div>
          ))}
        </div>

        {/* Appearance */}
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

        {/* Account */}
        <div className="bg-[#131826] border border-[#2A3352] rounded-2xl p-5">
          <h2 className="font-head font-bold text-[15px] mb-4">🔐 Account</h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px] font-medium text-red-400">Sign Out</div>
              <div className="text-[11px] text-[#5A6280]">Sign out of your account</div>
            </div>
            <button
              onClick={async () => {
                const supabase = createClient()
                await supabase.auth.signOut()
                window.location.replace('/auth/login')
              }}
              className="px-4 py-1.5 text-[12px] font-bold rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
