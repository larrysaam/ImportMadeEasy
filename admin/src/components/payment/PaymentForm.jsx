import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { toast } from 'react-toastify';
import axios from 'axios';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#32325d',
      fontFamily: 'Arial, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4'
      },
      padding: '10px 12px',
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a'
    }
  }
};

const PaymentForm = ({ amount, orderData, onPaymentSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // First create payment intent
      const { data: intentData } = await axios.post('/api/payment/create-intent', {
        amount,
        orderData
      });

      if (!intentData.clientSecret) {
        throw new Error('Failed to create payment intent');
      }

      // Confirm the payment
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        intentData.clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
          },
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (paymentIntent.status === 'succeeded') {
        // Create order
        const { data: orderResult } = await axios.post('/api/orders/create', {
          ...orderData,
          paymentIntentId: paymentIntent.id,
          amount
        });

        if (orderResult.success) {
          toast.success('Payment successful!');
          onPaymentSuccess(orderResult.order);
        } else {
          throw new Error('Failed to create order');
        }
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto">
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Details
        </label>
        <div className="border rounded-md p-4 bg-white shadow-sm">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
      
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className={`w-full py-3 px-6 rounded-md text-white text-sm font-medium
          ${isProcessing || !stripe 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-black hover:bg-gray-800 transition-colors'
          }`}
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            Processing Payment...
          </span>
        ) : (
          `Pay ${new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: import.meta.env.VITE_CURRENCY || 'EUR'
          }).format(amount)}`
        )}
      </button>
    </form>
  );
};

export default PaymentForm;