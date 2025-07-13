import express from 'express'
import {
  processMobilePayment,
  verifyPayment,
  getSupportedServices,
  testMeSombConnection
} from '../controllers/mesombController.js'
import authUser from '../middleware/auth.js'

const mesombRouter = express.Router()

// Process mobile payment (requires authentication)
mesombRouter.post('/payment/mobile', authUser, processMobilePayment)

// Verify payment status
mesombRouter.get('/payment/verify/:transactionId', authUser, verifyPayment)

// Get supported mobile services (public)
mesombRouter.get('/services', getSupportedServices)

// Test MeSomb connection (public)
mesombRouter.get('/test', testMeSombConnection)

export default mesombRouter
