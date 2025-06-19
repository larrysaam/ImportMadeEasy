import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSettings } from '@/hooks/useSettings'
import { assets } from '@/assets/assets'

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
  const images = settings?.images?.hero?.length ? settings.images.hero : fallbackImages

  useEffect(() => {
      { console.log('Hero images:', settings)}

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [images.length, settings])

  if (loading) {
    return (
      <div className='relative w-full h-[500px] sm:h-[600px] lg:h-[700px] bg-gray-200 animate-pulse'>
        {/* Loading state */}
      </div>
    )
  }

  return (
    <div className='relative w-full h-[500px] sm:h-[600px] lg:h-[700px] overflow-hidden'>
      {/* Background Image */}
      <img
        src={images[currentIndex]}
        alt={`hero-background-${currentIndex}`}
        className='w-full h-full object-cover transition-opacity duration-2000'
      />

      {/* Text and Buttons */}
      <div className='absolute bottom-20 left-10 text-white'>
        <h1 className='text-xl sm:text-5xl lg:text-7xl font-bold leading-tight'>
          {settings?.text?.hero || 'Summer Sale is Here!'}
        </h1>
        <p className='mt-4 text-lg sm:text-xl'>
          Get set for summer with gear that can take the heat.
        </p>
        <div className='mt-6 flex gap-4'>
          <Link
            to={
                  settings?.herolink?.productId
                      ? `/product/${settings.herolink.productId}`
                      : settings?.herolink?.category
                          ? `/collection?category=${settings.herolink.category}`
                          : '/collection'
              }
            className='px-6 py-3 bg-white text-black font-medium rounded-full hover:bg-gray-200 transition'
          >
            Shop
          </Link>
          
        </div>
      </div>
    </div>
  )
}

export default Hero