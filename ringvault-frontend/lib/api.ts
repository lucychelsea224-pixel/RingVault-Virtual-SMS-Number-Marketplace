// lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

async function authFetch(path: string, token: string, opts: RequestInit = {}) {
  if (!API_BASE) {
    throw new Error("API_BASE is not defined. Check your Cloudflare Environment Variables.");
  }

  const baseUrl = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const fullUrl = `${baseUrl}${cleanPath}`;

  const res = await fetch(fullUrl, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(opts.headers || {}),
    },
  });

  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("Backend did not return JSON. Ensure the Render service is live.");
  }

  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Request failed');
  return data;
}

// --- API FUNCTIONS ---
export const searchNumbers = (token: string, params: any) => 
  authFetch(`/api/search-numbers?${new URLSearchParams(params).toString()}`, token);

export const buyNumber = (token: string, phone_number: string) => 
  authFetch('/api/buy-number', token, { method: 'POST', body: JSON.stringify({ phone_number }) });

export const getMyNumbers = (token: string) => 
  authFetch('/api/my-numbers', token);

export const releaseNumber = (token: string, phone_number: string) => 
  authFetch('/api/release-number', token, { 
    method: 'POST', 
    body: JSON.stringify({ phone_number }) 
  });

// --- WALLET FUNCTIONS ---
export const getWalletBalance = (token: string) => 
  authFetch('/api/wallet/balance', token);

export const getTransactions = (token: string) => 
  authFetch('/api/wallet/transactions', token);

export const verifyPayment = (token: string, reference: string) => 
  authFetch('/api/wallet/verify-payment', token, {
    method: 'POST',
    body: JSON.stringify({ reference }),
  });