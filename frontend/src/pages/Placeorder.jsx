import React, { useContext, useEffect, useState } from 'react'
import Title from '@/components/Title'
import CartTotal from '@/features/shared/CartTotal'
import { assets } from '@/assets/assets'
import { ShopContext } from '@/context/ShopContext'
import { toast } from 'sonner'
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Input } from "@/components/ui/input"
import { useMutation } from "@tanstack/react-query"
import axios from "axios"
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const orderSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email"),
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipcode: z.string().min(1, "Zipcode is required"),
  country: z.string().min(1, "Country is required"),
  phone: z.string().min(1, "Phone number is required"),
})

const Placeorder = () => {
  const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;
  const VITE_CURRENCY  =  import.meta.env.VITE_CURRENCY 
  const [method, setMethod] = useState('cod')
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


  const initialOptions = {
    "client-id": PAYPAL_CLIENT_ID,
    "enable-funding": "venmo",
    "buyer-country": "US",
    currency: VITE_CURRENCY || 'USD',
    components: "buttons",
  };



  const createOrderMutation = useMutation({
    mutationFn: (orderData) => {
      let endpoint = `${backendUrl}/api/order/place`; // Default to COD
      if (method === 'stripe') {
        endpoint = `${backendUrl}/api/order/create-checkout-session`;
      } else if (method === 'paypal') {
        endpoint = `${backendUrl}/api/order/place-paypal`; // New endpoint for PayPal
      }
      console.log('Creating order with method:', method)  
      return axios.post(endpoint, orderData, { headers: { token } })
    },
    onSuccess: (res) => {
      if (res.data.success) {
        if (method === 'stripe') {
          // Handle Stripe checkout redirect
          const checkoutUrl = res.data.sessionUrl;
          
          // Create a flag in localStorage to track checkout status
          localStorage.setItem('stripeCheckoutPending', 'true');
          
          // Redirect to Stripe Checkout
          window.location.href = checkoutUrl;
        } else {
          // Handle COD or PayPal direct success (if PayPal order is created directly on backend)
          resetCart();
          toast.success('Order placed successfully!');
          navigate('/');
        }
      } else {
        toast.error(res.data.message);
        navigate('/cart');
      }
    },
    onError: (error) => {
      toast.error(error.message ||'Failed to process order');
      navigate('/cart');
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
              ...product,
              size,
              quantity
            }
          }
        }
        return null
      }).filter(Boolean)
    )

    const orderData = {
      address: formData,
      items: orderItems,
      amount: getCartAmount() + deliveryFee,
      paymentMethod: method
    };
    return orderData;
  }

  const onSubmit = (formData) => {
    if (method === 'paypal') {
      // For PayPal, we don't submit the form directly here.
      // The PayPalButtons component will handle the order creation and approval.
      // We just need to ensure form data is valid if PayPal is selected.
      toast.info("Complete your payment with PayPal.");
      return;
    }
    const orderPayload = prepareOrderData(formData);
    createOrderMutation.mutate(orderPayload);
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
        <div className='mt-12'>
          <Title text1='PAYMENT' text2='METHOD' />

          <div className='flex gap-3 flex-col lg:flex-row'>
            <div
              onClick={() => setMethod('stripe')}
              className={`flex-1 border p-4 cursor-pointer ${
                method === 'stripe' ? 'border-black' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-3.5 h-3.5 border-2 rounded-full ${ method === 'stripe' ? 'bg-black border-black' : 'border-gray-400'}`} />
                <p className='text-gray-700 text-sm font-medium'>Card Payment</p>
                <img alt='' src={assets.stripe} className='h-5' />
              </div>
            </div>

            <div
              onClick={() => setMethod('cod')}
              className={`flex items-center gap-3 border p-4 cursor-pointer ${
                method === 'cod' ? 'border-black' : ''
              }`}
            >
              <div className={`w-3.5 h-3.5 border-2 rounded-full ${ method === 'cod' ? 'bg-black border-black' : 'border-gray-400'}`} />
              <p className='text-gray-700 text-sm font-medium'>Cash on delivery</p>
            </div>
          </div>
          
          {/* PayPal Option */}
          <div 
            onClick={() => setMethod('paypal')}
            className={`border p-4 cursor-pointer mt-3 ${
              method === 'paypal' ? 'border-black' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-3.5 h-3.5 border-2 rounded-full ${ method === 'paypal' ? 'bg-black border-black' : 'border-gray-400'}`} />
              <p className='text-gray-700 text-sm font-medium'>PayPal</p>
              {/* You can add a PayPal logo asset here if you have one */}
              {/* <img alt='PayPal' src={assets.paypalLogo} className='h-5' /> */}
            </div>
          </div>

          {method === 'paypal' && PAYPAL_CLIENT_ID && (
            <div className="mt-6">
              <PayPalScriptProvider options={initialOptions}>
                <PayPalButtons
                  style={{ layout: "vertical", color: "blue", shape: "rect", label: "paypal" }}
                  createOrder={createOrder}
                  onApprove={onApprove}
                  onError={(err) => {
                    toast.error("PayPal payment failed. Please try again or choose another method.");
                    console.error("PayPal error:", err);
                  }}
                />
              </PayPalScriptProvider>
            </div>
          )}

          {method !== 'paypal' && (
            <div className='w-full text-end mt-8'>
              <button 
                type='submit'
                disabled={createOrderMutation.isPending}
                className={`px-16 py-3 text-sm transition-all duration-300 
                  ${createOrderMutation.isPending 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-brand hover:bg-brand-dark'} 
                  text-white`}
              >
                {createOrderMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                    PROCESSING...
                  </span>
                ) : (
                  'PLACE ORDER'
                )}
              </button>
            </div>
          )}
        </div>
      </div>

    </form>
  )
}

export default Placeorder
