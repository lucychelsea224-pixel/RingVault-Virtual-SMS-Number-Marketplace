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
    if (!usdAmount || usdAmount < 1) return setError('Enter a valid amount')
    setError('')
    setLoading(true)

    try {
      initializePayment({
        onSuccess: () => {
          setLoading(false)
          onSuccessRefresh()
          onClose()
        },
        onClose: () => {
          setLoading(false)
        }
      })
    } catch (err: any) {
      setError(err.message || 'Could not load payment gateway.')
      setLoading(false)
    }
  }

  const activeSymbol = CURRENCIES.find(c => c.code === currency)?.symbol || '$'

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center z-50" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#131826] border border-[#2A3352] rounded-2xl p-7 w-[420px] max-w-[95vw] shadow-2xl">
        <h2 className="font-head text-lg font-bold mb-1">💰 Top Up Wallet (USD)</h2>
        <p className="text-[#5A6280] text-xs mb-4">Select the amount you want inside your USD wallet balance.</p>
        
        <div className="grid grid-cols-3 gap-2 mb-4">
          {AMOUNTS.map(a => (
            <button key={a} type="button" onClick={() => { setSelectedUsd(a); setCustomUsd('') }}
              className={`rounded-xl py-3 font-head font-bold text-sm border-2 transition-all ${(!customUsd && selectedUsd === a) ? 'border-[#F5A623] text-[#F5A623] bg-[rgba(245,166,35,0.1)]' : 'border-[#2A3352] bg-[#1C2236] hover:border-[#354060]'}`}>
              ${a}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <input type="number" min="1" value={customUsd} onChange={e => setCustomUsd(e.target.value)}
            placeholder="Or enter custom USD amount..."
            className="w-full bg-[#1C2236] border border-[#2A3352] rounded-lg px-4 py-2.5 text-[14px] text-[#EEF0F8] outline-none" />
        </div>

        <div className="mb-5">
          <label className="block text-[11px] font-bold text-[#5A6280] uppercase tracking-wider mb-1.5">Select Pay-In Currency</label>
          <select value={currency} onChange={e => setCurrency(e.target.value)}
            className="w-full bg-[#1C2236] border border-[#2A3352] rounded-lg px-3 py-2.5 text-[13px] text-[#EEF0F8] outline-none cursor-pointer hover:border-[#354060]">
            {CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="bg-[#1C2236] border border-[#2A3352] rounded-xl p-3.5 mb-4 text-xs space-y-2">
          <div className="flex justify-between text-[#5A6280]">
            <span>Funding Target:</span>
            <span className="font-bold text-white">${usdAmount || 0} USD</span>
          </div>
          <div className="flex justify-between text-[#5A6280]">
            <span>Exchange Rate:</span>
            <span>1 USD = {activeSymbol}{exchangeRate.toFixed(2)} {currency}</span>
          </div>
          <hr className="border-[#2A3352] my-1" />
          <div className="flex justify-between font-bold text-[14px]">
            <span className="text-[#F5A623]">Total to pay:</span>
            <span className="text-[#22C67A]">{activeSymbol}{localAmount.toLocaleString()} {currency}</span>
          </div>
        </div>

        {error && <p className="text-[#F75B5B] text-[12px] mb-3">{error}</p>}
        
        <button type="button" onClick={handlePay} disabled={loading || !usdAmount || usdAmount < 1}
          className="w-full bg-[#01964D] hover:bg-[#017a3f] text-white rounded-xl py-3.5 font-bold transition-all mb-2 disabled:opacity-40">
          {loading ? 'Opening Checkout...' : `Pay Now`}
        </button>
        <Button variant="ghost" className="w-full justify-center" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  )
}