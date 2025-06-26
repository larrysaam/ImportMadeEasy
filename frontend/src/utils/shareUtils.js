// Share utilities for social media and messaging platforms

/**
 * Generate share URL for WhatsApp
 * @param {string} text - Text to share
 * @param {string} url - URL to share
 * @returns {string} WhatsApp share URL
 */
export const generateWhatsAppUrl = (text, url) => {
  const message = encodeURIComponent(`${text}\n\n${url}`)
  return `https://wa.me/?text=${message}`
}

/**
 * Generate share URL for Facebook
 * @param {string} url - URL to share
 * @param {string} quote - Quote text (optional)
 * @returns {string} Facebook share URL
 */
export const generateFacebookUrl = (url, quote = '') => {
  const params = new URLSearchParams({
    u: url,
    ...(quote && { quote })
  })
  return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`
}

/**
 * Generate share URL for Twitter
 * @param {string} text - Text to share
 * @param {string} url - URL to share
 * @returns {string} Twitter share URL
 */
export const generateTwitterUrl = (text, url) => {
  const params = new URLSearchParams({
    text: `${text} ${url}`
  })
  return `https://twitter.com/intent/tweet?${params.toString()}`
}

/**
 * Generate share URL for Telegram
 * @param {string} text - Text to share
 * @param {string} url - URL to share
 * @returns {string} Telegram share URL
 */
export const generateTelegramUrl = (text, url) => {
  const params = new URLSearchParams({
    url: url,
    text: text
  })
  return `https://t.me/share/url?${params.toString()}`
}

/**
 * Generate email share URL
 * @param {string} subject - Email subject
 * @param {string} body - Email body
 * @returns {string} Email share URL
 */
export const generateEmailUrl = (subject, body) => {
  const params = new URLSearchParams({
    subject,
    body
  })
  return `mailto:?${params.toString()}`
}

/**
 * Generate LinkedIn share URL
 * @param {string} url - URL to share
 * @param {string} title - Title of the content
 * @param {string} summary - Summary of the content
 * @returns {string} LinkedIn share URL
 */
export const generateLinkedInUrl = (url, title, summary) => {
  const params = new URLSearchParams({
    url,
    title,
    summary
  })
  return `https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`
}

/**
 * Generate Pinterest share URL
 * @param {string} url - URL to share
 * @param {string} media - Image URL
 * @param {string} description - Description
 * @returns {string} Pinterest share URL
 */
export const generatePinterestUrl = (url, media, description) => {
  const params = new URLSearchParams({
    url,
    media,
    description
  })
  return `https://pinterest.com/pin/create/button/?${params.toString()}`
}

/**
 * Generate Reddit share URL
 * @param {string} url - URL to share
 * @param {string} title - Title of the post
 * @returns {string} Reddit share URL
 */
export const generateRedditUrl = (url, title) => {
  const params = new URLSearchParams({
    url,
    title
  })
  return `https://reddit.com/submit?${params.toString()}`
}

/**
 * Format product share text
 * @param {Object} product - Product object
 * @param {string} currency - Currency symbol
 * @param {Object} selectedColor - Selected color object (optional)
 * @returns {string} Formatted share text
 */
export const formatProductShareText = (product, currency, selectedColor = null) => {
  let text = `Check out this amazing ${product.name}! 💫\n\n`
  text += `Price: ${currency} ${product.price?.toLocaleString('fr-CM')}\n`
  
  if (selectedColor) {
    text += `Color: ${selectedColor.colorName}\n`
  }
  
  if (product.description) {
    // Truncate description if too long
    const maxDescLength = 100
    const desc = product.description.length > maxDescLength 
      ? product.description.substring(0, maxDescLength) + '...'
      : product.description
    text += `\n${desc}\n`
  }
  
  text += '\nShop now at ImportMadeEasy! 🛍️'
  
  return text
}

/**
 * Format short product share text (for character-limited platforms)
 * @param {Object} product - Product object
 * @param {string} currency - Currency symbol
 * @returns {string} Short formatted share text
 */
export const formatShortProductShareText = (product, currency) => {
  return `${product.name} - ${currency} ${product.price?.toLocaleString('fr-CM')} at ImportMadeEasy`
}

/**
 * Check if Web Share API is supported
 * @returns {boolean} True if Web Share API is supported
 */
export const isWebShareSupported = () => {
  return 'share' in navigator
}

/**
 * Share using Web Share API (mobile native sharing)
 * @param {Object} shareData - Share data object
 * @returns {Promise} Promise that resolves when sharing is complete
 */
export const shareNative = async (shareData) => {
  if (!isWebShareSupported()) {
    throw new Error('Web Share API not supported')
  }
  
  try {
    await navigator.share(shareData)
    return { success: true }
  } catch (error) {
    if (error.name === 'AbortError') {
      return { success: false, reason: 'cancelled' }
    }
    throw error
  }
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Promise that resolves to true if successful
 */
export const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      // Fallback for older browsers or non-secure contexts
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      const result = document.execCommand('copy')
      document.body.removeChild(textArea)
      return result
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}

/**
 * Generate Open Graph meta tags for a product
 * @param {Object} product - Product object
 * @param {string} currency - Currency symbol
 * @param {string} activeImage - Current active image URL
 * @param {Object} selectedColor - Selected color object (optional)
 * @param {string} currentUrl - Current page URL
 * @returns {Object} Object containing meta tag data
 */
export const generateProductMetaTags = (product, currency, activeImage, selectedColor, currentUrl) => {
  const title = `${product.name} - ImportMadeEasy`
  const description = product.description || `${product.name} available for ${currency} ${product.price?.toLocaleString('fr-CM')}. Shop now at ImportMadeEasy!`
  const price = `${currency} ${product.price?.toLocaleString('fr-CM')}`
  
  return {
    title,
    description,
    image: activeImage || (product.image && product.image[0]) || '',
    url: currentUrl,
    price,
    currency: 'XAF',
    availability: 'in stock',
    condition: 'new',
    brand: 'ImportMadeEasy',
    category: product.category || 'Fashion',
    color: selectedColor?.colorName || 'Multiple colors available'
  }
}

/**
 * Track share event for analytics
 * @param {string} platform - Platform name (whatsapp, facebook, etc.)
 * @param {string} productId - Product ID
 * @param {string} productName - Product name
 */
export const trackShareEvent = (platform, productId, productName) => {
  // Google Analytics 4
  if (window.gtag) {
    window.gtag('event', 'share', {
      method: platform,
      content_type: 'product',
      item_id: productId,
      item_name: productName
    })
  }
  
  // Facebook Pixel
  if (window.fbq) {
    window.fbq('track', 'Share', {
      content_type: 'product',
      content_ids: [productId],
      content_name: productName
    })
  }
  
  // Custom analytics
  console.log(`Share tracked: ${platform} - ${productName} (${productId})`)
}
