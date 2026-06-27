'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { StepBar } from '@/components/wizard/StepBar'
import { CountryGrid, COUNTRIES } from '@/components/wizard/CountryGrid'
import { Button } from '@/components/ui/Button'
import { useSession } from '@/hooks/useSession'

// Synced seamlessly with standard SMSPool application service naming keys
const SERVICES = [
  { id: 'whatsapp', name: 'WhatsApp' },
  { id: 'telegram', name: 'Telegram' },
  { id: 'google', name: 'Google / YouTube' },
  { id: 'instagram', name: 'Instagram / Facebook' },
  { id: 'twitter', name: 'X / Twitter' },
  { id: 'openai', name: 'OpenAI / ChatGPT' },
  { id: 'paypal', name: 'PayPal' },
]

export default function BuyPage() {
  const router = useRouter()
  const { token } = useSession()
  const [step, setStep] = useState(1)
  const [country, setCountry] = useState<string | null>(null) // Holds international dial code string (e.g. '1', '44')
  const [service, setService] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Verification Processing States
  const [allocatedNumber, setAllocatedNumber] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [smsStatus, setSmsStatus] = useState('')
  const [otpCode, setOtpCode] = useState<string | null>(null)
  const [fullSms, setFullSms] = useState<string | null>(null)

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const countryObj = COUNTRIES.find(c => c.code === country)

  const handleCountrySelect = (code: string) => { 
    setCountry(code) 
    setService('') 
  }

  // Clear polling loops safely if the user changes tabs or leaves the page
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [])

  // Live Real-Time Verification Engine (Fires every 4 seconds)
  const startOtpPolling = (id: string) => {
    setSmsStatus('Waiting for verification code to land...')
    
    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`https://ringvault-api.onrender.com/api/check-otp/${id}`)
        const data = await res.json()

        if (data.success) {
          if (data.status === 'Completed' || data.otp_code) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
            setOtpCode(data.otp_code)
            setFullSms(data.full_sms)
            setSmsStatus('Success! Verification code extracted.')
          } else if (data.status === 'Expired') {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
            setSmsStatus('Session window expired or timed out. Please try again.')
          }
        }
      } catch (err) {
        console.error("Failed to fetch current verification updates:", err)
      }
    }, 4000)
  }

  // Requests a brand new physical carrier mobile number extraction
  const handleRequestLine = async () => {
    if (!service || !country) return
    setLoading(true)
    setError('')
    setAllocatedNumber(null)
    setOtpCode(null)
    setFullSms(null)

    try {
      // 🌟 CONNECTED PAYLOAD: Passes down both the targeted service and state_code selection
      const response = await fetch('https://ringvault-api.onrender.com/api/buy-number', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          service_name: service, 
          state_code: country // Sends standard state dialing identifier string directly
        })
      })

      const data = await response.json()

      if (data.success) {
        setAllocatedNumber(data.phone_number)
        setSessionId(data.session_id)
        setStep(3)
        // Fire polling engine automatically using returned session identity tracking token
        startOtpPolling(data.session_id)
      } else {
        throw new Error(data.error || 'Failed to allocate premium line.')
      }
    } catch (e: any) { 
      setError(e.message) 
    } finally { 
      setLoading(false) 
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto animate-[fadeSlide_0.3s_ease] px-2 sm:px-4">
      <div className="w-full overflow-x-auto mb-2">
        <StepBar current={step} />
      </div>

      <div className="bg-[#131826] border border-[#2A3352] rounded-2xl p-4 sm:p-7">
        {error && <div className="mb-4 p-3 rounded-xl bg-[rgba(247,91,91,0.1)] border border-[rgba(247,91,91,0.3)] text-[#F75B5B] text-[13px]">{error}</div>}

        {/* Step 1: Country Selection View */}
        {step === 1 && (
          <>
            <h2 className="font-head text-[17px] font-bold mb-1">Select a Country Code</h2>
            <p className="text-[13px] text-[#8B92B0] mb-5">Choose the target location prefix for your phone verification line</p>
            <CountryGrid selected={country} onSelect={handleCountrySelect} />
            <div className="flex justify-end mt-5">
              <Button className="w-full sm:w-auto" variant="accent" disabled={!country} onClick={() => setStep(2)}>Next: Target App →</Button>
            </div>
          </>
        )}

        {/* Step 2: Service/App Selection View */}
        {step === 2 && (
          <>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl">{countryObj?.flag}</span>
              <h2 className="font-head text-[17px] font-bold">{countryObj?.name} (+{country})</h2>
            </div>
            <p className="text-[13px] text-[#8B92B0] mb-5">Select the application you want to bypass verification for</p>
            
            <div className="mb-5">
              <label className="block text-[11px] font-semibold text-[#8B92B0] uppercase tracking-wide mb-2">Application / Service</label>
              <div className="relative">
                <select value={service} onChange={e => setService(e.target.value)}
                  className="w-full bg-[#1C2236] border border-[#2A3352] rounded-lg px-4 py-2.5 text-[14px] text-[#EEF0F8] outline-none focus:border-[#F5A623] appearance-none transition-colors">
                  <option value="">-- Select target app --</option>
                  {SERVICES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A6280] pointer-events-none text-xs">▼</span>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-between gap-3">
              <Button className="w-full sm:w-auto" variant="ghost" onClick={() => setStep(1)}>← Back</Button>
              <Button className="w-full sm:w-auto" variant="accent" disabled={!service} loading={loading} onClick={handleRequestLine}>Generate Mobile Line →</Button>
            </div>
          </>
        )}

        {/* Step 3: Active Mobile Extraction Live Terminal */}
        {step === 3 && (
          <>
            <h2 className="font-head text-[17px] font-bold mb-1">Your Virtual Activation Terminal</h2>
            <p className="text-[13px] text-[#8B92B0] mb-6">Enter this number into your target application now to trigger the SMS stream</p>
            
            <div className="bg-[#1C2236] border border-[#2A3352] rounded-xl p-5 mb-5 flex flex-col items-center justify-center gap-3">
              <span className="text-[11px] text-[#8B92B0] font-semibold uppercase tracking-wider">Allocated Number</span>
              <span className="text-2xl sm:text-3xl font-mono font-bold text-[#EEF0F8] tracking-widest selection:bg-[#F5A623]">
                {allocatedNumber}
              </span>
              <div className="text-xs text-[#F5A623] bg-[rgba(245,166,35,0.1)] px-3 py-1 rounded-full font-medium">
                Non-VoIP SIM Line
              </div>
            </div>

            <div className="border-t border-[#1C2236] pt-5 mb-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 rounded-full bg-[#F5A623] animate-ping" />
                <span className="text-[13px] text-[#EEF0F8] font-medium">{smsStatus}</span>
              </div>

              {/* Dynamic Verification Presentation Module */}
              {otpCode && (
                <div className="bg-[rgba(39,174,96,0.1)] border border-[rgba(39,174,96,0.3)] rounded-xl p-5 animate-[fadeSlide_0.3s_ease]">
                  <span className="block text-[11px] text-[#27AE60] font-semibold uppercase tracking-wider mb-2 text-center">Extracted Verification Code</span>
                  <div className="text-center font-mono text-4xl font-extrabold text-[#27AE60] tracking-widest my-2 select-all">
                    {otpCode}
                  </div>
                  {fullSms && (
                    <p className="mt-3 text-xs text-[#8B92B0] text-center italic font-sans border-t border-[rgba(39,174,96,0.1)] pt-2">
                      "{fullSms}"
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mt-6">
              <Button variant="ghost" onClick={() => {
                if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
                setStep(2)
              }}>
                ← Cancel & Exit
              </Button>
              {otpCode && (
                <Button variant="accent" onClick={() => router.push('/dashboard?bought=1')}>
                  Go to Dashboard
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}