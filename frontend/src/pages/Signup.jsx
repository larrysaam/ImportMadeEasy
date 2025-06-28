import React, { useContext, useEffect, useState } from 'react'
import { assets } from '@/assets/assets';
import { ShopContext } from '@/context/ShopContext'
import axios from 'axios';
import { toast } from "sonner"
import { Link, useSearchParams } from 'react-router-dom';
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Controller, useForm } from "react-hook-form"
import { useMutation } from "@tanstack/react-query"

const signupSchema = z.object({
  name: z.string().min(3, { message: "Name should be longer than 3 sybmols" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions to continue"
  }),
})

const Signup = () => {

  const { token, setToken, navigate, backendUrl, affiliateCode, affiliateInfo, setAffiliateCode, setAffiliateInfo } = useContext(ShopContext)
  const [showPassword, setShowPassword] = useState(false)
  const [termsAndConditions, setTermsAndConditions] = useState('')
  const [showTermsModal, setShowTermsModal] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      acceptTerms: false
    },
  })

  // React Query Mutation for Signup
  const signupMutation = useMutation({
    mutationFn: async (values) => {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Artificial delay of 1 second
      const registrationData = { ...values }
      if (affiliateCode) {
        registrationData.referralCode = affiliateCode
      }
      const response = await axios.post(`${backendUrl}/api/user/register`, registrationData)
      console.log(response.data)
      return response.data
    },
    onSuccess: (data) => {
      if (data.success) {
        setToken(data.token)
        localStorage.setItem('token', data.token)

        // Clear affiliate data after successful registration
        localStorage.removeItem('affiliateCode')
        localStorage.removeItem('affiliateInfo')
        setAffiliateCode(null)
        setAffiliateInfo(null)

        navigate('/')
        toast.success("Registered successfully!")
        reset()
      } else {
        toast.error(data.message)
      }
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || "Login failed, try again later"
      toast.error(errorMessage)
    }
  })

  const onSubmit = (values) => {
    signupMutation.mutate(values)
  }

  useEffect(() => {
    if (token) {
      navigate('/')
    }
  }, [token])

  // Referral tracking is now handled in ShopContext

  const password = watch('password') || '';

  // Fetch terms and conditions
  useEffect(() => {
    const fetchTermsAndConditions = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/settings/legal`)
        if (response.data.success) {
          setTermsAndConditions(response.data.legal.termsAndConditions)
        }
      } catch (error) {
        console.error('Error fetching terms and conditions:', error)
      }
    }

    fetchTermsAndConditions()
  }, [backendUrl])

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className='flex flex-col items-center w-[90%] sm:max-w-96 
      m-auto mt-14 gap-4 text-gray-800 animate-fade animate-duration-300'>
      <div className='inline-flex items-center gap-2 mb-2 mt-10'>
        <p className='prata-regular text-3xl'>Create an account</p>
        <hr className='border-none h-[1.5px] w-8 bg-gray-800' />
      </div>

      {/* Referral Info Display */}
      {affiliateInfo && (
        <div className='w-full p-4 bg-green-50 border border-green-200 rounded-lg mb-4'>
          <div className='flex items-center gap-2'>
            <div className='w-2 h-2 bg-green-500 rounded-full'></div>
            <p className='text-green-800 font-medium'>
              Referred by {affiliateInfo.name}
            </p>
          </div>
          <p className='text-green-600 text-sm mt-1'>
            You're joining through an affiliate link. Welcome to our community!
          </p>
        </div>
      )}
      {/* Name Input */}
      <div className='w-full'>
        <Controller
          name="name"
          control={control}
          render={({ field, ref }) => (
            <Input
              {...field}
              ref={ref}
              className='w-full h-12 text-md'
              placeholder='Enter your name'
            />
          )}
        />
        {errors.name && <p className="text-red-500 text-sm ml-3">{errors.name.message}</p>}
      </div>

      {/* Email Input */}
      <div className='w-full'>
        <Controller
          name="email"
          control={control}
          render={({ field, ref }) => (
            <Input
              {...field}
              ref={ref}
              className='w-full h-12 text-md'
              placeholder='Enter your email'
            />
          )}
        />
        {errors.email && <p className="text-red-500 text-sm ml-3">{errors.email.message}</p>}
      </div>

      {/* Password Input */}
      <div className='w-full relative'>
        <Controller
          name="password"
          control={control}
          render={({ field, ref }) => (
            <Input
              {...field}
              ref={ref}
              type={showPassword ? 'text' : 'password'}
              className='w-full h-12 peer'
              placeholder='Password'
            />
          )}
        />
        {
          password && <img src={assets.eyeIcon} alt='' 
          onMouseDown={()=>setShowPassword(!showPassword)}
          className={`absolute right-4 peer-focus:right-12 top-[12px] transistion-all duration-100
            ${showPassword ? 'opacity-100' : 'opacity-50'} hover:opacity-100 cursor-pointer`}
        />
        }
        {errors.password && <p className="text-red-500 text-sm ml-3">{errors.password.message}</p>}
      </div>



      <div className='flex justify-end w-full'>
        <div className='group flex flex-col items-end'>
          <div className='w-full flex justify-end text-sm'>
            <img src={assets.left} alt='' className='w-5' />
            <Link to='/login'>&nbsp;Back to Login</Link>
          </div>
          <hr className='mt-[1px] w-[80%] border-none h-[1px] bg-gray-700 scale-0 transistion-all duration-500 group-hover:scale-100' />
        </div>
      </div>

      {/* Terms and Conditions Checkbox */}
      <div className='w-full'>
        <Controller
          name="acceptTerms"
          control={control}
          render={({ field }) => (
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="acceptTerms"
                checked={field.value}
                onChange={field.onChange}
                className="mt-1 h-4 w-4 text-brand focus:ring-brand border-gray-300 rounded"
              />
              <label htmlFor="acceptTerms" className="text-sm text-gray-700 leading-5">
                I agree to the{' '}
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="text-brand hover:text-brand-dark underline"
                >
                  Terms and Conditions
                </button>
              </label>
            </div>
          )}
        />
        {errors.acceptTerms && <p className="text-red-500 text-sm mt-1">{errors.acceptTerms.message}</p>}
      </div>

      {/* Submit Button with Loading State */}
      <button 
        type="submit"
        className={`transition-all duration-300 hover:bg-slate-700 font-light px-8 py-2 mt-4 flex items-center justify-center
          ${signupMutation.isPending ? 'bg-gray-400 text-gray-800 cursor-not-allowed' : 'bg-black text-white'}`}
        disabled={signupMutation.isPending}
      >
        {signupMutation.isPending ? (
          <>
            <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            Creating user...
          </>
        ) : "Sign Up"}
      </button>

      {/* Terms and Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Terms and Conditions</h3>
              <button
                onClick={() => setShowTermsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {termsAndConditions ? (
                <div className="prose prose-sm max-w-none">
                  {termsAndConditions.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-3 text-gray-700 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Terms and conditions are not available at the moment.
                </p>
              )}
            </div>
            <div className="flex justify-end p-4 border-t">
              <button
                onClick={() => setShowTermsModal(false)}
                className="px-4 py-2 bg-brand text-white rounded-md hover:bg-brand-dark"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}

export default Signup