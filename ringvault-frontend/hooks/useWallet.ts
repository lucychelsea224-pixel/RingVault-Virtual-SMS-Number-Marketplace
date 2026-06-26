'use client'
import { useEffect, useState, useCallback } from 'react'
// Ensure these are exported from your lib/api.ts
import { getWalletBalance, getTransactions, verifyPayment } from '@/lib/api'

export function useWallet(token: string) {
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!token) return
    try {
      // These must match the exports in lib/api.ts
      const [balanceData, transactionsData] = await Promise.all([
        getWalletBalance(token), 
        getTransactions(token)
      ])
      setBalance(balanceData.balance)
      setTransactions(transactionsData.transactions)
    } catch (err) {
      console.error("Failed to refresh wallet:", err)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { 
    refresh() 
  }, [refresh])

  const topUp = useCallback(async (amountUSD: number, email: string) => {
    return new Promise<number>((resolve, reject) => {
      const paystack = (window as any).PaystackPop
      if (typeof window === 'undefined' || !paystack) {
        return reject(new Error('Paystack SDK not loaded'))
      }

      paystack.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        email,
        amount: Math.round(amountUSD * 1600 * 100), // Ensure this matches your rate logic
        currency: 'NGN',
        metadata: { usd_amount: amountUSD },
        callback: async (response: any) => {
          try {
            const data = await verifyPayment(token, response.reference)
            setBalance(data.balance)
            refresh()
            resolve(data.balance)
          } catch (e) {
            reject(e)
          }
        },
        onClose: () => reject(new Error('Payment cancelled')),
      }).openIframe()
    })
  }, [token, refresh])

  return { balance, transactions, loading, refresh, topUp }
}