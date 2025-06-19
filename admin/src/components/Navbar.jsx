import React, { useEffect } from 'react'
import { assets } from '../assets/assets'


const Navbar = ({setToken}) => {
  useEffect(() => {    
    // This log helps debug if the Google Translate script and initialization function are ready
    console.log('Navbar useEffect: window.google:', window.google, 'init func:', typeof window.googleTranslateElementInit);
    
    // Check if the Google Translate initialization function is available
    
  }, []); // Empty dependency array ensures this runs once after the component mounts

  return (
    <div className='flex items-center py-2 px-[4%] justify-between'>
        <img className='sm:w-[max(5%,30px)] w-10 ' src={assets.logo} alt='' />
        <div className='text-lg sm:text-xl mx-2 sm:mx-6'>Our Shop's Admin Panel</div>
        {/* This is the target div for the Google Translate widget. Ensure the ID is correct. */}
        <div className='max-w-xs' id="google_translate_element"></div>
    </div>
  )
}

export default Navbar
