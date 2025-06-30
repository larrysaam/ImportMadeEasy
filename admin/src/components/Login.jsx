import React, { useState } from 'react'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from "sonner"

const Login = ({setToken, setAdminData}) => {

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const onSubmitHandler = async (e) => {
        try {
            e.preventDefault()
            setLoading(true)

            const response = await axios.post(backendUrl + '/api/admin-auth/login', {email, password})

            if (response.data.success) {
                setToken(response.data.token)

                // Store admin data in localStorage and state
                const adminInfo = response.data.admin
                localStorage.setItem('adminData', JSON.stringify(adminInfo))
                if (setAdminData) {
                    setAdminData(adminInfo)
                }

                toast.success(`Welcome back, ${adminInfo.username}!`)
                console.log('Admin logged in:', adminInfo)
            } else {
                toast.error(response.data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.response?.data?.message || 'Login failed')
        } finally {
            setLoading(false)
        }
    }

  return (
    <div className='min-h-screen flex flex-col items-center justify-center w-full bg-gray-50'>
        <div className='bg-white shadow-lg rounded-lg px-8 py-6 max-w-md z-20 border'>
            <div className='text-center mb-6'>
                <h1 className='text-2xl font-bold text-gray-800'>Admin Panel</h1>
                <p className='text-sm text-gray-600 mt-1'>Sign in to your admin account</p>
            </div>

            <form onSubmit={onSubmitHandler}>
                <div className='mb-4 min-w-72'>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>Email Address</label>
                    <input
                        onChange={(e)=>setEmail(e.target.value)}
                        value={email}
                        className='rounded-md w-full px-3 py-2 border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                        type='email'
                        placeholder='admin@example.com'
                        required
                        disabled={loading}
                    />
                </div>

                <div className='mb-6 min-w-72'>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>Password</label>
                    <input
                        onChange={(e)=>setPassword(e.target.value)}
                        value={password}
                        className='rounded-md w-full px-3 py-2 border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                        type='password'
                        placeholder='Enter your password'
                        required
                        disabled={loading}
                    />
                </div>

                <button
                    type='submit'
                    disabled={loading}
                    className={`w-full py-2 px-4 rounded-md text-white font-medium transition-colors ${
                        loading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                    }`}
                >
                    {loading ? 'Signing In...' : 'Sign In'}
                </button>
            </form>
        </div>

        <div className='flex flex-col items-center mt-4 bg-blue-50 shadow-sm px-4 py-3 rounded-lg z-10 text-blue-700 border border-blue-200'>
            <p className='text-sm font-medium mb-1'>Demo Credentials:</p>
            <p className='text-xs'>Super Admin: admin@importmadeeasy.com</p>
            <p className='text-xs'>Password: admin123456</p>
        </div>
    </div>
  )
}

export default Login