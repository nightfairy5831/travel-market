'use client';
import { useState } from 'react';

const PayPalButton = ({ amount, currency = 'USD', onSuccess, onError, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [paypalLoaded, setPaypalLoaded] = useState(false);

  // Load PayPal script dynamically
  const loadPayPalScript = () => {
    if (paypalLoaded) return;

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=${currency}`;
    script.addEventListener('load', () => setPaypalLoaded(true));
    document.head.appendChild(script);
  };

  const handlePayment = async () => {
    setLoading(true);
    loadPayPalScript();

    try {
      // Create order on our backend
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          currency: currency,
        }),
      });

      const orderData = await response.json();

      if (!response.ok) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      // Redirect to PayPal approval URL
      window.location.href = orderData.approvalUrl;
      
    } catch (error) {
      console.error('Payment error:', error);
      onError?.(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="paypal-button-container">
      <button
        onClick={handlePayment}
        disabled={loading}
        className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 ${
          loading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Processing...
          </div>
        ) : (
          `Pay $${amount} with PayPal`
        )}
      </button>
    </div>
  );
};

export default PayPalButton;