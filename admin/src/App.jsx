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


export const backendUrl = import.meta.env.VITE_BACKEND_URL
export const currency = import.meta.env.VITE_CURRENCY_SYMBOL || '€'

const App = () => {

  const [token, setToken] = useState(localStorage.getItem('token') ? localStorage.getItem('token') : '')

  useEffect(()=> {
    localStorage.setItem('token', token)
  },[token])

  return (
      <div className='bg-gray-50 min-h-screen'>
      <Toaster richColors closeButton/>
      {
        token === '' ?
          <Login setToken={setToken}/> : (
            <>
              <Navbar setToken={setToken}/>
              <hr />
              <div className='flex w-full'>
                <Sidebar />
                <div className='w-[90%] sm:w-[70%] mx-auto ml-[max(5vw, 25px)] my-8 text-gray-600 text-base'>
                  <Routes>
                    <Route path='/settings' element={<Settings token={token} />} />
                    <Route path="/edit/:productId" element={<Add token={token} />} />
                    <Route path='/add' element={<Add token={token} />} />
                    <Route path='/list' element={<List token={token} />} />
                    <Route path='/orders' element={<Orders token={token} />} />
                    <Route path='/preorders' element={<Preorders token={token} />} />
                    <Route path='/category' element={<Categories token={token} />} />
                    <Route path='/messages' element={<Messages token={token} />} /> {/* Add route for Messages */}
                    <Route path='/' element={<Dashboard token={token} />} />
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