'use client'
import { useState, useEffect, useCallback } from 'react'
import { getWalletBalance, getTransactions } from '@/lib/api'

export function useWallet(token: string | null) {
  const [balance, setBalance] = useState<number>(0)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  const refresh = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const [balanceData, txData] = await Promise.all([
        getWalletBalance(token),
        getTransactions(token).catch(() => ({ transactions: [] })), // don't block balance on this
      ])
      setBalance(balanceData?.balance ?? 0)
      setTransactions(txData?.transactions ?? [])
    } catch (error) {
      console.error('Failed to fetch wallet data:', error)
    } finally {
      setLoading(false)
    }
  }, [token])

  // This is the part that was missing entirely: balance was declared but
  // never fetched, so it stayed at its initial 0 no matter what was in Supabase.
  useEffect(() => {
    refresh()
  }, [refresh])

  return { balance, transactions, loading, refresh }
}
