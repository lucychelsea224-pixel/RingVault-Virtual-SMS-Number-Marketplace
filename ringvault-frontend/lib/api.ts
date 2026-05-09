// lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function authFetch(path: string, token: string, opts: RequestInit = {}) {
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
    throw new Error("Backend did not return JSON. Check Render logs.");
  }

  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Request failed');
  return data;
}

export const searchNumbers = (token: string, params: any) => 
  authFetch(`/api/search-numbers?${new URLSearchParams(params).toString()}`, token);

export const buyNumber = (token: string, phone_number: string) => 
  authFetch('/api/buy-number', token, { method: 'POST', body: JSON.stringify({ phone_number }) });

export const getWalletBalance = (token: string) => 
  authFetch('/api/wallet/balance', token);