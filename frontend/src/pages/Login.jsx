import React, { useContext, useState } from 'react'
import { ShopContext } from '@/context/ShopContext'
import { toast } from "sonner"
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Controller, useForm } from "react-hook-form"
import { useMutation } from "@tanstack/react-query"
import axios from "axios"
import { assets } from '@/assets/assets'

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
})

const Login = () => {
  const { setToken, backendUrl } = useContext(ShopContext)
  const navigate = useNavigate()
  const location = useLocation()
  const [loginError, setLoginError] = useState("") // Store invalid credentials error
  const [highlightForgot, setHighlightForgot] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const { 
    control, 
    handleSubmit, 
    reset, 
    watch,
    formState: { errors } 
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    },
  })

  // React Query Mutation for Login
  const loginMutation = useMutation({
    mutationFn: async (values) => {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Artificial delay of 1 second
      const response = await axios.post(`${backendUrl}/api/user/login`, values)
      return response.data
    },
    onSuccess: (data) => {
      if (data.success) {
        setToken(data.token)
        localStorage.setItem('token', data.token)
        
        // Redirect to previous page or home if no specific path
        const returnTo = location.state?.from || '/'
        navigate(returnTo)
        
        toast.success("Login successful!")
        reset()
        setLoginError("")
      } else {
        setLoginError(data.message)
        setHighlightForgot(true)
        setTimeout(() => setHighlightForgot(false), 1000)
      }
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || "Login failed, try again later"
      setLoginError(errorMessage)
      toast.error(errorMessage)
    }
  })

  const onSubmit = (values) => {
    setLoginError("")
    loginMutation.mutate(values)
  }

  const password = watch('password') || '';

  return (
    <form 
      onSubmit={handleSubmit(onSubmit)} 
      noValidate 
      className='flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 text-gray-800 animate-fade animate-duration-500'
    >
      <div className='inline-flex items-center gap-2 my-10'>
        <p className='prata-regular text-3xl'>Login</p>
        <hr className='border-none h-[1.5px] w-8 bg-gray-800' />
      </div>

      {/* Email Input */}
      <div className='mb-4 w-full'>
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
      <div className='mb-4 w-full relative'>
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

      {/* Invalid Credentials Error */}
      {loginError && <p className="text-red-500 text-sm w-full text-center">{loginError}</p>}


      {/* Forgot Password & Sign Up */}
      <div className='w-full text-sm mt-2 flex justify-between'>
        <div className='group flex flex-col items-center'>
          <div 
            className={`cursor-pointer transition-all duration-300 ${
              highlightForgot ? "text-red-300 animate-shake" : ""
            }`}
            onClick={() => toast.info('Sorry! It\'s better to create a new one for now ;)')}
          >
            Forgot your password?
          </div>
          <hr className='mt-[1px] w-[80%] border-none h-[1px] bg-gray-700 scale-0 transition-all duration-500 group-hover:scale-100'/>
        </div>
        <div className='group flex flex-col items-center'>
          <Link to='/signup'>Create an account</Link>
          <hr className='mt-[1px] w-[80%] border-none h-[1px] bg-gray-700 scale-0 transition-all duration-500 group-hover:scale-100'/>
        </div>
      </div>

      {/* Submit Button with Loading State */}
      <button 
        type="submit"
        className={`transistion-all duration-300 hover:bg-slate-700 font-light px-8 py-2 mt-4 flex items-center justify-center transition-all duration-300
          ${loginMutation.isPending ? 'bg-gray-400 text-gray-800 cursor-not-allowed' : 'bg-black text-white'}`}
        disabled={loginMutation.isPending}
      >
        {loginMutation.isPending ? (
          <>
            <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            Signing In...
          </>
        ) : "Sign In"}
      </button>
    </form>
  )
}

export default Login
