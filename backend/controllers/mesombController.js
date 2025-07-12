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

    // Format phone number for Cameroon
    let formattedNumber = phoneNumber
    if (!formattedNumber.startsWith('237') && !formattedNumber.startsWith('+237')) {
      formattedNumber = '237' + formattedNumber
    }
    formattedNumber = formattedNumber.replace('+', '')

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

    console.log('Making MeSomb payment request:', {
      amount,
      service,
      payer: formattedNumber,
      customer,
      products: products.length
    })

    // Make payment request to MeSomb
    const response = await client.makeCollect({
      amount: Math.round(amount),
      service: service,
      payer: formattedNumber,
      country: 'CM',
      currency: 'XAF',
      fees: false,
      customer,
      products
    })

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

export {
  processMobilePayment,
  verifyPayment,
  getSupportedServices
}
