'use client'
import { useEffect, useState, useCallback } from 'react'
import { getWalletBalance, getTransactions, verifyPayment } from '@/lib/api'

export function useWallet(token: string) {
  const [balance, setBalance]           = useState(0)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading]           = useState(true)

  const refresh = useCallback(async () => {
    if (!token) return
    try {
      const [b, t] = await Promise.all([getWalletBalance(token), getTransactions(token)])
      setBalance(b.balance); setTransactions(t.transactions)
    } catch {}
    finally { setLoading(false) }
  }, [token])

  useEffect(() => { refresh() }, [refresh])

  const topUp = useCallback((amountUSD: number, email: string, userId: string) => {
    return new Promise<number>((resolve, reject) => {
      if (typeof window === 'undefined' || !(window as any).PaystackPop) return reject(new Error('Paystack not loaded'))
      ;(window as any).PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        email, amount: Math.round(amountUSD * 1600 * 100), currency: 'NGN',
        metadata: { usd_amount: amountUSD },
        callback: async (r: any) => {
          try { const d = await verifyPayment(token, r.reference); setBalance(d.balance); refresh(); resolve(d.balance) }
          catch (e) { reject(e) }
        },
        onClose: () => reject(new Error('Cancelled')),
      }).openIframe()
    })
  }, [token, refresh])

  return { balance, transactions, loading, refresh, topUp }
}
