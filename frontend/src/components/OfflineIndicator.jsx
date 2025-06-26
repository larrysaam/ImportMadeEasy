import React, { useState, useEffect } from 'react'
import { WifiOff, Wifi, RefreshCw } from 'lucide-react'

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showOfflineMessage, setShowOfflineMessage] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowOfflineMessage(false)
      
      // Show brief "back online" message
      setTimeout(() => {
        setShowOfflineMessage(false)
      }, 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowOfflineMessage(true)
    }

    // Listen for network status changes
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Listen for custom network status events from PWA utils
    const handleNetworkStatusChange = (event) => {
      const { isOnline: online } = event.detail
      setIsOnline(online)
      setShowOfflineMessage(!online)
    }

    window.addEventListener('network-status-change', handleNetworkStatusChange)

    // Initial check
    if (!navigator.onLine) {
      setShowOfflineMessage(true)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('network-status-change', handleNetworkStatusChange)
    }
  }, [])

  const handleRetry = async () => {
    setIsRetrying(true)
    
    try {
      // Try to fetch a small resource to test connectivity
      const response = await fetch('/manifest.json', { 
        cache: 'no-cache',
        mode: 'no-cors'
      })
      
      if (response.ok || response.type === 'opaque') {
        setIsOnline(true)
        setShowOfflineMessage(false)
      }
    } catch (error) {
      console.log('Still offline')
    } finally {
      setIsRetrying(false)
    }
  }

  // Don't show anything if online and no message to show
  if (isOnline && !showOfflineMessage) {
    return null
  }

  return (
    <>
      {/* Offline Banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white px-4 py-2 z-50">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4" />
              <span className="text-sm font-medium">
                You're offline. Some features may not be available.
              </span>
            </div>
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="flex items-center gap-1 bg-red-700 hover:bg-red-800 px-3 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Checking...' : 'Retry'}
            </button>
          </div>
        </div>
      )}

      {/* Back Online Message */}
      {isOnline && showOfflineMessage && (
        <div className="fixed top-0 left-0 right-0 bg-green-600 text-white px-4 py-2 z-50 animate-slide-down">
          <div className="flex items-center justify-center max-w-7xl mx-auto">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4" />
              <span className="text-sm font-medium">
                You're back online!
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Offline Indicator */}
      {!isOnline && (
        <div className="fixed bottom-20 right-4 bg-red-600 text-white p-3 rounded-full shadow-lg z-40">
          <WifiOff className="w-5 h-5" />
        </div>
      )}
    </>
  )
}

export default OfflineIndicator
