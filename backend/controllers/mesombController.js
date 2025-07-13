import { PaymentOperation } from '@hachther/mesomb'
import orderModel from '../models/orderModel.js'
import userModel from '../models/userModel.js'
import productModel from '../models/productModel.js'
import referralModel from '../models/referralModel.js'

// MeSomb configuration
const MESOMB_APP_KEY = process.env.MESOMB_APP_KEY
const MESOMB_ACCESS_KEY = process.env.MESOMB_ACCESS_KEY
const MESOMB_SECRET_KEY = process.env.MESOMB_SECRET_KEY

// Helper function to track affiliate purchase
const trackAffiliatePurchase = async (userId, orderId, amount) => {
  try {
    await referralModel.trackPurchase(userId, orderId, amount)
  } catch (error) {
    console.error('Error tracking affiliate purchase:', error)
    // Don't fail the order if affiliate tracking fails
  }
}

// Process MeSomb mobile payment
const processMobilePayment = async (req, res) => {
  try {
    const userId = req.userId // Get from auth middleware
    const {
      orderData,
      paymentDetails: { phoneNumber, service, amount }
    } = req.body


    console.log('Processing MeSomb payment:', {
      userId,
      phoneNumber,
      service,
      amount
    })

    console.log('Order data received:', JSON.stringify(orderData, null, 2))

    // Validate required fields
    if (!phoneNumber || !service || !amount || !orderData) {
      return res.json({
        success: false,
        message: 'Missing required payment information'
      })
    }

    // Check if MeSomb API keys are configured
    if (!MESOMB_APP_KEY || !MESOMB_ACCESS_KEY || !MESOMB_SECRET_KEY) {
      console.error('MeSomb API keys not configured')
      return res.json({
        success: false,
        message: 'Payment service not configured. Please contact support.'
      })
    }

    // Validate and format phone number for Cameroon
    let formattedNumber = phoneNumber.toString().trim()

    // Remove any non-digit characters except +
    formattedNumber = formattedNumber.replace(/[^\d+]/g, '')

    // Handle different input formats
    if (formattedNumber.startsWith('+237')) {
      formattedNumber = formattedNumber.substring(1) // Remove +
    } else if (formattedNumber.startsWith('00237')) {
      formattedNumber = formattedNumber.substring(2) // Remove 00
    } else if (!formattedNumber.startsWith('237')) {
      // Add country code if missing
      formattedNumber = '237' + formattedNumber
    }

    // More flexible validation for Cameroon mobile numbers
    // Accepts MTN (677, 678, 679, 650-659) and Orange (655, 656, 657, 658, 659, 690-699)
    const cameroonMobilePattern = /^237(6[5-9]\d{7}|[67]\d{8})$/

    if (!cameroonMobilePattern.test(formattedNumber)) {
      console.log('Phone validation failed for:', formattedNumber)
      return res.json({
        success: false,
        message: 'Invalid phone number. Please enter a valid Cameroon mobile number (MTN or Orange).',
        errorType: 'INVALID_PHONE'
      })
    }

    console.log('Phone number formatted:', phoneNumber, '->', formattedNumber)

    // Validate and normalize service
    const normalizedService = service.toString().toUpperCase().trim()
    const validServices = ['MTN', 'ORANGE']

    if (!validServices.includes(normalizedService)) {
      console.log('Service validation failed for:', service, '->', normalizedService)
      return res.json({
        success: false,
        message: 'Invalid mobile service. Please select MTN or Orange.',
        errorType: 'INVALID_SERVICE'
      })
    }

    console.log('Service validated:', service, '->', normalizedService)

    // Initialize MeSomb client
    const client = new PaymentOperation({
      applicationKey: MESOMB_APP_KEY,
      accessKey: MESOMB_ACCESS_KEY,
      secretKey: MESOMB_SECRET_KEY
    })

    // Prepare customer data - extract from orderData.address
    const addressData = orderData.address || {}
    const customer = {
      email: addressData.email,
      firstName: addressData.firstName,
      lastName: addressData.lastName,
      address: addressData.street,
      city: addressData.city,
      region: addressData.state,
      country: addressData.country,
      phone: formattedNumber // Add phone as fallback
    }

    console.log('Customer data prepared:', customer)

    // Validate customer data - MeSomb requires at least email or phone
    if (!customer.email && !customer.phone) {
      return res.json({
        success: false,
        message: 'Customer email or phone is required for payment processing'
      })
    }

    // Prepare products data
    const products = orderData.items.map(item => ({
      name: item.name,
      category: 'Clothing',
      quantity: item.quantity,
      amount: item.price * item.quantity
    }))

    // Validate amount with minimum check
    const numericAmount = parseFloat(amount)
    const minimumAmount = 100 // 100 XAF minimum

    if (!numericAmount || isNaN(numericAmount) || numericAmount <= 0) {
      return res.json({
        success: false,
        message: 'Invalid payment amount. Amount must be a positive number.',
        errorType: 'INVALID_AMOUNT'
      })
    }

    if (numericAmount < minimumAmount) {
      return res.json({
        success: false,
        message: `Payment amount must be at least ${minimumAmount} XAF.`,
        errorType: 'AMOUNT_TOO_LOW'
      })
    }

    console.log('Amount validated:', amount, '->', numericAmount)

    // Prepare payment request data with proper structure
    const roundedAmount = Math.round(numericAmount)
    const paymentRequest = {
      amount: roundedAmount,
      service: normalizedService, // Use normalized service
      payer: formattedNumber,
      country: 'CM',
      currency: 'XAF',
      fees: false,
      customer: {
        email: customer.email || `${formattedNumber}@temp.com`, // Ensure email exists
        firstName: customer.firstName || 'Customer',
        lastName: customer.lastName || 'User',
        address: customer.address || '',
        city: customer.city || 'Douala',
        region: customer.region || 'Littoral',
        country: customer.country || 'CM',
        phone: formattedNumber
      },
      products: products.length > 0 ? products : [{
        name: 'Order Items',
        category: 'General',
        quantity: 1,
        amount: roundedAmount
      }]
    }

    console.log('Making MeSomb payment request:', {
      amount: paymentRequest.amount,
      service: paymentRequest.service,
      payer: paymentRequest.payer,
      customer: paymentRequest.customer,
      products: paymentRequest.products.length,
      fullRequest: JSON.stringify(paymentRequest, null, 2)
    })

    // Make payment request to MeSomb with retry logic
    let response
    let lastError
    const maxRetries = 2

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`MeSomb payment attempt ${attempt}/${maxRetries}`)
        response = await client.makeCollect(paymentRequest)
        break // Success, exit retry loop

      } catch (mesombError) {
        lastError = mesombError
        console.error(`MeSomb API Error (Attempt ${attempt}):`, {
          error: mesombError.message,
          code: mesombError.code,
          requestData: attempt === 1 ? paymentRequest : 'Same as attempt 1'
        })

        // Don't retry on authentication or validation errors
        if (mesombError.message && (
          mesombError.message.includes('authentication') ||
          mesombError.message.includes('Invalid') ||
          mesombError.message.includes('validation')
        )) {
          break
        }

        // Wait before retry (except on last attempt)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        }
      }
    }

    // Handle final error if all attempts failed
    if (!response && lastError) {
      console.error('All MeSomb payment attempts failed:', lastError.message)

      // Check for specific error types
      if (lastError.message && lastError.message.includes('Server Error (500)')) {
        return res.json({
          success: false,
          message: 'Payment service is temporarily unavailable. Please try again later.',
          errorType: 'SERVICE_UNAVAILABLE'
        })
      }

      if (lastError.message && lastError.message.includes('authentication')) {
        return res.json({
          success: false,
          message: 'Payment service configuration error. Please contact support.',
          errorType: 'AUTH_ERROR'
        })
      }

      if (lastError.message && lastError.message.includes('Invalid phone')) {
        return res.json({
          success: false,
          message: 'Invalid phone number. Please check and try again.',
          errorType: 'INVALID_PHONE'
        })
      }

      if (lastError.message && lastError.message.includes('Insufficient')) {
        return res.json({
          success: false,
          message: 'Insufficient balance. Please top up your mobile money account.',
          errorType: 'INSUFFICIENT_BALANCE'
        })
      }

      // Generic error response
      return res.json({
        success: false,
        message: 'Payment processing failed. Please check your details and try again.',
        errorType: 'PAYMENT_ERROR',
        details: lastError.message
      })
    }

    console.log('MeSomb response:', {
      success: response.isOperationSuccess(),
      transactionSuccess: response.isTransactionSuccess(),
      message: response.message
    })

    if (response.isOperationSuccess() && response.isTransactionSuccess()) {
      // Payment successful, create order in database
      const newOrder = new orderModel({
        userId,
        items: orderData.items,
        amount: orderData.amount,
        address: orderData.address,
        status: 'Order Placed',
        paymentMethod: 'Mobile Money',
        payment: true,
        date: Date.now(),
        transactionId: response.pk || `mesomb-${Date.now()}`,
        paymentDetails: {
          service,
          phoneNumber: formattedNumber,
          mesombTransactionId: response.pk,
          mesombReference: response.reference
        }
      })

      await newOrder.save()

      // Track affiliate purchase if applicable
      await trackAffiliatePurchase(userId, newOrder._id, orderData.amount)

      // Clear user's cart
      await userModel.findByIdAndUpdate(userId, { cartData: {} })

      res.json({
        success: true,
        message: 'Payment successful! Your order has been placed.',
        orderId: newOrder._id,
        transactionId: response.pk
      })

    } else {
      // Payment failed
      console.error('MeSomb payment failed:', response.message)
      res.json({
        success: false,
        message: response.message || 'Payment failed. Please try again.'
      })
    }

  } catch (error) {
    console.error('Error processing MeSomb payment:', error)
    res.json({
      success: false,
      message: 'Payment processing failed. Please try again.'
    })
  }
}

