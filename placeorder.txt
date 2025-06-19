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

  const createOrderMutation = useMutation({
    mutationFn: (orderData) => {
      const endpoint = method === 'stripe' 
        ? `${backendUrl}/api/order/create-checkout-session`
        : `${backendUrl}/api/order/place`
      
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
          // Handle COD success
          resetCart();
          toast.success('Order placed successfully!');
          navigate('/orders');
        }
      } else {
        toast.error(res.data.message);
        navigate('/cart');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to process order');
      navigate('/cart');
    }
  });

  const onSubmit = (formData) => {
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
    }

    createOrderMutation.mutate(orderData)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col sm:flex-row justify-between lg:justify-evenly gap-4 pt-5 sm:pt-14 min-h-[70vh] border-t animate-fade animate-duration-500'>

      {/* Left Side - Form */}
      <div className='flex flex-col gap-4 w-full sm:max-w-[480px]'>
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
      <div>
        <div className='mt-8 min-w-80'>
          <CartTotal />
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
                <div className={`w-3.5 h-3.5 border rounded-full ${
                  method === 'stripe' ? 'bg-green-400' : ''
                }`} />
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
              <div className={`w-3.5 h-3.5 border rounded-full ${
                method === 'cod' ? 'bg-green-400' : ''
              }`} />
              <p className='text-gray-700 text-sm font-medium'>Cash on delivery</p>
            </div>
          </div>

          <div className='w-full text-end mt-8'>
            <button 
              type='submit'
              disabled={createOrderMutation.isPending}
              className={`px-16 py-3 text-sm transition-all duration-300 
                ${createOrderMutation.isPending 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-black hover:bg-slate-700'} 
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
        </div>
      </div>

    </form>
  )
}

export default Placeorder
