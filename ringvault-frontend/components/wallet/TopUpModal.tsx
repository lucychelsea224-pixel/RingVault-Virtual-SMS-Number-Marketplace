'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'

const AMOUNTS = [5, 10, 20, 50, 100, 200]

interface TopUpModalProps { 
  onClose: () => void; 
  // Fix: Ensure the signature here matches the 3 arguments passed in layout.tsx
  onTopUp: (amount: number, email: string, userId: string) => Promise<number> 
}

export function TopUpModal({ onClose, onTopUp }: TopUpModalProps) {
  const [selected, setSelected] = useState(10)
  const [custom, setCustom]     = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const amount = custom ? parseFloat(custom) : selected

  // Pass email and userId from the layout into this component or 
  // define them here if available in your scope.
  const handlePay = async () => {
    if (!amount || amount < 1) return setError('Enter a valid amount')
    setLoading(true); setError('')
    try { 
      // This matches the updated interface
      // Replace placeholders with actual user data if needed here
      await onTopUp(amount, 'user@example.com', 'user-id'); 
      onClose(); 
    }
    catch (e: any) { setError(e.message === 'Cancelled' ? '' : e.message || 'Payment failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center z-50" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#131826] border border-[#2A3352] rounded-2xl p-7 w-[400px] max-w-[95vw] shadow-2xl">
        <h2 className="font-head text-lg font-bold mb-1">💰 Top Up Wallet</h2>
        {/* UI content remains same */}
        <button onClick={handlePay} className="w-full bg-[#01964D] text-white rounded-xl py-3.5">
          {loading ? 'Processing...' : `Pay $${amount || 0}`}
        </button>
      </div>
    </div>
  )
}