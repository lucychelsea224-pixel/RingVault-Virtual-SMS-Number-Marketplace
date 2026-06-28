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
        getTransactions(token).catch(() => ({ transactions: [] })),
      ])
      setBalance(balanceData?.balance ?? 0)
      setTransactions(txData?.transactions ?? [])
    } catch (error) {
      console.error('Failed to fetch wallet data:', error)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { balance, transactions, loading, refresh }
}
