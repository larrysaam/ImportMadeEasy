import React, { useState, useEffect } from 'react'
import { MessageCircle } from 'lucide-react'
import { useLocation } from 'react-router-dom'

const WhatsAppButton = () => {
  const [isVisible, setIsVisible] = useState(true)
  const location = useLocation()

  // Check if we're on a product page
  const isProductPage = location.pathname.startsWith('/product/')

  // WhatsApp business number - replace with actual business number
  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || "+237670019205" // Replace with your actual WhatsApp business number

  // Default message
  const defaultMessage = "Hello! I'm interested in your products on ImportMadeEasy. Can you help me?"

  // Handle scroll to show/hide button (optional - currently always visible)
  useEffect(() => {
    const handleScroll = () => {
      // Show button when page is scrolled down a bit
      if (window.pageYOffset > 100) {
        setIsVisible(true)
      } else {
        setIsVisible(true) // Keep always visible, change to false if you want to hide at top
      }
    }

    // Throttle scroll events for better performance
    let ticking = false
    const throttledHandleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', throttledHandleScroll)
    
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll)
    }
  }, [])

  // Handle WhatsApp click
  const handleWhatsAppClick = () => {
    const encodedMessage = encodeURIComponent(defaultMessage)
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodedMessage}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <>
      {isVisible && (
        <button
          onClick={handleWhatsAppClick}
          className={`fixed right-6 z-40 group p-4 bg-green-500 text-white rounded-full shadow-xl hover:bg-green-600 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
            isProductPage ? 'bottom-20 sm:bottom-6' : 'bottom-32 sm:bottom-6'
          }`}
          aria-label="Contact us on WhatsApp"
          title="Chat with us on WhatsApp"
        >
          {/* Pulse animation */}
          <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-30"></div>

          {/* Secondary pulse */}
          <div className="absolute inset-0 bg-green-400 rounded-full animate-pulse opacity-20"></div>

          {/* WhatsApp icon */}
          <MessageCircle className="w-6 h-6 relative z-10 transition-transform duration-300 group-hover:rotate-12" />

          {/* Tooltip */}
          <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none shadow-lg">
            <span className="font-medium">Chat with us</span>
            {/* Tooltip arrow */}
            <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-gray-900"></div>
          </div>
        </button>
      )}
    </>
  )
}

export default WhatsAppButton
