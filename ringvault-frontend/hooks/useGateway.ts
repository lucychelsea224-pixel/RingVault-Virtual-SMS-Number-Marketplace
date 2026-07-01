import { useState, useRef, useCallback } from 'react'

const API = process.env.NEXT_PUBLIC_BACKEND_URL || ''
const POLL_INTERVAL_MS = 4000
const POLL_TIMEOUT_MS  = 15 * 60 * 1000 // 15 minutes

export type GatewayStatus = 'IDLE' | 'LOADING' | 'PENDING' | 'RECEIVED' | 'EXPIRED' | 'ERROR'

export interface GatewayState {
  status:    GatewayStatus
  phone:     string | null
  orderId:   string | null
  numberId:  string | null
  gateway:   string | null
  code:      string | null
  error:     string | null
}

export function useGateway(token: string) {
  const [state, setState] = useState<GatewayState>({
    status: 'IDLE', phone: null, orderId: null,
    numberId: null, gateway: null, code: null, error: null,
  })

  const pollRef    = useRef<NodeJS.Timeout | null>(null)
  const startedRef = useRef<number>(0)

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  const startPolling = useCallback((gateway: string, orderId: string) => {
    startedRef.current = Date.now()

    pollRef.current = setInterval(async () => {
      // Timeout guard
      if (Date.now() - startedRef.current > POLL_TIMEOUT_MS) {
        stopPolling()
        setState(s => ({ ...s, status: 'EXPIRED', error: 'Timed out waiting for SMS.' }))
        return
      }

      try {
        const res  = await fetch(`${API}/api/check-sms?gateway=${gateway}&orderId=${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()

        if (!data.success) return

        if (data.status === 'RECEIVED') {
          stopPolling()
          setState(s => ({ ...s, status: 'RECEIVED', code: data.code }))
        } else if (data.status === 'EXPIRED') {
          stopPolling()
          setState(s => ({ ...s, status: 'EXPIRED', error: 'Number expired before a code arrived.' }))
        }
        // PENDING — keep polling
      } catch {
        // Network hiccup — keep polling, don't stop
      }
    }, POLL_INTERVAL_MS)
  }, [token, stopPolling])

  const fetchNumber = useCallback(async (gateway: string, service: string, country: string) => {
    stopPolling()
    setState({ status: 'LOADING', phone: null, orderId: null, numberId: null, gateway: null, code: null, error: null })

    try {
      const res  = await fetch(`${API}/api/fetch-number`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ gateway, service, country }),
      })
      const data = await res.json()

      if (!data.success) throw new Error(data.error || 'Failed to fetch number.')

      setState(s => ({
        ...s,
        status:   'PENDING',
        phone:    data.phone,
        orderId:  data.orderId,
        numberId: data.number_id,
        gateway:  data.gateway,
      }))

      startPolling(data.gateway, data.orderId)
    } catch (err: any) {
      setState(s => ({ ...s, status: 'ERROR', error: err.message }))
    }
  }, [token, stopPolling, startPolling])

  const cancelOrder = useCallback(async () => {
    if (!state.gateway || !state.orderId || !state.numberId) return
    stopPolling()
    try {
      await fetch(`${API}/api/cancel-order`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ gateway: state.gateway, orderId: state.orderId, number_id: state.numberId }),
      })
    } finally {
      setState({ status: 'IDLE', phone: null, orderId: null, numberId: null, gateway: null, code: null, error: null })
    }
  }, [state, token, stopPolling])

  const reset = useCallback(() => {
    stopPolling()
    setState({ status: 'IDLE', phone: null, orderId: null, numberId: null, gateway: null, code: null, error: null })
  }, [stopPolling])

  return { state, fetchNumber, cancelOrder, reset }
}
