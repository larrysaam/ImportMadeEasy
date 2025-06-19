import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

const StripeElement = ({ amount, orderData, onOrderComplete }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(()=>{
    console.log('StripeElement mounted ', orderData);
  }, [])

  // Add payment element change handler
  const handlePaymentElementChange = (event) => {
    setIsComplete(event.complete);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      toast.error('Payment system not initialized');
      return;
    }

    setIsProcessing(true);

    try {
      // First confirm the payment with Stripe
      const { error: paymentError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order-confirmation`,
        },
        redirect: 'if_required'
      });

      if (paymentError) {
        throw new Error(paymentError.message);
      }

      if (!paymentIntent) {
        throw new Error('Payment failed: No payment intent returned');
      }

      // Verify payment status
      if (paymentIntent.status === 'succeeded') {
        // Create order in your system
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/order/stripe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
         body: JSON.stringify({
            ...orderData,
            payment: true
          })
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Failed to create order');
        }

        toast.success('Payment successful!');
        onOrderComplete();
      } else {
        throw new Error(`Payment status: ${paymentIntent.status}`);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <PaymentElement onChange={handlePaymentElementChange} />
      <button
        type="submit"
        disabled={!stripe || isProcessing || !isComplete}
        className={`w-full mt-4 px-16 py-3 text-sm transition-all duration-300 
          ${isProcessing || !stripe || !isComplete
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-brand hover:bg-brand-dark'} 
          text-white rounded-md`}
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
            Processing Payment...
          </span>
        ) : !isComplete ? (
          'Please fill in card details'
        ) : (
          `Pay ${new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: import.meta.env.VITE_CURRENCY || 'USD'
          }).format(amount)}`
        )}
      </button>
    </form>
  );
};

export default StripeElement;
