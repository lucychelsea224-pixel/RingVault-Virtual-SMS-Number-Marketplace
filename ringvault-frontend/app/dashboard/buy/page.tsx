'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StepBar } from '@/components/wizard/StepBar'
import { CountryGrid, COUNTRIES } from '@/components/wizard/CountryGrid'
import { NumberList } from '@/components/wizard/NumberList'
import { Button } from '@/components/ui/Button'
import { useSession } from '@/hooks/useSession'
import { searchNumbers, buyNumber } from '@/lib/api'

const STATES: Record<string, string[]> = {
  US: ['California','New York','Texas','Florida','Illinois','Washington','Georgia'],
  GB: ['England','Scotland','Wales','London','Manchester'],
  CA: ['Ontario','British Columbia','Quebec','Alberta'],
  DE: ['Bavaria','Berlin','Hamburg','North Rhine-Westphalia'],
  FR: ['Île-de-France','Normandy','Provence'],
  AU: ['New South Wales','Victoria','Queensland'],
  BR: ['São Paulo','Rio de Janeiro','Minas Gerais'],
  NL: ['North Holland','South Holland','Utrecht'],
}

export default function BuyPage() {
  const router = useRouter()
  const { token } = useSession()
  const [step, setStep]             = useState(1)
  const [country, setCountry]       = useState<string | null>(null)
  const [state, setState]           = useState('')
  const [numbers, setNumbers]       = useState<any[]>([])
  const [loading, setLoading]       = useState(false)
  const [buying, setBuying]         = useState<string | null>(null)
  const [error, setError]           = useState('')

  const countryObj = COUNTRIES.find(c => c.code === country)

  const handleCountrySelect = (code: string) => { setCountry(code); setState('') }

  const handleSearchNumbers = async () => {
    if (!country || !state) return
    setLoading(true); setError('')
    try {
      const data = await searchNumbers(token, { country_code: country, administrative_area: state })
      setNumbers(data.numbers)
      setStep(3)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleBuy = async (n: any) => {
    setBuying(n.phone_number); setError('')
    try {
      await buyNumber(token, n.phone_number)
      router.push('/dashboard?bought=1')
    } catch (e: any) { setError(e.message) }
    finally { setBuying(null) }
  }

  return (
    <div className="max-w-2xl mx-auto animate-[fadeSlide_0.3s_ease]">
      <StepBar current={step} />

      <div className="bg-[#131826] border border-[#2A3352] rounded-2xl p-7">
        {error && <div className="mb-4 p-3 rounded-xl bg-[rgba(247,91,91,0.1)] border border-[rgba(247,91,91,0.3)] text-[#F75B5B] text-[13px]">{error}</div>}

        {/* Step 1 */}
        {step === 1 && (
          <>
            <h2 className="font-head text-[17px] font-bold mb-1">Select a Country</h2>
            <p className="text-[13px] text-[#8B92B0] mb-5">Choose the country for your virtual SMS number</p>
            <CountryGrid selected={country} onSelect={handleCountrySelect} />
            <div className="flex justify-end mt-5">
              <Button variant="accent" disabled={!country} onClick={() => setStep(2)}>Next: Select State →</Button>
            </div>
          </>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl">{countryObj?.flag}</span>
              <h2 className="font-head text-[17px] font-bold">{countryObj?.name}</h2>
            </div>
            <p className="text-[13px] text-[#8B92B0] mb-5">Select a state or region to search for numbers</p>
            <div className="mb-5">
              <label className="block text-[11px] font-semibold text-[#8B92B0] uppercase tracking-wide mb-2">State / Region</label>
              <div className="relative">
                <select value={state} onChange={e => setState(e.target.value)}
                  className="w-full bg-[#1C2236] border border-[#2A3352] rounded-lg px-4 py-2.5 text-[14px] text-[#EEF0F8] outline-none focus:border-[#F5A623] appearance-none transition-colors">
                  <option value="">-- Select a state --</option>
                  {(STATES[country!] ?? []).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A6280] pointer-events-none text-xs">▼</span>
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>← Back</Button>
              <Button variant="accent" disabled={!state} loading={loading} onClick={handleSearchNumbers}>Search Numbers →</Button>
            </div>
          </>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-head text-[17px] font-bold">{countryObj?.flag} {countryObj?.name} — {state}</h2>
                <p className="text-[13px] text-[#8B92B0]">{numbers.length} numbers available</p>
              </div>
            </div>
            <NumberList numbers={numbers} loading={loading} onBuy={handleBuy} buying={buying} />
            <div className="mt-5">
              <Button variant="ghost" onClick={() => setStep(2)}>← Back</Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
