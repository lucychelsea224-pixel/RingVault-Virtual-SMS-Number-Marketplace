'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { StepBar } from '@/components/wizard/StepBar'
import { CountryGrid, COUNTRIES } from '@/components/wizard/CountryGrid'
import { Button } from '@/components/ui/Button'
import { useSession } from '@/hooks/useSession'
import { resendCode } from '@/lib/api'

const SERVICES = [
  { id: 'whatsapp', name: 'WhatsApp' },
  { id: 'telegram', name: 'Telegram' },
  { id: 'google', name: 'Google / YouTube / Gmail' },
  { id: 'instagram', name: 'Instagram / Facebook' },
  { id: 'twitter', name: 'X / Twitter' },
  { id: 'openai', name: 'OpenAI / ChatGPT / Claude' },
  { id: 'paypal', name: 'PayPal / Venmo' },
  { id: 'discord', name: 'Discord' }
]

const RENTAL_DURATIONS = [
  { days: 1,  label: '1 Day Lease' },
  { days: 3,  label: '3 Days Lease' },
  { days: 7,  label: '7 Days Weekly Lease' },
  { days: 30, label: '30 Days Full Monthly Lease' }
]

const API = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://ringvault-api.onrender.com'

export default function BuyPage() {
  const router = useRouter()
  const { token } = useSession()
  const [orderType, setOrderType] = useState<'short' | 'long'>('short')
  const [step, setStep] = useState(1)
  const [country, setCountry] = useState<string | null>(null)
  const [service, setService] = useState('')
  const [duration, setDuration] = useState('1')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [allocatedNumber, setAllocatedNumber] = useState<string | null>(null)
  const [numberId, setNumberId] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [smsStatus, setSmsStatus] = useState('')
  const [otpCode, setOtpCode] = useState<string | null>(null)
  const [fullSms, setFullSms] = useState<string | null>(null)
  const [resending, setResending] = useState(false)
  const [resendMsg, setResendMsg] = useState<{ msg: string; ok: boolean } | null>(null)

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => { if (pollIntervalRef.current) clearInterval(pollIntervalRef.current) }
  }, [])

  const startOtpPolling = (id: string) => {
    setSmsStatus('Waiting for SMS verification code...')
    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API}/api/check-otp/${id}`)
        const data = await res.json()
        if (data.success && (data.status === 'Completed' || data.otp_code)) {
          clearInterval(pollIntervalRef.current!)
          setOtpCode(data.otp_code)
          setFullSms(data.full_sms)
          setSmsStatus('✅ Verification code received!')
        }
      } catch (err) { console.error(err) }
    }, 4000)
  }

  const handleExecuteOrder = async () => {
    if (!service) return
    setLoading(true)
    setError('')
    setAllocatedNumber(null)
    setNumberId(null)
    setSessionId(null)
    setOtpCode(null)
    setFullSms(null)
    setResendMsg(null)

    const targetUrl = orderType === 'short' ? `${API}/api/buy-number` : `${API}/api/rent-number`
    const payload = orderType === 'short'
      ? { service_name: service, state_code: country }
      : { service_name: service, duration_days: duration }

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await response.json()
      if (data.success) {
        setAllocatedNumber(data.phone_number)
        setNumberId(data.number_id || null)
        setSessionId(data.session_id || null)
        setStep(3)
        if (orderType === 'short') {
          startOtpPolling(data.session_id)
        } else {
          setSmsStatus('Long-term rental active. Monitor from your dashboard.')
        }
      } else {
        throw new Error(data.error || 'Failed to allocate number.')
      }
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }

  const handleResend = async () => {
    if (!numberId) return
    setResending(true)
    setResendMsg(null)
    try {
      await resendCode(token, numberId)
      setResendMsg({ msg: '🔄 Resend requested! New code on its way. ($0.75 charged)', ok: true })
      // Restart polling
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
      if (sessionId) startOtpPolling(sessionId)
    } catch (err: any) {
      setResendMsg({ msg: err?.message || 'Resend failed. Check your balance.', ok: false })
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto animate-[fadeSlide_0.3s_ease] px-2 sm:px-4">
      {step < 3 && (
        <div className="flex bg-[#1C2236] p-1 rounded-xl mb-4 border border-[#2A3352]">
          <button onClick={() => { setOrderType('short'); setStep(1); }}
            className={`flex-1 py-2 text-center rounded-lg text-xs font-semibold transition-all ${orderType === 'short' ? 'bg-[#F5A623] text-black shadow-md' : 'text-[#8B92B0] hover:text-white'}`}>
            ⚡ One-Time Activation
          </button>
          <button onClick={() => { setOrderType('long'); setStep(2); }}
            className={`flex-1 py-2 text-center rounded-lg text-xs font-semibold transition-all ${orderType === 'long' ? 'bg-[#F5A623] text-black shadow-md' : 'text-[#8B92B0] hover:text-white'}`}>
            📅 Long-Term Rental
          </button>
        </div>
      )}

      <div className="w-full overflow-x-auto mb-2">
        <StepBar current={step} />
      </div>

      <div className="bg-[#131826] border border-[#2A3352] rounded-2xl p-4 sm:p-7">
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[rgba(247,91,91,0.1)] border border-[rgba(247,91,91,0.3)] text-[#F75B5B] text-[13px]">
            {error}
          </div>
        )}

        {/* Step 1: Country */}
        {step === 1 && orderType === 'short' && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div>
                <h2 className="font-head text-[17px] font-bold mb-1">Select Country</h2>
                <p className="text-[13px] text-[#8B92B0]">Choose a country or auto-pick the cheapest</p>
              </div>
              <Button onClick={() => { setCountry(null); setStep(2); }} variant="accent" className="text-xs py-1.5 px-4 font-semibold">
                ⚡ Auto-Pick Cheapest
              </Button>
            </div>
            <CountryGrid selected={country} onSelect={(code) => { setCountry(code); setStep(2); }} />
          </>
        )}

        {/* Step 2: Configure */}
        {step === 2 && (
          <>
            <h2 className="font-head text-[17px] font-bold mb-1">
              {orderType === 'short' ? 'Configure Activation' : 'Configure Rental'}
            </h2>
            <p className="text-[13px] text-[#8B92B0] mb-5">Select the app and settings</p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[11px] font-semibold text-[#8B92B0] uppercase mb-2">Target App</label>
                <select value={service} onChange={e => setService(e.target.value)}
                  className="w-full bg-[#1C2236] border border-[#2A3352] rounded-lg px-4 py-2.5 text-[14px] text-[#EEF0F8] outline-none appearance-none">
                  <option value="">-- Choose app --</option>
                  {SERVICES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {orderType === 'long' && (
                <div>
                  <label className="block text-[11px] font-semibold text-[#8B92B0] uppercase mb-2">Rental Period</label>
                  <select value={duration} onChange={e => setDuration(e.target.value)}
                    className="w-full bg-[#1C2236] border border-[#2A3352] rounded-lg px-4 py-2.5 text-[14px] text-[#EEF0F8] outline-none appearance-none">
                    {RENTAL_DURATIONS.map(d => <option key={d.days} value={d.days}>{d.label}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className="bg-[rgba(245,166,35,0.05)] border border-[rgba(245,166,35,0.15)] rounded-xl p-3 mb-6">
              <p className="text-[12px] text-[#E0961B] leading-relaxed">
                ℹ️ <strong>Pricing:</strong> RingVault adds a flat <strong>$1.50</strong> markup on top of wholesale cost.
              </p>
            </div>

            <div className="flex justify-between gap-3">
              <Button variant="ghost" onClick={() => setStep(orderType === 'short' ? 1 : 2)}>← Back</Button>
              <Button variant="accent" disabled={!service} loading={loading} onClick={handleExecuteOrder}>
                {orderType === 'short' ? 'Get Number →' : 'Start Rental →'}
              </Button>
            </div>
          </>
        )}

        {/* Step 3: Terminal */}
        {step === 3 && (
          <>
            <h2 className="font-head text-[17px] font-bold mb-1">Your Number is Ready</h2>
            <p className="text-[13px] text-[#8B92B0] mb-6">Use this number to receive your verification SMS</p>

            <div className="bg-[#1C2236] border border-[#2A3352] rounded-xl p-5 mb-5 flex flex-col items-center gap-3">
              <span className="text-[11px] text-[#8B92B0] font-semibold uppercase tracking-wider">Allocated Number</span>
              <span className="text-2xl sm:text-3xl font-mono font-bold text-[#EEF0F8] tracking-widest select-all">{allocatedNumber}</span>
              <div className="text-xs text-[#27AE60] bg-[rgba(39,174,96,0.1)] px-3 py-1 rounded-full font-medium">
                {orderType === 'short' ? '⚡ One-Time Activation Active' : '📅 Long-Term Rental Active'}
              </div>
            </div>

            {/* SMS Status */}
            <div className="border-t border-[#1C2236] pt-5">
              <div className="flex items-center gap-3 mb-4">
                {!otpCode && <div className="w-2 h-2 rounded-full bg-[#F5A623] animate-ping shrink-0" />}
                <span className="text-[13px] text-[#EEF0F8] font-medium">{smsStatus}</span>
              </div>

              {otpCode && (
                <div className="bg-[rgba(39,174,96,0.1)] border border-[rgba(39,174,96,0.3)] rounded-xl p-5 mb-4 animate-[fadeSlide_0.3s_ease]">
                  <p className="text-[11px] text-[#5A6280] text-center mb-1 uppercase font-semibold">Verification Code</p>
                  <div className="text-center font-mono text-4xl font-extrabold text-[#27AE60] tracking-widest my-2 select-all">{otpCode}</div>
                  {fullSms && <p className="mt-2 text-xs text-[#8B92B0] text-center italic">"{fullSms}"</p>}
                </div>
              )}

              {/* Resend section — only for short-term */}
              {orderType === 'short' && (
                <div className="bg-[#1C2236] border border-[#2A3352] rounded-xl p-4 mb-4">
                  <p className="text-[12px] text-[#8B92B0] mb-3">
                    Didn't receive the code? Request a resend. <span className="text-[#F5A623] font-semibold">$0.75 will be charged.</span>
                  </p>
                  {resendMsg && (
                    <div className={`text-[11px] px-3 py-2 rounded-lg mb-3 ${resendMsg.ok ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {resendMsg.msg}
                    </div>
                  )}
                  <button
                    onClick={handleResend}
                    disabled={resending || !numberId}
                    className="w-full py-2 text-[12px] font-bold rounded-lg border border-[#F5A623]/40 text-[#F5A623] hover:bg-[#F5A623]/10 transition-all disabled:opacity-40"
                  >
                    {resending ? 'Requesting Resend...' : '🔄 Resend Verification Code'}
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mt-4">
              <Button variant="ghost" onClick={() => {
                if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
                setStep(1)
                setOtpCode(null)
                setResendMsg(null)
              }}>← New Request</Button>
              <Button variant="accent" onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
