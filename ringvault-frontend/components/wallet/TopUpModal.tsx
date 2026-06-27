// Use react-paystack hook
import { usePaystackPayment } from 'react-paystack';

export function TopUpModal({ email, amount, userId, onClose }) {
  const config = {
    reference: Date.now().toString(),
    email,
    amount: amount * 100, // Paystack uses Kobo (Naira)
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    metadata: { user_id: userId, usd_amount: amount }
  };

  const initializePayment = usePaystackPayment(config);

  return (
    <button onClick={() => initializePayment({ 
      onSuccess: (ref) => console.log('Payment successful', ref),
      onClose: () => onClose() 
    })}>
      Pay ${amount}
    </button>
  );
}