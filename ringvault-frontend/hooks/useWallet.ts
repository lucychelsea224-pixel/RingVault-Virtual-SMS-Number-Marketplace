'use client'
import { useState, useEffect } from 'react'

export function useWallet(token: string | null) {
  const [balance, setBalance] = useState<number>(0)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  const topUp = async (amount: number, email: string, userId: string): Promise<any> => {
    setLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/wallet/topup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount, email, userId }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to initiate top up')
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      console.error(error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return { balance, transactions, loading, topUp }
}