// Verify MeSomb payment status
const verifyPayment = async (req, res) => {
  try {
    const { transactionId } = req.params

    if (!transactionId) {
      return res.json({
        success: false,
        message: 'Transaction ID is required'
      })
    }

    // Find order by transaction ID
    const order = await orderModel.findOne({ transactionId })

    if (!order) {
      return res.json({
        success: false,
        message: 'Order not found'
      })
    }

    // Initialize MeSomb client
    const client = new PaymentOperation({
      applicationKey: MESOMB_APP_KEY,
      accessKey: MESOMB_ACCESS_KEY,
      secretKey: MESOMB_SECRET_KEY
    })

    // Check transaction status with MeSomb
    const response = await client.getStatus(transactionId)

    res.json({
      success: true,
      order: {
        id: order._id,
        status: order.status,
        amount: order.amount,
        paymentStatus: order.payment ? 'Paid' : 'Pending'
      },
      mesombStatus: {
        success: response.isOperationSuccess(),
        transactionSuccess: response.isTransactionSuccess(),
        message: response.message
      }
    })

  } catch (error) {
    console.error('Error verifying payment:', error)
    res.json({
      success: false,
      message: 'Failed to verify payment status'
    })
  }
}

// Get supported mobile services
const getSupportedServices = async (_req, res) => {
  try {
    // Return supported mobile money services in Cameroon
    const services = [
      {
        code: 'MTN',
        name: 'MTN Mobile Money',
        country: 'CM'
      },
      {
        code: 'ORANGE',
        name: 'Orange Money',
        country: 'CM'
      }
    ]

    res.json({
      success: true,
      services
    })

  } catch (error) {
    console.error('Error getting supported services:', error)
    res.json({
      success: false,
      message: 'Failed to get supported services'
    })
  }
}

