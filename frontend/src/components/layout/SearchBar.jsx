import React, { useContext, useEffect } from 'react'
import { ShopContext } from '@/context/ShopContext'
import { assets } from '@/assets/assets'
import { useLocation } from 'react-router-dom'

const SearchBar = () => {

    const { search, setSearch, showSearch, setShowSearch } = useContext(ShopContext);
    const location = useLocation();

    useEffect(() => {
      if (!location.pathname.includes('collection')) {
        setSearch('')
        setShowSearch(false)
      }
    }, [location])
  return showSearch ? (
    <div className='border-x border-t bg-gray-50 text-center animate-fade-down animate-duration-150'>
        <div className='inline-flex items-center justify-center border border-gray-400 
        px-5 py-2 my-5 mx-3 bg-white rounded-full w-3/4 sm:w-1/2 relative'>
            <input value={search} onChange={(e)=>setSearch(e.target.value)} type='text' placeholder='Search' 
            className='flex-1 outline-none bg-inherit text-sm'/>
            <img onClick={()=>setSearch('')} src={assets.cross} alt='cross-icon' className='inline w-3 cursor-pointer absolute right-4'/>
        </div>
    </div>
  ) : null
}

export default SearchBar