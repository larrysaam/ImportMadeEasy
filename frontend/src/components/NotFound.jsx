import React from 'react'
import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
    <div className='flex flex-col items-center my-20 gap-12'>
        <b className='text-7xl text-slate-700'>OOPS!</b>
        <div className='text-gray-500'>
            <h1 className='text-center text-2xl mb-4'>404 - PAGE NOT FOUND</h1>
            <p className='text-center'>The page you are looking for is not implemented.<br/> Please visit another location</p>
        </div>
        <Link to='/' className='px-6 py-3 bg-blue-700  transistion-all duration-500 hover:bg-blue-900 rounded-full shadow-lg hover:scale-[105%] text-white'>Go to the home page</Link>
    </div>
  )
}

export default NotFound