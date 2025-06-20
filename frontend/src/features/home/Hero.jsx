import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSettings } from '@/hooks/useSettings'
import { assets } from '@/assets/assets'
import { FaChevronDown } from 'react-icons/fa'

const Hero = () => {
  const { settings, loading } = useSettings()
  const [currentIndex, setCurrentIndex] = useState(0)

  // Fallback images in case settings aren't loaded
  const fallbackImages = [
    assets.hero1,
    assets.hero2,
    assets.hero3,
    assets.hero4,
  ]

  // Use settings images if available, otherwise use fallback
  const images =  fallbackImages
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
    }, 8000)

    return () => clearInterval(interval)
  }, [images.length])

  if (loading) {
    return (
      <div className='relative w-full h-screen sm:h-[600px] lg:h-[700px] bg-gray-200 animate-pulse'>
        {/* Loading state */}
      </div>
    )
  }

  return (
    <div className='relative w-full h-screen sm:h-[600px] lg:h-[700px] overflow-hidden'>
      {/* Background Image */}
      <div className="w-full h-full overflow-hidden">
        <img
          key={currentIndex} // Add key to force re-render and restart animation
          src={images[currentIndex]}
          alt={`hero-background-${currentIndex}`}
          className="w-full h-full object-cover animate-zoom-in"
          style={{
            animationDuration: '8s',
            animationTimingFunction: 'linear',
            animationFillMode: 'forwards'
          }}
        />
      </div>

      {/* Overlay for better text visibility */}
      <div className='absolute inset-0 bg-black/40'></div>

      {/* Text and Buttons - Centered but lower on mobile */}
      <div className='absolute inset-0 flex flex-col items-center justify-center sm:justify-center text-center text-white px-4 sm:px-6 pt-16 sm:pt-0'>
        <div className='flex flex-col items-center mt-20 sm:mt-0'>
          <h1 className='text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight max-w-5xl tracking-tight drop-shadow-lg mb-2 sm:mb-0'>
            {settings?.text?.hero || 'Summer Sale is Here!'}
          </h1>
          <p className='mt-3 sm:mt-6 text-base sm:text-lg md:text-xl lg:text-2xl max-w-xl sm:max-w-2xl font-medium px-2 sm:px-0'>
            Get set for summer with gear that can take the heat.
          </p>
          <div className='mt-6 sm:mt-8'>
            <Link
              to={
                settings?.herolink?.productId
                  ? `/product/${settings.herolink.productId}`
                  : settings?.herolink?.category
                    ? `/collection?category=${settings.herolink.category}`
                    : '/collection'
              }
              className='px-6 sm:px-10 py-3 sm:py-4 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition text-base sm:text-lg'
            >
              Shop Now
            </Link>
          </div>
        </div>
      </div>

      {/* Swipe Down Indicator - Visible on all devices */}
      <div className='absolute bottom-12 left-0 right-0 flex flex-col items-center animate-bounce'>
        <p className='text-white text-sm font-medium mb-2'>Scroll Down</p>
        <FaChevronDown className='text-white text-xl' />
      </div>
    </div>
  )
}

export default Hero
