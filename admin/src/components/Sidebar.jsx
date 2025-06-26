import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { BsGrid,  } from 'react-icons/bs'
import {
  BsChatDots, // Example icon for messages
  BsPeople // Icon for affiliates
} from 'react-icons/bs'
import { HiMenuAlt3 } from 'react-icons/hi'
import { IoMdClose } from 'react-icons/io'
import { assets } from '../assets/assets'
import { IoSettings } from "react-icons/io5";
import { MdLibraryAddCheck } from "react-icons/md";
import { toast } from "sonner";

const Sidebar = ({ setToken }) => {
  const [isOpen, setIsOpen] = useState(false)

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken('')
    toast.success('Successfully logged out')
  }

  return (
    <>
      {/* Hamburger Button - Only visible on mobile */}
      <button 
        onClick={toggleSidebar}
        className="fixed top-4 right-4 z-50 md:hidden"
      >
        {isOpen ? (
          <IoMdClose size={24} />
        ) : (
          <HiMenuAlt3 size={24} />
        )}
      </button>

      {/* Overlay - Only visible on mobile when sidebar is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:static top-0 left-0 h-full bg-white z-40
        w-[250px] md:w-[18%] 
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
        border-r-2
      `}>
        <div className='flex flex-col gap-4 pt-6 px-4 text-base'>
          <NavLink 
            to='/' 
            className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l'
            onClick={() => setIsOpen(false)}
          >
            <BsGrid size={20} />
            <p className='block'>Dashboard</p>
          </NavLink>

          <NavLink 
            to='/category' 
            className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l'
            onClick={() => setIsOpen(false)}
          >

            <MdLibraryAddCheck size={20} /> 
            <p className='block'>Category</p>
          </NavLink>
          
          <NavLink 
            to='/add' 
            className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l'
            onClick={() => setIsOpen(false)}
          >
            <img className='w-5 h-5' src={assets.addIcon} alt='add-icon' />
            <p className='block'>Add items</p>
          </NavLink>

          <NavLink 
            to='/list' 
            className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l'
            onClick={() => setIsOpen(false)}
          >
            <img className='w-5 h-5' src={assets.arrow} alt='list-icon' />
            <p className='block'>List items</p>
          </NavLink>

          <NavLink 
            to='/orders' 
            className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l'
            onClick={() => setIsOpen(false)}
          >
            <img className='w-5 h-5' src={assets.orderIcon} alt='order-icon' />
            <p className='block'>Orders</p>
          </NavLink>

          <NavLink 
            to='/preorders' 
            className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l'
            onClick={() => setIsOpen(false)}
          >
            <img className='w-5 h-5' src={assets.orderIcon} alt='order-icon' />
            <p className='block'>PreOrders</p>
          </NavLink>

          <NavLink
            to='/messages'
            onClick={() => setIsOpen(false)}
            className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l'
          >
            {/* Use an appropriate icon, e.g., BsChatDots or assets.message_icon */}
            <BsChatDots size={18} />
            <p className='block'>Messages</p>
          </NavLink>

          <NavLink
            to='/affiliates'
            onClick={() => setIsOpen(false)}
            className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l'
          >
            <BsPeople size={18} />
            <p className='block'>Affiliates</p>
          </NavLink>

          <NavLink
            to='/settings'
            className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l'
            onClick={() => setIsOpen(false)}
          >
            <IoSettings size={20} />
            <p className='block'>Settings</p>
          </NavLink>

           <button
                onClick={logout}
                className='cursor-pointer bg-gray-700 hover:bg-gray-900 text-white px-5 py-2 sm:px-7 sm:py-3 rounded-lg text-xs sm:text-sm'>
                    Logout
            </button>
        </div>
      </div>
    </>
  )
}

export default Sidebar