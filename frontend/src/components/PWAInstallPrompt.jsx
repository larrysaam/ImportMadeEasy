import React, { useState, useEffect } from 'react'
import { X, Download, Smartphone } from 'lucide-react'

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if running in standalone mode
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                            window.navigator.standalone ||
                            document.referrer.includes('android-app://')
    
    setIsStandalone(isStandaloneMode)

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    setIsIOS(iOS)

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Save the event so it can be triggered later
      setDeferredPrompt(e)
      
      // Check if user has dismissed the prompt before
      const dismissed = localStorage.getItem('pwa-install-dismissed')
      const lastDismissed = localStorage.getItem('pwa-install-last-dismissed')
      
      // Show prompt if not dismissed or if it's been more than 7 days
      if (!dismissed || (lastDismissed && Date.now() - parseInt(lastDismissed) > 7 * 24 * 60 * 60 * 1000)) {
        setShowInstallPrompt(true)
      }
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA was installed')
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
    localStorage.setItem('pwa-install-last-dismissed', Date.now().toString())
  }

  // Don't show if already installed or in standalone mode
  if (isStandalone) {
    return null
  }

  // iOS Install Instructions
  if (isIOS && !isStandalone) {
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 max-w-sm mx-auto">
        <div className="flex items-start gap-3">
          <Smartphone className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">Install ImportMadeEasy</h3>
            <p className="text-sm text-gray-600 mb-3">
              Install our app for a better shopping experience:
            </p>
            <ol className="text-xs text-gray-600 space-y-1 mb-3">
              <li>1. Tap the Share button <span className="inline-block w-4 h-4 bg-blue-100 rounded text-center">⬆️</span></li>
              <li>2. Scroll down and tap "Add to Home Screen"</li>
              <li>3. Tap "Add" to install</li>
            </ol>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    )
  }

  // Android/Desktop Install Prompt
  if (showInstallPrompt && deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 max-w-sm mx-auto">
        <div className="flex items-start gap-3">
          <Download className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">Install ImportMadeEasy</h3>
            <p className="text-sm text-gray-600 mb-3">
              Get the full app experience with offline access and faster loading.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstallClick}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Install App
              </button>
              <button
                onClick={handleDismiss}
                className="text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-100 transition-colors"
              >
                Not Now
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    )
  }

  return null
}

export default PWAInstallPrompt
