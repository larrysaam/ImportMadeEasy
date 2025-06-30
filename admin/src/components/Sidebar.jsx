import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { BsGrid,  } from 'react-icons/bs'
import {
  BsChatDots, // Example icon for messages
  BsPeople, // Icon for affiliates
  BsShield // Icon for admin management
} from 'react-icons/bs'
import { HiMenuAlt3 } from 'react-icons/hi'
import { IoMdClose } from 'react-icons/io'
import { assets } from '../assets/assets'
import { IoSettings } from "react-icons/io5";
import { MdLibraryAddCheck } from "react-icons/md";
import { toast } from "sonner";

const Sidebar = ({ setToken, adminData, hasPermission }) => {
  const [isOpen, setIsOpen] = useState(false)

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('adminData')
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
          {/* Admin Info */}
          {adminData && (
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2'>
              <div className='text-sm font-medium text-blue-800'>{adminData.username}</div>
              <div className='text-xs text-blue-600 capitalize'>{adminData.role.replace('_', ' ')}</div>
            </div>
          )}

          {/* Dashboard - Available to all */}
          <NavLink
            to='/'
            className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l'
            onClick={() => setIsOpen(false)}
          >
            <BsGrid size={20} />
            <p className='block'>Dashboard</p>
          </NavLink>

          {/* Orders - Available to all */}
          <NavLink
            to='/orders'
            className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l'
            onClick={() => setIsOpen(false)}
          >
            <img className='w-5 h-5' src={assets.orderIcon} alt='order-icon' />
            <p className='block'>Orders</p>
          </NavLink>

          {/* Categories - Available to all */}
          <NavLink
            to='/category'
            className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l'
            onClick={() => setIsOpen(false)}
          >
            <MdLibraryAddCheck size={20} />
            <p className='block'>Category</p>
          </NavLink>

          {/* Add Products - Available to all */}
          <NavLink
            to='/add'
            className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l'
            onClick={() => setIsOpen(false)}
          >
            <img className='w-5 h-5' src={assets.addIcon} alt='add-icon' />
            <p className='block'>Add items</p>
          </NavLink>

          {/* List Products - Available to all */}
          <NavLink
            to='/list'
            className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l'
            onClick={() => setIsOpen(false)}
          >
            <img className='w-5 h-5' src={assets.arrow} alt='list-icon' />
            <p className='block'>List items</p>
          </NavLink>

          {/* Messages - Available to all */}
          <NavLink
            to='/messages'
            onClick={() => setIsOpen(false)}
            className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l'
          >
            <BsChatDots size={18} />
            <p className='block'>Messages</p>
          </NavLink>

          {/* Super Admin Only Routes */}
          {hasPermission && hasPermission('affiliates') && (
            <NavLink
              to='/affiliates'
              onClick={() => setIsOpen(false)}
              className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l'
            >
              <BsPeople size={18} />
              <p className='block'>Affiliates</p>
            </NavLink>
          )}

          {hasPermission && hasPermission('settings') && (
            <NavLink
              to='/settings'
              className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l'
              onClick={() => setIsOpen(false)}
            >
              <IoSettings size={20} />
              <p className='block'>Settings</p>
            </NavLink>
          )}

          {hasPermission && hasPermission('adminManagement') && (
            <NavLink
              to='/admin-management'
              className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l'
              onClick={() => setIsOpen(false)}
            >
              <BsShield size={18} />
              <p className='block'>Admin Management</p>
            </NavLink>
          )}

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