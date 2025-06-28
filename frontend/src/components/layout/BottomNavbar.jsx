import React, { useContext } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ShopContext } from '@/context/ShopContext'
import { Home, ShoppingCart, Package, User, LogIn, Store } from 'lucide-react'

const BottomNavbar = () => {
  const { getCartCount, token, navigate } = useContext(ShopContext)
  const location = useLocation()

  // Hide bottom navbar on product pages (mobile only)
  const isProductPage = location.pathname.includes('/product')

  // Navigation items configuration
  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      path: '/',
      requireAuth: false
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: Package,
      path: '/orders',
      requireAuth: true
    },
    {
      id: 'collection',
      label: 'Collection',
      icon: Store,
      path: '/collection',
      requireAuth: false
    },
    {
      id: 'cart',
      label: 'Cart',
      icon: ShoppingCart,
      path: '/cart',
      requireAuth: false,
      badge: getCartCount()
    },
    {
      id: 'profile',
      label: token ? 'Profile' : 'Login',
      icon: token ? User : LogIn,
      path: token ? '/profile' : '/login', // Redirect to profile if logged in, login if not
      requireAuth: false
    }
  ]

  // Handle navigation with authentication check
  const handleNavigation = (item) => {
    if (item.requireAuth && !token) {
      navigate('/login')
      return
    }
    
    if (item.id === 'profile' && !token) {
      navigate('/login')
      return
    }
    
    navigate(item.path)
  }

  // Check if current path matches nav item
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <>
      {/* Spacer to prevent content from being hidden behind fixed navbar */}
      <div className={`h-16 sm:hidden ${isProductPage ? 'hidden' : ''}`}></div>

      {/* Bottom Navigation - Mobile Only */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 sm:hidden shadow-lg ${isProductPage ? 'hidden' : ''}`}>
        {/* Subtle brand accent line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-light via-brand to-brand-dark"></div>
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item)}
                className={`flex flex-col items-center justify-center relative transition-all duration-200 active:scale-95 h-full w-full ${
                  active
                    ? 'text-brand'
                    : 'text-gray-500 hover:text-brand-light active:text-brand'
                }`}
              >
                {/* Icon with badge for cart */}
                <div className="relative">
                  <Icon 
                    className={`w-5 h-5 transition-all duration-200 ${
                      active ? 'scale-110' : 'scale-100'
                    }`} 
                  />
                  
                  {/* Cart badge */}
                  {item.id === 'cart' && item.badge > 0 && (
                    <span className="absolute -top-2 -right-2 bg-brand text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium shadow-md">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                  
                  {/* Profile indicator for logged in users */}
                  {item.id === 'profile' && token && (
                    <span className="absolute -top-1 -right-1 bg-brand rounded-full h-2 w-2 shadow-sm"></span>
                  )}
                </div>
                
                {/* Label */}
                <span className={`text-xs mt-1 font-medium transition-all duration-200 ${
                  active ? 'text-brand' : 'text-gray-500'
                }`}>
                  {item.label}
                </span>
                
                {/* Active indicator */}
                {active && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-brand rounded-full shadow-sm"></div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}

export default BottomNavbar
