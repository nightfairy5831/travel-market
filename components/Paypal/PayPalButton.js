'use client';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const PayPalButton = ({
  amount,
  currency = 'USD',
  flightDetails = {},
  userId,
  companionId,
  onSuccess,
  onError,
  onCancel
}) => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);

    try {
      // Get Supabase client for auth token
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('Please log in to continue with payment');
      }

      // Create order via Supabase Edge Function
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/paypal-create-order`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            amount: amount,
            currency: currency,
            flightDetails: flightDetails,
            companionId: companionId,
          }),
        }
      );

      const orderData = await response.json();

      if (!response.ok) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      // Redirect to PayPal approval URL
      if (orderData.approvalUrl) {
        window.location.href = orderData.approvalUrl;
      } else {
        throw new Error('No approval URL returned');
      }

    } catch (error) {
      console.error('Payment error:', error);
      onError?.(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="paypal-button-container">
      <button
        onClick={handlePayment}
        disabled={loading}
        className={`w-full bg-[#0070ba] hover:bg-[#005ea6] text-white font-bold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2 ${
          loading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Processing...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .757-.642h6.333c2.103 0 3.66.57 4.622 1.693.848 1 1.244 2.217 1.178 3.621a6.396 6.396 0 0 1-.165.958l-.018.071v.065l.012.068.015.065a4.197 4.197 0 0 0 .106.379c.2.6.536 1.107.99 1.5.559.484 1.253.816 2.028.967.445.087.906.13 1.373.13h.097c-.024.162-.055.355-.092.575l-.14.85a8.71 8.71 0 0 1-.17.87c-.5 2.004-1.67 3.399-3.466 4.154-.938.392-2.004.6-3.154.6h-.817a.77.77 0 0 0-.757.642l-.842 5.18a.641.641 0 0 1-.633.74H7.076z"/>
            </svg>
            Pay ${amount} with PayPal
          </>
        )}
      </button>
    </div>
  );
};

export default PayPalButton;