// hooks/useRealtimeSMS.js
// React hook that subscribes to Supabase Realtime on the sms_logs table.
// New rows inserted by the webhook appear instantly in the UI.
//
// Usage in your component:
//   const { messages, isConnected } = useRealtimeSMS(supabase, userId);

import { useEffect, useState, useRef } from "react";

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} userId  – Filter messages to the current user only
 */
export function useRealtimeSMS(supabase, userId) {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef(null);

  // Initial load
  useEffect(() => {
    if (!userId) return;

    const loadInitial = async () => {
      const { data, error } = await supabase
        .from("sms_logs")
        .select("*")
        .eq("user_id", userId)
        .order("received_at", { ascending: false })
        .limit(50);

      if (!error) setMessages(data || []);
    };

    loadInitial();
  }, [supabase, userId]);

  // Realtime subscription
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`sms-inbox-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sms_logs",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setMessages((prev) => [
            { ...payload.new, isNew: true },
            ...prev,
          ]);

          // Clear the "isNew" flag after 5 seconds
          setTimeout(() => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === payload.new.id ? { ...m, isNew: false } : m
              )
            );
          }, 5000);
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
        if (status === "CHANNEL_ERROR") {
          console.warn("[Realtime] Channel error – will retry");
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  return { messages, isConnected };
}

// ─── Paystack Inline Integration helper ──────────────────────────────────────
// Usage:
//   initPaystack({ email, amountUSD, onSuccess })
//
// Add the Paystack inline script to your _document.js or layout:
//   <Script src="https://js.paystack.co/v1/inline.js" />

export function initPaystack({ email, amountUSD, userId, onSuccess }) {
  const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
  const NGN_RATE = 1600; // TODO: fetch live rate from your backend

  if (typeof window === "undefined" || !window.PaystackPop) {
    console.error("Paystack script not loaded");
    return;
  }

  const handler = window.PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email,
    // Amount in kobo (NGN smallest unit)
    amount: Math.round(amountUSD * NGN_RATE * 100),
    currency: "NGN",
    metadata: {
      custom_fields: [{ display_name: "User ID", value: userId }],
      usd_amount: amountUSD,           // Passed to backend for crediting
    },
    callback: async (response) => {
      // response.reference is the Paystack transaction reference.
      // NEVER credit based on this alone – always verify server-side.
      const result = await fetch("/api/wallet/verify-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await getSupabaseToken()}`,
        },
        body: JSON.stringify({ reference: response.reference }),
      });

      const data = await result.json();
      if (data.success) {
        onSuccess(data);
      } else {
        console.error("Payment verification failed:", data.error);
      }
    },
    onClose: () => {
      console.log("Paystack modal closed");
    },
  });

  handler.openIframe();
}

async function getSupabaseToken() {
  // Import your Supabase client and get the current session token
  // e.g. const { data } = await supabase.auth.getSession();
  //      return data.session?.access_token;
  throw new Error("Implement getSupabaseToken() with your Supabase client");
}