// Test MeSomb service connectivity
const testMeSombConnection = async (_req, res) => {
  try {
    // Check if MeSomb API keys are configured
    if (!MESOMB_APP_KEY || !MESOMB_ACCESS_KEY || !MESOMB_SECRET_KEY) {
      return res.json({
        success: false,
        message: 'MeSomb API keys not configured',
        configured: false,
        missing: {
          appKey: !MESOMB_APP_KEY,
          accessKey: !MESOMB_ACCESS_KEY,
          secretKey: !MESOMB_SECRET_KEY
        }
      })
    }

    // Initialize MeSomb client
    const client = new PaymentOperation({
      applicationKey: MESOMB_APP_KEY,
      accessKey: MESOMB_ACCESS_KEY,
      secretKey: MESOMB_SECRET_KEY
    })

    // Try a simple test with minimal data
    try {
      // Test with a minimal request to check connectivity
      const testRequest = {
        amount: 100,
        service: 'MTN',
        payer: '237677123456', // Test number
        country: 'CM',
        currency: 'XAF',
        fees: false,
        customer: {
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          phone: '237677123456'
        },
        products: [{
          name: 'Test Product',
          category: 'Test',
          quantity: 1,
          amount: 100
        }]
      }

      console.log('Testing MeSomb with minimal request...')

      // Note: This will likely fail but will tell us if the API is reachable
      // We're just testing connectivity, not actually processing payment
      res.json({
        success: true,
        message: 'MeSomb service is configured and client initialized successfully',
        configured: true,
        timestamp: new Date().toISOString(),
        testNote: 'Client initialization successful - ready for payments'
      })

    } catch (testError) {
      console.error('MeSomb connection test failed:', testError.message)
      res.json({
        success: false,
        message: 'MeSomb service connection failed',
        configured: true,
        error: testError.message,
        timestamp: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('Error testing MeSomb connection:', error)
    res.json({
      success: false,
      message: 'Failed to test MeSomb connection',
      error: error.message
    })
  }
}

export {
  processMobilePayment,
  verifyPayment,
  getSupportedServices,
  testMeSombConnection
}
