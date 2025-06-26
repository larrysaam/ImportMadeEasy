import express from 'express'
import productModel from '../models/productModel.js'
import { generateProductMetaHTML, generateDefaultMetaHTML, generateProductMetaTags } from '../utils/metaTagGenerator.js'

const metaRouter = express.Router()

// Get the base URL from environment or use default
const getBaseUrl = (req) => {
  return process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`
}

// Route to serve meta tags for product pages
// This route should be called by social media crawlers
metaRouter.get('/product/:id', async (req, res) => {
  try {
    const { id } = req.params
    const baseUrl = getBaseUrl(req)
    const productUrl = `${baseUrl}/product/${id}`

    // Find the product in the database
    const product = await productModel.findById(id)

    if (!product) {
      // If product not found, redirect to 404 or homepage
      return res.redirect(`${baseUrl}/404`)
    }

    // Generate HTML with meta tags
    const metaHTML = generateProductMetaHTML(product, baseUrl, productUrl)

    // Set content type to HTML
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    
    // Send the HTML with meta tags
    res.send(metaHTML)

  } catch (error) {
    console.error('Error serving product meta tags:', error)
    
    // Fallback to homepage redirect
    const baseUrl = getBaseUrl(req)
    res.redirect(baseUrl)
  }
})

// Route to get meta tags as JSON (for API usage)
metaRouter.get('/api/product/:id/meta', async (req, res) => {
  try {
    const { id } = req.params
    const baseUrl = getBaseUrl(req)
    const productUrl = `${baseUrl}/product/${id}`

    // Find the product in the database
    const product = await productModel.findById(id)

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      })
    }

    // Generate meta tags object
    const metaTags = generateProductMetaTags(product, baseUrl, productUrl)

    res.json({
      success: true,
      metaTags
    })

  } catch (error) {
    console.error('Error getting product meta tags:', error)
    res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
})

// Route to serve default meta tags for homepage
metaRouter.get('/meta', (req, res) => {
  try {
    const baseUrl = getBaseUrl(req)
    const metaHTML = generateDefaultMetaHTML(baseUrl)

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.send(metaHTML)

  } catch (error) {
    console.error('Error serving default meta tags:', error)
    res.status(500).send('Server error')
  }
})

// Route to validate if a product exists (for link preview validation)
metaRouter.get('/validate/product/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const product = await productModel.findById(id).select('_id name price image')

    if (!product) {
      return res.status(404).json({
        success: false,
        exists: false
      })
    }

    res.json({
      success: true,
      exists: true,
      product: {
        id: product._id,
        name: product.name,
        price: product.price,
        image: product.image && product.image[0] ? product.image[0] : null
      }
    })

  } catch (error) {
    console.error('Error validating product:', error)
    res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
})

// Middleware to handle bot detection
const isBotRequest = (userAgent) => {
  const botPatterns = [
    /facebookexternalhit/i,
    /whatsapp/i,
    /twitterbot/i,
    /telegrambot/i,
    /linkedinbot/i,
    /slackbot/i,
    /discordbot/i,
    /googlebot/i,
    /bingbot/i,
    /yandexbot/i,
    /baiduspider/i,
    /applebot/i,
    /developers\.google\.com\/\+\/web\/snippet\//i
  ]
  
  return botPatterns.some(pattern => pattern.test(userAgent))
}

// Route to handle bot requests for product pages
// This should be integrated with your main app routing
metaRouter.get('/share/product/:id', async (req, res) => {
  try {
    const userAgent = req.get('User-Agent') || ''
    
    // If it's a bot/crawler, serve meta tags
    if (isBotRequest(userAgent)) {
      const { id } = req.params
      const baseUrl = getBaseUrl(req)
      const productUrl = `${baseUrl}/product/${id}`

      const product = await productModel.findById(id)

      if (!product) {
        return res.redirect(`${baseUrl}/404`)
      }

      const metaHTML = generateProductMetaHTML(product, baseUrl, productUrl)
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.send(metaHTML)
    } else {
      // For regular users, redirect to the actual product page
      const baseUrl = getBaseUrl(req)
      res.redirect(`${baseUrl}/product/${req.params.id}`)
    }

  } catch (error) {
    console.error('Error handling share request:', error)
    const baseUrl = getBaseUrl(req)
    res.redirect(baseUrl)
  }
})

export default metaRouter
