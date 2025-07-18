import { useEffect } from 'react'

const MetaTags = ({ product, selectedColor, activeImage, currency }) => {
  useEffect(() => {
    if (!product) return

    // Get current URL
    const currentUrl = window.location.href
    
    // Prepare meta data
    const title = `${product.name} - ImportMadeEasy`
    const description = product.description || `${product.name} available for ${currency} ${product.price?.toLocaleString('fr-CM')}. Shop now at ImportMadeEasy!`
    const image = activeImage || (product.image && product.image[0]) || ''
    const price = `${currency} ${product.price?.toLocaleString('fr-CM')}`
    
    // Update document title
    document.title = title

    // Function to update or create meta tag
    const updateMetaTag = (property, content, isProperty = true) => {
      const attribute = isProperty ? 'property' : 'name'
      let meta = document.querySelector(`meta[${attribute}="${property}"]`)
      
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute(attribute, property)
        document.head.appendChild(meta)
      }
      
      meta.setAttribute('content', content)
    }

    // Basic meta tags
    updateMetaTag('description', description, false)
    updateMetaTag('keywords', `${product.name}, fashion, shopping, ImportMadeEasy, ${product.category}, ${product.subcategory}`, false)

    // Open Graph meta tags for Facebook, WhatsApp, etc.
    updateMetaTag('og:title', title)
    updateMetaTag('og:description', description)
    updateMetaTag('og:image', image)
    updateMetaTag('og:url', currentUrl)
    updateMetaTag('og:type', 'product')
    updateMetaTag('og:site_name', 'ImportMadeEasy')
    updateMetaTag('og:locale', 'en_US')

    // Product-specific Open Graph tags
    updateMetaTag('product:price:amount', product.price?.toString() || '0')
    updateMetaTag('product:price:currency', 'XAF') // Central African CFA franc
    updateMetaTag('product:availability', 'in stock')
    updateMetaTag('product:condition', 'new')
    updateMetaTag('product:brand', 'ImportMadeEasy')
    updateMetaTag('product:category', product.category || 'Fashion')

    // Twitter Card meta tags
    updateMetaTag('twitter:card', 'summary_large_image', false)
    updateMetaTag('twitter:title', title, false)
    updateMetaTag('twitter:description', description, false)
    updateMetaTag('twitter:image', image, false)
    updateMetaTag('twitter:site', '@ImportMadeEasy', false)

    // WhatsApp specific (uses Open Graph)
    updateMetaTag('og:image:width', '1200')
    updateMetaTag('og:image:height', '630')
    updateMetaTag('og:image:alt', `${product.name} - ${price}`)

    // Additional structured data for better rich snippets
    const structuredData = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": product.name,
      "image": image,
      "description": description,
      "brand": {
        "@type": "Brand",
        "name": "ImportMadeEasy"
      },
      "offers": {
        "@type": "Offer",
        "url": currentUrl,
        "priceCurrency": "XAF",
        "price": product.price,
        "availability": "https://schema.org/InStock",
        "seller": {
          "@type": "Organization",
          "name": "ImportMadeEasy"
        }
      },
      "category": product.category,
      "color": selectedColor?.colorName || 'Multiple colors available'
    }

    // Update or create structured data script
    let structuredDataScript = document.querySelector('script[type="application/ld+json"]')
    if (!structuredDataScript) {
      structuredDataScript = document.createElement('script')
      structuredDataScript.type = 'application/ld+json'
      document.head.appendChild(structuredDataScript)
    }
    structuredDataScript.textContent = JSON.stringify(structuredData)

    // Cleanup function to remove meta tags when component unmounts
    return () => {
      // Note: We don't remove meta tags on cleanup as they should persist
      // for the page until a new product is loaded
    }
  }, [product, selectedColor, activeImage, currency])

  // This component doesn't render anything
  return null
}

export default MetaTags
