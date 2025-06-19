import React from 'react'
import { assets } from '@/assets/assets'
import { Link } from 'react-router-dom'
import { FaWhatsapp, FaInstagram, FaLinkedin, FaTwitter } from 'react-icons/fa'

const Footer = () => {
  return (
    <div className='pl-4 pr-4 sm:pl-8 sm:pr-8 lg:pl-16 lg:pr-16 bg-white'>
      <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 md:mt-40 text-sm'>
        <div>
          <img src={assets.IMELogo} alt='logo' className='mb-5 w-24' />
          <p className='w-full md:w-2/3 text-gray-600'>
            Import Made Easy is a modern importation company that helps individuals and businesses in Cameroon access quality, affordable products from Nigeria with speed and reliability. From sourcing to delivery, we make importing simple, secure, and stress-free.
          </p>
        </div>

        <div>
          <p className='text-xl font-medium mb-5'>COMPANY</p>
          <ul className='flex flex-col gap-2 text-gray-600'>
            <li>
              <Link to='/' className='hover:text-black'>Home</Link>
            </li>
            <li>
              <Link to='/about' className='hover:text-black'>About us</Link>
            </li>
            <li>
              <Link to='/delivery' className='hover:text-black'>Delivery</Link>
            </li>
            <li>
              <Link to='/privacy' className='hover:text-black'>Privacy policy</Link>
            </li>
          </ul>
        </div>

        <div>
          <p className='text-xl font-medium mb-5'>GET IN TOUCH</p>
          <ul className='flex flex-col gap-1 text-gray-600'>
            <li>+237 670-019-205</li>
            <li>contactus@importmadeeasy.com</li>
          </ul>
          <p className='text-gray-400 mt-5 mb-2'>Follow us on</p>
          <div className='flex gap-4 text-gray-600 text-lg'>
            <a href='https://wa.me/your-number' target='_blank' rel='noopener noreferrer' className='hover:text-black'>
              <FaWhatsapp />
            </a>
            <a href='https://instagram.com/your-profile' target='_blank' rel='noopener noreferrer' className='hover:text-black'>
              <FaInstagram />
            </a>
            <a href='https://linkedin.com/in/your-profile' target='_blank' rel='noopener noreferrer' className='hover:text-black'>
              <FaLinkedin />
            </a>
            <a href='https://twitter.com/your-profile' target='_blank' rel='noopener noreferrer' className='hover:text-black'>
              <FaTwitter />
            </a>
          </div>
        </div>
      </div>

      <div>
        <hr />
        <div className='flex justify-between max-sm:flex-col items-center max-sm:mb-5'>
          <p className='py-5 text-sm text-center text-gray-400'>Copyright 2025 importmadeeasy.com - All Rights Reserved.</p>
          <div className='flex items-center gap-3'>
            <div className='w-[46px] h-[30px] border bg-slate-50 rounded flex items-center justify-center'>
              <img src={assets.Mastercard} alt='badges' />
            </div>
            <div className='w-[46px] h-[30px] border bg-slate-50 rounded flex items-center justify-center'>
              <img src={assets.Visa} alt='badges' />
            </div>
            <div className='w-[46px] h-[30px] border bg-slate-50 rounded flex items-center justify-center'>
              <img src={assets.ApplePay} alt='badges' />
            </div>
            <div className='w-[46px] h-[30px] border bg-slate-50 rounded flex items-center justify-center'>
              <img src={assets.Paypal} alt='badges' />
            </div>
            <div className='w-[46px] h-[30px] border bg-slate-50 rounded flex items-center justify-center'>
              <img src={assets.GPay} alt='badges' />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Footer