// lib/api.ts — typed wrappers for every backend endpoint
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

async function authFetch(path: string, token: string, opts: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(opts.headers || {}),
    },
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Request failed')
  return data
}

export async function searchNumbers(
  token: string,
  params: { country_code: string; administrative_area?: string; limit?: number }
) {
  const qs = new URLSearchParams(params as any).toString()
  return authFetch(`/api/search-numbers?${qs}`, token)
}

export async function buyNumber(token: string, phone_number: string) {
  return authFetch('/api/buy-number', token, {
    method: 'POST',
    body: JSON.stringify({ phone_number }),
  })
}

export async function getMyNumbers(token: string) {
  return authFetch('/api/my-numbers', token)
}

export async function releaseNumber(token: string, id: string) {
  return authFetch(`/api/release-number/${id}`, token, { method: 'DELETE' })
}

export async function getWalletBalance(token: string) {
  return authFetch('/api/wallet/balance', token)
}

export async function getTransactions(token: string) {
  return authFetch('/api/wallet/transactions', token)
}

export async function verifyPayment(token: string, reference: string) {
  return authFetch('/api/wallet/verify-payment', token, {
    method: 'POST',
    body: JSON.stringify({ reference }),
  })
}
