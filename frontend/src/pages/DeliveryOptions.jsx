import React, { useState, useRef, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Title from '@/components/Title'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FaChevronDown } from 'react-icons/fa'

const DeliveryOptions = () => {
  const [country, setCountry] = useState('')
  const [deliveryType, setDeliveryType] = useState('')
  const [showScrollIndicator, setShowScrollIndicator] = useState(true)
  const deliveryMethodRef = useRef(null)
  const comparisonTableRef = useRef(null)

  // Handle scroll events to hide indicator when at comparison table
  useEffect(() => {
    const handleScroll = () => {
      if (!comparisonTableRef.current) return
      
      const tableRect = comparisonTableRef.current.getBoundingClientRect()
      const tableBottom = tableRect.bottom
      const windowHeight = window.innerHeight
      
      // Hide indicator when comparison table bottom is visible in viewport
      if (tableBottom <= windowHeight) {
        setShowScrollIndicator(false)
      } else {
        setShowScrollIndicator(true)
      }
    }

    window.addEventListener('scroll', handleScroll)
    // Initial check
    handleScroll()
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [country]) // Re-run when country changes since that affects table existence

  // Delivery options data
  const deliveryData = {
    Nigeria: [
      {
        type: 'Standard',
        time: '9 days',
        cost: '1,000 FCFA',
        bestFor: 'Fast, affordable goods',
        description: 'Our standard shipping from Nigeria offers a balance of speed and affordability for most items.'
      }
    ],
    China: [
      {
        type: 'Express (Air)',
        time: '14 days',
        cost: '9,000 FCFA/kg',
        bestFor: 'Urgent, light goods',
        description: 'Air shipping is ideal for time-sensitive orders or lighter items where speed is a priority.'
      },
      {
        type: 'Standard (Sea)',
        time: '60 days',
        cost: '1,000 FCFA/kg',
        bestFor: 'Bulk, non-urgent goods',
        description: 'Sea shipping offers the most cost-effective solution for larger orders where delivery time is flexible.'
      }
    ]
  }

  // Flag images
  const flagImages = {
    Nigeria: "https://flagcdn.com/w320/ng.png",
    China: "https://flagcdn.com/w320/cn.png"
  }

  // Shipping method icons
  const shippingIcons = {
    "Standard": "📦",
    "Express (Air)": "✈️",
    "Standard (Sea)": "🚢"
  }

  // Get available delivery types based on selected country
  const getDeliveryTypes = () => {
    if (!country) return []
    return deliveryData[country].map(option => option.type)
  }

  // Get selected delivery option details
  const getSelectedDeliveryDetails = () => {
    if (!country || !deliveryType) return null
    return deliveryData[country].find(option => option.type === deliveryType)
  }

  // Reset delivery type when country changes
  const handleCountryChange = (value) => {
    setCountry(value)
    setDeliveryType('')
  }

  // Return to country selection
  const handleReturnToCountrySelection = () => {
    setCountry('')
    setDeliveryType('')
  }

  // Scroll to delivery method section when country is selected
  useEffect(() => {
    if (country && deliveryMethodRef.current) {
      // Small delay to ensure the section is rendered
      setTimeout(() => {
        deliveryMethodRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        })
      }, 100)
    }
  }, [country])

  const selectedDetails = getSelectedDeliveryDetails()

  return (
    <div className='px-4 sm:px-14 border-t pt-16 animate-fade animate-duration-500'>
      <div className='text-2xl mb-8'>
        <Title text1='SHIPPING' text2='OPTIONS' />
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Country Selection with Flags */}
        <div className="mb-8">
          <h2 className="text-xl font-medium mb-6">Select Origin Country</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {Object.keys(deliveryData).map((countryName) => (
              <div 
                key={countryName}
                onClick={() => handleCountryChange(countryName)}
                className={`cursor-pointer transition-all duration-300 ${
                  country === countryName 
                    ? 'ring-4 ring-brand ring-offset-2' 
                    : 'hover:shadow-lg transform hover:-translate-y-1'
                }`}
              >
                <div className="relative aspect-[3/2] overflow-hidden rounded-lg shadow-md">
                  <img 
                    src={flagImages[countryName]} 
                    alt={`${countryName} flag`} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                    <h3 className="text-white text-2xl font-bold p-4">
                      {countryName === 'Nigeria' ? '🇳🇬 Nigeria' : '🇨🇳 China'}
                    </h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Method Selection (only if country is selected) */}
        {country && (
          <motion.div
            ref={deliveryMethodRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gray-50 p-6 rounded-lg mb-8"
          >
            <h2 className="text-xl font-medium mb-6">Select Delivery Method</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {deliveryData[country].map((option) => (
                <div
                  key={option.type}
                  onClick={() => setDeliveryType(option.type)}
                  className={`cursor-pointer p-4 rounded-lg border transition-all duration-300 ${
                    deliveryType === option.type
                      ? 'border-brand bg-brand/5 shadow-md'
                      : 'border-gray-200 hover:border-brand/30 hover:shadow'
                  }`}
                >
                  <div className="flex items-center mb-3">
                    <span className="text-3xl mr-3">{shippingIcons[option.type]}</span>
                    <h3 className="font-medium">{option.type}</h3>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p className="mb-2"><span className="font-medium text-gray-700">Time:</span> {option.time}</p>
                    <p className="mb-2"><span className="font-medium text-gray-700">Cost:</span> {option.cost}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Shipping Method Visualization */}
        {country && deliveryType && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <span className="text-4xl mr-4">{shippingIcons[deliveryType]}</span>
                  <div>
                    <h3 className="text-xl font-medium">{deliveryType}</h3>
                    <p className="text-gray-600">{selectedDetails?.description}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-gray-500 text-sm mb-1">Delivery Time</p>
                    <p className="text-2xl font-bold">{selectedDetails?.time}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-gray-500 text-sm mb-1">Cost</p>
                    <p className="text-2xl font-bold">{selectedDetails?.cost}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-gray-500 text-sm mb-1">Best For</p>
                    <p className="text-lg font-medium">{selectedDetails?.bestFor}</p>
                  </div>
                </div>
              </div>
              
              {/* Timeline visualization */}
              <div className="px-6 pb-6">
                <div className="relative pt-8">
                  <div className="h-1 w-full bg-gray-200 absolute top-4"></div>
                  <div className="flex justify-between relative">
                    <div className="text-center">
                      <div className="w-8 h-8 bg-brand text-white rounded-full flex items-center justify-center mx-auto z-10 relative">1</div>
                      <p className="mt-2 text-sm">Order Placed</p>
                    </div>
                    <div className="text-center">
                      <div className="w-8 h-8 bg-brand text-white rounded-full flex items-center justify-center mx-auto z-10 relative">2</div>
                      <p className="mt-2 text-sm">Processing</p>
                    </div>
                    <div className="text-center">
                      <div className="w-8 h-8 bg-brand text-white rounded-full flex items-center justify-center mx-auto z-10 relative">3</div>
                      <p className="mt-2 text-sm">Shipping</p>
                    </div>
                    <div className="text-center">
                      <div className="w-8 h-8 bg-brand text-white rounded-full flex items-center justify-center mx-auto z-10 relative">4</div>
                      <p className="mt-2 text-sm">Delivery</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Shop Now Button (only appears when both country and delivery type are selected) */}
        {country && deliveryType && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="w-full sm:w-auto fixed bottom-0 left-0 sm:relative p-4 sm:p-0 bg-white border-t sm:border-0 z-10 sm:flex sm:justify-center sm:my-10"
          >
            <Link 
              to="/collection"
              className="w-full sm:w-auto bg-brand text-white px-6 sm:px-8 py-3 text-sm rounded-full transition-all flex items-center justify-center sm:hover:bg-brand-dark sm:hover:scale-105"
            >
              <span className="font-medium">SHOP NOW</span>
              <svg 
                className="ml-2 w-5 h-5 transition-transform duration-300 sm:group-hover:translate-x-1" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </motion.div>
        )}

        {/* Comparison Table (only shown when country is selected) */}
        {country && (
          <motion.div 
            ref={comparisonTableRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: country && deliveryType ? 0.6 : 0.4 }}
            className="mb-8"
          >
            <h3 className="text-lg font-medium mb-4">All Shipping Options from {country}</h3>
            <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Best For</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deliveryData[country].map((option, index) => (
                    <tr 
                      key={index}
                      className={deliveryType === option.type ? "bg-blue-50" : ""}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-xl mr-2">{shippingIcons[option.type]}</span>
                          <span className="font-medium">{option.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{option.time}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{option.cost}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{option.bestFor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Information Section */}
        <div className="mt-12 bg-gray-50 p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium mb-4">Shipping Information</h3>
          <div className="space-y-4 text-sm text-gray-600">
            <p className="flex items-start">
              <span className="text-brand mr-2">•</span>
              All delivery times are estimates and may vary based on customs processing and local conditions.
            </p>
            <p className="flex items-start">
              <span className="text-brand mr-2">•</span>
              Shipping costs for China are calculated per kilogram of weight.
            </p>
            <p className="flex items-start">
              <span className="text-brand mr-2">•</span>
              For large or unusual items, please contact customer service for a custom shipping quote.
            </p>
            <p className="flex items-start">
              <span className="text-brand mr-2">•</span>
              Tracking information will be provided for all shipments via email and in your account dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* Scroll Down Indicator - only shown when country is selected */}
      {country && showScrollIndicator && (
        <motion.div 
          className="fixed bottom-20 sm:bottom-10 left-0 right-0 flex flex-col items-center z-10 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            animate={{ y: [0, 10, 0] }} 
            transition={{ duration: 1.5, repeat: Infinity, repeatType: "loop" }}
            className="bg-black/70 text-white rounded-full p-3 flex flex-col items-center shadow-lg"
          >
            <p className="text-xs font-medium mb-1">Scroll for more</p>
            <FaChevronDown className="text-sm" />
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default DeliveryOptions












