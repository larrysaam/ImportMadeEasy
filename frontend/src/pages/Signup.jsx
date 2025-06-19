import React, { useContext, useEffect, useState } from 'react'
import { assets } from '@/assets/assets';
import { ShopContext } from '@/context/ShopContext'
import axios from 'axios';
import { toast } from "sonner"
import { Link } from 'react-router-dom';
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Controller, useForm } from "react-hook-form"
import { useMutation } from "@tanstack/react-query"

const signupSchema = z.object({
  name: z.string().min(3, { message: "Name should be longer than 3 sybmols" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
})

const Signup = () => {

  const { token, setToken, navigate, backendUrl } = useContext(ShopContext)
  const [showPassword, setShowPassword] = useState(false)

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
      password: ""
    },
  })

  // React Query Mutation for Signup
  const signupMutation = useMutation({
    mutationFn: async (values) => {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Artificial delay of 1 second
      const response = await axios.post(`${backendUrl}/api/user/register`, values)
      console.log(response.data)
      return response.data
    },
    onSuccess: (data) => {
      if (data.success) {
        setToken(data.token)
        localStorage.setItem('token', data.token)
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

  const password = watch('password') || '';

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

      {/* Submit Button with Loading State */}
      <button 
        type="submit"
        className={`transistion-all duration-300 hover:bg-slate-700 font-light px-8 py-2 mt-4 flex items-center justify-center transition-all duration-300
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
    </form>
  )
}

export default Signup