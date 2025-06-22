import React, { useState, useContext, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { orderSchema } from '@/lib/formSchemas'
import { Input } from '@/components/ui/input'
import Title from '@/components/Title'
import CartTotal from '@/features/shared/CartTotal'
import { ShopContext } from '@/context/ShopContext'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'
import { assets } from '@/assets/assets'
import { PaymentOperation } from '@hachther/mesomb';

const Placeorder = () => {
  const MESOMB_APP_KEY = import.meta.env.VITE_MESOMB_APP_KEY;
  const MESOMB_ACCESS_KEY = import.meta.env.VITE_MESOMB_ACCESS_KEY;
  const MESOMB_SECRET_KEY = import.meta.env.VITE_MESOMB_SECRET_KEY;
  
  const [mobileNumber, setMobileNumber] = useState('')
  const [mobileService, setMobileService] = useState('MTN')
  const [isProcessingMobile, setIsProcessingMobile] = useState(false)
  
  const { navigate, backendUrl, token, cartItems,
    resetCart, getCartAmount, deliveryFee, products } = useContext(ShopContext)

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(orderSchema)
  })

  useEffect(()=>{
    console.log("Cart Items:  ",cartItems)
  },[])



  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData) => {
      return processMobilePayment();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to place order');
    }
  });

  const prepareOrderData = (formData) => {
    // Collect items from cart
    const orderItems = Object.entries(cartItems).flatMap(([productId, sizes]) => 
      Object.entries(sizes).map(([size, quantity]) => {
        if (quantity > 0) {
          const product = products.find(p => p._id === productId)
          if (product) {
            return {
              productId,
              name: product.name,
              price: product.price,
              // Add a check to handle missing images
              image: product.images && product.images.length > 0 ? product.images[0] : null,
              size,
              quantity
            }
          }
        }
        return null
      }).filter(Boolean)
    )

    return {
      address: formData,
      items: orderItems,
      amount: getCartAmount() + deliveryFee,
      paymentMethod: 'mobile'
    }
  }

  const onSubmit = (formData) => {
    createOrderMutation.mutate(formData);
  };





  // Function to create a PayPal order on your backend
  const createOrder = async (data, actions) => {
    try {
      // First, validate the form data before proceeding
      const formData = control._formValues;
      const validationResult = orderSchema.safeParse(formData);
      if (!validationResult.success) {
        toast.error("Please fill in all required delivery information fields.");
        handleSubmit(() => {})() // This will show form errors
        throw new Error("Form validation failed");
      }

      const response = await axios.post(`${backendUrl}/api/order/create-paypal-order`, {
        items: prepareOrderData(control._formValues).items, // Send items to calculate amount on backend
        currency: VITE_CURRENCY,
      }, { headers: { token } }); // Add token here

      if (response.data.success && response.data.orderID) {
        console.log('PayPal Order Response:', response.data);
        // Return the order ID from your backend
        return response.data.orderID;
      } else {
        throw new Error(response.data.message || 'No order ID received from backend');
      }
     
    } catch (error) {
      console.error('Error creating order on backend:', error);
      // Use toast.error instead of the undefined onError function
      toast.error(error.response?.data?.message || 'Failed to create order. Please try again.');
      throw new Error('Failed to create order on backend'); // Re-throw to stop PayPal flow
    }
  };

  // Function to capture the payment on your backend after approval
  const onApprove = async (data, actions) => {
    try {
      console.log("onApprove triggered. Capturing order:", data.orderID);
      const orderPayload = prepareOrderData(control._formValues);
      const response = await axios.post(`${backendUrl}/api/order/${data.orderID}/capture-paypal-order`, { // Use backendUrl
        ...orderPayload // Send full order data for backend to finalize
      }, { headers: { token } }); // Add token here

      console.log('PayPal Capture Response:', response.data)

      if (response.data.success) {
        // Backend confirmed capture and order creation
        resetCart();
        toast.success(response.data.message || 'Order placed successfully with PayPal!');
        navigate('/orders');
      } else {
        // Backend indicated an issue with capture or order creation
        toast.error(response.data.message || 'PayPal payment was approved, but order finalization failed.');
      }
    } catch (error) {
      console.error('Error capturing payment on backend:', error);
      toast.error(error.response?.data?.message || 'Payment capture failed. Please try again.');
    }
  };

  // Process Mobile Money Payment
  const processMobilePayment = async () => {
    try {
      if (!mobileNumber) {
        toast.error("Please enter your mobile number");
        return;
      }
      
      // Validate form data before proceeding
      const formData = control._formValues;
      const validationResult = orderSchema.safeParse(formData);
      if (!validationResult.success) {
        toast.error("Please fill in all required delivery information fields.");
        handleSubmit(() => {})(); // This will show form errors
        return;
      }
      
      setIsProcessingMobile(true);
      
      // Format phone number (ensure it starts with 237 for Cameroon)
      let formattedNumber = mobileNumber;
      if (!formattedNumber.startsWith('237') && !formattedNumber.startsWith('+237')) {
        formattedNumber = '237' + formattedNumber;
      }
      formattedNumber = formattedNumber.replace('+', '');
      
      // Calculate total amount in XAF (assuming store currency needs conversion)
      const totalAmount = Math.round(getCartAmount() + deliveryFee);
      
      console.log("MeSomb API Keys:", {
        appKey: MESOMB_APP_KEY ? "Set" : "Not set",
        accessKey: MESOMB_ACCESS_KEY ? "Set" : "Not set",
        secretKey: MESOMB_SECRET_KEY ? "Set" : "Not set"
      });
      
      // Check if API keys are set
      if (!MESOMB_APP_KEY || !MESOMB_ACCESS_KEY || !MESOMB_SECRET_KEY) {
        toast.error("MeSomb API keys are not configured. Please contact the administrator.");
        setIsProcessingMobile(false);
        return;
      }
      
      // For testing in development, simulate a successful payment
      if (import.meta.env.DEV && import.meta.env.VITE_MOCK_PAYMENTS === 'true') {
        console.log("Using mock payment in development mode");
        
        // Prepare order data for backend
        const orderPayload = prepareOrderData(control._formValues);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Send order to backend with simulated transaction details
        try {
          const backendResponse = await axios.post(
            `${backendUrl}/api/order/create-mobile-order`,
            {
              ...orderPayload,
              paymentMethod: 'mobile',
              transactionId: 'mock-' + Date.now(),
              paymentDetails: {
                service: mobileService,
                phoneNumber: formattedNumber,
                amount: totalAmount,
                currency: 'XAF'
              }
            },
            { headers: { token } }
          );
          
          if (backendResponse.data.success) {
            resetCart();
            toast.success('Payment successful! Your order has been placed.');
            navigate('/orders');
          } else {
            toast.error(backendResponse.data.message || 'Order creation failed. Please contact support.');
          }
        } catch (backendError) {
          console.error('Backend error:', backendError);
          toast.error('Failed to create order. Please try again.');
        }
        
        setIsProcessingMobile(false);
        return;
      }
      
      // Initialize MeSomb client
      const client = new PaymentOperation({
        applicationKey: MESOMB_APP_KEY,
        accessKey: MESOMB_ACCESS_KEY,
        secretKey: MESOMB_SECRET_KEY
      });
      
      // Prepare order data for backend
      const orderPayload = prepareOrderData(control._formValues);
      
      console.log("Making MeSomb payment request with:", {
        amount: totalAmount,
        service: mobileService,
        payer: formattedNumber,
        country: 'CM',
        currency: 'XAF'
      });
      
      // Make payment request
      try {
        const response = await client.makeCollect({
          amount: totalAmount,
          service: mobileService,
          payer: formattedNumber,
          country: 'CM',
          currency: 'XAF',
          fees: false,
          customer: {
            email: formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            address: formData.street,
            city: formData.city,
            region: formData.state,
            country: formData.country
          },
          products: orderPayload.items.map(item => ({
            name: item.name,
            category: 'Clothing',
            quantity: item.quantity,
            amount: item.price * item.quantity
          }))
        });
        
        console.log("MeSomb response:", response);
        
        if (response.isOperationSuccess() && response.isTransactionSuccess()) {
          // Send order to backend with transaction details
          const backendResponse = await axios.post(
            `${backendUrl}/api/order/create-mobile-order`,
            {
              ...orderPayload,
              paymentMethod: 'mobile',
              transactionId: response.transaction.id,
              paymentDetails: {
                service: mobileService,
                phoneNumber: formattedNumber,
                amount: totalAmount,
                currency: 'XAF'
              }
            },
            { headers: { token } }
          );
          
          if (backendResponse.data.success) {
            resetCart();
            toast.success('Payment successful! Your order has been placed.');
            navigate('/orders');
          } else {
            toast.error(backendResponse.data.message || 'Order creation failed. Please contact support.');
          }
        } else {
          toast.error(response.message || 'Mobile money payment failed. Please try again.');
        }
      } catch (mesombError) {
        console.error('MeSomb API error:', mesombError);
        toast.error('Failed to connect to payment service. Please try again later or use another payment method.');
      }
    } catch (error) {
      console.error('Mobile payment error:', error);
      toast.error(error.response?.data?.message || 'Payment failed. Please try again or use another method.');
    } finally {
      setIsProcessingMobile(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col sm:flex-row justify-between lg:justify-evenly gap-4 pt-5 sm:pt-14 min-h-[70vh] border-t animate-fade animate-duration-500'>

      {/* Left Side - Form */}
      <div className='flex flex-col gap-4 w-full sm:max-w-[480px] px-4 sm:px-14'>
        <div className='text-xl sm:text-2xl my-3'>
          <Title text1='DELIVERY' text2='INFORMATION' />
        </div>

        <div className='flex gap-3 justify-between'>
          <div>
            <Controller name='firstName' control={control} render={({ field }) => (
              <Input className='h-10' placeholder='First Name' {...field} />
            )} />
            {errors.firstName && <p className="text-red-500 pl-1 text-sm">{errors.firstName.message}</p>}
          </div>
          <div>
            <Controller name='lastName' control={control} render={({ field }) => (
              <Input className='h-10' placeholder='Last Name' {...field} />
            )} />
            {errors.lastName && <p className="text-red-500 pl-1 text-sm">{errors.lastName.message}</p>}
          </div>
        </div>
        <div>
          <Controller name='email' control={control} render={({ field }) => (
            <Input className='h-10' type='email' placeholder='Email address' {...field} />
          )} />
          {errors.email && <p className="text-red-500 pl-1 text-sm">{errors.email.message}</p>}
        </div>
        <div>
          <Controller name='street' control={control} render={({ field }) => (
            <Input className='h-10' placeholder='Street' {...field} />
          )} />
          {errors.street && <p className="text-red-500 pl-1 text-sm">{errors.street.message}</p>}
        </div>

        <div className='flex gap-3 justify-between'>
          <div>
            <Controller name='city' control={control} render={({ field }) => (
              <Input className='h-10' placeholder='City' {...field} />
            )} />
            {errors.city && <p className="text-red-500 pl-1 text-sm">{errors.city.message}</p>}
          </div>
          <div>
            <Controller name='state' control={control} render={({ field }) => (
              <Input className='h-10' placeholder='State/Province' {...field} />
            )} />
            {errors.state && <p className="text-red-500 pl-1 text-sm">{errors.state.message}</p>}
          </div>
        </div>

        <div className='flex gap-3 justify-between'>
          <div>
            <Controller name='zipcode' control={control} render={({ field }) => (
              <Input className='h-10' placeholder='Zipcode' type='number' {...field} />
            )} />
            {errors.zipcode && <p className="text-red-500 pl-1 text-sm">{errors.zipcode.message}</p>}
          </div>
          <div>
            <Controller name='country' control={control} render={({ field }) => (
              <Input className='h-10' placeholder='Country' {...field} />
            )} />
            {errors.country && <p className="text-red-500 pl-1 text-sm">{errors.country.message}</p>}
          </div>
        </div>

        <div>
          <Controller name='phone' control={control} render={({ field }) => (
            <Input className='h-10' placeholder='Phone Number' type='tel' {...field} />
          )} />
          {errors.phone && <p className="text-red-500 pl-1 text-sm">{errors.phone.message}</p>}
        </div>

      </div>

      {/* Right Side - Cart + Payment */}
      <div className='px-4 sm:px-14'>
        <div className='mt-8 min-w-80'>
          <CartTotal />
          <div className='mt-4 p-4 bg-gray-50 rounded-md'>
            <h3 className='font-medium mb-2 text-sm'>Delivery Details</h3>
            <div className='flex flex-col gap-2 text-sm'>
              <div className='flex justify-between'>
                <p>Shipping Fee:</p>
                <p className='font-medium'>{import.meta.env.VITE_CURRENCY_SYMBOL || '€'}900</p>
              </div>
              <div className='flex justify-between'>
                <p>Estimated Delivery Time:</p>
                <p className='font-medium'>9 days</p>
              </div>
            </div>
          </div>
        </div>
        <div className='mt-8'>
          <h3 className='text-lg font-medium mb-4'>Payment Method</h3>
          
          {/* Mobile Money Payment Form */}
          <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
            <div className="mb-4">
              <p className="font-medium text-gray-800 mb-2">Mobile Money (Cameroon)</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setMobileService('MTN')}
                  className={`flex-1 py-2 px-3 text-sm rounded-md border ${
                    mobileService === 'MTN' 
                      ? 'bg-yellow-500 text-white border-yellow-600' 
                      : 'bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  MTN Mobile Money
                </button>
                <button
                  type="button"
                  onClick={() => setMobileService('ORANGE')}
                  className={`flex-1 py-2 px-3 text-sm rounded-md border ${
                    mobileService === 'ORANGE' 
                      ? 'bg-orange-500 text-white border-orange-600' 
                      : 'bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Orange Money
                </button>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-sm">
                  +237
                </span>
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="6XXXXXXXX"
                  className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-md focus:ring-brand focus:border-brand text-sm"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Enter your MTN or Orange mobile number</p>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={createOrderMutation.isPending || isProcessingMobile}
            className={`w-full py-3 mt-4 rounded-md text-white text-sm font-medium transition-colors ${
              createOrderMutation.isPending || isProcessingMobile
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-brand hover:bg-brand-dark'
            }`}
          >
            {createOrderMutation.isPending || isProcessingMobile ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Processing Payment...
              </span>
            ) : (
              'Place Order & Pay'
            )}
          </button>
          
          <div className="mt-3 text-xs text-gray-500">
            <p>You will receive a prompt on your phone to confirm the payment.</p>
            <p className="mt-1">By placing your order, you agree to our Terms of Service and Privacy Policy.</p>
          </div>
        </div>
      </div>
    </form>
  )
}

export default Placeorder
