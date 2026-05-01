'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'

const AMOUNTS = [5, 10, 20, 50, 100, 200]

interface TopUpModalProps { onClose: () => void; onTopUp: (amount: number) => Promise<number> }

export function TopUpModal({ onClose, onTopUp }: TopUpModalProps) {
  const [selected, setSelected] = useState(10)
  const [custom, setCustom]     = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const amount = custom ? parseFloat(custom) : selected

  const handlePay = async () => {
    if (!amount || amount < 1) return setError('Enter a valid amount')
    setLoading(true); setError('')
    try { await onTopUp(amount); onClose() }
    catch (e: any) { setError(e.message === 'Cancelled' ? '' : e.message || 'Payment failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center z-50" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#131826] border border-[#2A3352] rounded-2xl p-7 w-[400px] max-w-[95vw] shadow-2xl animate-[modalIn_0.25s_ease]">
        <h2 className="font-head text-lg font-bold mb-1">💰 Top Up Wallet</h2>
        <p className="text-[13px] text-[#8B92B0] mb-6">Powered by Paystack · NGN · Secure checkout</p>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {AMOUNTS.map(a => (
            <button key={a} onClick={() => { setSelected(a); setCustom('') }}
              className={`rounded-xl py-3 font-head font-bold text-sm border-2 transition-all ${(!custom && selected === a) ? 'border-[#F5A623] text-[#F5A623] bg-[rgba(245,166,35,0.1)]' : 'border-[#2A3352] bg-[#1C2236] hover:border-[#354060]'}`}>
              ${a}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <label className="block text-[11px] font-semibold text-[#8B92B0] uppercase tracking-wide mb-2">Custom Amount (USD)</label>
          <input type="number" min="1" value={custom} onChange={e => setCustom(e.target.value)}
            placeholder="Enter amount..."
            className="w-full bg-[#1C2236] border border-[#2A3352] rounded-lg px-4 py-2.5 text-[14px] text-[#EEF0F8] outline-none focus:border-[#F5A623] transition-colors" />
        </div>

        {error && <p className="text-[#F75B5B] text-[12px] mb-3">{error}</p>}

        <button onClick={handlePay} disabled={loading || !amount || amount < 1}
          className="w-full bg-[#01964D] hover:bg-[#017a3f] disabled:opacity-40 text-white rounded-xl py-3.5 font-head font-bold text-[15px] flex items-center justify-center gap-2 transition-all mb-2">
          🔒 {loading ? 'Opening Paystack...' : `Pay $${amount || 0} via Paystack`}
        </button>
        <Button variant="ghost" className="w-full justify-center" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  )
}
