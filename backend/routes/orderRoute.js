import express from 'express'
import { placeOrder, createPaypalOrder, capturepaypalorder, placeOrderPaypal, placeOrderStripe, allOrders, userOrders, updateStatus, verifyStripe, validatePayment, createPaymentIntent, createOrder, createCheckoutSession, verifyCheckoutSession } from "../controllers/orderController.js"
import adminAuth from '../middleware/adminAuth.js'
import authUser from '../middleware/auth.js'

const orderRouter = express.Router()

//admin features
orderRouter.post('/list', adminAuth, allOrders)
orderRouter.post('/status', adminAuth, updateStatus)
orderRouter.post('/payment', adminAuth, validatePayment);

//payment features
orderRouter.post('/place', authUser, placeOrder)
orderRouter.post('/stripe', authUser, placeOrderStripe)
orderRouter.post("/placestripe", authUser, placeOrderStripe)
orderRouter.post('/create-paypal-order', authUser, createPaypalOrder)
orderRouter.post('/:orderID/capture-paypal-order', authUser, capturepaypalorder)


orderRouter.post("/place-paypal", authUser, placeOrderPaypal); // New route for PayPal
orderRouter.post('/create-checkout-session', authUser, createCheckoutSession)
orderRouter.get('/verify-checkout-session', authUser, verifyCheckoutSession)

//user features
orderRouter.post('/userorders', authUser, userOrders)

//verify payment
    orderRouter.post('/verifyStripe', authUser, verifyStripe)

export default orderRouter