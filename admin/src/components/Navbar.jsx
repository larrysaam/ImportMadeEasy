import React, { useEffect, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { assets } from '../assets/assets'


const Navbar = ({setToken, adminData}) => {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')

  // Check if we're on the list page (equivalent to collection page in admin)
  const isListPage = location.pathname === '/list'

  useEffect(() => {
    // This log helps debug if the Google Translate script and initialization function are ready
    console.log('Navbar useEffect: window.google:', window.google, 'init func:', typeof window.googleTranslateElementInit);

    // Check if the Google Translate initialization function is available

  }, []); // Empty dependency array ensures this runs once after the component mounts

  // Sync search term with URL params when on list page
  useEffect(() => {
    if (isListPage) {
      const urlSearch = searchParams.get('search') || ''
      setSearchTerm(urlSearch)
    } else {
      setSearchTerm('')
    }
  }, [isListPage, searchParams])

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)

    // Update URL params
    if (value.trim()) {
      setSearchParams({ search: value })
    } else {
      setSearchParams({})
    }
  }

  // Clear search
  const clearSearch = () => {
    setSearchTerm('')
    setSearchParams({})
  }

  return (
    <>
      <div className='flex items-center py-2 px-[4%] justify-between'>
          <img className='sm:w-[max(5%,30px)] w-10 ' src={assets.logo} alt='' />
          <div className='text-lg sm:text-xl mx-2 sm:mx-6'>Our Shop's Admin Panel</div>

          <div className='flex items-center gap-4'>
            {/* Admin Info */}
            {adminData && (
              <div className='hidden sm:flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-lg'>
                <div className='text-right'>
                  <div className='text-sm font-medium text-gray-800'>{adminData.username}</div>
                  <div className='text-xs text-gray-600 capitalize'>{adminData.role.replace('_', ' ')}</div>
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                  adminData.role === 'super_admin' ? 'bg-purple-600' : 'bg-blue-600'
                }`}>
                  {adminData.username.charAt(0).toUpperCase()}
                </div>
              </div>
            )}

            {/* This is the target div for the Google Translate widget. Ensure the ID is correct. */}
            <div className='max-w-xs' id="google_translate_element"></div>
          </div>
      </div>

      {/* Search Bar - Only visible on list page */}
      {isListPage && (
        <div className='px-[4%] pb-3'>
          <div className='flex items-center justify-center border border-gray-300 px-4 py-2 bg-gray-50 rounded-lg max-w-md mx-auto'>
            <img src={assets.search} alt='search-icon' className='w-4 h-4 mr-3' />
            <input
              value={searchTerm}
              onChange={handleSearchChange}
              type='text'
              placeholder='Search products...'
              className='flex-1 outline-none bg-inherit text-sm placeholder-gray-500'
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className='ml-3 text-gray-400 hover:text-gray-600'
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default Navbar
