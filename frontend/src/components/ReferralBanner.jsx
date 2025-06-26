import React, { useContext } from 'react'
import { ShopContext } from '@/context/ShopContext'
import { Link } from 'react-router-dom'
import { X, UserCheck } from 'lucide-react'

const ReferralBanner = () => {
  const { affiliateInfo, setAffiliateInfo, setAffiliateCode, token } = useContext(ShopContext)

  // Don't show banner if user is already logged in or no affiliate info
  if (token || !affiliateInfo) {
    return null
  }

  const handleDismiss = () => {
    // Clear affiliate data from localStorage and state
    localStorage.removeItem('affiliateCode')
    localStorage.removeItem('affiliateInfo')
    setAffiliateCode(null)
    setAffiliateInfo(null)
  }

  return (
    <div className="bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 relative">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserCheck className="w-5 h-5" />
          <div>
            <p className="font-medium">
              Welcome! You were referred by {affiliateInfo.name}
            </p>
            <p className="text-green-100 text-sm">
              Sign up now to get started and support your referrer!
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Link 
            to="/register" 
            className="bg-white text-green-600 px-4 py-2 rounded-md font-medium hover:bg-green-50 transition-colors"
          >
            Sign Up
          </Link>
          <button
            onClick={handleDismiss}
            className="text-green-100 hover:text-white transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReferralBanner
