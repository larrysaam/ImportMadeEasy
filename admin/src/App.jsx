import React, { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Login from './components/Login'
import { Route, Routes } from 'react-router-dom'
import Add from './pages/Add'
import List from './pages/List'
import Orders from './pages/Orders'
import { Toaster } from "@/components/ui/sonner"
import NotFound from './components/NotFound'
import Dashboard from './pages/Dashboard'
import Categories from './pages/Categories'
import Preorders from './pages/Preorders'
import Settings from './pages/Settings'
import Messages from './pages/Messages' // Import the new Messages page
import AffiliateManagement from './pages/AffiliateManagement'
import AdminManagement from './pages/AdminManagement'


export const backendUrl = import.meta.env.VITE_BACKEND_URL
export const currency = import.meta.env.VITE_CURRENCY_SYMBOL || 'FCFA'

const App = () => {

  const [token, setToken] = useState(localStorage.getItem('token') ? localStorage.getItem('token') : '')
  const [adminData, setAdminData] = useState(null)

  useEffect(()=> {
    localStorage.setItem('token', token)

    // Load admin data from localStorage
    if (token) {
      const storedAdminData = localStorage.getItem('adminData')
      if (storedAdminData) {
        try {
          setAdminData(JSON.parse(storedAdminData))
        } catch (error) {
          console.error('Error parsing admin data:', error)
          localStorage.removeItem('adminData')
        }
      }
    } else {
      // Clear admin data when token is removed
      setAdminData(null)
      localStorage.removeItem('adminData')
    }
  },[token])

  // Helper function to check if admin has permission
  const hasPermission = (permission) => {
    if (!adminData) return false
    return adminData.role === 'super_admin' || adminData.permissions?.[permission]
  }

  return (
      <div className='bg-gray-50 min-h-screen'>
      <Toaster richColors closeButton/>
      {
        token === '' ?
          <Login setToken={setToken} setAdminData={setAdminData}/> : (
            <>
              <Navbar setToken={setToken} adminData={adminData}/>
              <hr />
              <div className='flex w-full'>
                <Sidebar setToken={setToken} adminData={adminData} hasPermission={hasPermission} />
                <div className='w-[90%] sm:w-[70%] mx-auto ml-[max(5vw, 25px)] my-8 text-gray-600 text-base'>
                  <Routes>
                    {/* Routes available to all admin types */}
                    <Route path='/' element={<Dashboard token={token} />} />
                    <Route path='/orders' element={<Orders token={token} />} />
                    <Route path='/category' element={<Categories token={token} />} />
                    <Route path="/edit/:productId" element={<Add token={token} />} />
                    <Route path='/add' element={<Add token={token} />} />
                    <Route path='/list' element={<List token={token} />} />
                    <Route path='/messages' element={<Messages token={token} />} />

                    {/* Super Admin only routes */}
                    {hasPermission('settings') && (
                      <Route path='/settings' element={<Settings token={token} />} />
                    )}
                    {hasPermission('affiliates') && (
                      <Route path='/affiliates' element={<AffiliateManagement token={token} />} />
                    )}
                    {hasPermission('adminManagement') && (
                      <Route path='/admin-management' element={<AdminManagement token={token} adminData={adminData} />} />
                    )}

                    <Route path='*' element={<NotFound />} />
                  </Routes>
                </div>
              </div>
            </>
          )
      }
    </div>
    
  )
}

export default App