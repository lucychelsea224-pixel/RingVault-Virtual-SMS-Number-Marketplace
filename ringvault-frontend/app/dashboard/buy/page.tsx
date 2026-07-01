'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { StepBar } from '@/components/wizard/StepBar'
import { Button } from '@/components/ui/Button'
import { useSession } from '@/hooks/useSession'

const GATEWAYS = [
  { id: 'gatewayA', label: 'Gateway A', tag: 'Global · Fast' },
  { id: 'gatewayB', label: 'Gateway B', tag: 'Wide service list' },
  { id: 'gatewayC', label: 'Gateway C', tag: 'Premium · Low latency' },
  { id: 'gatewayD', label: 'Gateway D', tag: 'Budget · USA focus' },
  { id: 'gatewayE', label: 'Gateway E', tag: 'Europe · Reliable' },
  { id: 'gatewayF', label: 'Gateway F', tag: 'Broad support' },
]

const SERVICES = [
  { id: 'airbnb', name: 'Airbnb' },
  { id: 'amazon', name: 'Amazon / AWS' },
  { id: 'aol', name: 'AOL' },
  { id: 'baidu', name: 'Baidu' },
  { id: 'battlenet', name: 'Battle.net / Blizzard' },
  { id: 'bolt', name: 'Bolt' },
  { id: 'careem', name: 'Careem' },
  { id: 'discord', name: 'Discord' },
  { id: 'ebay', name: 'eBay' },
  { id: 'facebook', name: 'Facebook / Meta' },
  { id: 'google', name: 'Google / Gmail / YouTube' },
  { id: 'grindr', name: 'Grindr' },
  { id: 'instagram', name: 'Instagram / Threads' },
  { id: 'kakaotalk', name: 'KakaoTalk' },
  { id: 'line', name: 'Line' },
  { id: 'linkedin', name: 'LinkedIn' },
  { id: 'netflix', name: 'Netflix' },
  { id: 'nike', name: 'Nike' },
  { id: 'openai', name: 'OpenAI / ChatGPT' },
  { id: 'paypal', name: 'PayPal' },
  { id: 'shopee', name: 'Shopee' },
  { id: 'snapchat', name: 'Snapchat' },
  { id: 'steam', name: 'Steam' },
  { id: 'telegram', name: 'Telegram' },
  { id: 'tiktok', name: 'TikTok / Douyin' },
  { id: 'tinder', name: 'Tinder' },
  { id: 'twitter', name: 'Twitter / X' },
  { id: 'uber', name: 'Uber / Postmates' },
  { id: 'viber', name: 'Viber' },
  { id: 'wechat', name: 'WeChat' },
  { id: 'whatsapp', name: 'WhatsApp' },
]

const COUNTRIES = [
  { region: '🌎 North America', items: [
    { code: '1', name: '🇺🇸 USA' },
    { code: '52', name: '🇲🇽 Mexico' },
    { code: '1264', name: '🇦🇮 Anguilla' },
  ]},
  { region: '🌍 Europe', items: [
    { code: '44', name: '🇬🇧 UK' },
    { code: '31', name: '🇳🇱 Netherlands' },
    { code: '33', name: '🇫🇷 France' },
    { code: '49', name: '🇩🇪 Germany' },
    { code: '34', name: '🇪🇸 Spain' },
    { code: '39', name: '🇮🇹 Italy' },
    { code: '46', name: '🇸🇪 Sweden' },
    { code: '47', name: '🇳🇴 Norway' },
    { code: '45', name: '🇩🇰 Denmark' },
    { code: '358', name: '🇫🇮 Finland' },
    { code: '48', name: '🇵🇱 Poland' },
    { code: '40', name: '🇷🇴 Romania' },
    { code: '351', name: '🇵🇹 Portugal' },
    { code: '32', name: '🇧🇪 Belgium' },
    { code: '43', name: '🇦🇹 Austria' },
    { code: '41', name: '🇨🇭 Switzerland' },
  ]},
  { region: '🌏 Asia', items: [
    { code: '91', name: '🇮🇳 India' },
    { code: '86', name: '🇨🇳 China' },
    { code: '81', name: '🇯🇵 Japan' },
    { code: '82', name: '🇰🇷 South Korea' },
    { code: '66', name: '🇹🇭 Thailand' },
    { code: '84', name: '🇻🇳 Vietnam' },
    { code: '62', name: '🇮🇩 Indonesia' },
    { code: '60', name: '🇲🇾 Malaysia' },
    { code: '63', name: '🇵🇭 Philippines' },
    { code: '65', name: '🇸🇬 Singapore' },
    { code: '92', name: '🇵🇰 Pakistan' },
    { code: '880', name: '🇧🇩 Bangladesh' },
  ]},
  { region: '🌍 Africa', items: [
    { code: '234', name: '🇳🇬 Nigeria' },
    { code: '233', name: '🇬🇭 Ghana' },
    { code: '27', name: '🇿🇦 South Africa' },
    { code: '254', name: '🇰🇪 Kenya' },
    { code: '212', name: '🇲🇦 Morocco' },
    { code: '20', name: '🇪🇬 Egypt' },
    { code: '225', name: '🇨🇮 Ivory Coast' },
    { code: '237', name: '🇨🇲 Cameroon' },
  ]},
  { region: '🌎 South America', items: [
    { code: '55', name: '🇧🇷 Brazil' },
    { code: '57', name: '🇨🇴 Colombia' },
    { code: '54', name: '🇦🇷 Argentina' },
    { code: '56', name: '🇨🇱 Chile' },
    { code: '51', name: '🇵🇪 Peru' },
  ]},
]

