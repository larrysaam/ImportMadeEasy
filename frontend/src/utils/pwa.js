// PWA Service Worker Registration and Utilities

// Register service worker
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })

      console.log('Service Worker registered successfully:', registration)

      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is available
              showUpdateAvailableNotification()
            }
          })
        }
      })

      return registration
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      return null
    }
  } else {
    console.log('Service Worker not supported')
    return null
  }
}

// Show update available notification
const showUpdateAvailableNotification = () => {
  // Create a custom event to notify the app about updates
  const event = new CustomEvent('sw-update-available')
  window.dispatchEvent(event)
}

// Request notification permission
export const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission()
    console.log('Notification permission:', permission)
    return permission === 'granted'
  }
  return false
}

// Subscribe to push notifications
export const subscribeToPushNotifications = async (registration) => {
  if (!registration) return null

  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        // Replace with your VAPID public key
        'YOUR_VAPID_PUBLIC_KEY_HERE'
      )
    })

    console.log('Push subscription:', subscription)
    
    // Send subscription to your backend
    await sendSubscriptionToBackend(subscription)
    
    return subscription
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error)
    return null
  }
}

// Convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Send subscription to backend
const sendSubscriptionToBackend = async (subscription) => {
  try {
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription)
    })

    if (!response.ok) {
      throw new Error('Failed to send subscription to backend')
    }

    console.log('Subscription sent to backend successfully')
  } catch (error) {
    console.error('Error sending subscription to backend:', error)
  }
}

// Check if app is running in standalone mode
export const isStandalone = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone ||
         document.referrer.includes('android-app://')
}

// Check if device is iOS
export const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
}

// Check if device is mobile
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// Get install prompt status
export const getInstallPromptStatus = () => {
  const dismissed = localStorage.getItem('pwa-install-dismissed')
  const lastDismissed = localStorage.getItem('pwa-install-last-dismissed')
  
  return {
    dismissed: dismissed === 'true',
    lastDismissed: lastDismissed ? parseInt(lastDismissed) : null,
    canShowAgain: !dismissed || (lastDismissed && Date.now() - parseInt(lastDismissed) > 7 * 24 * 60 * 60 * 1000)
  }
}

// Track PWA usage analytics
export const trackPWAEvent = (eventName, data = {}) => {
  // Send analytics event
  if (window.gtag) {
    window.gtag('event', eventName, {
      event_category: 'PWA',
      ...data
    })
  }
  
  console.log('PWA Event:', eventName, data)
}

// Handle offline/online status
export const setupNetworkStatusHandling = () => {
  const updateOnlineStatus = () => {
    const isOnline = navigator.onLine
    
    // Dispatch custom event
    const event = new CustomEvent('network-status-change', {
      detail: { isOnline }
    })
    window.dispatchEvent(event)
    
    // Track analytics
    trackPWAEvent('network_status_change', { online: isOnline })
    
    // Show notification
    if (isOnline) {
      showNotification('Back Online', 'Your connection has been restored.')
    } else {
      showNotification('Offline Mode', 'You are now browsing offline.')
    }
  }

  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
  
  return () => {
    window.removeEventListener('online', updateOnlineStatus)
    window.removeEventListener('offline', updateOnlineStatus)
  }
}

// Show browser notification
const showNotification = (title, body, options = {}) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      ...options
    })
  }
}

// Cache management utilities
export const clearAppCache = async () => {
  if ('caches' in window) {
    const cacheNames = await caches.keys()
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    )
    console.log('App cache cleared')
  }
}

// Get cache size
export const getCacheSize = async () => {
  if ('caches' in window && 'storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate()
    return {
      used: estimate.usage,
      available: estimate.quota,
      usedMB: Math.round(estimate.usage / 1024 / 1024 * 100) / 100,
      availableMB: Math.round(estimate.quota / 1024 / 1024 * 100) / 100
    }
  }
  return null
}

// Force service worker update
export const updateServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      await registration.update()
      console.log('Service worker update requested')
    }
  }
}

// Skip waiting and activate new service worker
export const skipWaitingAndActivate = () => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' })
  }
}
