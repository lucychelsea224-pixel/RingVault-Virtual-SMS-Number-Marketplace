// REMOVE AND DELETE THIS ENTIRE BLOCK FROM THE BOTTOM OF app/page.tsx:
'use client'
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [balance, setBalance] = useState(0);

  const fetchBalance = async () => {
    const res = await fetch('/api/wallet/balance');
    const data = await res.json();
    if (data.success) setBalance(data.balance);
  };

  // 1. Fetch on load
  useEffect(() => { fetchBalance(); }, []);

  // 2. Call fetchBalance() again inside your onTopUp handler!
  const handleTopUpSuccess = async () => {
    await fetchBalance(); // This forces the UI to refresh the balance
  };

  return <div>Wallet Balance: ${balance.toFixed(2)}</div>;
}