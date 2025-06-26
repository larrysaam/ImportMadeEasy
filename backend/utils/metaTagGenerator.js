// Meta tag generator for social sharing
// This utility generates HTML with proper Open Graph meta tags for product pages

/**
 * Generate HTML with Open Graph meta tags for a product
 * @param {Object} product - Product object from database
 * @param {string} baseUrl - Base URL of the application
 * @param {string} productUrl - Full URL of the product page
 * @param {string} activeImage - Currently active/displayed image URL (optional)
 * @param {string} selectedColor - Selected color name (optional)
 * @returns {string} HTML string with meta tags
 */
const generateProductMetaHTML = (product, baseUrl, productUrl, activeImage = null, selectedColor = null) => {
  const title = `${product.name} - ImportMadeEasy`
  const baseDescription = product.description || `${product.name} available for FCFA ${product.price?.toLocaleString('fr-CM')}. Shop now at ImportMadeEasy!`
  const colorInfo = selectedColor ? ` Available in ${selectedColor}.` : ''
  const description = baseDescription + colorInfo

  // Prioritize activeImage for link previews
  let image = ''
  if (activeImage) {
    image = activeImage
  } else if (product.image && product.image[0]) {
    image = product.image[0]
  } else {
    image = `${baseUrl}/default-product-image.jpg`
  }

  const price = product.price || 0
  const imageAlt = `${product.name}${selectedColor ? ` in ${selectedColor}` : ''} - FCFA ${price.toLocaleString('fr-CM')}`
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Basic Meta Tags -->
    <title>${title}</title>
    <meta name="description" content="${description}">
    <meta name="keywords" content="${product.name}, fashion, shopping, ImportMadeEasy, ${product.category}, ${product.subcategory}">
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${image}">
    <meta property="og:url" content="${productUrl}">
    <meta property="og:type" content="product">
    <meta property="og:site_name" content="ImportMadeEasy">
    <meta property="og:locale" content="en_US">
    
    <!-- Product-specific Open Graph -->
    <meta property="product:price:amount" content="${price}">
    <meta property="product:price:currency" content="XAF">
    <meta property="product:availability" content="in stock">
    <meta property="product:condition" content="new">
    <meta property="product:brand" content="ImportMadeEasy">
    <meta property="product:category" content="${product.category || 'Fashion'}">
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${image}">
    <meta name="twitter:site" content="@ImportMadeEasy">
    
    <!-- WhatsApp specific -->
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${imageAlt}">
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:image:secure_url" content="${image}">
    
    <!-- Structured Data for Rich Snippets -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": "${product.name}",
      "image": "${image}",
      "description": "${description}",
      "brand": {
        "@type": "Brand",
        "name": "ImportMadeEasy"
      },
      "offers": {
        "@type": "Offer",
        "url": "${productUrl}",
        "priceCurrency": "XAF",
        "price": "${price}",
        "availability": "https://schema.org/InStock",
        "seller": {
          "@type": "Organization",
          "name": "ImportMadeEasy"
        }
      },
      "category": "${product.category || 'Fashion'}",
      "color": "${selectedColor || 'Multiple colors available'}"
    }
    </script>
    
    <!-- Redirect to main app -->
    <script>
      // Redirect to main app after a short delay to allow crawlers to read meta tags
      setTimeout(function() {
        window.location.href = '${productUrl}';
      }, 1000);
    </script>
    
    <!-- Immediate redirect for users (crawlers ignore this) -->
    <meta http-equiv="refresh" content="0; url=${productUrl}">
</head>
<body>
    <!-- Fallback content for crawlers and users with JS disabled -->
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center;">
        <img src="${image}" alt="${imageAlt}" style="max-width: 300px; height: auto; border-radius: 8px; margin-bottom: 20px;">
        <h1 style="color: #333; margin-bottom: 10px;">${product.name}</h1>
        ${selectedColor ? `<p style="color: #777; font-size: 14px; margin-bottom: 10px;">Color: ${selectedColor}</p>` : ''}
        <p style="color: #666; font-size: 18px; margin-bottom: 20px;">FCFA ${price.toLocaleString('fr-CM')}</p>
        <p style="color: #888; margin-bottom: 30px;">${description}</p>
        <a href="${productUrl}" style="background: #e14512; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            View Product
        </a>
        <p style="color: #999; font-size: 14px; margin-top: 30px;">
            If you're not redirected automatically, <a href="${productUrl}">click here</a>.
        </p>
    </div>
</body>
</html>
  `.trim()
}

/**
 * Generate meta tags object for API responses
 * @param {Object} product - Product object from database
 * @param {string} baseUrl - Base URL of the application
 * @param {string} productUrl - Full URL of the product page
 * @returns {Object} Meta tags object
 */
const generateProductMetaTags = (product, baseUrl, productUrl) => {
  const title = `${product.name} - ImportMadeEasy`
  const description = product.description || `${product.name} available for FCFA ${product.price?.toLocaleString('fr-CM')}. Shop now at ImportMadeEasy!`
  const image = product.image && product.image[0] ? product.image[0] : `${baseUrl}/default-product-image.jpg`
  
  return {
    title,
    description,
    image,
    url: productUrl,
    type: 'product',
    siteName: 'ImportMadeEasy',
    price: product.price,
    currency: 'XAF',
    availability: 'in stock',
    condition: 'new',
    brand: 'ImportMadeEasy',
    category: product.category || 'Fashion'
  }
}

/**
 * Generate default meta tags for the homepage
 * @param {string} baseUrl - Base URL of the application
 * @returns {string} HTML string with meta tags
 */
const generateDefaultMetaHTML = (baseUrl) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Basic Meta Tags -->
    <title>ImportMadeEasy - Your Premier Fashion Destination in Cameroon</title>
    <meta name="description" content="Discover the latest fashion trends at ImportMadeEasy. Shop quality clothing, accessories, and more with fast delivery across Cameroon.">
    <meta name="keywords" content="fashion, clothing, shopping, Cameroon, ImportMadeEasy, style, trends">
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="ImportMadeEasy - Your Premier Fashion Destination">
    <meta property="og:description" content="Discover the latest fashion trends at ImportMadeEasy. Shop quality clothing, accessories, and more with fast delivery across Cameroon.">
    <meta property="og:image" content="${baseUrl}/og-default-image.jpg">
    <meta property="og:url" content="${baseUrl}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="ImportMadeEasy">
    <meta property="og:locale" content="en_US">
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="ImportMadeEasy - Your Premier Fashion Destination">
    <meta name="twitter:description" content="Discover the latest fashion trends at ImportMadeEasy. Shop quality clothing, accessories, and more.">
    <meta name="twitter:image" content="${baseUrl}/og-default-image.jpg">
    <meta name="twitter:site" content="@ImportMadeEasy">
    
    <!-- Redirect to main app -->
    <meta http-equiv="refresh" content="0; url=${baseUrl}">
</head>
<body>
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center;">
        <h1 style="color: #333;">ImportMadeEasy</h1>
        <p style="color: #666;">Your Premier Fashion Destination in Cameroon</p>
        <a href="${baseUrl}" style="background: #e14512; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Shop Now
        </a>
    </div>
</body>
</html>
  `.trim()
}

export {
  generateProductMetaHTML,
  generateProductMetaTags,
  generateDefaultMetaHTML
}
