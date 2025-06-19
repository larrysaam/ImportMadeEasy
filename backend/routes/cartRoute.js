import express from 'express'
import { addToCart, updateCart, getUserCart, testCart, clearCart } from '../controllers/cartController.js'
import authUser from '../middleware/auth.js'

const cartRouter = express.Router()

cartRouter.get('/get', authUser, getUserCart)
cartRouter.post('/add', authUser, addToCart)
cartRouter.post('/update', authUser, updateCart)
cartRouter.post('/test', authUser, testCart)
cartRouter.post('/clear', authUser, clearCart)

export default cartRouter