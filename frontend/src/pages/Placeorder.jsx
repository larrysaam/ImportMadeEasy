import React, { useState, useContext, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { orderSchema } from '@/lib/formSchemas'
import { Input } from '@/components/ui/input'
import Title from '@/components/Title'
// import CartTotal from '@/features/shared/CartTotal' // Using custom implementation
import { ShopContext } from '@/context/ShopContext'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'
import { assets } from '@/assets/assets'
import NumberFlow from '@number-flow/react'
// Removed direct MeSomb import - now handled by backend

const Placeorder = () => {
  // MeSomb API keys are now handled by the backend
  
  const [mobileNumber, setMobileNumber] = useState('')
  const [mobileService, setMobileService] = useState('MTN')
  const [isProcessingMobile, setIsProcessingMobile] = useState(false)
  const [savedDeliveryInfo, setSavedDeliveryInfo] = useState(null)
  const [loadingSavedInfo, setLoadingSavedInfo] = useState(false)
  
  const { navigate, backendUrl, token, cartItems,
    resetCart, getCartAmount, deliveryFee, products } = useContext(ShopContext)

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(orderSchema)
  })

  // Load saved delivery information
  const loadSavedDeliveryInfo = async () => {
    if (!token) return

    try {
      setLoadingSavedInfo(true)
      const response = await axios.get(`${backendUrl}/api/user/profile`, {
        headers: { token }
      })

      if (response.data.success && response.data.deliveryInfo) {
        const info = response.data.deliveryInfo
        setSavedDeliveryInfo(info)

        // Auto-fill form if delivery info exists
        if (info.firstName) {
          setValue('firstName', info.firstName)
          setValue('lastName', info.lastName)
          setValue('email', info.email)
          setValue('street', info.address)
          setValue('city', info.city)
          setValue('state', info.state)
          setValue('zipcode', info.zipcode)
          setValue('country', info.country)
          setValue('phone', info.phone)
        }
      }
    } catch (error) {
      console.error('Error loading saved delivery info:', error)
    } finally {
      setLoadingSavedInfo(false)
    }
  }

  useEffect(()=>{
    console.log("Cart Items:  ",cartItems)
    loadSavedDeliveryInfo()
  },[token])



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
    // Load checkout data from localStorage
    const checkoutData = localStorage.getItem('checkoutData')
    let shippingData = {
      method: 'sea',
      country: 'china'
    }
    let selectedCountryItems = []

    if (checkoutData) {
      try {
        const parsedData = JSON.parse(checkoutData)
        shippingData = {
          method: parsedData.shippingMode || 'sea',
          country: parsedData.selectedCountry || 'china'
        }
        // Use the filtered cart items from the selected country
        selectedCountryItems = parsedData.cartItems || []
      } catch (error) {
        console.error('Error parsing checkout data:', error)
      }
    }

    // Use selected country items instead of all cart items
    const orderItems = selectedCountryItems.map(item => {
      const product = products.find(p => p._id === item.id)
      if (product) {
        return {
          productId: item.id,
          name: product.name,
          price: product.price,
          weight: product.weight || 1, // Add weight for shipping calculation
          // Add a check to handle missing images
          image: product.images && product.images.length > 0 ? product.images[0] : null,
          size: item.size,
          quantity: item.quantity
        }
      }
      return null
    }).filter(Boolean)

    // Calculate amount for selected country items only
    const selectedCountryAmount = selectedCountryItems.reduce((total, item) => {
      const product = products.find(p => p._id === item.id)
      if (product) {
        // Apply bulk discount if applicable
        const bulkDiscountPercentage = Number(import.meta.env.VITE_BULK_DISCOUNT_PERCENTAGE) || 5;
        const bulkDiscountMinQuantity = Number(import.meta.env.VITE_BULK_DISCOUNT_MIN_QUANTITY) || 10;

        let itemPrice = product.price;
        if (item.quantity >= bulkDiscountMinQuantity) {
          const discountAmount = itemPrice * (bulkDiscountPercentage / 100);
          itemPrice = itemPrice - discountAmount;
        }

        return total + (itemPrice * item.quantity);
      }
      return total;
    }, 0)

    return {
      address: formData,
      items: orderItems,
      amount: selectedCountryAmount, // Use selected country amount instead of getCartAmount()
      paymentMethod: 'mobile',
      shipping: shippingData
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

      // Calculate total amount (excluding delivery fee - paid on delivery)
      const totalAmount = Math.round(getCartAmount());

      // Prepare order data
      const orderPayload = prepareOrderData(formData);

      console.log('Frontend - Form data:', formData);
      console.log('Frontend - Order payload:', orderPayload);

      // Send payment request to backend
      const response = await axios.post(
        `${backendUrl}/api/mesomb/payment/mobile`,
        {
          orderData: orderPayload,
          paymentDetails: {
            phoneNumber: mobileNumber,
            service: mobileService,
            amount: totalAmount
          }
        },
        {
          headers: {
            'token': token,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        resetCart();
        toast.success('Payment successful! Your order has been placed.');
        navigate('/orders');
      } else {
        toast.error(response.data.message || 'Payment failed. Please try again.');
      }

    } catch (error) {
      console.error('Mobile payment error:', error);
      toast.error('Payment processing failed. Please try again.');
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

        {/* Load Saved Info Button */}
        {token && (
          <div className='mb-4'>
            <button
              type="button"
              onClick={loadSavedDeliveryInfo}
              disabled={loadingSavedInfo}
              className='flex items-center gap-2 text-sm text-brand hover:text-brand-dark disabled:opacity-50'
            >
              {loadingSavedInfo ? (
                <>
                  <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
                  Loading saved info...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Use saved delivery information
                </>
              )}
            </button>
          </div>
        )}

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
          {/* Custom Cart Total for Selected Country */}
          <div className='w-full'>
            <div className='text-2xl'>
              <Title text1='CART' text2='TOTALS' />
            </div>
            <div className='flex flex-col gap-2 mt-2 text-base'>
              {(() => {
                // Load checkout data to get selected country items
                const checkoutData = localStorage.getItem('checkoutData')
                let selectedCountryItems = []
                let selectedCountry = 'china'

                if (checkoutData) {
                  try {
                    const parsedData = JSON.parse(checkoutData)
                    selectedCountryItems = parsedData.cartItems || []
                    selectedCountry = parsedData.selectedCountry || 'china'
                  } catch (error) {
                    console.error('Error parsing checkout data:', error)
                  }
                }

                // Calculate totals for selected country
                const bulkDiscountPercentage = Number(import.meta.env.VITE_BULK_DISCOUNT_PERCENTAGE) || 5;
                const bulkDiscountMinQuantity = Number(import.meta.env.VITE_BULK_DISCOUNT_MIN_QUANTITY) || 10;

                const discountedTotal = selectedCountryItems.reduce((total, item) => {
                  const product = products.find(p => p._id === item.id)
                  if (product) {
                    let itemPrice = product.price;
                    if (item.quantity >= bulkDiscountMinQuantity) {
                      const discountAmount = itemPrice * (bulkDiscountPercentage / 100);
                      itemPrice = itemPrice - discountAmount;
                    }
                    return total + (itemPrice * item.quantity);
                  }
                  return total;
                }, 0)

                return (
                  <>
                    <div className='flex justify-between'>
                      <p>Subtotal ({selectedCountry === 'nigeria' ? 'Nigeria' : 'China'} items)</p>
                      <NumberFlow
                        value={discountedTotal}
                        format={{
                          style: 'currency',
                          currency: import.meta.env.VITE_CURRENCY || 'XAF',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }}
                      />
                    </div>
                    <hr/>
                    <div className='text-lg flex justify-between'>
                      <b>Total (excluding delivery)</b>
                      <NumberFlow
                        className='font-semibold'
                        value={discountedTotal}
                        format={{
                          style: 'currency',
                          currency: import.meta.env.VITE_CURRENCY || 'XAF',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }}
                      />
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
          <div className='mt-4 p-4 bg-gray-50 rounded-md'>
            <h3 className='font-medium mb-2 text-sm'>Delivery Details</h3>
            <div className='flex flex-col gap-2 text-sm'>
              <div className='flex justify-between'>
                <p>Shipping Fee:</p>
                <div className='text-right'>
                  <p className='font-medium'>{import.meta.env.VITE_CURRENCY_SYMBOL || 'FCFA'} {deliveryFee}</p>
                  <p className='text-xs text-orange-600 font-medium'>Pay on delivery</p>
                </div>
              </div>
              <div className='flex justify-between'>
                <p>Estimated Delivery Time:</p>
                <p className='font-medium'>9 days</p>
              </div>
              <div className='mt-2 p-2 bg-orange-50 rounded border-l-4 border-orange-400'>
                <p className='text-xs text-orange-700'>
                  <strong>Note:</strong> Delivery fee is paid directly to the delivery person when your order arrives.
                </p>
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
