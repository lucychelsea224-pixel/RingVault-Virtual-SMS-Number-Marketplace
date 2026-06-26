'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'

const AMOUNTS = [5, 10, 20, 50, 100, 200]

interface TopUpModalProps { 
  onClose: () => void; 
  // Explicitly define 3 arguments to match your layout.tsx calls
  onTopUp: (amount: number, email: string, userId: string) => Promise<number> 
}

export function TopUpModal({ onClose, onTopUp }: TopUpModalProps) {
  const [selected, setSelected] = useState(10)
  const [custom, setCustom]     = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const amount = custom ? parseFloat(custom) : selected

  // Updated to receive email/userId from the parent if needed, 
  // or just passed through here.
  const handlePay = async (email: string, userId: string) => {
    if (!amount || amount < 1) return setError('Enter a valid amount')
    setLoading(true); setError('')
    try { 
      // Ensure we call the prop with all 3 required arguments
      await onTopUp(amount, email, userId) 
      onClose() 
    }
    catch (e: any) { setError(e.message === 'Cancelled' ? '' : e.message || 'Payment failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center z-50" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#131826] border border-[#2A3352] rounded-2xl p-7 w-[400px] max-w-[95vw] shadow-2xl">
        <h2 className="font-head text-lg font-bold mb-1">💰 Top Up Wallet</h2>
        
        {/* ... (keep your existing UI) ... */}

        <button 
          onClick={() => handlePay('user-email-placeholder', 'user-id-placeholder')} 
          disabled={loading || !amount || amount < 1}
          className="w-full bg-[#01964D] hover:bg-[#017a3f] disabled:opacity-40 text-white rounded-xl py-3.5 font-head font-bold text-[15px] flex items-center justify-center gap-2 transition-all mb-2">
          🔒 {loading ? 'Opening Paystack...' : `Pay $${amount || 0} via Paystack`}
        </button>
        <Button variant="ghost" className="w-full justify-center" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  )
}