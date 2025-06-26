import React, { useState, useEffect } from 'react'
import { X, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react'

const PWADebugger = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [checks, setChecks] = useState({})
  const [loading, setLoading] = useState(false)

  const runPWAChecks = async () => {
    setLoading(true)
    const results = {}

    try {
      // Check if running on HTTPS or localhost
      results.https = location.protocol === 'https:' || location.hostname === 'localhost'

      // Check if service worker is supported
      results.serviceWorkerSupport = 'serviceWorker' in navigator

      // Check if service worker is registered
      if (results.serviceWorkerSupport) {
        try {
          const registration = await navigator.serviceWorker.getRegistration()
          results.serviceWorkerRegistered = !!registration
          results.serviceWorkerActive = !!(registration && registration.active)
        } catch (error) {
          results.serviceWorkerRegistered = false
          results.serviceWorkerActive = false
        }
      }

      // Check manifest
      try {
        const manifestResponse = await fetch('/manifest.json')
        results.manifestExists = manifestResponse.ok
        if (manifestResponse.ok) {
          const manifest = await manifestResponse.json()
          results.manifestValid = !!(manifest.name && manifest.start_url && manifest.icons)
          results.manifestIcons = manifest.icons ? manifest.icons.length : 0
        }
      } catch (error) {
        results.manifestExists = false
        results.manifestValid = false
      }

      // Check icons
      const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512]
      const iconChecks = await Promise.all(
        iconSizes.map(async (size) => {
          try {
            const response = await fetch(`/icons/icon-${size}x${size}.png`)
            return { size, exists: response.ok }
          } catch {
            return { size, exists: false }
          }
        })
      )
      results.icons = iconChecks

      // Check if installable
      results.installable = results.https && 
                           results.serviceWorkerRegistered && 
                           results.manifestExists && 
                           results.manifestValid

      // Check if already installed
      results.isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                            window.navigator.standalone ||
                            document.referrer.includes('android-app://')

      // Check beforeinstallprompt support
      results.beforeInstallPromptSupported = 'onbeforeinstallprompt' in window

    } catch (error) {
      console.error('PWA check error:', error)
    }

    setChecks(results)
    setLoading(false)
  }

  useEffect(() => {
    if (isOpen) {
      runPWAChecks()
    }
  }, [isOpen])

  const CheckItem = ({ label, status, details }) => {
    const getIcon = () => {
      if (status === true) return <CheckCircle className="w-4 h-4 text-green-600" />
      if (status === false) return <XCircle className="w-4 h-4 text-red-600" />
      return <AlertCircle className="w-4 h-4 text-yellow-600" />
    }

    const getColor = () => {
      if (status === true) return 'text-green-800'
      if (status === false) return 'text-red-800'
      return 'text-yellow-800'
    }

    return (
      <div className="flex items-start gap-2 p-2 rounded bg-gray-50">
        {getIcon()}
        <div className="flex-1">
          <div className={`font-medium ${getColor()}`}>{label}</div>
          {details && <div className="text-sm text-gray-600">{details}</div>}
        </div>
      </div>
    )
  }

  // Only show in development or when explicitly enabled
  if (import.meta.env.PROD && !localStorage.getItem('pwa-debug')) {
    return null
  }

  return (
    <>
      {/* Debug Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
        title="PWA Debugger"
      >
        🔧
      </button>

      {/* Debug Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">PWA Debugger</h2>
              <div className="flex gap-2">
                <button
                  onClick={runPWAChecks}
                  disabled={loading}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
                <p>Running PWA checks...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Basic Requirements */}
                <div>
                  <h3 className="font-semibold mb-2">Basic Requirements</h3>
                  <div className="space-y-2">
                    <CheckItem
                      label="HTTPS or Localhost"
                      status={checks.https}
                      details={checks.https ? "✓ Secure context available" : "✗ PWA requires HTTPS in production"}
                    />
                    <CheckItem
                      label="Service Worker Support"
                      status={checks.serviceWorkerSupport}
                      details={checks.serviceWorkerSupport ? "✓ Browser supports service workers" : "✗ Browser doesn't support service workers"}
                    />
                    <CheckItem
                      label="Service Worker Registered"
                      status={checks.serviceWorkerRegistered}
                      details={checks.serviceWorkerRegistered ? "✓ Service worker is registered" : "✗ Service worker not registered"}
                    />
                    <CheckItem
                      label="Service Worker Active"
                      status={checks.serviceWorkerActive}
                      details={checks.serviceWorkerActive ? "✓ Service worker is active" : "✗ Service worker not active"}
                    />
                  </div>
                </div>

                {/* Manifest */}
                <div>
                  <h3 className="font-semibold mb-2">Web App Manifest</h3>
                  <div className="space-y-2">
                    <CheckItem
                      label="Manifest File"
                      status={checks.manifestExists}
                      details={checks.manifestExists ? "✓ manifest.json found" : "✗ manifest.json not found"}
                    />
                    <CheckItem
                      label="Manifest Valid"
                      status={checks.manifestValid}
                      details={checks.manifestValid ? "✓ Required fields present" : "✗ Missing required fields"}
                    />
                    <CheckItem
                      label="Manifest Icons"
                      status={checks.manifestIcons > 0}
                      details={`${checks.manifestIcons || 0} icons defined in manifest`}
                    />
                  </div>
                </div>

                {/* Icons */}
                <div>
                  <h3 className="font-semibold mb-2">App Icons</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {checks.icons?.map(({ size, exists }) => (
                      <CheckItem
                        key={size}
                        label={`${size}x${size}`}
                        status={exists}
                        details={exists ? "✓ Available" : "✗ Missing"}
                      />
                    ))}
                  </div>
                </div>

                {/* Install Status */}
                <div>
                  <h3 className="font-semibold mb-2">Installation Status</h3>
                  <div className="space-y-2">
                    <CheckItem
                      label="PWA Installable"
                      status={checks.installable}
                      details={checks.installable ? "✓ Meets PWA criteria" : "✗ Missing PWA requirements"}
                    />
                    <CheckItem
                      label="Install Prompt Support"
                      status={checks.beforeInstallPromptSupported}
                      details={checks.beforeInstallPromptSupported ? "✓ Browser supports install prompts" : "✗ Browser doesn't support install prompts"}
                    />
                    <CheckItem
                      label="Currently Installed"
                      status={checks.isStandalone}
                      details={checks.isStandalone ? "✓ Running as installed app" : "✗ Running in browser"}
                    />
                  </div>
                </div>

                {/* Troubleshooting */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 text-blue-800">Troubleshooting Tips</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Install prompts may not show if previously dismissed</li>
                    <li>• Clear browser data and reload to reset install prompt</li>
                    <li>• Check Chrome DevTools > Application > Manifest for errors</li>
                    <li>• iOS requires "Add to Home Screen" from Safari share menu</li>
                    <li>• Some browsers require user interaction before showing install prompt</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default PWADebugger
