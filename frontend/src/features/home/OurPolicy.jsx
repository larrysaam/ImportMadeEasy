import React from 'react'
import { assets } from '@/assets/assets'

const OurPolicy = () => {
  return (
    <div className='flex flex-col sm:flex-row justify-around gap-12 sm:gap-2
     text-center py-20 text-xs sm:text-xs md:text-base text-gray-700'>
        <div>
            <img src={assets.quality} alt='exchange-icon' className='w-12 m-auto mb-5 '/>
            <p className='font-semibold '>Ease exchange policy</p>
            <p className='text-gray-400'>We offer hassle free exchange policy</p>
        </div>
        <div>
            <img src={assets.returnIcon} alt='quality-icon' className='w-12 m-auto mb-5 '/>
            <p className='font-semibold '>7 Days Return Policy</p>
            <p className='text-gray-400'>You can return your goods within 7 days if you didn't like our product</p>
        </div>
        <div>
            <img src={assets.daytime} alt='support-icon' className='w-12 m-auto mb-5 '/>
            <p className='font-semibold '>Best customer support</p>
            <p className='text-gray-400'>We provide 24/7 customer support service</p>
        </div>
    </div>
  )
}

export default OurPolicy