const API = process.env.NEXT_PUBLIC_BACKEND_URL || ''
const POLL_INTERVAL = 4000
const POLL_TIMEOUT  = 15 * 60 * 1000

export default function BuyPage() {
  const router = useRouter()
  const { token } = useSession()

  const [step, setStep] = useState(1)
  const [gateway, setGateway] = useState('gatewayA')
  const [country, setCountry] = useState<string | null>(null)
  const [service, setService] = useState('')
  const [serviceSearch, setServiceSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [phone, setPhone] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [numberId, setNumberId] = useState<string | null>(null)
  const [smsStatus, setSmsStatus] = useState('')
  const [otpCode, setOtpCode] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const pollRef   = useRef<NodeJS.Timeout | null>(null)
  const startedAt = useRef<number>(0)

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }

  const startPolling = (gw: string, oid: string) => {
    startedAt.current = Date.now()
    setSmsStatus('Waiting for SMS code...')

    pollRef.current = setInterval(async () => {
      if (Date.now() - startedAt.current > POLL_TIMEOUT) {
        stopPolling()
        setSmsStatus('Timed out — no code received.')
        return
      }
      try {
        const res  = await fetch(`${API}/api/check-sms?gateway=${gw}&orderId=${oid}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (!data.success) return
        if (data.status === 'RECEIVED') {
          stopPolling()
          setOtpCode(data.code)
          setSmsStatus('✅ Verification code received!')
        } else if (data.status === 'EXPIRED') {
          stopPolling()
          setSmsStatus('Number expired — no code arrived.')
        }
      } catch { /* network hiccup — keep polling */ }
    }, POLL_INTERVAL)
  }

  const handleGetNumber = async () => {
    if (!service) return
    setLoading(true)
    setError('')
    setPhone(null)
    setOrderId(null)
    setNumberId(null)
    setOtpCode(null)
    stopPolling()

    try {
      const res  = await fetch(`${API}/api/fetch-number`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ gateway, service, country: country || '1' }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Failed to get number.')
      setPhone(data.phone)
      setOrderId(data.orderId)
      setNumberId(data.number_id)
      setStep(3)
      startPolling(gateway, data.orderId)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!orderId || !numberId) return
    setCancelling(true)
    stopPolling()
    try {
      await fetch(`${API}/api/cancel-order`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ gateway, orderId, number_id: numberId }),
      })
    } finally {
      setCancelling(false)
      setStep(1)
      setPhone(null)
      setOrderId(null)
      setNumberId(null)
      setOtpCode(null)
    }
  }

  const filteredServices = SERVICES.filter(s =>
    s.name.toLowerCase().includes(serviceSearch.toLowerCase())
  )

  return (
    <div className="w-full max-w-2xl mx-auto px-2 sm:px-4">
      <div className="w-full overflow-x-auto mb-2"><StepBar current={step} /></div>

      <div className="bg-[#131826] border border-[#2A3352] rounded-2xl p-4 sm:p-7">

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-[#F75B5B] text-[13px]">{error}</div>
        )}

        {/* ── STEP 1: Pick gateway + country ── */}
        {step === 1 && (
          <>
            <h2 className="font-head text-[17px] font-bold mb-1">Select Provider & Country</h2>
            <p className="text-[13px] text-[#8B92B0] mb-5">Choose which gateway to use, then pick a country</p>

            <div className="mb-5">
              <label className="block text-[11px] font-semibold text-[#8B92B0] uppercase tracking-wide mb-2">
                Provider Gateway
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {GATEWAYS.map(g => (
                  <button key={g.id} onClick={() => setGateway(g.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${gateway === g.id ? 'border-[#F5A623] bg-[#F5A623]/10' : 'border-[#2A3352] bg-[#1C2236] hover:border-[#354060]'}`}>
                    <div className="font-head font-bold text-[13px]">{g.label}</div>
                    <div className="text-[10px] text-[#5A6280] mt-0.5">{g.tag}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-semibold text-[#8B92B0] uppercase tracking-wide">Country</label>
                <button onClick={() => { setCountry(null); setStep(2) }}
                  className="text-[11px] text-[#F5A623] font-semibold hover:underline">
                  ⚡ Auto-Pick Cheapest
                </button>
              </div>
              <div className="flex flex-col gap-4 max-h-64 overflow-y-auto pr-1">
                {COUNTRIES.map(region => (
                  <div key={region.region}>
                    <p className="text-[10px] font-bold text-[#5A6280] uppercase tracking-wider mb-1">{region.region}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {region.items.map(c => (
                        <button key={c.code} onClick={() => setCountry(c.code)}
                          className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg border text-left transition-all ${country === c.code ? 'bg-[#F5A623] border-[#F5A623] text-black' : 'bg-[#1C2236] border-[#2A3352] text-[#EEF0F8] hover:border-[#F5A623]/50'}`}>
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button variant="accent" onClick={() => setStep(2)}>
              Next: Choose Service →
            </Button>
          </>
        )}

        {/* ── STEP 2: Pick service ── */}
        {step === 2 && (
          <>
            <h2 className="font-head text-[17px] font-bold mb-1">Choose Service</h2>
            <p className="text-[13px] text-[#8B92B0] mb-5">
              Gateway: <span className="text-[#F5A623] font-semibold">{gateway.toUpperCase()}</span>
              {country && <> · Country: <span className="text-[#F5A623] font-semibold">{country}</span></>}
            </p>

            <input
              type="text"
              placeholder="Search service (e.g. WhatsApp, Telegram...)"
              value={serviceSearch}
              onChange={e => setServiceSearch(e.target.value)}
              className="w-full bg-[#1C2236] border border-[#2A3352] rounded-lg px-4 py-2.5 text-[14px] text-[#EEF0F8] outline-none focus:border-[#F5A623] mb-3"
            />

            <div className="max-h-56 overflow-y-auto flex flex-col gap-1 mb-5">
              {filteredServices.map(s => (
                <button key={s.id} onClick={() => { setService(s.id); setServiceSearch(s.name) }}
                  className={`text-left px-3 py-2 rounded-lg text-[13px] transition-all ${service === s.id ? 'bg-[#F5A623] text-black font-bold' : 'bg-[#1C2236] text-[#EEF0F8] hover:bg-[#242B42]'}`}>
                  {s.name}
                </button>
              ))}
              {filteredServices.length === 0 && (
                <p className="text-[#5A6280] text-[12px] px-3 py-2">No services found</p>
              )}
            </div>

            <div className="bg-[#F5A623]/5 border border-[#F5A623]/15 rounded-xl p-3 mb-5">
              <p className="text-[12px] text-[#E0961B]">
                ℹ️ <strong>$2.00</strong> will be deducted from your wallet. Auto-refunded if provider is dry.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(1)}>← Back</Button>
              <Button variant="accent" disabled={!service || loading} loading={loading} onClick={handleGetNumber}>
                Get Number →
              </Button>
            </div>
          </>
        )}

        {/* ── STEP 3: Number display + OTP polling ── */}
        {step === 3 && (
          <>
            <h2 className="font-head text-[17px] font-bold mb-1">Your Number is Ready</h2>
            <p className="text-[13px] text-[#8B92B0] mb-5">
              Use this number to verify your <span className="text-[#F5A623] font-semibold capitalize">{service}</span> account
            </p>

            <div className="bg-[#1C2236] border border-[#2A3352] rounded-xl p-5 mb-4 flex flex-col items-center gap-2">
              <span className="text-[11px] text-[#8B92B0] font-semibold uppercase tracking-wider">Allocated Number</span>
              <span className="text-2xl sm:text-3xl font-mono font-bold text-[#EEF0F8] tracking-widest select-all">{phone}</span>
              <span className="text-[11px] text-[#5A6280] font-semibold px-3 py-1 rounded-full bg-[#131826] border border-[#2A3352]">
                {gateway.toUpperCase()}
              </span>
            </div>

            <div className="border-t border-[#1C2236] pt-4 mb-4">
              <div className="flex items-center gap-3 mb-3">
                {!otpCode && <div className="w-2 h-2 rounded-full bg-[#F5A623] animate-ping shrink-0" />}
                <span className="text-[13px] text-[#EEF0F8] font-medium">{smsStatus}</span>
              </div>

              {otpCode && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5 flex flex-col items-center gap-2">
                  <p className="text-[11px] text-[#5A6280] uppercase font-semibold">Verification Code</p>
                  <div className="text-4xl font-mono font-extrabold text-[#22C67A] tracking-widest select-all">{otpCode}</div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              {!otpCode && (
                <button onClick={handleCancel} disabled={cancelling}
                  className="flex-1 py-2.5 text-[12px] font-bold rounded-xl border border-[#4F8EF7]/40 text-[#4F8EF7] hover:bg-[#4F8EF7]/10 transition-all disabled:opacity-50">
                  {cancelling ? 'Cancelling...' : '💰 Cancel & Refund'}
                </button>
              )}
              <button onClick={() => { stopPolling(); setStep(1); setOtpCode(null); setPhone(null) }}
                className="flex-1 py-2.5 text-[12px] font-bold rounded-xl border border-[#2A3352] text-[#8B92B0] hover:border-[#354060] transition-all">
                ← New Request
              </button>
              <Button variant="accent" onClick={() => router.push('/dashboard')}>Dashboard</Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
