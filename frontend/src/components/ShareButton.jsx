import React, { useState, useEffect } from 'react'
import { Share2, Copy, Check, MessageCircle, Mail, Facebook, Twitter, Instagram, Link2 } from 'lucide-react'
import { toast } from 'react-toastify'
import {
  formatProductShareText,
  formatShortProductShareText,
  generateWhatsAppUrl,
  generateFacebookUrl,
  generateTwitterUrl,
  generateTelegramUrl,
  generateEmailUrl,
  shareNative,
  copyToClipboard,
  trackShareEvent
} from '@/utils/shareUtils'

const ShareButton = ({ product, selectedColor, activeImage, currency }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [shareUrl, setShareUrl] = useState('')

  useEffect(() => {
    // Get current page URL
    setShareUrl(window.location.href)
  }, [])

  // Generate share text using utilities
  const shareText = product ? formatProductShareText(product, currency, selectedColor) : ''
  const shareTextShort = product ? formatShortProductShareText(product, currency) : ''

  // Copy to clipboard using utility
  const handleCopyToClipboard = async () => {
    const fullText = `${shareText}\n\n${shareUrl}`
    const success = await copyToClipboard(fullText)

    if (success) {
      setCopied(true)
      toast.success('Link copied to clipboard!')
      trackShareEvent('copy_link', product?._id, product?.name)
      setTimeout(() => setCopied(false), 2000)
    } else {
      toast.error('Failed to copy link')
    }
  }

  // Share via Web Share API (mobile)
  const handleNativeShare = async () => {
    try {
      const result = await shareNative({
        title: product?.name,
        text: shareText,
        url: shareUrl,
      })

      if (result.success) {
        trackShareEvent('native_share', product?._id, product?.name)
      }
    } catch (err) {
      console.error('Error sharing:', err)
      // Fallback to copy
      handleCopyToClipboard()
    }
  }

  // WhatsApp share
  const shareWhatsApp = () => {
    const url = generateWhatsAppUrl(shareText, shareUrl)
    window.open(url, '_blank')
    trackShareEvent('whatsapp', product?._id, product?.name)
  }

  // Facebook share
  const shareFacebook = () => {
    const url = generateFacebookUrl(shareUrl, shareText)
    window.open(url, '_blank', 'width=600,height=400')
    trackShareEvent('facebook', product?._id, product?.name)
  }

  // Twitter share
  const shareTwitter = () => {
    const url = generateTwitterUrl(shareTextShort, shareUrl)
    window.open(url, '_blank', 'width=600,height=400')
    trackShareEvent('twitter', product?._id, product?.name)
  }

  // Email share
  const shareEmail = () => {
    const subject = `Check out this product: ${product?.name}`
    const body = `${shareText}\n\nView it here: ${shareUrl}`
    const url = generateEmailUrl(subject, body)
    window.open(url)
    trackShareEvent('email', product?._id, product?.name)
  }

  // Telegram share
  const shareTelegram = () => {
    const url = generateTelegramUrl(shareText, shareUrl)
    window.open(url, '_blank')
    trackShareEvent('telegram', product?._id, product?.name)
  }

  const shareOptions = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      action: shareWhatsApp,
      color: 'bg-green-500 hover:bg-green-600',
      textColor: 'text-white'
    },
    {
      name: 'Facebook',
      icon: Facebook,
      action: shareFacebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      textColor: 'text-white'
    },
    {
      name: 'Twitter',
      icon: Twitter,
      action: shareTwitter,
      color: 'bg-sky-500 hover:bg-sky-600',
      textColor: 'text-white'
    },
    {
      name: 'Telegram',
      icon: Link2,
      action: shareTelegram,
      color: 'bg-blue-500 hover:bg-blue-600',
      textColor: 'text-white'
    },
    {
      name: 'Email',
      icon: Mail,
      action: shareEmail,
      color: 'bg-gray-600 hover:bg-gray-700',
      textColor: 'text-white'
    },
    {
      name: copied ? 'Copied!' : 'Copy Link',
      icon: copied ? Check : Copy,
      action: handleCopyToClipboard,
      color: copied ? 'bg-green-500' : 'bg-gray-100 hover:bg-gray-200',
      textColor: copied ? 'text-white' : 'text-gray-700'
    }
  ]

  return (
    <div className="relative">
      {/* Share Button */}
      <button
        onClick={() => {
          // Use native share on mobile if available
          if (navigator.share && window.innerWidth <= 768) {
            handleNativeShare()
          } else {
            setIsOpen(!isOpen)
          }
        }}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        title="Share this product"
      >
        <Share2 className="w-4 h-4" />
        <span className="hidden sm:inline">Share</span>
      </button>

      {/* Share Options Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Share this product</h3>
              
              {/* Product Preview */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-4">
                <img 
                  src={activeImage} 
                  alt={product?.name}
                  className="w-12 h-12 object-cover rounded-md"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{product?.name}</p>
                  <p className="text-sm text-gray-600">{currency} {product?.price?.toLocaleString('fr-CM')}</p>
                  {selectedColor && (
                    <div className="flex items-center gap-1 mt-1">
                      <div 
                        className="w-3 h-3 rounded-full border border-gray-300" 
                        style={{ backgroundColor: selectedColor.colorHex }}
                      />
                      <span className="text-xs text-gray-500">{selectedColor.colorName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Share Options Grid */}
              <div className="grid grid-cols-2 gap-2">
                {shareOptions.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      option.action()
                      if (option.name !== 'Copy Link' && option.name !== 'Copied!') {
                        setIsOpen(false)
                      }
                    }}
                    className={`flex items-center gap-2 p-3 rounded-lg transition-colors ${option.color} ${option.textColor}`}
                  >
                    <option.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{option.name}</span>
                  </button>
                ))}
              </div>

              {/* URL Preview */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Share URL:</p>
                <p className="text-xs text-gray-700 break-all">{shareUrl}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ShareButton
