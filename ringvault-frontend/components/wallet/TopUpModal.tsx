'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { usePaystackPayment } from 'react-paystack'

const AMOUNTS = [5, 10, 20, 50, 100, 200]
const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar 🇺🇸' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira 🇳🇬' },
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi 🇬🇭' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand 🇿🇦' }
]

interface TopUpModalProps { 
  onClose: () => void; 
  email: string;
  userId: string;
  onSuccessRefresh: () => void;
}

export function TopUpModal({ onClose, email, userId, onSuccessRefresh }: TopUpModalProps) {
  const [selectedUsd, setSelectedUsd] = useState(10)
  const [customUsd, setCustomUsd] = useState('')
  const [currency, setCurrency] = useState('NGN')
  const [exchangeRate, setExchangeRate] = useState(1500)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const usdAmount = customUsd ? parseFloat(customUsd) : selectedUsd
  const localAmount = Math.round(usdAmount * exchangeRate)

  useEffect(() => {
    if (currency === 'USD') {
      setExchangeRate(1)
      return
    }
    const fetchRate = async () => {
      try {
        const res = await fetch(`/api/wallet/get-rate/${currency}`)
        const data = await res.json()
        if (data.success && data.rate) {
          setExchangeRate(data.rate)
        }
      } catch (err) {
        console.error("Failed fetching live rate:", err)
      }
    }
    fetchRate()
  }, [currency])

  const config = {
    reference: `rv_${Math.floor(Math.random() * 1000000000)}_${Date.now()}`,
    email: email || 'user@ringvault.com',
    amount: localAmount * 100, 
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
    currency: currency,
    metadata: {
      custom_fields: [], 
      user_id: userId,
      usd_amount: usdAmount
    }
  }

  const initializePayment = usePaystackPayment(config)

  const handlePay = () => {
    if (!usdAmount || usdAmount < 1) return

    setError('')
    // @ts-ignore
    initializePayment({
      onSuccess: async (response: any) => {
        setLoading(true)
        try {
          const verifyRes = await fetch('/api/wallet/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reference: response.reference,
              userId: userId,
              usdAmount: usdAmount
            })
          })
          const verifyData = await verifyRes.json()
          if (verifyData.success) {
            onSuccessRefresh()
            onClose()
          } else {
            setError(verifyData.message || 'Verification failed.')
          }
        } catch (err) {
          console.error("Verification error:", err)
          setError('Server error verifying transaction.')
        } finally {
          setLoading(false)
        }
      },
      onClose: () => {
        console.log("Payment wrapper integration window dismissed.")
      }
    })
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm grid place-items-center z-50 p-4">
      <div className="bg-[#131826] border border-[#2A3352] rounded-2xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#5A6280] hover:text-[#EEF0F8] text-lg">×</button>
        
        <h3 className="font-head font-bold text-base mb-4">◈ Top Up Balance</h3>
        
        {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg mb-4">{error}</div>}

        {/* Currency Selection */}
        <div className="mb-4">
          <label className="block text-[11px] font-semibold text-[#8B92B0] uppercase tracking-wide mb-1.5">Payment Currency</label>
          <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full bg-[#1C2236] border border-[#2A3352] rounded-lg px-4 py-2.5 text-sm outline-none text-[#EEF0F8]">
            {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
        </div>

        {/* Amount Chips Grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {AMOUNTS.map(amt => (
            <button key={amt} type="button" onClick={() => { setSelectedUsd(amt); setCustomUsd(''); }} className={`py-2 text-xs font-semibold rounded-lg border transition-all ${usdAmount === amt && !customUsd ? 'bg-[#F5A623] border-[#F5A623] text-black' : 'bg-[#1C2236] border-[#2A3352] text-[#EEF0F8] hover:border-[#5A6280]'}`}>
              ${amt}
            </button>
          ))}
        </div>

        {/* Custom Input */}
        <div className="mb-5">
          <label className="block text-[11px] font-semibold text-[#8B92B0] uppercase tracking-wide mb-1.5">Custom Amount (USD)</label>
          <div className="relative">
            <span className="absolute left-4 top-2.5 text-sm text-[#5A6280]">$</span>
            <input type="number" placeholder="Enter custom value" value={customUsd} onChange={e => setCustomUsd(e.target.value)} className="w-full bg-[#1C2236] border border-[#2A3352] rounded-lg pl-8 pr-4 py-2 text-sm outline-none text-[#EEF0F8] focus:border-[#F5A623]" />
          </div>
        </div>

        {/* Summary Block */}
        <div className="bg-[#1C2236] rounded-xl p-4 mb-6 border border-[#2A3352]">
          <div className="flex justify-between text-xs text-[#8B92B0] mb-1">
            <span>Exchange Rate</span>
            <span>1 USD = {exchangeRate} {currency}</span>
          </div>
          <div className="flex justify-between text-sm font-bold pt-2 border-t border-[#2A3352]/50">
            <span>Total Payable</span>
            <span className="text-[#22C67A]">{CURRENCIES.find(c => c.code === currency)?.symbol}{localAmount.toLocaleString()}</span>
          </div>
        </div>

        <Button variant="accent" className="w-full font-bold" onClick={handlePay} disabled={loading}>
          {loading ? 'Processing Transaction...' : 'Pay with Paystack'}
        </Button>
      </div>
    </div>
  )
}