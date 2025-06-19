import { useEffect, useState, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShopContext } from '@/context/ShopContext';
import { toast } from 'sonner';
import axios from 'axios';

const OrderSuccess = () => {
  const { resetCart, backendUrl, token } = useContext(ShopContext);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyCheckout = async () => {
      try {
        const sessionId = searchParams.get('session_id');
        const orderId = searchParams.get('order_id');

        if (!sessionId || !orderId) {
          throw new Error('Invalid checkout session');
        }

        console.log('Verifying checkout session:', { sessionId, orderId });
        // Check if token exists
        if (!token) {
          throw new Error('Not authorized - no token found');
        }

        console.log('Using token:', token);
        
        const response = await axios.get(
          `${backendUrl}/api/order/verify-checkout-session`,
          {
            
            params: { sessionId, orderId },
            headers: { 
              token,
              'Content-Type': 'application/json'
            }  // Send token directly as expected by backend
          }
        );

        console.log('Verification response:', response.data);

        if (response.data.success) {
          resetCart();
          toast.success('Payment successful! Order has been placed.');
          setTimeout(() => navigate('/'), 1500);
        } else {
          throw new Error(response.data.message || 'Payment verification failed');
        }
      } catch (error) {
        console.error('Verification error:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Payment verification failed';
        toast.error(errorMessage);
        setTimeout(() => navigate('/cart'), 1500);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyCheckout();
  }, [searchParams, navigate, resetCart, backendUrl, token]);

  if (!searchParams.get('session_id') || !searchParams.get('order_id')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Invalid checkout session</p>
          <button 
            onClick={() => navigate('/cart')}
            className="mt-4 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
          >
            Return to Cart
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {isVerifying ? (
          <>
            <div className="animate-spin h-8 w-8 border-4 border-black border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying your payment...</p>
          </>
        ) : (
          <div className="animate-pulse">
            <p className="text-gray-600">Redirecting to home...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderSuccess;