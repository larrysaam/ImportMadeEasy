import React, { useState, useEffect } from 'react'
import { Eye, ExternalLink, Copy, Check } from 'lucide-react'

const ShareDebugger = ({ product, selectedColor, activeImage, currency }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [metaTags, setMetaTags] = useState({})
  const [shareUrl, setShareUrl] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!product) return

    // Generate current share URL
    const baseUrl = window.location.origin + window.location.pathname
    const params = new URLSearchParams()
    
    if (activeImage) {
      params.set('image', activeImage)
    }
    
    if (selectedColor?.colorName) {
      params.set('color', selectedColor.colorName)
    }
    
    const fullUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl
    setShareUrl(fullUrl)

    // Generate meta tags info
    const title = `${product.name} - ImportMadeEasy`
    const baseDescription = product.description || `${product.name} available for ${currency} ${product.price?.toLocaleString('fr-CM')}. Shop now at ImportMadeEasy!`
    const colorInfo = selectedColor ? ` Available in ${selectedColor.colorName}.` : ''
    const description = baseDescription + colorInfo
    
    let image = ''
    if (activeImage) {
      image = activeImage
    } else if (selectedColor && selectedColor.colorImages && selectedColor.colorImages.length > 0) {
      image = selectedColor.colorImages[0]
    } else if (product.image && product.image.length > 0) {
      image = product.image[0]
    }

    setMetaTags({
      title,
      description,
      image,
      url: fullUrl,
      price: `${currency} ${product.price?.toLocaleString('fr-CM')}`,
      color: selectedColor?.colorName || 'Multiple colors available'
    })
  }, [product, selectedColor, activeImage, currency])

  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const testPlatforms = [
    {
      name: 'Facebook Debugger',
      url: `https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(shareUrl)}`,
      description: 'Test how your link appears on Facebook'
    },
    {
      name: 'Twitter Card Validator',
      url: `https://cards-dev.twitter.com/validator`,
      description: 'Validate Twitter card (paste URL manually)'
    },
    {
      name: 'LinkedIn Inspector',
      url: `https://www.linkedin.com/post-inspector/inspect/${encodeURIComponent(shareUrl)}`,
      description: 'Test LinkedIn link preview'
    },
    {
      name: 'WhatsApp Preview',
      url: `https://wa.me/?text=${encodeURIComponent(shareUrl)}`,
      description: 'Test WhatsApp link preview'
    }
  ]

  if (!product) return null

  return (
    <div className="relative">
      {/* Debug Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
        title="Debug share preview"
      >
        <Eye className="w-3 h-3" />
        <span className="hidden sm:inline">Debug Share</span>
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-96 max-w-[90vw] bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[80vh] overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Share Preview Debug</h3>
              
              {/* Current Share URL */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-2">Share URL:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-md bg-gray-50"
                  />
                  <button
                    onClick={copyShareUrl}
                    className="p-2 text-gray-600 hover:text-gray-800"
                    title="Copy URL"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Meta Tags Preview */}
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-700 mb-2">Meta Tags Preview:</h4>
                <div className="space-y-2">
                  <div className="p-3 bg-gray-50 rounded-md">
                    <div className="text-xs font-medium text-gray-900 mb-1">Title:</div>
                    <div className="text-xs text-gray-700">{metaTags.title}</div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-md">
                    <div className="text-xs font-medium text-gray-900 mb-1">Description:</div>
                    <div className="text-xs text-gray-700">{metaTags.description}</div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-md">
                    <div className="text-xs font-medium text-gray-900 mb-1">Image:</div>
                    {metaTags.image ? (
                      <div className="space-y-2">
                        <img 
                          src={metaTags.image} 
                          alt="Preview" 
                          className="w-full h-32 object-cover rounded border"
                        />
                        <div className="text-xs text-gray-600 break-all">{metaTags.image}</div>
                      </div>
                    ) : (
                      <div className="text-xs text-red-600">No image available</div>
                    )}
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-md">
                    <div className="text-xs font-medium text-gray-900 mb-1">Price:</div>
                    <div className="text-xs text-gray-700">{metaTags.price}</div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-md">
                    <div className="text-xs font-medium text-gray-900 mb-1">Color:</div>
                    <div className="text-xs text-gray-700">{metaTags.color}</div>
                  </div>
                </div>
              </div>

              {/* Test Links */}
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-700 mb-2">Test Link Previews:</h4>
                <div className="space-y-2">
                  {testPlatforms.map((platform, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                      <div className="flex-1">
                        <div className="text-xs font-medium text-gray-900">{platform.name}</div>
                        <div className="text-xs text-gray-600">{platform.description}</div>
                      </div>
                      <a
                        href={platform.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title={`Test on ${platform.name}`}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded-md">
                <div className="font-medium text-blue-800 mb-1">How to test:</div>
                <ul className="space-y-1 text-blue-700">
                  <li>• Copy the share URL above</li>
                  <li>• Paste it in WhatsApp to see the preview</li>
                  <li>• Use the test links to validate on each platform</li>
                  <li>• The image shown should match the currently displayed product image</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ShareDebugger
